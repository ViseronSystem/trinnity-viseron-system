// VISERON RAG Pipeline — Sistema 2 Cognitive Operating Layer
// Retriever: hybrid search (vector + keyword) across MemoryEngine
// 2026-08-11

import { TextChunk } from "./Chunker";

export interface RetrievalResult {
  chunk: TextChunk;
  vectorScore: number;
  keywordScore: number;
  combinedScore: number;
}

export class HybridRetriever {
  constructor(
    private memoryEngine: any, // MemoryEngine instance
    private embeddingProvider: any, // EmbeddingProvider instance
  ) {}

  async retrieve(
    query: string,
    options: { topK?: number; vectorWeight?: number; keywordWeight?: number } = {}
  ): Promise<RetrievalResult[]> {
    const topK = options.topK || 10;
    const vw = options.vectorWeight ?? 0.6;
    const kw = options.keywordWeight ?? 0.4;

    // Vector retrieval (via MemoryEngine)
    let vectorResults: Array<{ id: string; score: number; payload: any }> = [];
    try {
      const embedResult = await this.embeddingProvider.embed(query);
      const vectorItems = await this.memoryEngine.queryVector(embedResult.vector, topK * 2);
      vectorResults = vectorItems.map((item: any) => ({
        id: item.id,
        score: item.score || 0,
        payload: item.payload || {},
      }));
    } catch { /* vector retrieval failed — continue with keyword only */ }

    // Keyword retrieval (via MemoryEngine unifiedSearch)
    let keywordResults: Array<{ id: string; score: number; content: string }> = [];
    try {
      if (typeof this.memoryEngine.unifiedSearch === "function") {
        const unified = await this.memoryEngine.unifiedSearch(query, { maxResults: topK * 2 });
        keywordResults = (unified || []).map((r: any) => ({
          id: r.id || r.title || "?",
          score: r.score || 0,
          content: r.content || r.title || "",
        }));
      } else {
        // Fallback: search LTM
        const ltmResults = this.memoryEngine.searchLongTerm?.(query) || [];
        keywordResults = ltmResults.map((r: any) => ({
          id: r.key || r.id,
          score: 0.5,
          content: typeof r.value === "string" ? r.value : JSON.stringify(r.value).slice(0, 200),
        }));
      }
    } catch { /* keyword retrieval failed */ }

    // Combine scores
    const combined = new Map<string, RetrievalResult>();

    for (const vr of vectorResults) {
      const chunk: TextChunk = {
        id: vr.id,
        text: vr.payload?.text || vr.payload?.content || "",
        index: vr.payload?.index || 0,
        source: vr.payload?.source,
      };
      combined.set(vr.id, {
        chunk,
        vectorScore: vr.score,
        keywordScore: 0,
        combinedScore: vr.score * vw,
      });
    }

    for (const kr of keywordResults) {
      const existing = combined.get(kr.id);
      const chunk: TextChunk = {
        id: kr.id,
        text: kr.content || "",
        index: 0,
      };
      if (existing) {
        existing.keywordScore = kr.score;
        existing.combinedScore = existing.vectorScore * vw + kr.score * kw;
      } else {
        combined.set(kr.id, {
          chunk,
          vectorScore: 0,
          keywordScore: kr.score,
          combinedScore: kr.score * kw,
        });
      }
    }

    return Array.from(combined.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topK);
  }
}
