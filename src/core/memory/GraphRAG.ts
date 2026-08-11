// VISERON GraphRAG — Sistema 5 Cognitive Operating Layer
// Hybrid search: KnowledgeGraph traversal + vector similarity
// Entity extraction · Relation scoring · Context merge
// 2026-08-11

import { EmbeddingProvider } from "./EmbeddingProvider";
import { TelemetryEngine } from "../../omega/telemetry/TelemetryEngine";
import { HybridRetriever } from "./Retriever";

export interface GraphEntity {
  id: string;
  type: string;
  name: string;
  properties?: Record<string, any>;
  relevanceScore: number;
  relationCount: number;
}

export interface GraphPath {
  from: string;
  to: string;
  type: string;
  weight: number;
  nodes: string[];
}

export interface GraphRAGResult {
  query: string;
  entities: GraphEntity[];
  paths: GraphPath[];
  vectorContext: string;
  graphContext: string;
  mergedContext: string;
  metrics: {
    entitiesFound: number;
    pathsFound: number;
    vectorResults: number;
    entityExtractionMs: number;
    traversalMs: number;
    vectorMs: number;
    totalMs: number;
  };
  traceId?: string;
}

export class GraphRAGEngine {
  constructor(
    private knowledgeGraph: any, // KnowledgeGraph instance
    private embedding: EmbeddingProvider,
    private telemetry?: TelemetryEngine,
    private memoryEngine?: any,
  ) {}

  async query(
    queryText: string,
    options: { maxEntities?: number; maxDepth?: number; topK?: number; agentId?: string } = {}
  ): Promise<GraphRAGResult> {
    const startTotal = Date.now();
    const maxDepth = options.maxDepth || 2;
    const maxEntities = options.maxEntities || 10;

    const trace = this.telemetry?.startTrace({
      source: "graphrag",
      agentId: options.agentId,
      input: { text: queryText },
    });

    // Step 1: Extract query entities (keyword match against KG)
    const extractStart = Date.now();
    const queryTerms = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    let kgMatches: any[] = [];

    try {
      kgMatches = this.knowledgeGraph.searchEntities?.(queryText) || [];
      // Also try individual terms
      for (const term of queryTerms) {
        const termMatches = this.knowledgeGraph.searchEntities?.(term) || [];
        for (const m of termMatches) {
          if (!kgMatches.find((e: any) => e.id === m.id)) {
            kgMatches.push(m);
          }
        }
      }
    } catch { /* KG search may not be available */ }
    const extractMs = Date.now() - extractStart;
    this.telemetry?.recordProcessing(trace?.traceId!, { embeddingMs: extractMs });

    // Step 2: Graph traversal — expand neighbors
    const traversalStart = Date.now();
    const expandedEntities = new Map<string, GraphEntity>();
    const discoveredPaths: GraphPath[] = [];

    for (const entity of kgMatches.slice(0, maxEntities)) {
      // Add the matched entity
      if (!expandedEntities.has(entity.id)) {
        expandedEntities.set(entity.id, {
          id: entity.id,
          type: entity.type || "unknown",
          name: entity.name || entity.id,
          properties: entity.properties,
          relevanceScore: 1.0,
          relationCount: 0,
        });
      }

      // BFS traversal
      let frontier = [entity.id];
      const visited = new Set<string>([entity.id]);

      for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
        const nextFrontier: string[] = [];

        for (const nodeId of frontier) {
          let neighbors: any[] = [];
          try {
            neighbors = this.knowledgeGraph.getNeighbors?.(nodeId) || [];
          } catch { continue; }

          for (const neighbor of neighbors) {
            const neighborId = neighbor.id || neighbor;
            const relType = neighbor.type || neighbor.relationType || "related_to";
            const weight = neighbor.weight || 1;

            discoveredPaths.push({
              from: nodeId,
              to: neighborId,
              type: relType,
              weight,
              nodes: [nodeId, neighborId],
            });

            if (!visited.has(neighborId)) {
              visited.add(neighborId);
              nextFrontier.push(neighborId);

              const score = 1.0 / (depth + 2); // decay with depth
              if (!expandedEntities.has(neighborId)) {
                expandedEntities.set(neighborId, {
                  id: neighborId,
                  type: neighbor.type || neighbor.entityType || "unknown",
                  name: neighbor.name || neighborId,
                  relevanceScore: score,
                  relationCount: 1,
                });
              } else {
                const existing = expandedEntities.get(neighborId)!;
                existing.relevanceScore = Math.max(existing.relevanceScore, score);
                existing.relationCount++;
              }
            }
          }
        }
        frontier = nextFrontier;
      }
    }
    const traversalMs = Date.now() - traversalStart;
    this.telemetry?.recordProcessing(trace?.traceId!, { graphNodesVisited: visited.size });

