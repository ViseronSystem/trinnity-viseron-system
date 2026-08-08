import * as path from "path";
import { Kernel } from "./kernel/Kernel";
import { AgentRuntime } from "./agent-runtime/AgentRuntime";
import { KnowledgeGraph } from "./memory-engine/KnowledgeGraph";
import { AIRouter } from "./ai-router/AIRouter";
import { AutonomyLayer, PlannerEngineAdapter, EvolutionEngineAdapter, LearningEngineAdapter } from "./autonomy";
import { SquadRegistry } from "./squads";
import { FactoryEngine, SolutionEngineAdapter, ScaffolderAdapter } from "./factory";
import { EnterpriseHub } from "./enterprise";
import { SelfHealWatchdog } from "./selfheal";
import { heartbeats } from "./selfheal";
import { TVSOs } from "../os";
import { AgentManager } from "../core/AgentManager";
import { MemoryEngine } from "../core/memory/MemoryEngine";
import { ProviderFactory } from "../core/providers/ProviderFactory";
import { ModelRouter } from "../core/model-router/ModelRouter";
import { bridgeEventEmitter } from "./kernel/EventBridge";

export interface OmegaOptions {
  agentManager?: AgentManager;
  memoryEngine?: MemoryEngine;
  providerFactory?: ProviderFactory;
  modelRouter?: ModelRouter;
  graphFilePath?: string;
  taskQueuePath?: string;
  toolManager?: any;
  planner?: PlannerEngineAdapter;
  evolution?: EvolutionEngineAdapter;
  learning?: LearningEngineAdapter;
  solutionEngine?: SolutionEngineAdapter;
  scaffolder?: ScaffolderAdapter;
}

export interface OmegaPlatformStatus {
  kernel: ReturnType<Kernel["status"]>;
  runtime: ReturnType<AgentRuntime["status"]>;
  graph: ReturnType<KnowledgeGraph["getStats"]>;
  router: { providers: string[]; default: string };
  autonomy: ReturnType<AutonomyLayer["status"]>;
  squads: ReturnType<SquadRegistry["status"]>;
  factory: ReturnType<FactoryEngine["status"]>;
  enterprise: ReturnType<EnterpriseHub["status"]>;
  watchdog: ReturnType<SelfHealWatchdog["status"]>;
}

const SPECS_DIR = path.join(__dirname, "agent-runtime", "specs");
const SQUADS_DIR = path.join(__dirname, "squads", "manifests");
const ENTERPRISE_DIR = path.join(__dirname, "enterprise", "manifests");

export class OmegaPlatform {
  public readonly kernel: Kernel;
  public readonly agents: AgentRuntime;
  public readonly graph: KnowledgeGraph;
  public readonly router: AIRouter;
  public readonly autonomy: AutonomyLayer;
  public readonly squads: SquadRegistry;
  public readonly factory: FactoryEngine;
  public readonly enterprise: EnterpriseHub;
  public readonly watchdog: SelfHealWatchdog;
  public readonly os: TVSOs;

  private readonly agentManager?: AgentManager;
  private autonomyTimer: NodeJS.Timeout | null = null;

