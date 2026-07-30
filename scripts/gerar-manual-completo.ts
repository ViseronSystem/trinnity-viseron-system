import PDFDocument from "pdfkit";
import * as fs from "fs-extra";
import * as path from "path";

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function createColor(...args: number[]): string {
  return `rgb(${args.join(",")})`;
}

const COR = {
  darkBg: createColor(10, 10, 46),
  mediumBg: createColor(20, 20, 60),
  accent: createColor(0, 245, 255),
  accent2: createColor(255, 0, 255),
  gold: createColor(255, 215, 0),
  green: createColor(0, 255, 136),
  white: createColor(255, 255, 255),
  lightGray: createColor(200, 200, 200),
  text: createColor(50, 50, 50),
  subtitle: createColor(100, 100, 100),
  section: createColor(10, 10, 46),
  tableHead: createColor(10, 10, 46),
  tableAlt: createColor(240, 245, 255),
  card: createColor(245, 248, 255),
};

const COLORS = COR;

function addFooter(doc: any, pageNum: number) {
  doc.save();
  doc.fontSize(8).fillColor(COLORS.subtitle);
  doc.text(`Trinnity Viseron System v5.0 — Manual Completo`, 45, doc.page.height - 30, { align: "center" });
  doc.text(`Página ${pageNum}`, doc.page.width - 80, doc.page.height - 30);
  doc.restore();
}

