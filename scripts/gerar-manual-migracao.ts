#!/usr/bin/env tsx
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(__dirname, "..", "data");
const OUT = path.join(DATA_DIR, "Viseron_Manual_Migracao_Completo.pdf");
try {
  fs.unlinkSync(OUT);
} catch { /* file not locked */ }

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 55, bottom: 50, left: 60, right: 60 },
  info: {
    Title: "VISERON — Manual Completo de Migracao",
    Author: "Pedro Costa & Trinnity Hurtado",
  },
});

const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

const M = { left: 60, right: 535, width: 475 };
const GOLD = "#D4AF37";
const NAVY = "#1A1A3E";
const BLUE = "#2D3A8C";
const WHITE = "#FFFFFF";
const BLACK = "#111827";
const GRAY = "#6B7280";
const LGRAY = "#F3F4F6";
const RED = "#DC2626";
const GREEN = "#059669";
const AMBER = "#D97706";

function checkSpace(needed: number) {
  if (doc.y + needed > 715) doc.addPage();
}

function sectionBar(title: string, subtitle?: string) {
  doc.addPage();
  const y = doc.y;
  doc.rect(M.left, y, M.width, 42).fill(NAVY);
  doc.fontSize(14).font("Helvetica-Bold").fillColor(GOLD).text(title, M.left + 12, y + 11, { width: M.width - 24 });
  if (subtitle) {
    doc.fontSize(8).font("Helvetica").fillColor(WHITE).text(subtitle, M.left + 12, y + 28, { width: M.width - 24 });
  }
  doc.y = y + 46;
  doc.fillColor(BLACK);
  doc.moveDown(0.4);
}

function heading(text: string) {
  checkSpace(40);
  doc.moveDown(0.6);
  doc.fontSize(11).font("Helvetica-Bold").fillColor(BLUE).text(text);
  doc.strokeColor(GOLD).lineWidth(1).moveTo(M.left, doc.y + 2).lineTo(M.right, doc.y + 2).stroke();
  doc.strokeColor(BLACK);
  doc.moveDown(0.4);
}

function body(text: string) {
  doc.fontSize(9).font("Helvetica").fillColor(BLACK).text(text, { lineGap: 4, paragraphGap: 6, width: M.width });
}

function bullet(text: string, color = BLACK) {
  checkSpace(24);
  doc.fontSize(8.5).font("Helvetica").fillColor(color).text(`  •  ${text}`, { width: M.width - 15, lineGap: 3 });
}

function codeBlock(text: string) {
  checkSpace(26);
  const y = doc.y;
  doc.rect(M.left, y, M.width, 24).fill(LGRAY);
  doc.y = y + 4;
  doc.fontSize(8).font("Courier").fillColor(BLACK).text(text, M.left + 8, doc.y, { width: M.width - 16 });
  doc.y = y + 26;
}

function stepBox(num: string, title: string, desc: string, cmd?: string) {
  const h = cmd ? 84 : 58;
  checkSpace(h + 10);
  const y = doc.y;
  doc.rect(M.left, y, M.width, h).fill(LGRAY);
  doc.y = y + 5;
  doc.fontSize(10).font("Helvetica-Bold").fillColor(BLUE).text(`${num}. ${title}`, M.left + 10, doc.y, { width: M.width - 20 });
  doc.y += 15;
  doc.fontSize(8.5).font("Helvetica").fillColor(BLACK).text(desc, M.left + 10, doc.y, { width: M.width - 20, lineGap: 2 });
  if (cmd) {
    doc.y += 32;
    doc.fontSize(8).font("Courier").fillColor(RED).text(cmd, M.left + 10, doc.y, { width: M.width - 20 });
  }
  doc.y = y + h + 4;
}

function tbl(headers: string[], rows: string[][]) {
  const h = headers.length;
  checkSpace(35 + rows.length * 22);
  const y0 = doc.y;
  doc.rect(M.left, y0, M.width, 18).fill(NAVY);
  doc.y = y0 + 3;
  for (let i = 0; i < h; i++) {
    const x = M.left + 5 + (M.width / h) * i;
    doc.fontSize(8).font("Helvetica-Bold").fillColor(GOLD).text(headers[i], x, doc.y, { width: M.width / h - 10 });
  }
  doc.y = y0 + 19;
  doc.fillColor(BLACK);
  for (let r = 0; r < rows.length; r++) {
    const rowY = doc.y;
    if (r % 2 === 0) doc.rect(M.left, rowY, M.width, 19).fill(LGRAY);
    doc.y = rowY + 3;
    for (let c = 0; c < h; c++) {
      const x = M.left + 5 + (M.width / h) * c;
      doc.fontSize(7.5).font("Helvetica").fillColor(BLACK).text(rows[r][c] || "", x, doc.y, { width: M.width / h - 10 });
    }
    doc.y = rowY + 20;
  }
  doc.moveDown(0.5);
}

