// TVS - Relatório de Incrementos (PDF) - O que é Viseron, o que o sistema pode fazer e tudo o que foi incrementado
// Uso: node scripts/gen-report-incrementos.js
const fs = require("fs-extra");
const path = require("path");
const PDFDocument = require("pdfkit");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "reports");
const OUT_FILE = path.join(OUT_DIR, "TVS_Relatorio_Incrementos.pdf");
fs.ensureDirSync(OUT_DIR);

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 45;
const MAX_Y = PAGE_H - 55;

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 45, bottom: 45, left: MARGIN, right: MARGIN },
  bufferPages: true,
});

let y = MARGIN;

function ensure(h = 60) {
  if (y + h > MAX_Y) {
    doc.addPage();
    y = MARGIN;
  }
}

function fillColor(hex) { doc.fillColor(hex); }
function text(txt, size = 10, opts = {}) {
  doc.font("Helvetica").fontSize(size).fillColor("#2a2a3a");
  const lines = doc.heightOfString(txt, { width: PAGE_W - MARGIN * 2, ...opts });
  ensure(lines);
  doc.text(txt, MARGIN, y, { width: PAGE_W - MARGIN * 2, ...opts });
  y = doc.y + 4;
}

function section(num, title) {
  ensure(50);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 30).fill("#0a0a2e");
  doc.fillColor("#00ff87").font("Helvetica-Bold").fontSize(14);
  doc.text(`${num}. ${title}`, MARGIN + 10, y + 8, { width: PAGE_W - MARGIN * 2 - 20 });
  y += 42;
}

function sub(title) {
  ensure(40);
  fillColor("#bf5af2");
  doc.font("Helvetica-Bold").fontSize(12).text(title, MARGIN, y, { width: PAGE_W - MARGIN * 2 });
  y = doc.y + 6;
}

function bullet(txt, sym = "•") {
  ensure(30);
  text(`${sym} ${txt}`, 9.5);
}

function codeBlock(cmd) {
  ensure(40);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 20).fill("#11111f");
  doc.fillColor("#00f0ff").font("Courier").fontSize(9);
  doc.text(cmd, MARGIN + 8, y + 6, { width: PAGE_W - MARGIN * 2 - 16 });
  y += 26;
}

function table(headers, rows, colWidths) {
  const rowH = 20;
  const lineH = 9.5;
  const drawRow = (cells, isHeader) => {
    let maxH = rowH;
    for (let i = 0; i < cells.length; i++) {
      const hh = doc.heightOfString(cells[i], { width: colWidths[i] - 8 });
      if (hh > maxH) maxH = hh;
    }
    ensure(maxH + 4);
    let x = MARGIN;
    for (let i = 0; i < cells.length; i++) {
      if (isHeader) doc.rect(x, y, colWidths[i], maxH).fill("#0a0a2e");
      else doc.rect(x, y, colWidths[i], maxH).fill(i % 2 ? "#f4f4fb" : "#ffffff");
      doc.rect(x, y, colWidths[i], maxH).stroke("#ccccdd");
      doc.fillColor(isHeader ? "#00ff87" : "#2a2a3a")
        .font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(lineH)
        .text(cells[i], x + 4, y + 3, { width: colWidths[i] - 8 });
      x += colWidths[i];
    }
    y += maxH;
  };
  drawRow(headers, true);
  for (const r of rows) drawRow(r, false);
  y += 10;
}