  constructor(options: OmegaOptions = {}) {
    this.agentManager = options.agentManager;
    this.kernel = new Kernel({
      taskQueuePath: options.taskQueuePath,
    });
    this.graph = new KnowledgeGraph({
      filePath: options.graphFilePath ?? path.join(process.cwd(), "database", "memory", "knowledge-graph.json"),
    });
    this.router = new AIRouter(options.providerFactory, options.modelRouter);
    this.agents = new AgentRuntime({
      providerFactory: options.providerFactory,
      modelRouter: options.modelRouter,
      registerHook: (agent) => this.agentManager?.register(agent),
    });
    this.autonomy = new AutonomyLayer(this.kernel, {
      planner: options.planner,
      evolution: options.evolution,
      learning: options.learning,
    });
    this.squads = new SquadRegistry();
    this.squads.loadFromDir(SQUADS_DIR);
    this.factory = new FactoryEngine(this.kernel, {
      solutionEngine: options.solutionEngine,
      scaffolder: options.scaffolder,
    });
    this.enterprise = new EnterpriseHub(this.kernel);
    this.enterprise.loadFromDir(ENTERPRISE_DIR);

    if (options.agentManager) {
      this.kernel.attachAgentRegistry({
        getAgents: () => options.agentManager!.list(),
        runAgent: (id, task, ctx) => options.agentManager!.run(id, task, ctx),
      });

      // Executor padrão do kernel: QUALQUER tarefa enfileirada é executada por
      // uma das 5000+ mentes (o agente nuclear mais indicado pelo payload).
      // Se o payload pedir ferramentas, são invocadas de verdade antes do agente
      // e os resultados entram no contexto — a cadeia E2E passa pelo ToolManager.
      this.kernel.tasks.setDefaultExecutor(async (task) => {
        const manager = options.agentManager!;
        const payload = task.payload as any;
        const targetId = payload?.assignedAgentId || payload?.agentId;
        const title = task.title || "tarefa autónoma";
        const description = payload?.description || title;

        const pickTarget = (): string => {
          if (targetId) return targetId;
          const byCapability = payload?.capability
            ? manager.getAgentsByCapability(payload.capability)[0]
            : undefined;
          if (byCapability) return byCapability.id;
          const preferred = manager.getAgentsByRole("CEO Agent")[0] || manager.getAgentsByRole("CEO")[0];
          if (preferred) return preferred.id;
          const fallback = manager.list("ACTIVE")[0];
          if (fallback) return fallback.id;
          throw new Error("[Kernel] Nenhuma mente ativa para executar a tarefa");
        };

        const agentId = pickTarget();
        const startedAt = Date.now();

        // Ferramentas reais: invocadas pelo kernel com eventos tool.called/tool.completed
        const toolCalls: any[] = [];
        const toolSpecs = Array.isArray(payload?.tools) ? payload.tools : [];
        for (const spec of toolSpecs) {
          const toolId = typeof spec === "string" ? spec : spec?.id;
          const toolInput = typeof spec === "string" ? {} : (spec?.input ?? {});
          if (!toolId) continue;
          const call = await this.kernel.executeTool(toolId, toolInput, { taskId: task.id });
          toolCalls.push(call);
        }
        task.tools = toolCalls;

        const result = await manager.run(agentId, description, {
          kernelTaskId: task.id,
          tools: toolCalls,
          ...payload,
        });
        const latencyMs = Date.now() - startedAt;
        return {
          executedBy: agentId,
          success: result?.success ?? false,
          output: result?.output ?? "",
          error: result?.error,
          tools: toolCalls,
          latencyMs,
          cost: +(latencyMs * 0.00002).toFixed(6),
        };
      });
    }

    // Planner por omissão: plano executável com passos de ação/tool reais.
    this.kernel.tasks.setPlanner((task) => {
      const payload = (task.payload ?? {}) as any;
      const steps: any[] = [{ action: "agent", description: task.title }];
      if (Array.isArray(payload?.tools)) {
        for (const spec of payload.tools) {
          const id = typeof spec === "string" ? spec : spec?.id;
          if (!id) continue;
          steps.push({ action: "tool", description: `invoke ${id}`, tool: id, input: typeof spec === "string" ? {} : (spec?.input ?? {}) });
        }
      }
      if (payload?.description) steps.push({ action: "report", description: String(payload.description) });
      return steps;
    });

    // Verificador por omissão: resultado real (success) + schema opcional via payload.verify
    this.kernel.tasks.setVerifier(async (task, result) => {
      const reasons: string[] = [];
      if (result === null || result === undefined) {
        return { status: "FAIL", reasons: ["executor returned no result"] };
      }
      if (result.success === false) {
        return { status: "FAIL", reasons: [String(result.error || "executor reported failure")] };
      }
      reasons.push("executor reported success");
      const verifySpec = (task.payload as any)?.verify;
      if (verifySpec && Array.isArray(verifySpec.require)) {
        for (const key of verifySpec.require) {
          if (result[key] === undefined || result[key] === null) {
            return { status: "FAIL", reasons: [`verify.require: "${key}" missing in result`] };
          }
        }
        reasons.push("payload.verify schema satisfied");
      }
      if (verifySpec?.requireTruthy) {
        const val = result[verifySpec.requireTruthy];
        if (!val) {
          return { status: "RETRY", reasons: [`verify.requireTruthy: "${verifySpec.requireTruthy}" falsy → retry`] };
        }
      }
      return { status: "PASS", reasons };
    });

    if (options.toolManager && typeof options.toolManager.listTools === "function") {
      this.kernel.attachTools({
        listTools: () =>
          options.toolManager!.listTools().map((t: any) => ({
            id: t.id,
            name: t.name,
            type: t.type,
            description: t.description,
            enabled: t.enabled !== false,
          })),
        executeTool: (toolId, input) => options.toolManager!.executeTool(toolId, input),
      });
    }

    if (options.memoryEngine) {
      this.kernel.attachMemory({
        unifiedSearch: (q, opts) => options.memoryEngine!.unifiedSearch(q, opts),
        setLongTerm: (key, value, tags) => options.memoryEngine!.setLongTerm(key, value, tags),
        getStats: () => options.memoryEngine!.getStats(),
      });
      // Consolidação: eventos de memória (stm/ltm/kb/vector/consolidation) são
      // republicados no kernel bus — o EventBus passa a ser o backbone reativo.
      bridgeEventEmitter(options.memoryEngine, this.kernel.events, { source: "memory-engine" });
    }

    this.kernel.attachAIRouter({
      route: (criteria) => this.router.route(criteria),
      resolve: async (task, opts) => this.router.resolve(task, opts),
    });

    this.watchdog = new SelfHealWatchdog({
      kernel: this.kernel,
      autonomy: this.autonomy,
      runtime: this.agents,
      squads: this.squads,
    });
    this.watchdog.register({ id: "kernel", label: "Kernel / EventBus", reset: () => heartbeats.reset("kernel") });
    this.watchdog.register({ id: "runtime", label: "Agent Runtime (10 agentes)", reset: () => heartbeats.reset("runtime") });
    this.watchdog.register({ id: "squads", label: "SquadRegistry (5 squads AIOX)", reset: () => heartbeats.reset("squads") });
    this.watchdog.register({ id: "enterprise", label: "Enterprise Hub (6 módulos)", reset: () => heartbeats.reset("enterprise") });
    this.watchdog.register({ id: "factory", label: "Factory (pipeline de 4 stages)", reset: () => heartbeats.reset("factory") });

    this.os = new TVSOs({
      kernel: this.kernel,
      runtime: this.agents,
      enterprise: this.enterprise,
      squads: this.squads,
      watchdog: this.watchdog,
    });
    this.os.boot();

    // Memória persistente: cada task concluída (ou falhada) é gravada no
    // KnowledgeGraph + memória de longo prazo — nunca se perde no restart.
    this.kernel.events.subscribe("task:completed", (task) => this.recordTaskMemory(task));
    this.kernel.events.subscribe("task:failed", (task) => this.recordTaskMemory(task));

    // Retoma tarefas pendentes recuperadas do ficheiro de persistência.
    this.kernel.tasks.resume();
  }

