import cron from "node-cron";
import { IAgent, AgentExecutionResult, ModelRoutingCriteria } from "../types";
import { AgentManager } from "../AgentManager";
import { TVSOrchestrator } from "../orchestrator/Orchestrator";
import { MemoryEngine } from "../memory/MemoryEngine";
import { ToolManager } from "../tools/ToolManager";
import { ModelRouter } from "../model-router/ModelRouter";
import { loadPersistentState, savePersistentState } from "../state/PersistentState";

type ScheduledTask = ReturnType<typeof cron.schedule>;

interface PlannerPersisted {
  cycleCount: number;
  autonomyLevel: number;
  tasks: AutonomousTask[];
}

export interface AutonomousTask {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'improvement' | 'creation' | 'maintenance' | 'exploration' | 'optimization';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: number;
  completedAt?: number;
  result?: string;
}

/**
 * AutonomousPlanner — REAL version
 * 
 * Instead of looping the same generic tasks forever, this planner:
 * 1. Scans REAL system state (errors, memory, agent health, API failures)
 * 2. Creates tasks only when there's actual work to do
 * 3. Deduplicates by checking recent task history (not just title)
 * 4. Stops growing autonomy when system is healthy
 * 5. Logs what it actually accomplished
 */
export class AutonomousPlanner {
  private agentManager: AgentManager;
  private orchestrator: TVSOrchestrator;
  private memoryEngine: MemoryEngine;
  private toolManager: ToolManager;
  private modelRouter: ModelRouter;

  private cronJob: ScheduledTask | null = null;
  private tasks: AutonomousTask[] = [];
  private autonomyLevel: number = 0;
  private cycleCount: number = 0;
  private isRunning: boolean = false;

  private autonomousAgent: IAgent;

  constructor(
    agentManager: AgentManager,
    orchestrator: TVSOrchestrator,
    memoryEngine: MemoryEngine,
    toolManager: ToolManager,
    modelRouter: ModelRouter
  ) {
    this.agentManager = agentManager;
    this.orchestrator = orchestrator;
    this.memoryEngine = memoryEngine;
    this.toolManager = toolManager;
    this.modelRouter = modelRouter;

    const persisted = loadPersistentState<PlannerPersisted>("autonomous-planner", { cycleCount: 0, autonomyLevel: 0, tasks: [] });
    if (persisted.cycleCount > 0) {
      this.cycleCount = persisted.cycleCount;
      this.autonomyLevel = persisted.autonomyLevel || 0;
      if (Array.isArray(persisted.tasks)) this.tasks = persisted.tasks;
      console.log(`[AutonomousPlanner] RESUMIDO: ciclo ${this.cycleCount} · autonomia ${this.autonomyLevel}% · ${this.tasks.filter(t => t.status === 'PENDING').length} tarefas pendentes retomadas`);
    } else {
      this.autonomyLevel = 15;
      console.log(`[AutonomousPlanner] PRIMEIRO ARRANQUE: autonomia inicial ${this.autonomyLevel}%`);
    }

    this.autonomousAgent = this.createAutonomousAgent();
    this.agentManager.register(this.autonomousAgent);
  }

  private persist(): void {
    savePersistentState<PlannerPersisted>("autonomous-planner", {
      cycleCount: this.cycleCount,
      autonomyLevel: this.autonomyLevel,
      tasks: this.tasks.slice(-200), // Keep last 200 tasks max
    });
  }

  private createAutonomousAgent(): IAgent {
    return {
      id: "agent_autonomous_planner",
      name: "AutoPilot",
      role: "Autonomous Planner & Executor",
      status: "ACTIVE",
      description: "Agente autónomo que planifica, ejecuta y aprende mejoras del sistema sin intervención humana.",
      capabilities: [
        "autonomous_planning", "task_generation", "system_optimization",
        "app_scaffolding", "self_improvement", "continuous_deployment"
      ],
      execute: async (task: string, context?: Record<string, any>): Promise<AgentExecutionResult> => {
        const start = Date.now();
        try {
          if (task.includes('autonomous:plan')) {
            const tasksCreated = this.generateTasks();
            return {
              agentId: "agent_autonomous_planner",
              agentName: "AutoPilot",
              success: true,
              output: `[AutoPilot] Planificación autónoma completada: ${tasksCreated} tareas generadas`,
              executionTimeMs: Date.now() - start
            };
          }
          if (task.includes('autonomous:execute')) {
            const executed = await this.executeNextTask();
            return {
              agentId: "agent_autonomous_planner",
              agentName: "AutoPilot",
              success: true,
              output: `[AutoPilot] Ejecución autónoma: ${executed} tarea(s) completada(s)`,
              executionTimeMs: Date.now() - start
            };
          }
          return {
            agentId: "agent_autonomous_planner",
            agentName: "AutoPilot",
            success: true,
            output: `[AutoPilot] Procesando: ${task}`,
            executionTimeMs: Date.now() - start
          };
        } catch (err: any) {
          return {
            agentId: "agent_autonomous_planner",
            agentName: "AutoPilot",
            success: false,
            output: '',
            error: err.message || String(err),
            executionTimeMs: Date.now() - start
          };
        }
      }
    };
  }

