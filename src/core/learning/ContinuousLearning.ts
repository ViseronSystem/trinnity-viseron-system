// VISERON Continuous Learning Infrastructure
// LearningRecord + ValidationGate + ConsolidationEngine
// 2026-08-11

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ── LEARNING RECORD ────────────────────────────────────

export type LearningStatus = "PROPOSED" | "VALIDATING" | "ACCEPTED" | "REJECTED" | "CONSOLIDATED" | "SUPERSEDED";
export type LearningScope = "AGENT_ONLY" | "PROJECT" | "DOMAIN" | "GLOBAL";
export type ConflictType = "CONTRADICTORY" | "SUPERSEDES" | "SUPPORTS" | "DUPLICATE" | "EXTENDS" | "UNRELATED";

export interface LearningRecord {
  learningId: string;
  sourceExperienceIds: string[];
  taskIds: string[];
  agentIds: string[];
  traceIds: string[];
  inputContext: string;
  previousBehavior: string;
  newBehavior: string;
  performanceBefore: number;
  performanceAfter: number;
  performanceDelta: number;
  validation: string;
  confidence: number;
  relevanceScore: number;
  scope: LearningScope;
  status: LearningStatus;
  evidence: string[];
  conflicts: Array<{ conflictId: string; type: ConflictType; reason: string; resolutionStatus: string }>;
  createdAt: number;
  updatedAt: number;
  consolidatedAt?: number;
}

export interface ValidationResult {
  passed: boolean;
  failures: Array<{ check: string; reason: string }>;
  warnings: string[];
  confidence: number;
}

// ── LEARNING VALIDATION GATE ───────────────────────────

export class LearningValidationGate {
  validate(record: LearningRecord): ValidationResult {
    const failures: Array<{ check: string; reason: string }> = [];
    const warnings: string[] = [];

    // 1. Evidence check
    if (!record.sourceExperienceIds?.length) failures.push({ check: "has_experience", reason: "no source experiences" });
    if (!record.evidence?.length) failures.push({ check: "has_evidence", reason: "no evidence provided" });
    if (!record.traceIds?.length) failures.push({ check: "has_telemetry", reason: "no telemetry traces" });

    // 2. Behavioral change check
    if (record.previousBehavior === record.newBehavior) {
      failures.push({ check: "behavioral_change", reason: "no behavioral change detected" });
    }

    // 3. Performance check
    if (record.performanceDelta <= 0) {
      warnings.push("no positive performance delta — keeping as experience only");
    }

    // 4. Reproducibility check
    if (record.taskIds.length < 1) {
      failures.push({ check: "reproducibility", reason: "insufficient task samples" });
    }

    // 5. Confidence check
    if (record.confidence < 0.3) {
      failures.push({ check: "confidence", reason: `confidence ${record.confidence.toFixed(2)} below minimum 0.3` });
    }

    // 6. Validation artifact check
    if (!record.validation || record.validation === "NONE") {
      failures.push({ check: "validation", reason: "no validation result" });
    }

    // 7. Relevance check
    if (record.relevanceScore < 0.15) {
      failures.push({ check: "relevance", reason: `relevance ${record.relevanceScore.toFixed(2)} below threshold 0.15` });
    }

    const confidence = failures.length === 0
      ? Math.min(0.95, 0.5 + record.evidence.length * 0.1 + (record.performanceDelta > 0 ? 0.2 : 0))
      : Math.max(0.05, 0.3 - failures.length * 0.1);

    return { passed: failures.length === 0, failures, warnings, confidence };
  }
}

// ── LEARNING CONSOLIDATION ENGINE ──────────────────────

export class LearningConsolidationEngine {
  private records: Map<string, LearningRecord> = new Map();
  private indexPath: string;
  private gate: LearningValidationGate = new LearningValidationGate();

  constructor(private dataDir: string) {
    this.indexPath = path.join(dataDir, "state", "learning-records.jsonl");
    if (!fs.existsSync(path.dirname(this.indexPath))) fs.mkdirSync(path.dirname(this.indexPath), { recursive: true });
    this.load();
  }

  // ── PROPOSE ──────────────────────────────────────────

