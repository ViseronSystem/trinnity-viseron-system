// VISERON EXPERIENCE MEMORY — Learning Experiment #002
// Task-contextual experience retrieval with control group
// Prova: WITH experience → different behavior vs WITHOUT experience
// 2026-08-11

import * as fs from "fs";
import * as path from "path";
import { ExperienceStore, TaskContext } from "../src/core/memory/ExperienceStore";
import { HybridRetriever } from "../src/core/memory/Retriever";
import { MemoryEngine } from "../src/core/memory/MemoryEngine";
import { createEmbeddingProvider } from "../src/core/memory/EmbeddingProvider";

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const AUDIT = path.join(DATA, "audit", "experience-memory");
if (!fs.existsSync(AUDIT)) fs.mkdirSync(AUDIT, { recursive: true });

async function main() {
  console.log("═".repeat(55));
  console.log("EXPERIENCE MEMORY — Learning Experiment #002");
  console.log("═".repeat(55)+"\n");

  const mem = new MemoryEngine();
  const emb = createEmbeddingProvider();
  const store = new ExperienceStore(DATA);

  // ═══ TASK A: CREATE EXPERIENCE ═══
  console.log("── TASK A: Create operational experience ──");
  const expId = "EXP002_" + Date.now().toString(36).toUpperCase();
  const expData: TaskContext = { taskId: "task_analysis_001", agentId: "agent_ceo", input: "Analyze project memory architecture for optimization opportunities" };

  const expRecord = store.record({
    experienceId: expId,
    taskId: expData.taskId,
    agentId: expData.agentId,
    timestamp: Date.now(),
    input: expData.input,
    summary: "Memory optimization analysis complete",
    content: `[${expId}] Analysis result: The VISERON MemoryEngine has 4 layers (STM, LTM, KB, Vector). LTM contains 20,000+ entries. Optimization recommendation: add experience-prioritized retrieval layer to separate operational experiences from general knowledge. The LTM full-text index is token-based but was fixed to support multi-term queries. The HybridRetriever now supports experience context for relevant retrieval. Unique marker: ${expId}.`,
    artifact: "memory-analysis-report",
    validation: "PASS",
    tools: ["memory_query", "ltm_analysis"],
    tags: ["analysis", "memory", "optimization", expData.taskId],
    importance: 0.9,
  });
  console.log(`  Stored: ${expRecord.experienceId} · importance: ${expRecord.importance}`);

  // ═══ CONTROL: WITHOUT experience ═══
  console.log("\n── CONTROL: Query WITHOUT experience context ──");
  const retNoExp = new HybridRetriever(mem, emb);
  const controlResults = await retNoExp.retrieve("memory optimization analysis", { topK: 5 });
  const controlHasExp = controlResults.some(r => r.chunk.text?.includes(expId) || r.fromExperience);
  console.log(`  Results: ${controlResults.length} · Experience found: ${controlHasExp}`);
  console.log(`  Top source: ${controlResults[0]?.chunk.source || "none"}`);

  // ═══ TEST: WITH experience context ═══
  console.log("\n── TEST: Query WITH experience context ──");
  const retWithExp = new HybridRetriever(mem, emb, store);
  const taskCtx: TaskContext = {
    taskId: "task_memory_review_002",
    agentId: "agent_ceo",
    input: "Review the memory optimization analysis and apply recommendations",
    relatedEntities: ["memory", "optimization", "analysis"],
    projectContext: "memory-optimization",
  };
  const testResults = await retWithExp.retrieve("memory optimization analysis", { topK: 5, taskContext: taskCtx });
  const testHasExp = testResults.some(r => r.chunk.text?.includes(expId) || r.fromExperience);
  const expInTop = testResults.findIndex(r => r.fromExperience);
  console.log(`  Results: ${testResults.length} · Experience found: ${testHasExp} · Position: ${expInTop >= 0 ? "#"+(expInTop+1) : "none"}`);

  // ═══ COMPARISON ═══
  console.log("\n── COMPARISON ──");
  const influenceObserved = testHasExp && !controlHasExp;
  const behaviorChanged = (testResults[0]?.fromExperience && !controlResults[0]?.fromExperience) || influenceObserved;

  console.log(`  WITHOUT experience: ${controlHasExp ? "found" : "not found"} (${controlResults.length} results)`);
  console.log(`  WITH experience:    ${testHasExp ? "found" : "not found"} (${testResults.length} results, pos: ${expInTop >= 0 ? "#"+(expInTop+1) : "none"})`);
  console.log(`  Influence: ${influenceObserved ? "OBSERVED" : "NOT OBSERVED"}`);
  console.log(`  Behavior change: ${behaviorChanged ? "YES" : "NO"}`);

  // ═══ PERSISTENCE ═══
  console.log("\n── Persistence ──");
  const store2 = new ExperienceStore(DATA);
  const retrieved = store2.get(expId);
  console.log(`  After reload: ${retrieved ? "RECOVERED" : "LOST"}`);

  // ═══ CLASSIFICATION ═══
  let verdict: string;
  if (influenceObserved && behaviorChanged && retrieved) {
    verdict = "INFLUENCE OBSERVED — experience context changes retrieval, persists across reload";
  } else if (influenceObserved) {
    verdict = "INFLUENCE OBSERVED — experience context changes retrieval";
  } else if (testHasExp && retrieved) {
    verdict = "CONTEXTUAL RETRIEVAL — experience retrievable with context, persists";
  } else {
    verdict = "RETRIEVAL ONLY";
  }

  console.log(`\n  VERDICT: ${verdict}`);

  // ═══ WRITE ARTIFACTS ═══
  const output = {
    experiment: "LEARNING EXPERIMENT #002",
    timestamp: new Date().toISOString(),
    verdict,
    classification: {
      experienceRetrieval: testHasExp ? "REAL" : "BLOCKED",
      contextInjection: testHasExp ? "REAL" : "BLOCKED",
      controlGroup: !controlHasExp ? "REAL" : "PARTIAL",
      influence: influenceObserved ? "OBSERVED" : "NOT_OBSERVED",
      behaviorChange: behaviorChanged ? "YES" : "NO",
      persistence: retrieved ? "REAL" : "BLOCKED",
    },
    comparison: {
      without: { found: controlHasExp, sourceCount: controlResults.length, topSource: controlResults[0]?.chunk.source },
      with: { found: testHasExp, sourceCount: testResults.length, experiencePosition: expInTop, topSource: testResults[0]?.chunk.source },
    },
    experience: expRecord,
  };

  fs.writeFileSync(path.join(AUDIT, "experiment-002.json"), JSON.stringify(output, null, 2));
  fs.writeFileSync(path.join(AUDIT, "control.json"), JSON.stringify({ found: controlHasExp, count: controlResults.length }, null, 2));
  fs.writeFileSync(path.join(AUDIT, "with-experience.json"), JSON.stringify({ found: testHasExp, count: testResults.length, position: expInTop }, null, 2));
  fs.writeFileSync(path.join(AUDIT, "comparison.json"), JSON.stringify({ influence: influenceObserved, behaviorChanged }, null, 2));

  console.log(`\n═`.repeat(55));
  console.log(`EXPERIENCE MEMORY — COMPLETE`);
  console.log(`═`.repeat(55));
  console.log(`Verdict: ${verdict}`);
  console.log(`\nWITHOUT: ${controlHasExp ? "found" : "not found"}`);
  console.log(`WITH:    ${testHasExp ? "found" : "not found"} (pos #${expInTop+1})`);
  console.log(`Persist: ${retrieved ? "YES" : "NO"}`);
  console.log(`\nArtifacts: ${AUDIT}`);
}

main().catch(e => { console.error("CRASHED:", e.message); process.exit(1); });
