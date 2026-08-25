// VISERON Cognitive Telemetry Engine
// Sistema 0 — Cognitive Operating Layer · 2026-08-11
// Regista toda atividade cognitiva com rastreabilidade completa.

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { CognitiveTrace, CognitiveTraceInput, CognitiveTraceProcessing, CognitiveTraceResult, CognitiveTraceValidation, CognitiveTraceLearning, createTraceId } from "./CognitiveTrace";

export interface TelemetryStats {
  totalTraces: number;
  bySource: Record<string, number>;
  avgLatencyMs: number;
  avgEmbeddingMs: number;
  avgRetrievalMs: number;
  successRate: number;
  topQueries: string[];
  tokensConsumed: number;
}

export interface TelemetryInsights {
  latencyTrend: "improving" | "stable" | "degrading";
  successRateTrend: "improving" | "stable" | "degrading";
  topFailingSource: string;
  mostExpensiveOperation: string;
}

export class TelemetryEngine {
  private logPath: string;
  private archivePath: string;
  private traces: Map<string, CognitiveTrace> = new Map();

  constructor(private dataDir: string) {
    const d = path.resolve(dataDir);
    this.logPath = path.join(d, "knowledge", "cognitive-telemetry.jsonl");
    this.archivePath = path.join(d, "archive", "cognitive");
    if (!fs.existsSync(path.dirname(this.logPath))) {
      fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
    }
    if (!fs.existsSync(this.archivePath)) {
      fs.mkdirSync(this.archivePath, { recursive: true });
    }
    this.load();
  }

  // ── CAPTURE ──────────────────────────────────────────

  startTrace(params: {
    source: CognitiveTrace["source"];
    agentId?: string;
    sessionId?: string;
    parentTraceId?: string;
    input: CognitiveTraceInput;
  }): CognitiveTrace {
    const trace: CognitiveTrace = {
      traceId: createTraceId(),
      parentTraceId: params.parentTraceId,
      timestamp: Date.now(),
      source: params.source,
      agentId: params.agentId,
      sessionId: params.sessionId,
      input: params.input,
      processing: {},
      result: { success: false, latencyMs: 0 },
    };
    this.traces.set(trace.traceId, trace);
    return trace;
  }

