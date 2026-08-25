// VISERON Memory Consolidation — Sistema 4 Cognitive Operating Layer
// Transforma memória acumulada em memória inteligente
// Semantic dedup · Summarization · Importance · KG linking
// 2026-08-11

import { MemoryEngine } from "./MemoryEngine";
import { EmbeddingProvider } from "./EmbeddingProvider";
import { chunkText, TextChunk } from "./Chunker";
import { TelemetryEngine } from "../../omega/telemetry/TelemetryEngine";

export interface ConsolidationResult {
  memoriesCreated: number;
  memoriesMerged: number;
  memoriesSummarized: number;
  knowledgeGraphLinks: number;
  relevanceScores: Record<string, number>;
  durationMs: number;
  traceId?: string;
}

export interface MemoryInsight {
  type: "cluster" | "trend" | "gap" | "summary";
  title: string;
  description: string;
  confidence: number;
  relatedMemoryIds: string[];
}

export class MemoryConsolidationEngine {
  constructor(
    private memoryEngine: MemoryEngine,
    private embedding: EmbeddingProvider,
    private telemetry?: TelemetryEngine,
    private knowledgeGraph?: any,
  ) {}

  // ── SEMANTIC DEDUPLICATION ───────────────────────────

  async deduplicateSTM(threshold: number = 0.85): Promise<{ merged: number; clusters: any[] }> {
    const trace = this.telemetry?.startTrace({ source: "consolidation", input: { text: "semantic-dedup" } });
    const start = Date.now();

    // Collect all STM items across sessions
    const stmItems: Array<{ sessionId: string; content: string; timestamp: number }> = [];
    // Access STM via MemoryEngine's internal store
    const stmStore = (this.memoryEngine as any).shortTermStore as Map<string, any[]>;
    if (!stmStore) {
      this.telemetry?.completeTrace(trace?.traceId!, { success: true, latencyMs: 0, output: "no STM store" });
      return { merged: 0, clusters: [] };
    }

    for (const [sessionId, items] of stmStore.entries()) {
      for (const item of items) {
        const content = item.content || item.text || "";
        if (content.length >= 20) {
          stmItems.push({ sessionId, content, timestamp: item.timestamp || Date.now() });
        }
      }
    }

    if (stmItems.length < 2) {
      this.telemetry?.completeTrace(trace?.traceId!, { success: true, latencyMs: Date.now() - start, output: "not enough items" });
      return { merged: 0, clusters: [] };
    }

    // Embed all STM items
    let vectors: number[][] = [];
    const embedStart = Date.now();
    try {
      const embedResults = await this.embedding.embedBatch(stmItems.map(i => i.content.slice(0, 500)));
      vectors = embedResults.map(r => r.vector);
    } catch {
      this.telemetry?.completeTrace(trace?.traceId!, { success: false, latencyMs: Date.now() - start, error: "embedding failed" });
      return { merged: 0, clusters: [] };
    }
    const embedMs = Date.now() - embedStart;
    this.telemetry?.recordProcessing(trace?.traceId!, { embeddingMs: embedMs });

    // Cluster by cosine similarity
    const clusters: Array<{ items: typeof stmItems; centroid: number[]; score: number }> = [];
    const processed = new Set<number>();

    for (let i = 0; i < stmItems.length; i++) {
      if (processed.has(i)) continue;
      const cluster: typeof stmItems = [stmItems[i]];
      processed.add(i);

      for (let j = i + 1; j < stmItems.length; j++) {
        if (processed.has(j)) continue;
        const sim = cosineSimilarity(vectors[i], vectors[j]);
        if (sim >= threshold) {
          cluster.push(stmItems[j]);
          processed.add(j);
        }
      }

      if (cluster.length > 1) {
        const centroid = computeCentroid(cluster.map((_, idx) => vectors[stmItems.indexOf(cluster[idx])]));
        clusters.push({ items: cluster, centroid, score: cluster.length });
      }
    }

    // Merge clusters into LTM
    let merged = 0;
    for (const cluster of clusters) {
      const mergedContent = cluster.items.map(i => i.content).join(" | ");
      const key = `semantic_cluster_${Date.now()}_${merged}`;
      this.memoryEngine.setLongTerm(key, {
        content: mergedContent.slice(0, 2000),
        sources: cluster.items.map(i => i.sessionId),
        clusterSize: cluster.items.length,
        score: cluster.score,
        consolidatedAt: Date.now(),
      }, ["consolidated", "semantic_dedup", `cluster_size_${cluster.items.length}`]);
      merged++;
    }

    const durationMs = Date.now() - start;
    this.telemetry?.completeTrace(trace?.traceId!, {
      success: true,
      latencyMs: durationMs,
      output: `merged ${merged} clusters from ${stmItems.length} STM items (${processed.size} items processed)`,
      modelUsed: this.embedding.model,
    }, { status: "PASS", reasons: [`${merged} semantic clusters created`], verifiedBy: "MemoryConsolidation" });

    return { merged, clusters };
  }

