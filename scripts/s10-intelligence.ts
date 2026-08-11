// VISERON S10 — Intelligence Expansion Audit + Activation
// Skill ranking, knowledge expansion, learning flywheel, intelligence scores
// 2026-08-11

import * as fs from "fs";
import * as path from "path";
import { createOmegaPlatform } from "../src/omega";
import { AgentManager } from "../src/core/AgentManager";
import { MemoryEngine } from "../src/core/memory/MemoryEngine";
import { ExperienceStore } from "../src/core/memory/ExperienceStore";
import { IntelligentRouter } from "../src/omega/parallel/ParallelIntelligence";
import { WebResearchEngine } from "../src/core/knowledge/WebResearchEngine";
import { createEmbeddingProvider } from "../src/core/memory/EmbeddingProvider";
import { SourceRegistry } from "../src/core/knowledge/KnowledgeIngestion";

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const AUDIT = path.join(DATA, "audit", "s10-intelligence");
for (const d of [AUDIT]) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

async function main() {
  console.log("═".repeat(60));
  console.log("VISERON S10 — Intelligence Expansion");
  console.log("═".repeat(60) + "\n");

  const omega = createOmegaPlatform({ agentManager: new AgentManager() } as any);
  omega.loadCoreAgents();
  const mem = new MemoryEngine();
  const emb = createEmbeddingProvider();
  const store = new ExperienceStore(DATA);
  const router = new IntelligentRouter(omega);
  const srcReg = new SourceRegistry(DATA);
  const research = new WebResearchEngine(DATA, mem, emb, omega.telemetry);

  const artifact: any = {};

  // ═══ 1. SKILL CAPABILITY RANKING ═══
  console.log("── Skill Capability Ranking ──");
  const skillsDir = path.join(ROOT, "skills", "vendor");
  const skillRanking: any[] = [];
  if (fs.existsSync(skillsDir)) {
    for (const c of fs.readdirSync(skillsDir).filter(d => fs.statSync(path.join(skillsDir, d)).isDirectory()).slice(0, 5)) {
      const collPath = path.join(skillsDir, c);
      const count = countFilesRecursive(collPath, ".md");
      skillRanking.push({
        collection: c, skillFiles: count,
        tier: count > 500 ? "A" : count > 100 ? "B" : "C",
        classification: "INDEXED",
        note: "indexed ≠ executable",
        potential: count > 500 ? "HIGH" : "MEDIUM",
      });
    }
  }
  const totalIndexed = skillRanking.reduce((s, r) => s + r.skillFiles, 0);
  console.log(`  Collections: ${skillRanking.length} · Files: ${totalIndexed}`);
  for (const s of skillRanking) console.log(`    Tier ${s.tier}: ${s.collection.padEnd(30)} ${s.skillFiles} skills`);
  artifact.skillRanking = { collections: skillRanking.length, totalFiles: totalIndexed, executable: 0, tiers: skillRanking.map(s => ({ name: s.collection, tier: s.tier, files: s.skillFiles })) };

  // ═══ 2. KNOWLEDGE EXPANSION ═══
  console.log("\n── Knowledge Expansion ──");
  const srcStatus = srcReg.status();
  const knowledgeSources = {
    web: srcStatus.byType.url || 0,
    files: srcStatus.byType.file || 0,
    repositories: srcStatus.byType.repository || 0,
    documents: srcStatus.byType.document || 0,
    total: srcStatus.total,
    ingested: srcStatus.ingested,
  };
  console.log(`  Sources: ${knowledgeSources.total} total, ${knowledgeSources.ingested} ingested`);
  console.log(`  Web: ${knowledgeSources.web} · Files: ${knowledgeSources.files} · Repos: ${knowledgeSources.repositories}`);

  // Research execution
  const researchResult = await research.research("VISERON intelligence expansion capabilities", ["https://example.com"]);
  console.log(`  Research: ${researchResult.acceptedSources} sources, ${researchResult.totalChunks} chunks, ${researchResult.latencyMs}ms`);
  artifact.knowledge = { sources: knowledgeSources, research: { accepted: researchResult.acceptedSources, chunks: researchResult.totalChunks } };

  // ═══ 3. LEARNING FLYWHEEL ═══
  console.log("\n── Learning Flywheel ──");
  const learningRecords = omega.learning?.list()?.length || 0;
  const consolidated = omega.learning?.list("CONSOLIDATED")?.length || 0;
  const experiences = store.retrieveRelevant({ taskId: "check", input: "VISERON" }, 3);

  console.log(`  Learning records: ${learningRecords} total, ${consolidated} consolidated`);
  console.log(`  Experience retrieval: ${experiences.length} relevant`);
  artifact.learning = { records: learningRecords, consolidated, experienceRetrieval: experiences.length };

  // ═══ 4. INTELLIGENCE SCORES ═══
  console.log("\n── Intelligence Scores ──");
  const agentStatus = omega.agents.status();
  const scores: any[] = [];
  for (const spec of agentStatus.specs) {
    const evCount = fs.existsSync(path.join(DATA, "knowledge", "agent-activity.jsonl"))
      ? fs.readFileSync(path.join(DATA, "knowledge", "agent-activity.jsonl"), "utf8").split("\n").filter(l => l.includes(spec.id)).length : 0;
    const ranked = router.route("general intelligence task", spec.role?.toLowerCase().includes("ceo") ? "management" : spec.role?.toLowerCase().includes("security") ? "security" : spec.role?.toLowerCase().includes("research") ? "research" : "general");
    const routeScore = ranked.find(r => r.agentId === spec.id)?.score || 0;
    scores.push({
      agentId: spec.id, evidence: evCount, routingScore: routeScore,
      intelligenceScore: Math.round(Math.min(100, evCount * 10 + routeScore * 20)),
      tier: evCount > 3 ? "PROVEN" : evCount > 0 ? "ACTIVE" : "REGISTERED",
    });
  }
  for (const s of scores.slice(0, 5)) console.log(`  ${s.agentId.padEnd(18)} score=${s.intelligenceScore} · tier=${s.tier.padEnd(10)} evidence=${s.evidence}`);
  artifact.scores = { agents: scores, top3: scores.sort((a, b) => b.intelligenceScore - a.intelligenceScore).slice(0, 3).map(s => s.agentId) };

  // ═══ 5. BOTTLENECKS + ROI ═══
  console.log("\n── Top Bottlenecks + ROI ──");
  const bottlenecks = [
    { rank: 1, name: "Skills indexed but not executable", domain: "SKILLS", gain: "HIGH", action: "Build SkillExecutor bridge for Tier A skills" },
    { rank: 2, name: "Cloud embeddings blocked", domain: "EMBEDDING", gain: "HIGH", action: "Configure OPENAI_API_KEY" },
    { rank: 3, name: "Voice STT/TTS blocked", domain: "VOICE", gain: "MEDIUM", action: "Configure ELEVENLABS_API_KEY" },
  ];
  for (const b of bottlenecks) console.log(`  #${b.rank} [${b.gain}] ${b.name}`);
  artifact.bottlenecks = bottlenecks;

  // ═══ SAVE ═══
  fs.writeFileSync(path.join(AUDIT, "skill-capability-map.json"), JSON.stringify(artifact.skillRanking, null, 2));
  fs.writeFileSync(path.join(AUDIT, "knowledge-sources.json"), JSON.stringify(artifact.knowledge, null, 2));
  fs.writeFileSync(path.join(AUDIT, "learning-results.json"), JSON.stringify(artifact.learning, null, 2));
  fs.writeFileSync(path.join(AUDIT, "agent-performance.json"), JSON.stringify(scores, null, 2));
  fs.writeFileSync(path.join(AUDIT, "optimization-results.json"), JSON.stringify(bottlenecks, null, 2));
  fs.writeFileSync(path.join(AUDIT, "summary.json"), JSON.stringify({ timestamp: new Date().toISOString(), ...artifact }, null, 2));

  console.log(`\n═`.repeat(60));
  console.log(`S10: Skills ${totalIndexed} · Sources ${knowledgeSources.total} · Learning ${learningRecords} · Bottlenecks ${bottlenecks.length}`);
  console.log(`Artifacts: ${AUDIT}`);
}

function countFilesRecursive(dir: string, ext: string): number {
  if (!fs.existsSync(dir)) return 0; let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && !e.name.startsWith(".")) n += countFilesRecursive(path.join(dir, e.name), ext);
    else if (e.isFile() && e.name.endsWith(ext)) n++;
  }
  return n;
}

main().catch(e => { console.error("CRASHED:", e.message); process.exit(1); });
