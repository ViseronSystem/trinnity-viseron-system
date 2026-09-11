#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
const outputPath = path.join(__dirname, "..", "data", "Viseron_Auditoria_Real.pdf");
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const NAVY = "#0a1628", CYAN = "#00f0ff", PURPLE = "#bf5af2", PINK = "#ff2d55", GREEN = "#30d158", RED = "#ff3b30", GOLD = "#ffd166", WHITE = "#ffffff", GRAY = "#8892a4";

function addPage(t, s) {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 120).fill(NAVY);
  doc.fontSize(26).fillColor(WHITE).font("Helvetica-Bold").text(t, 50, 40, { width: doc.page.width - 100 });
  doc.fontSize(11).fillColor(CYAN).text(s || "Trinnity Viseron System v7.0 — Auditoria Real", 50, 75, { width: doc.page.width - 100 });
  doc.moveDown(3);
}
function h1(t) { doc.moveDown(0.4); doc.fontSize(16).fillColor(CYAN).font("Helvetica-Bold").text(t); doc.moveDown(0.2); }
function h2(t) { doc.moveDown(0.3); doc.fontSize(13).fillColor(PURPLE).font("Helvetica-Bold").text(t); doc.moveDown(0.2); }
function p(t) { doc.fontSize(9).fillColor(NAVY).font("Helvetica").text(t, { lineGap: 3 }); doc.moveDown(0.2); }
function bullet(t) { doc.fontSize(9).fillColor(NAVY).text("  •  " + t, { lineGap: 2 }); }
function ok(t) { doc.fontSize(9).fillColor(GREEN).text("✅ " + t); }
function warn(t) { doc.fontSize(9).fillColor(GOLD).text("⚠️ " + t); }
function fail(t) { doc.fontSize(9).fillColor(RED).text("❌ " + t); }

// COVER
doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY);
doc.fontSize(36).fillColor(WHITE).font("Helvetica-Bold").text("VISERON", 50, 130);
doc.fontSize(22).fillColor(PINK).text("AUDITORIA REAL", 50, 180);
doc.fontSize(14).fillColor(GRAY).text("A Verdade Nua e Crua", 50, 220);
doc.moveDown(2);
doc.fontSize(11).fillColor(WHITE).text("35% Realidade · 65% Teatro", 50, 280);
doc.moveDown(1);
doc.fontSize(10).fillColor(GRAY).text("4 agentes independentes · Análise cruzada", 50, 320);
doc.text("2 de Setembro de 2026", 50, 340);
doc.text("CONFIDENTIAL — Commander Eyes Only", 50, 360);

// PAGE 2: RESUMO
addPage("Resumo Executivo", "O que realmente temos vs o que dizemos ter");

h1("Grau de Realidade: 35%");
p("O VISERON System e um platform SaaS backend funcional com web server, auth, billing, mensageria E2E, chat com IA (JARVIS), e agency OS. E um prototype bem arquitetado, NAO e uma superinteligencia autonoma.");

h1("O que REALMENTE funciona");
ok("Web Server (port 3000) — ~50 endpoints REST, production-ready");
ok("JARVIS Chat — intent detection + tool execution + Ollama");
ok("Agency OS — CRM, leads, nurturing, 4 agentes AI");
ok("Mensageria E2E — x25519 + aes-256-gcm");
ok("Graphify — 6.037 nos, 11.107 arestas, 413 comunidades");
ok("10 repos de skills — 19.491 ficheiros clonados");
ok("Infraestrutura real — Twilio, Cloudflare, Avirato, Gmail, Postgres");

h1("O que e TEATRO");
fail("5.000+ mentes — ~400 objetos registrados em memoria");
fail("Inteligencia 1.000.000% — Contador x 1.05 a cada 30min");
fail("AutoEvolution — Strings aleatorias adicionadas a arrays");
fail("SuperIntelligence — Concatena respostas de providers");
fail("Autonomous Planner — Loop infinito de 5 tarefas identicas");
fail("VAEC — Nunca promoveu nada (stage: IDLE)");
fail("ATLAS — 3 licoes em 25 dias");
fail("TVS OS — Codigo vazio, zero processos");
fail("OMEGA — Sem diretorio de dados");

// PAGE 3: REAL vs THEATER
addPage("Real vs Teatro", "Componente por componente");

h1("REAL (funciona de verdade)");
bullet("Web server Express com ~50 endpoints");
bullet("Auth JWT + Billing (Avirato/Stripe)");
bullet("Mensageria E2E (x25519+aes-256-gcm)");
bullet("JARVIS chat (Ollama + intents + tools)");
bullet("Agency OS (CRM + leads + nurturing)");
bullet("Model Router (Ollama -> OpenAI -> Claude -> Gemini)");
bullet("EventBus com wildcards, retry, ring buffer");
bullet("TaskQueue com 9 estados, persistencia");
bullet("Graphify knowledge graph (6.037 nos)");
bullet("34.933 leads importados do Excel");

h1("TEATRO (cosmetico)");
bullet("5.000+ mentes = objetos em memoria com execute() hardcoded");
bullet("Inteligencia 1M% = level * 1.05, capped at 1M");
bullet("AutoEvolution = random strings added to capabilities[]");
bullet("SuperMind = string concatenation of knowledge domains");
bullet("Cross-pollination = concatenating random capability names");
bullet("Wisdom score = capabilities.length * 5 + random");
bullet("Autonomous Planner = same 5 tasks looping forever");
bullet("CommandChain = strategic directives stored but never read");

