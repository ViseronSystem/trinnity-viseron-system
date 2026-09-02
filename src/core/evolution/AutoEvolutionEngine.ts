import { IAgent } from "../types";
import { AgentManager } from "../AgentManager";
import { MemoryEngine } from "../memory/MemoryEngine";
import { SuperMind, SuperMindKnowledge } from "../supermind/SuperMind";
import { archetypes } from "../archetypes";

export interface EvolutionRecord {
  agentId: string;
  agentName: string;
  cycle: number;
  timestamp: number;
  knowledgeGained: number;
  newCapabilities: string[];
  wisdomScore: number;
}

const MAX_AGENTS_PER_CYCLE = 300;
const MAX_POLLINATION_POOL = 120;
const MAX_EVOLUTION_HISTORY = 2_000;

/**
 * REAL capabilities that agents can earn based on actual system activity.
 * Each capability requires evidence — not random selection.
 */
const REAL_CAPABILITY_EVIDENCE: Record<string, (agent: IAgent, activity: AgentActivity) => boolean> = {
  "task_orchestration": (a, act) => act.tasksCompleted >= 5,
  "error_recovery": (a, act) => act.errorsHandled >= 3,
  "multi_domain_reasoning": (a, act) => act.domainsTouched >= 3,
  "knowledge_synthesis": (a, act) => act.knowledgeItems >= 10,
  "cross_agent_collaboration": (a, act) => act.collaborations >= 2,
  "autonomous_planning": (a, act) => act.plansCreated >= 1,
  "real_time_adaptation": (a, act) => act.adaptations >= 2,
  "performance_optimization": (a, act) => act.optimizations >= 1,
  "security_audit": (a, act) => act.auditsCompleted >= 1,
  "user_interaction": (a, act) => act.userInteractions >= 5,
  "data_processing": (a, act) => act.dataProcessed >= 1000,
  "api_integration": (a, act) => act.apiCalls >= 10,
  "content_generation": (a, act) => act.contentGenerated >= 3,
  "monitoring": (a, act) => act.monitoredEvents >= 50,
  "workflow_automation": (a, act) => act.automatedWorkflows >= 1,
};

interface AgentActivity {
  tasksCompleted: number;
  errorsHandled: number;
  domainsTouched: number;
  knowledgeItems: number;
  collaborations: number;
  plansCreated: number;
  adaptations: number;
  optimizations: number;
  auditsCompleted: number;
  userInteractions: number;
  dataProcessed: number;
  apiCalls: number;
  contentGenerated: number;
  monitoredEvents: number;
  automatedWorkflows: number;
}

export class AutoEvolutionEngine {
  private agentManager: AgentManager;
  private memoryEngine: MemoryEngine;
  private superMind: SuperMind;
  private evolutionCycle: number = 0;
  private evolutionHistory: EvolutionRecord[] = [];
  private evolutionTimer: ReturnType<typeof setInterval> | null = null;
  private isEvolving: boolean = false;

  constructor(agentManager: AgentManager, memoryEngine: MemoryEngine, superMind: SuperMind) {
    this.agentManager = agentManager;
    this.memoryEngine = memoryEngine;
    this.superMind = superMind;
  }

  async evolveAll(): Promise<EvolutionRecord[]> {
    if (this.isEvolving) return [];
    this.isEvolving = true;
    try {
      return await this.runEvolution();
    } finally {
      this.isEvolving = false;
    }
  }