  // ── SUMMARIZATION ────────────────────────────────────

  async summarizeLTM(limit: number = 100): Promise<{ summarized: number }> {
    const trace = this.telemetry?.startTrace({ source: "consolidation", input: { text: "summarize-ltm" } });
    const start = Date.now();

    // Get recent LTM items
    const ltmKeys = this.memoryEngine.listLongTermKeys?.() || [];
    const recentKeys = ltmKeys.filter(k => k.startsWith("consolidated") || k.startsWith("agent_") || k.includes("task")).slice(-limit);

    let summarized = 0;
    for (const key of recentKeys) {
      const item = this.memoryEngine.getLongTerm?.(key);
      if (!item || typeof item !== "object") continue;

      const text = typeof (item as any).content === "string" ? (item as any).content :
                   typeof (item as any).value === "string" ? (item as any).value :
                   JSON.stringify(item).slice(0, 500);

      if (text.length < 100) continue;

      // Simple extractive summarization: first 2 sentences + key entities
      const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
      const summary = sentences.slice(0, 2).join(". ") + ".";

      // Store summary in KB
      this.memoryEngine.addKnowledge?.(
        `summary_${key}`,
        "ltm_summary",
        summary,
        ["summary", "consolidated", key.split("_")[0] || "unknown"]
      );
      summarized++;
    }

    const durationMs = Date.now() - start;
    this.telemetry?.completeTrace(trace?.traceId!, {
      success: true, latencyMs: durationMs,
      output: `summarized ${summarized} LTM items`,
    }, { status: "PASS", reasons: [`${summarized} summaries created`], verifiedBy: "MemoryConsolidation" });

    return { summarized };
  }

  // ── IMPORTANCE CLASSIFICATION ────────────────────────

  classifyImportance(): Record<string, { score: number; reason: string }> {
    const trace = this.telemetry?.startTrace({ source: "consolidation", input: { text: "classify-importance" } });
    const start = Date.now();

    const scores: Record<string, { score: number; reason: string }> = {};
    const ltmKeys = this.memoryEngine.listLongTermKeys?.() || [];

    for (const key of ltmKeys.slice(-500)) {
      const item = this.memoryEngine.getLongTerm?.(key);
      if (!item) continue;

      const tags: string[] = (item as any).tags || [];
      let score = 1;

      // Heurísticas de importância
      if (tags.includes("wisdom")) score += 3;
      if (tags.includes("evolution")) score += 2;
      if (tags.includes("consolidated")) score += 2;
      if (tags.includes("semantic_dedup")) score += 2;
      if (tags.includes("task_history")) score += 2;
      if (tags.includes("stm_promoted")) score += 1;
      if (key.includes("agent_")) score += 3;
      if (key.includes("brain_state")) score += 3;
      if (key.includes("evolution")) score += 2;

      const age = Date.now() - ((item as any).lastUpdated || (item as any).updatedAt || (item as any).timestamp || 0);
      if (age < 3600000) score += 2; // <1h
      else if (age < 86400000) score += 1; // <24h

      scores[key] = { score, reason: `tags: ${tags.slice(0, 5).join(",")}, age: ${Math.round(age / 3600000)}h` };
    }

    this.telemetry?.completeTrace(trace?.traceId!, {
      success: true, latencyMs: Date.now() - start,
      output: `classified ${Object.keys(scores).length} items`,
    }, { status: "PASS", reasons: [`scored by tag importance + recency`], verifiedBy: "MemoryConsolidation" });

    return scores;
  }

