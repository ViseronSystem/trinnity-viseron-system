// VISERON S9 Phase 2 — Knowledge Gap Detection + Research Planning
// Connects existing knowledge to research decisions
// 2026-08-11

import { MemoryEngine } from "../memory/MemoryEngine";
import { ExperienceStore, TaskContext } from "../memory/ExperienceStore";

// ── KNOWLEDGE GAP DETECTOR ─────────────────────────────

export interface GapAnalysis {
  knowledgeSufficient: boolean;
  confidence: number;
  gaps: string[];
  requiredDomains: string[];
  recommendedQueries: string[];
  reason: string;
  retrievalResults: number;
  relevantExperience: number;
}

export class KnowledgeGapDetector {
  constructor(
    private memoryEngine?: MemoryEngine,
    private experienceStore?: ExperienceStore,
  ) {}

  analyze(task: string, domain?: string, requiredDomains?: string[]): GapAnalysis {
    const gaps: string[] = [];
    const recommendedQueries: string[] = [];
    let retrievalResults = 0;
    let relevantExperience = 0;

    // Check LTM coverage
    try {
      const ltmResults = this.memoryEngine?.searchLongTerm?.(task) || [];
      retrievalResults += ltmResults.length;
    } catch {}

    // Check unified search
    try {
      const unified = this.memoryEngine?.unifiedSearch?.(task, { maxResults: 5 }) || [];
      retrievalResults = Math.min(retrievalResults, 10); // cap to avoid 20K dominance
    } catch {}

    // Check experience store
    const domains = requiredDomains || (domain ? [domain] : []);
    if (this.experienceStore && domains.length > 0) {
      for (const d of domains) {
        const ctx: TaskContext = { taskId: `gap_check_${d}`, input: task, relatedEntities: [d] };
        const experiences = this.experienceStore.retrieveRelevant(ctx, 3);
        relevantExperience += experiences.length;
      }
    }

    // Determine gaps — check if results are domain-relevant, not just exist
    const taskTerms = task.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    for (const d of domains) {
      const domainTerms = d.toLowerCase().split(/\s+/).filter(t => t.length > 3);

      // Check domain-specific coverage: search with domain terms
      let domainResults = 0;
      try {
        domainResults = this.memoryEngine?.searchLongTerm?.(d)?.length || 0;
        // Also check unified search with domain-specific query
        const domainSearch = this.memoryEngine?.unifiedSearch?.(`${d} ${task.slice(0, 60)}`, { maxResults: 5 }) || [];
        domainResults = Math.max(domainResults, domainSearch.length);
      } catch {}

      // Domain gap: if domain-specific results are low OR domain terms don't overlap with task
      if (domainResults < 3) {
        gaps.push(`limited ${d} domain knowledge (${domainResults} results)`);
        recommendedQueries.push(`${d} ${task.slice(0, 60)}`);
      }
    }

    // If no domains specified, check general coverage
    if (domains.length === 0) {
      if (retrievalResults < 3) {
        gaps.push("insufficient existing knowledge");
        recommendedQueries.push(task.slice(0, 80));
      }
    }

    // Confidence calculation
    const coverage = retrievalResults > 0 ? Math.min(1, retrievalResults / 5) : 0;
    const experienceBoost = relevantExperience > 0 ? 0.2 : 0;
    const domainCoverage = domains.length > 0 ? (domains.length - gaps.length) / domains.length : (retrievalResults > 0 ? 1 : 0);
    const confidence = Math.min(1, coverage * 0.4 + domainCoverage * 0.4 + experienceBoost);

    const knowledgeSufficient = gaps.length === 0 && confidence >= 0.4;
    const reason = knowledgeSufficient
      ? `sufficient: ${retrievalResults} results, ${relevantExperience} experiences, confidence=${confidence.toFixed(2)}`
      : `insufficient: ${gaps.length} gaps (${gaps.join("; ")}), confidence=${confidence.toFixed(2)}`;

    return { knowledgeSufficient, confidence, gaps, requiredDomains: domains.filter(d => gaps.some(g => g.includes(d))), recommendedQueries, reason, retrievalResults, relevantExperience };
  }
}

// ── RESEARCH PLANNER ────────────────────────────────────

export interface ResearchPlan {
  researchId: string;
  objective: string;
  queries: string[];
  domains: string[];
  maxSources: number;
  maxLatency: number;
  priority: "low" | "medium" | "high";
  confidenceRequired: number;
  currentConfidence: number;
  expectedEvidence: string[];
}

export class ResearchPlanner {
  constructor(private gapDetector: KnowledgeGapDetector) {}

  plan(task: string, domain?: string, requiredDomains?: string[], maxSources: number = 3): ResearchPlan | null {
    const analysis = this.gapDetector.analyze(task, domain, requiredDomains);

    // Don't plan if knowledge is sufficient
    if (analysis.knowledgeSufficient) return null;

    const priority = analysis.confidence < 0.2 ? "high" : analysis.confidence < 0.4 ? "medium" : "low";

    return {
      researchId: `plan_${Date.now().toString(36)}`,
      objective: task,
      queries: analysis.recommendedQueries.length > 0 ? analysis.recommendedQueries : [task],
      domains: analysis.requiredDomains.length > 0 ? analysis.requiredDomains : (domain ? [domain] : ["general"]),
      maxSources: Math.min(maxSources, analysis.recommendedQueries.length * 2 || 3),
      maxLatency: priority === "high" ? 30000 : priority === "medium" ? 15000 : 10000,
      priority,
      confidenceRequired: 0.5,
      currentConfidence: analysis.confidence,
      expectedEvidence: ["source_registration", "quality_gate", "chunking", "indexing"],
    };
  }
}
