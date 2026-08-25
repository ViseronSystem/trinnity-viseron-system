// VISERON Evolution Engine — Sistema 6 Cognitive Operating Layer
// Evidence-based evolution. Zero random. Zero formulas. Zero capability strings.
// 2026-08-11

import { TelemetryEngine } from "../../omega/telemetry/TelemetryEngine";
import * as fs from "fs";
import * as path from "path";

export interface EvolutionEvent {
  id: string;
  timestamp: number;
  type: "task_result" | "score_change" | "improvement_proposal" | "learning_event";
  agentId?: string;
  source: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  evidence: string[];
  impact: { metric: string; before: number; after: number; delta: number }[];
  archived: boolean;
  archiveHash?: string;
}

export interface EvolutionAnalysis {
  period: { since: string; until: string };
  summary: string;
  trends: Array<{ metric: string; direction: "improving" | "stable" | "declining"; delta: number; evidence: string }>;
  topImprovements: EvolutionEvent[];
  recommendations: string[];
  metrics: {
    totalEvents: number;
    taskResultsAnalyzed: number;
    improvementsDetected: number;
    averageImpact: number;
    eventsWithEvidence: number;
  };
}

export class EvolutionEngine {
  private events: EvolutionEvent[] = [];
  private historyPath: string;
  private archivePath: string;

  constructor(private dataDir: string, private telemetry?: TelemetryEngine) {
    this.historyPath = path.join(dataDir, "state", "evolution-history.jsonl");
    this.archivePath = path.join(dataDir, "archive", "evolution");
    if (!fs.existsSync(path.dirname(this.historyPath))) {
      fs.mkdirSync(path.dirname(this.historyPath), { recursive: true });
    }
    if (!fs.existsSync(this.archivePath)) {
      fs.mkdirSync(this.archivePath, { recursive: true });
    }
    this.load();
  }

  // ── RECORD ────────────────────────────────────────────

  recordTaskResult(params: {
    agentId: string;
    taskId: string;
    success: boolean;
    verification?: string;
    latencyMs: number;
    previousLatencyMs?: number;
    output?: string;
  }): EvolutionEvent {
    const event: EvolutionEvent = {
      id: `evo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: "task_result",
      agentId: params.agentId,
      source: "task_execution",
      evidence: [
        `taskId: ${params.taskId}`,
        `success: ${params.success}`,
        `verification: ${params.verification || "none"}`,
        `latencyMs: ${params.latencyMs}`,
      ],
      impact: params.previousLatencyMs
        ? [{ metric: "latencyMs", before: params.previousLatencyMs, after: params.latencyMs, delta: params.previousLatencyMs - params.latencyMs }]
        : [],
      archived: false,
    };

    this.events.push(event);
    this.persist(event);
    return event;
  }

  recordScoreChange(params: {
    agentId: string;
    metric: string;
    before: number;
    after: number;
    evidence: string[];
  }): EvolutionEvent {
    const event: EvolutionEvent = {
      id: `evo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: "score_change",
      agentId: params.agentId,
      source: "performance_tracking",
      evidence: params.evidence,
      impact: [{ metric: params.metric, before: params.before, after: params.after, delta: params.after - params.before }],
      archived: false,
    };
    this.events.push(event);
    this.persist(event);
    return event;
  }

