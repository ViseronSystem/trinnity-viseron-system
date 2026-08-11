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
    const scored: Array<{ exp: ExperienceRecord; score: number; relevance: number; rejectionReason?: string }> = [];

    for (const exp of this.experiences.values()) {
      let relevance = 0;  // semantic/contextual match — MUST be > 0 to pass gate
      let boost = 0;      // recency, importance, evidence — only applied if relevant

      // ── RELEVANCE (HARD GATE) ──
      // Same agent
      if (context.agentId && exp.agentId === context.agentId) relevance += 0.3;

      // Input similarity (keyword overlap between task inputs)
      if (context.input && exp.input) {
        const ctxTerms = new Set(context.input.toLowerCase().split(/\s+/).filter(t => t.length > 3));
        const expTerms = new Set(exp.input.toLowerCase().split(/\s+/).filter(t => t.length > 3));
        const overlap = [...ctxTerms].filter(t => expTerms.has(t)).length;
        relevance += Math.min(0.5, overlap * 0.06);
      } else if (context.input && exp.summary) {
        const ctxTerms = new Set(context.input.toLowerCase().split(/\s+/).filter(t => t.length > 3));
        const sumTerms = new Set(exp.summary.toLowerCase().split(/\s+/).filter(t => t.length > 3));
        const overlap = [...ctxTerms].filter(t => sumTerms.has(t)).length;
        relevance += Math.min(0.4, overlap * 0.05);
      }

      // Entity/project overlap
      if (context.relatedEntities && exp.tags) {
        const overlap = context.relatedEntities.filter(e => exp.tags.some(t => t.includes(e) || e.includes(t))).length;
        relevance += Math.min(0.4, overlap * 0.15);
      }

      // Content similarity: does the experience content relate to the task input?
      if (context.input && exp.content) {
        const ctxTerms = new Set(context.input.toLowerCase().split(/\s+/).filter(t => t.length > 3));
        const contentLower = exp.content.toLowerCase();
        const contentMatch = [...ctxTerms].filter(t => contentLower.includes(t)).length;
        relevance += Math.min(0.3, contentMatch * 0.05);
      }

      // ── HARD GATE ──
      // Require minimum semantic/contextual relevance before boosts apply
      if (relevance < 0.15) continue; // not semantically connected — REJECT

      // ── BOOST (only for relevant experiences) ──
      const ageMs = Date.now() - exp.timestamp;
      if (ageMs < 3600000) boost += 0.2;
      else if (ageMs < 86400000) boost += 0.1;
      else if (ageMs < 604800000) boost += 0.03;

      if (exp.artifact && exp.validation) boost += 0.1;
      boost += exp.importance * 0.15;

      const finalScore = relevance + boost;
      if (finalScore > 0.15) scored.push({ exp, score: finalScore, relevance });
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
