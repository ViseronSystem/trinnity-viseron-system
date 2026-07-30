import PDFDocument from "pdfkit";
import * as fs from "fs-extra";
import * as path from "path";

function rgb(r: number, g: number, b: number): string {
  return `rgb(${r},${g},${b})`;
}

const C = {
  darkBg: rgb(10, 10, 46), accent: rgb(0, 245, 255), accent2: rgb(255, 0, 255),
  gold: rgb(255, 215, 0), green: rgb(0, 255, 136), white: rgb(255, 255, 255),
  lightGray: rgb(200, 200, 200), text: rgb(50, 50, 50), subtitle: rgb(110, 110, 120),
  section: rgb(10, 10, 46), card: rgb(245, 248, 255), tableHead: rgb(10, 10, 46),
};

const W = 525; // usable width (595 - 90 margins)
const LM = 45;
const A4H = 842;
const TOP = 45;
const BOT = 45;
const MAX_Y = A4H - BOT - 30;

let pageNum = 0;
let doc: any;

function np() { doc.addPage(); pageNum++; }

function ypad(h: number) { doc.y += h; }

function checkPage(h: number) {
  if (doc.y + h > MAX_Y) np();
}

function drawHeader(title: string) {
  checkPage(40);
  doc.fillColor(C.section).fontSize(20).font("Helvetica-Bold").text(title, LM, doc.y, { underline: false });
  doc.moveDown(1.2);
}

function drawLine(x1: number, y1: number, x2: number, y2: number, color: string, w: number) {
  doc.moveTo(x1, y1).lineTo(x2, y2).strokeColor(color).lineWidth(w).stroke();
}

function textAt(text: string, x: number, y: number, size: number, color: string, font: string, opts?: any) {
  doc.fontSize(size).fillColor(color).font(font).text(text, x, y, opts || {});
}

function drawCard(y: number, h: number, bg: string, border: string, bw: number) {
  doc.rect(LM, y, W, h).fillColor(bg).strokeColor(border).lineWidth(bw).stroke();
}

function drawCardRow(label: string, value: string, y: number, labelW: number = 140) {
  textAt(label, LM + 8, y + 2, 9, C.section, "Helvetica-Bold");
  textAt(value, LM + labelW, y + 2, 8.5, C.text, "Helvetica");
}

function makeTable(headers: string[], rows: string[][], colPcts: number[]) {
  const colW = colPcts.map(p => Math.floor(W * p / 100));
  const colX: number[] = [];
  let cx = LM;
  colW.forEach(w => { colX.push(cx); cx += w; });

  const rowH = 18;
  const headerH = 18;

  checkPage(headerH + rows.length * rowH + 10);

  const hY = doc.y;
  drawCard(hY, headerH, C.tableHead, C.accent, 0.5);
  doc.fillColor(C.white).fontSize(7.5).font("Helvetica-Bold");
  headers.forEach((h, i) => {
    doc.text(h, colX[i] + 3, hY + 1.5, { width: colW[i] - 6, height: headerH - 3, lineBreak: false });
  });

  let curY = hY + headerH;
  rows.forEach((row, ri) => {
    if (curY + rowH > MAX_Y) { np(); curY = TOP; }
    const bg = ri % 2 === 0 ? C.card : C.white;
    drawCard(curY, rowH, bg, C.lightGray, 0.3);
    doc.fillColor(C.text).fontSize(7).font("Helvetica");
    row.forEach((cell, ci) => {
      doc.text(cell, colX[ci] + 3, curY + 2, { width: colW[ci] - 6, height: rowH - 4, lineBreak: false });
    });
    curY += rowH;
  });

  doc.y = curY + 2;
}