// ═══════════════════════════════════════════
// CAPA
// ═══════════════════════════════════════════
doc.rect(0, 200, 595, 300).fill(NAVY);
doc.y = 55;
doc.fontSize(26).font("Helvetica-Bold").fillColor(GOLD).text("TRINNITY", { align: "center" });
doc.fontSize(24).font("Helvetica-Bold").fillColor(WHITE).text("VISERON SYSTEM", { align: "center" });
doc.moveDown(1.5);
doc.fontSize(13).font("Helvetica").fillColor(GRAY).text("Manual Completo de Migracao", { align: "center" });
doc.moveDown(0.4);
doc.fontSize(10).font("Helvetica").fillColor(GOLD).text("Historia completa dos comandos + guia detalhado passo a passo", { align: "center" });
doc.moveDown(2.5);
doc.strokeColor(GOLD).lineWidth(2).moveTo(120, doc.y).lineTo(475, doc.y).stroke();
doc.strokeColor(BLACK);
doc.moveDown(1.5);
doc.fontSize(15).font("Helvetica-Bold").fillColor(GOLD).text("Pedro Costa", { align: "center" });
doc.fontSize(10).font("Helvetica").fillColor(WHITE).text("Comandante & Fundador — CEO", { align: "center" });
doc.moveDown(0.8);
doc.fontSize(15).font("Helvetica-Bold").fillColor(GOLD).text("Trinnity Hurtado", { align: "center" });
doc.fontSize(10).font("Helvetica").fillColor(WHITE).text("Rainha & Chief Evolution Officer", { align: "center" });
doc.moveDown(1.5);
doc.fontSize(8).font("Helvetica").fillColor(GRAY).text("Versao 7.0 · Golden Backup Final · 22.948 arquivos · SHA-256 verificado", { align: "center" });

// ═══════════════════════════════════════════
// PARTE 1 — HISTORIA COMPLETA DOS COMANDOS
// ═══════════════════════════════════════════
sectionBar("PARTE 1 — HISTORIA COMPLETA DOS COMANDOS", "Todas as missoes que o Comandante Pedro Costa enviou e o que foi implementado");

heading("1.1 Visao Estrategica (inicio)");
body("O Comandante definiu a visao da VISERON como uma infraestrutura de inteligencia que transforma objetivos humanos complexos em planejamento, conhecimento, execucao, validacao e evolucao. As referencias (Iron Man, Tesla, Musk, Trump, Biblia, 3-6-9) foram convertidas em principios arquiteturais, nao copiadas.");
body("O Founder Operating System foi criado para proteger o recurso mais importante do projeto: Pedro Costa. Top 3 missoes diarias, deep work, exercicio, sono, aprendizado, KPIs, anti-burnout.");

heading("1.2 S13 — Real-World Intelligence + Knowledge Flywheel");
bullet("Skill Intelligence: 1.997 skills indexadas em 10 colecoes", BLUE);
bullet("Benchmark de 10 projetos reais comparando COM/SEM skills", BLUE);
bullet("Knowledge Flywheel: execucao → evidencia → experiencia → aprendizado", BLUE);
bullet("Reality Matrix: skills sao INDEXED, nao executaveis (honesto)", BLUE);

heading("1.3 S14 — Skill Execution Fabric");
bullet("SkillPipeline.execute() deixou de ser hardcoded REJECTED", GREEN);
bullet("SkillExecutor criado: PROMPT/TOOL/HYBRID execution modes", GREEN);
bullet("Execution records com ID, latencia, validacao, evidencia", GREEN);
bullet("Risk classification: LOW/MEDIUM/HIGH com bloqueio automatico", GREEN);
bullet("Benchmark: BASELINE 0.62 → S14 0.88 (+0.26)", GREEN);

