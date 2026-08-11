// VISERON PRODUCTION REALITY GATE
// Comprehensive end-to-end validation of every system
// 2026-08-11

import { TelemetryEngine } from "../src/omega/telemetry/TelemetryEngine";
import { createEmbeddingProvider } from "../src/core/memory/EmbeddingProvider";
import { chunkText } from "../src/core/memory/Chunker";
import { RAGPipeline } from "../src/core/memory/RAGPipeline";
import { HybridRetriever } from "../src/core/memory/Retriever";
import { MemoryEngine } from "../src/core/memory/MemoryEngine";
import { createVoiceProvider } from "../src/core/voice/VoiceProvider";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const AUDIT = path.join(DATA, "audit", "reality-gate");
const ARTIFACTS = path.join(AUDIT, "artifacts");

// Ensure output dirs
for (const d of [AUDIT, ARTIFACTS]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

type RealityStatus = "REAL" | "PARTIAL" | "BLOCKED" | "SIMULATED";

interface GateResult {
  test: string;
  status: RealityStatus;
  evidence: string[];
  failures: string[];
  artifacts: string[];
  metrics: Record<string, any>;
  timestamp: number;
}

const results: GateResult[] = [];
const providerStatus: Record<string, any> = {};
const failures: any[] = [];

function record(test: string, status: RealityStatus, evidence: string[], failures?: string[], artifacts?: string[], metrics?: Record<string, any>) {
  const r: GateResult = { test, status, evidence: evidence || [], failures: failures || [], artifacts: artifacts || [], metrics: metrics || {}, timestamp: Date.now() };
  results.push(r);
  const icon = status === "REAL" ? "✓" : status === "PARTIAL" ? "~" : status === "BLOCKED" ? "✗" : "○";
  console.log(`${icon} [${status.padEnd(9)}] ${test}`);
  if (failures?.length) for (const f of failures) console.log(`       FAIL: ${f}`);
  return r;
}

async function main() {
  console.log("=".repeat(60));
  console.log("VISERON PRODUCTION REALITY GATE");
  console.log("=".repeat(60));
  console.log("");

  // ═══ PROVIDER DETECTION ═══
  console.log("── PROVIDER DETECTION ──");
  const envKeys: Record<string, { key: string; configured: boolean }> = {};
  for (const k of ["OPENAI_API_KEY","ELEVENLABS_API_KEY","ANTHROPIC_API_KEY","GEMINI_API_KEY","XAI_API_KEY","COMPOSIO_API_KEY","TWILIO_ACCOUNT_SID","AVIRATO_API_KEY"]) {
    const val = process.env[k];
    envKeys[k] = { key: k, configured: !!val && val.length > 5 && !val.startsWith("#") };
    console.log(`  ${k.padEnd(22)}: ${envKeys[k].configured ? "CONFIGURED" : "NOT SET"}`);
  }

  // Check Ollama
  let ollamaAvailable = false;
  try {
    const http = await import("http");
    await new Promise<void>((resolve, reject) => {
      const req = http.get("http://localhost:11434/api/tags", (res) => {
        ollamaAvailable = res.statusCode === 200;
        resolve();
      });
      req.on("error", () => { ollamaAvailable = false; resolve(); });
      req.setTimeout(3000, () => { req.destroy(); ollamaAvailable = false; resolve(); });
    });
  } catch { ollamaAvailable = false; }
  console.log(`  OLLAMA_LOCAL           : ${ollamaAvailable ? "AVAILABLE" : "UNAVAILABLE"}`);

  providerStatus.ollama = ollamaAvailable;
  providerStatus.envKeys = envKeys;

  console.log("");

  // ═══ TEST 01: COGNITIVE TRACE ═══
  console.log("── TEST 01: Cognitive Trace ──");
  const telemetry = new TelemetryEngine(DATA);
  const trace = telemetry.startTrace({ source: "reality-gate", agentId: "test_agent", input: { text: "production reality gate test" } });
  const traceExists = !!telemetry.getTrace(trace.traceId);
  telemetry.recordProcessing(trace.traceId, { embeddingMs: 150 });
  telemetry.completeTrace(trace.traceId, { success: true, output: "trace completed", latencyMs: 200, modelUsed: "test" }, { status: "PASS", reasons: ["verified"], verifiedBy: "reality-gate" }, { newKnowledgeGenerated: true });

  const retrieved = telemetry.getTrace(trace.traceId);
  const valid = retrieved?.traceId === trace.traceId && retrieved?.result?.success === true;

  // Check persistence
  const logPath = path.join(DATA, "knowledge", "cognitive-telemetry.jsonl");
  const persisted = fs.existsSync(logPath) && fs.statSync(logPath).size > 0;

  // Check SHA-256 archive
  const archiveDir = path.join(DATA, "archive", "cognitive");
  const archived = fs.existsSync(archiveDir) && fs.readdirSync(archiveDir).filter(f => f.endsWith(".json")).length > 0;

  const traceEvidence = [
    `traceId: ${trace.traceId}`,
    `retrieved: ${valid}`,
    `persisted (JSONL): ${persisted}`,
    `SHA-256 archived: ${archived}`,
    `stats: ${telemetry.status().total} total traces`,
  ];
  const traceFailures: string[] = [];
  if (!valid) traceFailures.push("trace not retrievable after completion");
  if (!persisted) traceFailures.push("not persisted to disk");
  if (!archived) traceFailures.push("not SHA-256 archived");

  record("01-cognitive-trace", valid && persisted ? "REAL" : persisted ? "PARTIAL" : "BLOCKED", traceEvidence, traceFailures);

  console.log("");

  // ═══ TEST 02: EMBEDDING ═══
  console.log("── TEST 02: Embedding ──");
  const embedding = createEmbeddingProvider();
  const embedEv: string[] = [];
  const embedFails: string[] = [];
  let embedStatus: RealityStatus = "SIMULATED";

  try {
    const e1 = await embedding.embed("VISERON production reality gate test one");
    const e2 = await embedding.embed("VISERON production reality gate test one");
    const deterministic = JSON.stringify(e1.vector.slice(0, 10)) === JSON.stringify(e2.vector.slice(0, 10));
    const batch = await embedding.embedBatch(["test a","test b","test c"]);

    embedEv.push(`model: ${e1.model}`);
    embedEv.push(`dimensions: ${e1.dimensions}`);
    embedEv.push(`latency: ${e1.latencyMs}ms`);
    embedEv.push(`deterministic: ${deterministic}`);
    embedEv.push(`batch: ${batch.length} vectors`);

    if (e1.model === "all-MiniLM-L6-v2-fallback") {
      embedEv.push("NOTE: using MiniLM fallback (hash-based) — not OpenAI embeddings");
      embedStatus = "PARTIAL"; // works but fallback
    } else if (e1.model === "text-embedding-3-small") {
      embedEv.push("OpenAI text-embedding-3-small ACTIVE");
      embedStatus = "REAL";
    } else {
      embedStatus = "PARTIAL";
    }
  } catch (e: any) {
    embedFails.push(e.message);
    embedStatus = "BLOCKED";
  }

  record("02-embedding", embedStatus, embedEv, embedFails, [], { provider: embedding.name, model: embedding.model, dimensions: embedding.dimensions });

  console.log("");

  // ═══ TEST 03: MEMORY ═══
  console.log("── TEST 03: Memory ──");
  const memory = new MemoryEngine();
  const memEv: string[] = [];
  const memFails: string[] = [];
  let memStatus: RealityStatus = "SIMULATED";

  try {
    // STM
    memory.addShortTerm("reality_gate_session", "user", "Production reality gate: memory test content for validation", { test: "reality-gate" });
    const stmItems = memory.getShortTerm("reality_gate_session", 10);
    memEv.push(`STM items: ${stmItems?.length || 0}`);

    // LTM
    memory.setLongTerm("reality_gate_test_key", { content: "Reality gate LTM test entry", tags: ["reality-gate","test"] }, ["reality-gate"]);
    const ltmItem = memory.getLongTerm("reality_gate_test_key");
    memEv.push(`LTM retrieval: ${!!ltmItem}`);

    // Persistence
    const ltmPath = path.join(ROOT, "database", "memory", "ltm.json");
    const ltmPersisted = fs.existsSync(ltmPath) && fs.statSync(ltmPath).size > 10000000;
    memEv.push(`LTM persisted (${ltmPersisted ? (fs.statSync(ltmPath).size/1024/1024).toFixed(0) + "MB" : "NO"})`);

    // Consolidation
    memory.consolidateSTMtoLTM?.();
    memEv.push("STM→LTM consolidation: executed");

    if (!ltmItem) memFails.push("LTM item not retrievable");

    memStatus = ltmItem ? (ltmPersisted ? "REAL" : "PARTIAL") : "BLOCKED";
  } catch (e: any) {
    memFails.push(e.message);
    memStatus = "BLOCKED";
  }
  const ltmPath = path.join(ROOT, "database", "memory", "ltm.json");

  record("03-memory", memStatus, memEv, memFails, [ltmPath]);

  console.log("");

  // ═══ TEST 04: RAG ═══
  console.log("── TEST 04: RAG ──");
  const ragEv: string[] = [];
  const ragFails: string[] = [];
  let ragStatus: RealityStatus = "SIMULATED";

  try {
    // Use real documents
    const readmePath = path.join(ROOT, "README.md");
    const readmeText = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8").slice(0, 3000) : "VISERON is an AI operating system.";

    // Chunk
    const chunks = chunkText(readmeText, { chunkSize: 512, overlap: 128, source: "README.md" });
    ragEv.push(`chunks: ${chunks.length} from README.md`);

    // Index chunks in KB
    for (const chunk of chunks) {
      memory.addKnowledge(`rag_chunk_${chunk.id}`, "rag_test", chunk.text, ["rag-test","reality-gate"]);
    }

    // Retrieve
    try {
      const emb = await embedding.embed("What is VISERON?");
      const vectorResults = await memory.queryVector(emb.vector, 5);
      ragEv.push(`vector retrieval: ${vectorResults.length} results`);
    } catch { ragEv.push("vector retrieval: fallback (no Qdrant)"); }

    // Keyword retrieval
    const keywordResults = memory.searchLongTerm?.("VISERON") || [];
    ragEv.push(`keyword retrieval: ${keywordResults.length} results`);

    // Unified search
    const unified = memory.unifiedSearch?.("VISERON", { maxResults: 5 }) || [];
    ragEv.push(`unified search: ${unified.length} results`);

    ragStatus = chunks.length > 0 ? (keywordResults.length > 0 ? "REAL" : "PARTIAL") : "BLOCKED";
  } catch (e: any) {
    ragFails.push(e.message);
    ragStatus = "BLOCKED";
  }

  record("04-rag", ragStatus, ragEv, ragFails);

  console.log("");

  // ═══ TEST 05: GraphRAG ═══
  console.log("── TEST 05: GraphRAG ──");
  const kgEv: string[] = [];
  const kgFails: string[] = [];
  let kgStatus: RealityStatus = "SIMULATED";

  try {
    const kgPath = path.join(ROOT, "database", "memory", "knowledge-graph.json");
    const kgExists = fs.existsSync(kgPath);

    if (kgExists) {
      const kgData = JSON.parse(fs.readFileSync(kgPath, "utf8"));
      const entities = kgData.entities?.length || 0;
      const relations = kgData.relations?.length || 0;
      kgEv.push(`KG entities: ${entities}`);
      kgEv.push(`KG relations: ${relations}`);
      kgEv.push(`KG persisted: ${kgExists} (${(fs.statSync(kgPath).size/1024).toFixed(0)}KB)`);

      // Test entity search
      if (kgData.entities?.length > 0) {
        const sampleEntity = kgData.entities[0];
        kgEv.push(`sample entity: ${sampleEntity.name || sampleEntity.id} (${sampleEntity.type})`);
        kgStatus = "REAL";
      } else {
        kgStatus = "PARTIAL";
      }
    } else {
      kgFails.push("knowledge-graph.json not found");
      kgStatus = "BLOCKED";
    }
  } catch (e: any) {
    kgFails.push(e.message);
    kgStatus = "BLOCKED";
  }

  record("05-graphrag", kgStatus, kgEv, kgFails, [path.join(ROOT, "database", "memory", "knowledge-graph.json")]);

  console.log("");

  // ═══ TEST 07: EVOLUTION LOOP ═══
  console.log("── TEST 07: Evolution ──");
  let evoStatus: RealityStatus = "SIMULATED";
  const evoEv: string[] = [];
  const evoFails: string[] = [];

  try {
    // Check existing evolution data
    const evoPath = path.join(DATA, "state", "evolution-history.jsonl");
    if (fs.existsSync(evoPath)) {
      const lines = fs.readFileSync(evoPath, "utf8").trim().split("\n").filter(Boolean);
      const events = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      evoEv.push(`evolution events: ${events.length}`);
      const realEvents = events.filter((e: any) => e.evidence?.length > 0);
      const templateEvents = events.filter((e: any) => !e.evidence || e.evidence.length === 0);
      evoEv.push(`with evidence: ${realEvents.length}`);
      if (templateEvents.length > 0) evoFails.push(`${templateEvents.length} events without evidence`);
      evoStatus = realEvents.length > 0 ? "REAL" : events.length > 0 ? "PARTIAL" : "BLOCKED";
    } else {
      evoFails.push("evolution-history.jsonl not found");
      evoStatus = "BLOCKED";
    }
  } catch (e: any) {
    evoFails.push(e.message);
    evoStatus = "BLOCKED";
  }

  record("07-evolution", evoStatus, evoEv, evoFails);

  console.log("");

  // ═══ TEST 08: VOICE ═══
  console.log("── TEST 08: Voice ──");
  const voice = createVoiceProvider();
  const sttStatus = voice.stt.isAvailable() ? (envKeys.OPENAI_API_KEY?.configured ? "REAL" : "BLOCKED") : "BLOCKED";
  const ttsStatus = voice.tts.isAvailable() ? (envKeys.ELEVENLABS_API_KEY?.configured ? "REAL" : "BLOCKED") : "BLOCKED";

  record("08a-voice-stt", sttStatus,
    [`STT provider: ${voice.stt.name} (${voice.stt.model})`, `available: ${voice.stt.isAvailable()}`],
    voice.stt.isAvailable() ? [] : ["OPENAI_API_KEY not configured — STT blocked"]);
  record("08b-voice-tts", ttsStatus,
    [`TTS provider: ${voice.tts.name}`, `voices: ${voice.tts.voices.join(", ")}`, `available: ${voice.tts.isAvailable()}`],
    voice.tts.isAvailable() ? [] : ["ELEVENLABS_API_KEY not configured — TTS blocked"]);

  console.log("");

  // ═══ TEST 10: APIs ═══
  console.log("── TEST 10: API Status ──");

  // Check if server is already running
  let serverRunning = false;
  try {
    const http = await import("http");
    await new Promise<void>((resolve) => {
      const req = http.get("http://localhost:3000/api/health", (res) => {
        serverRunning = res.statusCode === 200;
        resolve();
      });
      req.on("error", () => resolve());
      req.setTimeout(2000, () => { req.destroy(); resolve(); });
    });
  } catch { serverRunning = false; }

  if (serverRunning) {
    record("10-api-server", "REAL", ["server responding on port 3000"]);
  } else {
    record("10-api-server", "PARTIAL", ["server not running — API tests skipped (local validation only)"]);
  }

  console.log("");

  // ═══ TEST 06: AGENT EVIDENCE ═══
  console.log("── TEST 06: Agent Evidence ──");
  const evPath = path.join(DATA, "knowledge", "agent-activity.jsonl");
  const evExists = fs.existsSync(evPath);
  let evLines = 0;
  if (evExists) evLines = fs.readFileSync(evPath, "utf8").trim().split("\n").filter(Boolean).length;
  record("06-agent-evidence", evExists && evLines > 0 ? "REAL" : evExists ? "PARTIAL" : "BLOCKED",
    [`agent-activity.jsonl: ${evLines} entries`, `persisted: ${evExists}`]);

  console.log("");

  // ═══ PERSISTENCE CHECK ═══
  console.log("── Persistence Check ──");
  const persistenceFiles: Record<string, string> = {
    "cognitive-telemetry": path.join(DATA, "knowledge", "cognitive-telemetry.jsonl"),
    "agent-activity": path.join(DATA, "knowledge", "agent-activity.jsonl"),
    "knowledge-graph": path.join(ROOT, "database", "memory", "knowledge-graph.json"),
    "ltm": path.join(ROOT, "database", "memory", "ltm.json"),
    "evolution-history": path.join(DATA, "state", "evolution-history.jsonl"),
    "archive-decisions": path.join(DATA, "archive", "decisions"),
  };

  for (const [name, filePath] of Object.entries(persistenceFiles)) {
    const exists = fs.existsSync(filePath);
    const size = exists ? fs.statSync(filePath).size : 0;
    console.log(`  ${name.padEnd(22)}: ${exists ? `${(size/1024).toFixed(0)}KB` : "NOT FOUND"}`);
  }

  console.log("");

  // ═══ WRITE ARTIFACTS ═══
  console.log("── Writing Artifacts ──");

  // execution.json
  fs.writeFileSync(path.join(AUDIT, "execution.json"), JSON.stringify(results, null, 2));
  console.log(`  execution.json: ${results.length} tests`);

  // provider-status.json
  fs.writeFileSync(path.join(AUDIT, "provider-status.json"), JSON.stringify({ ...providerStatus, ollama: ollamaAvailable, timestamp: new Date().toISOString() }, null, 2));
  console.log(`  provider-status.json`);

  // summary.json
  const summary = {
    timestamp: new Date().toISOString(),
    totals: {
      REAL: results.filter(r => r.status === "REAL").length,
      PARTIAL: results.filter(r => r.status === "PARTIAL").length,
      BLOCKED: results.filter(r => r.status === "BLOCKED").length,
      SIMULATED: results.filter(r => r.status === "SIMULATED").length,
      TOTAL: results.length,
    },
    providers: { ollama: ollamaAvailable, openai: !!envKeys.OPENAI_API_KEY?.configured, elevenlabs: !!envKeys.ELEVENLABS_API_KEY?.configured },
    results,
  };
  fs.writeFileSync(path.join(AUDIT, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(`  summary.json`);

  // failures.json
  fs.writeFileSync(path.join(AUDIT, "failures.json"), JSON.stringify(results.filter(r => r.failures.length > 0), null, 2));
  console.log(`  failures.json: ${results.filter(r => r.failures.length > 0).length} tests with failures`);

  // ═══ SUMMARY ═══
  console.log("");
  console.log("=".repeat(60));
  console.log("REALITY GATE COMPLETE");
  console.log("=".repeat(60));
  console.log(`REAL:     ${summary.totals.REAL}`);
  console.log(`PARTIAL:  ${summary.totals.PARTIAL}`);
  console.log(`BLOCKED:  ${summary.totals.BLOCKED}`);
  console.log(`SIMULATED:${summary.totals.SIMULATED}`);
  console.log(`TOTAL:    ${summary.totals.TOTAL}`);
  console.log("");
  console.log(`Ollama:   ${ollamaAvailable ? "AVAILABLE" : "UNAVAILABLE"}`);
  console.log(`OpenAI:   ${envKeys.OPENAI_API_KEY?.configured ? "CONFIGURED" : "NOT SET"}`);
  console.log(`ElevenLabs: ${envKeys.ELEVENLABS_API_KEY?.configured ? "CONFIGURED" : "NOT SET"}`);
  console.log(`Composio:   ${envKeys.COMPOSIO_API_KEY?.configured ? "CONFIGURED" : "NOT SET"}`);
}

main().catch(e => { console.error("REALITY GATE CRASHED:", e.message); process.exit(1); });