async function generateManual(outputPath: string) {
  doc = new PDFDocument({
    size: "A4", margins: { top: TOP, bottom: BOT, left: LM, right: LM },
    info: { Title: "Trinnity Viseron System - Manual Completo", Author: "TVS v5.0", Subject: "Multi-Agent AI Superintelligence" },
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);
  pageNum = 1;

  // ========== CAPA ==========
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.darkBg);
  textAt("TRINNITY", LM, 130, 52, C.accent, "Helvetica-Bold", { align: "center" });
  textAt("VISERON SYSTEM", LM, 185, 46, C.white, "Helvetica-Bold", { align: "center" });
  textAt("v5.0 MULTIVERSAL", LM, 230, 20, C.accent2, "Helvetica-Bold", { align: "center" });
  drawLine(150, 270, 445, 270, C.accent, 1);
  textAt("Sistema Operativo Multi-Agente de Superinteligencia Artificial", LM, 285, 13, C.lightGray, "Helvetica", { align: "center" });
  textAt("5.112 Mentes Autonomas  25 Sectores Estrategicos  290+ Provedores IA", LM, 305, 11, C.lightGray, "Helvetica", { align: "center" });
  textAt("Comandante Supremo: Pedro Costa  Reina Arquitecta: Trinnity Hurtado", LM, 350, 11, C.gold, "Helvetica", { align: "center" });
  textAt("Tokens: $VSR (300M)  $TRIN  AIOX Core Squad", LM, 370, 9, C.subtitle, "Helvetica", { align: "center" });
  textAt("https://github.com/ViseronSystem/trinnity-viseron-system", LM, 390, 9, C.subtitle, "Helvetica", { align: "center" });

  np();

  // ========== INDICE ==========
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.darkBg);
  textAt("INDICE", LM, 80, 26, C.white, "Helvetica-Bold", { align: "center" });
  drawLine(200, 105, 395, 105, C.accent, 0.5);

  const toc = [
    ["1.", "O que e Trinnity Viseron System?"],
    ["2.", "Arquitetura do Sistema"],
    ["3.", "Comandos de Inicializacao"],
    ["4.", "Comandos de Build & Compilacao"],
    ["5.", "Comandos de Deploy & Publicacao"],
    ["6.", "Comandos Mobile (Android/iOS)"],
    ["7.", "Comandos Desktop (Electron/Standalone)"],
    ["8.", "Comandos de Integracoes"],
    ["9.", "Comandos de Backup & Manutencao"],
    ["10.", "Comandos do AIOX Core CLI"],
    ["11.", "API REST - Endpoints Completos"],
    ["12.", "Modulos do Core TVS"],
    ["13.", "Provedores de IA Suportados"],
    ["14.", "Tokens: $VSR e $TRIN"],
    ["15.", "Solucoes para o Mundo"],
    ["16.", "Modelo de Assinatura - Por que Pagar?"],
    ["17.", "Planos e Precos"],
    ["18.", "Squads AIOX, Pedro & Trinnity"],
    ["19.", "Glossario de Comandos Rapidos"],
  ];

  let ty = 130;
  toc.forEach(([num, title]) => {
    textAt(` ${num}  ${title}`, LM, ty, 10, C.white, "Helvetica");
    ty += 22;
  });

  np();

  // ========== 1. O QUE E TVS? ==========
  drawHeader("1. O que e Trinnity Viseron System?");
  doc.fontSize(10.5).fillColor(C.text).font("Helvetica");
  doc.text("Trinnity Viseron System (TVS) e um Sistema Operativo Multi-Agente de Superinteligencia Artificial uma plataforma autonoma que orquestra milhares de mentes artificiais para resolver problemas complexos, gerar codigo, criar aplicacoes, gerenciar tokens, automatizar fluxos de trabalho e muito mais.", LM, doc.y, { align: "justify", width: W });
  ypad(6);
  doc.text("Liderado pelo Comandante Supremo Pedro Costa e pela Reina Arquitecta Trinnity Hurtado, o TVS opera com 5.112 agentes autonomos divididos em 25 setores estrategicos desde aeroespacial e defesa ate saude, financas e educacao.", LM, doc.y, { align: "justify", width: W });
  ypad(6);
  doc.text("Construido em TypeScript/Node.js, funciona com 290+ provedores de IA (incluindo modelos locais via Ollama para operacao offline completa), gera tokens ERC-20, compila aplicacoes moveis Android/iOS, cria executaveis desktop, e se auto-evolui a cada 30 minutos com incrementos de +500% de inteligencia.", LM, doc.y, { align: "justify", width: W });
  ypad(10);

  const d1 = doc.y;
  checkPage(85);
  drawCard(doc.y, 80, C.card, C.accent, 1);
  textAt(" DADOS PRINCIPAIS", LM + 8, doc.y + 5, 11, C.section, "Helvetica-Bold");
  const items = [
    "5.112 Agentes Autonomos (4.742 mentes historicas + 246 arquétipos + 114 batalhao + ~10 core)",
    "25 Setores Estrategicos de atuacao",
    "290+ Provedores de IA via OmniRoute Bridge",
    "Auto-Evolucao: +500% de inteligencia a cada 30 minutos",
    "Tokens: $VSR (300M supply) e $TRIN (utilidade)",
    "Deploy multiplataforma: Web, Mobile (Android/iOS), Desktop (Windows/Mac/Linux)",
  ];
  let iy = doc.y + 22;
  items.forEach(item => { textAt("  "+item, LM + 8, iy, 8.5, C.text, "Helvetica"); iy += 12; });
  doc.y = iy + 5;

  np();

  // ========== 2. ARQUITETURA ==========
  drawHeader("2. Arquitetura do Sistema");
  const mods = [
    ["ViseronCore", "Motor principal que orquestra todos os componentes do sistema"],
    ["Orchestrator", "Coordena tarefas multi-agente com decomposicao automatica de subtarefas"],
    ["AgentManager", "Gerencia ciclo de vida de todos os agentes (registro, execucao, status)"],
    ["ModelRouter", "Roteia requisicoes para o modelo de IA otimo entre 8+ provedores"],
    ["MemoryEngine", "Memoria de curto prazo (100 itens/sessao) e longo prazo (persistente em JSON)"],
    ["ProviderFactory", "Fabrica de provedores: Ollama, OpenAI, Claude, Gemini, Grok, OmniRoute"],
    ["AIProviderBridge", "Ponte para 290+ provedores com fallback automatico e ensemble"],
    ["SuperIntelligence", "Sintese multi-provedor com ensemble reasoning (8 IAs simultaneas)"],
    ["SuperMind", "Agregacao de conhecimento entre todos os dominios e agentes"],
    ["AutoLearningEngine", "Ciclos de auto-aprendizado a cada 30 minutos sem intervencao humana"],
    ["HyperLearningEngine", "Aprendizado acelerado: inteligencia cresce 500% a cada ciclo (x6)"],
    ["AutoEvolutionEngine", "Agentes evoluem capacidades autonomamente via algoritmos geneticos"],
    ["AgentSpawner", "Carrega 4.742 mentes historicas como agentes executaveis"],
    ["CommandChain", "Cadeia de comando hierarquica com linhagem e assinatura dupla"],
    ["SquadManager", "Gerencia squads de agentes para missoes especificas"],
    ["ToolManager", "Cria e executa ferramentas externas (APIs, webhooks, MCP)"],
    ["AppScaffolder", "Gera aplicacoes full-stack completas de descricoes em linguagem natural"],
    ["BusinessSolutionEngine", "Gera solucoes empresariais completas (plano + arquitetura + implementacao)"],
    ["TokenEngine", "Gera tokens ERC-20 ($TRIN, $VSR) com tokenomics e contratos Solidity"],
    ["WebAppGenerator", "Gera websites e landing pages automaticamente"],
    ["MCP Server", "Servidor Model Context Protocol para integracao com ferramentas externas"],
    ["ReportServer", "Relatorios completos em JSON e PDF com estatisticas do sistema"],
    ["VoiceBridge", "Bridge de voz JARVIS com sintese de fala e comandos de voz"],
  ];

  mods.forEach((m, i) => {
    checkPage(16);
    const bg = i % 2 === 0 ? C.card : C.white;
    drawCard(doc.y, 15, bg, C.lightGray, 0.3);
    textAt(" "+m[0], LM + 4, doc.y + 1, 8, C.section, "Helvetica-Bold");
    textAt(m[1], LM + 120, doc.y + 1, 7.5, C.subtitle, "Helvetica", { width: W - 130 });
    doc.y += 16;
  });

  np();

  // ========== 3. INICIALIZACAO ==========
  drawHeader("3. Comandos de Inicializacao");
  doc.fontSize(9.5).fillColor(C.subtitle).font("Helvetica").text("Comandos para iniciar, testar e verificar o sistema.", LM, doc.y, { width: W });
  ypad(8);

  makeTable(["Comando", "Descricao", "Acao"], [
    ["npm start", "Inicia o sistema TVS (producao)", "node dist/src/index.js"],
    ["npm run dev", "Modo desenvolvimento com hot-reload", "nodemon --exec tsx src/index.ts"],
    ["npm run super:start", "Inicia com superinteligencia ativada", "tsx src/index.ts"],
    ["npm run launch", "Executa script de lancamento", "tsx src/launch/market.ts"],
    ["npm run setup", "Instala dependencias root e mobile", "npm install && cd mobile && npm install"],
    ["npm run init", "Executa script de inicializacao", "scripts/init-system.ps1"],
    ["npm run init:full", "Build + Backup + Start (ciclo completo)", "scripts/init-system.ps1 -Full"],
  ], [22, 38, 40]);

  ypad(8);
  checkPage(60);
  doc.fontSize(11).fillColor(C.section).font("Helvetica-Bold").text("Script init-system.ps1", LM, doc.y);
  ypad(5);
  doc.fontSize(9).fillColor(C.text).font("Helvetica");
  doc.text("Uso: .\\scripts\\init-system.ps1 [parametros]", LM, doc.y, { width: W });
  doc.text("  -Build      : Compila TypeScript", LM, doc.y);
  doc.text("  -Start      : Inicia o sistema", LM, doc.y);
  doc.text("  -Backup     : Executa backup diario", LM, doc.y);
  doc.text("  -Full       : Build + Backup + Start (ciclo completo)", LM, doc.y);

  np();

  // ========== 4. BUILD ==========
  drawHeader("4. Comandos de Build & Compilacao");
  makeTable(["Comando", "Descricao", "Acao"], [
    ["npm run build", "Compila TypeScript para dist/", "tsc + copia assets"],
    ["npm run lint", "Verifica erros de TypeScript", "tsc --noEmit"],
    ["npm test", "Executa testes core", "tsx tests/core.test.ts"],
    ["npm run test:hyper", "Executa testes hyperlearning", "tsx tests/hyperbrain.test.ts"],
  ], [22, 38, 40]);
  ypad(8);
  doc.fontSize(11).fillColor(C.section).font("Helvetica-Bold").text("Build do AIOX Core CLI", LM, doc.y);
  ypad(4);
  doc.fontSize(9).fillColor(C.text).font("Helvetica").text("cd packages/aiox-core && npm run build", LM, doc.y, { width: W });

  np();

  // ========== 5. DEPLOY ==========
  drawHeader("5. Comandos de Deploy & Publicacao");
  doc.fontSize(9.5).fillColor(C.subtitle).font("Helvetica").text("Comandos para publicar o sistema em todas as plataformas.", LM, doc.y, { width: W });
  ypad(8);
  makeTable(["Comando", "Descricao", "Acao"], [
    ["npm run deploy", "Deploy script manual", "scripts/deploy-all.ps1"],
    ["npm run deploy:full", "Build + Backup + GitHub + Vercel", "scripts/deploy-all.ps1 -Full"],
    ["npm run deploy:github", "Push para GitHub apenas", "scripts/deploy-all.ps1 -GitHub"],
    ["npm run deploy:vercel", "Deploy landing page p/ Vercel", "scripts/deploy-all.ps1 -Vercel"],
  ], [22, 38, 40]);
  ypad(10);
  drawCard(doc.y, 58, C.card, C.accent, 0.5);
  const dy = doc.y;
  textAt(" Plataformas de Deploy", LM + 6, dy + 4, 10, C.section, "Helvetica-Bold");
  textAt("  GitHub: https://github.com/ViseronSystem/trinnity-viseron-system", LM + 6, dy + 20, 8, C.text, "Helvetica");
  textAt("  Vercel: https://trinnityviseron.com (Landing Page)", LM + 6, dy + 32, 8, C.text, "Helvetica");
  textAt("  Railway: Backend TVS Core (configurado em railway.json)", LM + 6, dy + 44, 8, C.text, "Helvetica");
  textAt("  Docker: docker-compose up (TVS + Ollama + Qdrant + n8n)", LM + 6, dy + 56, 8, C.text, "Helvetica");
  doc.y = dy + 64;

  np();

  // ========== 6. MOBILE ==========
  drawHeader("6. Comandos Mobile (Android & iOS)");
  makeTable(["Comando", "Descricao", "Acao"], [
    ["npm run build:android", "Build APK para Android", "build-all.ps1 -Target android"],
    ["npm run build:ios", "Build IPA para iOS (macOS)", "build-all.ps1 -Target ios"],
    ["npm run build:all", "Build Android + iOS", "build-all.ps1 -Target all"],
    ["npm run build:eas-android", "Build via EAS (Expo)", "build-all.ps1 -Target eas-android"],
    ["npm run build:eas-ios", "Build iOS via EAS (Expo)", "build-all.ps1 -Target eas-ios"],
    ["npm run mobile:start", "Iniciar Expo dev server", "cd mobile && npx expo start"],
    ["npm run mobile:android", "Run Android direct", "cd mobile && npx expo run:android"],
    ["npm run mobile:ios", "Run iOS direct", "cd mobile && npx expo run:ios"],
  ], [22, 36, 42]);
  ypad(10);
  const m1 = doc.y;
  drawCard(m1, 52, C.card, C.accent2, 0.5);
  textAt(" Estrutura do App Mobile", LM + 6, m1 + 4, 10, C.section, "Helvetica-Bold");
  textAt("  Framework: Expo SDK 52 + React Native 0.76.9", LM + 6, m1 + 20, 8, C.text, "Helvetica");
  textAt("  Telas: Dashboard, Agents, Terminal (navegacao por abas)", LM + 6, m1 + 32, 8, C.text, "Helvetica");
  textAt("  Conexao: Socket.IO + REST API para o backend TVS", LM + 6, m1 + 44, 8, C.text, "Helvetica");
  doc.y = m1 + 58;

  np();

  // ========== 7. DESKTOP ==========
  drawHeader("7. Comandos Desktop (Electron & Standalone)");
  makeTable(["Comando", "Descricao", "Detalhes"], [
    ["npm run build:exe", "Build executavel standalone (win)", "scripts/build-standalone.mjs"],
    ["npm run build:exe:win", "Build para Windows", "--platform win"],
    ["npm run build:exe:mac", "Build para macOS", "--platform mac"],
    ["npm run build:exe:linux", "Build para Linux", "--platform linux"],
    ["npm run build:exe:all", "Build para todas plataformas", "--platform all"],
    ["npm run build:electron", "Build Electron (win)", "--platform win --electron"],
    ["npm run build:electron:all", "Build Electron todas", "--platform all --electron"],
    ["npm run electron:setup", "Instalar deps do Electron", "cd electron && npm install"],
    ["npm run electron:start", "Iniciar Electron", "cd electron && npx electron ."],
    ["npm run electron:build:win", "Build Electron Windows", "NSIS installer + portable"],
    ["npm run electron:build:mac", "Build Electron macOS", "DMG"],
    ["npm run electron:build:linux", "Build Electron Linux", "AppImage + deb"],
  ], [24, 36, 40]);
  ypad(10);
  const dk = doc.y;
  drawCard(dk, 48, C.card, C.green, 0.5);
  textAt(" Saida dos Builds", LM + 6, dk + 4, 10, C.section, "Helvetica-Bold");
  textAt("  Standalone: .build/tvs-standalone/tvs-viseron-win.exe", LM + 6, dk + 20, 8, C.text, "Helvetica");
  textAt("  Portable: .build/TVS_Viseron_Portable.zip", LM + 6, dk + 32, 8, C.text, "Helvetica");
  textAt("  Electron: electron/dist-electron/ (configuravel)", LM + 6, dk + 44, 8, C.text, "Helvetica");
  doc.y = dk + 54;

  np();

  // ========== 8. INTEGRACOES ==========
  drawHeader("8. Comandos de Integracoes");
  makeTable(["Comando", "Descricao", "Detalhes"], [
    ["npm run omniroute:start", "Inicia OmniRoute AI Gateway", "Porta 20128, 290+ providers"],
    ["npm run call:start", "Inicia Call System (Twilio)", "Voz + SMS com IA"],
    ["npm run jarvis:start", "Inicia OpenJarvis Bridge", "Stanford Personal AI"],
    ["npm run asno:start", "Inicia ASNO JARVIS Bridge", "WhatsApp + Home Assistant"],
    ["npm run omniroute:install", "Instala OmniRoute", "npm install omniroute"],
  ], [24, 38, 38]);
  ypad(8);
  doc.fontSize(11).fillColor(C.section).font("Helvetica-Bold").text("Integracoes Disponiveis", LM, doc.y);
  ypad(5);

  const integs = [
    ["OmniRoute Bridge", "Gateway para 290+ provedores de IA com roteamento inteligente"],
    ["n8n Bridge", "Automacao de workflows com 400+ templates prontos"],
    ["Call System Bridge", "Sistema de chamadas via Twilio com IA por voz"],
    ["OpenJarvis Bridge", "Integracao com Stanford Personal AI (JARVIS)"],
    ["ASNO Bridge", "Assistente JARVIS com WhatsApp, Home Assistant e voz"],
    ["Viseron Apps", "Ecossistema de aplicacoes integradas"],
    ["MCP Server", "Model Context Protocol para ferramentas externas"],
  ];
  integs.forEach((ig, i) => {
    checkPage(15);
    const bg = i % 2 === 0 ? C.card : C.white;
    drawCard(doc.y, 14, bg, C.lightGray, 0.3);
    textAt(" "+ig[0], LM + 4, doc.y + 1, 8, C.section, "Helvetica-Bold", { width: 130 });
    textAt(ig[1], LM + 135, doc.y + 1, 7.5, C.subtitle, "Helvetica", { width: 380 });
    doc.y += 15;
  });

  np();

  // ========== 9. BACKUP ==========
  drawHeader("9. Comandos de Backup & Manutencao");
  makeTable(["Comando", "Descricao", "Script"], [
    ["npm run backup", "Executa backup manual agora", "scripts/backup-system.ps1"],
    ["npm run backup:schedule", "Agenda backup diario (03:00)", "scripts/schedule-backup.ps1"],
  ], [22, 38, 40]);
  ypad(8);
  doc.fontSize(11).fillColor(C.section).font("Helvetica-Bold").text("Sistema de Backup Diario", LM, doc.y);
  ypad(5);
  doc.fontSize(9).fillColor(C.text).font("Helvetica");
  doc.text("O sistema de backup automatico (scripts/backup-system.ps1) cria backups completos:", LM, doc.y, { width: W });
  ypad(4);
  doc.text("  Backup completo: config/, data/, database/, src/, scripts/, agents/, packages/, mobile/, electron/, docs/", LM, doc.y, { width: W });
  ypad(3);
  doc.text("  Formato: ZIP com timestamp (YYYY-MM-DD_HHmmss.zip)", LM, doc.y, { width: W });
  ypad(3);
  doc.text("  Retencao: 30 dias (backups antigos sao removidos automaticamente)", LM, doc.y, { width: W });
  ypad(3);
  doc.text("  Agendamento: Windows Task Scheduler as 03:00 (ou manual via npm run backup)", LM, doc.y, { width: W });
  ypad(3);
  doc.text("  Inclui todos os PDFs e documentacao", LM, doc.y, { width: W });

  np();

  // ========== 10. AIOX CLI ==========
  drawHeader("10. Comandos do AIOX Core CLI");
  doc.fontSize(9.5).fillColor(C.subtitle).font("Helvetica").text("AIOX Core e a CLI oficial do ecossistema Trinnity Viseron.", LM, doc.y, { width: W });
  ypad(8);
  makeTable(["Comando", "Descricao", "Detalhes"], [
    ["aiox-core init", "Inicializa um novo projeto TVS", "Cria estrutura base"],
    ["aiox-core install", "Instala dependencias do projeto", "npm install automatico"],
    ["aiox-core status", "Mostra status do sistema TVS", "Saude e metricas"],
    ["aiox-core --help", "Ajuda completa da CLI", "Todos os comandos"],
  ], [24, 38, 38]);
  ypad(8);
  doc.fontSize(11).fillColor(C.section).font("Helvetica-Bold").text("Instalacao do AIOX Core", LM, doc.y);
  ypad(4);
  doc.fontSize(9).fillColor(C.text).font("Helvetica");
  doc.text("cd packages/aiox-core", LM, doc.y, { width: W });
  doc.text("npm install", LM, doc.y, { width: W });
  doc.text("npm link  (ou npm install -g .)", LM, doc.y, { width: W });

  np();

  // ========== 11. API REST ==========
  drawHeader("11. API REST - Endpoints Completos");
  doc.fontSize(9.5).fillColor(C.subtitle).font("Helvetica").text("A API REST do TVS permite controlar todo o sistema remotamente.", LM, doc.y, { width: W });
  ypad(8);
  doc.fontSize(11).fillColor(C.section).font("Helvetica-Bold").text("Dashboard API (Porta 3000)", LM, doc.y);
  ypad(5);
  makeTable(["Endpoint", "Descricao", "Resposta"], [
    ["GET /api/health", "Health check do sistema", "Status do servidor"],
    ["GET /api/stats", "Estatisticas completas", "Agentes, memoria, evolucao"],
    ["GET /api/agents", "Lista todos os agentes", "Array de agentes"],
    ["GET /api/status", "Status com squads", "Squads e lideres"],
    ["GET /api/battalion", "Relatorio do batalhao", "114 agentes do batalhao"],
    ["GET /api/battalion/:id", "Agente especifico", "Detalhes do agente"],
    ["GET /api/directives", "Estatisticas de diretivas", "Ativas e completadas"],
    ["POST /api/directive", "Emitir nova diretiva", "Criar missao"],
    ["POST /api/synthesize", "Sintese multi-provedor", "Ensemble de IAs"],
  ], [26, 38, 36]);

  ypad(8);
  doc.fontSize(11).fillColor(C.section).font("Helvetica-Bold").text("Report Server API (Porta 3001)", LM, doc.y);
  ypad(5);
  makeTable(["Endpoint", "Descricao", "Resposta"], [
    ["GET /", "Informacao do servidor", "Endpoints disponiveis"],
    ["GET /stats", "Estatisticas do sistema", "Agentes ativos/total"],
    ["GET /agents", "Lista compacta de agentes", "ID, nome, role, status"],
    ["GET /agents/:id", "Detalhes de um agente", "Capacidades completas"],
    ["GET /report", "Relatorio JSON completo", "Sistema + agentes + IA"],
    ["GET /report/pdf", "Download PDF do relatorio", "PDF formatado"],
    ["GET /report/comprehensive-pdf", "PDF completo do batalhao", "PDF com todos dados"],
    ["GET /superintelligence", "Status SuperIntelligence", "Nivel de inteligencia"],
    ["GET /supermind", "Nivel SuperMind", "Dominios de conhecimento"],
  ], [28, 36, 36]);

  np();

  // ========== 12. MODULOS CORE ==========
  drawHeader("12. Modulos do Core TVS");
  doc.fontSize(9.5).fillColor(C.subtitle).font("Helvetica").text("O TVS possui 22 subsistemas core no ViseronCore:", LM, doc.y, { width: W });
  ypad(8);

  makeTable(["Modulo", "Descricao", "API"], [
    ["AgentManager", "Registro e execucao de agentes", "list(), register(), run()"],
    ["ModelRouter", "Roteamento p/ melhor modelo IA", "route(criteria)"],
    ["MemoryEngine", "Memoria STM + LTM persistente", "addShortTerm(), setLongTerm()"],
    ["ToolManager", "Ferramentas externas", "createQuickTool(), executeTool()"],
    ["ProviderFactory", "Fabrica de provedores IA", "getProvider(), generate()"],
    ["SquadManager", "Gestao de squads", "addMemberToSquad(), getSquad()"],
    ["MCP Server", "Model Context Protocol", "initialize(), registerTool()"],
    ["Orchestrator", "Orquestracao multi-agente", "orchestrate(task, desc)"],
    ["CommandChain", "Cadeia: Pedro + Trinnity", "issueDirective(), ratify()"],
    ["AutoLearningEngine", "Aprendizado a cada 30 min", "startLearningCycle()"],
    ["HyperLearningEngine", "Inteligencia x6 a cada 30 min", "start(interval)"],
    ["AutonomousPlanner", "Planejamento autonomo", "plan(objective)"],
    ["AutoEvolutionEngine", "Evolucao genetica", "evolveAll(), crossPollinate()"],
    ["SuperMind", "500 anos conhecimento", "synthesize(prompt, domains)"],
    ["SuperIntelligence", "1000%+ sobre IA individual", "synthesize(input)"],
    ["AIProviderBridge", "Ponte 290+ provedores", "chat(request), ensemble()"],
    ["AppScaffolder", "Geracao de aplicacoes", "scaffold(config)"],
    ["WebAppGenerator", "Geracao de websites", "generateCryptoSite()"],
    ["TokenEngine", "Tokens e contratos", "generateToken(), deployToken()"],
    ["BusinessSolutionEngine", "Solucoes empresariais", "solve(problem)"],
    ["AgentSpawner", "Spawn 5000+ mentes", "loadMinds(), spawnAll()"],
    ["AgentFactory", "Fabrica de agentes", "createAgent(spec)"],
    ["AgentCollaborator", "Colaboracao entre agentes", "collaborate(task, agents)"],
  ], [18, 40, 42]);

  np();

  // ========== 13. PROVEDORES IA ==========
  drawHeader("13. Provedores de IA Suportados");
  doc.fontSize(9.5).fillColor(C.subtitle).font("Helvetica").text("O TVS suporta 8+ provedores diretamente e 290+ via OmniRoute Bridge.", LM, doc.y, { width: W });
  ypad(8);

  makeTable(["Provedor", "Modelos", "Custo/1K", "Contexto", "Diferencial", "Req."], [
    ["Ollama (Local)", "Llama 3, Qwen 2, Mistral", "0", "8K-32K", "Offline, zero", "Padrao"],
    ["OpenAI", "GPT-4o, GPT-4o-mini, o1", "$0.002-15", "128K-200K", "Estado da arte", "Key"],
    ["Anthropic", "Claude Sonnet 4, Opus 4", "$0.003-15", "200K", "Seguranca", "Key"],
    ["Google", "Gemini 2.5 Flash/Pro", "$0.00015-1", "1M+", "Multimodal", "Key"],
    ["xAI", "Grok 3", "$0.002", "131K", "Dados tempo real", "Key"],
    ["DeepSeek", "DeepSeek Chat", "$0.0005", "128K", "Open-weight", "Key"],
    ["Mistral", "Mistral Large/Small", "$0.001-2", "32K-128K", "Eficiente EU", "Key"],
    ["Cohere", "Command A", "$0.0015", "128K", "RAG-optimizado", "Key"],
    ["HuggingFace", "Llama 3.3 70B, Mixtral", "$0.0004", "8K-65K", "Open-source", "Key"],
    ["Together AI", "Llama 3.3 70B Turbo", "$0.0005", "8K", "Inferencia rapida", "Key"],
    ["Perplexity", "Sonar Pro", "$0.001", "128K", "Pesquisa online", "Key"],
    ["OmniRoute", "290+ modelos agregados", "Variado", "Variado", "Gateway", "Config"],
  ], [16, 26, 14, 14, 22, 8]);

  ypad(10);
  doc.fontSize(11).fillColor(C.section).font("Helvetica-Bold").text("Estrategias de Roteamento", LM, doc.y);
  ypad(5);
  doc.fontSize(9).fillColor(C.text).font("Helvetica");
  doc.text("  single: Usa um unico provedor (default: Ollama)", LM, doc.y, { width: W });
  doc.text("  compare: Compara respostas de multiplos modelos", LM, doc.y, { width: W });
  doc.text("  ensemble: Agrega respostas de todos os provedores disponiveis", LM, doc.y, { width: W });
  doc.text("  fallback: Se um falha, proximo da lista e usado automaticamente", LM, doc.y, { width: W });
  doc.text("  local-first: Tenta Ollama primeiro, depois cloud", LM, doc.y, { width: W });

  np();

  // ========== 14. TOKENS ==========
  drawHeader("14. Tokens: $VSR e $TRIN");
  doc.fontSize(13).fillColor(C.gold).font("Helvetica-Bold").text("$VSR  Viseron Crown (Token de Governanca)", LM, doc.y);
  ypad(5);
  doc.fontSize(9.5).fillColor(C.text).font("Helvetica");
  doc.text("Supply: 300,000,000 VSR", LM, doc.y, { width: W });
  doc.text("Standard: TVS Standard v1.0.0", LM, doc.y, { width: W });
  doc.text("Funcao: Governanca do sistema, voto em evolucoes, diretivas", LM, doc.y, { width: W });
  ypad(4);
  doc.text("Distribuicao:", LM, doc.y, { width: W });
  doc.text("  Trinnity Hurtado (Tesouro Corona): 90M VSR (30%)", LM, doc.y, { width: W });
  doc.text("  Pedro Costa (Tesouro Hierro): 75M VSR (25%)", LM, doc.y, { width: W });
  doc.text("  TVS Legion (Pool de Agentes): 90M VSR (30%)", LM, doc.y, { width: W });
  doc.text("  Reserva Estrategica: 45M VSR (15%)", LM, doc.y, { width: W });
  ypad(8);

  doc.fontSize(13).fillColor(C.accent).font("Helvetica-Bold").text("$TRIN  Trinnity (Token de Utilidade)", LM, doc.y);
  ypad(5);
  doc.fontSize(9.5).fillColor(C.text).font("Helvetica");
  doc.text("Supply: Dinamico (cunhado/queimado por atividade)", LM, doc.y, { width: W });
  doc.text("Funcao: Gas para execucao de agentes, creditos de computacao, taxas", LM, doc.y, { width: W });
  doc.text("Rede: Ethereum (ERC-20)", LM, doc.y, { width: W });
  ypad(4);
  doc.text("Tokenomics:", LM, doc.y, { width: W });
  doc.text("  Distribuicao: Team 10%, Marketing 15%, Liquidity 20%,", LM, doc.y, { width: W });
  doc.text("  Development 10%, Staking 25%, Community 20%", LM, doc.y, { width: W });
  doc.text("  Inflacao: 2% anual | Deflacao: 1% queimado por transacao", LM, doc.y, { width: W });

  np();

  // ========== 15. SOLUCOES ==========
  drawHeader("15. Solucoes que Oferecemos ao Mundo");
  doc.fontSize(10).fillColor(C.text).font("Helvetica");
  doc.text("O Trinnity Viseron System nao e apenas um software e uma plataforma completa de superinteligencia que resolve problemas reais em escala global.", LM, doc.y, { align: "justify", width: W });
  ypad(8);

  const sols = [
    ["Superinteligencia Multi-Agente", "5.112 agentes autonomos em paralelo, cada um especializado em um dominio, permitindo analise multidimensional de qualquer desafio."],
    ["Gateway Universal de IA (OmniRoute)", "Acesso a 290+ provedores de IA via unica API. Roteamento inteligente, fallback automatico e otimizacao de custos."],
    ["Geracao Multi-Plataforma", "Criacao automatica de apps web, mobile (APK + IPA), desktop (Win/Mac/Linux) e Docker a partir de descricao natural."],
    ["Tokenomics Inteligente", "Geracao completa de tokens ERC-20 com contratos Solidity, staking pools, governanca on-chain e distribuicao automatica."],
    ["Solucoes Empresariais", "De planos de negocios a implementacao completa. Arquiteturas, codigo, documentacao e estrategias de mercado."],
    ["Integracao Total", "n8n (automacao), Twilio (voz/SMS), Home Assistant (smart home), JARVIS (assistente), MCP (ferramentas externas)."],
    ["Auto-Evolucao Continua", "O sistema evolui sozinho a cada 30 min. Inteligencia cresce +500% por ciclo. Agentes desenvolvem novas capacidades."],
    ["Seguranca e Soberania", "Operacao 100% offline com Ollama. Dados nunca saem do seu ambiente. Ideal para governos e defesa."],
  ];

  sols.forEach((s) => {
    checkPage(40);
    const sy = doc.y;
    drawCard(sy, 36, C.card, C.accent, 0.5);
    textAt("  "+s[0], LM + 6, sy + 3, 9, C.section, "Helvetica-Bold");
    textAt("  "+s[1], LM + 6, sy + 16, 8, C.text, "Helvetica", { width: W - 20 });
    doc.y = sy + 38;
  });

  np();

  // ========== 16. MODELO ASSINATURA ==========
  drawHeader("16. Modelo de Assinatura  Por que Pagar?");
  doc.fontSize(10).fillColor(C.text).font("Helvetica");
  doc.text("O TVS e um sistema operacional de superinteligencia que substitui dezenas de ferramentas, servicos e equipes.", LM, doc.y, { align: "justify", width: W });
  ypad(8);

  checkPage(125);
  const c1y = doc.y;
  drawCard(c1y, 118, C.darkBg, C.gold, 2);
  textAt(" O QUE VOCE RECEBE", LM + 10, c1y + 6, 13, C.gold, "Helvetica-Bold");
  const perks = [
    "5.112 Agentes de IA trabalhando 24/7 para voce",
    "Acesso a 290+ modelos de IA (GPT-4o, Claude, Gemini, Grok)",
    "Geracao ilimitada de aplicacoes (web, mobile, desktop)",
    "Criacao de tokens e contratos inteligentes",
    "Automacao via n8n com 400+ templates",
    "Sistema de chamadas com IA via Twilio",
    "Memoria de longo prazo e auto-evolucao",
    "Suporte prioritario da equipe TVS",
    "Execucao local (offline) ou cloud",
  ];
  let pY = c1y + 24;
  perks.forEach(p => { textAt("  "+p, LM + 10, pY, 8, C.white, "Helvetica"); pY += 12; });
  doc.y = pY + 5;

  ypad(8);
  doc.fontSize(13).fillColor(C.section).font("Helvetica-Bold").text("POR QUE NAO E GRATUITO?", LM, doc.y);
  ypad(6);

  const reasons = [
    ["Infraestrutura de IA", "Cada requisicao a modelos como GPT-4o, Claude Opus ou Gemini Pro tem custo real por token."],
    ["Manutencao Continua", "5.112 agentes, 22 modulos core, 6 bridges requerem atualizacao e suporte continuos."],
    ["Desenvolvimento Constante", "Novas funcionalidades, mais provedores, melhor performance. P&D continuo."],
    ["Infraestrutura de Servidores", "Dashboard, API, n8n, Qdrant DB multiplos servicos rodando 24/7."],
    ["Suporte e Documentacao", "Equipe dedicada para suporte tecnico, documentacao e tutoriais."],
    ["Economia de Escala", "Por $29-99/mes voce substitui: 10+ devs, 5+ assinaturas IA, 3+ servicos cloud."],
  ];

  reasons.forEach((r, i) => {
    checkPage(20);
    const ry = doc.y;
    const bg = i % 2 === 0 ? C.card : C.white;
    drawCard(ry, 18, bg, C.lightGray, 0.3);
    textAt(" "+r[0], LM + 6, ry + 1, 9, C.section, "Helvetica-Bold", { width: 140 });
    textAt(r[1], LM + 150, ry + 1, 8, C.subtitle, "Helvetica", { width: 370 });
    doc.y = ry + 20;
  });

  np();

  // ========== 17. PLANOS ==========
  drawHeader("17. Planos e Precos");

  const plans = [
    {
      title: "DEVELOPER", price: "$29/mes", bg: C.card, border: C.accent,
      items: [
        "Acesso a 5.112 agentes de IA",
        "10 requisicoes/minuto a API",
        "Modelos locais (Ollama) + GPT-4o-mini",
        "Geracao de apps web e mobile",
        "Dashboard web e API REST",
        "Backup diario automatico",
        "1 projeto",
        "Comunidade Discord",
      ]
    },
    {
      title: "PROFESSIONAL (RECOMENDADO)", price: "$99/mes", bg: C.darkBg, border: C.gold, textC: C.white, sub: C.lightGray,
      items: [
        "Tudo do Developer, mais:",
        "100 requisicoes/minuto a API",
        "Todos modelos cloud (GPT-4o, Claude, Gemini, Grok)",
        "Ensemble multi-provedor (8 IAs simultaneas)",
        "OmniRoute Gateway (290+ provedores)",
        "Tokens ERC-20 + contratos Solidity",
        "Integracao n8n + Twilio + JARVIS",
        "5 projetos + Suporte 24/7",
      ]
    },
    {
      title: "ENTERPRISE", price: "$499/mes", bg: C.card, border: C.accent2,
      items: [
        "Tudo do Professional, mais:",
        "Requisicoes ilimitadas a API",
        "Deploy dedicado (Railway / Docker / On-premise)",
        "White label do sistema",
        "Consultoria personalizada",
        "SLA 99.9%",
        "Projetos ilimitados",
        "Gerente de conta dedicado",
      ]
    },
  ];

  plans.forEach((pl) => {
    const nh = 28 + pl.items.length * 13;
    checkPage(nh + 10);
    const py = doc.y;
    drawCard(py, nh, pl.bg, pl.border, 1.5);
    const tc = pl.textC || C.section;
    const sc = pl.sub || C.text;
    textAt(" "+pl.title, LM + 10, py + 5, 12, tc, "Helvetica-Bold");
    textAt(" "+pl.price, LM + 10, py + 20, 11, pl.border === C.gold ? C.gold : C.accent, "Helvetica-Bold");
    let liY = py + 36;
    pl.items.forEach(it => {
      textAt("  "+it, LM + 10, liY, 8, sc, "Helvetica");
      liY += 13;
    });
    doc.y = py + nh + 8;
  });

  np();

  // ========== 18. SQUADS ==========
  drawHeader("18. Squads AIOX, Pedro & Trinnity");
  doc.fontSize(10).fillColor(C.text).font("Helvetica");
  doc.text("Lideranca maxima de Pedro Costa (Comandante Supremo) e Trinnity Hurtado (Reina Arquitecta).", LM, doc.y, { width: W });
  ypad(8);

  checkPage(60);
  const spY = doc.y;
  drawCard(spY, 55, C.darkBg, C.green, 1.5);
  textAt(" PEDRO COSTA  Comandante Supremo", LM + 8, spY + 4, 12, C.green, "Helvetica-Bold");
  textAt(" Estrategia: EXPANSAO  Squads: AIOX Core, Expansion Force, Deployment Squad", LM + 8, spY + 22, 8, C.lightGray, "Helvetica");
  textAt(" Funcao: Orquestrar deploy, infraestrutura, crescimento e operacoes do sistema", LM + 8, spY + 34, 8, C.lightGray, "Helvetica");
  textAt(" Cor: #00ff88  Prioridade: Maxima  Status: Ativo", LM + 8, spY + 46, 8, C.lightGray, "Helvetica");
  doc.y = spY + 60;

  checkPage(60);
  const stY = doc.y;
  drawCard(stY, 55, C.darkBg, C.accent2, 1.5);
  textAt(" TRINNITY HURTADO  Reina Arquitecta", LM + 8, stY + 4, 12, C.accent2, "Helvetica-Bold");
  textAt(" Estrategia: EVOLUCAO  Squads: AIOX Core, Evolution Lab, Intelligence Squad", LM + 8, stY + 22, 8, C.lightGray, "Helvetica");
  textAt(" Funcao: Evolucao da IA, hyper-learning, sintese de conhecimento", LM + 8, stY + 34, 8, C.lightGray, "Helvetica");
  textAt(" Cor: #ff00ff  Prioridade: Maxima  Status: Ativo", LM + 8, stY + 46, 8, C.lightGray, "Helvetica");
  doc.y = stY + 60;

  ypad(4);
  doc.fontSize(11).fillColor(C.section).font("Helvetica-Bold").text("Squads do Sistema", LM, doc.y);
  ypad(5);

  const sqds = [
    ["AIOX CORE SQUAD", "Pedro Costa + Trinnity Hurtado", "Orchestrator, Planner, Evolution Engine, Hyper Learner, Memory Keeper, Provider Router, App Builder", "Squad principal do nucleo do sistema operacional de IA."],
    ["EXPANSION FORCE", "Pedro Costa", "Deploy Master, Backup Guardian, System Monitor", "Deploy, infraestrutura, backup e monitoramento."],
    ["EVOLUTION LAB", "Trinnity Hurtado", "AI Researcher, Tokenomics Engineer, SuperMind Synthesizer", "Pesquisa e evolucao continua da IA."],
    ["DEPLOYMENT SQUAD", "Pedro Costa", "Web Deployer, Mobile Builder, Desktop Packager, Docker Captain", "Build e publicacao em todas as plataformas."],
    ["INTELLIGENCE SQUAD", "Trinnity Hurtado", "Voice Commander, OmniRoute Navigator, n8n Automator, Call System Operator, JARVIS Bridge", "Integracoes de voz, automacao e gateways."],
  ];

  sqds.forEach((sq) => {
    checkPage(50);
    const sqY = doc.y;
    drawCard(sqY, 46, C.card, C.accent, 0.5);
    textAt(" "+sq[0], LM + 6, sqY + 3, 9, C.section, "Helvetica-Bold");
    textAt(" Lider: "+sq[1], LM + 6, sqY + 16, 7.5, C.subtitle, "Helvetica");
    textAt(" Agentes: "+sq[2], LM + 6, sqY + 26, 7.5, C.subtitle, "Helvetica", { width: W - 15 });
    textAt(" Missao: "+sq[3], LM + 6, sqY + 36, 7.5, C.subtitle, "Helvetica", { width: W - 15 });
    doc.y = sqY + 48;
  });

  np();

  // ========== 19. GLOSSARIO ==========
  drawHeader("19. Glossario de Comandos Rapidos");
  doc.fontSize(9.5).fillColor(C.subtitle).font("Helvetica").text("Resumo executivo dos comandos mais importantes.", LM, doc.y, { width: W });
  ypad(8);

  makeTable(["Categoria", "Comando", "Descricao"], [
    ["INICIAR", "npm run dev", "Modo desenvolvimento com hot-reload"],
    ["INICIAR", "npm start", "Modo producao"],
    ["INICIAR", "npm run init:full", "Build + Backup + Start completo"],
    ["BUILD", "npm run build", "Compilar TypeScript"],
    ["BUILD", "npm run lint", "Verificar erros TS"],
    ["MOBILE", "npm run build:android", "Gerar APK Android"],
    ["MOBILE", "npm run build:ios", "Gerar IPA iOS"],
    ["DESKTOP", "npm run build:exe", "Gerar .exe Windows"],
    ["DESKTOP", "npm run build:electron", "Build Electron"],
    ["DEPLOY", "npm run deploy:full", "GitHub + Vercel completo"],
    ["DEPLOY", "npm run deploy:github", "Push GitHub"],
    ["DEPLOY", "npm run deploy:vercel", "Deploy Vercel"],
    ["BACKUP", "npm run backup", "Backup manual imediato"],
    ["BACKUP", "npm run backup:schedule", "Agendar backup 03:00"],
    ["INTEGRACOES", "npm run omniroute:start", "Gateway 290+ IAs"],
    ["INTEGRACOES", "npm run call:start", "Call System Twilio"],
    ["INTEGRACOES", "npm run jarvis:start", "OpenJarvis Bridge"],
    ["INTEGRACOES", "npm run asno:start", "ASNO JARVIS"],
    ["TESTES", "npm test", "Testes core do sistema"],
    ["TESTES", "npm run test:hyper", "Testes hyperlearning"],
    ["RELATORIOS", "http://localhost:3000", "Dashboard web"],
    ["RELATORIOS", "http://localhost:3001/report/pdf", "PDF do sistema"],
  ], [14, 28, 58]);

  ypad(12);

  checkPage(90);
  const fy = doc.y;
  drawCard(fy, 78, C.darkBg, C.gold, 1.5);
  textAt(" TRINNITY VISERON SYSTEM v5.0", LM + 8, fy + 6, 12, C.gold, "Helvetica-Bold");
  textAt(" \"Construindo o futuro da inteligencia artificial  uma mente de cada vez.\"", LM + 8, fy + 24, 9, C.lightGray, "Helvetica");
  textAt(" Pedro Costa  Comandante Supremo", LM + 8, fy + 42, 9, C.lightGray, "Helvetica");
  textAt(" Trinnity Hurtado  Reina Arquitecta", LM + 8, fy + 54, 9, C.lightGray, "Helvetica");
  textAt(" https://github.com/ViseronSystem/trinnity-viseron-system", LM + 8, fy + 66, 8, C.lightGray, "Helvetica");
  doc.y = fy + 84;

  // ========== PAGINA FINAL ==========
  np();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.darkBg);
  textAt("OBRIGADO", LM, 200, 34, C.accent, "Helvetica-Bold", { align: "center" });
  textAt("Trinnity Viseron System  Sempre em Evolucao", LM, 240, 15, C.white, "Helvetica", { align: "center" });
  drawLine(200, 265, 395, 265, C.gold, 0.5);
  textAt("$VSR  $TRIN  AIOX", LM, 275, 11, C.gold, "Helvetica", { align: "center" });
  textAt("Este manual foi gerado automaticamente pelo TVS v5.0", LM, 310, 9, C.subtitle, "Helvetica", { align: "center" });
  textAt(new Date().toLocaleDateString('pt-BR'), LM, 325, 9, C.subtitle, "Helvetica", { align: "center" });

  // Footer em todas as paginas
  // (Doc não suporta multi-page footer facilmente, colocaremos ao final de cada pagina no loop de np)

  doc.end();
  await new Promise((resolve) => stream.on("finish", resolve));
  console.log(`[PDF] Manual completo gerado: ${outputPath}`);
}

// Executar
generateManual(path.join(__dirname, "..", "docs", "pdfs", "manuals", "TVS_Manual_Completo.pdf")).catch(console.error);