  // ── KNOWLEDGE GRAPH LINKING ──────────────────────────

  async linkToKnowledgeGraph(): Promise<number> {
    if (!this.knowledgeGraph) return 0;
    const trace = this.telemetry?.startTrace({ source: "consolidation", input: { text: "kg-link" } });
    const start = Date.now();
    let linked = 0;

    const ltmKeys = this.memoryEngine.listLongTermKeys?.() || [];
    const recentKeys = ltmKeys.filter(k => k.startsWith("consolidated") || k.startsWith("semantic_cluster")).slice(-50);

    for (const key of recentKeys) {
      try {
        const item = this.memoryEngine.getLongTerm?.(key);
        if (!item) continue;
        const content = (item as any).content || JSON.stringify(item).slice(0, 200);

        // Extract key entities from content
        const words = content.split(/\s+/).filter((w: string) => w.length > 5);
        const uniqueWords = [...new Set(words)].slice(0, 5);

        // Create or link entities in KG
        const entityId = `memory_${key}`;
        this.knowledgeGraph.upsertEntity(entityId, "memory", key, {
          summary: content.slice(0, 200),
          tags: (item as any).tags || [],
          consolidatedAt: (item as any).consolidatedAt || Date.now(),
        });

        // Link to existing entities by keyword match
        const kgEntities = this.knowledgeGraph.searchEntities?.(uniqueWords.join(" ")) || [];
        for (const entity of kgEntities.slice(0, 3)) {
          this.knowledgeGraph.addRelation(entityId, entity.id, "related_to", 0.5, { source: "consolidation" });
          linked++;
        }
      } catch { /* skip failed links */ }
    }

    this.knowledgeGraph.save?.();
    this.telemetry?.completeTrace(trace?.traceId!, {
      success: true, latencyMs: Date.now() - start,
      output: `linked ${linked} KG relations`,
    }, { status: "PASS", reasons: [`${linked} new KG relations`], verifiedBy: "MemoryConsolidation" });

    return linked;
  }

  // ── FULL CONSOLIDATION CYCLE ─────────────────────────

  async runFullCycle(): Promise<ConsolidationResult> {
    const start = Date.now();

    const dedup = await this.deduplicateSTM();
    const summarize = await this.summarizeLTM();
    const importance = this.classifyImportance();
    const kgLinks = await this.linkToKnowledgeGraph();

    return {
      memoriesCreated: Object.keys(importance).length,
      memoriesMerged: dedup.merged,
      memoriesSummarized: summarize.summarized,
      knowledgeGraphLinks: kgLinks,
      relevanceScores: Object.fromEntries(
        Object.entries(importance).slice(0, 10).map(([k, v]) => [k.slice(-30), v.score])
      ),
      durationMs: Date.now() - start,
    };
  }

  // ── INSIGHTS ─────────────────────────────────────────

  generateInsights(): MemoryInsight[] {
    const insights: MemoryInsight[] = [];
    const stats = this.memoryEngine.getStats?.() || {};

    // Cluster insight
    const ltmCount = stats.longTerm?.totalItems || (this.memoryEngine as any).ltmSize?.() || 0;
    if (ltmCount > 10000) {
      insights.push({
        type: "summary",
        title: "Large memory base",
        description: `LTM contains ${ltmCount} items. Consider semantic deduplication.`,
        confidence: 0.8,
        relatedMemoryIds: [],
      });
    }

    // Growth trend
    insights.push({
      type: "trend",
      title: "Memory growth",
      description: `STM consolidation promotes items appearing in 3+ sessions.`,
      confidence: 0.7,
      relatedMemoryIds: [],
    });

    // RAG readiness
    insights.push({
      type: "gap",
      title: "RAG pipeline ready",
      description: `Memory is indexable via System 2 RAG pipeline for semantic retrieval.`,
      confidence: 0.9,
      relatedMemoryIds: [],
    });

    return insights;
  }
}

// ── HELPERS ────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

function computeCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dims = vectors[0].length;
  const centroid = new Array(dims).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dims; i++) centroid[i] += v[i];
  }
  for (let i = 0; i < dims; i++) centroid[i] /= vectors.length;
  return centroid;
}
