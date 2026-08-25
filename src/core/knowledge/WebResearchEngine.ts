// VISERON S9 — Autonomous Knowledge Acquisition Phase 1
// WebResearchEngine + KnowledgeQualityGate
// 2026-08-11

import { WebFetcher, SourceRegistry, KnowledgeSource, DocumentIngestor } from "./KnowledgeIngestion";
import { MemoryEngine } from "../memory/MemoryEngine";
import { EmbeddingProvider } from "../memory/EmbeddingProvider";
import { chunkText } from "../memory/Chunker";
import { TelemetryEngine } from "../../omega/telemetry/TelemetryEngine";

// ── QUALITY GATE ───────────────────────────────────────

export type QualityDecision = "ACCEPT" | "REVIEW" | "REJECT";

export interface QualityResult {
  source: KnowledgeSource;
  decision: QualityDecision;
  reason: string;
  score: number;
  checks: Array<{ check: string; passed: boolean; detail: string }>;
}

export class KnowledgeQualityGate {
  evaluate(source: KnowledgeSource, query?: string): QualityResult {
    const checks: QualityResult["checks"] = [];
    let score = 0;

    // Content length check
    checks.push({ check: "content_length", passed: source.textLength > 100, detail: `${source.textLength} bytes` });
    if (source.textLength > 100) score += 0.2;

    // Status check
    checks.push({ check: "ingestion_status", passed: source.status !== "failed", detail: source.status });
    if (source.status !== "failed") score += 0.15;

    // Source type trust
    const sourceTypeTrust: Record<string, number> = { repository: 0.2, document: 0.15, file: 0.1, url: 0.1, api: 0.1, skill: 0.05 };
    const typeTrust = sourceTypeTrust[source.sourceType] || 0.05;
    score += typeTrust;
    checks.push({ check: "source_type", passed: typeTrust >= 0.1, detail: `${source.sourceType} (trust: ${typeTrust.toFixed(2)})` });

    // Freshness
    const ageMs = Date.now() - source.retrievedAt;
    const fresh = ageMs < 86400000;
    checks.push({ check: "freshness", passed: fresh, detail: `${Math.round(ageMs / 3600000)}h old` });
    if (fresh) score += 0.1;

    // Has title/author (provenance)
    const hasTitle = !!source.title;
    const hasMeta = !!(source.metadata && Object.keys(source.metadata).length > 0);
    checks.push({ check: "provenance", passed: hasTitle || hasMeta, detail: `title:${hasTitle} metadata:${hasMeta}` });
    if (hasTitle) score += 0.1;
    if (hasMeta) score += 0.05;

    // Relevance (if query provided)
    if (query) {
      const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
      const sourceText = (source.title || "") + " " + (source.metadata ? JSON.stringify(source.metadata) : "");
      const matches = queryTerms.filter(t => sourceText.toLowerCase().includes(t)).length;
      const relevance = queryTerms.length > 0 ? matches / queryTerms.length : 0;
      checks.push({ check: "relevance", passed: relevance > 0.2, detail: `${matches}/${queryTerms.length} terms` });
      if (relevance > 0.5) score += 0.2;
      else if (relevance > 0.2) score += 0.1;
    } else {
      score += 0.1;
      checks.push({ check: "relevance", passed: true, detail: "no query — default" });
    }

    let decision: QualityDecision;
    if (score >= 0.5) decision = "ACCEPT";
    else if (score >= 0.3) decision = "REVIEW";
    else decision = "REJECT";

    const reason = decision === "ACCEPT" ? `score ${score.toFixed(2)} meets threshold` :
                   decision === "REVIEW" ? `score ${score.toFixed(2)} needs review` :
                   `score ${score.toFixed(2)} below minimum`;

    return { source, decision, reason, score, checks };
  }
}

// ── WEB RESEARCH ENGINE ────────────────────────────────

export interface ResearchSource {
  url: string;
  source?: KnowledgeSource;
  quality?: QualityResult;
  chunks?: number;
  error?: string;
}

export interface ResearchResult {
  researchId: string;
  query: string;
  sources: ResearchSource[];
  acceptedSources: number;
  rejectedSources: number;
  totalChunks: number;
  confidence: number;
  latencyMs: number;
  traceId?: string;
}