  propose(params: {
    sourceExperienceIds: string[];
    taskIds: string[];
    agentIds: string[];
    traceIds: string[];
    inputContext: string;
    previousBehavior: string;
    newBehavior: string;
    performanceBefore: number;
    performanceAfter: number;
    relevanceScore: number;
    scope?: LearningScope;
    evidence: string[];
  }): LearningRecord {
    const record: LearningRecord = {
      learningId: `learn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`,
      sourceExperienceIds: params.sourceExperienceIds,
      taskIds: params.taskIds,
      agentIds: params.agentIds,
      traceIds: params.traceIds,
      inputContext: params.inputContext,
      previousBehavior: params.previousBehavior,
      newBehavior: params.newBehavior,
      performanceBefore: params.performanceBefore,
      performanceAfter: params.performanceAfter,
      performanceDelta: params.performanceAfter - params.performanceBefore,
      validation: "NONE",
      confidence: 0.3,
      relevanceScore: params.relevanceScore,
      scope: params.scope || "AGENT_ONLY",
      status: "PROPOSED",
      evidence: params.evidence,
      conflicts: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.records.set(record.learningId, record);
    this.persist(record);
    return record;
  }

  // ── VALIDATE ─────────────────────────────────────────

  validate(learningId: string, validationResult: string): LearningRecord {
    const record = this.records.get(learningId);
    if (!record) throw new Error(`Learning ${learningId} not found`);
    record.validation = validationResult;
    record.status = "VALIDATING";

    const result = this.gate.validate(record);
    record.confidence = result.confidence;

    if (result.passed) {
      record.status = "ACCEPTED";
    } else {
      record.status = "REJECTED";
    }
    record.updatedAt = Date.now();
    this.persist(record);
    return record;
  }

  // ── CONSOLIDATE ──────────────────────────────────────

  consolidate(learningId: string): LearningRecord {
    const record = this.records.get(learningId);
    if (!record || record.status !== "ACCEPTED") throw new Error(`Learning ${learningId} not accepted`);

    // Conflict detection
    for (const existing of this.records.values()) {
      if (existing.learningId === record.learningId) continue;
      if (existing.status === "CONSOLIDATED" || existing.status === "ACCEPTED") {
        const conflictType = this.detectConflict(record, existing);
        if (conflictType !== "UNRELATED") {
          record.conflicts.push({
            conflictId: existing.learningId,
            type: conflictType,
            reason: this.conflictReason(conflictType),
            resolutionStatus: "DETECTED",
          });
        }
      }
    }

    // Dedup: if this learning is a duplicate of existing, mark as SUPERSEDED
    const duplicates = this.detectDuplicates(record);
    if (duplicates.length > 0) {
      for (const dupId of duplicates) {
        const dup = this.records.get(dupId);
        if (dup) dup.status = "SUPERSEDED";
      }
    }

    record.status = "CONSOLIDATED";
    record.consolidatedAt = Date.now();
    record.updatedAt = Date.now();

    // Archive with SHA-256
    try {
      const hash = crypto.createHash("sha256").update(JSON.stringify(record)).digest("hex");
      const archiveDir = path.join(this.dataDir, "archive", "learning");
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
      fs.writeFileSync(path.join(archiveDir, `${record.learningId}.json`), JSON.stringify({ ...record, archiveHash: hash }, null, 2));
    } catch {}

    this.persist(record);
    return record;
  }

  // ── CONFLICT DETECTION ───────────────────────────────

  private detectConflict(a: LearningRecord, b: LearningRecord): ConflictType {
    const aKeywords = new Set(a.inputContext.toLowerCase().split(/\s+/).filter(t => t.length > 3));
    const bKeywords = new Set(b.inputContext.toLowerCase().split(/\s+/).filter(t => t.length > 3));
    const overlap = [...aKeywords].filter(t => bKeywords.has(t)).length;
    const totalUnique = new Set([...aKeywords, ...bKeywords]).size;
    const similarity = overlap / (totalUnique || 1);

    if (similarity > 0.7) {
      if (a.performanceDelta > 0 && b.performanceDelta < 0) return "CONTRADICTORY";
      if (a.performanceDelta > b.performanceDelta) return "SUPERSEDES";
      if (Math.abs(a.performanceDelta - b.performanceDelta) < 0.05) return "SUPPORTS";
      return "DUPLICATE";
    }
    if (similarity > 0.3) return "EXTENDS";
    return "UNRELATED";
  }

  private detectDuplicates(record: LearningRecord): string[] {
    return Array.from(this.records.values())
      .filter(r => r.learningId !== record.learningId)
      .filter(r => this.detectConflict(record, r) === "DUPLICATE")
      .map(r => r.learningId);
  }

  private conflictReason(type: ConflictType): string {
    switch (type) {
      case "CONTRADICTORY": return "learning records contradict each other";
      case "SUPERSEDES": return "this learning supersedes previous record";
      case "SUPPORTS": return "this learning supports existing knowledge";
      case "DUPLICATE": return "duplicate learning detected";
      case "EXTENDS": return "this learning extends existing knowledge";
      default: return "unrelated";
    }
  }

  // ── QUERY ────────────────────────────────────────────

  get(learningId: string): LearningRecord | undefined { return this.records.get(learningId); }

  list(status?: LearningStatus, scope?: LearningScope): LearningRecord[] {
    let result = Array.from(this.records.values());
    if (status) result = result.filter(r => r.status === status);
    if (scope) result = result.filter(r => r.scope === scope);
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getStats() {
    const all = Array.from(this.records.values());
    return {
      total: all.length,
      proposed: all.filter(r => r.status === "PROPOSED").length,
      accepted: all.filter(r => r.status === "ACCEPTED").length,
      rejected: all.filter(r => r.status === "REJECTED").length,
      consolidated: all.filter(r => r.status === "CONSOLIDATED").length,
      superseded: all.filter(r => r.status === "SUPERSEDED").length,
      conflictsTotal: all.reduce((s, r) => s + r.conflicts.length, 0),
      avgConfidence: all.length > 0 ? all.reduce((s, r) => s + r.confidence, 0) / all.length : 0,
    };
  }

  // ── PERSISTENCE ──────────────────────────────────────

  private persist(record: LearningRecord): void {
    try { fs.appendFileSync(this.indexPath, JSON.stringify(record) + "\n"); } catch {}
  }

  private load(): void {
    try {
      if (fs.existsSync(this.indexPath)) {
        const lines = fs.readFileSync(this.indexPath, "utf8").trim().split("\n").filter(Boolean);
        for (const l of lines) {
          try { const r = JSON.parse(l); if (r.learningId) this.records.set(r.learningId, r); } catch {}
        }
      }
    } catch {}
  }
}