    // Step 3: Vector retrieval (via RAG/retriever)
    const vectorStart = Date.now();
    let vectorContext = "";
    let vectorResults = 0;
    if (this.memoryEngine && this.embedding) {
      try {
        const retriever = new HybridRetriever(this.memoryEngine, this.embedding);
        const results = await retriever.retrieve(queryText, { topK: options.topK || 5 });
        vectorResults = results.length;
        vectorContext = results
          .map((r, i) => `[Vector ${i + 1}] ${r.chunk.text.slice(0, 300)}`)
          .join("\n\n");
      } catch { /* vector retrieval failed */ }
    }
    const vectorMs = Date.now() - vectorStart;
    this.telemetry?.recordProcessing(trace?.traceId!, { retrievalMs: vectorMs, retrievedChunks: vectorResults });

    // Step 4: Build graph context
    const sortedEntities = Array.from(expandedEntities.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxEntities + 10);

    const graphContext = [
      `Knowledge Graph: ${expandedEntities.size} entities, ${discoveredPaths.length} relations`,
      "",
      "Top entities:",
      ...sortedEntities.slice(0, 10).map(e =>
        `  ${e.name} (${e.type}) — score: ${e.relevanceScore.toFixed(2)}, relations: ${e.relationCount}`
      ),
      "",
      "Key relations:",
      ...discoveredPaths.slice(0, 10).map(p =>
        `  ${p.from.slice(-30)} → ${p.type} → ${p.to.slice(-30)} (w: ${p.weight})`
      ),
    ].join("\n");

    // Step 5: Merge contexts
    const mergedContext = [
      "=== GRAPH CONTEXT ===",
      graphContext,
      vectorContext ? "\n=== VECTOR CONTEXT ===" : "",
      vectorContext,
    ].filter(Boolean).join("\n");

    const totalMs = Date.now() - startTotal;

    this.telemetry?.completeTrace(trace?.traceId!, {
      success: true,
      output: mergedContext.slice(0, 500),
      sources: sortedEntities.slice(0, 5).map(e => e.id),
      modelUsed: this.embedding?.model,
      latencyMs: totalMs,
    }, {
      status: "PASS",
      reasons: [`${expandedEntities.size} entities, ${discoveredPaths.length} paths, ${vectorResults} vector results`],
      verifiedBy: "GraphRAGEngine",
    });

    return {
      query: queryText,
      entities: sortedEntities,
      paths: discoveredPaths.slice(0, 20),
      vectorContext,
      graphContext,
      mergedContext,
      metrics: {
        entitiesFound: expandedEntities.size,
        pathsFound: discoveredPaths.length,
        vectorResults,
        entityExtractionMs: extractMs,
        traversalMs,
        vectorMs,
        totalMs,
      },
      traceId: trace?.traceId,
    };
  }

  // Get entity detail
  getEntityDetail(entityId: string): { entity: any; neighbors: any[] } | null {
    try {
      const entity = this.knowledgeGraph.getEntity?.(entityId);
      if (!entity) return null;
      const neighbors = this.knowledgeGraph.getNeighbors?.(entityId) || [];
      return { entity, neighbors };
    } catch {
      return null;
    }
  }

  // Status
  status(): { entities: number; relations: number; available: boolean } {
    try {
      const stats = this.knowledgeGraph.getStats?.();
      return {
        entities: stats?.entities || 0,
        relations: stats?.relations || 0,
        available: true,
      };
    } catch {
      return { entities: 0, relations: 0, available: false };
    }
  }
}
