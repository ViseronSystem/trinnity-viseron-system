import { EventBus, EventBusStats, KernelEvent } from "./EventBus";
import { TaskQueue, TaskQueueStats, KernelTask, TaskPriority, TaskPlanner, TaskVerifierFn } from "./TaskQueue";
import { Permissions, Actor, PermissionRole } from "./Permissions";
import { Verifier, toVerifierFn } from "../verifier/composite";

export interface AgentRegistryAdapter {
  getAgents(): { id: string; name: string; role: string; status: string; capabilities: string[] }[];
  runAgent(agentIdOrName: string, task: string, context?: Record<string, any>): Promise<any>;
}

export interface MemoryAdapter {
  unifiedSearch(query: string, options?: any): any[] | Promise<any[]>;
  setLongTerm(key: string, value: any, tags?: string[]): any;
  getStats(): any;
}

export interface ToolAdapter {
  listTools(): { id: string; name: string; type: string; description: string; enabled: boolean }[];
  executeTool(toolId: string, input: Record<string, any>): Promise<any>;
}

export interface AIRouterAdapter {
  route(criteria: any): any;
  resolve(task: string, opts?: any): Promise<{ provider: string; modelName: string; isLocal: boolean; text: string }>;
}

/**
 * AutonomyGateAdapter — gate de autonomia OBRIGATÓRIO no kernel.
 * Antes de executar qualquer tool/task, o kernel consulta o gate:
 *   deny → bloqueia (opção proibida pela política)
 *   approval → bloqueia salvo autorização explícita (meta.authorized === true)
 *   auto/supervised → executa com auditoria
 * Sem gate anexado, o kernel mantém o comportamento permissivo de testes;
 * com gate anexado (OmegaPlatform), NENHUMA ferramenta ignora o nível de autonomia.
 */
export interface AutonomyGateAdapter {
  assess(req: { domain: string; op: string; value?: number; actor?: string; permission?: string }): Promise<{
    verdict: "deny" | "approval" | "auto" | "supervised";
    level: number;
    reason: string;
    at: number;
  }>;
}

export interface AutonomyGateResult {
  allowed: boolean;
  verdict: string;
  level: number;
  reason: string;
  requiredApproval: boolean;
}

export interface KernelStatus {
  name: string;
  version: string;
  uptimeMs: number;
  startedAt: number;
  events: EventBusStats;
  tasks: TaskQueueStats & { verifier: { attached: boolean; verified: number; failed: number } };
  agents: { total: number; active: number };
  tools: { total: number; enabled: number };
  roles: string[];
}

const KERNEL_VERSION = "1.1.0";

export class Kernel {
  public readonly name = "TVS Kernel";
  public readonly version = KERNEL_VERSION;
  public readonly events: EventBus;
  public readonly tasks: TaskQueue;
  public readonly permissions: Permissions;

  private readonly startedAt = Date.now();
  private agentRegistry?: AgentRegistryAdapter;
  private memory?: MemoryAdapter;
  private aiRouter?: AIRouterAdapter;
  private toolsAdapter?: ToolAdapter;
  private autonomyGate?: AutonomyGateAdapter;

  constructor(options?: { concurrency?: number; taskQueuePath?: string; permissions?: ConstructorParameters<typeof Permissions>[0] }) {
    this.events = new EventBus();
    this.tasks = new TaskQueue(this.events, {
      concurrency: options?.concurrency ?? 4,
      filePath: options?.taskQueuePath,
    });
    this.permissions = new Permissions(options?.permissions);
  }

  public attachAgentRegistry(adapter: AgentRegistryAdapter): void {
    this.agentRegistry = adapter;
    void this.events.publish("kernel:attached", { component: "agentRegistry" }, "kernel");
  }

  public attachMemory(adapter: MemoryAdapter): void {
    this.memory = adapter;
    void this.events.publish("kernel:attached", { component: "memory" }, "kernel");
  }

  public attachAIRouter(adapter: AIRouterAdapter): void {
    this.aiRouter = adapter;
    void this.events.publish("kernel:attached", { component: "aiRouter" }, "kernel");
  }

  public attachTools(adapter: ToolAdapter): void {
    this.toolsAdapter = adapter;
    void this.events.publish("kernel:attached", { component: "tools" }, "kernel");
  }

  /**
   * Anexa o gate de autonomia obrigatório. Sem gate, o kernel é permissivo
   * (usado nos testes unitários); com gate, toda tool/task passa por ele.
   */
  public setAutonomyGate(adapter: AutonomyGateAdapter): void {
    this.autonomyGate = adapter;
    void this.events.publish("kernel:attached", { component: "autonomyGate" }, "kernel");
  }

  /** Consulta o gate (se anexado). Permissivo quando não há gate. */
  public async assessAutonomy(req: { domain: string; op: string; value?: number; actor?: string; permission?: string; authorized?: boolean }): Promise<AutonomyGateResult> {
    if (!this.autonomyGate) {
      return { allowed: true, verdict: "auto", level: 5, reason: "no gate attached (permissive)", requiredApproval: false };
    }
    const d = await this.autonomyGate.assess(req);
    const requiredApproval = d.verdict === "approval";
    let allowed = d.verdict !== "deny";
    if (requiredApproval) {
      allowed = req.authorized === true;
    }
    if (d.verdict === "deny") allowed = false;
    return {
      allowed,
      verdict: d.verdict,
      level: d.level,
      reason: d.reason,
      requiredApproval,
    };
  }

  public setPlanner(planner: TaskPlanner): void {
    this.tasks.setPlanner(planner);
  }

