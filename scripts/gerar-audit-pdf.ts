import * as fs from "fs";
import path from "path";
import { createTheme } from "./pdf-theme";

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const OUT_PDF = path.join(DATA, "audit", "VISERON_TOTAL_AUDIT_REPORT.pdf");

async function main() {
  const version = (() => {
    try { return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version as string; } catch { return "7.0.0"; }
  })();

  const pdf = createTheme({
    accent: "#00f0ff", accent2: "#bf5af2",
    ink: "#e5e7eb", muted: "#94a3b8",
    soft: "#1e293b", background: "#050510",
    title: "VISERON TOTAL AUDIT", subject: "Estado da Nação v" + version
  });

  pdf.doc.rect(0, 0, pdf.doc.page.width, pdf.doc.page.height).fill("#050510");
  pdf.page();

  pdf.cover({
    title: "VISERON",
    subtitle: "Auditoria Total do Ecossistema\nEstado da Nação · " + version,
    badges: ["CONFIDENCIAL", "16 FASES", "2026-08-11"],
    date: "2026-08-11",
    version: "v" + version,
    brand: "© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)",
  });

  pdf.page();

  pdf.section("1", "RESUMO EXECUTIVO");
  pdf.para("O VISERON v7.0 é um sistema operacional de orquestração de IA funcional, não uma superinteligência autónoma. Executa comandos com memória, mas não transforma experiências em inteligência acumulada.", 11);
  pdf.spacer();

  pdf.section("2", "CAPACIDADES (47 auditadas)");
  pdf.bullet("✅", "39 capacidades REAIS — comprovadas com código + testes + APIs");
  pdf.bullet("⚠️", "5 capacidades PARCIAIS — memória semântica, voz, embeddings, aprendizagem, evolução");
  pdf.bullet("❌", "3 capacidades PLACEHOLDER — embeddings (sin/cos), RAG, GraphRAG");
  pdf.spacer();

  pdf.section("3", "AGENTES");
  pdf.kv("Reais (código executável + testes)", "14");
  pdf.kv("Documentados-apenas (não existem)", "11");
  pdf.kv("Stubs (código morto)", "3");
  pdf.kv("Boot agents (ativos no arranque)", "10 SmartAgents OMEGA");
  pdf.spacer();

  pdf.section("4", "OMEGA KERNEL");
  pdf.bullet("✅", "TaskQueue — 9 estados, persistência, retry, cancel, recovery");
  pdf.bullet("✅", "EventBus — 43 tópicos, wildcards, retry, ring buffer, replay");
  pdf.bullet("✅", "AutonomyOS — L0-L5, 7 políticas de domínio");
  pdf.bullet("✅", "TaskVerifier — PASS/FAIL/RETRY/HUMAN");
  pdf.bullet("✅", "Permissions — 8 roles RBAC");
  pdf.bullet("✅", "Gateway — 50 endpoints REST");
  pdf.bullet("✅", "EventBridge — 3 bridges (MemoryEngine, Socket.IO, SSE)");
  pdf.bullet("⚠️", "AgentRuntime — funcional mas sem lifecycle (só load)");
  pdf.bullet("⚠️", "AutonomyLayer — cria tasks sem executor (falham)");
  pdf.bullet("❌", "assignedAgentId nunca definido pelo TaskQueue");
  pdf.spacer();

  pdf.section("5", "MEMÓRIA");
  pdf.kv("STM", "RAM, 200/sessão, TTL 30min");
  pdf.kv("LTM", "20,000 registos (12.8 MB), JSON persistente");
  pdf.kv("KB", "2,000 docs, TF-IDF, não persiste");
  pdf.kv("Vector", "SIN/COS PLACEHOLDER — sem embeddings reais");
  pdf.kv("KnowledgeGraph", "963 entidades / 960 relações");
  pdf.kv("KnowledgeArchive", "SHA-256, 5 milestones, 1 execução");
  pdf.spacer();

  pdf.section("6", "FRONTEND");
  pdf.kv("Command Center", "1,089 linhas — holograma 3D + voz + terminal");
  pdf.kv("Páginas HTML", "13");
  pdf.kv("SSE tópicos", "43 em tempo real");
  pdf.kv("APIs REST", "~188 endpoints");
  pdf.spacer();

  pdf.section("7", "EVOLUTION LOOP");
  pdf.para("VERDICT: O VISERON executa comandos com memória de execuções. Não transforma experiências em inteligência acumulada.", 11);
  pdf.bullets([
    { icon: "✅", text: "Experiência — tasks executadas, agentes disparados" },
    { icon: "✅", text: "Registro — TaskQueue + EventBus + Archive" },
    { icon: "⚠️", text: "Memória — LTM real mas keyword-based, sem embeddings" },
    { icon: "❌", text: "Análise — sem pattern detection (AutoLearningEngine só conta)" },
    { icon: "❌", text: "Aprendizado — sem feedback loop (STM→LTM é keyword freq)" },
    { icon: "❌", text: "Melhoria — agentes não se auto-otimizam" },
    { icon: "⚠️", text: "Nova execução — igual à anterior, sem ajuste" },
  ]);
  pdf.spacer();

  pdf.section("8", "DÍVIDA TÉCNICA (TOP 5)");
  pdf.bullet("🔴", "Embeddings sin/cos placeholder — busca semântica é aleatória (P0)");
  pdf.bullet("🔴", "Gateway OMEGA sem autenticação — 50 endpoints públicos (P0)");
  pdf.bullet("🟡", "Node 20 Docker vs Node 24 bare-metal — inconsistência (P1)");
  pdf.bullet("🟡", "11 agentes documentados que não existem — README inflacionado (P1)");
  pdf.bullet("🟡", "Sem rate limiting no gateway OMEGA (P1)");
  pdf.spacer();

  pdf.section("9", "CONCLUSÃO");
  pdf.para("O VISERON tem uma base sólida: kernel operacional, 14 agentes reais, 188 APIs, memória persistente, frontend 3D. Os gaps críticos são: embeddings reais (placeholder sin/cos), loop de aprendizagem (executa mas não aprende), e voz neural (só browser TTS). A arquitetura para evoluir existe — TaskQueue, EventBus, KnowledgeArchive — falta a camada de inteligência que transforma experiências em melhorias.", 11);
  pdf.spacer();

  pdf.rule();
  pdf.para("Auditoria total VISERON — 16 fases — 2026-08-11", 9, "#64748b");
  pdf.para("© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · TVS v7.0", 9, "#64748b");
  pdf.para("CONFIDENCIAL", 9, "#ff2d55");

  pdf.finish(OUT_PDF);
  console.log("[TVS] Audit PDF: " + OUT_PDF);
}

main().catch(e => { console.error(e); process.exit(1); });
