// VISERON RAG Pipeline — Sistema 2 Cognitive Operating Layer
// Orquestrador: chunk → embed → retrieve → rerank → context → (generate)
// 2026-08-11

import { chunkText, TextChunk } from "./Chunker";
import { HybridRetriever, RetrievalResult } from "./Retriever";
import { rerankResults } from "./Reranker";
import { TelemetryEngine } from "../../omega/telemetry/TelemetryEngine";

export interface RAGQueryResult {
  query: string;
  chunks: RetrievalResult[];
  context: string;
  sources: string[];
  metrics: {
    totalChunks: number;
    retrievedChunks: number;
    rerankedChunks: number;
    topScore: number;
    embeddingMs: number;
    retrievalMs: number;
    rerankMs: number;
    totalMs: number;
  };
  traceId?: string;
}

export class RAGPipeline {
  constructor(
    private memoryEngine: any,
    private embeddingProvider: any,
    private telemetry?: TelemetryEngine,
    private knowledgeGraph?: any,
  ) {}

  async query(
    queryText: string,
    options: {
      topK?: number;
      agentId?: string;
      sessionId?: string;
      includeKnowledgeGraph?: boolean;
    } = {}
  ): Promise<RAGQueryResult> {
    const startTotal = Date.now();
    const topK = options.topK || 10;

    // Telemetry
    const trace = this.telemetry?.startTrace({
      source: "rag",
      agentId: options.agentId,
      sessionId: options.sessionId,
      input: { text: queryText, embeddingsModel: this.embeddingProvider?.model },
    });

    // Step 1: Chunk (if needed — for now, search existing memory)
    // MemoryEngine already stores chunks; we retrieve, not chunk
    const embedStart = Date.now();

    // Step 2: Embed query
    let embedResult: any = null;
    try {
      embedResult = await this.embeddingProvider.embed(queryText);
    } catch {
      // Fallback: use hash-based embedding from provider's fallback
      embedResult = { vector: new Array(384).fill(0), dimensions: 384, model: "fallback", latencyMs: 0 };
    }
    const embeddingMs = Date.now() - embedStart;
    this.telemetry?.recordProcessing(trace?.traceId!, { embeddingMs });

    // Step 3: Retrieve (hybrid: vector + keyword + optional KG)
    const retriever = new HybridRetriever(this.memoryEngine, this.embeddingProvider);
    const retrievalStart = Date.now();
    let results = await retriever.retrieve(queryText, { topK });
    const retrievalMs = Date.now() - retrievalStart;
    this.telemetry?.recordProcessing(trace?.traceId!, { retrievalMs, retrievedChunks: results.length, topScore: results[0]?.combinedScore });

    // Step 4: KnowledgeGraph augmentation
    if (options.includeKnowledgeGraph && this.knowledgeGraph) {
      try {
        const kgEntities = this.knowledgeGraph.searchEntities(queryText);
        for (const entity of (kgEntities || []).slice(0, 3)) {
          const neighbors = this.knowledgeGraph.getNeighbors(entity.id);
          const neighborText = (neighbors || []).map((n: any) => n.name || n.id).join(", ");
          results.push({
            chunk: {
              id: `kg_${entity.id}`,
              text: `Knowledge Graph entity: ${entity.name || entity.id} (${entity.type}). Related: ${neighborText}`,
              index: results.length,
              source: "knowledge-graph",
            },
            vectorScore: 1,
            keywordScore: 1,
            combinedScore: 1,
          });
        }
      } catch { /* KG augmentation failed */ }
    }

    // Step 5: Rerank
    const rerankStart = Date.now();
    const reranked = rerankResults(results, queryText, { topN: 5 });
    const rerankMs = Date.now() - rerankStart;
    this.telemetry?.recordProcessing(trace?.traceId!, { rerankMs });

    // Step 6: Build context
    const context = reranked
      .map((r, i) => `[Document ${i + 1}] (source: ${r.chunk.source || "memory"}, score: ${r.combinedScore.toFixed(2)})\n${r.chunk.text}`)
      .join("\n\n");
    const sources = reranked.map((r) => r.chunk.source || `chunk_${r.chunk.id}`).filter((s, i, a) => a.indexOf(s) === i);

    const totalMs = Date.now() - startTotal;

    // Complete telemetry
    this.telemetry?.completeTrace(
      trace?.traceId!,
      {
        success: true,
        output: context.slice(0, 500),
        sources,
        modelUsed: embedResult?.model,
        latencyMs: totalMs,
      },
      { status: "PASS", reasons: [`retrieved ${reranked.length} chunks from ${results.length} candidates`], verifiedBy: "RAGPipeline" }
    );

    return {
      query: queryText,
      chunks: reranked,
      context,
      sources,
      metrics: {
        totalChunks: results.length,
        retrievedChunks: results.length,
        rerankedChunks: reranked.length,
        topScore: reranked[0]?.combinedScore || 0,
        embeddingMs,
        retrievalMs,
        rerankMs,
        totalMs,
      },
      traceId: trace?.traceId,
    };
  }
}
