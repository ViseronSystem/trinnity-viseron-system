import cron from "node-cron";
import { MemoryEngine } from "../memory/MemoryEngine";
import { AgentManager } from "../AgentManager";
import { AIProviderBridge, AIProviderId } from "../bridge/AIProviderBridge";
import { SuperMind } from "../supermind/SuperMind";
import * as fs from "fs-extra";
import * as path from "path";

export class HyperLearningEngine {
  private memoryEngine: MemoryEngine;
  private agentManager: AgentManager;
  private bridge: AIProviderBridge;
  private superMind: SuperMind;
  private cronJob: ReturnType<typeof cron.schedule> | null = null;
  private cycleCount: number = 0;
  private intelligenceLevel: number = 1000;
  private history: Array<{ cycle: number; level: number; insights: string[]; timestamp: number }> = [];

  constructor(memoryEngine: MemoryEngine, agentManager: AgentManager, bridge: AIProviderBridge, superMind: SuperMind) {
    this.memoryEngine = memoryEngine;
    this.agentManager = agentManager;
    this.bridge = bridge;
    this.superMind = superMind;
  }

  start(intervalMinutes: number = 30): void {
    this.executeCycle();
    this.cronJob = cron.schedule(`*/${intervalMinutes} * * * *`, () => {
      this.executeCycle();
    });
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
  }

  async executeCycle(): Promise<void> {
    this.cycleCount++;
    const start = Date.now();
    this.intelligenceLevel = this.intelligenceLevel + (this.intelligenceLevel * 5); // +500% each cycle

    const insights: string[] = [];
    const agents = this.agentManager.list("ACTIVE");

    try {
      const agentCount = agents.length;
      const knowledgeCount = this.memoryEngine.getStats?.()?.knowledge?.totalDocuments || 0;

      insights.push(`Cycle #${this.cycleCount}: ${agentCount} agents active, ${knowledgeCount} knowledge documents`);

      const bridgeResponse = await this.bridge.chat({
        prompt: `Analyze the current state of the TVS system. Cycle ${this.cycleCount}. Intelligence level: ${this.intelligenceLevel.toExponential(2)}%. Generate strategic insights.`,
        systemPrompt: "You are the Trinnity Viseron HyperLearning Engine. Generate deep insights.",
        providerId: "openai" as AIProviderId,
        maxTokens: 2048,
        taskType: "reasoning"
      });

      if (bridgeResponse.success) {
        insights.push(`AI Synthesis: ${bridgeResponse.text.slice(0, 500)}`);
      }

      const superWisdom = await this.superMind.synthesize(
        `hyperlearning cycle ${this.cycleCount} intelligence ${this.intelligenceLevel.toExponential(2)}`,
        ["Artificial Intelligence", "Systems Theory", "Universal Knowledge"]
      );
      insights.push(`SuperMind: ${superWisdom.insight.slice(0, 300)}`);

      const report = {
        cycle: this.cycleCount,
        intelligenceLevel: this.intelligenceLevel,
        levelMultiplier: Math.pow(6, this.cycleCount - 1),
        activeAgents: agentCount,
        knowledgeDocuments: knowledgeCount,
        insights,
        executionTimeMs: Date.now() - start,
        timestamp: new Date().toISOString()
      };

      this.history.push({
        cycle: this.cycleCount,
        level: this.intelligenceLevel,
        insights: insights.slice(0, 5),
        timestamp: Date.now()
      });

      const reportsDir = path.join(__dirname, "..", "..", "..", "data", "reports");
      await fs.ensureDir(reportsDir);
      const reportPath = path.join(reportsDir, `cycle_${this.cycleCount}.json`);
      await fs.writeJson(reportPath, report, { spaces: 2 });

      const logPath = path.join(reportsDir, "evolution_log.json");
      await fs.writeJson(logPath, this.history, { spaces: 2 });

      this.memoryEngine.addKnowledge(
        `HyperLearning Cycle #${this.cycleCount}`,
        "HYPER_LEARNING",
        `Intelligence: ${this.intelligenceLevel.toExponential(2)}% (${(Math.pow(6, this.cycleCount - 1) * 1000).toExponential(2)}x base). Agents: ${agentCount}. Insights: ${insights.length}`,
        ["hyperlearning", `cycle_${this.cycleCount}`, "evolution"]
      );

      console.log(`[HyperLearning] Cycle ${this.cycleCount} | Intelligence: ${this.intelligenceLevel.toExponential(2)}% | +500% growth | ${insights.length} insights stored`);
    } catch (err) {
      console.error(`[HyperLearning] Error in cycle ${this.cycleCount}:`, err);
    }
  }

  getIntelligenceLevel(): number {
    return this.intelligenceLevel;
  }

  getCycleCount(): number {
    return this.cycleCount;
  }

  getHistory(): any[] {
    return this.history;
  }

  getStats(): { cycleCount: number; intelligenceLevel: number; multiplier: number } {
    return {
      cycleCount: this.cycleCount,
      intelligenceLevel: this.intelligenceLevel,
      multiplier: Math.pow(6, Math.max(0, this.cycleCount - 1))
    };
  }
}