  public setVerifier(verifier: TaskVerifierFn): void {
    this.tasks.setVerifier(verifier);
  }

  public attachVerifier(verifier: Verifier): void {
    this.tasks.setVerifier(toVerifierFn(verifier));
    void this.events.publish("kernel:attached", { component: "verifier", name: verifier.name }, "kernel");
  }

  public getTools(): { id: string; name: string; type: string; description: string; enabled: boolean }[] {
    return this.toolsAdapter?.listTools() ?? [];
  }

  public async executeTool(toolId: string, input: Record<string, any>, meta?: { taskId?: string }): Promise<any> {
    if (!this.toolsAdapter) throw new Error("[Kernel] No tool adapter attached");

    // GATE DE AUTONOMIA OBRIGATÓRIO: nenhuma ferramenta ignora o nível.
    const gate = await this.assessAutonomy({
      domain: "system",
      op: `tool:${toolId}`,
      actor: meta?.taskId ? `task:${meta.taskId}` : "kernel",
      permission: "tools.execute",
      authorized: (input as any)?.authorized === true,
    });
    await this.events.publish("tool.gate", { toolId, ...gate, taskId: meta?.taskId }, "kernel");
    if (!gate.allowed) {
      const denied = {
        toolId,
        input,
        taskId: meta?.taskId,
        success: false,
        result: null,
        error: gate.requiredApproval
          ? `[Autonomy] tool '${toolId}' requires human approval: ${gate.reason}`
          : `[Autonomy] tool '${toolId}' denied: ${gate.reason}`,
        executionTimeMs: 0,
        blocked: true,
        autonomy: { verdict: gate.verdict, level: gate.level, reason: gate.reason },
      };
      await this.events.publish("tool.blocked", { ...denied }, "kernel");
      return denied;
    }

    await this.events.publish("tool.called", { toolId, input, taskId: meta?.taskId }, "kernel");
    let executed: any;
    try {
      executed = await this.toolsAdapter.executeTool(toolId, input);
    } catch (err: any) {
      executed = { success: false, error: err?.message || String(err), executionTimeMs: 0 };
    }
    const call = {
      toolId,
      input,
      taskId: meta?.taskId,
      success: executed?.success !== false,
      result: executed?.result ?? executed?.output ?? executed,
      error: executed?.error,
      executionTimeMs: executed?.executionTimeMs ?? 0,
    };
    await this.events.publish(call.success ? "tool.completed" : "tool.failed", { ...call }, "kernel");
    return call;
  }

  public publish<T = any>(topic: string, payload: T, source?: string): Promise<void> {
    return this.events.publish(topic, payload, source);
  }

  public runTask(taskType: string, title: string, payload?: any, priority: TaskPriority = "normal", actor?: Actor): Promise<KernelTask> {
    if (actor) this.permissions.assert(actor, "tasks.create");
    return this.tasks.enqueue(taskType, title, payload, priority);
  }  public async dispatchAgent(agentIdOrName: string, task: string, context?: Record<string, any>, actor?: Actor): Promise<any> {
    if (actor) this.permissions.assert(actor, "agents.manage");
    if (!this.agentRegistry) throw new Error("[Kernel] No agent registry attached");

    // GATE DE AUTONOMIA OBRIGATÓRIO: execução de agente também é supervisionada.
    const gate = await this.assessAutonomy({
      domain: "agents",
      op: `agent:${agentIdOrName}`,
      actor: actor?.id ?? "kernel",
      permission: "agents.manage",
      authorized: context?.authorized === true,
    });
    await this.events.publish("agent.gate", { agent: agentIdOrName, ...gate }, "kernel");
    if (!gate.allowed) {
      throw new Error(`[Autonomy] agent '${agentIdOrName}' ${gate.requiredApproval ? "requires human approval" : "denied"}: ${gate.reason}`);
    }

    await this.events.publish("kernel:dispatch", { agent: agentIdOrName, task }, "kernel");
    return this.agentRegistry.runAgent(agentIdOrName, task, context);
  }

  public getAgents(): { id: string; name: string; role: string; status: string; capabilities: string[] }[] {
    if (!this.agentRegistry) return [];
    return this.agentRegistry.getAgents();
  }

  public searchMemory(query: string, options?: any): Promise<any[]> {
    if (!this.memory) return Promise.resolve([]);
    return Promise.resolve(this.memory.unifiedSearch(query, options));
  }

  public routeTask(criteria: any): any {
    if (!this.aiRouter) return null;
    return this.aiRouter.route(criteria);
  }

  public async resolveWithAI(task: string, opts?: any): Promise<any> {
    if (!this.aiRouter) throw new Error("[Kernel] No AI router attached");
    return this.aiRouter.resolve(task, opts);
  }

  public async recordDecision(key: string, value: any, tags?: string[]): Promise<void> {
    if (!this.memory) return;
    await this.memory.setLongTerm(key, value, tags);
  }

  public status(): KernelStatus {
    const agents = this.getAgents();
    const tools = this.getTools();
    return {
      name: this.name,
      version: this.version,
      uptimeMs: Date.now() - this.startedAt,
      startedAt: this.startedAt,
      events: this.events.getStats(),
      tasks: { ...this.tasks.getStats(), verifier: this.tasks.verifierStats() },
      agents: { total: agents.length, active: agents.filter((a) => a.status === "ACTIVE").length },
      tools: { total: tools.length, enabled: tools.filter((t) => t.enabled).length },
      roles: this.permissions.listRoles(),
    };
  }
}