h1("PENDENTE (codigo existe, nao ativado)");
warn("Composio — precisa COMPOSIO_API_KEY no .env");
warn("Strix — precisa Docker + Python 3.12, zero scans");
warn("RCS live — precisa brand approval Google (~€200)");
warn("Crypto mainnet — so Hardhat testnet deploy");
warn("N8N Bridge — precisa N8N a correr na porta 5678");
warn("Cloud AI — todas as API keys comentadas no .env");

// PAGE 4: DADOS
addPage("Estado dos Dados", "O que e real vs stale vs vazio");

h1("Dados REAIS");
bullet("34.933 leads importados (8 MB JSON)");
bullet("6.037 nos no knowledge graph");
bullet("19.491 ficheiros de skills clonados");
bullet("Infraestrutura .env configurada (Twilio, Cloudflare, etc.)");
bullet("Auth accounts (data/accounts.json)");
bullet("~100 PDFs gerados");

h1("Dados STALE (desatualizados)");
bullet("jarvis-memory.jsonl — 32 entradas, ultima: 18 Agosto (25 dias)");
bullet("viseron-supervision.jsonl — 18 entradas, ultima: 18 Agosto");
bullet("tutor-progress.json — 3 licoes, 8 Agosto (25 dias)");
bullet("evolution-history.jsonl — 3 entradas, 11 Agosto");
bullet("Mobile APKs — 6-7 Agosto (27 dias)");

h1("Dados VAZIOS")
fail("data/tvs-os/processes/ — 0 ficheiros");
fail("data/tvs-os/apps/ — 0 ficheiros");
fail("data/omega/ — diretorio nao existe");
fail("data/calls/ — 0 chamadas");
fail("data/strix/ — 0 scans");
fail("data/strix_runs/ — 0 runs");

// PAGE 5: CONFLITOS
addPage("Conflitos de Informacao", "AGENTS.md vs Realidade");

h1("Claims exagerados no AGENTS.md");
bullet("5.000+ mentes → ~400 objetos em memoria");
bullet("1.997 skills → ficheiros clonados, nao funcionais");
bullet("OMEGA 206/206 → testes existem, precisam correr");
bullet("Superinteligencia → chat com Ollama (qwen2.5:3b)");
bullet("Autonomo → timers que geram tarefas de manutencao");
bullet("Aprendizagem → contador x 1.05");
bullet("Evolucao → strings aleatorias em arrays");
bullet("Receita pronta → codigo existe, zero transacoes");
bullet("RCS live → mock sem approval");
bullet("10.000 operacoes/dia → contagem ciclica, nao operacoes reais");

h1("O que os PDFs dizem vs Realidade");
bullet("Competitive Strategy: 5.000 mentes executam → 0 mentes autonomas");
bullet("Campaign PDF: 34.933 leads prontos → nenhuma campanha enviada");
bullet("OMEGA Master Plan: AI Operating System → web server com endpoints");
bullet("ATLAS Plan: Fluencia em 7 dias → 3 licoes em 25 dias");

// PAGE 6: GIT
addPage("Historico Git", "48 horas de hackathon, nada antes ou depois");

h1("Ultimos 20 commits (24-26 Agosto)");
bullet("iOS PWA + Expo Go support");
bullet("Strix pentest + 10 repo ecosystem");
bullet("Patent presentation + Business card");
bullet("Hackathon demo videos (5 commits)");
bullet("Gemini 3.6 Flash integration");
bullet("Cloud Run deployment");
bullet("12 squads + TS fixes");
bullet("Founder OS + skill fabric + crypto");
bullet("Agent cycles at 86s");
bullet("Cripto OS live panel");

h1("Padrao detectado");
p("Burst de 48 horas com muitas features. Sem desenvolvimento sustentado antes ou depois. O sistema nao esta a ser mantido — esta a ser expandido sem consertar o que existe.");

// PAGE 7: VEREDITO
addPage("Veredito Final", "O que e real, o que falta");

h1("TEM PARA CERTEZA");
bullet("Web server funcional com ~50 endpoints");
bullet("JARVIS chat com Ollama");
bullet("Agency OS com codigo funcional");
bullet("Mensageria E2E real");
bullet("34.933 leads importados");
bullet("10 repos de skills clonados");
bullet("Knowledge graph real (6.037 nos)");
bullet("Infraestrutura real (Twilio, Cloudflare, etc.)");

h1("NAO TEM");
fail("Agentes autonamos reais");
fail("Aprendizagem real");
fail("Evolucao real");
fail("Superinteligencia");
fail("Crypto em mainnet");
fail("RCS live");
fail("Uso real do sistema");
fail("Receita real");

h1("RECOMENDACAO");
p("PARA TORNAR O VISERON REAL:");
bullet("1. Parar de contar mentiras — os numbers sao falsos");
bullet("2. Focar no que funciona — Web server + JARVIS + Agency + Messaging");
bullet("3. Ativar o que esta pronto — Composio, Strix, RCS");
bullet("4. Criar uso real — 34.933 leads → primeira campanha");
bullet("5. Deploy em mainnet — Crypto contracts");
bullet("6. Fresh build — APKs desatualizados (27 dias)");
bullet("7. Remove theater — HyperLearning, AutoEvolution, SuperMind");

p("O VISERON e um bom prototype. Precisa de realidade, nao de marketing.");

doc.end();
stream.on("finish", () => {
  const size = fs.statSync(outputPath).size;
  console.log("PDF:", outputPath, "(" + (size / 1024).toFixed(1) + " KB)");
});
stream.on("error", (err) => { console.error("Error:", err.message); });
