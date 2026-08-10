import * as path from "path";
import * as fs from "fs";
import { EventEmitter } from "events";
import { EventBus, topicMatches, EVENTBUS_ERROR_TOPIC } from "../src/omega/kernel/EventBus";
import { bridgeEventEmitter, bridgeSocketIO, openSSEStream } from "../src/omega/kernel/EventBridge";
import { TaskQueue } from "../src/omega/kernel/TaskQueue";
import { Permissions } from "../src/omega/kernel/Permissions";
import { Kernel } from "../src/omega/kernel/Kernel";
import { AutonomyLayer, PlannerEngineAdapter, EvolutionEngineAdapter, LearningEngineAdapter } from "../src/omega/autonomy";
import { SquadRegistry } from "../src/omega/squads";
import { FactoryEngine } from "../src/omega/factory";
import { EnterpriseHub } from "../src/omega/enterprise";
import { AgentRuntime } from "../src/omega/agent-runtime/AgentRuntime";
import { parseAgentSpec, validateAgentSpecs, AgentSpecSchema } from "../src/omega/agent-runtime/AgentSpec";
import { KnowledgeGraph } from "../src/omega/memory-engine/KnowledgeGraph";
import { AIRouter } from "../src/omega/ai-router/AIRouter";
import { OmegaPlatform } from "../src/omega";
import { ProviderFactory } from "../src/core/providers/ProviderFactory";
import { ILLMProvider } from "../src/core/providers/BaseProvider";
import { ModelProvider } from "../src/core/types";

class OfflineProviderFactory extends ProviderFactory {
  public getProvider(_providerId: ModelProvider): ILLMProvider | undefined {
    return undefined;
  }
}