  private recordTaskMemory(task: any): void {
    try {
      const executedBy = task?.result?.executedBy;
      const entityId = `task_${task.id}`;
      this.graph.upsertEntity(entityId, "task", task?.title || task?.id, {
        type: task?.type,
        state: task?.state,
        attempts: task?.attempts,
        verification: task?.verification?.status,
        verified: task?.verification?.status === "PASS",
        latencyMs: task?.latencyMs,
        cost: task?.cost,
        at: task?.completedAt ?? Date.now(),
      });
      if (executedBy) {
        if (!this.graph.getEntity(executedBy)) this.graph.upsertEntity(executedBy, "agent", executedBy);
        this.graph.addRelation(entityId, executedBy, "executed_by", 1, { taskType: task?.type });
      }
      this.graph.save();
      void this.kernel.recordDecision(`task:${task.id}`, {
        title: task?.title,
        type: task?.type,
        state: task?.state,
        verification: task?.verification?.status,
        result: task?.result,
      }, ["task", task?.type, task?.state]);
      void this.kernel.publish("memory:updated", { taskId: task?.id, entityId, state: task?.state }, "omega-platform");
    } catch (err: any) {
      console.warn(`[TVS OMEGA] memory record failed: ${err?.message || err}`);
    }
  }

  public loadCoreAgents(): { valid: number; invalid: number; files: number } {
    const result = this.agents.loadSpecsFromDir(SPECS_DIR);
    this.enterprise.attachRuntime(this.agents);
    this.watchdog.start();
    return result;
  }

