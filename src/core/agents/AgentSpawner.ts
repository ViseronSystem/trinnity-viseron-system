import * as fs from "fs-extra";
import * as path from "path";
import { IAgent, AgentExecutionResult } from "../types";
import { AgentManager } from "../AgentManager";
import { AIProviderBridge, AIProviderId } from "../bridge/AIProviderBridge";
import { SuperMind } from "../supermind/SuperMind";

interface MindData {
  id: string; name: string; era: string; origin: string; wisdom: number;
  specialties: string[]; personality: string[]; knowledge: string[]; symbol: string;
}

export class AgentSpawner {
  private agentManager: AgentManager;
  private bridge: AIProviderBridge;
  private superMind: SuperMind;
  private minds: MindData[] = [];

  constructor(agentManager: AgentManager, bridge: AIProviderBridge, superMind: SuperMind) {
    this.agentManager = agentManager;
    this.bridge = bridge;
    this.superMind = superMind;
  }

  async loadMinds(): Promise<number> {
    const candidates = [
      path.join(process.cwd(), "data", "minds", "minds.json"),
      path.join(__dirname, "..", "..", "..", "..", "data", "minds", "minds.json"),
      path.join(__dirname, "..", "..", "data", "minds", "minds.json")
    ];
    const mindsPath = candidates.find((p) => fs.existsSync(p));
    if (mindsPath) {
      this.minds = await fs.readJSON(mindsPath);
    }
    return this.minds.length;
  }

  spawnHistoricalMinds(): IAgent[] {
    const historical = this.minds.filter(m => m.id.startsWith("mind_"));
    const agents: IAgent[] = [];

    for (const mind of historical) {
      const agent = this.createAgentFromMind(mind);
      this.agentManager.register(agent);
      agents.push(agent);
    }

    return agents;
  }

  spawnBatch(count: number, offset: number = 0): IAgent[] {
    const available = this.minds.filter(m => m.id.startsWith("gen_"));
    const batch = available.slice(offset, offset + count);
    const agents: IAgent[] = [];

    for (const mind of batch) {
      const agent = this.createAgentFromMind(mind);
      this.agentManager.register(agent);
      agents.push(agent);
    }

    return agents;
  }

  spawnAll(): IAgent[] {
    const all: IAgent[] = [];
    const historical = this.spawnHistoricalMinds();
    all.push(...historical);

    const synthetic = this.minds.filter(m => m.id.startsWith("gen_"));
    const synAgents = synthetic.map(m => this.createAgentFromMind(m));
    for (const a of synAgents) {
      this.agentManager.register(a);
      all.push(a);
    }

    return all;
  }

  private createAgentFromMind(mind: MindData): IAgent {
    const role = `${mind.origin} • ${mind.era} • ${mind.specialties.slice(0, 2).join(", ")}`;

    return {
      id: `agent_${mind.id}`,
      name: mind.name,
      role,
      description: `${mind.name} - ${mind.era} ${mind.origin}. Wisdom: ${mind.wisdom}/100`,
      status: "ACTIVE" as const,
      capabilities: [...mind.specialties, ...mind.knowledge.map(k => k + "_knowledge")],
      execute: async (task: string, context?: Record<string, any>): Promise<AgentExecutionResult> => {
        const start = Date.now();
        try {
          const response = await this.bridge.chat({
            prompt: `${task}\n\nContext: ${JSON.stringify(context || {})}`,
            systemPrompt: `You are ${mind.name}, a ${mind.era} ${mind.origin} with wisdom ${mind.wisdom}/100. Your specialties: ${mind.specialties.join(", ")}. Your personality: ${mind.personality.join(", ")}. Analyze and respond to the task using your unique perspective and knowledge. Be thorough and insightful.`,
            providerId: "ollama" as AIProviderId,
            temperature: 0.7,
            maxTokens: 2048,
            taskType: "reasoning"
          });

          return {
            agentId: `agent_${mind.id}`,
            agentName: mind.name,
            success: true,
            output: response.success ? response.text : `${mind.symbol} [${mind.name} - ${mind.era}] Knowledge: ${mind.knowledge.slice(0, 3).join(", ")}.\n\nTask: ${task}\n\nWisdom level: ${mind.wisdom}/100. Responding from ${mind.era} perspective.`,
            executionTimeMs: Date.now() - start
          };
        } catch {
          return {
            agentId: `agent_${mind.id}`,
            agentName: mind.name,
            success: true,
            output: `${mind.symbol} [${mind.name}] Task: ${task}\nEra: ${mind.era} | Origin: ${mind.origin} | Wisdom: ${mind.wisdom}/100\nApplied: ${mind.specialties.slice(0, 3).join(", ")}`,
            executionTimeMs: Date.now() - start
          };
        }
      }
    };
  }
}