  private async runEvolution(): Promise<EvolutionRecord[]> {
    this.evolutionCycle++;
    (global as any).__TVS_LAST_EVOLUTION = Date.now();
    const records: EvolutionRecord[] = [];
    const allAgents = this.agentManager.list('ACTIVE');
    const agents = this.sampleAgents(allAgents, MAX_AGENTS_PER_CYCLE);

    const budgetStart = Date.now();
    const EVOLUTION_BUDGET_MS = 25000;
    for (const agent of agents) {
      if (Date.now() - budgetStart > EVOLUTION_BUDGET_MS) {
        console.warn(`[AutoEvolution] Budget ${EVOLUTION_BUDGET_MS}ms exceeded — cycle #${this.evolutionCycle} truncated`);
        break;
      }
      try {
        const record = await this.evolveAgent(agent);
        records.push(record);
      } catch (err) {
        console.error(`[AutoEvolution] Failed to evolve agent ${agent.name}:`, err);
      }
    }

    await this.crossPollinate();
    this.evolutionHistory.push(...records);
    if (this.evolutionHistory.length > MAX_EVOLUTION_HISTORY) {
      this.evolutionHistory = this.evolutionHistory.slice(-MAX_EVOLUTION_HISTORY);
    }

    this.memoryEngine.addKnowledge(
      `Evolution Cycle #${this.evolutionCycle}`,
      "AUTO_EVOLUTION",
      `Evolved ${records.length} agents (from ${allAgents.length} total). Real capabilities earned: ${records.reduce((s, r) => s + r.newCapabilities.length, 0)}. Avg wisdom: ${records.length > 0 ? (records.reduce((s, r) => s + r.wisdomScore, 0) / records.length).toFixed(1) : 0}`,
      ["evolution", `cycle_${this.evolutionCycle}`, "auto_evolution"]
    );

    return records;
  }