async function runOmegaTests() {
  console.log("==========================================");
  console.log("TVS OMEGA PLATFORM — CORE SPINE TESTS");
  console.log("==========================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  async function assertRejects(fn: () => any, testName: string) {
    total++;
    try {
      await fn();
      console.error(`❌ [FAIL] ${testName} (não lançou erro)`);
    } catch {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    }
  }

  async function waitFor(task: any, timeoutMs = 5000): Promise<void> {
    const start = Date.now();
    while (["CREATED", "PLANNING", "QUEUED", "RUNNING", "VERIFYING", "RECOVERING"].includes(task.state)) {
      if (Date.now() - start > timeoutMs) throw new Error(`Timeout waiting task ${task.id}`);
      await new Promise((r) => setTimeout(r, 25));
    }
  }

  // ── 1. EventBus ──
  {
    const bus = new EventBus();
    let received: string[] = [];
    const unsub = bus.subscribe<string>("agent:created", (p) => { received.push(p); });
    await bus.publish("agent:created", "agent_ceo", "test");
    await bus.publish("agent:created", "agent_cto", "test");
    assert(received.length === 2, "EventBus: subscribe + publish entrega payloads");

    unsub();
    await bus.publish("agent:created", "ignored", "test");
    assert(received.length === 2, "EventBus: unsubscribe interrompe entrega");

    let onceCalled = 0;
    bus.once("task:done", () => { onceCalled++; });
    await bus.publish("task:done", {});
    await bus.publish("task:done", {});
    assert(onceCalled === 1, "EventBus: once dispara apenas uma vez");

    const stats = bus.getStats();
    assert(stats.topics === 0 && stats.totalEmitted === 5, "EventBus: stats v2 (tópicos ativos + eventos emitidos)");

    await assertRejects(() => bus.subscribe("topic inválido!", () => {}), "EventBus: rejeita topic inválido");
  }

  // ── 2. TaskQueue ──
  {
    const bus = new EventBus();
    const queue = new TaskQueue(bus, { concurrency: 2 });
    const completedEvents: string[] = [];
    bus.subscribe("task:completed", (t: any) => { completedEvents.push(t.id); });

    queue.registerExecutor("echo", async (task) => `done:${task.payload?.x}`);
    queue.registerExecutor("boom", async () => { throw new Error("boom"); });

    const t1 = await queue.enqueue("echo", "Echo task", { x: 42 }, "high");
    await waitFor(t1);
    assert(t1.state === "COMPLETED" && t1.result === "done:42", "TaskQueue: executa executor e guarda resultado");

    const boom = await queue.enqueue("boom", "Falha task", null, "normal");
    await waitFor(boom);
    assert(boom.state === "FAILED" && boom.error === "boom", "TaskQueue: falha marcada após retries");

    const t2 = await queue.enqueue("echo", "Segunda echo", { x: 7 }, "low");
    await waitFor(t2);
    assert(t2.result === "done:7", "TaskQueue: segunda execução concorrente");

    const stats = queue.getStats();
    assert(stats.completed === 2 && stats.failed === 1, "TaskQueue: stats de completadas/falhadas");
    assert(completedEvents.length === 2, "TaskQueue: emite eventos de conclusão no bus");

    const noExec = await queue.enqueue("no-executor", "Sem executor", null);
    await waitFor(noExec);
    assert(noExec.state === "FAILED" && (noExec.error ?? "").includes("No executor"), "TaskQueue: task sem executor marca FAILED");
  }

  // ── 3. Permissions ──
  {
    const perms = new Permissions();
    assert(perms.can("commander", "tasks.create") === true, "Permissions: commander pode criar tasks");
    assert(perms.can("commander", "agents.manage") === true, "Permissions: wildcard agentes.*");
    assert(perms.can("viewer", "tasks.create") === false, "Permissions: viewer NÃO pode criar tasks");
    assert(perms.can("agent", "memory.write") === true, "Permissions: agente escreve memória");
    assert(perms.can("root", "qualquer.coisa") === true, "Permissions: root tem *");
    perms.defineRole("commander", ["kernel.*"]);
    assert(perms.can("commander", "tasks.create") === false, "Permissions: defineRole substitui grants");
    await assertRejects(() => perms.assert({ id: "x", name: "X", role: "viewer" }, "tasks.create"), "Permissions: assert bloqueia sem permissão");
  }

  // ── 4. Kernel (facade + adapters) ──
  {
    const kernel = new Kernel();
    const events: string[] = [];
    kernel.events.subscribe("kernel:dispatch", (e: any) => { events.push(e.agent); });

    kernel.attachAgentRegistry({
      getAgents: () => [{ id: "a1", name: "A1", role: "R", status: "ACTIVE", capabilities: [] }],
      runAgent: async (id, task) => ({ agentId: id, success: true, output: `ran ${task}`, executionTimeMs: 1 }),
    });
    kernel.attachMemory({
      unifiedSearch: async (q) => [{ source: "ltm", id: "1", title: q, content: "c", score: 1, timestamp: 0 }],
      setLongTerm: async () => {},
      getStats: () => ({}),
    });
    kernel.attachAIRouter({
      route: (c) => ({ provider: "ollama", modelName: "qwen2.5:3b", isLocal: true, estimatedLatencyMs: 100, estimatedCostPer1kTokens: 0, reason: "local" }),
      resolve: async (task) => ({ provider: "ollama", modelName: "qwen2.5:3b", isLocal: true, text: "ok" }),
    });

    const dispatched = await kernel.dispatchAgent("a1", "tarefa X", {}, { id: "pedro", name: "Pedro", role: "commander" });
    assert(dispatched.output === "ran tarefa X", "Kernel: dispatchAgent via adapter");
    assert(events.includes("a1"), "Kernel: dispatch publica evento no bus");

    const routed = kernel.routeTask({ taskType: "code" });
    assert(routed.provider === "ollama", "Kernel: routeTask delega no router");

    const memory = await kernel.searchMemory("pergunta");
    assert(memory.length === 1 && memory[0].title === "pergunta", "Kernel: searchMemory via adapter");

    const task = await kernel.runTask("echo", "Kernel task", { x: 1 }, "normal", { id: "pedro", name: "Pedro", role: "commander" });
    assert(task.id.startsWith("task_"), "Kernel: runTask sem executor fica na fila");

    const status = kernel.status();
    assert(status.agents.total === 1 && status.roles.length >= 5, "Kernel: status agrega adapters");
    await assertRejects(() => kernel.runTask("x", "sem permissão", {}, "normal", { id: "v", name: "V", role: "viewer" }), "Kernel: runTask exige permissão tasks.create");
  }

  // ── 5. AgentSpec (schema zod) ──
  {
    const valid = parseAgentSpec({
      id: "agent_test", name: "Test", role: "Tester", description: "d", status: "ACTIVE",
      capabilities: ["x"], systemPrompt: "p",
    });
    assert(valid.id === "agent_test" && valid.memory.stm === true, "AgentSpec: defaults aplicados (memory.stm)");

    const invalid = AgentSpecSchema.safeParse({ id: "", name: "n", role: "r", description: "d", capabilities: [], systemPrompt: "p" });
    assert(invalid.success === false, "AgentSpec: rejeita id vazio");

    const spec = parseAgentSpec({ id: "agent_spec_valid", name: "V", role: "R", description: "d", capabilities: ["c"], systemPrompt: "p", provider: { preferred: "ollama", temperature: 0.5 } });
    assert(spec.provider.temperature === 0.5, "AgentSpec: provider.temperature lido");
  }

  // ── 6. AgentRuntime (10 agentes reais) ──
  {
    const runtime = new AgentRuntime({ providerFactory: new OfflineProviderFactory() });
    const specsDir = path.join(process.cwd(), "src", "omega", "agent-runtime", "specs");
    const result = runtime.loadSpecsFromDir(specsDir);
    assert(result.valid === 10 && result.invalid === 0, `AgentRuntime: carrega 10 specs reais (valid=${result.valid}, invalid=${result.invalid})`);

    const status = runtime.status();
    assert(status.loaded === 10 && status.active === 10, "AgentRuntime: status mostra 10 agentes ativos");

    const ceo = runtime.getAgent("agent_ceo");
    assert(ceo?.role === "CEO & Strategic Leader", "AgentRuntime: agente CEO materializado");

    const vision = runtime.getAgent("agent_vision");
    assert(vision?.capabilities.includes("object_detection") === true, "AgentRuntime: Vision Agent com capacidades");

    const exec = await runtime.execute("agent_support", "Um cliente reporta erro de login.");
    assert(exec.success === true && exec.output.length > 0, "AgentRuntime: execução real do Support Agent (fallback offline)");

    const invalid = runtime.validate({ id: "x", role: "R" });
    assert(invalid.ok === false && invalid.errors.length > 0, "AgentRuntime: validate reporta erros de schema");
  }

  // ── 7. KnowledgeGraph ──
  {
    const graph = new KnowledgeGraph();
    graph.upsertEntity("agent_ceo", "agent", "CEO Agent", { squad: "leadership" });
    graph.upsertEntity("project_omega", "project", "Omega Platform", { stage: "phase1" });
    graph.upsertEntity("customer_acme", "customer", "ACME Corp", { tier: "enterprise" });
    graph.addRelation("agent_ceo", "project_omega", "governs", 3);
    graph.addRelation("project_omega", "customer_acme", "serves", 1);

    assert(graph.getEntity("project_omega")?.type === "project", "KnowledgeGraph: upsert + get");
    const neighbors = graph.getNeighbors("agent_ceo");
    assert(neighbors.length === 1 && neighbors[0].entity.id === "project_omega", "KnowledgeGraph: vizinhos por relação");

    const pathFound = graph.shortestPath("agent_ceo", "customer_acme");
    assert(pathFound !== null && pathFound.nodes.length === 3, "KnowledgeGraph: shortestPath 2 hops");

    const search = graph.searchEntities("acme");
    assert(search.length === 1 && search[0].id === "customer_acme", "KnowledgeGraph: pesquisa de entidades");

    const stats = graph.getStats();
    assert(stats.entities === 3 && stats.relations === 2, "KnowledgeGraph: stats");

    const tmpFile = path.join(process.cwd(), "database", "memory", "kg-test.json");
    const g2 = new KnowledgeGraph({ filePath: tmpFile });
    g2.upsertEntity("e1", "test", "Entity 1");
    g2.save();
    const g3 = new KnowledgeGraph({ filePath: tmpFile });
    assert(g3.getEntity("e1")?.name === "Entity 1", "KnowledgeGraph: persistência JSON round-trip");
    fs.rmSync(tmpFile, { force: true });
  }

  // ── 8. AIRouter ──
  {
    const router = new AIRouter(new OfflineProviderFactory());
    assert(router.inferTaskType("criar uma proposta comercial") === "creative", "AIRouter: inferTaskType criativo");
    assert(router.inferTaskType("investigar o mercado de IA") === "research", "AIRouter: inferTaskType research");
    assert(router.inferTaskType("corrigir bug no código") === "code", "AIRouter: inferTaskType code");
    assert(router.inferTaskType("processar imagem da câmera") === "vision", "AIRouter: inferTaskType vision");
    assert(router.inferTaskType("manter tudo local") === "privacy", "AIRouter: inferTaskType privacidade");

    const selection = router.route({ taskType: "code", privacyRequired: "HIGH" });
    assert(selection.isLocal === true, "AIRouter: rota critério com privacidade HIGH → local");

    const resolved = await router.resolve("tarefa qualquer sem provedor", { forceLocal: true });
    assert(resolved.provider === "internal" && resolved.text.length > 0, "AIRouter: resolve com fallback interno quando sem provedores");
    assert(resolved.latencyMs >= 0, "AIRouter: resolve devolve latencyMs");
  }

  // ── 9. OmegaPlatform (integração) ──
  {
    const platform = new OmegaPlatform();
    const loaded = platform.loadCoreAgents();
    assert(loaded.valid === 10, "OmegaPlatform: carrega 10 agentes nucleares");

    const status = platform.status();
    assert(status.kernel.name === "TVS Kernel", "OmegaPlatform: status do kernel");
    assert(status.runtime.loaded === 10, "OmegaPlatform: runtime com 10 agentes");
    assert(status.graph.entities >= 0, "OmegaPlatform: graph presente");

    const graphFile = path.join(process.cwd(), "database", "memory", "kg-omega.json");
    const platform2 = new OmegaPlatform({ graphFilePath: graphFile });
    await platform2.recordDecision("d1", "decision", "Primeira decisão", [{ target: "agent_ceo", type: "decided_by" }]);
    assert(platform2.graph.getEntity("d1") !== undefined, "OmegaPlatform: recordDecision cria entidade + relação");
    assert(platform2.graph.getNeighbors("d1").length === 1, "OmegaPlatform: relação persistida no graph");
    fs.rmSync(graphFile, { force: true });

    const autonomyStatus = platform.status();
    assert(typeof autonomyStatus.autonomy?.enabled === "boolean", "OmegaPlatform: status expõe autonomy");
  }

  // ── 10. AutonomyLayer ──
  {
    const stubPlanner: PlannerEngineAdapter = {
      getAutonomyLevel: () => 5,
      getCycleCount: () => 3,
      getTasks: (_status?: string) => [],
      addTask: (t: any) => ({ id: "at_1", title: t.title, description: t.description, priority: t.priority ?? "MEDIUM", category: t.category ?? "maintenance", status: "PENDING", createdAt: Date.now() }),
      executeNextTask: async () => 1,
      start: () => {},
      stop: () => {},
    };
    const stubEvolution: EvolutionEngineAdapter = {
      evolveAll: async () => [{ agentId: "agent_ceo", cycle: 1, wisdomScore: 42 }],
      getStats: () => ({ totalCycles: 1, totalAgents: 10, averageWisdom: 42, totalCapabilities: 3 }),
      startContinuousEvolution: () => {},
      stopContinuousEvolution: () => {},
    };
    const stubLearning: LearningEngineAdapter = {
      executeCycle: async () => {},
      getIntelligenceLevel: () => 300,
      getCycleCount: () => 1,
      getStats: () => ({ cycleCount: 1, intelligenceLevel: 300, multiplier: 6 }),
      start: () => {},
      stop: () => {},
    };

    const kernel = new Kernel();
    const layer = new AutonomyLayer(kernel, { planner: stubPlanner, evolution: stubEvolution, learning: stubLearning });
    const events: string[] = [];
    kernel.events.subscribe("omega:autonomy:cycle", (e: any) => { events.push(e.kind); });

    const planning = await layer.runCycle("planning");
    assert(planning.engine === "core-planner" && planning.executedTasks === 1, "Autonomy: planning via core planner");

    const evolution = await layer.runCycle("evolution");
    assert(evolution.records === 1 && evolution.agents.includes("agent_ceo"), "Autonomy: evolução via core engine");

    const learning = await layer.runCycle("learning");
    assert(learning.cycle === 1 && learning.intelligenceLevel === 300, "Autonomy: aprendizagem via core engine");

    assert(events.length === 3 && events.includes("learning"), "Autonomy: eventos por ciclo no bus");
    assert(layer.status().lastRuns.planning > 0 && layer.status().lastRuns.evolution > 0 && layer.status().lastRuns.learning > 0, "Autonomy: lastRuns atualizados");
    assert(layer.status().enabled === true && layer.status().learning?.cycleCount === 1, "Autonomy: status agrega os 3 motores");

    const bareKernel = new Kernel();
    const bareLayer = new AutonomyLayer(bareKernel);
    const task = await bareLayer.submitTask("Autotarefa", "descrição");
    assert(task.id.startsWith("task_") && task.type === "autonomy" && task.state === "FAILED" && (task.error ?? "").length > 0, "Autonomy: submitTask sem planner cria task kernel");
    assert(bareKernel.permissions.can("autonomy", "tasks.create") === true, "Autonomy: role 'autonomy' pode criar tasks");
    assert(bareKernel.permissions.listRoles().length === 8, "Autonomy: RBAC com 8 roles");

    const noPlannerStatus = bareLayer.status();
    assert(noPlannerStatus.enabled === false && noPlannerStatus.planning === null, "Autonomy: status vazio sem engines");

    const internalPlanning = await bareLayer.runCycle("planning");
    assert(internalPlanning.engine === "internal-planner" && internalPlanning.generatedTasks >= 1, "Autonomy: planning local sem engine");
  }

  // ── 11. AIOX Squads ──
  {
    const manifestsDir = path.join(process.cwd(), "src", "omega", "squads", "manifests");
    const registry = new SquadRegistry();
    const result = registry.loadFromDir(manifestsDir);
    assert(result.valid === 6 && result.files === 6, `Squads: carrega 6 manifestos (valid=${result.valid}, files=${result.files})`);

    const eng = registry.getSquad("squad_engineering");
    assert(eng?.domain === "software" && eng.agents.length === 3, "Squads: Engineering com 3 agentes e domínio");

    const security = registry.getSquad("squad_security");
    assert((security?.workflows[0]?.steps.length ?? 0) >= 3 && (security?.permissions.length ?? 0) >= 1, "Squads: Security com workflows e permissões");

    const status = registry.status();
    assert(status.loaded === 6 && status.active === 6, "Squads: status com 6 ativas");

    const runtime = new AgentRuntime({ providerFactory: new OfflineProviderFactory() });
    runtime.loadSpecsFromDir(path.join(process.cwd(), "src", "omega", "agent-runtime", "specs"));
    const members = registry.getSquadMembers(runtime, "squad_engineering");
    assert(members.present.length === 3 && members.missing.length === 0, "Squads: membros resolvidos no runtime");

    const run = await registry.runSquad(runtime, "squad_security", "Auditar as operações do sistema.");
    assert(run.succeeded === 1 && run.results[0]?.success === true && (run.results[0]?.output ?? "").length > 0, "Squads: runSquad executa membros (offline)");

    const hangingRuntime2 = {
      getAgent: () => ({ id: "agent_hang", name: "Hang", role: "r", execute: () => new Promise<any>(() => { /* nunca resolve */ }) }),
    } as any;
    const registry2 = new SquadRegistry({ agentTimeoutMs: 150 });
    registry2.loadSquads([{ id: "squad_t", name: "T", description: "teste", domain: "ops", status: "ACTIVE", agents: ["agent_hang"], objectives: [], tools: [], workflows: [], memory: {}, permissions: [] }]);
    const t1 = Date.now();
    const hangRun = await registry2.runSquad(hangingRuntime2, "squad_t", "x");
    assert(Date.now() - t1 < 5000, "Squads: agente pendurado não bloqueia (timeout)");
    assert(hangRun.failed === 1 && (hangRun.results[0]?.error ?? "").includes("excedeu"), "Squads: erro de timeout registado");

    const missing = registry.getSquadMembers(runtime, "squad_nao_existe");
    assert(missing.present.length === 0 && missing.missing.length === 0, "Squads: squad inexistente devolve vazio");
  }

  // ── 12. Factory (Unit 8) ──
  {
    const bareKernel = new Kernel();
    const factory = new FactoryEngine(bareKernel);

    const run = await factory.runPipeline({
      name: "Visera SaaS",
      industry: "saas",
      description: "Plataforma de automação comercial com agentes de IA.",
      goals: ["Gerar receita recorrente", "Automatizar vendas"],
      painPoints: ["Processo manual de vendas"],
      template: "express-api",
      deployTo: ["vercel", "render"],
    });

    assert(run.status === "APPROVED", "Factory: pipeline termina APPROVED");
    assert(run.diagnosis.length > 10 && run.techStack.length >= 1, "Factory: análise gerada (diagnóstico + stack)");
    assert(run.stages.length === 4, "Factory: 4 stages (ANALYZE/DESIGN/BUILD/DEPLOY)");
    assert(run.stages[0].status === "COMPLETED", "Factory: stage ANALYZE completado");
    assert(run.stages[1].status === "COMPLETED", "Factory: stage DESIGN completado");
    assert(run.stages[3].artifacts.length >= 1, "Factory: stage DEPLOY com artefactos");
    assert(run.deploySteps.some((s) => s.includes("VERCEL")) && run.deploySteps.some((s) => s.includes("RENDER")), "Factory: plano de deploy inclui Vercel + Render");
    assert(factory.getRun(run.id)?.id === run.id, "Factory: run persistida e recuperável");
    assert(factory.status().runs === 1 && factory.status().approved === 1, "Factory: status contabiliza runs");

    const invalid = await factory.runPipeline({
      name: "X",
      industry: "x",
      description: "curto",
      goals: [],
      painPoints: [],
      template: "express-api",
      deployTo: ["local"],
    });
    assert(invalid.status === "APPROVED", "Factory: aceita ordem mínima");

    const adapter = {
      analyze: async () => ({ diagnosis: "adapter", proposedSolution: "adapter", architecture: "adapter", techStack: ["x"], implementationPlan: "adapter", risks: [] }),
    };
    const factory2 = new FactoryEngine(new Kernel(), { solutionEngine: adapter });
    const run2 = await factory2.runPipeline({ name: "ABC", industry: "i", description: "descrição longa suficiente", goals: [], painPoints: [], template: "dashboard", deployTo: ["local"] });
    assert(run2.stages[0].notes[0].includes("Motor de soluções reais"), "Factory: usa engine adapter quando ligado");

    const hangingEngine = {
      analyze: () => new Promise<any>(() => { /* nunca resolve — simula modelo de IA pendurado */ }),
    };
    const factory3 = new FactoryEngine(new Kernel(), { solutionEngine: hangingEngine, stageTimeoutMs: 150 });
    const start = Date.now();
    const run3 = await factory3.runPipeline({ name: "Hang", industry: "i", description: "descrição longa suficiente", goals: [], painPoints: [], template: "express-api", deployTo: ["local"] });
    assert(Date.now() - start < 5000, "Factory: timeout rápido não bloqueia o pipeline");
    assert(run3.status === "APPROVED", "Factory: pipeline completa mesmo com engine pendurado");
    assert(run3.diagnosis.length > 10, "Factory: fallback heurístico aplicado quando engine não responde");
    assert(run3.stages[0].notes.some((n) => n.includes("Fallback")), "Factory: nota de fallback registada");
  }

  // ── 13. Enterprise modules (Unit 9) ──
  {
    const manifestsDir = path.join(process.cwd(), "src", "omega", "enterprise", "manifests");
    const hub = new EnterpriseHub(new Kernel());
    const result = hub.loadFromDir(manifestsDir);
    assert(result.valid === 6 && result.files === 6, `Enterprise: carrega 6 módulos (valid=${result.valid}, files=${result.files})`);

    const sales = hub.getModule("module_sales");
    assert(sales?.domain === "sales" && sales.agents.length === 1, "Enterprise: módulo sales com agente");
    assert((sales?.kpis.includes("revenue_pipeline") ?? false), "Enterprise: módulo expõe KPIs");

    const status = hub.status();
    assert(status.loaded === 6 && status.active === 6, "Enterprise: status com 6 módulos ativos");

    const runtime = new AgentRuntime({ providerFactory: new OfflineProviderFactory() });
    runtime.loadSpecsFromDir(path.join(process.cwd(), "src", "omega", "agent-runtime", "specs"));
    hub.attachRuntime(runtime);

    const members = hub.getModuleAgents("module_finance");
    assert(members.present.length === 1, "Enterprise: finance resolve agente no runtime");

    const action = await hub.runAction({ moduleId: "module_support", task: "Resolver incidente do cliente." });
    assert(action.succeeded === 1 && action.results[0]?.success === true && (action.results[0]?.output ?? "").length > 0, "Enterprise: runAction executa (offline)");

    const ev = { fired: false };
    hub.kernel.events.subscribe("omega:enterprise:complete", () => { ev.fired = true; });
    await hub.runAction({ moduleId: "module_sales", task: "Gerar proposta." });
    assert(ev.fired === true, "Enterprise: evento omega:enterprise:complete emitido no bus");

    const hangingRuntime = {
      getAgent: () => ({ id: "agent_hang", name: "Hang", role: "r", execute: () => new Promise<any>(() => { /* nunca resolve */ }) }),
    } as any;
    const hub2 = new EnterpriseHub(new Kernel(), undefined, { agentTimeoutMs: 150 });
    hub2.loadFromDir(manifestsDir);
    hub2.attachRuntime(hangingRuntime);
    const t0 = Date.now();
    const hangAction = await hub2.runAction({ moduleId: "module_sales", task: "x" });
    assert(Date.now() - t0 < 5000, "Enterprise: agente pendurado não bloqueia (timeout)");
    assert(hangAction.failed === 1 && (hangAction.results[0]?.error ?? "").includes("excedeu"), "Enterprise: erro de timeout registado");
  }

  // ── 14. Self-Heal Watchdog (destrava após 3 min de bloqueio) ──
  {
    const { SelfHealWatchdog, heartbeats } = require(path.join(process.cwd(), "src", "omega", "selfheal"));
    const { Kernel } = require(path.join(process.cwd(), "src", "omega", "kernel", "Kernel"));

    const watchdog = new SelfHealWatchdog({ staleMs: 180000, tickMs: 500, enabled: true });
    let resetCalls = 0;
    watchdog.register({
      id: "test_component",
      label: "Teste",
      reset: () => { resetCalls++; },
    });

    heartbeats.begin("test_component");
    assert(heartbeats.isStale("test_component", 180000) === false, "Watchdog: operação recém-iniciada não é stale");

    (heartbeats as any).states.get("test_component").lastPulse = Date.now() - 200000;
    assert(heartbeats.isStale("test_component", 180000) === true, "Watchdog: operação presa há >3min é stale");

    heartbeats.end("test_component");
    assert(heartbeats.isStale("test_component", 180000) === false, "Watchdog: sem operações ativas não é stale");

    const incidents = await watchdog.healNow("test_component");
    assert(incidents.length === 1, "Watchdog: healNow destrava componente");
    assert(incidents[0].action === "reset-forcado", "Watchdog: ação de reset registada");
    assert(resetCalls === 1, "Watchdog: reset do componente executado");
    assert(heartbeats.isStale("test_component", 180000) === false, "Watchdog: após reset, componente saudável");
    assert(watchdog.status().incidents.length === 1, "Watchdog: incidente no histórico de status");
  }

  // ── 15. E2E Task Execution (pipeline verificado) ──
  {
    const bus = new EventBus();
    const queue = new TaskQueue(bus, { concurrency: 2 });
    queue.setPlanner((task) => {
      const steps: any[] = [{ action: "agent", description: task.title }];
      if ((task.payload as any)?.tools) steps.push({ action: "tool", description: "invoke tool", tool: "test_tool" });
      return steps;
    });
    queue.setVerifier(async (task, result) => {
      if (result?.success === false) return { status: "FAIL", reasons: [result.error || "fail"] };
      const spec = (task.payload as any)?.verify;
      if (spec?.requireTruthy && !result[spec.requireTruthy]) return { status: "RETRY", reasons: ["not yet"] };
      return { status: "PASS", reasons: ["ok"] };
    });

    queue.registerExecutor("v-ok", async (task) => ({ success: true, output: `out:${task.payload?.x}` }));
    queue.registerExecutor("v-fail", async () => ({ success: false, error: "nope" }));

    const tOk = await queue.enqueue("v-ok", "Verified ok", { x: 1 }, "high");
    await waitFor(tOk);
    assert(tOk.plan?.length === 1 && tOk.plan?.[0]?.action === "agent", "E2E: planner produz plano executável");
    assert(tOk.state === "COMPLETED" && tOk.verification?.status === "PASS", "E2E: task verificada PASS conclui");
    assert(typeof tOk.latencyMs === "number" && tOk.latencyMs >= 0, "E2E: latencyMs medido");

    const tFail = await queue.enqueue("v-fail", "Verified fail", {}, "normal");
    await waitFor(tFail);
    assert(tFail.state === "FAILED" && tFail.verification?.status === "FAIL", "E2E: verifier FAIL marca FAILED com verification");

    let runCount = 0;
    queue.registerExecutor("v-retry", async () => {
      runCount++;
      return runCount === 1 ? { success: true, output: "" } : { success: true, output: "final" };
    });
    const tRetry = await queue.enqueue("v-retry", "Retry once", { verify: { requireTruthy: "output" } }, "normal");
    await waitFor(tRetry);
    assert(runCount === 2 && tRetry.state === "COMPLETED" && tRetry.verification?.status === "PASS", "E2E: verifier RETRY → RECOVERING → retry → PASS");

    const stats = queue.getStats();
    assert(stats.completed === 2 && stats.verified === 2 && stats.recovering === 0, "E2E: stats com verified/recovering");
  }

  // ── 16. Kernel tools + cancel RUNNING + persistência ──
  {
    const kernel = new Kernel();
    kernel.attachTools({
      listTools: () => [{ id: "t1", name: "T1", type: "REST_API", description: "x", enabled: true }],
      executeTool: async (id) => ({ success: true, result: `ran:${id}` }),
    });
    const toolEvents: string[] = [];
    kernel.events.subscribe("tool.called", (e: any) => { toolEvents.push(`called:${e.toolId}`); });
    kernel.events.subscribe("tool.completed", (e: any) => { toolEvents.push(`done:${e.toolId}`); });
    kernel.tasks.setVerifier(async (_t, r) => (r?.success === false ? { status: "FAIL", reasons: [] } : { status: "PASS", reasons: [] }));
    kernel.tasks.registerExecutor("tool-task", async (task) => {
      const spec = task.payload as any;
      const exec = await kernel.executeTool(spec.tools[0].id, {});
      return { success: exec.success !== false, output: String(exec.result), tools: [exec] };
    });

    assert(kernel.getTools().length === 1 && kernel.status().tools.total === 1, "Kernel: tools expostas no status");
    assert(kernel.status().tasks.verifier.attached === true && kernel.version === "1.1.0", "Kernel: verifier + versão no status");

    const toolTask = await kernel.tasks.enqueue("tool-task", "Use tool", { tools: [{ id: "t1", input: {} }] });
    await waitFor(toolTask);
    assert(toolTask.state === "COMPLETED" && String(toolTask.result?.output).includes("ran:t1"), "Kernel: tool executada pelo executor");
    assert(toolEvents.includes("called:t1") && toolEvents.includes("done:t1"), "Kernel: eventos tool.called/tool.completed emitidos");

    const busC = new EventBus();
    const qc = new TaskQueue(busC, { concurrency: 1 });
    qc.registerExecutor("c-slow", async (task) => { while (!task.cancelRequested) await new Promise((r) => setTimeout(r, 10)); return { success: true }; });
    const ct = await qc.enqueue("c-slow", "Cancel me");
    while (qc.getStats().running === 0) await new Promise((r) => setTimeout(r, 5));
    const cancelled = qc.cancel(ct.id);
    await waitFor(ct);
    assert(cancelled === true && ct.state === "CANCELLED", "E2E: cancel de task em RUNNING");

    const tmpFile = path.join(process.cwd(), "database", "memory", "task-queue-e2e-test.json");
    try {
      const busP = new EventBus();
      const q1 = new TaskQueue(busP, { concurrency: 1, filePath: tmpFile });
      q1.registerExecutor("p-echo", async (t) => `p:${t.payload?.x}`);
      q1.setVerifier(async () => ({ status: "PASS", reasons: ["ok"] }));
      const pt = await q1.enqueue("p-echo", "Persist", { x: 9 });
      await waitFor(pt);
      assert(pt.state === "COMPLETED", "E2E: persistência — task concluída");
      const q2 = new TaskQueue(busP, { concurrency: 1, filePath: tmpFile });
      assert(q2.history().some((t) => t.id === pt.id && t.state === "COMPLETED"), "E2E: persistência — histórico recarregado do disco");
      assert(q2.getStats().completed === 1, "E2E: persistência — counters restaurados");
    } finally {
      fs.rmSync(tmpFile, { force: true });
    }
  }

  // ── 17. TaskVerifier (engine reutilizável) ──
  {
    const { TaskVerifier, schemaRule, outputNonEmpty } = require(path.join(process.cwd(), "src", "omega", "verifier", "TaskVerifier"));
    const tv = new TaskVerifier();
    tv.addRules("x", [schemaRule(["output"]), outputNonEmpty()]);
    const ok = await tv.verify({ type: "x" }, { output: "hello" });
    assert(ok.status === "PASS" && ok.passed === 2, "TaskVerifier: schema + output PASS");
    const bad = await tv.verify({ type: "x" }, { output: "" });
    assert(bad.status === "FAIL" && bad.failed === 1, "TaskVerifier: output vazio FAIL");
    const none = await tv.verify({ type: "y" }, {});
    assert(none.status === "PASS", "TaskVerifier: sem regras → PASS");
  }

  // ── 18. EventBus v2 (distribuído: wildcards · fonte · retry · isolamento · histórico) ──
  {
    assert(topicMatches("task.*", "task.completed") === true, "EventBus: wildcard task.* casa task.completed");
    assert(topicMatches("task.*", "tool.completed") === false, "EventBus: wildcard task.* NÃO casa tool.completed");
    assert(topicMatches("memory.*", "memory:event") === true, "EventBus: memory.* casa memory:event (separador ':')");
    assert(topicMatches("*", "qualquer.coisa.que.seja") === true, "EventBus: '*' casa qualquer tópico");

    const bus = new EventBus({ maxHistory: 50 });
    const wildcardReceived: string[] = [];
    const allReceived: string[] = [];
    bus.subscribe("task.*", (t: any) => { wildcardReceived.push(t.id); });
    bus.subscribe("*", (t: any, meta) => { allReceived.push(`${meta.topic}:${t?.id ?? "?"}`); });
    await bus.publish("task.completed", { id: "t1" }, "test");
    await bus.publish("tool.completed", { id: "tool1" }, "test");
    await bus.publish("task.failed", { id: "t2" }, "test");
    assert(wildcardReceived.length === 2 && wildcardReceived.join() === "t1,t2", "EventBus: wildcard recebe 2 task.*");
    assert(allReceived.length === 3, "EventBus: '*' recebe todos");

    const sourceBus = new EventBus();
    let fromA = 0;
    let fromB = 0;
    sourceBus.subscribe("x", () => { fromA++; }, { source: "a" });
    sourceBus.subscribe("x", () => { fromB++; }, { source: "b" });
    await sourceBus.publish("x", {}, "a");
    await sourceBus.publish("x", {}, "b");
    await sourceBus.publish("x", {});
    assert(fromA === 1 && fromB === 1, "EventBus: filtro por source (a→1, b→1, sem fonte→0)");

    const iso = new EventBus();
    let goodRuns = 0;
    let errorReports = 0;
    iso.subscribe("boom", () => { goodRuns++; });
    iso.subscribe("boom", () => { throw new Error("handler falhou"); });
    iso.subscribe(EVENTBUS_ERROR_TOPIC, (e: any) => { errorReports++; assert(e?.topic === "boom", "EventBus: erro reporta tópico original"); });
    await iso.publish("boom", {}, "test");
    assert(goodRuns === 1, "EventBus: isolamento — handler bom corre apesar do outro falhar");
    assert(iso.getStats().totalErrors === 1, "EventBus: totalErrors = 1 após handler falhar");

    const retryBus = new EventBus();
    let attempts = 0;
    retryBus.subscribe("flaky", () => {
      attempts++;
      if (attempts < 3) throw new Error("tenta outra vez");
    }, { retries: 2 });
    await retryBus.publish("flaky", {}, "test");
    assert(attempts === 3 && retryBus.getStats().totalErrors === 0, "EventBus: retry (2) — 3 tentativas, 0 erros finais");

    const onceBus = new EventBus();
    let onceWildcard = 0;
    onceBus.once("task.*", () => { onceWildcard++; });
    await onceBus.publish("task.completed", {}, "test");
    await onceBus.publish("task.failed", {}, "test");
    assert(onceWildcard === 1, "EventBus: once com wildcard dispara apenas uma vez");

    const ring = new EventBus({ maxHistory: 5 });
    for (let i = 0; i < 10; i++) await ring.publish("tick", { i }, "test");
    const statsRing = ring.getStats();
    assert(statsRing.historySize === 5 && statsRing.maxHistory === 5, "EventBus: ring buffer limita a maxHistory (5)");
    assert(ring.history()[0].payload.i === 5, "EventBus: ring buffer descarta os mais antigos (primeiro = i5)");
    assert(ring.history("tick").length === 5, "EventBus: history(topic) filtra por tópico");
    let replayed = 0;
    ring.replay("tick", () => { replayed++; });
    await new Promise((r) => setTimeout(r, 20));
    assert(replayed === 5, "EventBus: replay entrega o histórico a novos subscritores");
    ring.clear();
    assert(ring.history().length === 0 && ring.getStats().totalSubscribers === 0, "EventBus: clear limpa subscritores + histórico");
  }

  // ── 19. EventBridge (emitter → bus · bus → Socket.IO · bus → SSE) ──
  {
    const emitter = new EventEmitter();
    const bus = new EventBus();
    const unsub = bridgeEventEmitter(emitter, bus, { source: "memory-engine" });
    const stmEvents: string[] = [];
    const memoryEvents: string[] = [];
    bus.subscribe("stm:added", (p: any) => { stmEvents.push(p.sessionId); });
    bus.subscribe("memory:event", () => { memoryEvents.push("evt"); });
    emitter.emit("stm:added", { sessionId: "s1" });
    emitter.emit("memory:event", { kind: "x" });
    await new Promise((r) => setTimeout(r, 20));
    assert(stmEvents.length === 1 && stmEvents[0] === "s1", "Bridge: EventEmitter → bus (stm:added republicado)");
    assert(memoryEvents.length === 1, "Bridge: EventEmitter → bus (memory:event republicado)");
    unsub();
    emitter.emit("stm:added", { sessionId: "s2" });
    await new Promise((r) => setTimeout(r, 20));
    assert(stmEvents.length === 1, "Bridge: unsubscribe do emitter interrompe o fluxo");

    const ioBus = new EventBus();
    const emitted: any[] = [];
    const fakeIo = { emit: (event: string, data: any) => { emitted.push({ event, data }); } };
    const unsubIo = bridgeSocketIO(fakeIo, ioBus, { topics: ["task.*"] });
    await ioBus.publish("task.completed", { id: "t9" }, "test");
    await ioBus.publish("tool.completed", { id: "ignored" }, "test");
    assert(emitted.length === 1 && emitted[0].event === "omega:event", "Bridge: bus → Socket.IO emite só os tópicos pedidos");
    assert(emitted[0].data.topic === "task.completed" && emitted[0].data.payload.id === "t9", "Bridge: payload com topic/source/ts/payload");
    unsubIo();
    await ioBus.publish("task.failed", { id: "t10" }, "test");
    assert(emitted.length === 1, "Bridge: unsubscribe do Socket.IO interrompe o fluxo");

    const sseBus = new EventBus();
    const chunks: string[] = [];
    const resFake: any = {
      writeHead: () => {},
      write: (c: string) => { chunks.push(c); },
      on: (_evt: string, cb: any) => { resFake._close = cb; },
    };
    const unsubSse = openSSEStream(resFake, sseBus, { topics: ["task.*"] });
    await sseBus.publish("task.completed", { id: "sse1" }, "test");
    assert(chunks.some((c) => c.includes("event: task.completed")), "Bridge: SSE escreve a linha event");
    assert(chunks.some((c) => c.includes('"id":"sse1"')), "Bridge: SSE escreve o payload JSON");
    unsubSse();
    resFake._close?.();
    await sseBus.publish("task.failed", { id: "sse2" }, "test");
    const afterClose = chunks.length;
    await new Promise((r) => setTimeout(r, 20));
    await sseBus.publish("task.failed", { id: "sse3" }, "test");
    assert(chunks.length === afterClose, "Bridge: SSE deixa de escrever após close/unsubscribe");
  }

  // ── 20. Composite Verifier (interface Verifier + CompositeVerifier + Kernel.attachVerifier) ──
  {
    const { CompositeVerifier, toVerifierFn } = await import("../src/omega/verifier/composite");
    const { TaskVerifier, resultTruthy, schemaRule } = await import("../src/omega/verifier/TaskVerifier");

    const passVerifier = { name: "pass", verify: async () => ({ status: "PASS" as const, reasons: [] }) };
    const failVerifier = { name: "fail", verify: async () => ({ status: "FAIL" as const, reasons: ["nope"] }) };
    const retryVerifier = { name: "retry", verify: async () => ({ status: "RETRY" as const, reasons: ["try again"] }) };

    const composite = new CompositeVerifier([passVerifier]);
    assert(composite.size === 1 && composite.name === "CompositeVerifier", "CompositeVerifier: cria com lista inicial e name");

    const allPass = await composite.verify({ type: "t" }, { ok: true });
    assert(allPass.status === "PASS" && allPass.reasons[0] === "all verifiers passed", "CompositeVerifier: todos PASS → PASS");

    composite.add(failVerifier);
    assert(composite.size === 2, "CompositeVerifier: add() incremental");
    const withFail = await composite.verify({ type: "t" }, { ok: true });
    assert(withFail.status === "FAIL" && withFail.reasons[0].includes("[fail]"), "CompositeVerifier: um FAIL → FAIL com origem no nome");

    composite.add(retryVerifier);
    const withRetry = await composite.verify({ type: "t" }, { ok: true });
    assert(withRetry.status === "FAIL", "CompositeVerifier: FAIL tem prioridade sobre RETRY");

    const retryOnly = new CompositeVerifier([passVerifier, retryVerifier]).verify({ id: "t", type: "x", title: "t", priority: "normal" }, {});
    const retryRes = await retryOnly;
    assert(retryRes.status === "RETRY", "CompositeVerifier: RETRY > PASS");

    const humanOnly = new CompositeVerifier([retryVerifier, { name: "human", verify: async () => ({ status: "HUMAN" as const, reasons: [] }) }]).verify({ id: "t", type: "x", title: "t", priority: "normal" }, {});
    const humanRes = await humanOnly;
    assert(humanRes.status === "HUMAN", "CompositeVerifier: HUMAN > RETRY");

    const throwing = new CompositeVerifier([{ name: "boom", verify: async () => { throw new Error("x"); } }]).verify({ id: "t", type: "x", title: "t", priority: "normal" }, {});
    const throwRes = await throwing;
    assert(throwRes.status === "FAIL" && throwRes.reasons[0].includes("[boom]"), "CompositeVerifier: verifier que lança erro → FAIL isolado");

    const fn = toVerifierFn(failVerifier);
    const viaFn = await fn({ id: "t", type: "x", title: "t", priority: "normal" } as any, {}, {});
    assert(viaFn.status === "FAIL" && Array.isArray(viaFn.reasons), "CompositeVerifier: toVerifierFn adapta para TaskVerifierFn");

    const taskVerifier = new TaskVerifier();
    taskVerifier.addRules("*", [resultTruthy(), schemaRule(["output"])]);
    const ruleRes = await taskVerifier.verify({ type: "x" }, { success: true, output: "o" });
    assert(ruleRes.status === "PASS" && ruleRes.passed === 2, "TaskVerifier: implementa Verifier e valida rules");
    const ruleFail = await taskVerifier.verify({ type: "x" }, { success: false });
    assert(ruleFail.status === "FAIL" && ruleFail.failed === 2, "TaskVerifier: rules falham → FAIL");

    const kernel = new Kernel();
    kernel.attachVerifier(new CompositeVerifier([taskVerifier]));
    const kTask = await kernel.runTask("e2e", "composite task", {}, "normal", { id: "root", name: "Root", role: "root" });
    assert(kTask.id.startsWith("task_"), "Kernel: attachVerifier aceita Verifier e converte internamente");
    assert(kernel.status().tasks.verifier.attached === true, "Kernel: verifierStats.attached reflete attachVerifier");
  }

  // ── 21. Architecture Intelligence (GraphifyAdapter + RiskAnalyzer + ContextBuilder) ──
  {
    const { ArchitectureIntelligence } = await import("../src/omega/intelligence/architecture");
    const graphPath = path.join(process.cwd(), "graphify-out", "graph.json");
    const ai = new ArchitectureIntelligence({ graphPath }).initialize();
    assert(ai.isReady() === true, "ArchitectureIntelligence: carrega graph.json do repositório");

    const summary = ai.summary() as { ready: true; stats: any; risk: any; provenance: any };
    assert(summary.ready === true && summary.stats.nodes > 1000, "ArchitectureIntelligence: summary expõe stats reais do grafo");
    assert(summary.provenance.origin === "VISERON" && summary.provenance.kernel === "OMEGA", "ArchitectureIntelligence: provenance registada (VISERON/OMEGA/AIOX/Pedro-Trinnity)");
    assert(summary.stats.topHubs.length > 0 && summary.stats.topHubs[0].degree >= 10, "ArchitectureIntelligence: top hubs com grau real");
    assert(summary.risk.highCount + summary.risk.mediumCount + summary.risk.lowCount === summary.risk.items.length, "RiskAnalyzer: contagens batem com itens");

    const q = ai.query("TaskQueue");
    assert(q.nodes.length > 0 && q.reason.startsWith("subgraph"), "ContextBuilder: query devolve subgrafo relevante, não o grafo inteiro");
    assert(q.files.length <= 20, "ContextBuilder: limite de ficheiros respeitado");

    const impact = ai.adapter.impact("src_omega_kernel_taskqueue", 1);
    assert(impact.subject.startsWith("src_omega"), "GraphifyAdapter: impact devolve o subject normalizado");
    assert(impact.affectedNodes.every((n) => n.hops <= 1), "GraphifyAdapter: impact respeita maxHops");

    const pathRes = ai.adapter.pathBetween("src_omega_kernel_kernel", "src_omega_kernel_taskqueue");
    assert(pathRes.found === true, "GraphifyAdapter: pathBetween encontra caminho entre módulos do kernel");

    const context = ai.context.forFiles(["src/omega/kernel/Kernel.ts", "src/omega/kernel/TaskQueue.ts"]);
    assert(context.nodes.length > 0, "ContextBuilder: forFiles devolve cluster em torno dos ficheiros fornecidos");
  }

  // ── 22. AutonomyOS — permission engine L0-L5 ──
  {
    const { AutonomyOS, DEFAULT_DOMAIN_POLICIES, AUTONOMY_LEVELS } = await import("../src/omega/autonomy/AutonomyOS");
    const os = new AutonomyOS();

    assert(AUTONOMY_LEVELS.length === 6, "AutonomyOS: 6 níveis L0-L5 definidos");
    assert(AUTONOMY_LEVELS[0].name === "observed" && AUTONOMY_LEVELS[5].name === "operational", "AutonomyOS: hierarquia L0 observed → L5 operational");

    const finance = DEFAULT_DOMAIN_POLICIES.find((p) => p.domain === "finance");
    assert(finance?.autoBelow === 50 && finance.approvalFrom === 500 && finance.denyAbove === 50000, "AutonomyOS: política financeira com thresholds (<€50 auto, ≥€500 aprovação, >€50k negado)");

    const auto = os.assess({ domain: "finance", op: "charge", value: 25 });
    assert(auto.verdict === "auto" && auto.level === 4, "AutonomyOS: €25 em finance → auto (abaixo de autoBelow €50)");

    const approval = os.assess({ domain: "finance", op: "charge", value: 1500 });
    assert(approval.verdict === "approval" && approval.reason.includes("approvalFrom"), "AutonomyOS: €1500 em finance → approval (≥€500)");

    const denied = os.assess({ domain: "finance", op: "charge", value: 100000 });
    assert(denied.verdict === "deny" && denied.reason.includes("denyAbove"), "AutonomyOS: €100k em finance → deny (acima de denyAbove €50k)");

    const opDenied = os.assess({ domain: "finance", op: "card_data_access" });
    assert(opDenied.verdict === "deny" && opDenied.reason.includes("deny list"), "AutonomyOS: card_data_access → deny na lista negra");

    const opApproval = os.assess({ domain: "finance", op: "refund", value: 10 });
    assert(opApproval.verdict === "approval" && opApproval.reason.includes("requireApprovalFor"), "AutonomyOS: refund exige aprovação mesmo abaixo do threshold");

    const systemL1 = os.assess({ domain: "system", op: "restart_prod" });
    assert(systemL1.verdict === "approval", "AutonomyOS: system (L1) restart_prod → approval");
    const systemDeny = os.assess({ domain: "system", op: "rm_root" });
    assert(systemDeny.verdict === "deny", "AutonomyOS: system rm_root → deny");

    const researchL5 = os.assess({ domain: "research", op: "market_scan" });
    assert(researchL5.verdict === "auto" && researchL5.level === 5, "AutonomyOS: research (L5) market_scan → auto");

    const unknownDomain = os.assess({ domain: "data", op: "export_all" });
    assert(unknownDomain.verdict === "approval", "AutonomyOS: data export_all → approval (requireApprovalFor)");

    const audit = os.getAudit();
    assert(audit.length >= 9 && audit[0].op === "export_all", "AutonomyOS: auditoria regista decisões (mais recente primeiro)");

    const summary = os.summary();
    assert(summary.domains === 7 && summary.decisions === audit.length, "AutonomyOS: summary reflete políticas e decisões");

    os.configure({ domain: "data", level: 5 });
    const reconfigured = os.assess({ domain: "data", op: "read" });
    assert(reconfigured.verdict === "auto" && reconfigured.level === 5, "AutonomyOS: configure() eleva data para L5");

    const policy = os.getPolicies().find((p) => p.domain === "deploy");
    assert(policy?.level === 2 && policy.denyFor?.includes("prod_down") === true, "AutonomyOS: deploy L2 com prod_down na lista negra");

    const omega = await import("../src/omega");
    const platform = new omega.OmegaPlatform({});
    assert(platform.autonomyOS.getLevels().length === 6, "OmegaPlatform: autonomyOS exposto na plataforma");
    const assessed = await platform.assessAutonomy({ domain: "finance", op: "charge", value: 10 });
    assert(assessed.verdict === "auto", "OmegaPlatform: assessAutonomy devolve decisão e publica no bus");
  }

  async function section21_VaecOrchestrator() {
    console.log("\n--- SECÇÃO 21: VAEC Orchestrator (evolução & continuidade) ---");
    const { VaecOrchestrator } = await import("../src/omega/evolution");
    const os = require("os");
    const tmp = path.join(os.tmpdir(), `vaec-test-${Date.now()}.jsonl`);
    const events = new EventBus();
    const received: Array<{ topic: string; payload: any }> = [];
    events.subscribe("vaec:gate", (p) => { received.push({ topic: "vaec:gate", payload: p }); });
    events.subscribe("vaec:stage", (p) => { received.push({ topic: "vaec:stage", payload: p }); });
    events.subscribe("vaec:rollback", (p) => { received.push({ topic: "vaec:rollback", payload: p }); });
    events.subscribe("vaec:promoted", (p) => { received.push({ topic: "vaec:promoted", payload: p }); });

    // 21.1 Ciclo completo com todos os gates a passar → PROMOTED + jornal persistido
    let rolledBack = 0;
    const runnerOk = new VaecOrchestrator({
      rootDir: process.cwd(),
      events,
      journalPath: tmp,
      runners: {
        implement: async () => ({ ref: "ref_ok", message: "vaec: teste" }),
        test: async () => ({ stage: "TEST", ok: true, evidence: ["testes 360/360"] }),
        sync: async () => ({ stage: "SYNC", ok: true, evidence: ["already up to date"] }),
        build: async () => ({ stage: "BUILD", ok: true, evidence: ["tsc limpo"] }),
        verify: async () => ({ stage: "VERIFY", ok: true, evidence: ["status:system OK"] }),
        learn: async () => ({ stage: "LEARN", ok: true, evidence: ["aprendizado registado"] }),
        promote: async () => ({ pushed: false }),
        rollback: async () => { rolledBack++; return { stage: "ROLLBACK", ok: true, evidence: ["rollback"] }; },
      },
    });
    const recOk = await runnerOk.runCycle("teste promoção");
    assert(recOk.outcome === "PROMOTED" && recOk.stages.length === 6, "VAEC: ciclo completo com gates OK → PROMOTED (6 stages)");
    assert(recOk.stages.filter((s) => !s.ok).length === 0, "VAEC: todos os stages com ok=true");
    assert(rolledBack === 0, "VAEC: nenhum rollback quando tudo passa");
    assert(received.some((r) => r.topic === "vaec:promoted"), "VAEC: evento vaec:promoted publicado no bus");
    assert(received.some((r) => r.topic === "vaec:gate" && r.payload.stage === "VERIFY" && r.payload.ok), "VAEC: eventos vaec:gate publicados por stage");

    // 21.2 Gate TEST falha → ROLLED_BACK, rollback chamado, jornal regista
    const events2 = new EventBus();
    const received2: any[] = [];
    events2.subscribe("vaec:rollback", (p) => { received2.push(p); });
    let rollbackBase = "";
    const runnerFail = new VaecOrchestrator({
      rootDir: process.cwd(),
      events: events2,
      journalPath: tmp,
      runners: {
        implement: async () => ({ ref: "ref_bad", message: "vaec: quebra" }),
        test: async () => ({ stage: "TEST", ok: false, evidence: ["3 testes falharam"], error: "testes falharam" }),
        build: async () => ({ stage: "BUILD", ok: true, evidence: [] }),
        rollback: async (ctx) => { rollbackBase = ctx.baseRef; return { stage: "ROLLBACK", ok: true, evidence: [`restaurado ${ctx.baseRef}`] }; },
      },
    });
    const recFail = await runnerFail.runCycle("teste rollback");
    assert(recFail.outcome === "ROLLED_BACK" && recFail.rollbackTo === recFail.baseRef, "VAEC: gate falho → ROLLED_BACK com rollbackTo=baseRef");
    assert(recFail.stages.some((s) => s.stage === "ROLLBACK" && s.ok), "VAEC: stage ROLLBACK executado e ok");
    assert(rollbackBase === recFail.baseRef, "VAEC: runner de rollback recebeu baseRef correto");
    assert(received2.length >= 1 && received2[0].stage === "TEST", "VAEC: evento vaec:rollback com stage da falha");

    // 21.3 Falha no IMPLEMENT → FAILED sem gates
    const runnerImplFail = new VaecOrchestrator({
      rootDir: process.cwd(),
      journalPath: tmp,
      runners: {
        implement: async () => { throw new Error("working tree sem mudanças"); },
      },
    });
    const recImpl = await runnerImplFail.runCycle("teste sem mudanças");
    assert(recImpl.outcome === "FAILED" && recImpl.stages.length === 1 && !recImpl.stages[0].ok, "VAEC: falha no implement → FAILED sem correr gates");

    // 21.4 Persistência: novo orchestrator lê o jornal
    const reloaded = new VaecOrchestrator({ rootDir: process.cwd(), journalPath: tmp });
    assert(reloaded.history.length >= 3, `VAEC: jornal persiste histórico (${reloaded.history.length} runs)`);
    assert(reloaded.status().historySize === reloaded.history.length, "VAEC: status().historySize reflete o jornal");

    // 21.5 VAEC integrado no OmegaPlatform (status expõe orquestrador)
    const omegaMod = await import("../src/omega");
    const p2 = new omegaMod.OmegaPlatform({});
    assert(typeof p2.vaec.status === "function", "OmegaPlatform: vaec (VaecOrchestrator) exposto");
    assert("vaec" in p2.status() && p2.status().vaec.historySize >= 0, "OmegaPlatform: status().vaec inclui histórico");
  }

  async function section22_RealityHardening() {
    console.log("\n--- SECÇÃO 22: Reality Hardening (REAL > MOCK > CLAIM) ---");

    // 22.1 RealityPolicy: prioridade pessimista (REAL nunca sobrescreve MOCK)
    const { RealityRegistry, ProviderUnavailableError, ProviderExecutionError, realityMeta } = await import("../src/core/policy/RealityPolicy");
    const rr = new RealityRegistry();
    rr.set("comp.a", "MOCK", "sem credenciais");
    rr.set("comp.a", "REAL", "claim otimista");
    assert(rr.get("comp.a")?.mode === "MOCK", "RealityPolicy: MOCK nunca é sobrescrito por REAL (nunca promovido a claim)");
    rr.set("comp.b", "REAL", "verdade");
    rr.set("comp.b", "NOT_IMPLEMENTED", "degradou");
    assert(rr.get("comp.b")?.mode === "NOT_IMPLEMENTED", "RealityPolicy: estado mais grave vence (NOT_IMPLEMENTED > REAL)");
    assert(rr.isReal("comp.b") === false, "RealityPolicy: isReal falso quando degradado");
    const sum = rr.summary();
    assert(sum.mock.includes("comp.a") && sum.notImplemented.includes("comp.b"), "RealityPolicy: summary agrupa por modo");

    // 22.2 Erros honestos de provider (nunca success falso)
    const ua = new ProviderUnavailableError("anthropic", "credentials_unavailable");
    assert(ua.code === "PROVIDER_UNAVAILABLE" && ua.meta.mode === "NOT_IMPLEMENTED", "RealityPolicy: ProviderUnavailableError com meta NOT_IMPLEMENTED");
    const pe = new ProviderExecutionError("openai", "rate limited");
    assert(pe.code === "PROVIDER_EXECUTION_ERROR" && pe.meta.mode === "PARTIAL", "RealityPolicy: ProviderExecutionError com meta PARTIAL");
    const meta = realityMeta("MOCK", "motivo real", { provider: "ollama" });
    assert(meta.mode === "MOCK" && meta.provider === "ollama" && typeof meta.at === "number", "RealityPolicy: realityMeta monta metadata explícita");

    // 22.3 SkillPipeline: indexação real, sem execução simulada
    const { skillPipeline } = await import("../src/core/skills");
    const sumSkills = await skillPipeline.summary();
    assert(sumSkills.total === sumSkills.indexed && sumSkills.total >= 1000, `SkillPipeline: summary real com ${sumSkills.total} skills INDEXED`);
    assert((sumSkills.status.INDEXED ?? 0) === sumSkills.total, "SkillPipeline: todas as skills contam como INDEXED (nunca executadas)");
    const inspected = await skillPipeline.inspect("nonexistent_skill_xyz");
    assert(inspected.status === "REJECTED", "SkillPipeline: skill inexistente → REJECTED honesto");
    const perm = await skillPipeline.permission("nonexistent_skill_xyz", false);
    assert(perm.status === "REJECTED" && perm.allowed === false, "SkillPipeline: permission sem skill → REJECTED, nunca allow");
    const exec = await skillPipeline.execute("any_skill");
    assert(exec.stage === "EXECUTION" && exec.status === "REJECTED" && exec.allowed === false, "SkillPipeline: execute devolve REJECTED (contrato futuro, sem simulação)");

    // 22.4 Agent Registry: contagens reais (3 runtime, 5.014 mentes, 10 specs, 6 squads)
    const { registry: agentRegistry } = await import("../src/agents/registry");
    assert(agentRegistry.mode === "REAL", "AgentRegistry: mode REAL (não 200 fictício)");
    assert(agentRegistry.total === 3, `AgentRegistry: total real de agentes runtime = 3 (obtido ${agentRegistry.total})`);
    assert(agentRegistry.mindsLoaded === 5014, `AgentRegistry: minds real = 5014 (obtido ${agentRegistry.mindsLoaded})`);
    assert(agentRegistry.omegaSpecs === 10, `AgentRegistry: specs OMEGA = 10 (obtido ${agentRegistry.omegaSpecs})`);
    assert(agentRegistry.squadManifests === 6, `AgentRegistry: squads = 6 (obtido ${agentRegistry.squadManifests})`);
    const { generated } = await import("../src/agents/generated");
    assert(generated.mode === "NOT_IMPLEMENTED" && generated.agents.length === 0, "AgentRegistry: agentes gerados = 0 NOT_IMPLEMENTED (sem placeholders)");

    // 22.5 N8N LocalWorkflowEngine: mocks explícitos, tools reais, falha honesta
    const { ToolManager } = await import("../src/core/tools/ToolManager");
    const { AgentManager } = await import("../src/core/AgentManager");
    const { MemoryEngine } = await import("../src/core/memory/MemoryEngine");
    const { reality } = await import("../src/core/policy/RealityPolicy");
    const { N8NBridge } = await import("../src/integrations/n8n/N8NBridge");
    const tm = new ToolManager();
    const am = new AgentManager();
    const mem = new MemoryEngine(path.join(require("os").tmpdir(), `tvs-mem-${Date.now()}`));
    const bridge = new N8NBridge(tm, am, mem, 5699);
    assert(reality.get("n8n.engine")?.mode === "MOCK", "N8N: registry reality n8n.engine = MOCK (honesto)");

    const tDelay = {
      id: "t_delay", name: "t", description: "t", triggers: [] as string[],
      steps: [
        { id: "s2", type: "delay" as const, config: { duration: 5 } },
        { id: "s1", type: "code" as const, config: { code: "return { computed: input.x * 2 };" } },
      ],
    };
    const resDelay = await bridge.workflowEngine.execute(tDelay, { x: 21 });
    assert(resDelay.success === true && resDelay.result?.mode === "REAL", "N8N: passos code/delay executados de verdade (mode REAL)");
    assert(resDelay.result?.result?.computed === 42, "N8N: passo code computou resultado real (42)");

    const tWebhook = {
      id: "t_webhook", name: "t", description: "t", triggers: [] as string[],
      steps: [{ id: "s1", type: "webhook" as const, config: { path: "/x" } }],
    };
    const resWebhook = await bridge.workflowEngine.execute(tWebhook, {});
    assert(resWebhook.success === true && resWebhook.result?.mode === "MOCK", "N8N: passo webhook marcado como MOCK (nunca parece sucesso real)");

    const tToolMissing = {
      id: "t_tool", name: "t", description: "t", triggers: [] as string[],
      steps: [{ id: "s1", type: "tool" as const, config: { toolId: "tool_nao_existe" } }],
    };
    const resTool = await bridge.workflowEngine.execute(tToolMissing, {});
    assert(resTool.result?.mode === "NOT_IMPLEMENTED", "N8N: tool inexistente → NOT_IMPLEMENTED (falha honesta)");
    bridge.stop();
  }

  await section21_VaecOrchestrator();
  await section22_RealityHardening();

  console.log(`\n==========================================`);
  console.log(total === passed ? `✅ OMEGA: ${passed}/${total} testes passaram` : `❌ OMEGA: ${passed}/${total} — FALHAS DETETADAS`);
  console.log(`==========================================\n`);

  if (passed !== total) process.exit(1);
}

runOmegaTests().catch((e) => {
  console.error("OMEGA tests crashed:", e);
  process.exit(1);
});
