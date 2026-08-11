// VISERON Parallel Intelligence Layer
// IntelligentRouter + TaskDAG + ParallelOrchestrator
// Uses EXISTING agents, skills, tools — no new agents created
// 2026-08-11

import { OmegaPlatform } from "../omega";

// ── INTELLIGENT ROUTER ─────────────────────────────────

export interface RankedAgent {
  agentId: string;
  score: number;
  reasons: string[];
}

export class IntelligentRouter {
  constructor(private omega: OmegaPlatform) {}

  rankAgents(task: string, domain?: string): RankedAgent[] {
    const specs = this.omega.agents.status().specs || [];
    const ranked: RankedAgent[] = [];

    for (const spec of specs) {
      let score = 0;
      const reasons: string[] = [];

      // Domain match (keyword overlap between task and agent role/name)
      const taskLower = task.toLowerCase();
      const roleLower = (spec.role || "").toLowerCase();
      const nameLower = (spec.name || "").toLowerCase();
      const taskWords = new Set(taskLower.split(/\s+/).filter(t => t.length > 3));
      const roleWords = new Set(roleLower.split(/\s+/).filter(t => t.length > 3));
      const nameWords = new Set(nameLower.split(/\s+/).filter(t => t.length > 3));

      const roleOverlap = [...taskWords].filter(w => roleWords.has(w)).length;
      const nameOverlap = [...taskWords].filter(w => nameWords.has(w)).length;
      score += Math.min(0.5, roleOverlap * 0.1 + nameOverlap * 0.05);
      if (roleOverlap > 0) reasons.push(`role match: ${roleOverlap} terms`);

      // Status bonus
      if (spec.status === "ACTIVE") { score += 0.2; reasons.push("active"); }
      else { score -= 0.3; reasons.push("inactive"); }

      // Domain-specific routing
      if (domain) {
        const domainTerms = domain.toLowerCase().split(/\s+/);
        for (const dt of domainTerms) {
          if (roleLower.includes(dt) || nameLower.includes(dt)) {
            score += 0.15;
            reasons.push(`domain match: ${dt}`);
            break;
          }
        }
      }

      // Evidence from learning records
      const learningRecords = this.omega.learning?.list("CONSOLIDATED") || [];
      const agentLearning = learningRecords.filter(r => r.agentIds?.includes(spec.id));
      if (agentLearning.length > 0) {
        score += Math.min(0.3, agentLearning.length * 0.1);
        reasons.push(`${agentLearning.length} prior learnings`);
      }

      // Domain specificity bonus: if agent's role/name directly matches the domain
      if (domain) {
        const domainLower = domain.toLowerCase();
        const domainInRole = roleLower.includes(domainLower) || nameLower.includes(domainLower);
        const roleInDomain = domainLower.split(/\s+/).some(dt => roleLower.includes(dt) || nameLower.includes(dt));
        if (domainInRole || roleInDomain) {
          score += 0.3; // significant boost for domain-specific agent
          reasons.push(`domain specialist: ${domain}`);
        }
      }

      if (score > 0) ranked.push({ agentId: spec.id, score, reasons });
    }

    return ranked.sort((a, b) => b.score - a.score);
  }

  route(task: string, domain?: string): RankedAgent[] {
    return this.rankAgents(task, domain).slice(0, 5);
  }
}

// ── TASK DAG ───────────────────────────────────────────

export interface TaskNode {
  id: string;
  description: string;
  domain: string;
  dependencies: string[];
  recommendedAgentId?: string;
  priority: number;
  estimatedCost?: number;
}

export class TaskDecomposer {
  decompose(goal: string): TaskNode[] {
    const domains = this.extractDomains(goal);
    const nodes: TaskNode[] = [];
    let nodeIdx = 1;

    // Create independent parallel tasks for each domain
    for (const domain of domains) {
      nodes.push({
        id: `T${nodeIdx}`,
        description: `Analyze ${domain} requirements and produce report`,
        domain,
        dependencies: [],
        priority: 1,
      });
      nodeIdx++;
    }

    // Synthesis task (depends on all domain tasks)
    if (nodes.length > 0) {
      nodes.push({
        id: `T${nodeIdx}`,
        description: `Synthesize findings from all domains into final report`,
        domain: "synthesis",
        dependencies: nodes.map(n => n.id),
        priority: 2,
      });
    }

    return nodes;
  }