heading("1.4 P0.1 — Execution Fabric Integration");
body("Os componentes UNUSED foram conectados ao fluxo de execucao real:");
bullet("SkillBridge → JarvisAgent.buildSystemPrompt() a cada chat", GREEN);
bullet("ExperienceStore → SkillExecutor lifecycle", GREEN);
bullet("ParallelOrchestrator → ativado (PARTIAL → REAL)", GREEN);
bullet("S13IntelligenceEngine Math.random → DEPRECATED", GREEN);
bullet("Benchmark: BASELINE 0.58 → P0.1 0.74 (+0.16)", GREEN);

heading("1.5 P0.2 — Skill Contract + Tool Mapping");
bullet("SkillContractRegistry criado: identidade, dominio, schema, risco", GREEN);
bullet("4 contratos built-in + auto-inferencia para 200 skills", GREEN);
bullet("Composio Tool Map: 5 mappings (github, gmail, slack, notion)", GREEN);
bullet("SkillExecutor conectado ao ViseronCore (dead code → REAL)", GREEN);

heading("1.6 P0.3 — Real Mission: Self-Audit");
body("A VISERON escolheu autonomamente a missao 'Architecture Self-Audit & Gap Analysis':");
bullet("5 tarefas decompositas por dominio (3/5 sucesso)", BLUE);
bullet("5 skills executadas atraves do execution fabric", BLUE);
bullet("24 findings em 5 categorias (2 CRITICAL, 11 HIGH)", BLUE);
bullet("Autonomia: 57% (CONTROLLED-PILOT)", BLUE);
bullet("2 blockers descobertos: WebResearchEngine 0 consumers, ParallelOrchestrator 0 instantiations", BLUE);

heading("1.7 P0.4 — Autonomous Research + Real DAG");
bullet("WebResearchEngine REAL: fetch Wikipedia → quality gate → 7 chunks no LTM", GREEN);
bullet("StandaloneParallelOrchestrator: DAG 5 nos, 4 concorrentes", GREEN);
bullet("Failure isolation PROVEN: 2 nodes BLOCKED nao derrubaram o DAG", GREEN);
bullet("Skill coverage: 97.5% executavel (200 auto-inferidas)", GREEN);
bullet("Autonomia: 68% (+11%)", GREEN);

heading("1.8 P0.5 — Unknown Mission Challenge");
body("A VISERON gerou 3 candidatas, pontuou e selecionou sozinha:");
bullet("Selecionou: Agent Failure Recovery Protocol Design (novelty 9/10)", GREEN);
bullet("4 knowledge gaps detectados com confidence=0.00", GREEN);
bullet("2 fontes web reais indexadas (13 chunks)", GREEN);
bullet("DAG 6 nos com falha controlada isolada", GREEN);
bullet("Artefato: protocolo de 7 secoes verificado por agente independente", GREEN);
bullet("Autonomia: 77% (+9%)", GREEN);

heading("1.9 P0.6 — Autonomous Improvement Cycle");
bullet("Auto-diagnostico: 5 gargalos identificados de 494 execution records", GREEN);
bullet("AgentAutoRouter: 9 agentes, 8 dominios, scoring deterministico", GREEN);
bullet("Skill effectiveness: 28 skills classificadas (HIGH_VALUE/USEFUL/NEUTRAL/UNPROVEN)", GREEN);
bullet("Contract performance tracking por skill", GREEN);
bullet("Autonomia: 82% (+5%)", GREEN);

heading("1.10 P0.7 — Real LLM Autonomy Gate");
body("O momento decisivo: Ollama qwen2.5:3b entrou em operacao real:");
bullet("Health check: 8.9s latency, resposta real verificada", GREEN);
bullet("8 skills executadas com provider=ollama (zero fallbacks)", GREEN);
bullet("Missao: Prompt Injection Defense Framework (score 45)", GREEN);
bullet("Autonomia: 91% REAL AUTONOMOUS (+9%)", GREEN);

heading("1.11 P0.8 — Engineering Intelligence");
body("2 repositorios externos auditados sem copiar cegamente:");
bullet("mattpocock/skills (214.6k stars, MIT): 30 skills de engenharia", BLUE);
bullet("VulnClaw (2.7k stars, MIT): 50 skills de seguranca (Python, nao integrado)", BLUE);
bullet("11 patterns absorvidos: TDD, code review, evidence-gated completion", BLUE);
bullet("REJEITADO: runtime Python VulnClaw, pip install, pentest execution (HIGH_RISK)", BLUE);

