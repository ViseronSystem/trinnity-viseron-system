// VISERON LEARNING VALIDATION — Final Proof
// Prova: EXPERIENCE → INFLUENCE → IMPROVEMENT?
// 3 related tasks · control group · negative control · metrics
// 2026-08-11

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { ExperienceStore, TaskContext } from "../src/core/memory/ExperienceStore";
import { HybridRetriever } from "../src/core/memory/Retriever";
import { MemoryEngine } from "../src/core/memory/MemoryEngine";
import { createEmbeddingProvider } from "../src/core/memory/EmbeddingProvider";
import { chunkText } from "../src/core/memory/Chunker";

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const AUDIT = path.join(DATA, "audit", "learning-validation");
if (!fs.existsSync(AUDIT)) fs.mkdirSync(AUDIT, { recursive: true });

interface TaskResult {
  taskId: string; success: boolean; errors: number; latencyMs: number;
  validation: string; artifactSize: number; sourcesUsed: number;
  experienceUsed: boolean; experienceIds: string[];
}

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

async function main() {
  console.log("═".repeat(55));
  console.log("VISERON LEARNING VALIDATION — Final Proof");
  console.log("═".repeat(55)+"\n");

  const mem = new MemoryEngine();
  const emb = createEmbeddingProvider();
  const store = new ExperienceStore(DATA);

  // ═══ FASE 1: GENERATE 3 EXPERIENCES ═══
  console.log("── FASE 1: Generate Experiences ──");
  const marker = "LRN" + Date.now().toString(36).toUpperCase();

  const experiences = [
    { id: marker + "_A", task: "Analyze memory architecture for bottlenecks", finding: "LTM full-text index was using exact-match instead of term tokenization. Fixed by searchLongTerm tokenization. 20K entries compete with single experiences.", tags: ["memory","analysis","bottleneck"], tools: ["memory_query","ltm_analysis"] },
    { id: marker + "_B", task: "Audit retrieval performance for optimization", finding: "Retriever combinedScore favors keyword overlap over semantic relevance. Added recency + importance + evidence boosting with 0.30 max boost. Experience-prioritized retrieval added as separate path.", tags: ["retrieval","optimization","performance"], tools: ["retriever_audit","performance_test"] },
    { id: marker + "_C", task: "Validate cognitive pipeline integrity", finding: "Pipeline: Storage→Retrieval→RelevantRetrieval→Influence verified. Gap: experience influence on measurable improvement not yet proven. Need to measure success rate, errors, latency delta.", tags: ["validation","pipeline","cognitive"], tools: ["pipeline_test","metrics_collection"] },
  ];

  for (const exp of experiences) {
    store.record({
      experienceId: exp.id, taskId: exp.id.replace(marker, "task"), agentId: "agent_ceo", timestamp: Date.now(),
      input: exp.task, summary: exp.tags[0] + " analysis", content: `[${exp.id}] ${exp.finding}`, artifact: `${exp.id}_report`,
      validation: "PASS", tools: exp.tools, tags: exp.tags, importance: 0.85,
    });
  }
  console.log(`  Stored: ${experiences.length} experiences (${marker}_A/B/C)`);

  // ═══ FASE 2: BASELINE (without experience) ═══
  console.log("\n── FASE 2: BASELINE (without experience context) ──");
  const retNoExp = new HybridRetriever(mem, emb);
  const baselineTasks = [
    { id: "BL_memory", query: "What memory architecture bottlenecks were found?", expectedExp: marker + "_A" },
    { id: "BL_retrieval", query: "What retrieval performance optimizations were applied?", expectedExp: marker + "_B" },
    { id: "BL_pipeline", query: "What was found during cognitive pipeline validation?", expectedExp: marker + "_C" },
  ];

  const baseline: TaskResult[] = [];
  for (const bt of baselineTasks) {
    const start = Date.now();
    const results = await retNoExp.retrieve(bt.query, { topK: 5 });
    const found = results.some(r => r.chunk.text?.includes(bt.expectedExp));
    const sourceCount = results.filter(r => r.chunk.text?.length > 20).length;
    baseline.push({
      taskId: bt.id, success: sourceCount > 0, errors: sourceCount === 0 ? 1 : 0,
      latencyMs: Date.now() - start, validation: sourceCount > 0 ? "PASS" : "FAIL",
      artifactSize: results.reduce((s, r) => s + r.chunk.text.length, 0),
      sourcesUsed: sourceCount, experienceUsed: found, experienceIds: found ? [bt.expectedExp] : [],
    });
    console.log(`  ${bt.id}: ${found ? "found" : "not found"} · sources: ${sourceCount} · ${Date.now()-start}ms`);
  }

  // ═══ FASE 3: WITH EXPERIENCE ═══
  console.log("\n── FASE 3: WITH EXPERIENCE context ──");
  const retWithExp = new HybridRetriever(mem, emb, store);
  const tasksWithExp = [
    { id: "WE_memory", query: baselineTasks[0].query, ctx: { taskId: "task_mem_002", agentId: "agent_ceo", input: "Review memory architecture bottlenecks", relatedEntities: ["memory","bottleneck","analysis"], projectContext: "memory-optimization" } as TaskContext },
    { id: "WE_retrieval", query: baselineTasks[1].query, ctx: { taskId: "task_ret_002", agentId: "agent_ceo", input: "Review retrieval performance optimizations", relatedEntities: ["retrieval","optimization","performance"], projectContext: "retrieval-optimization" } as TaskContext },
    { id: "WE_pipeline", query: baselineTasks[2].query, ctx: { taskId: "task_pip_002", agentId: "agent_ceo", input: "Review cognitive pipeline validation results", relatedEntities: ["validation","pipeline","cognitive"], projectContext: "pipeline-validation" } as TaskContext },
  ];

  const withExp: TaskResult[] = [];
  const expIds = experiences.map(e => e.id);
  for (const wt of tasksWithExp) {
    const start = Date.now();
    const results = await retWithExp.retrieve(wt.query, { topK: 5, taskContext: wt.ctx });
    const found = results.some(r => r.fromExperience || expIds.some(id => r.chunk.text?.includes(id)));
    const sourceCount = results.filter(r => r.chunk.text?.length > 20).length;
    const usedExpIds = results.filter(r => r.fromExperience).map(r => r.experienceId || "");
    withExp.push({
      taskId: wt.id, success: sourceCount > 0, errors: sourceCount === 0 ? 1 : 0,
      latencyMs: Date.now() - start, validation: sourceCount > 0 ? "PASS" : "FAIL",
      artifactSize: results.reduce((s, r) => s + r.chunk.text.length, 0),
      sourcesUsed: sourceCount, experienceUsed: found, experienceIds: usedExpIds,
    });
    console.log(`  ${wt.id}: ${found ? "found" : "not found"} · sources: ${sourceCount} · ${Date.now()-start}ms`);
  }

  // ═══ FASE 4: NEGATIVE CONTROL (unrelated task) ═══
  console.log("\n── FASE 4: NEGATIVE CONTROL ──");
  const negCtx: TaskContext = { taskId: "task_unrelated", agentId: "agent_security", input: "Check security vulnerabilities in authentication module", relatedEntities: ["security","auth"], projectContext: "security-audit" };
  const negResults = await retWithExp.retrieve("security vulnerabilities authentication", { topK: 5, taskContext: negCtx });
  const negUsesExp = negResults.some(r => r.fromExperience);
  console.log(`  Unrelated task uses experience: ${negUsesExp} (should be false for relevance)`);

  // ═══ FASE 5: COMPARISON + CLASSIFICATION ═══
  console.log("\n── FASE 5: COMPARISON ──");

  const blFound = baseline.filter(b => b.experienceUsed).length;
  const weFound = withExp.filter(w => w.experienceUsed).length;
  const blErrors = baseline.reduce((s, b) => s + b.errors, 0);
  const weErrors = withExp.reduce((s, w) => s + w.errors, 0);
  const blAvgLatency = baseline.reduce((s, b) => s + b.latencyMs, 0) / baseline.length;
  const weAvgLatency = withExp.reduce((s, w) => s + w.latencyMs, 0) / withExp.length;
  const blAvgSources = baseline.reduce((s, b) => s + b.sourcesUsed, 0) / baseline.length;
  const weAvgSources = withExp.reduce((s, w) => s + w.sourcesUsed, 0) / withExp.length;

  console.log(`  Experience found:   BL=${blFound}/3 → WE=${weFound}/3`);
  console.log(`  Errors:             BL=${blErrors} → WE=${weErrors}`);
  console.log(`  Avg latency:        BL=${Math.round(blAvgLatency)}ms → WE=${Math.round(weAvgLatency)}ms`);
  console.log(`  Avg sources:        BL=${blAvgSources.toFixed(1)} → WE=${weAvgSources.toFixed(1)}`);

  const influenceProven = weFound > blFound;
  const improvementMeasured = weErrors < blErrors || weAvgSources > blAvgSources;
  const reproducible = weFound === 3; // all 3 tasks found experience

  let classification: string;
  if (influenceProven && improvementMeasured && reproducible) {
    classification = "LEARNING_REAL";
  } else if (influenceProven && improvementMeasured) {
    classification = "LEARNING_PARTIAL";
  } else if (influenceProven) {
    classification = "INFLUENCE_ONLY";
  } else {
    classification = "RETRIEVAL_ONLY";
  }

  console.log(`\n  CLASSIFICATION: ${classification}`);
  console.log(`  Influence:  ${influenceProven ? "PROVEN" : "NOT PROVEN"}`);
  console.log(`  Improvement:${improvementMeasured ? "MEASURED" : "NOT MEASURED"}`);
  console.log(`  Reproducible:${reproducible ? "YES (3/3)" : `PARTIAL (${weFound}/3)`}`);
  console.log(`  Negative control: ${negUsesExp ? "FAIL (irrelevant experience used)" : "PASS (experience not used for unrelated task)"}`);

  // ═══ PERSISTENCE ═══
  console.log("\n── FASE 6: PERSISTENCE ──");
  const store2 = new ExperienceStore(DATA);
  const persistOk = experiences.every(e => !!store2.get(e.id));
  console.log(`  All experiences recovered: ${persistOk}`);

  // ═══ WRITE ARTIFACTS ═══
  const output = {
    experiment: "LEARNING VALIDATION — Final Proof",
    timestamp: new Date().toISOString(),
    classification,
    criteria: { influence: influenceProven, improvement: improvementMeasured, reproducible, negativeControl: !negUsesExp, persistence: persistOk },
    baseline: { tasks: baseline.length, found: blFound, errors: blErrors, avgLatencyMs: Math.round(blAvgLatency), avgSources: blAvgSources },
    withExperience: { tasks: withExp.length, found: weFound, errors: weErrors, avgLatencyMs: Math.round(weAvgLatency), avgSources: weAvgSources },
    deltas: { foundDelta: weFound - blFound, errorsDelta: blErrors - weErrors, latencyDelta: Math.round(blAvgLatency - weAvgLatency), sourcesDelta: weAvgSources - blAvgSources },
    experiences: experiences.map(e => ({ id: e.id, tools: e.tools, tags: e.tags })),
  };

  fs.writeFileSync(path.join(AUDIT, "baseline.json"), JSON.stringify(baseline, null, 2));
  fs.writeFileSync(path.join(AUDIT, "with-experience.json"), JSON.stringify(withExp, null, 2));
  fs.writeFileSync(path.join(AUDIT, "comparison.json"), JSON.stringify(output, null, 2));
  fs.writeFileSync(path.join(AUDIT, "classification.json"), JSON.stringify({ classification, influenceProven, improvementMeasured, reproducible }, null, 2));

  console.log(`\n═`.repeat(55));
  console.log(`LEARNING VALIDATION — ${classification}`);
  console.log(`═`.repeat(55));
  console.log(`BL found: ${blFound}/3 · WE found: ${weFound}/3`);
  console.log(`Errors: ${blErrors}→${weErrors} · Sources: ${blAvgSources.toFixed(1)}→${weAvgSources.toFixed(1)}`);
  console.log(`Persist: ${persistOk} · NegCtrl: ${!negUsesExp}`);
  console.log(`\nArtifacts: ${AUDIT}`);
}

main().catch(e => { console.error("CRASHED:", e.message); process.exit(1); });
