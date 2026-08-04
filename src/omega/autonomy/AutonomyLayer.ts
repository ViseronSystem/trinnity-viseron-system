import { Kernel } from "../kernel/Kernel";
import { Actor } from "../kernel/Permissions";

export type AutonomyCycleKind = "planning" | "evolution" | "learning";

export interface PlannerTask {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  createdAt: number;
  result?: string;
}

export interface PlannerEngineAdapter {
  getAutonomyLevel(): number;
  getCycleCount(): number;
  getTasks(status?: string): PlannerTask[];
  addTask(task: { title: string; description: string; priority?: string; category?: string }): PlannerTask;
  executeNextTask(): Promise<number>;
  start(): void;
  stop(): void;
}

export interface EvolutionEngineAdapter {
  evolveAll(): Promise<{ agentId: string; cycle: number; wisdomScore: number }[]>;
  getStats(): { totalCycles: number; totalAgents: number; averageWisdom: number; totalCapabilities: number };
  startContinuousEvolution(intervalMs?: number): void;
  stopContinuousEvolution(): void;
}

export interface LearningEngineAdapter {
  executeCycle(): Promise<void>;
  getIntelligenceLevel(): number;
  getCycleCount(): number;
  getStats(): { cycleCount: number; intelligenceLevel: number; multiplier: number };
  start(intervalMinutes?: number): void;
  stop(): void;
}

export interface AutonomyLayerStatus {
  enabled: boolean;
  planning: { autonomyLevel: number; cycleCount: number; pendingTasks: number } | null;
  evolution: { totalCycles: number; totalAgents: number; averageWisdom: number } | null;
  learning: { cycleCount: number; intelligenceLevel: number; multiplier: number } | null;
  lastRuns: Record<AutonomyCycleKind, number>;
}

const ACTOR: Actor = { id: "autonomy", name: "Autonomy Layer", role: "autonomy" };

const PRIORITY_MAP: Record<string, "critical" | "high" | "normal" | "low"> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "normal",
  LOW: "low",
};

export class AutonomyLayer {
  public readonly name = "TVS Autonomy Layer";
  public readonly kernel: Kernel;

  private planner?: PlannerEngineAdapter;
  private evolution?: EvolutionEngineAdapter;
  private learning?: LearningEngineAdapter;
  private lastRuns: Record<AutonomyCycleKind, number> = { planning: 0, evolution: 0, learning: 0 };

  constructor(kernel: Kernel, options?: { planner?: PlannerEngineAdapter; evolution?: EvolutionEngineAdapter; learning?: LearningEngineAdapter }) {
    this.kernel = kernel;
    this.planner = options?.planner;
    this.evolution = options?.evolution;
    this.learning = options?.learning;
  }

  public attachPlanner(adapter: PlannerEngineAdapter): void {
    this.planner = adapter;
  }

  public attachEvolution(adapter: EvolutionEngineAdapter): void {
    this.evolution = adapter;
  }

  public attachLearning(adapter: LearningEngineAdapter): void {
    this.learning = adapter;
  }

  public async runCycle(kind: AutonomyCycleKind): Promise<any> {
    await this.kernel.events.publish("omega:autonomy:run", { kind }, "autonomy");

    let result: any;
    switch (kind) {
      case "planning":
        result = await this.runPlanningCycle();
        break;
      case "evolution":
        result = await this.runEvolutionCycle();
        break;
      case "learning":
        result = await this.runLearningCycle();
        break;
    }

    this.lastRuns[kind] = Date.now();
    await this.kernel.events.publish("omega:autonomy:cycle", { kind, result, at: this.lastRuns[kind] }, "autonomy");
    await this.kernel.recordDecision(`autonomy_${kind}_${this.lastRuns[kind]}`, { kind, at: this.lastRuns[kind], summary: result }, ["autonomy", kind]);
    return result;
  }

  public async submitTask(title: string, description: string, priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM", category = "maintenance"): Promise<any> {
    if (this.planner) {
      return this.planner.addTask({ title, description, priority, category });
    }
    return this.kernel.runTask("autonomy", title, { description, category }, PRIORITY_MAP[priority] ?? "normal", ACTOR);
  }

  public getTasks(): PlannerTask[] {
    return this.planner ? this.planner.getTasks() : [];
  }

  public status(): AutonomyLayerStatus {
    const planning = this.planner
      ? {
          autonomyLevel: this.planner.getAutonomyLevel(),
          cycleCount: this.planner.getCycleCount(),
          pendingTasks: this.planner.getTasks("PENDING").length,
        }
      : null;

    const evolution = this.evolution
      ? (() => {
          const s = this.evolution!.getStats();
          return { totalCycles: s.totalCycles, totalAgents: s.totalAgents, averageWisdom: s.averageWisdom };
        })()
      : null;

    const learning = this.learning ? { ...this.learning.getStats() } : null;

    return {
      enabled: !!(this.planner || this.evolution || this.learning),
      planning,
      evolution,
      learning,
      lastRuns: { ...this.lastRuns },
    };
  }

  private async runPlanningCycle(): Promise<any> {
    if (this.planner) {
      const executed = await this.planner.executeNextTask();
      return { engine: "core-planner", executedTasks: executed, cycle: this.planner.getCycleCount(), autonomyLevel: this.planner.getAutonomyLevel() };
    }

    const status = this.kernel.status();
    const queued: any[] = [];
    if (status.agents.total === 0) {
      queued.push(await this.kernel.runTask("autonomy", "Registar agentes nucleares", { description: "Nenhum agente ativo no runtime" }, "high", ACTOR));
    }
    queued.push(await this.kernel.runTask("autonomy", `Manutenção: ${status.agents.active} agentes ativos, ${status.events.topics} tópicos de eventos`, { description: "Ciclo de manutenção gerado localmente" }, "low", ACTOR));
    return { engine: "internal-planner", generatedTasks: queued.length };
  }

  private async runEvolutionCycle(): Promise<any> {
    if (!this.evolution) return { engine: null, records: 0 };
    const records = await this.evolution.evolveAll();
    return { engine: "core-evolution", records: records.length, agents: records.map((r) => r.agentId) };
  }

  private async runLearningCycle(): Promise<any> {
    if (!this.learning) return { engine: null, cycle: 0 };
    await this.learning.executeCycle();
    return { engine: "core-learning", cycle: this.learning.getCycleCount(), intelligenceLevel: this.learning.getIntelligenceLevel() };
  }
}