async function generateManual(outputPath: string) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 45, bottom: 45, left: 45, right: 45 },
    info: {
      Title: "Trinnity Viseron System - Manual Completo de Comandos y Soluciones",
      Author: "Trinnity Viseron System v5.0 - Pedro Costa & Trinnity Hurtado",
      Subject: "Sistema Multi-Agente de Superinteligencia Artificial",
    },
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);
  let pageNum = 1;

  // ================================================================
  // CAPA
  // ================================================================
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.darkBg);

  doc.fillColor(COLORS.accent).fontSize(54).font("Helvetica-Bold");
  doc.text("TRINNITY", 45, 140, { align: "center" });
  doc.fillColor(COLORS.white).fontSize(48).text("VISERON SYSTEM", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(20).fillColor(COLORS.accent2).text("v5.0 MULTIVERSAL", { align: "center" });
  doc.moveDown(2);

  doc.fontSize(14).fillColor(COLORS.lightGray).text("Sistema Operativo Multi-Agente de Superinteligencia Artificial", { align: "center" });
  doc.text("5.112 Mentes Autónomas • 25 Sectores Estratégicos • 290+ Proveedores IA", { align: "center" });
  doc.moveDown(3);

  doc.fontSize(12).fillColor(COLORS.gold);
  doc.text("Comandante Supremo: Pedro Costa • Reina Arquitecta: Trinnity Hurtado", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor(COLORS.subtitle).text("Tokens: $VSR (300M) • $TRIN • AIOX Core Squad", { align: "center" });
  doc.moveDown(0.5);
  doc.text("https://github.com/ViseronSystem/trinnity-viseron-system", { align: "center" });

  // Linha decorativa
  doc.moveTo(100, doc.page.height - 100).lineTo(doc.page.width - 100, doc.page.height - 100).strokeColor(COLORS.accent).lineWidth(1).stroke();

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // INDICE
  // ================================================================
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.darkBg);
  doc.fillColor(COLORS.white).fontSize(28).font("Helvetica-Bold").text("ÍNDICE", { align: "center" });
  doc.moveDown(2);

  const toc = [
    ["1", "O que é Trinnity Viseron System?", "3"],
    ["2", "Arquitetura do Sistema", "4"],
    ["3", "Comandos de Inicialização", "5"],
    ["4", "Comandos de Build & Compilação", "6"],
    ["5", "Comandos de Deploy & Publicação", "7"],
    ["6", "Comandos de Mobile (Android/iOS)", "8"],
    ["7", "Comandos de Desktop (Electron/Standalone)", "9"],
    ["8", "Comandos de Integrações", "10"],
    ["9", "Comandos de Backup & Manutenção", "11"],
    ["10", "Comandos do AIOX Core CLI", "12"],
    ["11", "API REST - Endpoints Completos", "13"],
    ["12", "Módulos do Core TVS", "14"],
    ["13", "Provedores de IA Suportados", "15"],
    ["14", "Tokens: $VSR e $TRIN", "16"],
    ["15", "Soluções para o Mundo", "17"],
    ["16", "Modelo de Assinatura - Por que Pagar?", "18"],
    ["17", "Planos e Preços", "19"],
    ["18", "Squads AIOX, Pedro & Trinnity", "20"],
    ["19", "Glossário de Comandos Rápidos", "21"],
  ];

  toc.forEach(([num, title, page]) => {
    doc.fillColor(COLORS.accent).fontSize(11).font("Helvetica-Bold").text(`  ${num}.`, { continued: false });
    doc.fillColor(COLORS.white).font("Helvetica").text(`    ${title}`, { indent: 20 });
  });

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 1. O QUE É TRINNITY VISERON SYSTEM?
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold");
  doc.text("1. O que é Trinnity Viseron System?", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(11).font("Helvetica");
  doc.text("Trinnity Viseron System (TVS) é um Sistema Operativo Multi-Agente de Superinteligência Artificial — uma plataforma autônoma que orquestra milhares de mentes artificiais para resolver problemas complexos, gerar código, criar aplicações, gerenciar tokens, automatizar fluxos de trabalho e muito mais.", { align: "justify" });
  doc.moveDown(0.5);

  doc.text("Liderado pelo Comandante Supremo Pedro Costa e pela Reina Arquitecta Trinnity Hurtado, o TVS opera com 5.112 agentes autônomos divididos em 25 setores estratégicos — desde aeroespacial e defesa até saúde, finanças e educação.", { align: "justify" });
  doc.moveDown(0.5);

  doc.text("O sistema foi construído em TypeScript/Node.js e funciona com 290+ provedores de IA (incluindo modelos locais via Ollama para operação offline completa). Gera tokens ERC-20, compila aplicações móveis Android/iOS, cria executáveis desktop, e se auto-evolui a cada 30 minutos com incrementos de +500% de inteligência.", { align: "justify" });
  doc.moveDown(1);

  // Card de Destaque
  doc.rect(50, doc.y, doc.page.width - 100, 80).fillColor(COLORS.card).strokeColor(COLORS.accent).lineWidth(1).stroke();
  doc.fillColor(COLORS.section).fontSize(12).font("Helvetica-Bold").text("  DADOS PRINCIPAIS", 60, doc.y - 65);
  doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");
  doc.text("  • 5.112 Agentes Autônomos (4.742 mentes históricas + 246 arquétipos + 114 batalhão + ~10 core)", 60);
  doc.text("  • 25 Setores Estratégicos de atuação", 60);
  doc.text("  • 290+ Provedores de IA via OmniRoute Bridge", 60);
  doc.text("  • Auto-Evolução: +500% de inteligência a cada 30 minutos", 60);
  doc.text("  • Tokens: $VSR (300M supply) e $TRIN (utilidade)", 60);
  doc.text("  • Deploy multiplataforma: Web, Mobile (Android/iOS), Desktop (Windows/Mac/Linux)", 60);

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 2. ARQUITETURA DO SISTEMA
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("2. Arquitetura do Sistema", { underline: true });
  doc.moveDown(1);

  const modules = [
    ["ViseronCore", "Motor principal que orquestra todos os componentes do sistema"],
    ["Orchestrator", "Coordena tarefas multi-agente com decomposição automática de subtarefas"],
    ["AgentManager", "Gerencia ciclo de vida de todos os agentes (registro, execução, status)"],
    ["ModelRouter", "Roteia requisições para o modelo de IA ótimo entre 8+ provedores"],
    ["MemoryEngine", "Memória de curto prazo (100 itens/sessão) e longo prazo (persistente em JSON)"],
    ["ProviderFactory", "Fábrica de provedores: Ollama, OpenAI, Claude, Gemini, Grok, OmniRoute"],
    ["AIProviderBridge", "Ponte para 290+ provedores com fallback automático e ensemble"],
    ["SuperIntelligence", "Síntese multi-provedor com ensemble reasoning (8 IAs simultâneas)"],
    ["SuperMind", "Agregação de conhecimento entre todos os domínios e agentes"],
    ["AutoLearningEngine", "Ciclos de auto-aprendizado a cada 30 minutos sem intervenção humana"],
    ["HyperLearningEngine", "Aprendizado acelerado: inteligência cresce 500% a cada ciclo (x6)"],
    ["AutoEvolutionEngine", "Agentes evoluem capacidades autonomamente via algoritmos genéticos"],
    ["AgentSpawner", "Carrega 4.742 mentes históricas como agentes executáveis"],
    ["CommandChain", "Cadeia de comando hierárquica com linhagem e assinatura dupla"],
    ["SquadManager", "Gerencia squads de agentes para missões específicas"],
    ["ToolManager", "Cria e executa ferramentas externas (APIs, webhooks, MCP)"],
    ["AppScaffolder", "Gera aplicações full-stack completas a partir de descrições em linguagem natural"],
    ["BusinessSolutionEngine", "Gera soluções empresariais completas (plano + arquitetura + implementação)"],
    ["TokenEngine", "Gera tokens ERC-20 ($TRIN, $VSR) com tokenomics completas e contratos Solidity"],
    ["WebAppGenerator", "Gera websites e landing pages automaticamente"],
    ["MCP Server", "Servidor Model Context Protocol para integração com ferramentas externas"],
    ["ReportServer", "Relatórios completos em JSON e PDF com estatísticas do sistema"],
    ["VoiceBridge", "Bridge de voz JARVIS com síntese de fala e comandos de voz"],
  ];

  modules.forEach(([name, desc], i) => {
    const bg = i % 2 === 0 ? COLORS.card : COLORS.white;
    doc.rect(45, doc.y, doc.page.width - 90, 22).fillColor(bg).strokeColor(COLORS.lightGray).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.section).fontSize(9).font("Helvetica-Bold").text(`  ${name}`, 50, doc.y - 17);
    doc.fillColor(COLORS.subtitle).fontSize(8).font("Helvetica").text(`  ${desc}`, 170, doc.y - 17);
  });

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 3. COMANDOS DE INICIALIZAÇÃO
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("3. Comandos de Inicialização", { underline: true });
  doc.moveDown(1);
  doc.fillColor(COLORS.subtitle).fontSize(10).font("Helvetica").text("Comandos para iniciar, testar e verificar o sistema.", { align: "justify" });
  doc.moveDown(1);

  const initCmds = [
    ["npm start", "Inicia o sistema TVS (produção)", "node dist/src/index.js"],
    ["npm run dev", "Modo desenvolvimento com hot-reload", "nodemon --exec tsx src/index.ts"],
    ["npm run super:start", "Inicia com superinteligência ativada", "tsx src/index.ts"],
    ["npm run launch", "Executa o script de lançamento do mercado", "tsx src/launch/market.ts"],
    ["npm run setup", "Instala dependências do root e mobile", "npm install && cd mobile && npm install"],
    ["npm run init", "Executa script de inicialização", "scripts/init-system.ps1"],
    ["npm run init:full", "Build + Backup + Start (ciclo completo)", "scripts/init-system.ps1 -Full"],
  ];

  drawTable(doc, ["Comando", "Descrição", "Ação"], initCmds, [34, 50, 34]);
  doc.moveDown(1);

  doc.fontSize(12).fillColor(COLORS.section).font("Helvetica-Bold").text("Script init-system.ps1");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.subtitle).fontSize(9).font("Helvetica");
  doc.text("  Uso: ./scripts/init-system.ps1 [parâmetros]");
  doc.text("    -Build      : Compila TypeScript");
  doc.text("    -Start      : Inicia o sistema");
  doc.text("    -Backup     : Executa backup diário");
  doc.text("    -Full       : Build + Backup + Start (ciclo completo)");

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 4. COMANDOS DE BUILD & COMPILAÇÃO
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("4. Comandos de Build & Compilação", { underline: true });
  doc.moveDown(1);

  const buildCmds = [
    ["npm run build", "Compila TypeScript para dist/", "tsc + copia assets"],
    ["npm run lint", "Verifica erros de TypeScript", "tsc --noEmit"],
    ["npm test", "Executa testes core", "tsx tests/core.test.ts"],
    ["npm run test:hyper", "Executa testes hyperlearning", "tsx tests/hyperbrain.test.ts"],
  ];

  drawTable(doc, ["Comando", "Descrição", "Ação"], buildCmds, [28, 50, 40]);
  doc.moveDown(1);

  doc.fontSize(12).fillColor(COLORS.section).font("Helvetica-Bold").text("Build do AIOX Core CLI");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.subtitle).fontSize(9).font("Helvetica");
  doc.text("  cd packages/aiox-core && npm run build");

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 5. COMANDOS DE DEPLOY
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("5. Comandos de Deploy & Publicação", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(10).font("Helvetica").text("Comandos para publicar o sistema em todas as plataformas.", { align: "justify" });
  doc.moveDown(1);

  const deployCmds = [
    ["npm run deploy", "Deploy script manual", "scripts/deploy-all.ps1"],
    ["npm run deploy:full", "Build + Backup + GitHub + Vercel", "scripts/deploy-all.ps1 -Full"],
    ["npm run deploy:github", "Push para GitHub apenas", "scripts/deploy-all.ps1 -GitHub"],
    ["npm run deploy:vercel", "Deploy landing page para Vercel", "scripts/deploy-all.ps1 -Vercel"],
  ];

  drawTable(doc, ["Comando", "Descrição", "Ação"], deployCmds, [28, 50, 40]);
  doc.moveDown(1.5);

  doc.fontSize(12).fillColor(COLORS.section).font("Helvetica-Bold").text("Plataformas de Deploy");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");
  doc.text("  • GitHub    : https://github.com/ViseronSystem/trinnity-viseron-system");
  doc.text("  • Vercel    : https://trinnityviseron.com (Landing Page)");
  doc.text("  • Railway   : Backend TVS Core (configurado em railway.json)");
  doc.text("  • Docker    : docker-compose up (TVS + Ollama + Qdrant + n8n)");

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 6. COMANDOS MOBILE
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("6. Comandos Mobile (Android & iOS)", { underline: true });
  doc.moveDown(1);

  const mobileCmds = [
    ["npm run build:android", "Build APK para Android", "build-all.ps1 -Target android"],
    ["npm run build:ios", "Build IPA para iOS (macOS)", "build-all.ps1 -Target ios"],
    ["npm run build:all", "Build Android + iOS", "build-all.ps1 -Target all"],
    ["npm run build:eas-android", "Build via EAS (Expo)", "build-all.ps1 -Target eas-android"],
    ["npm run build:eas-ios", "Build iOS via EAS (Expo)", "build-all.ps1 -Target eas-ios"],
    ["npm run mobile:start", "Iniciar Expo dev server", "cd mobile && npx expo start"],
    ["npm run mobile:android", "Run Android direct", "cd mobile && npx expo run:android"],
    ["npm run mobile:ios", "Run iOS direct", "cd mobile && npx expo run:ios"],
  ];

  drawTable(doc, ["Comando", "Descrição", "Ação"], mobileCmds, [30, 44, 44]);
  doc.moveDown(1.5);

  doc.fontSize(11).fillColor(COLORS.section).font("Helvetica-Bold").text("Estrutura do App Mobile");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");
  doc.text("  Framework: Expo SDK 52 + React Native 0.76.9");
  doc.text("  Telas: Dashboard, Agents, Terminal (navegação por abas)");
  doc.text("  Conexão: Socket.IO + REST API para o backend TVS");
  doc.text("  Build: EAS Build (expo.dev) para APK e IPA");

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 7. COMANDOS DESKTOP
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("7. Comandos Desktop (Electron & Standalone)", { underline: true });
  doc.moveDown(1);

  const desktopCmds = [
    ["npm run build:exe", "Build executável standalone (win)", "scripts/build-standalone.mjs"],
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
  ];

  drawTable(doc, ["Comando", "Descrição", "Detalhes"], desktopCmds, [34, 44, 40]);
  doc.moveDown(1.5);

  doc.fontSize(11).fillColor(COLORS.section).font("Helvetica-Bold").text("Saída dos Builds");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");
  doc.text("  • Standalone: .build/tvs-standalone/tvs-viseron-win.exe");
  doc.text("  • Portable: .build/TVS_Viseron_Portable.zip");
  doc.text("  • Electron: electron/dist-electron/ (configurável)");

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 8. INTEGRAÇÕES
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("8. Comandos de Integrações", { underline: true });
  doc.moveDown(1);

  const integCmds = [
    ["npm run omniroute:start", "Inicia OmniRoute AI Gateway", "Porta 20128, 290+ providers"],
    ["npm run call:start", "Inicia Call System (Twilio)", "Voz + SMS com IA"],
    ["npm run jarvis:start", "Inicia OpenJarvis Bridge", "Stanford Personal AI"],
    ["npm run asno:start", "Inicia ASNO JARVIS Bridge", "WhatsApp + Home Assistant"],
    ["npm run omniroute:install", "Instala OmniRoute", "npm install omniroute"],
  ];

  drawTable(doc, ["Comando", "Descrição", "Detalhes"], integCmds, [30, 44, 44]);
  doc.moveDown(1.5);

  doc.fontSize(11).fillColor(COLORS.section).font("Helvetica-Bold").text("Integrações Disponíveis");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");

  const integrations = [
    ["OmniRoute Bridge", "Gateway para 290+ provedores de IA com roteamento inteligente"],
    ["n8n Bridge", "Automação de workflows com 400+ templates prontos"],
    ["Call System Bridge", "Sistema de chamadas via Twilio com IA por voz"],
    ["OpenJarvis Bridge", "Integração com Stanford Personal AI (JARVIS)"],
    ["ASNO Bridge", "Assistente JARVIS com WhatsApp, Home Assistant e voz"],
    ["Viseron Apps", "Ecossistema de aplicações integradas"],
    ["MCP Server", "Model Context Protocol para ferramentas externas"],
  ];

  integrations.forEach(([name, desc], i) => {
    const bg = i % 2 === 0 ? COLORS.card : COLORS.white;
    doc.rect(45, doc.y, doc.page.width - 90, 20).fillColor(bg).strokeColor(COLORS.lightGray).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.section).fontSize(9).font("Helvetica-Bold").text(`  ${name}`, 50, doc.y - 16);
    doc.fillColor(COLORS.subtitle).fontSize(8).font("Helvetica").text(`${desc}`, 175, doc.y - 16);
  });

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 9. BACKUP
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("9. Comandos de Backup & Manutenção", { underline: true });
  doc.moveDown(1);

  const backupCmds = [
    ["npm run backup", "Executa backup manual agora", "scripts/backup-system.ps1"],
    ["npm run backup:schedule", "Agenda backup diário (03:00)", "scripts/schedule-backup.ps1"],
  ];

  drawTable(doc, ["Comando", "Descrição", "Script"], backupCmds, [28, 50, 40]);
  doc.moveDown(1.5);

  doc.fontSize(11).fillColor(COLORS.section).font("Helvetica-Bold").text("Sistema de Backup Diário");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");
  doc.text("  O sistema de backup automático (scripts/backup-system.ps1) cria backups completos:");
  doc.moveDown(0.3);
  doc.text("  • Backup completo: config/, data/, database/, src/, scripts/, agents/, packages/, mobile/, electron/, docs/");
  doc.text("  • Formato: ZIP com timestamp (YYYY-MM-DD_HHmmss.zip)");
  doc.text("  • Retenção: 30 dias (backups antigos são removidos automaticamente)");
  doc.text("  • Agendamento: Windows Task Scheduler às 03:00 (ou manual via npm run backup)");
  doc.text("  • Inclui todos os PDFs e documentação");
  doc.moveDown(1);

  doc.fontSize(10).fillColor(COLORS.green).font("Helvetica-Bold").text("  Localização dos Backups: backups/YYYY-MM-DD_HHmmss.zip");

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 10. AIOX CORE CLI
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("10. Comandos do AIOX Core CLI", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(10).font("Helvetica").text("AIOX Core é a CLI oficial do ecossistema Trinnity Viseron.", { align: "justify" });
  doc.moveDown(1);

  const aioxCmds = [
    ["aiox-core init", "Inicializa um novo projeto TVS", "Cria estrutura base"],
    ["aiox-core install", "Instala dependências do projeto", "npm install automático"],
    ["aiox-core status", "Mostra status do sistema TVS", "Saúde e métricas"],
    ["aiox-core --help", "Ajuda completa da CLI", "Todos os comandos"],
  ];

  drawTable(doc, ["Comando", "Descrição", "Detalhes"], aioxCmds, [28, 46, 44]);
  doc.moveDown(1.5);

  doc.fontSize(11).fillColor(COLORS.section).font("Helvetica-Bold").text("Instalação do AIOX Core");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");
  doc.text("  cd packages/aiox-core");
  doc.text("  npm install");
  doc.text("  npm link  (ou npm install -g .)");

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 11. API REST
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("11. API REST - Endpoints Completos", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(10).font("Helvetica").text("A API REST do TVS permite controlar todo o sistema remotamente. Dashboard em http://localhost:3000, Report Server em http://localhost:3001.", { align: "justify" });
  doc.moveDown(1);

  doc.fontSize(11).fillColor(COLORS.section).font("Helvetica-Bold").text("Dashboard API (Porta 3000)");
  doc.moveDown(0.5);

  const apiDash = [
    ["GET /api/health", "Health check do sistema", "Status do servidor"],
    ["GET /api/stats", "Estatísticas completas", "Agentes, memória, evolução"],
    ["GET /api/agents", "Lista todos os agentes", "Array de agentes"],
    ["GET /api/status", "Status com squads", "Squads e líderes"],
    ["GET /api/battalion", "Relatório do batalhão", "114 agentes do batalhão"],
    ["GET /api/battalion/:id", "Agente específico", "Detalhes do agente"],
    ["GET /api/directives", "Estatísticas de diretivas", "Ativas e completadas"],
    ["POST /api/directive", "Emitir nova diretiva", "Criar missão"],
    ["POST /api/synthesize", "Síntese multi-provedor", "Ensemble de IAs"],
  ];

  drawTable(doc, ["Endpoint", "Descrição", "Resposta"], apiDash, [32, 46, 40]);
  doc.moveDown(1);

  doc.fontSize(11).fillColor(COLORS.section).font("Helvetica-Bold").text("Report Server API (Porta 3001)");
  doc.moveDown(0.5);

  const apiReport = [
    ["GET /", "Informação do servidor", "Endpoints disponíveis"],
    ["GET /stats", "Estatísticas do sistema", "Agentes ativos/total"],
    ["GET /agents", "Lista compacta de agentes", "ID, nome, role, status"],
    ["GET /agents/:id", "Detalhes de um agente", "Capacidades completas"],
    ["GET /report", "Relatório JSON completo", "Sistema + agentes + IA"],
    ["GET /report/pdf", "Download PDF do relatório", "PDF formatado"],
    ["GET /report/comprehensive-pdf", "PDF completo do batalhão", "PDF com todos os dados"],
    ["GET /superintelligence", "Status SuperIntelligence", "Nível de inteligência"],
    ["GET /supermind", "Nível SuperMind", "Domínios de conhecimento"],
  ];

  drawTable(doc, ["Endpoint", "Descrição", "Resposta"], apiReport, [34, 44, 40]);

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 12. MÓDULOS CORE
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("12. Módulos do Core TVS", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(10).font("Helvetica").text("O TVS possui 22 subsistemas core no ViseronCore, cada um com responsabilidades específicas:", { align: "justify" });
  doc.moveDown(1);

  const coreModules = [
    ["AgentManager", "Registro, ciclo de vida e execução de agentes", "agentManager.list(), register(), run()"],
    ["ModelRouter", "Roteamento inteligente para o melhor modelo IA", "modelRouter.route(criteria)"],
    ["MemoryEngine", "Memória STM (100 itens) + LTM (persistente)", "addShortTerm(), setLongTerm()"],
    ["ToolManager", "Criação e execução de ferramentas externas", "createQuickTool(), executeTool()"],
    ["ProviderFactory", "Fábrica de provedores de IA", "getProvider(), generate()"],
    ["SquadManager", "Gestão de squads de agentes", "addMemberToSquad(), getSquad()"],
    ["MCP Server", "Model Context Protocol server", "initialize(), registerTool()"],
    ["Orchestrator", "Orquestração de tarefas multi-agente", "orchestrate(task, description)"],
    ["CommandChain", "Cadeia de comando: Pedro + Trinnity", "issueDirective(), ratify()"],
    ["AutoLearningEngine", "Aprendizado contínuo a cada 30 min", "startLearningCycle()"],
    ["HyperLearningEngine", "Inteligência x6 a cada 30 min", "start(interval)"],
    ["AutonomousPlanner", "Planejamento autônomo de objetivos", "plan(objective)"],
    ["AutoEvolutionEngine", "Evolução genética de agentes", "evolveAll(), crossPollinate()"],
    ["SuperMind", "500 anos de conhecimento sintetizado", "synthesize(prompt, domains)"],
    ["SuperIntelligenceEngine", "1000%+ sobre IA individual", "synthesize(input)"],
    ["AIProviderBridge", "Ponte para 290+ provedores", "chat(request), ensemble()"],
    ["AppScaffolder", "Geração de aplicações completas", "scaffold(config)"],
    ["WebAppGenerator", "Geração de websites", "generateCryptoSite()"],
    ["TokenEngine", "Geração de tokens e contratos", "generateToken(), deployToken()"],
    ["BusinessSolutionEngine", "Soluções empresariais", "solve(problem)"],
    ["AgentSpawner", "Spawn de 5000+ mentes", "loadMinds(), spawnAll()"],
    ["AgentFactory", "Fábrica de agentes", "createAgent(spec)"],
    ["AgentCollaborator", "Colaboração entre agentes", "collaborate(task, agents)"],
  ];

  coreModules.forEach(([name, desc, api], i) => {
    const bg = i % 2 === 0 ? COLORS.card : COLORS.white;
    doc.rect(45, doc.y, doc.page.width - 90, 24).fillColor(bg).strokeColor(COLORS.lightGray).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.section).fontSize(8).font("Helvetica-Bold").text(`  ${name}`, 50, doc.y - 19);
    doc.fillColor(COLORS.text).fontSize(7.5).font("Helvetica").text(`  ${desc}`, 160, doc.y - 19);
    doc.fillColor(COLORS.accent).fontSize(7).font("Helvetica").text(`  ${api}`, 330, doc.y - 19);
  });

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 13. PROVEDORES DE IA
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("13. Provedores de IA Suportados", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(10).font("Helvetica").text("O TVS suporta 8+ provedores de IA diretamente e 290+ via OmniRoute Bridge. Abaixo os provedores nativos:", { align: "justify" });
  doc.moveDown(1);

  const providers = [
    ["Ollama (Local)", "Llama 3, Qwen 2, Mistral", "0", "8K-32K", "Offline, zero custo", "Padrão"],
    ["OpenAI", "GPT-4o, GPT-4o-mini, o1", "$0.002-0.015", "128K-200K", "Estado da arte", "API Key"],
    ["Anthropic", "Claude Sonnet 4, Opus 4", "$0.003-0.015", "200K", "Segurança, contexto longo", "API Key"],
    ["Google", "Gemini 2.5 Flash/Pro", "$0.00015-0.00125", "1M+", "Multimodal, mais rápido", "API Key"],
    ["xAI", "Grok 3", "$0.002", "131K", "Dados em tempo real", "API Key"],
    ["DeepSeek", "DeepSeek Chat", "$0.0005", "128K", "Open-weight, competitivo", "API Key"],
    ["Mistral", "Mistral Large/Small", "$0.001-0.002", "32K-128K", "Eficiente, EUA", "API Key"],
    ["Cohere", "Command A", "$0.0015", "128K", "RAG-optimizado", "API Key"],
    ["HuggingFace", "Llama 3.3 70B, Mixtral", "$0.0004-0.0005", "8K-65K", "Open-source", "API Key"],
    ["Together AI", "Llama 3.3 70B Turbo", "$0.0005", "8K", "Inferência rápida", "API Key"],
    ["Perplexity", "Sonar Pro", "$0.001", "128K", "Pesquisa online", "API Key"],
    ["OmniRoute", "290+ modelos agregados", "Variado", "Variado", "Gateway universal", "Config"],
  ];

  drawTable(doc, ["Provedor", "Modelos", "Custo/1K", "Contexto", "Diferencial", "Requisito"], providers, [22, 30, 16, 14, 30, 14]);
  doc.moveDown(1.5);

  doc.fontSize(11).fillColor(COLORS.section).font("Helvetica-Bold").text("Estratégias de Roteamento");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");
  doc.text("  • single: Usa um único provedor (default: Ollama)");
  doc.text("  • compare: Compara respostas de múltiplos modelos");
  doc.text("  • ensemble: Agrega respostas de todos os provedores disponíveis");
  doc.text("  • fallback: Se um falha, próximo da lista é usado automaticamente");
  doc.text("  • local-first: Tenta Ollama primeiro, depois cloud");

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 14. TOKENS
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("14. Tokens: $VSR e $TRIN", { underline: true });
  doc.moveDown(1);

  doc.fontSize(14).fillColor(COLORS.gold).font("Helvetica-Bold").text("$VSR — Viseron Crown (Token de Governança)");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.text).fontSize(10).font("Helvetica");
  doc.text("  Supply: 300,000,000 VSR");
  doc.text("  Standard: TVS Standard v1.0.0");
  doc.text("  Função: Governança do sistema, voto em evoluções, diretivas");
  doc.moveDown(0.5);
  doc.text("  Distribuição:");
  doc.text("    • Trinnity Hurtado (Tesouro Corona): 90M VSR (30%)");
  doc.text("    • Pedro Costa (Tesouro Hierro): 75M VSR (25%)");
  doc.text("    • TVS Legion (Pool de Agentes): 90M VSR (30%)");
  doc.text("    • Reserva Estratégica: 45M VSR (15%)");
  doc.moveDown(1);

  doc.fontSize(14).fillColor(COLORS.accent).font("Helvetica-Bold").text("$TRIN — Trinnity (Token de Utilidade)");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.text).fontSize(10).font("Helvetica");
  doc.text("  Supply: Dinâmico (cunhado/queimado por atividade)");
  doc.text("  Função: Gas para execução de agentes, créditos de computação, taxas");
  doc.text("  Rede: Ethereum (ERC-20)");
  doc.moveDown(0.5);
  doc.text("  Tokenomics:");
  doc.text("    • Distribuição: Team 10%, Marketing 15%, Liquidity 20%,");
  doc.text("      Development 10%, Staking 25%, Community 20%");
  doc.text("    • Inflação: 2% anual");
  doc.text("    • Deflação: 1% queimado por transação");

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 15. SOLUÇÕES PARA O MUNDO
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("15. Soluções que Oferecemos ao Mundo", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(11).font("Helvetica");
  doc.text("O Trinnity Viseron System não é apenas um software — é uma plataforma completa de superinteligência que resolve problemas reais em escala global. Abaixo, as soluções que entregamos ao mundo:", { align: "justify" });
  doc.moveDown(1.5);

  const solutions = [
    {
      title: "🤖 Superinteligência Multi-Agente",
      desc: "5.112 agentes autônomos trabalhando em paralelo para resolver problemas complexos. Cada agente é especializado em um domínio específico, permitindo análise multidimensional de qualquer desafio."
    },
    {
      title: "🌐 Gateway Universal de IA (OmniRoute)",
      desc: "Acesso a 290+ provedores de IA através de uma única API. Roteamento inteligente, fallback automático e otimização de custos. Sem vendor lock-in."
    },
    {
      title: "📱 Geração Multi-Plataforma",
      desc: "Criação automática de aplicações web, mobile (Android APK + iOS IPA), desktop (Windows/Mac/Linux executáveis) e Docker containers a partir de descrições em linguagem natural."
    },
    {
      title: "💰 Tokenomics Inteligente",
      desc: "Geração completa de tokens ERC-20 com contratos Solidity, staking pools, governança on-chain e distribuição automática. Ideal para startups Web3 e DAOs."
    },
    {
      title: "🏢 Soluções Empresariais",
      desc: "De planos de negócio a implementação completa. O TVS gera arquiteturas, código, documentação e estratégias de mercado para qualquer setor."
    },
    {
      title: "🔗 Integração Total",
      desc: "Conecta-se com n8n (automação), Twilio (voz/SMS), Home Assistant (smart home), JARVIS (assistente pessoal), MCP (ferramentas externas) e muito mais."
    },
    {
      title: "🧠 Auto-Evolução Contínua",
      desc: "O sistema evolui sozinho a cada 30 minutos. Inteligência cresce +500% por ciclo, agentes desenvolvem novas capacidades, e o conhecimento é sintetizado pelo SuperMind."
    },
    {
      title: "🔐 Segurança e Soberania",
      desc: "Operação 100% offline com Ollama. Dados nunca saem do seu ambiente. Ideal para governos, defesa e empresas com requisitos rigorosos de segurança."
    },
  ];

  solutions.forEach(({ title, desc }) => {
    doc.rect(45, doc.y, doc.page.width - 90, 50).fillColor(COLORS.card).strokeColor(COLORS.accent).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.section).fontSize(10).font("Helvetica-Bold").text(`  ${title}`, 50, doc.y - 45);
    doc.fillColor(COLORS.text).fontSize(9).font("Helvetica").text(`  ${desc}`, 50, doc.y - 30, { width: doc.page.width - 110, align: "justify" });
  });

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 16. MODELO DE ASSINATURA
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("16. Modelo de Assinatura — Por que Pagar?", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(11).font("Helvetica");
  doc.text("O Trinnity Viseron System é um sistema operacional de superinteligência que substitui dezenas de ferramentas, serviços e equipes. Abaixo, explicamos por que o modelo de assinatura é necessário e justo.", { align: "justify" });
  doc.moveDown(1.5);

  // Card: O que você está pagando
  doc.rect(45, doc.y, doc.page.width - 90, 120).fillColor(COLORS.darkBg).strokeColor(COLORS.gold).lineWidth(2).stroke();
  doc.fillColor(COLORS.gold).fontSize(14).font("Helvetica-Bold").text("  O QUE VOCÊ RECEBE", 55, doc.y - 114);
  doc.fillColor(COLORS.white).fontSize(9).font("Helvetica");
  doc.text("  ✅ 5.112 Agentes de IA trabalhando 24/7 para você", 55);
  doc.text("  ✅ Acesso a 290+ modelos de IA (GPT-4o, Claude, Gemini, Grok, etc.)", 55);
  doc.text("  ✅ Geração ilimitada de aplicações (web, mobile, desktop)", 55);
  doc.text("  ✅ Criação de tokens e contratos inteligentes", 55);
  doc.text("  ✅ Automação via n8n com 400+ templates", 55);
  doc.text("  ✅ Sistema de chamadas com IA via Twilio", 55);
  doc.text("  ✅ Armazenamento de memória de longo prazo", 55);
  doc.text("  ✅ Atualizações contínuas e auto-evolução", 55);
  doc.text("  ✅ Suporte prioritário da equipe TVS", 55);
  doc.text("  ✅ Execução local (offline) ou cloud", 55);

  doc.moveDown(2.5);

  // Card: Por que não é gratuito
  doc.fontSize(14).fillColor(COLORS.section).font("Helvetica-Bold").text("POR QUE NÃO É GRATUITO?");
  doc.moveDown(0.8);
  doc.fillColor(COLORS.text).fontSize(10).font("Helvetica");

  const reasons = [
    ["Infraestrutura de IA", "Cada requisição a modelos como GPT-4o, Claude Opus ou Gemini Pro tem custo real por token. O TVS otimiza esses custos, mas eles existem."],
    ["Manutenção Contínua", "5.112 agentes, 22 módulos core, 6 bridges de integração — tudo requer atualização, testes e suporte contínuos."],
    ["Desenvolvimento Constante", "Novas funcionalidades, mais provedores, melhor performance. O investimento em P&D é contínuo e significativo."],
    ["Infraestrutura de Servidores", "Dashboard, API, Report Server, MCP Server, n8n, Qdrant vector DB — múltiplos serviços rodando 24/7."],
    ["Suporte e Documentação", "Equipe dedicada para suporte técnico, documentação, tutoriais e resolução de problemas."],
    ["Economia de Escala", "Por $29-99/mês você substitui: equipe de 10+ desenvolvedores, 5+ assinaturas de IA, 3+ serviços de cloud."],
  ];

  const startY = doc.y;
  reasons.forEach(([reason, desc], i) => {
    const yPos = startY + i * 28;
    doc.rect(45, yPos, doc.page.width - 90, 25).fillColor(i % 2 === 0 ? COLORS.card : COLORS.white).strokeColor(COLORS.lightGray).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.section).fontSize(10).font("Helvetica-Bold").text(`  ${reason}`, 50, yPos + 3);
    doc.fillColor(COLORS.subtitle).fontSize(8).font("Helvetica").text(`  ${desc}`, 50, yPos + 16, { width: doc.page.width - 110 });
  });

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 17. PLANOS E PREÇOS
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("17. Planos e Preços", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(11).font("Helvetica").text("Três planos simples para atender desde desenvolvedores individuais até grandes empresas.", { align: "justify" });
  doc.moveDown(1.5);

  // Plano Developer
  doc.rect(45, doc.y, doc.page.width - 90, 140).fillColor(COLORS.card).strokeColor(COLORS.accent).lineWidth(1.5).stroke();
  doc.fillColor(COLORS.section).fontSize(14).font("Helvetica-Bold").text("  DEVELOPER", 55, doc.y - 134);
  doc.fillColor(COLORS.accent).fontSize(12).font("Helvetica-Bold").text("  $29/mês", 55, doc.y - 118);
  doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");
  doc.text("  • Acesso a 5.112 agentes de IA", 55);
  doc.text("  • 10 requisições/minuto à API", 55);
  doc.text("  • Modelos locais (Ollama) + GPT-4o-mini", 55);
  doc.text("  • Geração de apps web e mobile", 55);
  doc.text("  • Dashboard web e API REST", 55);
  doc.text("  • Backup diário automático", 55);
  doc.text("  • 1 projeto", 55);
  doc.text("  • Comunidade Discord", 55);

  doc.moveDown(4);

  // Plano Pro
  doc.rect(45, doc.y, doc.page.width - 90, 150).fillColor(COLORS.darkBg).strokeColor(COLORS.gold).lineWidth(2).stroke();
  doc.fillColor(COLORS.white).fontSize(14).font("Helvetica-Bold").text("  PROFESSIONAL (RECOMENDADO)", 55, doc.y - 144);
  doc.fillColor(COLORS.gold).fontSize(14).font("Helvetica-Bold").text("  $99/mês", 55, doc.y - 126);
  doc.fillColor(COLORS.lightGray).fontSize(9).font("Helvetica");
  doc.text("  • Tudo do Developer, mais:", 55);
  doc.text("  • 100 requisições/minuto à API", 55);
  doc.text("  • Todos os modelos cloud (GPT-4o, Claude, Gemini, Grok)", 55);
  doc.text("  • Ensemble multi-provedor (8 IAs simultâneas)", 55);
  doc.text("  • OmniRoute Gateway (290+ provedores)", 55);
  doc.text("  • Geração de tokens ERC-20 + contratos Solidity", 55);
  doc.text("  • Integração com n8n + Twilio + JARVIS", 55);
  doc.text("  • 5 projetos", 55);
  doc.text("  • Suporte prioritário 24/7", 55);

  doc.moveDown(4);

  // Plano Enterprise
  doc.rect(45, doc.y, doc.page.width - 90, 130).fillColor(COLORS.card).strokeColor(COLORS.accent2).lineWidth(1.5).stroke();
  doc.fillColor(COLORS.section).fontSize(14).font("Helvetica-Bold").text("  ENTERPRISE", 55, doc.y - 124);
  doc.fillColor(COLORS.accent2).fontSize(12).font("Helvetica-Bold").text("  $499/mês", 55, doc.y - 108);
  doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");
  doc.text("  • Tudo do Professional, mais:", 55);
  doc.text("  • Requisições ilimitadas à API", 55);
  doc.text("  • Deploy dedicado (Railway / Docker / On-premise)", 55);
  doc.text("  • White label do sistema", 55);
  doc.text("  • Consultoria personalizada", 55);
  doc.text("  • SLA 99.9%", 55);
  doc.text("  • Projetos ilimitados", 55);
  doc.text("  • Gerente de conta dedicado", 55);

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 18. SQUADS
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("18. Squads AIOX, Pedro & Trinnity", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(11).font("Helvetica").text("O sistema é organizado em squads especializadas, cada uma com missão e agentes dedicados. Liderança máxima de Pedro Costa (Comandante Supremo) e Trinnity Hurtado (Reina Arquitecta).", { align: "justify" });
  doc.moveDown(1.5);

  // Pedro
  doc.rect(45, doc.y, doc.page.width - 90, 60).fillColor(COLORS.darkBg).strokeColor(COLORS.green).lineWidth(1.5).stroke();
  doc.fillColor(COLORS.green).fontSize(13).font("Helvetica-Bold").text("  👑 PEDRO COSTA — Comandante Supremo", 55, doc.y - 54);
  doc.fillColor(COLORS.lightGray).fontSize(9).font("Helvetica");
  doc.text("  Estratégia: EXPANSÃO • Squads: AIOX Core, Expansion Force, Deployment Squad", 55);
  doc.text("  Função: Orquestrar deploy, infraestrutura, crescimento e operações do sistema", 55);
  doc.text("  Cor: #00ff88 • Prioridade: Máxima • Status: Ativo", 55);

  doc.moveDown(1.8);

  // Trinnity
  doc.rect(45, doc.y, doc.page.width - 90, 60).fillColor(COLORS.darkBg).strokeColor(COLORS.accent2).lineWidth(1.5).stroke();
  doc.fillColor(COLORS.accent2).fontSize(13).font("Helvetica-Bold").text("  👸 TRINNITY HURTADO — Reina Arquitecta", 55, doc.y - 54);
  doc.fillColor(COLORS.lightGray).fontSize(9).font("Helvetica");
  doc.text("  Estratégia: EVOLUÇÃO • Squads: AIOX Core, Evolution Lab, Intelligence Squad", 55);
  doc.text("  Função: Evolução da IA, hyper-learning, síntese de conhecimento, superinteligência", 55);
  doc.text("  Cor: #ff00ff • Prioridade: Máxima • Status: Ativo", 55);

  doc.moveDown(1.8);

  // Squads
  const squads = [
    {
      name: "AIOX CORE SQUAD", lead: "Pedro Costa + Trinnity Hurtado",
      agents: "Orchestrator, Planner, Evolution Engine, Hyper Learner, Memory Keeper, Provider Router, App Builder",
      desc: "Squad principal que mantém o núcleo do sistema operacional de IA."
    },
    {
      name: "EXPANSION FORCE", lead: "Pedro Costa",
      agents: "Deploy Master, Backup Guardian, System Monitor",
      desc: "Responsável por deploy, infraestrutura, backup e monitoramento."
    },
    {
      name: "EVOLUTION LAB", lead: "Trinnity Hurtado",
      agents: "AI Researcher, Tokenomics Engineer, SuperMind Synthesizer",
      desc: "Pesquisa e evolução contínua da inteligência artificial."
    },
    {
      name: "DEPLOYMENT SQUAD", lead: "Pedro Costa",
      agents: "Web Deployer, Mobile Builder, Desktop Packager, Docker Captain",
      desc: "Build e publicação em todas as plataformas (web, mobile, desktop, docker)."
    },
    {
      name: "INTELLIGENCE SQUAD", lead: "Trinnity Hurtado",
      agents: "Voice Commander, OmniRoute Navigator, n8n Automator, Call System Operator, JARVIS Bridge",
      desc: "Integrações de voz, automação, chamadas e gateways de IA."
    },
  ];

  squads.forEach(({ name, lead, agents, desc }) => {
    doc.rect(45, doc.y, doc.page.width - 90, 55).fillColor(COLORS.card).strokeColor(COLORS.accent).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.section).fontSize(10).font("Helvetica-Bold").text(`  ${name}`, 50, doc.y - 50);
    doc.fillColor(COLORS.subtitle).fontSize(8).font("Helvetica");
    doc.text(`  Lider: ${lead}`, 50, doc.y - 38);
    doc.text(`  Agentes: ${agents}`, 50, doc.y - 28);
    doc.text(`  Missão: ${desc}`, 50, doc.y - 18);
  });

  addFooter(doc, pageNum++);
  doc.addPage();

  // ================================================================
  // 19. GLOSSÁRIO RÁPIDO
  // ================================================================
  doc.fillColor(COLORS.section).fontSize(22).font("Helvetica-Bold").text("19. Glossário de Comandos Rápidos", { underline: true });
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(10).font("Helvetica").text("Resumo executivo dos comandos mais importantes para o dia a dia.", { align: "justify" });
  doc.moveDown(1);

  const quickRef = [
    ["🚀 INICIAR", "npm run dev", "Modo desenvolvimento com hot-reload"],
    ["🚀 INICIAR", "npm start", "Modo produção"],
    ["🚀 INICIAR", "npm run init:full", "Build + Backup + Start completo"],
    ["🛠️ BUILD", "npm run build", "Compilar TypeScript"],
    ["🛠️ BUILD", "npm run lint", "Verificar erros TS"],
    ["📱 MOBILE", "npm run build:android", "Gerar APK Android"],
    ["📱 MOBILE", "npm run build:ios", "Gerar IPA iOS"],
    ["💻 DESKTOP", "npm run build:exe", "Gerar .exe Windows"],
    ["💻 DESKTOP", "npm run build:electron", "Build Electron"],
    ["📤 DEPLOY", "npm run deploy:full", "GitHub + Vercel completo"],
    ["📤 DEPLOY", "npm run deploy:github", "Push GitHub"],
    ["📤 DEPLOY", "npm run deploy:vercel", "Deploy Vercel"],
    ["💾 BACKUP", "npm run backup", "Backup manual imediato"],
    ["💾 BACKUP", "npm run backup:schedule", "Agendar backup 03:00"],
    ["🔗 INTEGRAÇÕES", "npm run omniroute:start", "Gateway 290+ IAs"],
    ["🔗 INTEGRAÇÕES", "npm run call:start", "Call System Twilio"],
    ["🔗 INTEGRAÇÕES", "npm run jarvis:start", "OpenJarvis Bridge"],
    ["🔗 INTEGRAÇÕES", "npm run asno:start", "ASNO JARVIS"],
    ["🧪 TESTES", "npm test", "Testes core do sistema"],
    ["🧪 TESTES", "npm run test:hyper", "Testes hyperlearning"],
    ["📊 RELATÓRIOS", "http://localhost:3000", "Dashboard web"],
    ["📊 RELATÓRIOS", "http://localhost:3001/report/pdf", "PDF do sistema"],
  ];

  drawTable(doc, ["Categoria", "Comando", "Descrição"], quickRef, [18, 30, 70]);
  doc.moveDown(1.5);

  // Final notes
  doc.rect(45, doc.y, doc.page.width - 90, 80).fillColor(COLORS.darkBg).strokeColor(COLORS.gold).lineWidth(1.5).stroke();
  doc.fillColor(COLORS.gold).fontSize(12).font("Helvetica-Bold").text("  TRINNITY VISERON SYSTEM v5.0", 55, doc.y - 74);
  doc.fillColor(COLORS.lightGray).fontSize(9).font("Helvetica");
  doc.text("  \"Construindo o futuro da inteligência artificial — uma mente de cada vez.\"", 55, doc.y - 58);
  doc.moveDown(0.3);
  doc.text("  Pedro Costa — Comandante Supremo", 55, doc.y - 46);
  doc.text("  Trinnity Hurtado — Reina Arquitecta", 55, doc.y - 34);
  doc.text("  https://github.com/ViseronSystem/trinnity-viseron-system", 55, doc.y - 22);

  // ================================================================
  // FINAL
  // ================================================================
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.darkBg);
  doc.fillColor(COLORS.accent).fontSize(36).font("Helvetica-Bold").text("OBRIGADO", 45, 200, { align: "center" });
  doc.moveDown(1);
  doc.fillColor(COLORS.white).fontSize(16).font("Helvetica").text("Trinnity Viseron System — Sempre em Evolução", { align: "center" });
  doc.moveDown(2);
  doc.fillColor(COLORS.gold).fontSize(12).font("Helvetica").text("💰 $VSR • $TRIN • AIOX", { align: "center" });
  doc.moveDown(2);
  doc.fillColor(COLORS.subtitle).fontSize(10).font("Helvetica");
  doc.text("Este manual foi gerado automaticamente pelo TVS v5.0", { align: "center" });
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: "center" });

  addFooter(doc, pageNum);
  doc.end();

  await new Promise((resolve) => stream.on("finish", resolve));
  console.log(`[PDF] Manual completo gerado: ${outputPath}`);
}