  private extractDomains(goal: string): string[] {
    const domains: string[] = [];
    const lower = goal.toLowerCase();
    if (lower.includes("memory") || lower.includes("storage")) domains.push("memory");
    if (lower.includes("agent") || lower.includes("intelligence")) domains.push("agents");
    if (lower.includes("api") || lower.includes("endpoint")) domains.push("api");
    if (lower.includes("security") || lower.includes("auth")) domains.push("security");
    if (lower.includes("performance") || lower.includes("optimization")) domains.push("performance");
    if (lower.includes("data") || lower.includes("analytics")) domains.push("analytics");
    if (domains.length === 0) domains.push("analysis"); // fallback
    return domains;
  }
}

// ── PARALLEL ORCHESTRATOR ──────────────────────────────

export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: string;
  agentId?: string;
  latencyMs: number;
  error?: string;
}

export class ParallelOrchestrator {
  private router: IntelligentRouter;

  constructor(private omega: OmegaPlatform, private maxConcurrency: number = 4) {
    this.router = new IntelligentRouter(omega);
  }

  async executeDAG(nodes: TaskNode[]): Promise<{ results: TaskResult[]; sequentialMs: number; parallelMs: number }> {
    const results: TaskResult[] = [];
    const completed = new Set<string>();
    const running = new Set<string>();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const startParallel = Date.now();

    // Sequential baseline: sum all individual latencies
    let sequentialMs = 0;

    while (completed.size < nodes.length) {
      // Find ready tasks (all dependencies completed)
      const ready = nodes.filter(n =>
        !completed.has(n.id) &&
        !running.has(n.id) &&
        n.dependencies.every(d => completed.has(d))
      );

      // Limit concurrency
      const toRun = ready.slice(0, Math.max(1, this.maxConcurrency - running.size));

      // Execute ready tasks in parallel
      const promises = toRun.map(async (node) => {
        running.add(node.id);
        const start = Date.now();

        // Route to best agent
        const ranked = this.router.route(node.description, node.domain);
        node.recommendedAgentId = ranked[0]?.agentId;

        try {
          // Execute via OMEGA agent dispatch
          const agentResult = await this.omega.kernel.dispatchAgent(
            node.recommendedAgentId || "agent_ceo",
            `Task ${node.id}: ${node.description}. Domain: ${node.domain}. Produce a structured output artifact.`,
            { origin: "parallel-orchestrator", taskId: node.id }
          );
          const ms = Date.now() - start;
          sequentialMs += ms;

          results.push({
            taskId: node.id,
            success: true,
            output: typeof agentResult === "string" ? agentResult.slice(0, 200) : JSON.stringify(agentResult).slice(0, 200),
            agentId: node.recommendedAgentId,
            latencyMs: ms,
          });
        } catch (e: any) {
          const ms = Date.now() - start;
          sequentialMs += ms;
          results.push({
            taskId: node.id,
            success: false,
            error: e.message?.slice(0, 100),
            agentId: node.recommendedAgentId,
            latencyMs: ms,
          });
        }

        completed.add(node.id);
        running.delete(node.id);
      });

      await Promise.all(promises);

      // Prevent infinite loop if no tasks can run
      if (toRun.length === 0 && running.size === 0 && completed.size < nodes.length) {
        // Remaining tasks have unmet dependencies — mark as blocked
        for (const node of nodes) {
          if (!completed.has(node.id)) {
            results.push({
              taskId: node.id,
              success: false,
              error: `dependencies unmet: ${node.dependencies.filter(d => !completed.has(d)).join(", ")}`,
              latencyMs: 0,
            });
            completed.add(node.id);
          }
        }
      }
    }

    const parallelMs = Date.now() - startParallel;

    return { results, sequentialMs, parallelMs };
  }
}
