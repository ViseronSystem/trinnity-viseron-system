import { ViseronCore } from "../src/core/ViseronCore";

async function runHyperBrainTests() {
  console.log("==========================================");
  console.log("PRUEBAS DE INTEGRACIÓN TVS FASE 2: HYPER-BRAIN");
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

  // Test 1: Agentes Líderes Pedro y Trinnity
  const pedro = tvs.agentManager.getAgent("agent_pedro_leader");
  const trinnity = tvs.agentManager.getAgent("agent_trinnity_leader");
  assert(pedro !== undefined && pedro.name === "Pedro", "SquadManager: Agente Líder Estratégico Pedro inicializado");
  assert(trinnity !== undefined && trinnity.name === "Trinnity", "SquadManager: Agente Líder Técnico Trinnity inicializado");

  // Test 2: Permisos de Squad
  const pedroHasAdmin = tvs.squadManager.hasPermission(pedro!.id, "SYSTEM_ADMIN");
  assert(pedroHasAdmin === true, "SquadManager: Pedro posee permisos de SYSTEM_ADMIN");

  // Test 3: ProviderFactory (Ollama, OpenAI, Claude, Gemini, Grok)
  const ollamaRes = await tvs.providerFactory.generate("ollama", { prompt: "Hola" });
  assert(ollamaRes.provider === "ollama", "ProviderFactory: Driver Ollama respondió correctamente");

  const geminiRes = await tvs.providerFactory.generate("gemini", { prompt: "Test Gemini" });
  assert(geminiRes.provider === "gemini", "ProviderFactory: Driver Gemini respondió correctamente");

  // Test 4: MemoryEngine & Qdrant Integration
  const vecId = await tvs.memoryEngine.storeVector([0.1, 0.2, 0.3], { test: "qdrant" });
  assert(vecId.startsWith("vec_"), "MemoryEngine: Vector almacenado exitosamente en Qdrant/Memory");

  const similar = await tvs.memoryEngine.queryVector([0.1, 0.2, 0.3], 1);
  assert(similar.length > 0, "MemoryEngine: Búsqueda vectorial semántica con éxito");

  // Test 5: ToolManager verification
  const mcpToolList = tvs.toolManager.listTools();
  assert(Array.isArray(mcpToolList), "MCPServer: ToolManager lista herramientas correctamente");

  // Test 6: AutoLearningEngine
  await tvs.autoLearningEngine.executeLearningCycle();
  const pedroState = tvs.memoryEngine.getLongTerm("pedro_brain_state");
  assert(pedroState !== undefined && pedroState.status === "OPTIMIZED", "AutoLearningEngine: Aprendizaje de 15 min de Pedro registrado");

  tvs.autoLearningEngine.stopLearningCycle();

  console.log(`\n==========================================`);
  console.log(`RESUMEN DE PRUEBAS HYPER-BRAIN: ${passed}/${total} PRUEBAS PASADAS CON ÉXITO.`);
  console.log("==========================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runHyperBrainTests().catch(err => {
  console.error("Error en las pruebas Hyper-Brain:", err);
  process.exit(1);
});