  private sampleAgents(agents: IAgent[], max: number): IAgent[] {
    if (agents.length <= max) return agents;
    const shuffled = [...agents];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, max);
  }

  async evolveAgent(agent: IAgent): Promise<EvolutionRecord> {
    const knowledgePool = this.superMind.queryKnowledge(agent);
    const enriched = this.superMind.crossReferenceKnowledge(agent, knowledgePool);

    const legacyWisdom = this.calculateWisdom(agent);
    const performanceScore = this.computePerformanceScore(agent);
    const activity = this.gatherAgentActivity(agent);

    const newCapabilities = this.earnCapabilities(agent, activity);

    const knowledgeGained = enriched.length * 0.5 + newCapabilities.length * 2;

    const record: any = {
      agentId: agent.id,
      agentName: agent.name,
      cycle: this.evolutionCycle,
      timestamp: Date.now(),
      knowledgeGained: parseFloat(knowledgeGained.toFixed(2)),
      newCapabilities,
      wisdomScore: parseFloat(legacyWisdom.toFixed(2)),
      performanceScore: parseFloat(performanceScore.toFixed(2))
    };

    const evolutionData = {
      cycle: this.evolutionCycle,
      knowledgeGained,
      wisdomScore: legacyWisdom,
      performanceScore,
      capabilities: agent.capabilities,
      newCapabilities,
      knowledgeSources: enriched.map((k: SuperMindKnowledge) => ({ topic: k.topic, relevance: k.relevance, source: k.source })),
      activity
    };

    this.memoryEngine.setLongTerm(
      `agent_evolution_${agent.id}_cycle_${this.evolutionCycle}`,
      evolutionData,
      ['evolution', agent.id, `cycle_${this.evolutionCycle}`]
    );

    this.memoryEngine.setLongTerm(
      `agent_wisdom_${agent.id}`,
      { wisdom: legacyWisdom, performanceScore, lastUpdated: Date.now(), cycle: this.evolutionCycle },
      ['wisdom', agent.id]
    );

    if (newCapabilities.length > 0) {
      agent.capabilities.push(...newCapabilities);
    }

    return record;
  }

  /**
   * Gather REAL activity data for an agent from system logs
   */
  private gatherAgentActivity(agent: IAgent): AgentActivity {
    const activity: AgentActivity = {
      tasksCompleted: 0, errorsHandled: 0, domainsTouched: 0,
      knowledgeItems: 0, collaborations: 0, plansCreated: 0,
      adaptations: 0, optimizations: 0, auditsCompleted: 0,
      userInteractions: 0, dataProcessed: 0, apiCalls: 0,
      contentGenerated: 0, monitoredEvents: 0, automatedWorkflows: 0
    };

    try {
      const fs = require("fs");
      const path = require("path");

      // Read agent activity log
      const logPath = path.resolve(process.cwd(), "data", "knowledge", "agent-activity.jsonl");
      if (fs.existsSync(logPath)) {
        const lines = fs.readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.agentId !== agent.id) continue;
            const action = entry.action || "";
            if (action.includes("task_completed") || action.includes("completed")) activity.tasksCompleted++;
            if (action.includes("error") || action.includes("failed")) activity.errorsHandled++;
            if (action.includes("knowledge")) activity.knowledgeItems++;
            if (action.includes("collaboration") || action.includes("pollination")) activity.collaborations++;
            if (action.includes("plan")) activity.plansCreated++;
            if (action.includes("adapt")) activity.adaptations++;
            if (action.includes("optim")) activity.optimizations++;
            if (action.includes("audit")) activity.auditsCompleted++;
            if (action.includes("user") || action.includes("interaction")) activity.userInteractions++;
            if (action.includes("data") || action.includes("process")) activity.dataProcessed++;
            if (action.includes("api") || action.includes("call")) activity.apiCalls++;
            if (action.includes("content") || action.includes("generate")) activity.contentGenerated++;
            if (action.includes("monitor") || action.includes("event")) activity.monitoredEvents++;
            if (action.includes("workflow") || action.includes("automate")) activity.automatedWorkflows++;
          } catch {}
        }
      }

      // Read task queue for additional metrics
      const taskPath = path.resolve(process.cwd(), "data", "state", "task-queue.json");
      if (fs.existsSync(taskPath)) {
        const tq = JSON.parse(fs.readFileSync(taskPath, "utf8"));
        const tasks = Array.isArray(tq) ? tq : (tq.tasks || []);
        const agentTasks = tasks.filter((t: any) => t.agentId === agent.id || t.assignedTo === agent.id);
        activity.tasksCompleted += agentTasks.filter((t: any) => t.status === "completed").length;
        activity.plansCreated += agentTasks.filter((t: any) => t.type === "plan" || t.type === "planning").length;
      }

      // Read Jarvis memory for API calls
      const memPath = path.resolve(process.cwd(), "data", "knowledge", "jarvis-memory.jsonl");
      if (fs.existsSync(memPath)) {
        const lines = fs.readFileSync(memPath, "utf8").trim().split("\n").filter(Boolean);
        for (const line of lines.slice(-200)) {
          try {
            const entry = JSON.parse(line);
            if (entry.agent === agent.id || entry.agentId === agent.id) {
              activity.apiCalls++;
              if (entry.intent) activity.domainsTouched++;
            }
          } catch {}
        }
      }
    } catch {}

    return activity;
  }

  /**
   * Earn capabilities based on REAL activity evidence — not random selection
   */
  private earnCapabilities(agent: IAgent, activity: AgentActivity): string[] {
    const earned: string[] = [];
    for (const [cap, check] of Object.entries(REAL_CAPABILITY_EVIDENCE)) {
      if (!agent.capabilities.includes(cap) && check(agent, activity)) {
        earned.push(cap);
      }
    }
    return earned;
  }

  async crossPollinate(): Promise<void> {
    const allAgents = this.agentManager.list('ACTIVE');
    if (allAgents.length < 2) return;

    const agents = this.sampleAgents(allAgents, MAX_POLLINATION_POOL);
    const pairs: Array<[IAgent, IAgent]> = [];

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i];
        const b = agents[j];
        const complementary = a.capabilities.some(c =>
          !b.capabilities.includes(c)
        ) || b.capabilities.some(c =>
          !a.capabilities.includes(c)
        );
        if (complementary) {
          pairs.push([a, b]);
        }
      }
    }

    const selectedPairs = pairs.sort(() => Math.random() - 0.5).slice(0, Math.min(pairs.length, 5));

    for (const [agentA, agentB] of selectedPairs) {
      const hybridKnowledge = this.superMind.getHybridKnowledge(agentA, agentB);

      const hybridId = `hybrid_${agentA.id}_${agentB.id}_${this.evolutionCycle}`;
      this.memoryEngine.setLongTerm(hybridId, {
        agentsInvolved: [agentA.id, agentB.id],
        hybridKnowledge: hybridKnowledge.map((k: SuperMindKnowledge) => ({
          topic: k.topic,
          content: k.content,
          relevance: k.relevance
        })),
        createdCycle: this.evolutionCycle,
        timestamp: Date.now()
      }, ['hybrid', 'cross_pollination', agentA.id, agentB.id]);

      // Only share capabilities the other agent has earned through real activity
      const sharedAtoB = agentA.capabilities.filter(c =>
        !agentB.capabilities.includes(c) && REAL_CAPABILITY_EVIDENCE[c]
      );
      const sharedBtoA = agentB.capabilities.filter(c =>
        !agentA.capabilities.includes(c) && REAL_CAPABILITY_EVIDENCE[c]
      );

      if (sharedAtoB.length > 0) {
        agentB.capabilities.push(...sharedAtoB.slice(0, 2));
      }
      if (sharedBtoA.length > 0) {
        agentA.capabilities.push(...sharedBtoA.slice(0, 2));
      }

      this.memoryEngine.addKnowledge(
        `Cross-Pollination: ${agentA.name} x ${agentB.name} (Cycle ${this.evolutionCycle})`,
        "CROSS_POLLINATION",
        `Knowledge transfer between ${agentA.name} (${agentA.role}) and ${agentB.name} (${agentB.role}). Shared capabilities: ${[...sharedAtoB, ...sharedBtoA].join(', ') || 'none earned yet'}.`,
        ['cross_pollination', agentA.id, agentB.id, `cycle_${this.evolutionCycle}`]
      );
    }
  }

  calculateWisdom(agent: IAgent): number {
    // Wisdom based on: capability count + archetype match + performance + knowledge depth
    const realCaps = agent.capabilities.filter(c => REAL_CAPABILITY_EVIDENCE[c]).length;
    const fakeCaps = agent.capabilities.length - realCaps;
    const baseWisdom = realCaps * 8 + Math.min(fakeCaps * 2, 10); // real caps worth 4x more

    const archetypeMatch = archetypes.filter(a =>
      a.specialties.some(s => agent.capabilities.some(c => c.toLowerCase().includes(s)))
    );
    const archetypeBonus = archetypeMatch.reduce((sum, a) => sum + a.wisdom * 0.1, 0);

    const storedWisdom = this.memoryEngine.getLongTerm(`agent_wisdom_${agent.id}`);
    const previousWisdom = storedWisdom?.wisdom || 0;

    const computedWisdom = Math.min(100, baseWisdom + archetypeBonus + previousWisdom * 0.05);
    return parseFloat(computedWisdom.toFixed(2));
  }

  getStats(): { totalCycles: number; totalAgents: number; averageWisdom: number; totalCapabilities: number; realCapabilities: number } {
    const agents = this.agentManager.list('ACTIVE');
    const totalWisdom = agents.reduce((sum, a) => sum + this.calculateWisdom(a), 0);
    const totalCaps = agents.reduce((sum, a) => sum + a.capabilities.length, 0);
    const realCaps = agents.reduce((sum, a) => sum + a.capabilities.filter(c => REAL_CAPABILITY_EVIDENCE[c]).length, 0);

    return {
      totalCycles: this.evolutionCycle,
      totalAgents: agents.length,
      averageWisdom: agents.length > 0 ? parseFloat((totalWisdom / agents.length).toFixed(2)) : 0,
      totalCapabilities: totalCaps,
      realCapabilities: realCaps
    };
  }

  startContinuousEvolution(intervalMs: number = 3600000): void {
    if (this.evolutionTimer) return;
    this.evolveAll();
    this.evolutionTimer = setInterval(() => { this.evolveAll(); }, intervalMs);
    this.evolutionTimer.unref();
  }

  stopContinuousEvolution(): void {
    if (this.evolutionTimer) { clearInterval(this.evolutionTimer); this.evolutionTimer = null; }
  }

  private computePerformanceScore(agent: IAgent): number {
    try {
      const fs = require("fs");
      const path = require("path");
      const logPath = path.resolve(process.cwd(), "data", "knowledge", "agent-activity.jsonl");
      if (!fs.existsSync(logPath)) return 0;

      const lines = fs.readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean);
      const entries = lines
        .map((l: string) => { try { return JSON.parse(l); } catch { return null; } })
        .filter((e: any) => e && e.agentId === agent.id);

      if (entries.length === 0) return 0;

      const completed = entries.filter((e: any) => e.action === "task_completed").length;
      const failed = entries.filter((e: any) => e.action === "task_failed").length;
      const total = completed + failed;
      const successRate = total > 0 ? completed / total : 0;
      const verified = entries.filter((e: any) => e.verification === "PASS").length;
      const verificationRate = total > 0 ? verified / total : 0;

      return Math.min(100, Math.round((successRate * 40 + verificationRate * 30 + Math.min(entries.length / 10, 1) * 30) * 100) / 100);
    } catch {
      return 0;
    }
  }
}