function drawTable(doc: any, headers: string[], rows: string[][], colWidths: number[]) {
  const colStarts: number[] = [];
  let x = 45;
  colWidths.forEach((w) => {
    colStarts.push(x);
    x += w * 4.2;
  });

  // Header
  doc.rect(45, doc.y - 2, x - 45, 16).fillColor(COLORS.tableHead).strokeColor(COLORS.accent).lineWidth(0.5).stroke();
  doc.fillColor(COLORS.white).fontSize(7.5).font("Helvetica-Bold");
  headers.forEach((h, i) => {
    doc.text(h, colStarts[i] + 3, doc.y - 0, { width: colWidths[i] * 4.2 - 6 });
  });
  doc.fillColor(COLORS.text);

  // Rows
  rows.forEach((row, ri) => {
    const yPos = doc.y + 2;
    if (yPos > 720) {
      doc.addPage();
    }
    const bg = ri % 2 === 0 ? COLORS.card : COLORS.white;
    doc.rect(45, yPos, x - 45, 18).fillColor(bg).strokeColor(COLORS.lightGray).lineWidth(0.3).stroke();
    doc.fillColor(COLORS.text).fontSize(7).font("Helvetica");
    row.forEach((cell, ci) => {
      doc.text(cell, colStarts[ci] + 3, yPos + 1, { width: colWidths[ci] * 4.2 - 6 });
    });
    doc.y = yPos + 18;
  });
}

// Run
const outPath = path.join(__dirname, "..", "docs", "pdfs", "manuals", "TVS_Manual_Completo.pdf");
generateManual(outPath).catch(console.error);
