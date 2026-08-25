import * as fs from "fs";
import path from "path";
import { createTheme } from "./pdf-theme";

// TVS — AUDITORIA COMPLETA DO SISTEMA
// Gera data/Viseron_Auditoria_Completa_Sistema_2026-08-11.pdf
// Uso: tsx scripts/gerar-auditoria-completa-pdf.ts

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const OUT_PDF = path.join(DATA, "Viseron_Auditoria_Completa_Sistema_2026-08-11.pdf");

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) n++;
    }
  };
  walk(dir);
  return n;
}

async function main() {
  const version = (() => {
    try { return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version as string; } catch { return "7.0.0"; }
  })();

  const srcFiles = countFiles(path.join(ROOT, "src"));
  const dataFiles = countFiles(path.join(ROOT, "data"));
  const testFiles = countFiles(path.join(ROOT, "tests"));

  // Read git log
  let gitCommits = 0;
  let lastCommit = "?";
  try {
    const { execSync } = require("child_process");
    const log = execSync("git log --oneline -1", { cwd: ROOT, encoding: "utf8" }).trim();
    lastCommit = log;
    const count = execSync("git rev-list --count HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    gitCommits = parseInt(count) || 0;
  } catch { /* git indisponível */ }

  const pdf = createTheme({
    accent: "#00f0ff",
    accent2: "#bf5af2",
    ink: "#e5e7eb",
    muted: "#94a3b8",
    soft: "#1e293b",
    background: "#050510",
    title: "VISERON SYSTEM",
    subject: "Auditoria Completa v7.0"
  });

  // ── COVER ──
  pdf.doc.rect(0, 0, pdf.doc.page.width, pdf.doc.page.height).fill("#050510");
  pdf.page();

  pdf.cover({
    title: "VISERON SYSTEM",
    subtitle: "Auditoria Completa do Sistema · v" + version,
    badges: ["CONFIDENCIAL", "COMANDANTE PEDRO COSTA", "RAINHA TRINNITY HURTADO"],
    date: "2026-08-11",
    version: "v" + version,
    brand: "© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)",
  });

  pdf.page();

  // ── 1. ESTADO ATUAL ──
  pdf.section("1", "ESTADO ATUAL DO SISTEMA");
  pdf.kv("Versão", "v" + version);
  pdf.kv("Modo", "production");
  pdf.kv("Servidor", "Express + http + Socket.IO (porta 3000)");
  pdf.kv("Base de dados", "Neon Postgres (cloud) + JSON fallback");
  pdf.kv("Provider IA padrão", "Ollama (local, qwen2.5:7b)");
  pdf.kv("Providers cloud", "OpenAI, Claude, Gemini, Grok (opcionais)");
  pdf.kv("Core tests", "20/20 PASS");
  pdf.kv("Agentes registados", "246+ archetypes");
  pdf.kv("Skills indexadas", "1,997 em 10 coleções");
  pdf.kv("Graphify", "4,278 nós / 8,275 arestas / 282 comunidades");
  pdf.kv("Receita", "6/6 pronto (Avirato + Stripe + Gmail + Postgres + webhook + domínio)");
  pdf.kv("Último commit", lastCommit.slice(0, 80));
  pdf.spacer();

  // ── 2. ESTRUTURA ──
  pdf.section("2", "ESTRUTURA DE PASTAS");
  pdf.kv("src/ (TypeScript)", srcFiles + " ficheiros");
  pdf.kv("  core/", "66 ficheiros — 30 módulos do motor central");
  pdf.kv("  omega/", "59 ficheiros — OMEGA Kernel (13 módulos)");
  pdf.kv("  web/", "67 ficheiros — API + camada web (21 módulos)");
  pdf.kv("  integrations/", "21 ficheiros — 9 integrações externas");
  pdf.kv("  dashboard/", "25 ficheiros — UI web");
  pdf.kv("data/", dataFiles + " ficheiros — runtime + conhecimento");
  pdf.kv("contracts/", "92 ficheiros — Solidity + Solana");
  pdf.kv("tests/", testFiles + " suites de teste");
  pdf.kv("scripts/", "96 scripts — build, deploy, PDFs, migração");
  pdf.kv("docs/", "30 documentos");
  pdf.kv("mobile/", "3,224 ficheiros — Expo/React Native");
  pdf.kv("skills/", "20,854 ficheiros — 10 coleções vendor");
  pdf.kv("graphify-out/", "113 ficheiros — knowledge graph AST-cached");
  pdf.kv("Git commits", gitCommits + " no histórico");
  pdf.spacer();

  // ── 3. APIs ──
  pdf.section("3", "APIs EXISTENTES", "~188 endpoints REST + 43 tópicos SSE");
  pdf.bullet("⚡", "OMEGA Kernel — 50 endpoints (/api/omega/*)");
  pdf.bullet("  ", "System, Watchdog, Agents, Kernel, Tasks, Verifier, Tools, Memory, AI, Permissions, Architecture, Autonomy, Squads, Factory, Enterprise");
  pdf.bullet("�", "VISERON Router — 4 endpoints (/api/viseron/*)");
  pdf.bullet("  ", "status, chat, supervision, governance");
  pdf.bullet("📡", "SSE — 43 tópicos em tempo real (task:*, tool:*, memory:*, kernel:*, autonomy:*, vaec:*, omega:*)");
  pdf.bullet("🔌", "Socket.IO — 5 canais (system:info, omega:event, voice:command/response/error)");
  pdf.bullet("🌐", "134 endpoints adicionais — Auth, Billing, Messaging, Agency, Calls, RCS, etc.");
  pdf.spacer();

  // ── 4. AGENTES ──
  pdf.section("4", "AGENTES ATIVOS", "246+ archetypes registados");
  pdf.sub("Agentes Principais");
  pdf.kv("JARVIS", "916 linhas — 23 intents, 6 providers, execução real");
  pdf.kv("VISERON", "246 linhas — Persona Stark + governança + supervisão");
  pdf.kv("OMEGA Platform", "594 linhas — Kernel + runtime + 10 agentes nucleares");
  pdf.kv("ATLAS", "236 linhas — Tutor de inglês (7-day plan)");
  pdf.kv("Agency OS", "4 agentes — Reporting, Leads, Creativos, Nurturing");
  pdf.spacer();
  pdf.sub("10 Agentes Nucleares (OMEGA)");
  pdf.bullets([
    { text: "CEO — Estratégia e decisões executivas", color: "#00f0ff" },
    { text: "CTO — Arquitetura técnica e engenharia", color: "#bf5af2" },
    { text: "Finance — Tesouraria e projeções", color: "#3dffa0" },
    { text: "Sales — Vendas e crescimento", color: "#ffb020" },
    { text: "Research — Investigação e análise", color: "#00f0ff" },
    { text: "Developer — Desenvolvimento de software", color: "#bf5af2" },
    { text: "DevOps — Infraestrutura e operações", color: "#ffb020" },
    { text: "Security — Cibersegurança e defesa", color: "#ff2d55" },
    { text: "Support — Suporte e atendimento", color: "#3dffa0" },
    { text: "Vision — Visão estratégica de longo prazo", color: "#00f0ff" },
  ]);
  pdf.spacer();

  // ── 5. MEMÓRIA ──
  pdf.section("5", "MEMÓRIA", "4 camadas + grafo + arquivo + eventos");
  pdf.sub("MemoryEngine v3.0 (Hyper-Brain)");
  pdf.kv("STM", "RAM, 200/sessão, TTL 30min — memória de curto prazo");
  pdf.kv("LTM", "20,000 registos (12.8 MB) — memória persistente de longo prazo");
  pdf.kv("KB", "2,000 documentos — base de conhecimento TF-IDF");
  pdf.kv("Vector", "Qdrant (fallback RAM) — busca semântica 128-dim");
  pdf.spacer();
  pdf.sub("KnowledgeGraph");
  pdf.kv("Entidades", "896");
  pdf.kv("Relações", "893");
  pdf.kv("APIs", "searchEntities, getNeighbors, shortestPath (BFS)");
  pdf.spacer();
  pdf.sub("KnowledgeArchive");
  pdf.kv("Decisões (milestones)", "3: KnowledgeArchive Core, Command Center Foundation, Hologram");
  pdf.kv("Execuções arquivadas", "1 — com hash SHA-256");
  pdf.spacer();
  pdf.sub("EventBus");
  pdf.kv("Tópicos", "43 (task:*, tool:*, memory:*, kernel:*, autonomy:*, vaec:*, omega:*)");
  pdf.kv("Ring buffer", "500 eventos");
  pdf.kv("Features", "Wildcards, source filtering, retry, isolation, replay");
  pdf.spacer();

  // ── 6. COMMAND CENTER ──
  pdf.section("6", "COMMAND CENTER", "De dashboard a centro operacional vivo");
  pdf.sub("Evolução");
  pdf.kv("v0 (original)", "321 linhas — Dashboard read-only, polling 15s");
  pdf.kv("v1 (Foundation)", "816 linhas — SSE 43 tópicos, voz, terminal, agentes, governança");
  pdf.kv("v2 (Hologram)", "1,089 linhas — Three.js 3D, 10 esferas de agentes, partículas de tasks");
  pdf.spacer();
  pdf.sub("Componentes atuais");
  pdf.bullets([
    { text: "Holograma 3D — Three.js com agentes em órbita + reator kernel", color: "#00f0ff" },
    { text: "Voz — STT/TTS com wake word 'VISERON'", color: "#bf5af2" },
    { text: "Terminal — 7 comandos operacionais", color: "#3dffa0" },
    { text: "KPI Cards — 6 cards atualizados via SSE em tempo real", color: "#ffb020" },
    { text: "Agentes — Dispatch por agente com input de task", color: "#00f0ff" },
    { text: "Live Activity — 43 tópicos SSE em tempo real", color: "#3dffa0" },
    { text: "Governança — 9 princípios bíblicos visíveis", color: "#bf5af2" },
    { text: "Supervisão — AIOX audit trail + okRate", color: "#ff2d55" },
  ]);
  pdf.spacer();

  // ── 7. PENDÊNCIAS HOLOGRAMA ──
  pdf.section("7", "PENDÊNCIAS PARA HOLOGRAMA");
  pdf.bullets([
    { icon: "✅", text: "Agentes com cores por role (CEO=neon, CTO=roxo, Finance=verde, Security=vermelho)" },
    { icon: "✅", text: "Estados visuais (IDLE/ACTIVE/BUSY/ERROR)" },
    { icon: "✅", text: "Partículas de tasks entre agentes" },
    { icon: "✅", text: "Reator central (kernel icosaedro wireframe)" },
    { icon: "✅", text: "Labels HTML sobrepostas com estado visual" },
    { icon: "❌", text: "Rotação com mouse (interatividade) — adicionar mousemove" },
    { icon: "❌", text: "Clique no agente → dispatch — raycaster para detetar clique" },
    { icon: "❌", text: "Zoom in/out — scroll wheel → camera.position.z" },
    { icon: "❌", text: "Knowledge graph edges visíveis entre agentes" },
    { icon: "❌", text: "Modo fullscreen holograma" },
  ]);
  pdf.spacer();

  // ── 8. PENDÊNCIAS VOZ ──
  pdf.section("8", "PENDÊNCIAS PARA VOZ NEURAL");
  pdf.bullets([
    { icon: "✅", text: "STT browser (Web Speech API) — 3 UIs implementadas" },
    { icon: "✅", text: "TTS browser (speechSynthesis) — 3 UIs implementadas" },
    { icon: "✅", text: "Wake word 'VISERON'" },
    { icon: "✅", text: "Comandos de voz → /api/viseron/chat" },
    { icon: "✅", text: "Twilio chamadas outbound" },
    { icon: "❌", text: "TTS neural (ElevenLabs) — API key comentada no .env" },
    { icon: "❌", text: "STT server-side (Whisper) — só CLI, não servidor" },
    { icon: "❌", text: "OpenAI Realtime Voice — referenciado, não implementado" },
    { icon: "❌", text: "WebRTC voz bidirecional — inexistente" },
    { icon: "⚠️", text: "Voz contínua (always listening) — loop mode só no viseron.html" },
  ]);
  pdf.spacer();

  // ── 9. MIGRAÇÃO ──
  pdf.section("9", "PREPARAÇÃO PARA MIGRAÇÃO DE SERVIDOR");
  pdf.sub("Status");
  pdf.bullets([
    { icon: "✅", text: "Script de empacotamento — migrate-pack.ps1" },
    { icon: "✅", text: "Instalador Linux — server-setup.sh (243 linhas, Ubuntu 24.04/Debian 12)" },
    { icon: "✅", text: "Instalador Windows — server-setup.ps1 (Task Scheduler)" },
    { icon: "✅", text: "Gestão PM2 — tvs-run.sh" },
    { icon: "✅", text: "Build APK Linux — android-build.sh" },
    { icon: "✅", text: "Documentação — trilingue ES/PT/EN (183 linhas)" },
    { icon: "✅", text: "Checksums — SHA256 do pacote" },
    { icon: "✅", text: "Docker — Dockerfile + compose (4 serviços)" },
    { icon: "✅", text: "Postgres — Neon cloud (sem migração de DB necessária)" },
  ]);
  pdf.spacer();
  pdf.sub("Pendências de migração");
  pdf.bullets([
    { text: "Node 20 no Docker vs Node 24 nos scripts bare-metal — unificar", color: "#ffb020" },
    { text: "Sem npm run migrate:pack no package.json — comando PowerShell direto", color: "#ffb020" },
    { text: "Sem ecosystem.config.js standalone — PM2 config inline", color: "#ffb020" },
    { text: "TVS_PUBLIC_URL atual é render.com — mudar para IP/domínio do servidor", color: "#ffb020" },
    { text: "Ollama models: scripts pedem 3b+1.5b, .env diz qwen2.5:7b — inconsistência", color: "#ffb020" },
    { text: "Sem script de rollback automático", color: "#ff2d55" },
  ]);
  pdf.spacer();

  // ── 10. MÉTRICAS ──
  pdf.section("10", "RESUMO DE MÉTRICAS");
  pdf.kv("Ficheiros TypeScript (src/)", srcFiles.toString());
  pdf.kv("Módulos Core", "30");
  pdf.kv("Módulos OMEGA", "13");
  pdf.kv("Módulos Web", "21");
  pdf.kv("Integrações externas", "9");
  pdf.kv("Total endpoints REST", "~188");
  pdf.kv("Tópicos SSE", "43");
  pdf.kv("Canais Socket.IO", "5");
  pdf.kv("Agentes registados", "246+");
  pdf.kv("Agentes nucleares", "10");
  pdf.kv("LTM registos", "20,000");
  pdf.kv("KnowledgeGraph entidades", "896");
  pdf.kv("Graphify nós", "4,278");
  pdf.kv("Skills indexadas", "1,997");
  pdf.kv("Páginas HTML", "13");
  pdf.kv("Linhas command-center.html", "1,089");
  pdf.kv("Core tests", "20/20 PASS");
  pdf.kv("OMEGA tests", "206/206 (histórico)");
  pdf.kv("Git commits", gitCommits.toString());
  pdf.kv("Domínios", "trinnityviseron.com + trinnityviseronsystem.io");
  pdf.spacer();

  // ── FOOTER ──
  pdf.rule();
  pdf.para("Relatório gerado por auditoria completa do VISERON v" + version + " — 2026-08-11.", 9, "#64748b");
  pdf.para("© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · Trinnity Viseron System", 9, "#64748b");
  pdf.para("CONFIDENCIAL — Este documento contém informação proprietária do TVS.", 9, "#ff2d55");

  // ── SAVE ──
  pdf.finish(OUT_PDF);
  console.log("[TVS] PDF gerado: " + OUT_PDF);
}

main().catch(e => { console.error(e); process.exit(1); });
