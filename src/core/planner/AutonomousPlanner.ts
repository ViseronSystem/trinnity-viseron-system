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
 * AutonomousPlanner - Motor de Planificación Autónoma
 * 
 * Capacidades:
 *  - Escanea el sistema periódicamente para detectar oportunidades de mejora
 *  - Genera tareas autónomas basadas en el estado del sistema
 *  - Ejecuta tareas usando el orquestador multi-agente
 *  - Aprende de resultados para mejorar planificaciones futuras
 *  - Autonomía progresiva: aumenta su iniciativa con cada ciclo
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

    // RETOMA: tarefas pendentes, autonomia e ciclos sobrevivem a restarts.
    const persisted = loadPersistentState<PlannerPersisted>("autonomous-planner", { cycleCount: 0, autonomyLevel: 0, tasks: [] });
    if (persisted.cycleCount > 0) {
      this.cycleCount = persisted.cycleCount;
      this.autonomyLevel = persisted.autonomyLevel || 0;
      if (Array.isArray(persisted.tasks)) this.tasks = persisted.tasks;
      console.log(`[AutonomousPlanner] RESUMIDO: ciclo ${this.cycleCount} · autonomia ${this.autonomyLevel}% · ${this.tasks.filter(t => t.status === 'PENDING').length} tarefas pendentes retomadas`);
    } else {
      // Primeiro arranque: autonomia de partida 15% para o primeiro ciclo já
      // produzir tarefas úteis (auditoria, consolidação, reativação).
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
      tasks: this.tasks,
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
    console.log(`[AutonomousPlanner] Iniciando planificación autónoma (cada 5 minutos)...`);

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    // Ejecución inicial
    this.executePlanningCycle();

    // Ciclo recurrente cada 5 minutos (antes 30 — demasiado parado)
    this.cronJob = cron.schedule("*/5 * * * *", () => {
      this.executePlanningCycle();
    });
  }

  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log(`[AutonomousPlanner] Planificación autónoma detenida.`);
    }
  }

  public async executePlanningCycle(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.cycleCount++;
    (global as any).__TVS_LAST_PLANNER = Date.now();

    console.log(`\n==================================================`);
    console.log(`[AutonomousPlanner] Ciclo de Planificación #${this.cycleCount}`);
    console.log(`[AutonomousPlanner] Nivel de Autonomía: ${this.autonomyLevel}`);
    console.log(`==================================================\n`);

    try {
      // 1. Escanear el sistema
      const systemState = this.scanSystem();

      // 2. Generar tareas basadas en el estado
      const newTasks = this.generateTasksFromState(systemState);

      // 3. Ejecutar tareas pendientes (máximo 2 por ciclo)
      let executed = 0;
      const pendingTasks = this.tasks.filter(t => t.status === 'PENDING');
      for (const task of pendingTasks.slice(0, 2)) {
        await this.executeTask(task);
        executed++;
      }

      // 4. Registrar el ciclo en memoria
      this.memoryEngine.setLongTerm(`autonomous_cycle_${Date.now()}`, {
        cycle: this.cycleCount,
        autonomyLevel: this.autonomyLevel,
        tasksCreated: newTasks,
        tasksExecuted: executed,
        pendingTasks: this.tasks.filter(t => t.status === 'PENDING').length,
        completedTasks: this.tasks.filter(t => t.status === 'COMPLETED').length,
        timestamp: Date.now()
      }, ['autonomous', 'planning', `cycle_${this.cycleCount}`]);

      // 5. Incrementar autonomía gradualmente (sube +5 por ciclo; nunca queda parado)
      this.autonomyLevel = Math.min(100, this.autonomyLevel + 5);
      console.log(`[AutonomousPlanner] Autonomía incrementada a ${this.autonomyLevel}%`);

      console.log(`\n==================================================`);
      console.log(`[AutonomousPlanner] Ciclo #${this.cycleCount} completado`);
      console.log(`[AutonomousPlanner] Tareas pendientes: ${this.tasks.filter(t => t.status === 'PENDING').length}`);
      console.log(`[AutonomousPlanner] Tareas completadas: ${this.tasks.filter(t => t.status === 'COMPLETED').length}`);
      console.log(`[AutonomousPlanner] Autonomía actual: ${this.autonomyLevel}%`);
      console.log(`==================================================\n`);

      // Guardar estado: nunca perder tarefas/ciclos num restart.
      this.persist();

    } catch (err) {
      console.error(`[AutonomousPlanner] Error en ciclo #${this.cycleCount}:`, err);
    } finally {
      this.isRunning = false;
    }
  }

  private scanSystem(): any {
    const memoryStats = this.memoryEngine.getStats();
    const agents = this.agentManager.list();
    const tools = this.toolManager.listTools();

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
      timestamp: Date.now()
    };
  }

  private generateTasksFromState(state: any): number {
    let count = 0;

    // SEMPRE há trabalho: cada ciclo produz ao menos tarefas úteis reais,
    // mesmo com autonomia baixa — nada de ficar parado.
    // 1) Revisión de estado (autonomía >= 1)
    if (this.autonomyLevel >= 1) {
      const active = state.agents.active ?? 0;
      const total = state.agents.total ?? 0;
      const tools = state.tools.total ?? 0;
      this.addTask({
        title: "Auditar estado del sistema",
        description: `Revisar ${total} agentes (${active} activos) y ${tools} herramientas; generar informe de salud y oportunidades de mejora.`,
        priority: 'LOW',
        category: 'optimization'
      });
      count++;
    }

    // 2) Consolidar memoria (STM supera 10 items)
    if ((state.memory?.shortTerm?.totalItems ?? 0) > 10) {
      this.addTask({
        title: "Consolidar memoria STM",
        description: `Hay ${state.memory.shortTerm.totalItems} items en STM. Consolidar a LTM para preservar conocimiento.`,
        priority: 'MEDIUM',
        category: 'maintenance'
      });
      count++;
    }

    // 3) Reactivar agentes inactivos (autonomía >= 10)
    if (this.autonomyLevel >= 10 && state.agents.active < state.agents.total) {
      this.addTask({
        title: "Reactivar agentes inactivos",
        description: `Solo ${state.agents.active} de ${state.agents.total} agentes están activos. Evaluar reactivación.`,
        priority: 'MEDIUM',
        category: 'optimization'
      });
      count++;
    }

    if (this.autonomyLevel >= 20) {
      this.addTask({
        title: "Auto-mejora del sistema",
        description: "Analizar logs y memoria para identificar y aplicar optimizaciones automáticas en el core del sistema.",
        priority: 'HIGH',
        category: 'improvement'
      });
      count++;
    }

    if (this.autonomyLevel >= 30) {
      this.addTask({
        title: "Generar nuevo agente especializado",
        description: `Basado en las necesidades actuales del sistema, crear un nuevo agente con capacidades específicas.`,
        priority: 'HIGH',
        category: 'creation'
      });
      count++;
    }

    if (this.autonomyLevel >= 40) {
      this.addTask({
        title: "Explorar nuevas integraciones",
        description: "Buscar en la base de conocimiento posibilidades de nuevas herramientas o integraciones para expandir capacidades.",
        priority: 'LOW',
        category: 'exploration'
      });
      count++;
    }

    if (this.autonomyLevel >= 50 && state.tools.total < 5) {
      this.addTask({
        title: "Crear herramientas de automatización",
        description: `Solo hay ${state.tools.total} herramientas registradas. Generar nuevas herramientas para expandir capacidades.`,
        priority: 'HIGH',
        category: 'creation'
      });
      count++;
    }

    if (this.cycleCount % 5 === 0 && this.autonomyLevel >= 60) {
      this.addTask({
        title: "Optimización profunda del sistema",
        description: "Ejecutar ciclo de optimización integral: limpiar memoria, reindexar, actualizar perfiles de modelo y compactar almacenamiento.",
        priority: 'CRITICAL',
        category: 'optimization'
      });
      count++;
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

    // Evitar duplicados
    const exists = this.tasks.some(t =>
      t.title === task.title && t.status !== 'COMPLETED'
    );
    if (exists) return newTask;

    this.tasks.push(newTask);

    // Podar tareas antiguas completadas/fallidas para no crecer sin límite
    if (this.tasks.length > 500) {
      const terminal = this.tasks.filter(t => t.status === 'COMPLETED' || t.status === 'FAILED');
      const removeCount = this.tasks.length - 500;
      const toRemove = terminal.slice(0, removeCount);
      const removeIds = new Set(toRemove.map(t => t.id));
      this.tasks = this.tasks.filter(t => !removeIds.has(t.id));
    }

    console.log(`[AutonomousPlanner] Tarea autónoma creada: [${task.priority}] ${task.title}`);
    return newTask;
  }

  private async executeTask(task: AutonomousTask): Promise<boolean> {
    task.status = 'IN_PROGRESS';
    console.log(`\n-> Ejecutando tarea autónoma: "${task.title}"...`);

    try {
      const report = await this.orchestrator.orchestrate(task.title, task.description, {
        taskType: this.mapCategoryToTaskType(task.category),
        qualityRequired: 'HIGH'
      });

      task.status = report.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
      task.completedAt = Date.now();
      task.result = report.overallOutput;

      console.log(`[AutonomousPlanner] Tarea "${task.title}" ${task.status === 'COMPLETED' ? 'COMPLETADA' : 'FALLÓ'}`);
      return task.status === 'COMPLETED';
    } catch (err: any) {
      task.status = 'FAILED';
      task.completedAt = Date.now();
      task.result = `Error: ${err.message}`;
      console.error(`[AutonomousPlanner] Error ejecutando tarea "${task.title}":`, err.message);
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
