import cron from "node-cron";
import { MemoryEngine } from "../memory/MemoryEngine";
import { AgentManager } from "../AgentManager";
import { AIProviderBridge, AIProviderId } from "../bridge/AIProviderBridge";
import { SuperMind } from "../supermind/SuperMind";
import * as fs from "fs-extra";
import * as path from "path";

const MAX_HISTORY = 200;

export class HyperLearningEngine {
  private memoryEngine: MemoryEngine;
  private agentManager: AgentManager;
  private bridge: AIProviderBridge;
  private superMind: SuperMind;
  private cronJob: ReturnType<typeof cron.schedule> | null = null;
  private cycleCount: number = 0;
  private intelligenceLevel: number = 1000;
  private isRunning: boolean = false;
  private history: Array<{ cycle: number; level: number; insights: string[]; timestamp: number }> = [];

  constructor(memoryEngine: MemoryEngine, agentManager: AgentManager, bridge: AIProviderBridge, superMind: SuperMind) {
    this.memoryEngine = memoryEngine;
    this.agentManager = agentManager;
    this.bridge = bridge;
    this.superMind = superMind;
    // RETOMA do estado persistido (resume, nunca reset): o progresso autónomo
    // (ciclos + nível de inteligência) sobrevive aos restarts do TVS.
    this.loadState();
  }

  private getReportsDir(): string {
    const candidates = [
      path.join(process.cwd(), "data", "reports"),
      path.join(__dirname, "..", "..", "..", "data", "reports")
    ];
    return candidates.find((p) => fs.existsSync(p)) || candidates[0];
  }

  private loadState(): void {
    try {
      const reportsDir = this.getReportsDir();
      const logPath = path.join(reportsDir, "evolution_log.json");
      let lastCycle = 0;
      let lastLevel = 1000;

      if (fs.existsSync(logPath)) {
        const saved = fs.readJsonSync(logPath) as Array<{ cycle: number; level: number; insights: string[]; timestamp: number }>;
        if (Array.isArray(saved) && saved.length) {
          this.history = saved;
          const last = saved[saved.length - 1];
          if (last && typeof last.cycle === "number") lastCycle = last.cycle;
          if (last && typeof last.level === "number") lastLevel = last.level;
        }
      }

      // Fallback: se o evolution_log foi clobbered mas os relatórios por ciclo
      // sobreviveram (cycle_N.json), retomar do ciclo mais alto encontrado.
      try {
        const files = fs.readdirSync(reportsDir).filter((f) => /^cycle_(\d+)\.json$/.test(f));
        for (const f of files) {
          const m = /^cycle_(\d+)\.json$/.exec(f);
          if (!m) continue;
          const c = parseInt(m[1], 10);
          if (c > lastCycle) {
            const rep = fs.readJsonSync(path.join(reportsDir, f));
            lastCycle = c;
            if (typeof rep?.intelligenceLevel === "number") lastLevel = rep.intelligenceLevel;
          }
        }
      } catch {}

      if (lastCycle > 0) {
        this.cycleCount = lastCycle;
        this.intelligenceLevel = Math.max(this.intelligenceLevel, lastLevel);
        console.log(`[HyperLearning] RESUMIDO do estado persistido: ciclo ${this.cycleCount} · inteligência ${this.intelligenceLevel.toFixed(0)} (continua, não reinicia)`);
      }
    } catch (err) {
      console.warn(`[HyperLearning] loadState falhou (a começar do zero): ${(err as any)?.message || err}`);
    }
  }

  start(intervalMinutes: number = 30): void {
    if (this.cronJob) {
      this.stop();
    }
    this.executeCycle();
    this.cronJob = cron.schedule(`2-59/${intervalMinutes} * * * *`, () => {
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
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      await this.runCycle();
    } finally {
      this.isRunning = false;
    }
  }

  private async runCycle(): Promise<void> {
    this.cycleCount++;
    (global as any).__TVS_LAST_HYPER = Date.now();
    const start = Date.now();
    const multiplier = Math.min(Math.pow(1.05, Math.max(0, this.cycleCount - 1)), 20);
    this.intelligenceLevel = Math.min(this.intelligenceLevel * 1.05, 1_000_000); // +5% each cycle (capped)

    const insights: string[] = [];
    const agents = this.agentManager.list("ACTIVE");

    try {
      const agentCount = agents.length;
      const knowledgeCount = this.memoryEngine.getStats?.()?.knowledge?.totalDocuments || 0;

      insights.push(`Cycle #${this.cycleCount}: ${agentCount} agents active, ${knowledgeCount} knowledge documents`);

      const bridgeResponse = await this.bridge.chat({
        prompt: `Analyze the current state of the TVS system. Cycle ${this.cycleCount}. Intelligence level: ${this.intelligenceLevel.toExponential(2)}%. Generate strategic insights.`,
        systemPrompt: "You are the Trinnity Viseron HyperLearning Engine. Generate deep insights.",
        providerId: "ollama" as AIProviderId,
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
        intelligenceLevel: Math.round(this.intelligenceLevel),
        levelMultiplier: multiplier,
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
      if (this.history.length > MAX_HISTORY) {
        this.history = this.history.slice(-MAX_HISTORY);
      }

      const reportsDir = (() => {
        const candidates = [
          path.join(process.cwd(), "data", "reports"),
          path.join(__dirname, "..", "..", "..", "data", "reports")
        ];
        return candidates.find((p) => fs.existsSync(p)) || candidates[0];
      })();
      await fs.ensureDir(reportsDir);
      const reportPath = path.join(reportsDir, `cycle_${this.cycleCount}.json`);
      await fs.writeJson(reportPath, report, { spaces: 2 });

      const logPath = path.join(reportsDir, "evolution_log.json");
      // APPEND ao histórico persistido (nunca sobrescrever): se o ficheiro já
      // existir, carrega-o e adiciona o ciclo novo — o progresso entre restarts
      // nunca é perdido.
      let persisted: Array<{ cycle: number; level: number; insights: string[]; timestamp: number }> = [];
      try {
        if (fs.existsSync(logPath)) {
          const existing = fs.readJsonSync(logPath);
          if (Array.isArray(existing)) persisted = existing;
        }
      } catch {}
      this.history = [...persisted, ...this.history.filter((h) => !persisted.some((p) => p.cycle === h.cycle))];
      await fs.writeJson(logPath, this.history, { spaces: 2 });

      this.memoryEngine.addKnowledge(
        `HyperLearning Cycle #${this.cycleCount}`,
        "HYPER_LEARNING",
        `Intelligence: ${this.intelligenceLevel.toFixed(0)} (${(multiplier * 1000).toFixed(0)}x base). Agents: ${agentCount}. Insights: ${insights.length}`,
        ["hyperlearning", `cycle_${this.cycleCount}`, "evolution"]
      );

      console.log(`[HyperLearning] Cycle ${this.cycleCount} | Intelligence: ${this.intelligenceLevel.toFixed(0)} | +5% growth | ${insights.length} insights stored`);
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
      multiplier: Math.min(Math.pow(1.05, Math.max(0, this.cycleCount - 1)), 20)
    };
  }
}