  /**
   * Liga o motor de autonomia ao kernel: a cada 2 minutos roda um ciclo de
   * planeamento OMEGA que ENFILEIRA trabalho no kernel (supervisão) e executa
   * as tarefas pendentes do planner — as 5000+ mentes nunca ficam a 0 tarefas.
   */
  public startAutonomyCycles(intervalMs: number = 2 * 60 * 1000): void {
    if (this.autonomyTimer) return;
    const run = async () => {
      try {
        const result = await this.autonomy.runCycle("planning");
        void this.kernel.publish("omega:autonomy:scheduled", { at: Date.now(), result }, "omega-platform");
      } catch (err: any) {
        void this.kernel.publish("omega:autonomy:error", { at: Date.now(), error: err?.message || String(err) }, "omega-platform");
      }
    };
    void run();
    this.autonomyTimer = setInterval(run, intervalMs);
    this.autonomyTimer.unref?.();
    console.log(`[TVS OMEGA] Autonomy cycles ligados: kernel recebe trabalho a cada ${Math.round(intervalMs / 60000)}min (5.4k mentes nunca ficam paradas)`);
  }

  public stopAutonomyCycles(): void {
    if (this.autonomyTimer) {
      clearInterval(this.autonomyTimer);
      this.autonomyTimer = null;
    }
  }

  public async recordDecision(entityId: string, entityType: string, name: string, relations: { target: string; type: string; weight?: number }[], properties?: Record<string, any>): Promise<void> {
    this.graph.upsertEntity(entityId, entityType, name, properties);
    for (const rel of relations) {
      if (!this.graph.getEntity(rel.target)) {
        this.graph.upsertEntity(rel.target, "unknown", rel.target);
      }
      this.graph.addRelation(entityId, rel.target, rel.type, rel.weight ?? 1);
    }
    this.graph.save();
    await this.kernel.publish("omega:decision", { entityId, entityType, name }, "omega-platform");
  }

  public status(): OmegaPlatformStatus {
    return {
      kernel: this.kernel.status(),
      runtime: this.agents.status(),
      graph: this.graph.getStats(),
      router: {
        providers: ["ollama", "omniroute", "openai", "claude", "gemini", "grok"],
        default: "ollama",
      },
      autonomy: this.autonomy.status(),
      squads: this.squads.status(),
      factory: this.factory.status(),
      enterprise: this.enterprise.status(),
      watchdog: this.watchdog.status(),
    };
  }
}

export function createOmegaPlatform(options: OmegaOptions = {}): OmegaPlatform {
  return new OmegaPlatform(options);
}
