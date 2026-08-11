// VISERON RAG Pipeline — Sistema 2 Cognitive Operating Layer
// Reranker: re-rank retrieval results by relevance
// 2026-08-11

import { RetrievalResult } from "./Retriever";

export function rerankResults(
  results: RetrievalResult[],
  query: string,
  options: { topN?: number; diversityFactor?: number } = {}
): RetrievalResult[] {
  const topN = options.topN || 5;
  const diversityFactor = options.diversityFactor || 0.7;

  // Boost by query term overlap (simple BM25-inspired relevance)
  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const scored = results.map((r) => {
    let termOverlap = 0;
    const text = r.chunk.text.toLowerCase();
    for (const term of queryTerms) {
      if (text.includes(term)) termOverlap++;
    }
    const relevanceBoost = queryTerms.length > 0 ? termOverlap / queryTerms.length : 0;
    const finalScore = r.combinedScore * (1 + relevanceBoost * 0.5);
    return { ...r, combinedScore: finalScore, _termOverlap: termOverlap };
  });

  // Sort by final score
  scored.sort((a, b) => b.combinedScore - a.combinedScore);

  // Diversity filter: penalize chunks that are too similar to already-selected ones
  const selected: RetrievalResult[] = [];
  for (const r of scored) {
    if (selected.length >= topN) break;
    const tooSimilar = selected.some((s) => {
      const overlap = jaccardSimilarity(r.chunk.text, s.chunk.text);
      return overlap > (1 - diversityFactor);
    });
    if (!tooSimilar || selected.length === 0) {
      selected.push(r);
    }
  }

  return selected;
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / (union.size || 1);
}
