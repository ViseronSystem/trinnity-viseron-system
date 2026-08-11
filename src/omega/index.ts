import * as path from "path";
import { Kernel } from "./kernel/Kernel";
import { AgentRuntime } from "./agent-runtime/AgentRuntime";
import { KnowledgeGraph } from "./memory-engine/KnowledgeGraph";
import { AIRouter } from "./ai-router/AIRouter";
import { AutonomyLayer, PlannerEngineAdapter, EvolutionEngineAdapter, LearningEngineAdapter, AutonomyOS, DomainPolicy, AutonomyRequest, AutonomyDecision } from "./autonomy";
import { SquadRegistry } from "./squads";
import { FactoryEngine, SolutionEngineAdapter, ScaffolderAdapter } from "./factory";
import { EnterpriseHub } from "./enterprise";
import { SelfHealWatchdog } from "./selfheal";
import { TelemetryEngine } from "./telemetry/TelemetryEngine";
import { createEmbeddingProvider, EmbeddingProvider } from "../core/memory/EmbeddingProvider";
import { heartbeats } from "./selfheal";
import { TVSOs } from "../os";
import { AgentManager } from "../core/AgentManager";
import { MemoryEngine } from "../core/memory/MemoryEngine";
import { ProviderFactory } from "../core/providers/ProviderFactory";
import { ModelRouter } from "../core/model-router/ModelRouter";
import { bridgeEventEmitter } from "./kernel/EventBridge";
import { ArchitectureIntelligence } from "./intelligence/architecture";
import { CompositeVerifier } from "./verifier/composite";
import { VaecOrchestrator } from "./evolution";
import { KnowledgeArchive, ArchiveStatus } from "./archive/KnowledgeArchive";

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
  architectureGraphPath?: string;
  compositeVerifier?: CompositeVerifier;
  autonomyPolicies?: DomainPolicy[];
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
  architecture: { ready: boolean; summary?: ReturnType<ArchitectureIntelligence["summary"]> };
  vaec: ReturnType<VaecOrchestrator["status"]>;
  archive?: ArchiveStatus;
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
  public readonly architecture: ArchitectureIntelligence;
  public readonly autonomyOS: AutonomyOS;
  public readonly vaec: VaecOrchestrator;
  public readonly archive: KnowledgeArchive;
  public readonly telemetry: TelemetryEngine;
  public readonly embedding: EmbeddingProvider;

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
      // Regra de honra do hardening: o sucesso NUNCA se deduz do texto — só da
      // execução real. Com `protocol: "tool2phase"`, a cadeia é:
      //   1. o modelo planifica e emite tool-calls ESTRUTURADAS `{tool, arguments}`;
      //   2. o kernel executa-as DE VERDADE (gate de autonomia + ToolManager);
      //   3. o modelo escreve o relatório final com os resultados reais.
      // Sem tool-call válida → zero execução; obrigatórias falhadas → sucesso=falso.
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
        const hints = Array.isArray(payload?.tools) ? payload.tools : [];
        const toolSpecs = hints.map((s: any) =>
          typeof s === "string" ? { id: s, input: {} } : { id: s?.id, input: s?.input ?? {} }
        );

        // Derivação SEMÂNTICA de sucesso: uma tool que reporta `passed:false`
        // (teste falhou) nunca pode contar como sucesso, mesmo que o adapter
        // tenha resolvido sem exceção.
        const deriveToolSuccess = (call: any): any => {
          const res = call?.result;
          if (res && typeof res === "object" && res.passed === false) {
            return {
              ...call,
              success: false,
              error: call?.error || String(res.stderr || `execução reportou falha (exitCode ${res.exitCode})`),
            };
          }
          return call;
        };

        const executeCalls = async (calls: any[]): Promise<any[]> => {
          const out: any[] = [];
          for (const c of calls) {
            const toolId = c?.call?.tool ?? c?.toolId;
            const args = c?.call?.arguments ?? c?.input ?? {};
            // Validação ANTES da execução: uma tool-call rejeitada (schema
            // inválido, tool desconhecida, sem id) é registada como FALHADA,
            // nunca executada — fica no rasto de auditoria como tool falhada.
            const validationErrors: string[] = Array.isArray(c?.validation?.errors) ? c.validation.errors : [];
            const rejected = !toolId || (c?.validation && c.validation.ok === false);
            if (rejected) {
              const reason = !toolId
                ? "tool-call sem id de ferramenta"
                : `args inválidos: ${validationErrors.join("; ") || "schema"}`;
              const rejectedCall = {
                toolId: toolId || "(sem-tool)",
                input: args,
                taskId: task.id,
                success: false,
                result: null,
                error: reason,
                executionTimeMs: 0,
                rejected: true,
              };
              await this.kernel.publish("tool.failed", { ...rejectedCall }, "kernel");
              out.push(rejectedCall);
              continue;
            }
            let call = await this.kernel.executeTool(toolId, args, { taskId: task.id });
            out.push(deriveToolSuccess(call));
          }
          return out;
        };

        // PROTOCOLO 2 FASES — vertical slice real (viseron_builder).
        if (payload?.protocol === "tool2phase") {
          const authorized = payload?.authorized === true || toolSpecs.length > 0;

          // FASE 1 — planificação: structured-output do modelo (schema + hints).
          const plan = await manager.run(agentId, description, {
            kernelTaskId: task.id,
            phase: "tool_plan",
            tenantId: payload?.tenantId,
            projectId: payload?.projectId,
            authorized,
            toolSpecs,
          });

          // FASE 2 — execução REAL das tool-calls (nunca o texto do modelo).
          const calls = Array.isArray((plan as any)?.toolCalls) ? (plan as any).toolCalls : [];
          const executed = await executeCalls(calls);
          task.tools = executed;

          // FASE 3 — relatório final com os resultados reais.
          const final = await manager.run(agentId, description, {
            kernelTaskId: task.id,
            phase: "final",
            tenantId: payload?.tenantId,
            projectId: payload?.projectId,
            tools: executed,
          });

          const latencyMs = Date.now() - startedAt;
          const requested = calls.length;
          const executedCount = executed.length;
          const succeededCount = executed.filter((t) => t?.success === true).length;
          const failedCount = executedCount - succeededCount;
          const noCalls = requested === 0;
          const allSucceeded = executedCount > 0 && failedCount === 0;
          const success = allSucceeded
            ? true
            : noCalls
              ? final?.success === true && !!final?.output
              : false;
          const model = (final as any)?.model ?? (plan as any)?.model ?? null;
          return {
            executedBy: agentId,
            success,
            output: String(final?.output ?? plan?.output ?? ""),
            error: success
              ? undefined
              : failedCount > 0
                ? `${failedCount}/${executedCount} ferramentas falharam`
                : final?.error || (noCalls ? "o modelo não emitiu tool-calls válidas" : "execução incompleta"),
            model,
            tools: executed,
            toolsSummary: {
              requested,
              executed: executedCount,
              succeeded: succeededCount,
              failed: failedCount,
              verification: success ? "PASS" : "FAIL",
              status: success ? "COMPLETED" : "FAILED",
              model,
            },
            latencyMs,
            cost: +(latencyMs * 0.00002).toFixed(6),
          };
        }

        // Caminho legado: ferramentas do payload executadas de verdade antes do agente.
        const toolCalls: any[] = [];
        for (const spec of toolSpecs) {
          const toolId = spec?.id;
          if (!toolId) continue;
          const call = await this.kernel.executeTool(toolId, spec?.input ?? {}, { taskId: task.id });
          toolCalls.push(deriveToolSuccess(call));
        }
        task.tools = toolCalls;

        const result = await manager.run(agentId, description, {
          kernelTaskId: task.id,
          ...payload,
          tools: toolCalls,
        });
        const latencyMs = Date.now() - startedAt;
        return {
          executedBy: agentId,
          success: result?.success ?? false,
          output: result?.output ?? "",
          error: result?.error,
          model: (result as any)?.model ?? null,
          tools: toolCalls,
          toolsSummary: {
            requested: toolCalls.length,
            executed: toolCalls.length,
            succeeded: toolCalls.filter((t) => t?.success === true).length,
            failed: toolCalls.filter((t) => t?.success !== true).length,
          },
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

    // Verificador por omissão — HARDENING: com ferramentas OBRIGATÓRIAS no
    // payload, só declara PASS com N/N executadas e com sucesso. 0/N (modelo
    // sem tool-calls válidas) ou obrigatória falhada → FAILED. Nunca se aceita
    // `success:true` sozinho como prova quando o utilizador pediu ferramentas.
    this.kernel.tasks.setVerifier(async (task, result) => {
      const reasons: string[] = [];
      if (result === null || result === undefined) {
        return { status: "FAIL", reasons: ["executor returned no result"] };
      }
      if (result.success === false) {
        return { status: "FAIL", reasons: [String(result.error || "executor reported failure")] };
      }
      reasons.push("executor reported success");

      const payload = (task.payload ?? {}) as any;
      const requiredHints = Array.isArray(payload?.tools)
        ? payload.tools.map((t: any) => (typeof t === "string" ? t : t?.id)).filter(Boolean)
        : [];
      const tools: any[] = Array.isArray(result?.tools) ? result.tools : [];
      const executedIds = tools.map((t) => t?.toolId);
      const succeeded = tools.filter((t) => t?.success === true);
      const failed = tools.filter((t) => t?.success !== true);

      if (requiredHints.length > 0) {
        if (tools.length === 0) {
          return {
            status: "FAIL",
            reasons: [`0/${requiredHints.length} ferramentas executadas — o modelo não emitiu tool-calls válidas`],
          };
        }
        const missing = requiredHints.filter((id: any) => !executedIds.includes(id));
        if (missing.length > 0) {
          return {
            status: "FAIL",
            reasons: [`${tools.length}/${requiredHints.length} ferramentas executadas — em falta: ${missing.join(", ")}`],
          };
        }
        if (failed.length > 0) {
          return {
            status: "FAIL",
            reasons: [
              `${failed.length}/${tools.length} ferramentas falharam`,
              ...failed.map((t) => `${t?.toolId}: ${t?.error ?? "erro desconhecido"}`),
            ],
          };
        }
        reasons.push(`${tools.length}/${tools.length} ferramentas obrigatórias com sucesso (${succeeded.map((t) => t?.toolId).join(", ")})`);
      } else {
        if (!result.output) {
          return { status: "FAIL", reasons: ["output vazio"] };
        }
        reasons.push("output presente (sem ferramentas obrigatórias)");
      }

      const verifySpec = payload?.verify;
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

      // Reality Hardening: autonomy tasks must produce a verifiable artifact
      if (task.type === "autonomy" && (!result.artifact || typeof result.artifact !== "object")) {
        return {
          status: "FAIL",
          reasons: ["autonomy task requires artifact in result (e.g., { artifact: { type, description, data } }) — template-only responses are not accepted"],
        };
      }

      return { status: "PASS", reasons };
    });

    if (options.compositeVerifier) {
      this.kernel.attachVerifier(options.compositeVerifier);
    }

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
    this.watchdog.register({ id: "squads", label: "SquadRegistry (6 squads)", reset: () => heartbeats.reset("squads") });
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

    this.architecture = new ArchitectureIntelligence({ graphPath: options.architectureGraphPath }).initialize();

    this.autonomyOS = new AutonomyOS(options.autonomyPolicies);

    // GATE DE AUTONOMIA OBRIGATÓRIO: toda tool/task/agente passa pelo gate real.
    // Nenhuma ferramenta ignora o nível de autonomia configurado nas políticas.
    this.kernel.setAutonomyGate({
      assess: async (req) => {
        const decision = this.autonomyOS.assess({
          domain: req.domain as any,
          op: req.op,
          value: req.value,
          actor: req.actor,
          permission: req.permission,
        });
        return {
          verdict: decision.verdict,
          level: decision.level,
          reason: decision.reason,
          at: decision.at,
        };
      },
    });

    this.vaec = new VaecOrchestrator({ rootDir: process.cwd(), events: this.kernel.events });

    this.archive = new KnowledgeArchive({ graph: this.graph, bus: this.kernel.events });

    // Cognitive Telemetry — Sistema 0: rastreabilidade completa de operações cognitivas
    this.telemetry = new TelemetryEngine(path.join(process.cwd(), "data"));

    // Embedding Provider — Sistema 1: OpenAI → MiniLM fallback chain
    this.embedding = createEmbeddingProvider();

    // Publica eventos de telemetria no EventBus para observabilidade
    this.kernel.events.subscribe("cognitive:completed", (trace) => {
      this.archiveCognitiveTrace(trace);
    });
    this.kernel.events.subscribe("cognitive:failed", (trace) => {
      this.archiveCognitiveTrace(trace);
    });

    // Auditoria de autonomia: cada decisão flui para o EventBus (backbone reativo)
    this.kernel.events.subscribe("autonomy:decided", (d: any) => {
      void this.recordDecision(`autonomy_${d.at}_${d.op}`, "autonomy", `autonomy ${d.verdict} ${d.op}`, [
        { target: "autonomy_os", type: "decided_by", weight: 1 },
      ]);
    });

    // Memória persistente: cada task concluída (ou falhada) é gravada no
    // KnowledgeGraph + memória de longo prazo — nunca se perde no restart.
    this.kernel.events.subscribe("task:completed", (task) => this.recordTaskMemory(task));
    this.kernel.events.subscribe("task:failed", (task) => this.recordTaskMemory(task));

    // Agent Evidence: grava atividade de agentes em JSONL para auditoria
    this.kernel.events.subscribe("task:started", (task) => this.recordAgentActivity(task, "task_started"));
    this.kernel.events.subscribe("task:completed", (task) => this.recordAgentActivity(task, "task_completed"));
    this.kernel.events.subscribe("task:failed", (task) => this.recordAgentActivity(task, "task_failed"));

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

  private archiveCognitiveTrace(trace: any): void {
    try {
      // Link trace to agent evidence
      if (trace?.agentId && trace?.traceId) {
        const fs = require("fs");
        const evPath = path.resolve(process.cwd(), "data", "knowledge", "agent-activity.jsonl");
        const entry = JSON.stringify({
          agentId: trace.agentId,
          action: trace.result?.success ? "cognitive_completed" : "cognitive_failed",
          traceId: trace.traceId,
          source: trace.source,
          ts: new Date().toISOString(),
        });
        fs.appendFileSync(evPath, entry + "\n");
      }
      // Archive trace to KnowledgeArchive with SHA-256
      if (trace?.traceId) {
        const crypto = require("crypto");
        const hash = crypto.createHash("sha256").update(JSON.stringify(trace)).digest("hex");
        this.archive.record(
          `cognitive_trace_${trace.traceId}`,
          `Cognitive Trace: ${trace.source} — ${trace.result?.success ? "SUCCESS" : "FAILED"}`,
          {
            traceId: trace.traceId,
            source: trace.source,
            agentId: trace.agentId,
            success: trace.result?.success,
            latencyMs: trace.result?.latencyMs,
            hash,
          },
          ["cognitive-telemetry", trace.source, trace.result?.success ? "success" : "failure"]
        );
      }
    } catch { /* non-blocking */ }
  }

  private recordAgentActivity(task: any, action: string): void {
    try {
      const agentId = task?.assignedAgentId;
      if (!agentId) return; // só grava se houver agente atribuído
      const entry = JSON.stringify({
        agentId,
        action,
        taskId: task?.id,
        taskTitle: task?.title,
        taskState: task?.state,
        verification: task?.verification?.status,
        ts: new Date().toISOString(),
      });
      const fs = require("fs");
      const path = require("path");
      const logPath = path.resolve(process.cwd(), "data", "knowledge", "agent-activity.jsonl");
      fs.appendFileSync(logPath, entry + "\n");
    } catch (err: any) {
      // non-blocking — não quebra o sistema se o log falhar
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
   * planeamento OMEGA que ENFILEIRA trabalho real no kernel (supervisão) e
   * executa as tarefas pendentes do planner.
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
    console.log(`[TVS OMEGA] Autonomy cycles ligados: kernel recebe trabalho a cada ${Math.round(intervalMs / 60000)}min (agentes reais do runtime: ${this.agents.status().active} ativos)`);
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

  public async assessAutonomy(req: AutonomyRequest): Promise<AutonomyDecision> {
    const decision = this.autonomyOS.assess(req);
    await this.kernel.publish("autonomy:decided", decision, "omega-platform");
    return decision;
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
      architecture: this.architecture.isReady()
        ? { ready: true, summary: this.architecture.summary() }
        : { ready: false },
      vaec: this.vaec.status(),
      archive: this.archive.status(),
      telemetry: this.telemetry.status(),
    };
  }
}

export function createOmegaPlatform(options: OmegaOptions = {}): OmegaPlatform {
  return new OmegaPlatform(options);
}
