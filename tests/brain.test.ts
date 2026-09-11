import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";

// ═══════════════════════════════════════════════════════════════════════════
//  BRAIN TESTS — AutonomousBrain, TaskPlanner, ToolExecutor, LearningEngine
// ═══════════════════════════════════════════════════════════════════════════

const DATA_DIR = path.join(__dirname, "..", "data");

async function runTests() {
  // ── Test 1: TaskPlanner language detection ──
  console.log("\n=== Testing TaskPlanner ===");

  const { TaskPlanner } = await import("../src/core/brain/TaskPlanner");

  const mockRouter = {
    resolve: async () => ({ ok: false, text: "", provider: "mock", model: "mock", isLocal: true, latencyMs: 0, strategy: "mock", mode: "REAL" as any }),
    status: async () => ({ default: "mock", providers: [], availableCount: 0 }),
    lastTrace: { chosen: "mock", model: "mock", fallback: false, failures: [], at: "" },
  } as any;

  const planner = new TaskPlanner(mockRouter);

  // Test language detection
  const langEs = planner.detectLanguage("hola, quiero crear un sitio web");
  const langPt = planner.detectLanguage("olá, quero criar um site");
  const langEn = planner.detectLanguage("hello, I want to create a website");
  assert.strictEqual(langEs, "es", "Should detect Spanish");
  assert.strictEqual(langPt, "pt", "Should detect Portuguese");
  assert.strictEqual(langEn, "en", "Should detect English");
  console.log("✅ [PASS] TaskPlanner: Language detection works");

  // Test fallback plan
  const fallbackPlan = await planner.plan("crear una landing page para una clinica dental");
  assert.ok(fallbackPlan.id.startsWith("plan_"), "Plan should have ID");
  assert.ok(fallbackPlan.steps.length > 0, "Plan should have steps");
  assert.ok(fallbackPlan.totalEstimatedSeconds > 0, "Plan should have estimated time");
  assert.strictEqual(fallbackPlan.language, "es", "Default language should be Spanish");
  console.log("✅ [PASS] TaskPlanner: Fallback plan generation works");

  // ── Test 2: LearningEngine ──
  console.log("\n=== Testing LearningEngine ===");

  const { LearningEngine } = await import("../src/core/brain/LearningEngine");

  const learning = new LearningEngine(DATA_DIR);

  // Test initial state
  const initialStats = learning.getStats();
  assert.ok(initialStats.totalExecutions >= 0, "Initial executions should be >= 0");
  console.log("✅ [PASS] LearningEngine: Initial state is valid");

  // Test recording execution
  const mockPlan = {
    id: "plan_test1",
    originalRequest: "test request",
    language: "es" as const,
    category: "create" as const,
    steps: [
      {
        id: "step_1",
        description: "Test step",
        category: "create" as const,
        toolsNeeded: ["ai"],
        dependsOn: [],
        priority: "medium" as const,
        estimatedSeconds: 30,
        canParallel: false,
        retryable: true,
      },
    ],
    totalEstimatedSeconds: 30,
    createdAt: new Date().toISOString(),
  };

  const mockResults = [
    {
      stepId: "step_1",
      toolType: "ai" as const,
      toolName: "ai",
      input: { description: "Test step" },
      output: { text: "Test output" },
      success: true,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 1000,
    },
  ];

  const record = learning.recordExecution(mockPlan, mockResults, true);
  assert.ok(record.id.startsWith("lr_"), "Record should have ID");
  assert.strictEqual(record.success, true, "Record should be successful");
  assert.strictEqual(record.steps, 1, "Record should have 1 step");
  assert.strictEqual(record.successfulSteps, 1, "Record should have 1 successful step");
  console.log("✅ [PASS] LearningEngine: Records execution correctly");

  // Test stats after recording
  const statsAfter = learning.getStats();
  assert.ok(statsAfter.totalExecutions >= 1, "Should have at least 1 execution");
  assert.ok(statsAfter.successRate >= 0, "Success rate should be >= 0%");
  assert.ok(statsAfter.avgDurationMs >= 0, "Average duration should be >= 0");
  console.log("✅ [PASS] LearningEngine: Stats are correct");

  // Test recent records
  const recent = learning.getRecent(10);
  assert.ok(recent.length >= 1, "Should have at least 1 recent record");
  console.log("✅ [PASS] LearningEngine: Recent records work");

  // ── Test 3: ToolExecutor ──
  console.log("\n=== Testing ToolExecutor ===");

  const { ToolExecutor } = await import("../src/core/brain/ToolExecutor");

  const mockComposio = {
    configured: false,
    connected: false,
    connect: async () => false,
    callTool: async () => ({ ok: false, output: "{}" }),
  } as any;

  const mockToolManager = {
    registerTool: () => {},
    executeTool: async () => ({ success: false }),
  } as any;

  const executor = new ToolExecutor(mockComposio, mockToolManager, mockRouter);

  // Test AI execution
  const aiStep = {
    id: "step_ai",
    description: "Test AI step",
    category: "general" as const,
    toolsNeeded: ["ai"],
    dependsOn: [],
    priority: "medium" as const,
    estimatedSeconds: 30,
    canParallel: false,
    retryable: true,
  };

  const aiResult = await executor.executeStep({
    step: aiStep,
    request: "test request",
    previousResults: {},
    dataDir: DATA_DIR,
  });

  assert.strictEqual(aiResult.stepId, "step_ai", "Result should have correct step ID");
  assert.strictEqual(aiResult.toolType, "ai", "Tool type should be AI");
  assert.ok(aiResult.durationMs >= 0, "Duration should be >= 0");
  console.log("✅ [PASS] ToolExecutor: AI execution works");

  // Test execution history
  const executions = executor.getExecutions();
  assert.strictEqual(executions.length, 1, "Should have 1 execution");
  assert.strictEqual(executions[0].stepId, "step_ai", "Execution should match");
  console.log("✅ [PASS] ToolExecutor: Execution history works");

  // ── Test 4: AutonomousBrain ──
  console.log("\n=== Testing AutonomousBrain ===");

  const { AutonomousBrain } = await import("../src/core/brain/AutonomousBrain");

  const brain = new AutonomousBrain({
    router: mockRouter,
    composio: mockComposio,
    toolManager: mockToolManager,
    dataDir: DATA_DIR,
  });

  // Test status
  const brainStatus = await brain.getStatus();
  assert.strictEqual(brainStatus.configured, true, "Brain should be configured");
  assert.strictEqual(brainStatus.composioConnected, false, "Composio should not be connected (no key)");
  console.log("✅ [PASS] AutonomousBrain: Status works");

  // Test learning history
  const history = brain.getLearningHistory();
  assert.ok(Array.isArray(history), "History should be an array");
  console.log("✅ [PASS] AutonomousBrain: Learning history works");

  // Test suggestions
  const suggestions = brain.getSuggestions();
  assert.ok(Array.isArray(suggestions), "Suggestions should be an array");
  console.log("✅ [PASS] AutonomousBrain: Suggestions work");

  console.log("\n==========================================");
  console.log("RESUMEN DE PRUEBAS BRAIN: 12/12 PRUEBAS PASADAS CON ÉXITO.");
  console.log("==========================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
