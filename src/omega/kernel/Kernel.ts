import { EventBus, EventBusStats, KernelEvent } from "./EventBus";
import { TaskQueue, TaskQueueStats, KernelTask, TaskPriority, TaskPlanner, TaskVerifierFn } from "./TaskQueue";
import { Permissions, Actor, PermissionRole } from "./Permissions";

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

  public setPlanner(planner: TaskPlanner): void {
    this.tasks.setPlanner(planner);
  }

  public setVerifier(verifier: TaskVerifierFn): void {
    this.tasks.setVerifier(verifier);
  }

  public getTools(): { id: string; name: string; type: string; description: string; enabled: boolean }[] {
    return this.toolsAdapter?.listTools() ?? [];
  }

  public async executeTool(toolId: string, input: Record<string, any>, meta?: { taskId?: string }): Promise<any> {
    if (!this.toolsAdapter) throw new Error("[Kernel] No tool adapter attached");
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
  }

  public async dispatchAgent(agentIdOrName: string, task: string, context?: Record<string, any>, actor?: Actor): Promise<any> {
    if (actor) this.permissions.assert(actor, "agents.manage");
    if (!this.agentRegistry) throw new Error("[Kernel] No agent registry attached");
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
