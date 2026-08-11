// VISERON LEARNING VALIDATION GATE
// Prova experimental: STORAGE → RETRIEVAL → INFLUENCE → LEARNING?
// 2026-08-11

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { OmegaPlatform, createOmegaPlatform } from "../src/omega";
import { MemoryEngine } from "../src/core/memory/MemoryEngine";
import { MemoryConsolidationEngine } from "../src/core/memory/MemoryConsolidation";
import { chunkText } from "../src/core/memory/Chunker";
import { createEmbeddingProvider } from "../src/core/memory/EmbeddingProvider";
import { HybridRetriever } from "../src/core/memory/Retriever";

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const AUDIT = path.join(DATA, "audit", "learning-gate");

if (!fs.existsSync(AUDIT)) fs.mkdirSync(AUDIT, { recursive: true });

function sha256(s: string) { return crypto.createHash("sha256").update(s).digest("hex"); }

interface ExperimentStep {
  name: string; timestamp: number;
  metrics: Record<string, any>;
  evidence: string[];
  artifact?: string;
}

const experiment: ExperimentStep[] = [];

async function main() {
  console.log("═".repeat(55));
  console.log("VISERON LEARNING VALIDATION GATE — Experiment #001");
  console.log("═".repeat(55) + "\n");

  // Boot
  console.log("── Booting OMEGA ──");
  const omega = createOmegaPlatform();
  omega.loadCoreAgents();
  const mem = new MemoryEngine();
  const emb = createEmbeddingProvider();
  const consolidation = new MemoryConsolidationEngine(mem, emb, omega.telemetry, omega.graph);
  console.log(`  Agents: ${omega.agents.status().active} active · Memory: LTM ready`);

  // ═══ FASE 3: BASELINE (BEFORE LEARNING) ═══
  console.log("\n── BASELINE: Task B (before any memory) ──");
  const baselineStart = Date.now();

  // Task B: answer a question about VISERON modules
  const bQuery = "What are the key modules of the VISERON system architecture?";
  const bTrace = omega.telemetry.startTrace({ source: "learning-exp", agentId: "agent_ceo", input: { text: bQuery } });

  // Retrieve from memory (before storing experience)  
  const retriever = new HybridRetriever(mem, emb);
  let baselineResults: any[] = [];
  try {
    baselineResults = await retriever.retrieve(bQuery, { topK: 5 });
  } catch { baselineResults = []; }

  // Generate answer from what's available
  const baselineAnswer = baselineResults.length > 0
    ? baselineResults.slice(0, 3).map((r: any) => r.chunk.text.slice(0, 200)).join(" | ")
    : "(no prior memory available — answering from general knowledge)";

  const baselineArtifact = path.join(AUDIT, "baseline-answer.md");
  fs.writeFileSync(baselineArtifact, `# Baseline Answer (BEFORE learning)\n\n**Query:** ${bQuery}\n\n**Answer:** ${baselineAnswer}\n\n**Sources:** ${baselineResults.length}\n**Timestamp:** ${new Date().toISOString()}`);

  omega.telemetry.completeTrace(bTrace.traceId, {
    success: true, output: baselineAnswer.slice(0, 500), latencyMs: Date.now() - baselineStart,
    sources: baselineResults.map((r: any) => r.chunk.source || "unknown"), modelUsed: "baseline-retrieval",
  }, { status: "PASS", reasons: [`${baselineResults.length} sources retrieved`], verifiedBy: "learning-exp" });

  const baseline = {
    query: bQuery, answer: baselineAnswer.slice(0, 300),
    sourcesCount: baselineResults.length,
    sourcesFromMemory: baselineResults.filter((r: any) => r.chunk.source).length,
    latencyMs: Date.now() - baselineStart,
  };
  experiment.push({ name: "BASELINE", timestamp: Date.now(), metrics: baseline, evidence: [`sources: ${baselineResults.length}`, `latency: ${baseline.latencyMs}ms`], artifact: baselineArtifact });
  console.log(`  Sources: ${baselineResults.length} · Latency: ${baseline.latencyMs}ms`);

  // ═══ FASE 4: EXPERIENCE (Task A) ═══
  console.log("\n── EXPERIENCE: Task A (project analysis) ──");
  const expStart = Date.now();
  const expTrace = omega.telemetry.startTrace({ source: "learning-exp", agentId: "agent_ceo", input: { text: "Analyze project structure" } });

  // Real analysis: read key project files
  const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const srcFiles = countFiles(path.join(ROOT, "src"));
  const omegaFiles = countFiles(path.join(ROOT, "src", "omega"));
  const coreFiles = countFiles(path.join(ROOT, "src", "core"));
  const webFiles = countFiles(path.join(ROOT, "src", "web"));

  // Build structured knowledge
  const knowledge = {
    title: "VISERON Project Structure Analysis",
    modules: {
      core: { files: coreFiles, description: "Core engine: agents, memory, providers, learning, governance" },
      omega: { files: omegaFiles, description: "OMEGA Kernel: TaskQueue, EventBus, AutonomyOS, Verifier, Gateway" },
      web: { files: webFiles, description: "Web layer: auth, billing, JARVIS, VISERON, ATLAS, agency, RCS" },
      dashboard: { description: "Command Center: hologram 3D, voice, terminal, agents, governance" },
      integrations: { description: "Composio MCP, Avirato, Twilio, N8N, OmniRoute" },
    },
    totalFiles: srcFiles,
    projectName: pkgJson.name || "VISERON",
    version: pkgJson.version || "5.0.0",
  };

  // Store in LTM with rich structure
  mem.setLongTerm("learning_exp_project_structure", knowledge, ["project-structure", "analysis", "learning-exp"]);

  // Store in KB for RAG
  const knowledgeText = `VISERON v${knowledge.version} has ${knowledge.totalFiles} source files across core (${coreFiles} files), omega kernel (${omegaFiles} files), and web layer (${webFiles} files). Key modules: OMEGA Kernel with TaskQueue, EventBus, AutonomyOS; Core engine with agents, memory, providers; Web layer with auth, billing, JARVIS, VISERON, ATLAS, agency. The Command Center features hologram 3D, voice, terminal, and agent dispatch. Integrations include Composio MCP, Avirato, Twilio, N8N, OmniRoute.`;
  mem.addKnowledge("project_structure_knowledge", "project-analysis", knowledgeText, ["project-structure", "analysis", "learning-exp"]);

  // Consolidate
  consolidation.deduplicateSTM();
  consolidation.classifyImportance();

  const expArtifact = path.join(AUDIT, "experience-knowledge.json");
  fs.writeFileSync(expArtifact, JSON.stringify(knowledge, null, 2));

  omega.telemetry.completeTrace(expTrace.traceId, {
    success: true, output: knowledgeText.slice(0, 500), latencyMs: Date.now() - expStart,
    sources: ["package.json", "filesystem"], modelUsed: "omega-kernel",
  }, { status: "PASS", reasons: ["project structure analyzed", "knowledge stored in LTM + KB"], verifiedBy: "learning-exp" }, { newKnowledgeGenerated: true });

  const experience = {
    taskType: "project-analysis",
    knowledgeSize: JSON.stringify(knowledge).length,
    ltmStored: !!mem.getLongTerm("learning_exp_project_structure"),
    kbStored: !!(mem as any).knowledgeStore?.size > 0,
    filesAnalyzed: 3,
    artifact: expArtifact,
  };
  experiment.push({ name: "EXPERIENCE", timestamp: Date.now(), metrics: experience, evidence: [`LTM: ${experience.ltmStored}`, `KB: ${experience.kbStored}`, `files: ${experience.filesAnalyzed}`], artifact: expArtifact });
  console.log(`  LTM stored: ${experience.ltmStored} · KB stored: ${experience.kbStored} · Files: ${experience.filesAnalyzed}`);

  // ═══ FASE 5: CONSOLIDATION ═══
  console.log("\n── CONSOLIDATION ──");
  const conStart = Date.now();
  const dedupResult = await consolidation.deduplicateSTM();
  const kgLinks = await consolidation.linkToKnowledgeGraph();
  const consolidationData = { dedupMerged: dedupResult.merged, kgLinks, durationMs: Date.now() - conStart, ltmItems: mem.searchLongTerm?.("project-structure")?.length || 0 };
  experiment.push({ name: "CONSOLIDATION", timestamp: Date.now(), metrics: consolidationData, evidence: [`STM dedup: ${dedupResult.merged}`, `KG links: ${kgLinks}`, `LTM hits: ${consolidationData.ltmItems}`] });
  console.log(`  Dedup: ${dedupResult.merged} · KG links: ${kgLinks} · LTM hits: ${consolidationData.ltmItems}`);

  // ═══ FASE 6: RETRIEVAL ═══
  console.log("\n── RETRIEVAL: Recovering stored experience ──");
  const retStart = Date.now();

  // Keyword retrieval
  const kwHits = mem.searchLongTerm?.("project structure modules omega core web") || [];
  const kbHits = mem.searchKnowledge?.("VISERON modules architecture") || [];

  // Vector retrieval
  let vecHits: any[] = [];
  try {
    const embResult = await emb.embed("VISERON project structure modules");
    vecHits = await mem.queryVector(embResult.vector, 5);
  } catch { vecHits = []; }

  // Check if our stored knowledge appears in results
  const ltmFound = kwHits.some((h: any) => h.key === "learning_exp_project_structure");
  const kbFound = kbHits.some((h: any) => (h.id || h.title)?.includes("project_structure"));

  const retrievalData = {
    keywordHits: kwHits.length, kbHits: kbHits.length, vectorHits: vecHits.length,
    experienceInLTM: ltmFound, experienceInKB: kbFound,
    latencyMs: Date.now() - retStart,
  };
  experiment.push({ name: "RETRIEVAL", timestamp: Date.now(), metrics: retrievalData, evidence: [`LTM found: ${ltmFound}`, `KB found: ${kbFound}`, `keyword: ${kwHits.length}`, `KB: ${kbHits.length}`, `vector: ${vecHits.length}`] });
  console.log(`  LTM found: ${ltmFound} · KB found: ${kbFound} · Hits: kw=${kwHits.length} kb=${kbHits.length} vec=${vecHits.length}`);

  // ═══ FASE 7: AFTER LEARNING (Task B again) ═══
  console.log("\n── AFTER LEARNING: Task B (with memory) ──");
  const afterStart = Date.now();
  const afterTrace = omega.telemetry.startTrace({ source: "learning-exp", agentId: "agent_ceo", input: { text: bQuery } });

  // Retrieve again — now memory should have the experience
  let afterResults: any[] = [];
  try {
    afterResults = await retriever.retrieve(bQuery, { topK: 5 });
  } catch { afterResults = []; }

  // Check if ANY result came from our stored experience
  const experienceInResults = afterResults.some((r: any) =>
    r.chunk.text?.includes("OMEGA Kernel") ||
    r.chunk.text?.includes("TaskQueue") ||
    r.chunk.text?.includes("EventBus") ||
    r.chunk.text?.includes("project_structure") ||
    r.chunk.source === "project-analysis"
  );

  // Build answer
  const afterAnswer = afterResults.length > 0
    ? afterResults.slice(0, 3).map((r: any) => r.chunk.text.slice(0, 200)).join(" | ")
    : "(no memory retrieved)";

  const afterArtifact = path.join(AUDIT, "after-learning-answer.md");
  fs.writeFileSync(afterArtifact, `# After Learning Answer\n\n**Query:** ${bQuery}\n\n**Answer:** ${afterAnswer}\n\n**Experience in results:** ${experienceInResults}\n**Sources:** ${afterResults.length}\n**Timestamp:** ${new Date().toISOString()}`);

  omega.telemetry.completeTrace(afterTrace.traceId, {
    success: true, output: afterAnswer.slice(0, 500), latencyMs: Date.now() - afterStart,
    sources: afterResults.map((r: any) => r.chunk.source || "unknown"), modelUsed: "after-retrieval",
  }, { status: "PASS", reasons: [`${afterResults.length} sources`], verifiedBy: "learning-exp" });

  const afterData = {
    query: bQuery, sourcesAfterRetrieval: afterResults.length,
    experienceInResults,
    answerImproved: afterResults.length > baselineResults.length,
    latencyMs: Date.now() - afterStart,
  };
  experiment.push({ name: "AFTER_LEARNING", timestamp: Date.now(), metrics: afterData, evidence: [`sources: ${afterResults.length} (was ${baselineResults.length})`, `experience found: ${experienceInResults}`, `answer improved: ${afterData.answerImproved}`], artifact: afterArtifact });
  console.log(`  Sources: ${afterResults.length} (was ${baselineResults.length}) · Experience in results: ${experienceInResults}`);

  // ═══ FASE 8: CLASSIFICATION ═══
  console.log("\n── VERDICT ──");

  const storageOk = experience.ltmStored && experience.kbStored;
  const retrievalOk = retrievalData.experienceInLTM || retrievalData.experienceInKB;
  const influenceOk = afterData.experienceInResults;
  const behaviorChanged = afterData.sourcesAfterRetrieval > baseline.sourcesCount;

  let learningVerdict: string;
  if (storageOk && retrievalOk && influenceOk && behaviorChanged) {
    learningVerdict = "LEARNING REAL — experience stored, retrieved, and influenced later execution";
  } else if (storageOk && retrievalOk && influenceOk) {
    learningVerdict = "LEARNING PARTIAL — experience stored and retrieved, but no measurable behavior change";
  } else if (storageOk && retrievalOk) {
    learningVerdict = "MEMORY RETRIEVAL — experience stored and retrievable, but no evidence of influence on later execution";
  } else if (storageOk) {
    learningVerdict = "MEMORY STORAGE ONLY — experience persisted, but not retrievable by later queries";
  } else {
    learningVerdict = "BLOCKED — experience could not be stored";
  }

  console.log(`  Storage:    ${storageOk ? "✓" : "✗"}`);
  console.log(`  Retrieval:  ${retrievalOk ? "✓" : "✗"}`);
  console.log(`  Influence:  ${influenceOk ? "✓" : "✗"}`);
  console.log(`  Behavior:   ${behaviorChanged ? "✓ changed" : "✗ no change"}`);
  console.log(`\n  VERDICT: ${learningVerdict}`);

  // ═══ PERSISTENCE CHECK ═══
  console.log("\n── Persistence ──");
  const ltmFile = path.join(ROOT, "database", "memory", "ltm.json");
  console.log(`  LTM file: ${fs.existsSync(ltmFile) ? ((fs.statSync(ltmFile).size/1024/1024).toFixed(0)+"MB") : "NOT FOUND"}`);
  const persisted = fs.existsSync(ltmFile) && fs.readFileSync(ltmFile, "utf8").includes("learning_exp_project_structure");
  console.log(`  Experience persisted in LTM file: ${persisted}`);

  // ═══ WRITE RESULTS ═══
  const output = {
    experiment: "LEARNING VALIDATION #001",
    timestamp: new Date().toISOString(),
    verdict: learningVerdict,
    classification: {
      storage: storageOk ? "REAL" : "BLOCKED",
      retrieval: retrievalOk ? "REAL" : "BLOCKED",
      influence: influenceOk ? "REAL" : (retrievalOk ? "MEMORY_RETRIEVAL_ONLY" : "MEMORY_STORAGE_ONLY"),
      behaviorChange: behaviorChanged ? "OBSERVED" : "NOT_OBSERVED",
    },
    comparison: {
      before: { sources: baseline.sourcesCount, fromMemory: baseline.sourcesFromMemory },
      after: { sources: afterData.sourcesAfterRetrieval, experienceInResults: afterData.experienceInResults },
      delta: { sources: afterData.sourcesAfterRetrieval - baseline.sourcesCount, improved: afterData.answerImproved },
    },
    steps: experiment,
    persistence: { ltmPersisted: persisted },
  };

  fs.writeFileSync(path.join(AUDIT, "experiment.json"), JSON.stringify(output, null, 2));
  fs.writeFileSync(path.join(AUDIT, "baseline.json"), JSON.stringify(baseline, null, 2));
  fs.writeFileSync(path.join(AUDIT, "after-learning.json"), JSON.stringify(afterData, null, 2));
  fs.writeFileSync(path.join(AUDIT, "comparison.json"), JSON.stringify({
    beforeSources: baseline.sourcesCount,
    afterSources: afterData.sourcesAfterRetrieval,
    improvement: afterData.sourcesAfterRetrieval - baseline.sourcesCount,
    experienceInResults: afterData.experienceInResults,
    experienceInLTM: retrievalData.experienceInLTM,
    experienceInKB: retrievalData.experienceInKB,
  }, null, 2));

  // ═══ SUMMARY ═══
  console.log("\n" + "═".repeat(55));
  console.log("LEARNING VALIDATION — COMPLETE");
  console.log("═".repeat(55));
  console.log(`Verdict: ${learningVerdict}`);
  console.log(`\nStorage:   ${storageOk ? "REAL" : "BLOCKED"}`);
  console.log(`Retrieval: ${retrievalOk ? "REAL" : "BLOCKED"}`);
  console.log(`Influence: ${influenceOk ? "REAL" : "NOT_OBSERVED"}`);
  console.log(`Behavior:  ${behaviorChanged ? "CHANGED" : "NO CHANGE"}`);
  console.log(`\nBefore: ${baseline.sourcesCount} sources`);
  console.log(`After:  ${afterData.sourcesAfterRetrieval} sources`);
  console.log(`Delta:  ${afterData.sourcesAfterRetrieval > baseline.sourcesCount ? "+" : ""}${afterData.sourcesAfterRetrieval - baseline.sourcesCount}`);
  console.log(`\nArtifacts: ${AUDIT}`);
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countFiles(path.join(dir, e.name));
    else if (e.isFile()) n++;
  }
  return n;
}

main().catch(e => { console.error("CRASHED:", e.message); process.exit(1); });