  recordProcessing(traceId: string, processing: Partial<CognitiveTraceProcessing>): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;
    Object.assign(trace.processing, processing);
  }

  completeTrace(traceId: string, result: CognitiveTraceResult, validation?: CognitiveTraceValidation, learning?: CognitiveTraceLearning): CognitiveTrace {
    const trace = this.traces.get(traceId);
    if (!trace) throw new Error(`Trace ${traceId} not found`);
    trace.result = result;
    if (validation) trace.validation = validation;
    if (learning) trace.learning = learning;
    this.persist(trace);
    this.archive(trace);
    return trace;
  }

  failTrace(traceId: string, error: string, partialResult?: Partial<CognitiveTraceResult>): CognitiveTrace {
    const trace = this.traces.get(traceId);
    if (!trace) throw new Error(`Trace ${traceId} not found`);
    trace.result = {
      success: false,
      error,
      latencyMs: partialResult?.latencyMs ?? Date.now() - trace.timestamp,
      modelUsed: partialResult?.modelUsed,
    };
    this.persist(trace);
    this.archive(trace);
    return trace;
  }

  // ── PERSISTENCE ──────────────────────────────────────

  private persist(trace: CognitiveTrace): void {
    try {
      const line = JSON.stringify({
        traceId: trace.traceId,
        parentTraceId: trace.parentTraceId,
        timestamp: trace.timestamp,
        source: trace.source,
        agentId: trace.agentId,
        sessionId: trace.sessionId,
        input: trace.input,
        processing: trace.processing,
        result: trace.result,
        validation: trace.validation,
        learning: trace.learning,
      });
      fs.appendFileSync(this.logPath, line + "\n");
    } catch { /* non-blocking */ }
  }

  private archive(trace: CognitiveTrace): void {
    try {
      const hash = crypto.createHash("sha256").update(JSON.stringify(trace)).digest("hex");
      const record = {
        traceId: trace.traceId,
        hash,
        source: trace.source,
        agentId: trace.agentId,
        timestamp: new Date(trace.timestamp).toISOString(),
        success: trace.result.success,
        latencyMs: trace.result.latencyMs,
      };
      const archiveFile = path.join(this.archivePath, `${trace.traceId}.json`);
      fs.writeFileSync(archiveFile, JSON.stringify({ ...trace, archiveHash: hash }, null, 2));
      const indexFile = path.join(this.archivePath, "index.json");
      let index: any[] = [];
      if (fs.existsSync(indexFile)) {
        try { index = JSON.parse(fs.readFileSync(indexFile, "utf8")); } catch {}
      }
      index.push(record);
      fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
    } catch { /* non-blocking */ }
  }

  private load(): void {
    try {
      if (fs.existsSync(this.logPath)) {
        const lines = fs.readFileSync(this.logPath, "utf8").trim().split("\n").filter(Boolean);
        for (const line of lines.slice(-1000)) {
          try {
            const t = JSON.parse(line);
            if (t.traceId) this.traces.set(t.traceId, t as CognitiveTrace);
          } catch {}
        }
      }
    } catch { /* non-blocking */ }
  }

  // ── QUERY ────────────────────────────────────────────

  getTrace(traceId: string): CognitiveTrace | null {
    return this.traces.get(traceId) ?? null;
  }

  searchTraces(params: {
    agentId?: string;
    source?: string;
    since?: string;
    limit?: number;
  }): CognitiveTrace[] {
    let results = Array.from(this.traces.values());
    if (params.agentId) results = results.filter((t) => t.agentId === params.agentId);
    if (params.source) results = results.filter((t) => t.source === params.source);
    if (params.since) {
      const sinceTs = new Date(params.since).getTime();
      results = results.filter((t) => t.timestamp >= sinceTs);
    }
    results.sort((a, b) => b.timestamp - a.timestamp);
    return results.slice(0, params.limit || 50);
  }

  getStats(since?: string): TelemetryStats {
    const traces = since ? this.searchTraces({ since }) : Array.from(this.traces.values());
    const completed = traces.filter((t) => t.result.success !== undefined);
    const successful = completed.filter((t) => t.result.success);

    const bySource: Record<string, number> = {};
    let totalLatency = 0;
    let totalEmbedding = 0;
    let embeddingCount = 0;
    let totalRetrieval = 0;
    let retrievalCount = 0;
    let totalTokens = 0;
    const queryCounts: Record<string, number> = {};

    for (const t of completed) {
      bySource[t.source] = (bySource[t.source] || 0) + 1;
      totalLatency += t.result.latencyMs || 0;
      totalTokens += t.result.tokensUsed || 0;
      if (t.processing.embeddingMs) { totalEmbedding += t.processing.embeddingMs; embeddingCount++; }
      if (t.processing.retrievalMs) { totalRetrieval += t.processing.retrievalMs; retrievalCount++; }
      if (t.input.text) {
        const q = t.input.text.slice(0, 50);
        queryCounts[q] = (queryCounts[q] || 0) + 1;
      }
    }

    const topQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([q]) => q);

    return {
      totalTraces: traces.length,
      bySource,
      avgLatencyMs: completed.length ? Math.round(totalLatency / completed.length) : 0,
      avgEmbeddingMs: embeddingCount ? Math.round(totalEmbedding / embeddingCount) : 0,
      avgRetrievalMs: retrievalCount ? Math.round(totalRetrieval / retrievalCount) : 0,
      successRate: completed.length ? Math.round((successful.length / completed.length) * 100) / 100 : 0,
      topQueries,
      tokensConsumed: totalTokens,
    };
  }

  getInsights(since?: string): TelemetryInsights {
    const traces = since ? this.searchTraces({ since }) : Array.from(this.traces.values());
    const completed = traces.filter((t) => t.result.success !== undefined);

    // Success rate trend: compare first half vs second half
    const half = Math.floor(completed.length / 2) || 1;
    const firstHalf = completed.slice(0, half);
    const secondHalf = completed.slice(half);
    const firstSR = firstHalf.length ? firstHalf.filter((t) => t.result.success).length / firstHalf.length : 1;
    const secondSR = secondHalf.length ? secondHalf.filter((t) => t.result.success).length / secondHalf.length : 1;
    const srDelta = secondSR - firstSR;
    const successRateTrend: TelemetryInsights["successRateTrend"] =
      srDelta > 0.05 ? "improving" : srDelta < -0.05 ? "degrading" : "stable";

    // Latency trend
    const firstAvg = firstHalf.length ? firstHalf.reduce((s, t) => s + (t.result.latencyMs || 0), 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length ? secondHalf.reduce((s, t) => s + (t.result.latencyMs || 0), 0) / secondHalf.length : 0;
    const latencyDelta = secondAvg - firstAvg;
    const latencyTrend: TelemetryInsights["latencyTrend"] =
      latencyDelta < -firstAvg * 0.1 ? "improving" : latencyDelta > firstAvg * 0.1 ? "degrading" : "stable";

    // Most expensive and failing sources
    const sourceLatency: Record<string, { total: number; count: number }> = {};
    const sourceFails: Record<string, number> = {};
    for (const t of completed) {
      if (!sourceLatency[t.source]) sourceLatency[t.source] = { total: 0, count: 0 };
      sourceLatency[t.source].total += t.result.latencyMs || 0;
      sourceLatency[t.source].count++;
      if (!t.result.success) sourceFails[t.source] = (sourceFails[t.source] || 0) + 1;
    }
    let maxAvg = 0, mostExpensive = "unknown";
    for (const [s, v] of Object.entries(sourceLatency)) {
      const avg = v.total / v.count;
      if (avg > maxAvg) { maxAvg = avg; mostExpensive = s; }
    }
    let maxFails = 0, topFailing = "unknown";
    for (const [s, c] of Object.entries(sourceFails)) {
      if (c > maxFails) { maxFails = c; topFailing = s; }
    }

    return { latencyTrend, successRateTrend, topFailingSource: topFailing, mostExpensiveOperation: mostExpensive };
  }

  // ── STATUS ───────────────────────────────────────────

  status(): { total: number; bySource: Record<string, number>; archiveCount: number; logSizeBytes: number } {
    const bySource: Record<string, number> = {};
    for (const t of this.traces.values()) {
      bySource[t.source] = (bySource[t.source] || 0) + 1;
    }
    let archiveCount = 0;
    try {
      const idx = path.join(this.archivePath, "index.json");
      if (fs.existsSync(idx)) {
        archiveCount = JSON.parse(fs.readFileSync(idx, "utf8")).length;
      }
    } catch {}
    let logSize = 0;
    try { logSize = fs.statSync(this.logPath).size; } catch {}
    return { total: this.traces.size, bySource, archiveCount, logSizeBytes: logSize };
  }
}