heading("1.12 P0.9 — Engineering Squad");
bullet("Manifesto com 5 agentes: CTO, Developer, QA, Security, Architect", GREEN);
bullet("Workflow de 8 fases: analysis → architecture → security → plan → execution → test → evidence → report", GREEN);
bullet("8/8 fases com respostas reais Ollama", GREEN);
bullet("Baseline: 1 agente 15s → Squad: 5 agentes 42s (8x coverage)", GREEN);

heading("1.13 P1 — Digital Company Expansion");
body("Transformacao de 1 squad em empresa digital completa:");
bullet("5 novos squads: Executive (5), Advanced Engineering (7), Creative (5), Aerospace (4), Security (4)", GREEN);
bullet("30 agentes totais em 7 dominios", GREEN);
bullet("Missao real: startup product proposal (6/6 fases Ollama)", GREEN);
bullet("Classificacao de dominio para 300 skills (7 dominios)", GREEN);

heading("1.14 P2 — Multimodal Audit");
bullet("Wan2.1 VERIFIED: Apache-2.0, 16.8k stars, video generation", BLUE);
bullet("ComfyUI VERIFIED: GPL-3.0, 127k stars (legal review necessario)", BLUE);
bullet("3 tecnologias 404: DuixAvatar, VoiceStudio, Handy (alternativas mapeadas)", BLUE);

heading("1.15 P2.1 — Wan2.1 Fabric");
bullet("Wan21Provider: deteccao de ambiente, health check, generate()", GREEN);
bullet("CLI: npm run wan21 status/health/benchmark/verify", GREEN);
bullet("Reality Gate: 7/12 PASS, 5 BLOCKED (sem GPU/PyTorch/Wan2.1/modelo)", GREEN);
bullet("VERDICT: BLOCKED honesto — fabric pronto, hardware pendente", GREEN);

heading("1.16 P2.2 — Infraestrutura");
bullet("Maquina atual: i5-1235U, 8GB RAM, Intel UHD (sem CUDA)", BLUE);
bullet("Recomendacao: RTX 4090 ($1.600) — 24GB VRAM, melhor ROI", BLUE);
bullet("Aluguel primeiro: RunPod RTX 4090 $0.44/hr", BLUE);
bullet("Custo: $198/mo local, $250-400/mo hibrido", BLUE);

heading("1.17 P2.3 + P3 + P4 + FREEZE + GOLDEN");
bullet("Migracao Foundation: UpCloud EPYC 7542, 256GB, Windows Server 2025", GREEN);
bullet("Golden Backup System: backup.ps1 + restore.ps1 + verify.ps1", GREEN);
bullet("5 bugs PowerShell corrigidos (encoding, paths, wildcards, nesting)", GREEN);
bullet("Production Awakening: 8/8 respostas Ollama startup blueprint", GREEN);
bullet("Freeze: tag v7.0-pre-migration (local, sem push)", GREEN);
bullet("Golden Backup Final: 22.948 arquivos, 908MB, SHA-256 100%", GREEN);
bullet("Restore test: PASSED em ambiente temporario", GREEN);

// ═══════════════════════════════════════════
// PARTE 2 — INVENTARIO COMPLETO
// ═══════════════════════════════════════════
sectionBar("PARTE 2 — INVENTARIO COMPLETO DO BACKUP", "Tudo o que esta salvo e protegido (22.948 arquivos, 908MB)");

heading("2.1 Componentes Incluidos no Backup Golden");
tbl(
  ["Componente", "Qtd.", "Localizacao", "Backup?"],
  [
    ["Codigo TypeScript", "249", "src/", "SIM"],
    ["Scripts CLI", "109", "scripts/", "SIM"],
    ["Testes", "7", "tests/", "SIM"],
    ["Agent specs", "10", "src/omega/agent-runtime/specs/", "SIM"],
    ["Squad manifests", "12", "src/omega/squads/manifests/", "SIM"],
    ["Skills", "1.997", "skills/vendor/ (10 colecoes)", "SIM"],
    ["Memoria LTM", "20.000 regs", "database/memory/", "SIM"],
    ["Knowledge Graph", "4.278 nos", "graphify-out/", "SIM"],
    ["Experiencia", "177KB", "data/state/experience-index.jsonl", "SIM"],
    ["Auditorias", "43 dirs", "data/audit/", "SIM"],
    ["Relatorios", "20+", "data/", "SIM"],
    ["Migracao scripts", "3", "scripts/migration/", "SIM"],
    [".env secrets", "36 chaves", ".env", "NAO (manual)"],
    ["Wallet Solana", "keypair+seed", "contracts/", "NAO (manual)"],
  ]
);

