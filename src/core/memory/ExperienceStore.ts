// VISERON Experience Memory — Task-Contextual Experience Index
// Separates operational experiences from general knowledge
// Enables task-prioritized experience retrieval before general context
// 2026-08-11

import * as fs from "fs";
import * as path from "path";

export interface ExperienceRecord {
  experienceId: string;
  taskId: string;
  agentId?: string;
  traceId?: string;
  timestamp: number;
  input?: string;
  summary: string;
  content: string;
  artifact?: string;
  artifactHash?: string;
  validation?: string;
  tools?: string[];
  tags: string[];
  importance: number; // 0-1
  metadata?: Record<string, any>;
}

export interface TaskContext {
  taskId: string;
  agentId?: string;
  input: string;
  relatedEntities?: string[];
  projectContext?: string;
}

export class ExperienceStore {
  private experiences: Map<string, ExperienceRecord> = new Map();
  private indexPath: string;

  constructor(private dataDir: string) {
    this.indexPath = path.join(dataDir, "state", "experience-index.jsonl");
    this.load();
  }

  // ── STORE ────────────────────────────────────────────

  record(exp: ExperienceRecord): ExperienceRecord {
    exp.experienceId = exp.experienceId || `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
    exp.timestamp = exp.timestamp || Date.now();
    exp.importance = exp.importance ?? 0.5;
    this.experiences.set(exp.experienceId, exp);
    this.persist(exp);
    return exp;
  }

  // ── RETRIEVE BY TASK CONTEXT ─────────────────────────

  retrieveRelevant(context: TaskContext, limit: number = 5): ExperienceRecord[] {
    const scored: Array<{ exp: ExperienceRecord; score: number }> = [];

    for (const exp of this.experiences.values()) {
      let score = 0;

      // Same agent
      if (context.agentId && exp.agentId === context.agentId) score += 0.3;

      // Input similarity (keyword overlap)
      if (context.input && exp.input) {
        const ctxTerms = new Set(context.input.toLowerCase().split(/\s+/).filter(t => t.length > 3));
        const expTerms = new Set(exp.input.toLowerCase().split(/\s+/).filter(t => t.length > 3));
        const overlap = [...ctxTerms].filter(t => expTerms.has(t)).length;
        score += Math.min(0.4, overlap * 0.05);
      } else if (context.input && exp.summary) {
        const ctxTerms = new Set(context.input.toLowerCase().split(/\s+/).filter(t => t.length > 3));
        const sumTerms = new Set(exp.summary.toLowerCase().split(/\s+/).filter(t => t.length > 3));
        const overlap = [...ctxTerms].filter(t => sumTerms.has(t)).length;
        score += Math.min(0.3, overlap * 0.04);
      }

      // Entity overlap
      if (context.relatedEntities && exp.tags) {
        const overlap = context.relatedEntities.filter(e => exp.tags.some(t => t.includes(e) || e.includes(t))).length;
        score += Math.min(0.3, overlap * 0.1);
      }

      // Recency boost
      const ageMs = Date.now() - exp.timestamp;
      if (ageMs < 3600000) score += 0.2;
      else if (ageMs < 86400000) score += 0.1;
      else if (ageMs < 604800000) score += 0.03;

      // Evidence (has artifact + validation)
      if (exp.artifact && exp.validation) score += 0.1;

      // Importance
      score += exp.importance * 0.15;

      if (score > 0.2) scored.push({ exp, score }); // minimum relevance threshold
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.exp);
  }

  // ── GET ──────────────────────────────────────────────

  get(experienceId: string): ExperienceRecord | undefined {
    return this.experiences.get(experienceId);
  }

  status() {
    return { total: this.experiences.size, indexPath: this.indexPath };
  }

  // ── PERSISTENCE ──────────────────────────────────────

  private persist(exp: ExperienceRecord): void {
    try { fs.appendFileSync(this.indexPath, JSON.stringify(exp) + "\n"); } catch {}
  }

  private load(): void {
    try {
      if (fs.existsSync(this.indexPath)) {
        const lines = fs.readFileSync(this.indexPath, "utf8").trim().split("\n").filter(Boolean);
        for (const l of lines) {
          try { const e = JSON.parse(l); if (e.experienceId) this.experiences.set(e.experienceId, e); } catch {}
        }
      }
    } catch {}
  }
}
