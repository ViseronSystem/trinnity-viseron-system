import { ViseronCore } from "../src/core/ViseronCore";
import { IAgent, AgentExecutionResult } from "../src/core/types";

async function runCoreTests() {
  console.log("==========================================");
  console.log("INICIANDO PRUEBAS UNITARIAS DEL TVS CORE v1.0");
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

  const tvs = new ViseronCore();
  tvs.start();

  // Test 1: AgentManager - Registro, filtrado y conteo
  const testAgent: IAgent = {
    id: "test_ag_01",
    name: "AgentePrueba",
    role: "Tester",
    status: "ACTIVE",
    capabilities: ["testing"],
    execute: async (task) => ({
      agentId: "test_ag_01",
      agentName: "AgentePrueba",
      success: true,
      output: `Test OK: ${task}`,
      executionTimeMs: 10
    })
  };

  tvs.agentManager.register(testAgent);
  const fetchedAgent = tvs.agentManager.getAgent("test_ag_01");
  assert(fetchedAgent !== undefined && fetchedAgent.name === "AgentePrueba", "AgentManager: Registro y Búsqueda por ID");

  const stats = tvs.agentManager.getStats();
  assert(stats.total >= 1 && stats.active >= 1, "AgentManager: Conteo y Estadísticas para 200+ agentes");

  // Test 2: AgentManager - Cambio de estado
  tvs.agentManager.pause("test_ag_01");
  assert(tvs.agentManager.getAgent("test_ag_01")?.status === "PAUSED", "AgentManager: Cambio de Estado a PAUSED");
  tvs.agentManager.activate("test_ag_01");
  assert(tvs.agentManager.getAgent("test_ag_01")?.status === "ACTIVE", "AgentManager: Cambio de Estado a ACTIVE");

  // Test 3: ModelRouter - Selección según reglas de privacidad y tarea
  const routeLocal = tvs.modelRouter.route({ taskType: "code", privacyRequired: "HIGH" });
  assert(routeLocal.isLocal === true, "ModelRouter: Privacidad HIGH fuerza modelo Local (DeepSeek/Qwen/Ollama)");

  const routeCloud = tvs.modelRouter.route({ taskType: "reasoning", qualityRequired: "PREMIUM" });
  assert(routeCloud.provider === "claude" || routeCloud.provider === "openai", "ModelRouter: Calidad PREMIUM selecciona modelo Cloud top");

  // Test 4: MemoryEngine - Short Term & Long Term
  tvs.memoryEngine.addShortTerm("sess_101", "user", "Hola Viseron");
  const stmItems = tvs.memoryEngine.getShortTerm("sess_101");
  assert(stmItems.length === 1 && stmItems[0].content === "Hola Viseron", "MemoryEngine: Short Term Memory (STM)");

  tvs.memoryEngine.setLongTerm("config_system", { mode: "production" }, ["sys"]);
  const ltmVal = tvs.memoryEngine.getLongTerm("config_system");
  assert(ltmVal !== undefined && ltmVal.mode === "production", "MemoryEngine: Long Term Memory (LTM)");

  // Test 5: ToolManager - Registro y Ejecución
  tvs.toolManager.createQuickTool("tool_rest_test", "API Weather", "REST_API", "Prueba API", async (input) => {
    return { temp: 22, city: input.city };
  });

  const toolRes = await tvs.toolManager.executeTool("tool_rest_test", { city: "Madrid" });
  assert(toolRes.success === true && toolRes.result.temp === 22, "ToolManager: Registro y Ejecución de Herramientas");

  // Test 6: TVSOrchestrator - Orquestación Completa
  const report = await tvs.orchestrator.orchestrate("Prueba Orquestador", "Verificar flujo de subtareas");
  assert(report.status === "COMPLETED" && report.subtaskResults.length === 3, "TVSOrchestrator: Flujo Completo de Orquestación");

  console.log(`\n==========================================`);
  console.log(`RESUMEN DE PRUEBAS: ${passed}/${total} PRUEBAS PASADAS CON ÉXITO.`);
  console.log("==========================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runCoreTests().catch(err => {
  console.error("Error en las pruebas:", err);
  process.exit(1);
});