heading("2.2 Arquivos Criticos Que NAO Podem Ser Perdidos");
bullet("src/ — todo o codigo da inteligencia (249 arquivos)", RED);
bullet("data/ — auditorias, conhecimento, historico completo (43 dirs)", RED);
bullet("skills/vendor/ — 1.997 skills (gitignored, so local)", RED);
bullet("database/memory/ — LTM 20.000 registros", RED);
bullet("graphify-out/ — knowledge graph (4.278 nos, 8.275 arestas)", RED);
bullet(".env — 36 chaves (Twilio, Avirato, Gmail, Cloudflare, Database, JWT)", RED);
bullet("contracts/solana-keypair.json — chave privada wallet", RED);
bullet("contracts/solana-seed.txt — frase BIP39 (12 palavras)", RED);
bullet("contracts/wallets/ — 50+ carteiras de clientes", RED);

// ═══════════════════════════════════════════
// PARTE 3 — GUIA PASSO A PASSO
// ═══════════════════════════════════════════
sectionBar("PARTE 3 — GUIA DE MIGRACAO PASSO A PASSO", "26 passos detalhados: da preparacao a validacao final");

heading("3.1 Preparacao na Maquina Atual (Laptop)");
stepBox("1", "Verificar Golden Backup",
  "O backup final ja foi criado em backups/golden-final-v70 com SHA-256 verificado.",
  "dir backups\\golden-final-v70");
stepBox("2", "Verificar Integridade (14 checks)",
  "Roda manifest + SHA-256 + estrutura + skills + memoria + graph.",
  "powershell -ExecutionPolicy Bypass -File scripts\\migration\\verify.ps1 -BackupDir \"C:\\Trinnity-Viseron-System\\backups\\golden-final-v70\"");
stepBox("3", "Transferir Backup (908MB)",
  "Usar SFTP, SCP, USB ou drive criptografado. NUNCA email ou GitHub.",
  "sftp usuario@ip-servidor  →  put -r backups/golden-final-v70");

heading("3.2 Transferencia de Secrets (Canal Separado)");
body("REGRA DE OURO: backup e secrets NUNCA no mesmo canal. NUNCA na mesma mensagem.");
stepBox("4", "Transferir .env (36 chaves)",
  "Canal criptografado: Signal, WhatsApp self-destruct, password manager.");
stepBox("5", "Transferir solana-keypair.json",
  "Chave privada. Canal SEPARADO do .env.");
stepBox("6", "Transferir solana-seed.txt",
  "Frase BIP39. Canal SEPARADO da keypair.");
stepBox("7", "Transferir contracts/wallets/ + Wallet_ACESSO.txt",
  "Carteiras de clientes. Arquivo criptografado com senha.");

heading("3.3 Instalacao no Novo Servidor");
stepBox("8", "Instalar Node.js v24 LTS",
  "Runtime do sistema VISERON.",
  "winget install OpenJS.NodeJS.LTS");
stepBox("9", "Instalar Python 3.13",
  "Necessario para Wan2.1 e integracoes multimodais futuras.",
  "winget install Python.Python.3.13");
stepBox("10", "Instalar Git",
  "Para gerenciar o repositorio.",
  "winget install Git.Git");
stepBox("11", "Instalar Ollama",
  "Provedor LLM local que roda os 30 agentes.",
  "winget install Ollama.Ollama");
stepBox("12", "Instalar 7-Zip",
  "Para extrair backups.",
  "winget install 7zip.7zip");

heading("3.4 Restauracao do Sistema");
stepBox("13", "Restaurar Backup para C:\\tvs",
  "O script verifica SHA-256 de TODOS os arquivos antes de restaurar.",
  "powershell -ExecutionPolicy Bypass -File scripts\\migration\\restore.ps1 -BackupDir \"C:\\backup\\golden-final-v70\" -TargetRoot \"C:\\tvs\"");
