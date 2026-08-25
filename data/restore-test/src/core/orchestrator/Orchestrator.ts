import { AgentManager } from "../AgentManager";
import { ModelRouter } from "../model-router/ModelRouter";
import { MemoryEngine } from "../memory/MemoryEngine";
import { ToolManager } from "../tools/ToolManager";
import { 
  TVSTask, 
  OrchestrationReport, 
  AgentExecutionResult, 
  ModelRoutingCriteria 
} from "../types";

/**
 * TVSOrchestrator - Motor Principal de Coordinación para Trinnity Viseron System v2.0
 */
export class TVSOrchestrator {
  public agentManager: AgentManager;
  public modelRouter: ModelRouter;
  public memoryEngine: MemoryEngine;
  public toolManager: ToolManager;

  // Retrocompatibilidad con array directo de agentes
  public agents: any[] = [];

  constructor(
    agentManager?: AgentManager,
    modelRouter?: ModelRouter,
    memoryEngine?: MemoryEngine,
    toolManager?: ToolManager
  ) {
    this.agentManager = agentManager || new AgentManager();
    this.modelRouter = modelRouter || new ModelRouter();
    this.memoryEngine = memoryEngine || new MemoryEngine();
    this.toolManager = toolManager || new ToolManager();
  }

  /**
   * Registro de agentes con soporte retrocompatible.
   */
  public register(agent: any): void {
    this.agents.push(agent);
    this.agentManager.add(agent);
    console.log(`[TVSOrchestrator] Agente registrado: ${agent.name || 'Desconocido'}`);
  }

  public add(agent: any): void {
    this.register(agent);
  }

  /**
   * Procesa y coordina una tarea principal a través del ecosistema multiagente.
   */
  public async orchestrate(taskTitle: string, taskDescription: string, criteria?: ModelRoutingCriteria): Promise<OrchestrationReport> {
    const startTime = Date.now();
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    console.log(`\n==================================================`);
    console.log(`[TVSOrchestrator] Iniciando Orquestación (ID: ${taskId})`);
    console.log(`Tarea: "${taskTitle}"`);
    console.log(`==================================================\n`);

    // 1. Registrar en Memoria a Corto Plazo
    this.memoryEngine.addShortTerm(taskId, 'user', taskDescription, { taskTitle });

    // 2. Selección Inteligente del Modelo recomendante
    const routing = this.modelRouter.route(criteria || {
      taskType: this.inferTaskType(taskTitle + " " + taskDescription)
    });
    console.log(`[TVSOrchestrator] Modelo Asignado: ${routing.provider} (${routing.reason})`);

    // 3. Descomposición de la Tarea en Subtareas
    const subtasks = this.decomposeTask(taskTitle, taskDescription);
    console.log(`[TVSOrchestrator] Tarea dividida en ${subtasks.length} subtareas.`);

    // 4. Asignación y Ejecución por Agentes
    const subtaskResults: AgentExecutionResult[] = [];

    for (const subtask of subtasks) {
      console.log(`\n-> Ejecutando Subtarea: "${subtask.title}"...`);
      
      const targetAgents = this.agentManager.getAgentsByRole(subtask.requiredRole);
      let agentToRun = targetAgents.find(a => a.status === 'ACTIVE') || this.agentManager.list('ACTIVE')[0];

      if (!agentToRun) {
        const fallback = this.agentManager.list()[0];
        if (fallback) agentToRun = fallback;
      }

      if (agentToRun) {
        const res = await this.agentManager.run(agentToRun.id, subtask.description, {
          taskId,
          subtaskId: subtask.id,
          modelProvider: routing.provider
        });
        subtaskResults.push(res);
        this.memoryEngine.addShortTerm(taskId, 'agent', res.output, { agentName: res.agentName });
      } else {
        subtaskResults.push({
          agentId: 'system',
          agentName: 'SystemFallback',
          success: false,
          output: '',
          error: `Sin agentes disponibles para procesar subtarea '${subtask.title}'`,
          executionTimeMs: 0
        });
      }
    }

    // 5. Sintetizar Resultados y Crear Reporte
    const totalDuration = Date.now() - startTime;
    const overallSuccess = subtaskResults.every(r => r.success);
    const overallOutput = subtaskResults.map(r => `[${r.agentName}]: ${r.output || r.error}`).join('\n');

    this.memoryEngine.setLongTerm(taskId, {
      taskTitle,
      overallSuccess,
      subtasksCount: subtasks.length,
      durationMs: totalDuration
    }, ['task_history', 'orchestration']);

    console.log(`\n==================================================`);
    console.log(`[TVSOrchestrator] Orquestación Finalizada en ${totalDuration}ms. Éxito: ${overallSuccess}`);
    console.log(`==================================================\n`);

    return {
      taskId,
      status: overallSuccess ? 'COMPLETED' : 'FAILED',
      subtaskResults,
      overallOutput,
      durationMs: totalDuration
    };
  }

  public async execute(task: string): Promise<void> {
    await this.run(task);
  }

  public async run(task: string): Promise<void> {
    console.log(`[TVSOrchestrator] TVS TASK: ${task}`);
    for (const agent of this.agents) {
      if (typeof agent.run === 'function') {
        agent.run(task);
      }
      if (typeof agent.execute === 'function') {
        await agent.execute(task);
      }
    }
  }

  private inferTaskType(text: string): ModelRoutingCriteria['taskType'] {
    const t = text.toLowerCase();
    if (t.includes('codigo') || t.includes('programar') || t.includes('desarrollar')) return 'code';
    if (t.includes('investigar') || t.includes('analizar')) return 'research';
    if (t.includes('razonar') || t.includes('arquitectura')) return 'reasoning';
    if (t.includes('automatizar') || t.includes('n8n')) return 'automation';
    return 'general';
  }

  private decomposeTask(title: string, description: string): Array<{ id: string; title: string; description: string; requiredRole: string }> {
    return [
      {
        id: 'sub_1',
        title: 'Análisis y Arquitectura',
        description: `Analizar requerimientos para: ${title}. ${description}`,
        requiredRole: 'Architect'
      },
      {
        id: 'sub_2',
        title: 'Desarrollo de Solución',
        description: `Implementar código/solución para: ${title}`,
        requiredRole: 'Developer'
      },
      {
        id: 'sub_3',
        title: 'Verificación de Seguridad',
        description: `Revisar y auditar la seguridad de la solución para: ${title}`,
        requiredRole: 'Security'
      }
    ];
  }
}

// Alias de exportación para compatibilidad total
export class Orchestrator extends TVSOrchestrator {}