  public start(): void {
    console.log(`[AutonomousPlanner] Iniciando planificación autónoma (cada 15 minutos)...`);

    if (this.cronJob) { this.cronJob.stop(); this.cronJob = null; }

    this.executePlanningCycle();

    // Every 15 minutes instead of 5 — reduces spam
    this.cronJob = cron.schedule("*/15 * * * *", () => {
      this.executePlanningCycle();
    });
  }

  public stop(): void {
    if (this.cronJob) { this.cronJob.stop(); this.cronJob = null; }
  }

  public async executePlanningCycle(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.cycleCount++;
    (global as any).__TVS_LAST_PLANNER = Date.now();

    try {
      const systemState = this.scanSystem();
      const newTasks = this.generateTasksFromState(systemState);

      // Execute up to 2 pending tasks
      let executed = 0;
      const pendingTasks = this.tasks.filter(t => t.status === 'PENDING');
      for (const task of pendingTasks.slice(0, 2)) {
        await this.executeTask(task);
        executed++;
      }

      this.memoryEngine.setLongTerm(`autonomous_cycle_${Date.now()}`, {
        cycle: this.cycleCount,
        autonomyLevel: this.autonomyLevel,
        tasksCreated: newTasks,
        tasksExecuted: executed,
        pendingTasks: this.tasks.filter(t => t.status === 'PENDING').length,
        completedTasks: this.tasks.filter(t => t.status === 'COMPLETED').length,
        timestamp: Date.now()
      }, ['autonomous', 'planning', `cycle_${this.cycleCount}`]);

      // Autonomy grows only if there's real work — stops at 60%
      const pendingCount = this.tasks.filter(t => t.status === 'PENDING').length;
      if (pendingCount > 0 && this.autonomyLevel < 60) {
        this.autonomyLevel = Math.min(60, this.autonomyLevel + 3);
      }

      this.persist();

      if (newTasks > 0 || executed > 0) {
        console.log(`[AutonomousPlanner] Cycle #${this.cycleCount}: ${newTasks} tasks created, ${executed} executed, ${pendingCount} pending, autonomy ${this.autonomyLevel}%`);
      }
    } catch (err) {
      console.error(`[AutonomousPlanner] Error in cycle #${this.cycleCount}:`, err);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Scan REAL system state — not just agent/tool counts
   */
  private scanSystem(): any {
    const memoryStats = this.memoryEngine.getStats();
    const agents = this.agentManager.list();
    const tools = this.toolManager.listTools();

    // Check for REAL issues
    let errorCount = 0;
    let recentErrors: string[] = [];
    try {
      const fs = require("fs");
      const path = require("path");
      const logPath = path.resolve(process.cwd(), "data", "knowledge", "agent-activity.jsonl");
      if (fs.existsSync(logPath)) {
        const lines = fs.readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean);
        const recent = lines.slice(-100);
        errorCount = recent.filter((l: string) => l.includes("error") || l.includes("failed")).length;
        recentErrors = recent.filter((l: string) => l.includes("error")).slice(-5).map((l: string) => {
          try { return JSON.parse(l).action || "unknown"; } catch { return "unknown"; }
        });
      }
    } catch {}

    // Check memory pressure
    const stmItems = (memoryStats as any)?.shortTerm?.totalItems || 0;
    const ltmItems = (memoryStats as any)?.longTerm?.totalItems || 0;

    return {
      memory: memoryStats,
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'ACTIVE').length,
        roles: [...new Set(agents.map(a => a.role))]
      },
      tools: {
        total: tools.length,
        types: [...new Set(tools.map(t => t.type))]
      },
      errors: { count: errorCount, recent: recentErrors },
      memoryPressure: { stm: stmItems, ltm: ltmItems },
      timestamp: Date.now()
    };
  }

  /**
   * Generate tasks based on REAL system needs — not always the same generic tasks
   */
  private generateTasksFromState(state: any): number {
    let count = 0;
    const recentTaskTitles = this.tasks
      .filter(t => t.createdAt > Date.now() - 3600000) // last hour
      .map(t => t.title);

    // Only create tasks when there's actual need

    // 1) Memory consolidation — only if STM is actually full
    if ((state.memoryPressure?.stm ?? 0) > 50) {
      const title = "Consolidar memoria STM";
      if (!recentTaskTitles.includes(title)) {
        this.addTask({
          title,
          description: `Hay ${state.memoryPressure.stm} items en STM. Consolidar a LTM para preservar conocimiento.`,
          priority: 'MEDIUM',
          category: 'maintenance'
        });
        count++;
      }
    }

    // 2) Error recovery — only if there are actual errors
    if (state.errors.count > 3) {
      const title = "Revisar errores del sistema";
      if (!recentTaskTitles.includes(title)) {
        this.addTask({
          title,
          description: `${state.errors.count} errores recientes detectados: ${state.errors.recent.join(", ")}. Investigar y corregir.`,
          priority: 'HIGH',
          category: 'optimization'
        });
        count++;
      }
    }

    // 3) Tool gap — only if agent count is high but tools are low
    if (state.agents.total > 20 && state.tools.total < 5) {
      const title = "Crear herramientas de automatización";
      if (!recentTaskTitles.includes(title)) {
        this.addTask({
          title,
          description: `${state.agents.total} agentes pero solo ${state.tools.total} herramientas. Crear herramientas para expandir capacidades.`,
          priority: 'HIGH',
          category: 'creation'
        });
        count++;
      }
    }

    // 4) Knowledge gap — only if memory has very few LTM items
    if (state.memoryPressure.ltm < 10 && this.cycleCount > 5) {
      const title = "Ampliar base de conocimiento";
      if (!recentTaskTitles.includes(title)) {
        this.addTask({
          title,
          description: `Solo ${state.memoryPressure.ltm} items en LTM. Generar conocimiento a partir de operaciones recientes.`,
          priority: 'MEDIUM',
          category: 'improvement'
        });
        count++;
      }
    }

    return count;
  }

  public addTask(task: Omit<AutonomousTask, 'id' | 'status' | 'createdAt'>): AutonomousTask {
    const newTask: AutonomousTask = {
      ...task,
      id: `auto_task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'PENDING',
      createdAt: Date.now()
    };

    // Deduplicate by title + recent status
    const exists = this.tasks.some(t =>
      t.title === task.title && t.status !== 'COMPLETED' && t.status !== 'FAILED'
    );
    if (exists) return newTask;

    this.tasks.push(newTask);

    // Prune old tasks
    if (this.tasks.length > 200) {
      const terminal = this.tasks.filter(t => t.status === 'COMPLETED' || t.status === 'FAILED');
      const removeCount = this.tasks.length - 200;
      const toRemove = terminal.slice(0, removeCount);
      const removeIds = new Set(toRemove.map(t => t.id));
      this.tasks = this.tasks.filter(t => !removeIds.has(t.id));
    }

    console.log(`[AutonomousPlanner] Task created: [${task.priority}] ${task.title}`);
    return newTask;
  }

  private async executeTask(task: AutonomousTask): Promise<boolean> {
    task.status = 'IN_PROGRESS';

    try {
      const report = await this.orchestrator.orchestrate(task.title, task.description, {
        taskType: this.mapCategoryToTaskType(task.category),
        qualityRequired: 'HIGH'
      });

      task.status = report.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
      task.completedAt = Date.now();
      task.result = report.overallOutput;

      console.log(`[AutonomousPlanner] Task "${task.title}" → ${task.status}`);
      return task.status === 'COMPLETED';
    } catch (err: any) {
      task.status = 'FAILED';
      task.completedAt = Date.now();
      task.result = `Error: ${err.message}`;
      console.error(`[AutonomousPlanner] Error executing "${task.title}":`, err.message);
      return false;
    }
  }

  public async executeNextTask(): Promise<number> {
    const pending = this.tasks.filter(t => t.status === 'PENDING');
    if (pending.length === 0) return 0;

    let count = 0;
    for (const task of pending.slice(0, 3)) {
      await this.executeTask(task);
      count++;
    }
    return count;
  }

  private mapCategoryToTaskType(category: AutonomousTask['category']): ModelRoutingCriteria['taskType'] {
    switch (category) {
      case 'creation': return 'code';
      case 'improvement': return 'reasoning';
      case 'exploration': return 'research';
      case 'optimization': return 'reasoning';
      case 'maintenance': return 'automation';
      default: return 'general';
    }
  }

  private generateTasks(): number {
    const state = this.scanSystem();
    return this.generateTasksFromState(state);
  }

  public getTasks(filter?: AutonomousTask['status']): AutonomousTask[] {
    if (filter) return this.tasks.filter(t => t.status === filter);
    return this.tasks;
  }

  public getAutonomyLevel(): number {
    return this.autonomyLevel;
  }

  public getCycleCount(): number {
    return this.cycleCount;
  }
}
