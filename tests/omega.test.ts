import * as path from "path";
import * as fs from "fs";
import { EventBus } from "../src/omega/kernel/EventBus";
import { TaskQueue } from "../src/omega/kernel/TaskQueue";
import { Permissions } from "../src/omega/kernel/Permissions";
import { Kernel } from "../src/omega/kernel/Kernel";
import { AutonomyLayer, PlannerEngineAdapter, EvolutionEngineAdapter, LearningEngineAdapter } from "../src/omega/autonomy";
import { SquadRegistry } from "../src/omega/squads";
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
    while (task.state === "QUEUED" || task.state === "RUNNING") {
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
    assert(stats.topics === 2 && stats.totalEmitted === 3, "EventBus: stats (topics/emitted)");

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
    assert(result.valid === 5 && result.files === 5, `Squads: carrega 5 manifestos (valid=${result.valid}, files=${result.files})`);

    const eng = registry.getSquad("squad_engineering");
    assert(eng?.domain === "software" && eng.agents.length === 3, "Squads: Engineering com 3 agentes e domínio");

    const security = registry.getSquad("squad_security");
    assert((security?.workflows[0]?.steps.length ?? 0) >= 3 && (security?.permissions.length ?? 0) >= 1, "Squads: Security com workflows e permissões");

    const status = registry.status();
    assert(status.loaded === 5 && status.active === 5, "Squads: status com 5 ativas");

    const runtime = new AgentRuntime({ providerFactory: new OfflineProviderFactory() });
    runtime.loadSpecsFromDir(path.join(process.cwd(), "src", "omega", "agent-runtime", "specs"));
    const members = registry.getSquadMembers(runtime, "squad_engineering");
    assert(members.present.length === 3 && members.missing.length === 0, "Squads: membros resolvidos no runtime");

    const run = await registry.runSquad(runtime, "squad_security", "Auditar as operações do sistema.");
    assert(run.succeeded === 1 && run.results[0]?.success === true && (run.results[0]?.output ?? "").length > 0, "Squads: runSquad executa membros (offline)");

    const missing = registry.getSquadMembers(runtime, "squad_nao_existe");
    assert(missing.present.length === 0 && missing.missing.length === 0, "Squads: squad inexistente devolve vazio");
  }

  console.log(`\n==========================================`);
  console.log(total === passed ? `✅ OMEGA: ${passed}/${total} testes passaram` : `❌ OMEGA: ${passed}/${total} — FALHAS DETETADAS`);
  console.log(`==========================================\n`);

  if (passed !== total) process.exit(1);
}

runOmegaTests().catch((e) => {
  console.error("OMEGA tests crashed:", e);
  process.exit(1);
});