stepBox("14", "Colocar .env em C:\\tvs",
  "Copiar o arquivo transferido manualmente.");
stepBox("15", "Colocar carteiras em C:\\tvs\\contracts",
  "solana-keypair.json + solana-seed.txt + wallets/.");
stepBox("16", "Instalar dependencias",
  "Baixa todas as bibliotecas do package.json.",
  "cd C:\\tvs  →  npm install");
stepBox("17", "Compilar o sistema",
  "TypeScript → JavaScript.",
  "npm run build");
stepBox("18", "Baixar modelos de IA",
  "Modelos qwen2.5 que alimentam os agentes.",
  "ollama pull qwen2.5:3b  →  ollama pull qwen2.5:7b");
stepBox("19", "Reinstalar skills (se necessario)",
  "So se skills/vendor nao veio no backup. O GOLDEN ja inclui.",
  "npm run skills:install");

heading("3.5 Validacao Obrigatoria Antes do Primeiro Uso");
stepBox("20", "Rodar TODOS os testes",
  "67 testes: core, web, omega, OS, restart, vertical slice.",
  "npm test");
stepBox("21", "Verificar saude da API",
  "Status OK com contagens.",
  "GET http://localhost:32123/api/health");
stepBox("22", "Testar o JARVIS",
  "Mensagem de teste com resposta real.",
  "POST http://localhost:32123/api/jarvis/chat  →  { \"message\": \"ola\" }");
stepBox("23", "Verificar Founder OS",
  "Sistema operacional do Comandante.",
  "npm run founder status");
stepBox("24", "Verificar skills",
  "Deve listar 1.997 skills.",
  "npm run skills:list");
stepBox("25", "Testar Engineering Squad",
  "5 agentes, workflow 8 fases.",
  "npm run p09");
stepBox("26", "Verificar modelos Ollama",
  "qwen2.5:3b e qwen2.5:7b.",
  "ollama list");

// ═══════════════════════════════════════════
// PARTE 4 — ROTACAO DE SEGREDOS
// ═══════════════════════════════════════════
sectionBar("PARTE 4 — ROTACAO DE SEGREDOS (POS-MIGRACAO)", "Chaves que devem ser rotacionadas no novo servidor");

tbl(
  ["Chave", "Acao", "Onde"],
  [
    ["TVS_JWT_SECRET", "Gerar novo valor", "No proprio .env do servidor"],
    ["GMAIL_REFRESH_TOKEN", "Re-autorizar OAuth", "Console Google Cloud → OAuth"],
    ["AVIRATO_CLIENT_SECRET", "Rotacionar", "Dashboard Avirato"],
    ["TWILIO_AUTH_TOKEN", "Rotacionar (recomendado)", "Console Twilio"],
  ]
);

heading("4.1 Regras de Ouro da Migracao");
bullet("LAPTOP ANTIGO NUNCA PARA — continua servindo durante toda a migracao", GREEN);
bullet("BACKUP E SECRETS NUNCA JUNTOS — canais separados sempre", RED);
bullet("SHA-256 SEMPRE VERIFICADO — antes de restaurar qualquer coisa", AMBER);
bullet("NUNCA DELETAR O BACKUP ANTIGO — manter ate validacao 100% do novo", RED);
bullet("TESTES ANTES DE LIGAR PARA O MUNDO — 67 testes + health + JARVIS", GREEN);

// ═══════════════════════════════════════════
// PARTE 5 — RECUPERACAO DE DESASTRE
// ═══════════════════════════════════════════
sectionBar("PARTE 5 — RECUPERACAO DE DESASTRE", "O que fazer se algo der errado");

tbl(
  ["Cenario", "Acao", "Tempo"],
  [
    ["Backup corrompido", "Regenerar com backup.ps1 do laptop", "2h"],
    ["Servidor novo falha", "DNS volta ao laptop antigo", "15 min"],
    ["Secrets perdidos", "Rotacionar tudo + regenerar .env", "4h"],
    ["Ollama nao inicia", "Reinstalar winget + ollama pull", "30 min"],
    ["Skills faltando", "npm run skills:install", "10 min"],
    ["Banco de dados cai", "Reconectar Neon (DATABASE_URL)", "5 min"],
  ]
);