export class WebResearchEngine {
  private fetcher: WebFetcher;
  private registry: SourceRegistry;
  private ingestor: DocumentIngestor;
  private qualityGate: KnowledgeQualityGate;

  constructor(
    private dataDir: string,
    private memoryEngine?: MemoryEngine,
    private embedding?: EmbeddingProvider,
    private telemetry?: TelemetryEngine,
  ) {
    this.fetcher = new WebFetcher();
    this.registry = new SourceRegistry(dataDir);
    this.ingestor = new DocumentIngestor(this.registry);
    this.qualityGate = new KnowledgeQualityGate();
  }

  async research(query: string, urls: string[]): Promise<ResearchResult> {
    const start = Date.now();
    const researchId = `research_${Date.now().toString(36)}`;
    const trace = this.telemetry?.startTrace({ source: "research" as any, input: { text: query } });

    const sources: ResearchSource[] = [];
    let totalChunks = 0;
    let accepted = 0;
    let rejected = 0;

    for (const url of urls.slice(0, 10)) {
      const rs: ResearchSource = { url };

      // Fetch
      const fetchResult = await this.fetcher.fetch(url);
      if (fetchResult.error || fetchResult.textLength < 100) {
        rs.error = fetchResult.error || "content too short";
        sources.push(rs);
        rejected++;
        continue;
      }

      // Register source
      const source = this.registry.register({
        sourceId: `web_${fetchResult.contentHash.slice(0, 12)}`,
        sourceType: "url",
        uri: url,
        title: fetchResult.title || url,
        retrievedAt: fetchResult.retrievedAt,
        contentHash: fetchResult.contentHash,
        contentType: fetchResult.contentType,
        textLength: fetchResult.textLength,
        status: "ingested",
        metadata: { statusCode: fetchResult.statusCode },
      });

      // Quality gate
      const quality = this.qualityGate.evaluate(source, query);
      rs.source = source;
      rs.quality = quality;

      if (quality.decision === "REJECT") {
        rs.error = quality.reason;
        sources.push(rs);
        rejected++;
        continue;
      }

      // Chunk + index
      if (this.memoryEngine) {
        const chunks = chunkText(fetchResult.text.slice(0, 50000), { chunkSize: 512, overlap: 128, source: source.sourceId });
        rs.chunks = chunks.length;
        totalChunks += chunks.length;

        for (const chunk of chunks) {
          this.memoryEngine.setLongTerm(`s9_research_${chunk.id}`, {
            content: chunk.text, source: source.sourceId, url, query,
          }, ["s9-research", source.sourceId]);

          this.memoryEngine.addKnowledge(`s9_research_kb_${chunk.id}`, "web_research", chunk.text, ["s9-research", source.sourceId]);
        }

        // Embed first chunk
        if (this.embedding && chunks.length > 0) {
          try {
            const embResult = await this.embedding.embed(chunks[0].text.slice(0, 500));
            await this.memoryEngine.storeVector(embResult.vector, { sourceId: source.sourceId, url, query, researchId });
            source.status = "embedded";
          } catch {}
        }
      }

      source.status = "indexed";
      accepted++;
      sources.push(rs);
    }

    const totalMs = Date.now() - start;
    const confidence = accepted / Math.max(1, accepted + rejected);

    this.telemetry?.completeTrace(trace?.traceId!, {
      success: accepted > 0,
      output: `${accepted} accepted, ${rejected} rejected, ${totalChunks} chunks`,
      latencyMs: totalMs,
      sources: urls,
      modelUsed: this.embedding?.model || "none",
    }, {
      status: accepted > 0 ? "PASS" : "FAIL",
      reasons: [`${accepted} accepted, ${rejected} rejected`],
      verifiedBy: "WebResearchEngine",
    }, { newKnowledgeGenerated: accepted > 0 });

    return { researchId, query, sources, acceptedSources: accepted, rejectedSources: rejected, totalChunks, confidence, latencyMs: totalMs, traceId: trace?.traceId };
  }

  getSourceRegistry(): SourceRegistry { return this.registry; }
}