// ============ CAPA ============
doc.rect(0, 0, PAGE_W, PAGE_H).fill("#0a0a2e");
fillColor("#00ff87");
doc.font("Helvetica-Bold").fontSize(30).text("TRINNITY VISERON SYSTEM", MARGIN, 180, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.font("Helvetica-Bold").fontSize(22).fillColor("#00f0ff").text("RELATÓRIO DE INCREMENTOS", MARGIN, 240, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.font("Helvetica").fontSize(13).fillColor("#ffffff").text("O que é Viseron • O que o sistema pode fazer • Tudo o que foi incrementado", MARGIN, 290, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.moveTo(MARGIN + 80, 330).lineTo(PAGE_W - MARGIN - 80, 330).strokeColor("#bf5af2").stroke();
doc.font("Helvetica").fontSize(12).fillColor("#ccccff").text("👑 Pedro Costa — Comandante Supremo\n👸 Trinnity Hurtado — Rainha Arquiteta", MARGIN, 355, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.font("Helvetica").fontSize(10).fillColor("#8888bb").text(`Gerado automaticamente em ${new Date().toLocaleString("pt-BR")}`, MARGIN, 480, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.addPage();

// ============ 1. O QUE É VISERON ============
section(1, "O QUE É VISERON");
text("Viseron é o coração do Trinnity Viseron System v7.0: um Sistema Operacional Multi-Agente de IA (Multi-Agent AI Operating System) desenhado para operar como uma superinteligência autônoma. Não é um chatbot: é uma organização de IA com hierarquia, memória, evolução e orquestração próprias, capaz de planejar, executar e aprender por conta própria.", 10);
sub("1.1 — Hierarquia de comando");
bullet("👑 Pedro Costa — Supreme Commander & Criador do TVS. Comanda a operação e toma as decisões de topo.");
bullet("👸 Trinnity Hurtado — Queen & Chief Architect. Desenha a arquitetura e assina toda decisão com a coroa.");
sub("1.2 — Organização interna");
bullet("SuperMind: 500 anos de conhecimento acumulado (eras primordial → futurista), alimentado por 5.000 mentes.");
bullet("246+ arquetipos de agentes e um batallón de 114 agentes operacionais (linhagens Corona e Hierro).");
bullet("Total de agentes no arranque: 5.370 (5.000 mentes + 246 arquetipos + 114 batallón + núcleo).");
sub("1.3 — Filosofia operacional");
bullet("IA local (Ollama) como padrão — sem custo e com privacidade; nuvem só para raciocínio complexo.");
bullet("Testes antes do deploy, documentação de cada mudança e proteção do núcleo (regras do AGENTS.md).");
bullet("Evolução contínua: cada ciclo de aprendizado aumenta a inteligência dos agentes (+5% com teto seguro).");

// ============ 2. O QUE O SISTEMA PODE FAZER ============
section(2, "O QUE O SISTEMA PODE FAZER");
sub("2.1 — Inteligência e raciocínio");
bullet("SuperIntelligence: sintetiza respostas por ensemble de 5.000 mentes para perguntas complexas.");
bullet("ModelRouter: escolhe entre 11 providers (Ollama local, OpenAI, Claude, Gemini, Grok) conforme privacidade e qualidade exigidas.");
bullet("OmniRoute: gateway opcional com 290+ provedores de IA.");
sub("2.2 — Autonomia e orquestração");
bullet("Orquestrador de tarefas: divide objetivos em subtarefas e distribui para agentes especializados.");
bullet("Squads: equipes de agentes com líderes (Executive, Core Engineering, AIOX) que executam em paralelo.");
bullet("Agentes CEO/Subagentes: planejamento autônomo com execução e revisão de código.");
sub("2.3 — Memória e aprendizado");
bullet("Memória de curto prazo (STM) por sessão e memória de longo prazo (LTM) persistida em database/memory/ltm.json.");
bullet("HyperLearning: ciclos de auto-evolução que melhoram o conhecimento e a inteligência dos agentes.");
bullet("Qdrant (opcional): memória vetorial semântica; sem ele, usa fallback em RAM.");
sub("2.4 — Geração de produtos");
bullet("WebAppGenerator: cria sites e apps completos (HTML + mobile) com tokens, páginas e identidade visual.");
bullet("Tokenomics: gera tokens ERC-20 / BEP-20 / Solana.");
bullet("Forge (Git próprio): hospeda e faz push/pull de repositórios git internos.");
sub("2.5 — Interfaces e comunicação");
bullet("WebOS Dashboard (http://localhost:3000): monitoramento em tempo real, estatísticas, voz e chat.");
bullet("Servidor de relatórios PDF (porta 3001): relatórios operacionais e abrangentes.");
bullet("Voz: comandos por microfone, VoiceBridge + Socket.IO em tempo real.");
bullet("OpenJarvis (IA local) e ASNO (WhatsApp + casa inteligente) e CallSystem (chamadas via Twilio).");
bullet("App móvel Expo (Android APK / iOS IPA) que conecta ao servidor do sistema.");
sub("2.6 — Integrações e automação");
bullet("n8n (automação de workflows), Home Assistant (dispositivos), MCP (Model Context Protocol).");
bullet("Mercado / launch: ferramentas de lançamento com análise de mercado.");
sub("2.7 — Deploy e operação");
bullet("Deploy automático: GitHub, Vercel (site), Render (API), Hostalia (FTP).");
bullet("Backups diários com agendador do Windows e proteção de segredos (.env fora dos backups).");
bullet("Construção de executáveis standalone (.exe/.app) e aplicativo Electron.");

// ============ 3. INCREMENTOS — SESSÃO 1 (CORREÇÕES) ============
section(3, "INCREMENTOS — SESSÃO 1: BARRIDO E CORREÇÕES");
text("Uma varredura completa orquestrada pelos squads AIOX (Core, Integrações, Deploy, Inteligência) encontrou e corrigiu ~40 falhas. Principais correções:", 10);
table(
  ["Área", "Falha encontrada", "Correção aplicada"],
  [
    ["Dashboard WebOS", "webos.js com erro de sintaxe (interface morta)", "Sintaxe corrigida — dashboard volta a funcionar"],
    ["Forge Git", "Rotas Express 5 inválidas (crash no arranque) + git push vazio", "Rotas corrigidas + git-receive-pack/upload-pack reais"],
    ["Configuração", ".env nunca era carregado (IA cloud toda em modo simulado)", "dotenv/config carregado nos servidores"],
    ["AgentSpawner", "Caminho de minds.json quebrado em modo dev", "Resolução robusta (cwd + __dirname)"],
    ["IA", "4.756 mentes usavam provider 'openai' (violava a regra Ollama)", "Provider padrão agora é ollama (local)"],
    ["Scripts npm", "call:start, jarvis:start, asno:start, omniroute:start quebrados", "startServer exportado + guarda contra null"],
    ["WebAppGenerator", "Sites token com sintaxe inválida + portas 3000 colidindo", "Interpolação corrigida + portas 4100+"],
    ["HyperLearning", "Inteligência explodia x6 por ciclo (valor sem sentido)", "Crescimento +5% com teto de 1.000.000"],
    ["tvstools", "Comando 'transcrever' nunca funcionava (precedência)", "Parênteses corrigidos"],
    ["Produção", "Porta 3000 fixa ignorava PORT (crash em Railway/Render)", "Agora respeita process.env.PORT"],
    ["Segurança", ".env ia para Docker/pkg/backups; senha n8n fixa", ".dockerignore criado; .env fora de pkg/backups; senha via env"],
    ["Mentes", "Missão de 5.000+ mentes não era cumprida (4.756)", "Regeneradas: 5.000 mentes (342 históricas + 4.658 sintéticas)"],
    ["Mobile", "Servidor do app fixo não configurável", "DEFAULT_SERVER via Expo config (app.json → extra.tvsServerUrl)"],
    ["Relatórios", "providerCount/intelligenceLevel com valores incorretos", "Valores reais calculados a partir do sistema"],
  ],
  [110, 240, 155]
);
text("Entregáveis da Sessão 1:", 10);
bullet("Manual de operação humana: data/reports/TVS_Pasos_Humanos_Operacion.pdf (12 seções + diagrama).");
bullet("Diagrama de operação: data/reports/TVS_Diagrama_Operacao.svg / .png.");
bullet("Script regenerável do manual: scripts/gen-manual-operacion.js.");

// ============ 4. INCREMENTOS — SESSÃO 2 (SKILLS) ============
section(4, "INCREMENTOS — SESSÃO 2: BIBLIOTECA DE SKILLS (958 skills)");
text("Integração autônoma de 4 coleções públicas de Agent Skills (formato padrão SKILL.md) como módulo nativo de Viseron. O conteúdo original é preservado em skills/vendor/ com sua licença e autor; toda a camada de integração é de autoria Viseron.", 10);
sub("4.1 — Coleções integradas");
table(
  ["Coleção", "Origem", "Licença", "Skills"],
  [
    ["awesome-claude-skills", "ComposioHQ/awesome-claude-skills", "Apache-2.0", "864"],
    ["superpowers", "obra/superpowers", "MIT", "14"],
    ["claude-plugins-official", "anthropics/claude-plugins-official", "Apache-2.0", "31"],
    ["marketingskills", "coreyhaines31/marketingskills", "MIT", "49"],
  ],
  [150, 150, 90, 60]
);
text("Total: 958 skills em 21,6 MB (skills/vendor/ fica no .gitignore e é instalável com um comando).", 10);
sub("4.2 — O que a Viseron Skills Library oferece");
bullet("Desenvolvimento: test-driven-development, brainstorming, subagent-driven-development, systematic-debugging, git-worktrees.");
bullet("Marketing: CRO, copywriting, SEO (seo-audit, programmatic-seo, schema), cold-email, analytics, pricing, launch.");
bullet("Documentos e mídia: docx, pdf, pptx, xlsx, canvas-design, image-enhancer, theme-factory, slack-gif-creator.");
bullet("Dados e análise: deep-research, csv-summarizer, langsmith-fetch, developer-growth-analysis.");
bullet("Automação de apps: GitHub, Slack, Gmail, Notion, Jira, Salesforce, WhatsApp e dezenas de outros (Rube MCP).");
sub("4.3 — Módulo de integração (autoría Viseron)");
bullet("src/core/skills/SkillsRegistry.ts — escâner de SKILL.md, parser de frontmatter, busca e carga sob demanda (~100 tokens por skill no índice).");
bullet("scripts/skills.ts — CLI autônomo com Commander: install, list, search, info.");
bullet("API REST no dashboard: GET /api/skills, GET /api/skills/stats, GET /api/skills/:id.");
bullet("Scripts npm: skills:install, skills:list, skills:search, skills:info, skills.");
bullet("Documentação: docs/SKILLS.md + AGENTS.md atualizado.");
bullet("Testes: 4 novos testes de SkillsRegistry no suite (14/14 total).");

// ============ 5. ESTADO VERIFICADO ============
section(5, "ESTADO VERIFICADO");
table(
  ["Verificação", "Resultado"],
  [
    ["TypeScript / lint (tsc --noEmit)", "OK, sem erros"],
    ["Build (compilação + copia de assets)", "OK"],
    ["Testes automatizados", "14/14 PASS"],
    ["Instalação de skills", "958 skills / 4 coleções"],
    ["Busca e leitura de skills", "OK (ex.: search 'cro' → 26 resultados)"],
    ["API REST de skills", "OK (stats, list, detail)"],
    ["Arranque do sistema", "5.370 agentes (5.000 mentes + 246 arquetipos + 114 batallón)"],
    ["Segurança", ".env fora de backups, Docker e executáveis"],
  ],
  [290, 215]
);

// ============ 6. COMANDOS NOVOS ============
section(6, "COMANDOS NOVOS (Sessão 2)");
table(
  ["O que fazer", "Comando"],
  [
    ["Instalar/atualizar as coleções de skills", "npm run skills:install"],
    ["Listar todas as skills", "npm run skills:list"],
    ["Buscar skills por texto", "npm run skills -- search <termo>"],
    ["Ver conteúdo de uma skill", "npm run skills -- info <id>"],
    ["Filtrar por coleção", "npm run skills -- list --source superpowers"],
    ["Ver skills pelo dashboard", "http://localhost:3000/api/skills/stats"],
    ["Gerar este relatório", "node scripts/gen-report-incrementos.js"],
  ],
  [290, 215]
);

doc.end();
const stream = fs.createWriteStream(OUT_FILE);
doc.pipe(stream);
stream.on("finish", () => {
  const size = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(`PDF gerado: ${OUT_FILE} (${size} KB)`);
});
