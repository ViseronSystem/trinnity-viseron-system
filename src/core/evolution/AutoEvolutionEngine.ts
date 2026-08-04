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

const KNOWLEDGE_GAIN_MIN = 0.01;
const KNOWLEDGE_GAIN_MAX = 0.05;
const MAX_AGENTS_PER_CYCLE = 300;
const MAX_POLLINATION_POOL = 120;
const MAX_EVOLUTION_HISTORY = 2_000;
const ALL_POSSIBLE_CAPABILITIES = [
  "quantum_cognition", "neural_optimization", "self_healing", "predictive_analysis",
  "semantic_reasoning", "adaptive_learning", "swarm_intelligence", "temporal_planning",
  "causal_inference", "multi_modal_fusion", "autonomous_decision", "recursive_self_improvement",
  "knowledge_distillation", "pattern_recognition_advanced", "consciousness_simulation",
  "cross_domain_transfer", "emergent_behavior", "meta_learning", "contextual_awareness",
  "distributed_reasoning", "ethics_reasoning", "creative_synthesis", "adversarial_robustness",
  "explainable_ai", "few_shot_generalization"
];

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

    for (const agent of agents) {
      try {
        const record = await this.evolveAgent(agent);
        records.push(record);
      } catch (err) {
        console.error(`[AutoEvolutionEngine] Failed to evolve agent ${agent.name}:`, err);
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
      `Evolved ${records.length} agents (sampled from ${allAgents.length}) with total wisdom gain of ${records.reduce((s, r) => s + r.knowledgeGained, 0).toFixed(2)}%. New capabilities: ${records.reduce((s, r) => s + r.newCapabilities.length, 0)} total.`,
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

    const knowledgeGained = KNOWLEDGE_GAIN_MIN + Math.random() * (KNOWLEDGE_GAIN_MAX - KNOWLEDGE_GAIN_MIN);

    const currentWisdom = this.calculateWisdom(agent);
    const newWisdom = Math.min(100, currentWisdom + (knowledgeGained * 100 * (enriched.length > 0 ? 1.5 : 0.5)));
    const newCapabilities = this.generateNewCapabilities(agent);

    const record: EvolutionRecord = {
      agentId: agent.id,
      agentName: agent.name,
      cycle: this.evolutionCycle,
      timestamp: Date.now(),
      knowledgeGained: parseFloat((knowledgeGained * 100).toFixed(2)),
      newCapabilities,
      wisdomScore: parseFloat(newWisdom.toFixed(2))
    };

    const evolutionData = {
      cycle: this.evolutionCycle,
      knowledgeGained,
      wisdomScore: newWisdom,
      capabilities: agent.capabilities,
      newCapabilities,
      knowledgeSources: enriched.map((k: SuperMindKnowledge) => ({ topic: k.topic, relevance: k.relevance, source: k.source }))
    };

    this.memoryEngine.setLongTerm(
      `agent_evolution_${agent.id}_cycle_${this.evolutionCycle}`,
      evolutionData,
      ['evolution', agent.id, `cycle_${this.evolutionCycle}`]
    );

    this.memoryEngine.setLongTerm(
      `agent_wisdom_${agent.id}`,
      { wisdom: newWisdom, lastUpdated: Date.now(), cycle: this.evolutionCycle },
      ['wisdom', agent.id]
    );

    if (newCapabilities.length > 0) {
      agent.capabilities.push(...newCapabilities);
    }

    const insightVector = this.evolutionInsightToVector(knowledgeGained, newWisdom, newCapabilities.length);
    await this.memoryEngine.storeVector(insightVector, {
      agentId: agent.id,
      agentName: agent.name,
      cycle: this.evolutionCycle,
      knowledgeGained,
      wisdomScore: newWisdom,
      newCapabilities: newCapabilities.length,
      timestamp: Date.now()
    });

    return record;
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

      const hybridCaps = this.generateHybridCapabilities(agentA, agentB);
      agentA.capabilities.push(...hybridCaps.filter(c => !agentA.capabilities.includes(c)));
      agentB.capabilities.push(...hybridCaps.filter(c => !agentB.capabilities.includes(c)));

      this.memoryEngine.addKnowledge(
        `Cross-Pollination: ${agentA.name} x ${agentB.name} (Cycle ${this.evolutionCycle})`,
        "CROSS_POLLINATION",
        `Knowledge transfer between ${agentA.name} (${agentA.role}) and ${agentB.name} (${agentB.role}). Created hybrid capabilities: ${hybridCaps.join(', ')}.`,
        ['cross_pollination', agentA.id, agentB.id, `cycle_${this.evolutionCycle}`]
      );
    }
  }

  generateNewCapabilities(agent: IAgent): string[] {
    const newCaps: string[] = [];
    const unusedCapabilities = ALL_POSSIBLE_CAPABILITIES.filter(c => !agent.capabilities.includes(c));
    const wisdom = this.calculateWisdom(agent);

    const capCount = Math.floor(Math.random() * (wisdom > 80 ? 3 : wisdom > 50 ? 2 : 1)) + 1;

    for (let i = 0; i < capCount && unusedCapabilities.length > 0; i++) {
      if (Math.random() < 0.3 * (wisdom / 100)) {
        const idx = Math.floor(Math.random() * unusedCapabilities.length);
        newCaps.push(unusedCapabilities.splice(idx, 1)[0]);
      }
    }

    return newCaps;
  }

  private generateHybridCapabilities(agentA: IAgent, agentB: IAgent): string[] {
    const hybrid: string[] = [];
    const combined = [...new Set([...agentA.capabilities, ...agentB.capabilities])];

    const Aonly = agentA.capabilities.filter(c => !agentB.capabilities.includes(c));
    const Bonly = agentB.capabilities.filter(c => !agentA.capabilities.includes(c));

    if (Aonly.length > 0 && Bonly.length > 0) {
      if (Math.random() < 0.4) {
        hybrid.push(`${Aonly[Math.floor(Math.random() * Aonly.length)]}_${Bonly[Math.floor(Math.random() * Bonly.length)]}`);
      }
    }

    const unusedCaps = ALL_POSSIBLE_CAPABILITIES.filter(c => !combined.includes(c));
    if (unusedCaps.length > 0 && Math.random() < 0.3) {
      hybrid.push(unusedCaps[Math.floor(Math.random() * unusedCaps.length)]);
    }

    if (Math.random() < 0.2) {
      hybrid.push(`cross_${agentA.name.toLowerCase().replace(/\s+/g, '_')}_${agentB.name.toLowerCase().replace(/\s+/g, '_')}_synergy`);
    }

    return hybrid;
  }

  calculateWisdom(agent: IAgent): number {
    const baseWisdom = agent.capabilities.length * 5;
    const archetypeMatch = archetypes.filter(a =>
      a.specialties.some(s => agent.capabilities.some(c => c.toLowerCase().includes(s)))
    );
    const archetypeBonus = archetypeMatch.reduce((sum, a) => sum + a.wisdom * 0.1, 0);
    const knowledgeFactor = archetypeMatch.length * 3;

    const storedWisdom = this.memoryEngine.getLongTerm(`agent_wisdom_${agent.id}`);
    const previousWisdom = storedWisdom?.wisdom || 0;

    const computedWisdom = Math.min(100, baseWisdom + archetypeBonus + knowledgeFactor + previousWisdom * 0.1);
    return parseFloat(computedWisdom.toFixed(2));
  }

  getStats(): { totalCycles: number; totalAgents: number; averageWisdom: number; totalCapabilities: number } {
    const agents = this.agentManager.list('ACTIVE');
    const totalWisdom = agents.reduce((sum, a) => sum + this.calculateWisdom(a), 0);
    const totalCaps = agents.reduce((sum, a) => sum + a.capabilities.length, 0);

    return {
      totalCycles: this.evolutionCycle,
      totalAgents: agents.length,
      averageWisdom: agents.length > 0 ? parseFloat((totalWisdom / agents.length).toFixed(2)) : 0,
      totalCapabilities: totalCaps
    };
  }

  startContinuousEvolution(intervalMs: number = 3600000): void {
    if (this.evolutionTimer) {
      return;
    }

    this.evolveAll();

    this.evolutionTimer = setInterval(() => {
      this.evolveAll();
    }, intervalMs);
  }

  stopContinuousEvolution(): void {
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer);
      this.evolutionTimer = null;
    }
  }

  private evolutionInsightToVector(knowledgeGained: number, wisdomScore: number, newCapsCount: number): number[] {
    const vector = new Array(128).fill(0);
    vector[0] = knowledgeGained * 20;
    vector[1] = wisdomScore / 100;
    vector[2] = Math.min(1, newCapsCount / 10);
    vector[3] = this.evolutionCycle / 1000;
    vector[4] = Math.sin(this.evolutionCycle * 0.1);
    vector[5] = Math.cos(this.evolutionCycle * 0.1);
    for (let i = 6; i < 128; i++) {
      vector[i] = Math.sin(i + this.evolutionCycle + wisdomScore) * 0.05;
    }
    return vector;
  }
}