  proposeImprovement(params: {
    description: string;
    targetAgentId?: string;
    targetMetric: string;
    expectedImpact: number;
    evidence: string[];
  }): EvolutionEvent {
    const event: EvolutionEvent = {
      id: `evo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: "improvement_proposal",
      agentId: params.targetAgentId,
      source: "evolution_analysis",
      evidence: params.evidence,
      impact: [{ metric: params.targetMetric, before: 0, after: params.expectedImpact, delta: params.expectedImpact }],
      after: { proposal: params.description },
      archived: false,
    };
    this.events.push(event);
    this.persist(event);
    return event;
  }

  // ── ARCHIVE ───────────────────────────────────────────

  archiveEvent(eventId: string): { archived: boolean; hash?: string } {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return { archived: false };

    try {
      const crypto = require("crypto");
      const hash = crypto.createHash("sha256").update(JSON.stringify(event)).digest("hex");
      event.archived = true;
      event.archiveHash = hash;

      const archiveFile = path.join(this.archivePath, `${eventId}.json`);
      fs.writeFileSync(archiveFile, JSON.stringify({ ...event, archiveHash: hash }, null, 2));

      return { archived: true, hash };
    } catch {
      return { archived: false };
    }
  }

  // ── ANALYSIS ──────────────────────────────────────────

  analyze(since?: string): EvolutionAnalysis {
    const sinceTs = since ? new Date(since).getTime() : Date.now() - 7 * 86400000;
    const relevant = this.events.filter(e => e.timestamp >= sinceTs);

    const taskResults = relevant.filter(e => e.type === "task_result");
    const scoreChanges = relevant.filter(e => e.type === "score_change");
    const proposals = relevant.filter(e => e.type === "improvement_proposal");

    const trends: EvolutionAnalysis["trends"] = [];

    // Success rate trend
    const successCount = taskResults.filter(e => e.evidence?.some(ev => ev.includes("success: true"))).length;
    const totalCount = taskResults.length || 1;
    trends.push({
      metric: "successRate",
      direction: successCount / totalCount >= 0.8 ? "improving" : successCount / totalCount >= 0.5 ? "stable" : "declining",
      delta: successCount / totalCount,
      evidence: `${successCount}/${totalCount} tasks successful`,
    });

    // Latency trend
    const latencies = taskResults
      .map(e => e.impact?.find(i => i.metric === "latencyMs")?.after)
      .filter(Boolean) as number[];
    if (latencies.length >= 2) {
      const firstHalf = latencies.slice(0, Math.floor(latencies.length / 2));
      const secondHalf = latencies.slice(Math.floor(latencies.length / 2));
      const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
      const latencyDelta = avgFirst - avgSecond;
      trends.push({
        metric: "latencyMs",
        direction: latencyDelta > 50 ? "improving" : latencyDelta < -50 ? "declining" : "stable",
        delta: latencyDelta,
        evidence: `avg ${Math.round(avgFirst)}ms → ${Math.round(avgSecond)}ms`,
      });
    }

    // Score change trend
    const positiveDeltas = scoreChanges.filter(e =>
      e.impact?.some(i => i.delta > 0)
    ).length;
    trends.push({
      metric: "performanceScore",
      direction: positiveDeltas > scoreChanges.length / 2 ? "improving" : "stable",
      delta: positiveDeltas,
      evidence: `${positiveDeltas}/${scoreChanges.length} score improvements`,
    });

    // Evidence coverage
    const withEvidence = relevant.filter(e => e.evidence?.length > 0).length;
    trends.push({
      metric: "evidenceCoverage",
      direction: withEvidence / (relevant.length || 1) > 0.8 ? "improving" : "stable",
      delta: withEvidence / (relevant.length || 1),
      evidence: `${withEvidence}/${relevant.length} events with evidence`,
    });

    // Build recommendations from real data
    const recommendations: string[] = [];
    if (taskResults.length > 0 && successCount / totalCount < 0.7) {
      recommendations.push("Success rate below 70% — review failing tasks in Agent Evidence for patterns.");
    }
    if (latencies.length > 0) {
      const avgLatency = latencies.reduce((s, v) => s + v, 0) / latencies.length;
      if (avgLatency > 1000) {
        recommendations.push(`Average latency ${Math.round(avgLatency)}ms is high — consider optimizing slowest operations.`);
      }
    }
    if (proposals.length === 0 && taskResults.length > 5) {
      recommendations.push("No improvement proposals generated yet — run analyze() with sufficient data to detect patterns.");
    }
    if (scoreChanges.length === 0) {
      recommendations.push("No performance score tracking detected — ensure agents are reporting scores via EvolutionEngine.recordScoreChange().");
    }
    if (recommendations.length === 0) {
      recommendations.push("System is stable. Continue monitoring for regressions.");
    }

    // Top improvements
    const topImprovements = [...scoreChanges, ...taskResults.filter(e => e.impact?.length > 0)]
      .sort((a, b) => {
        const aDelta = Math.abs(a.impact?.[0]?.delta || 0);
        const bDelta = Math.abs(b.impact?.[0]?.delta || 0);
        return bDelta - aDelta;
      })
      .slice(0, 5);

    const summary = [
      `Period: ${new Date(sinceTs).toISOString().slice(0, 10)} → ${new Date().toISOString().slice(0, 10)}`,
      `Events: ${relevant.length} total (${taskResults.length} task results, ${scoreChanges.length} score changes, ${proposals.length} proposals)`,
      `Success rate: ${Math.round((successCount / totalCount) * 100)}%`,
      `Evidence coverage: ${withEvidence}/${relevant.length} events have evidence`,
    ].join(". ");

    return {
      period: { since: new Date(sinceTs).toISOString(), until: new Date().toISOString() },
      summary,
      trends,
      topImprovements,
      recommendations,
      metrics: {
        totalEvents: relevant.length,
        taskResultsAnalyzed: taskResults.length,
        improvementsDetected: scoreChanges.filter(e => e.impact?.some(i => i.delta > 0)).length,
        averageImpact: scoreChanges.length > 0
          ? scoreChanges.reduce((s, e) => s + Math.abs(e.impact?.[0]?.delta || 0), 0) / scoreChanges.length
          : 0,
        eventsWithEvidence: withEvidence,
      },
    };
  }

  // ── STATUS ────────────────────────────────────────────

  status() {
    return {
      totalEvents: this.events.length,
      byType: {
        task_result: this.events.filter(e => e.type === "task_result").length,
        score_change: this.events.filter(e => e.type === "score_change").length,
        improvement_proposal: this.events.filter(e => e.type === "improvement_proposal").length,
        learning_event: this.events.filter(e => e.type === "learning_event").length,
      },
      archivedEvents: this.events.filter(e => e.archived).length,
      historyFile: this.historyPath,
      archiveDir: this.archivePath,
    };
  }

  getHistory(limit: number = 50): EvolutionEvent[] {
    return this.events.slice(-limit).reverse();
  }

  // ── PERSISTENCE ───────────────────────────────────────

  private persist(event: EvolutionEvent): void {
    try {
      fs.appendFileSync(this.historyPath, JSON.stringify(event) + "\n");
    } catch { /* non-blocking */ }
  }

  private load(): void {
    try {
      if (fs.existsSync(this.historyPath)) {
        const lines = fs.readFileSync(this.historyPath, "utf8").trim().split("\n").filter(Boolean);
        this.events = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      }
    } catch { /* non-blocking */ }
  }
}