heading("5.1 Ordem de Inicializacao");
codeBlock("1. Ollama (carrega modelos na RAM)");
codeBlock("2. VISERON web server (porta 32123)");
codeBlock("3. Postgres (opcional — Neon cloud funciona)");
codeBlock("4. Qdrant (opcional — fallback in-memory funciona)");

// ═══════════════════════════════════════════
// PARTE 6 — PROXIMOS PASSOS
// ═══════════════════════════════════════════
sectionBar("PARTE 6 — PROXIMOS PASSOS", "Da migracao para a escala global");

heading("6.1 Imediatos (primeira semana)");
bullet("Comprar RTX 4090 (US$1.600) para Wan2.1 + ComfyUI", GREEN);
bullet("Configurar firewall: 32123 publico, resto localhost/VPN", GREEN);
bullet("Agendar backup diario no Task Scheduler", GREEN);
bullet("Rotacionar 4 secrets", GREEN);

heading("6.2 Curto Prazo (1-3 meses)");
bullet("Postgres local (migrar do Neon)", BLUE);
bullet("Qdrant local (substituir fallback)", BLUE);
bullet("Chaves cloud AI para fallback", BLUE);
bullet("ElevenLabs TTS para vozes", BLUE);

heading("6.3 Escala (6-24 meses)");
tbl(
  ["Fase", "Usuarios", "Arquitetura"],
  [
    ["Fase 1", "1-1K", "NODE 01 solo (REAL agora)"],
    ["Fase 2", "1K-10K", "+ NODE 02 GPU"],
    ["Fase 3", "10K-100K", "+ NODE 03 Data"],
    ["Fase 4", "100K-1M", "5 nodes + LB + CDN"],
    ["Fase 5", "1M+", "Multi-region EU/US/APAC"],
  ]
);

heading("6.4 Palavra Final");
body("A VISERON nao e apenas codigo. Sao 30 agentes, 6 squads, 1.997 skills, 20 mil memorias e um grafo de conhecimento que aprende a cada execucao. A migracao para o novo servidor e o passo que transforma o laboratorio em empresa. Nada sera perdido: o backup golden tem SHA-256 verificado em 22.948 arquivos, e o laptop antigo continua funcionando ate o novo servidor estar 100% validado.");
body("Pedro e o fundador. Trinnity e a organizacao. VISERON e a multiplicacao da capacidade.");
body("BUILD THE COMPANY WITHOUT DESTROYING THE FOUNDER.");

// ═══════════════════════════════════════════
// PAGINA FINAL
// ═══════════════════════════════════════════
doc.addPage();
doc.rect(0, 250, 595, 250).fill(NAVY);
doc.y += 20;
doc.fontSize(22).font("Helvetica-Bold").fillColor(GOLD).text("TRINNITY", { align: "center" });
doc.fontSize(20).font("Helvetica-Bold").fillColor(WHITE).text("VISERON SYSTEM", { align: "center" });
doc.moveDown(1.2);
doc.fontSize(11).font("Helvetica").fillColor(WHITE).text("Manual Completo de Migracao", { align: "center" });
doc.moveDown(1);
doc.strokeColor(GOLD).lineWidth(1.5).moveTo(150, doc.y).lineTo(445, doc.y).stroke();
doc.strokeColor(BLACK);
doc.moveDown(1);
doc.fontSize(14).font("Helvetica-Bold").fillColor(GOLD).text("Pedro Costa", { align: "center" });
doc.fontSize(10).font("Helvetica").fillColor(WHITE).text("Comandante & Fundador — CEO", { align: "center" });
doc.moveDown(0.8);
doc.fontSize(14).font("Helvetica-Bold").fillColor(GOLD).text("Trinnity Hurtado", { align: "center" });
doc.fontSize(10).font("Helvetica").fillColor(WHITE).text("Rainha & Chief Evolution Officer", { align: "center" });
doc.moveDown(2);
doc.fontSize(8).font("Helvetica").fillColor(GRAY).text("www.trinnityviseronsystem.io · github.com/ViseronSystem/trinnity-viseron-system", { align: "center" });
doc.moveDown(0.5);
doc.fontSize(7).font("Helvetica").fillColor(GRAY).text("© 2026 Pedro Costa & Trinnity Hurtado. Todos os direitos reservados.", { align: "center" });

doc.end();

stream.on("finish", () => {
  const sizeKB = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log(`PDF gerado: ${OUT}`);
  console.log(`Tamanho: ${sizeKB} KB`);
});
