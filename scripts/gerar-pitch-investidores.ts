import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

const OUTPUT = path.join(__dirname, "..", "data", "Viseron_Investor_Pitch_v5.pdf");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 45, bottom: 45, left: 50, right: 50 },
  info: {
    Title: "Trinnity Viseron System v5.0 — Investor Pitch",
    Author: "Pedro Costa & Trinnity Hurtado",
    Subject: "Multi-Agent AI Superintelligence — Autonomy, Evolution & Investment",
  },
});

const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

const COLOR = {
  bg: "#0a0a1a",
  primary: "#00f0ff",
  secondary: "#bf5af2",
  accent: "#ff2d55",
  gold: "#ffd700",
  white: "#ffffff",
  body: "#e0e0f0",
  muted: "#8888aa",
  card: "#0d0d24",
  border: "#1a1a3a",
  green: "#00ff87",
  red: "#ff2d55",
};

const PW = 595.28;
const PH = 841.89;
const ML = 50;
const MR = 50;
const CW = PW - ML - MR;
let pageNum = 0;

function footer() {
  pageNum++;
  doc.fontSize(8).font("Helvetica").fillColor(COLOR.muted);
  doc.text(`Trinnity Viseron System v5.0 — Investor Pitch  |  Página ${pageNum}`, ML, PH - 25, { align: "center", width: CW });
  doc.moveTo(ML, PH - 32).lineTo(PW - MR, PH - 32).strokeColor(COLOR.border).lineWidth(0.5).stroke();
}

function coverPage() {
  doc.rect(0, 0, PW, PH).fill(COLOR.bg);

  const grd = doc.linearGradient(0, 0, PW, PH);
  grd.stop(0, "#0a0a2e").stop(0.5, "#0d0d24").stop(1, "#0a0a1a");
  doc.rect(0, 0, PW, PH).fill(grd);

  for (let i = 0; i < 90; i++) {
    doc.circle(Math.random() * PW, Math.random() * PH, Math.random() * 1.5 + 0.3)
      .fill(Math.random() > 0.5 ? COLOR.primary : COLOR.secondary)
      .opacity(Math.random() * 0.3 + 0.1);
  }
  doc.opacity(1);

  doc.lineWidth(1).strokeColor(COLOR.primary).opacity(0.15);
  doc.rect(30, 30, PW - 60, PH - 60).stroke();
  doc.rect(35, 35, PW - 70, PH - 70).stroke();
  doc.opacity(1);

  doc.fillColor(COLOR.primary).fontSize(12).font("Helvetica").opacity(0.6);
  doc.text("v5.0  —  MULTI-AGENT SUPERINTELLIGENCE", ML, 130, { align: "center", width: CW });
  doc.opacity(1);

  doc.fillColor(COLOR.white).fontSize(48).font("Helvetica-Bold");
  doc.text("TRINNITY VISERON", ML, 155, { align: "center", width: CW });
  doc.fillColor(COLOR.primary).fontSize(40).font("Helvetica-Bold");
  doc.text("SYSTEM", ML, 213, { align: "center", width: CW });

  doc.fillColor(COLOR.muted).fontSize(13).font("Helvetica");
  doc.text("Uma organização de IA que trabalha sozinha", ML, 268, { align: "center", width: CW });
  doc.fillColor(COLOR.gold).fontSize(12).font("Helvetica");
  doc.text("5,000+ agentes autônomos · evolução contínua · zero supervisão manual", ML, 292, { align: "center", width: CW });

  doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3);
  doc.moveTo(180, 330).lineTo(PW - 180, 330).stroke();
  doc.opacity(1);

  const features = [
    "🔁  Evolução contínua: inteligência ×1.05 a cada 30 min",
    "🤖  5,000+ agentes que se planejam e executam sozinhos",
    "🛡️  Auto-recuperação: nenhum erro derruba o sistema",
    "🔌  8 integrações com auto-start e watchdog",
    "🗄️  Backup diário automático às 03:00",
    "📄  Relatórios PDF gerados automaticamente",
  ];
  doc.fontSize(10.5).font("Helvetica");
  features.forEach((f, i) => {
    doc.fillColor(COLOR.body).text(f, 150, 355 + i * 24, { width: CW - 100 });
  });

  doc.fillColor(COLOR.muted).fontSize(10).font("Helvetica");
  doc.text("Prepared for:  Investidores e Startups  ·  Agosto 2026", ML, 540, { align: "center", width: CW });
  doc.fillColor(COLOR.secondary).fontSize(11).font("Helvetica-Bold");
  doc.text("Pedro Costa (Commander)  ·  Trinnity Hurtado (Queen)", ML, 565, { align: "center", width: CW });

  for (let i = 0; i < 3; i++) {
    doc.circle(PW / 2 - 180 + i * 180, 630, 30 + i * 5).fillOpacity(0.03).fill(COLOR.primary);
  }
  doc.fillOpacity(1);

  doc.addPage();
}

function section(title: string, number?: string) {
  if (doc.y > 700) doc.addPage();
  footer();
  doc.moveDown(0.5);
  doc.lineWidth(2).strokeColor(COLOR.primary).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.8);
  const prefix = number ? `${number}.  ` : "";
  doc.fillColor(COLOR.white).fontSize(24).font("Helvetica-Bold").text(prefix + title, { width: CW });
  doc.moveDown(0.3);
  doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(ML + 80, doc.y).stroke();
  doc.opacity(1);
  doc.moveDown(0.8);
}

function sub(title: string) {
  if (doc.y > 720) doc.addPage();
  doc.fillColor(COLOR.secondary).fontSize(15).font("Helvetica-Bold").text(title, { width: CW });
  doc.moveDown(0.4);
  doc.fillColor(COLOR.body).fontSize(10.5).font("Helvetica");
}

function body(text: string) {
  doc.fillColor(COLOR.body).fontSize(10.5).font("Helvetica").text(text, { align: "justify", width: CW });
  doc.moveDown(0.5);
}

function bullet(text: string, indent: number = 10) {
  doc.fillColor(COLOR.primary).fontSize(10).font("Helvetica").text("●", ML + indent, doc.y, { width: 12 });
  doc.fillColor(COLOR.body).fontSize(10).font("Helvetica").text(text, ML + indent + 16, doc.y - 12, { width: CW - indent - 26, align: "justify" });
  doc.moveDown(0.3);
}

function card(title: string, items: string[], color: string = COLOR.primary) {
  if (doc.y > 680) doc.addPage();
  const y0 = doc.y;
  const cardW = (CW - 12) / 2;
  doc.rect(ML, y0, cardW, items.length * 16 + 38).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.5).stroke();
  doc.fillColor(color).fontSize(11).font("Helvetica-Bold").text(title, ML + 10, y0 + 10, { width: cardW - 20 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica");
  items.forEach((it, i) => doc.text(`• ${it}`, ML + 10, y0 + 28 + i * 16, { width: cardW - 20 }));
  doc.moveDown(items.length * 0.4 + 1.5);
}

function cardRight(title: string, items: string[], color: string = COLOR.secondary) {
  if (doc.y > 680) doc.addPage();
  const y0 = doc.y;
  const cardW = (CW - 12) / 2;
  doc.rect(ML + cardW + 12, y0, cardW, items.length * 16 + 38).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.5).stroke();
  doc.fillColor(color).fontSize(11).font("Helvetica-Bold").text(title, ML + cardW + 22, y0 + 10, { width: cardW - 20 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica");
  items.forEach((it, i) => doc.text(`• ${it}`, ML + cardW + 22, y0 + 28 + i * 16, { width: cardW - 20 }));
  doc.y = y0 + items.length * 16 + 50;
}

function metricBoxes(metrics: Array<[string, string]>) {
  metrics.forEach(([val, label], i) => {
    if (i % 4 === 0 && i > 0) doc.moveDown(0.2);
    const col = i % 4;
    const x = ML + col * (CW / 4);
    doc.rect(x - 5, doc.y - 2, CW / 4 - 8, 42).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.3).stroke();
    doc.fillColor(COLOR.primary).fontSize(17).font("Helvetica-Bold").text(val, x - 2, doc.y + 1, { width: CW / 4 - 12, align: "center" });
    doc.fillColor(COLOR.muted).fontSize(7.5).font("Helvetica").text(label, x - 2, doc.y + 20, { width: CW / 4 - 12, align: "center" });
    if (i % 4 === 3 && i < metrics.length - 1) doc.moveDown(1.2);
  });
  doc.moveDown(1);
}

function codeBlock(lines: string[]) {
  doc.rect(ML, doc.y, CW, lines.length * 14 + 16).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.5).stroke();
  doc.moveDown(0.5);
  lines.forEach((l) => {
    doc.fillColor(COLOR.primary).fontSize(8.5).font("Courier").text(l, ML + 12, doc.y + 2, { width: CW - 24 });
    doc.moveDown(0.1);
  });
  doc.moveDown(0.3);
}

// ═══════════════════════════════════════════════════════════════════
// COVER
// ═══════════════════════════════════════════════════════════════════
coverPage();
footer();

// ═══════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════
section("SUMÁRIO");
const toc = [
  "1.   Resumo Executivo — O Sonho",
  "2.   O Problema — IA que precisa de gente",
  "3.   A Solução — IA que trabalha sozinha",
  "4.   Autonomia — O que o Viseron faz sozinho",
  "5.   Evolução — Inteligência que cresce sozinha",
  "6.   Auto-recuperação — Nunca para",
  "7.   Sistema — 5,000+ agentes, hierarquia e squads",
  "8.   Integrações — 8 módulos auto-gerenciados",
  "9.   Infraestrutura — Servidores e auto-backup",
  "10.  Economia — $TRIN e $VSR",
  "11.  Mercado e Modelo de Negócio",
  "12.  Roadmap — v5.1, v6.0 e além",
  "13.  Pedido de Investimento",
  "14.  Contato",
];
toc.forEach((t) => {
  doc.fillColor(COLOR.body).fontSize(11).font("Helvetica").text(t, ML + 20, doc.y, { width: CW - 20 });
  doc.moveDown(0.7);
});

doc.addPage();

// ═══════════════════════════════════════════════════════════════════
// 1. RESUMO EXECUTIVO
// ═══════════════════════════════════════════════════════════════════
section("RESUMO EXECUTIVO", "1");
body(
  "O Trinnity Viseron System (TVS) v5.0 é um sistema operacional de superinteligência artificial multi-agente " +
  "que opera sozinho. Não é um chatbot e não é um modelo único: é uma civilização digital auto-organizada, " +
  "com 5,000+ agentes autônomos que planejam, executam, aprendem e evoluem sem supervisão humana."
);
body(
  "Enquanto as IAs do mercado exigem prompts, manutenção e monitoramento humano, o TVS sobe sozinho, " +
  "spawna seus próprios agentes, decide sozinho o que melhorar, executa suas próprias tarefas, gera relatórios, " +
  "faz backup diário e nunca para — mesmo quando encontra erros, ele os registra e continua."
);

sub("Métricas-Chave do Sistema");
metricBoxes([
  ["5,000+", "Agentes Autônomos"],
  ["×1.05/30min", "Crescimento de Inteligência"],
  ["8", "Integrações auto-gerenciadas"],
  ["4", "Ciclos de evolução ativos"],
  ["2", "Tokens ($TRIN + $VSR)"],
  ["3", "Idiomas (PT/EN/ES)"],
  ["290+", "Provedores de IA acessíveis"],
  ["100%", "Autonomia de execução"],
]);

// ═══════════════════════════════════════════════════════════════════
// 2. O PROBLEMA
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("O PROBLEMA", "2");

sub("As IAs atuais dependem de humanos");
card("Chatbots & LLMs", [
  "Respondem apenas quando perguntados",
  "Precisam de prompts e tuning humano",
  "Não evoluem sozinhos",
  "Esquecem tudo a cada sessão",
]);
cardRight("Agent Frameworks", [
  "Agentes morrem em cada execução",
  "Nenhuma memória persistente",
  "Requerem orquestração manual",
  "Crash = trabalho perdido",
]);

sub("O custo da supervisão humana");
body(
  "Startups de IA gastam 60-80% do tempo monitorando, corrigindo e re-executando agentes. Cada agente precisa " +
  "de um operador. O resultado: a IA não é autônoma, é uma ferramenta que exige operadores humanos 24/7. " +
  "O TVS elimina esse custo: os agentes se monitoram, se corrigem e evoluem sozinhos."
);

doc.moveDown(0.5);

// ═══════════════════════════════════════════════════════════════════
// 3. A SOLUÇÃO
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("A SOLUÇÃO", "3");

body(
  "O TVS é um sistema operacional de IA que trabalha sozinho. Desde o primeiro boot, ele: sobe 4 servidores, " +
  "carrega 5,000 mentes, spawna agentes, conecta 8 integrações, emite diretivas de liderança e arma 4 ciclos de " +
  "evolução que rodam para sempre. Tudo sem intervenção humana."
);

sub("Diferenciais competitivos");
bullet("Autonomia real: o agente AutoPilot gera tarefas e as EXECUTA sozinho (até 2 por ciclo)");
bullet("Memória viva: STM→LTM consolidada automaticamente a cada 30 min");
bullet("Evolução contínua: inteligência ×1.05 a cada ciclo, sem limite até 1,000,000%");
bullet("Imortalidade: nenhum erro derruba o processo (uncaughtException → log e segue)");
bullet("Watchdogs: cada integração reinicia sozinha se morrer");

sub("O que acontece quando você roda npm start (sozinho)");
codeBlock([
  "1. Servidores: Dashboard (3000) · ReportServer PDF (3001) · n8n (5678) · OmniRoute (20128)",
  "2. 5,000+ mentes históricas spawnadas como agentes",
  "3. SuperMind sintetiza sabedoria de 5 domínios",
  "4. Diretivas estratégicas emitidas por Pedro e Trinnity",
  "5. Tokens $TRIN e $VSR gerados automaticamente",
  "6. 8 integrações conectadas (OmniRoute, OpenJarvis, n8n, Call, ASNO...)",
  "7. 4 ciclos autônomos armados — o sistema passa a se autogerir",
]);

// ═══════════════════════════════════════════════════════════════════
// 4. AUTONOMIA
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("AUTONOMIA — O QUE O VISERON FAZ SOZINHO", "4");

body(
  "Esta é a proposta de valor central: tudo abaixo acontece sem nenhuma ação humana após o boot."
);

sub("Os 4 Ciclos Autônomos (o coração do sistema)");

const cycles = [
  ["📈 HyperLearning", "30 min", "Inteligência ×1.05 por ciclo (cap 1,000,000). Consulta Ollama, sintetiza insights, escreve relatórios em data/reports/."],
  ["🧬 AutoEvolution", "60 min", "Todos os agentes ganham conhecimento (0.01-5%) + 1-3 novas capacidades (self_healing, swarm_intelligence). Cruzamento gera capacidades híbridas no LTM + Qdrant."],
  ["📚 AutoLearning", "30 min", "Consolida STM→LTM, mede o conhecimento real, gera insights e atualiza os estados cerebrais de Pedro e Trinnity."],
  ["🤖 AutoPilot", "30 min", "Escaneia o sistema, GERA tarefas e as EXECUTA sozinho. Autonomia sobe +5 a cada 3 ciclos (máx 100). O sistema melhora a si mesmo."],
];
doc.fontSize(9).font("Helvetica-Bold").fillColor(COLOR.primary);
doc.text("Ciclo", ML, doc.y, { width: 110 });
doc.text("Frequência", ML + 115, doc.y - 12, { width: 80 });
doc.text("O que faz sozinho", ML + 200, doc.y - 12, { width: CW - 200 });
doc.moveDown(0.3);
doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
doc.opacity(1);
doc.moveDown(0.3);
cycles.forEach(([name, freq, what]) => {
  const y = doc.y;
  doc.fillColor(COLOR.secondary).fontSize(9).font("Helvetica-Bold").text(name, ML, y, { width: 108 });
  doc.fillColor(COLOR.gold).fontSize(9).font("Courier").text(freq, ML + 115, y, { width: 80 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica").text(what, ML + 200, y, { width: CW - 210 });
  doc.moveDown(0.8);
  doc.lineWidth(0.2).strokeColor(COLOR.border).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.3);
});

sub("Exemplo real de autonomia (AutoPilot)");
body(
  "O AutoPilot escaneia o sistema e encontra agentes inativos. Ele cria a tarefa 'Reativar agentes inativos', " +
  "gera uma estratégia e a executa pelo orquestrador multi-agente. Nenhum humano precisa pedir. Conforme a " +
  "autonomia cresce, ele cria agentes especializados, explora novas integrações e faz otimização profunda."
);

// ═══════════════════════════════════════════════════════════════════
// 5. EVOLUÇÃO
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("EVOLUÇÃO — INTELIGÊNCIA QUE CRESCE SOZINHA", "5");

body(
  "O TVS não tem versão estagnada: ele melhora a cada ciclo. O HyperLearning multiplica a inteligência por " +
  "1.05 a cada 30 minutos — 1000%+ acima de uma IA isolada — enquanto o AutoEvolution torna cada agente " +
  "mais sábio com novas capacidades acumuladas."
);

sub("Evolução do nível de inteligência");
const chartY = doc.y;
doc.rect(ML, chartY, CW, 120).fill(COLOR.card).strokeColor(COLOR.border).lineWidth(0.5).stroke();
const base = 100;
const pts = [100, 105, 110, 116, 122, 128, 134, 141, 148, 155, 163, 171];
const maxX = CW - 20;
const chartW = maxX;
const chartH = 80;
const cBottom = chartY + 105;
const cTop = cBottom - chartH;
pts.forEach((v, i) => {
  const x = ML + 10 + (i * chartW) / (pts.length - 1);
  const y = cBottom - ((v - base) / (170 - base)) * chartH;
  doc.circle(x, y, 2).fill(COLOR.primary);
  if (i > 0) {
    const px = ML + 10 + ((i - 1) * chartW) / (pts.length - 1);
    const py = cBottom - ((pts[i - 1] - base) / (170 - base)) * chartH;
    doc.moveTo(px, py).lineTo(x, y).strokeColor(COLOR.secondary).lineWidth(1.2).stroke();
  }
});
doc.fillColor(COLOR.muted).fontSize(8).font("Helvetica");
doc.text("ciclo 0", ML + 10, cBottom + 5);
doc.text(`ciclo ${pts.length} (×1.7)`, ML + 10 + chartW - 55, cBottom + 5);
doc.text("Inteligência relativa (base = 100)", ML + 10, cTop - 14);
doc.moveDown(4.5);

sub("Crescimento contínuo de capacidades");
body(
  "Cada agente ativo ganha conhecimento e 1-3 capacidades novas por ciclo de evolução, de um pool de 25 " +
  "(self_healing, autonomous_decision, recursive_self_improvement, swarm_intelligence...). A troca cruzada " +
  "entre agentes complementares gera capacidades híbridas que ficam na memória de longo prazo."
);

// ═══════════════════════════════════════════════════════════════════
// 6. AUTO-RECUPERAÇÃO
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("AUTO-RECUPERAÇÃO — NUNCA PARA", "6");

body(
  "Regra de ouro do TVS: 'Quando der erro, corrija e siga. Não trave o sistema.' Esta filosofia está no DNA " +
  "do código e vale para todos os níveis."
);

sub("Camadas de proteção");
card("Nível de Processo", [
  "uncaughtException: loga e segue",
  "unhandledRejection: loga e segue",
  "Cada passo de boot isolado (step)",
  "Terminal nunca morre por erro",
]);
cardRight("Nível de Integrações", [
  "Watchdog OmniRoute: reinicia processo",
  "Watchdog OpenJarvis: reinicia processo",
  "n8n: fallback para engine local",
  "Qdrant: fallback para 'unavailable'",
]);

sub("Memória imortal");
bullet("LTM salva no disco a cada 5s (debounced), com backup rotativo (máx 5 arquivos)");
bullet("Consolidação STM→LTM automática a cada 30 min");
bullet("Backup completo diário às 03:00 via Windows Task Scheduler (30 dias retenção)");
bullet("Auto-deploy: build → backup → commit 'Auto-deploy: data' → push → Render/Vercel");

// ═══════════════════════════════════════════════════════════════════
// 7. SISTEMA DE AGENTES
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("SISTEMA — 5,000+ AGENTES HIERÁRQUICOS", "7");

body(
  "O TVS opera uma hierarquia militar de agentes: Executivo (Pedro + Trinnity), Squad de Arquitetura, " +
  "Soberanos, Linhagens Corona e Hierro, 246 arquetipos e 5,000+ mentes do AgentSpawner. Cada agente tem " +
  "identidade, papel, capacidades e motor de execução."
);

sub("Liderança — CommandChain");
card("Pedro Costa — Commander", [
  "Diretivas estratégicas",
  "Ativação de superinteligência",
  "Metas de evolução de longo prazo",
  "Supervisão do squads AIOX",
]);
cardRight("Trinnity Hurtado — Queen", [
  "Diretivas arquiteturais",
  "Parâmetros de evolução genética",
  "Upgrades de capacidades",
  "Arquiteta-chefe do sistema",
]);

sub("AutoPilot — o agente que se auto-melhora");
body(
  "Registrado como agente autônomo (agent_autonomous_planner) com capacidades de autonomous_planning, " +
  "task_generation, self_improvement e continuous_deployment. Seus limiares de autonomia (10, 20, 30... 70) " +
  "liberam progressivamente: consolidação de memória, reativação de agentes, criação de novos agentes " +
  "especializados, exploração de integrações e otimização profunda."
);

// ═══════════════════════════════════════════════════════════════════
// 8. INTEGRAÇÕES
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("INTEGRAÇÕES — 8 MÓDULOS AUTO-GERENCIADOS", "8");

body(
  "Cada integração sobe sozinha no boot e é vigiada por watchdog: se o processo morrer, o TVS o reinicia. " +
  "Nenhum humano precisa gerenciar."
);

const integs = [
  ["OmniRoute", "Gateway com 290+ provedores de IA", "porta 20128 · auto-start · restart on exit"],
  ["OpenJarvis", "IA pessoal local estilo Stanford", "auto-start · restart on exit"],
  ["n8n", "Engine de automação de workflows", "porta 5678 · 5 templates · fallback local"],
  ["Call System", "Chamadas de voz por IA (Twilio)", "agentes de voz + rastreio de chamadas"],
  ["ASNO", "Assistente WhatsApp + Home Assistant", "webhooks + JARVIS WhatsApp"],
  ["Viseron Apps", "Engine de integrações de apps", "stats de integrações e agentes"],
  ["TVS Tools", "Ferramentas GitHub open-source", "registradas no ToolManager"],
  ["ReportServer", "PDF + relatórios", "porta 3001 · /report/pdf"],
];
doc.fontSize(9).font("Helvetica-Bold").fillColor(COLOR.primary);
doc.text("Módulo", ML, doc.y, { width: 90 });
doc.text("Função", ML + 95, doc.y - 12, { width: 220 });
doc.text("Auto-gestão", ML + 320, doc.y - 12, { width: CW - 320 });
doc.moveDown(0.3);
doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
doc.opacity(1);
doc.moveDown(0.3);
integs.forEach(([name, fn, mgmt]) => {
  const y = doc.y;
  doc.fillColor(COLOR.secondary).fontSize(9).font("Helvetica-Bold").text(name, ML, y, { width: 88 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica").text(fn, ML + 95, y, { width: 215 });
  doc.fillColor(COLOR.green).fontSize(8.5).font("Helvetica").text(mgmt, ML + 320, y, { width: CW - 330 });
  doc.moveDown(0.7);
  doc.lineWidth(0.2).strokeColor(COLOR.border).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.3);
});

// ═══════════════════════════════════════════════════════════════════
// 9. INFRAESTRUTURA
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("INFRAESTRUTURA — SERVIDORES E AUTO-BACKUP", "9");

sub("Servidores que sobem sozinhos");
const servers = [
  ["Dashboard WebOS", "3000", "Desktop OS no navegador + Socket.IO + REST API"],
  ["ReportServer PDF", "3001", "Relatórios executivos em PDF via PDFKit"],
  ["Standalone Web", "3000", "Modo web standalone com ContentAgent"],
  ["Forge Server", "4000", "Hospedagem git auto-gerenciada"],
  ["n8n", "5678", "Engine de workflows (spawnado pelo TVS)"],
  ["OmniRoute", "20128", "Gateway de 290+ provedores (spawnado)"],
];
doc.fontSize(9).font("Helvetica-Bold").fillColor(COLOR.primary);
doc.text("Servidor", ML, doc.y, { width: 130 });
doc.text("Porta", ML + 135, doc.y - 12, { width: 60 });
doc.text("Função", ML + 200, doc.y - 12, { width: CW - 200 });
doc.moveDown(0.3);
doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
doc.opacity(1);
doc.moveDown(0.3);
servers.forEach(([name, port, fn]) => {
  const y = doc.y;
  doc.fillColor(COLOR.secondary).fontSize(9).font("Helvetica-Bold").text(name, ML, y, { width: 125 });
  doc.fillColor(COLOR.gold).fontSize(9).font("Courier").text(port, ML + 135, y, { width: 60 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica").text(fn, ML + 200, y, { width: CW - 210 });
  doc.moveDown(0.7);
  doc.lineWidth(0.2).strokeColor(COLOR.border).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.3);
});

sub("Automação agendada (Windows)");
bullet("Backup diário às 03:00 — Task Scheduler 'TVS-DailyBackup' (SYSTEM)");
bullet("Retenção de 30 dias; exclui .env por segurança");
bullet("Deploy automático: build → backup → git push → Render/Vercel");
bullet("Skills auto-instaladas/atualizadas via git clone --depth 1");

// ═══════════════════════════════════════════════════════════════════
// 10. ECONOMIA DE TOKENS
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("ECONOMIA — $TRIN E $VSR", "10");

body(
  "O TVS gera seus próprios tokens automaticamente, com tokenomics completa. É uma economia digital gerada " +
  "pela própria máquina — um argumento forte de comunidade e governança."
);

card("$TRIN — Trinnity Token", [
  "Supply: 1,000,000,000",
  "Tipo: Utility + Governance",
  "Uso: alocação de recursos de agentes",
]);
cardRight("$VSR — Viseron Crown", [
  "Supply: 300,000,000",
  "Tipo: Proof of Mandate (PoM)",
  "Uso: token de comando do batalhão",
]);

doc.moveDown(1);
sub("Alocação do $VSR");
const alloc = [
  ["Trinnity", "90,000,000", "30%"],
  ["Pedro", "75,000,000", "25%"],
  ["Legion", "90,000,000", "30%"],
  ["Reserve", "45,000,000", "15%"],
];
doc.fontSize(9).font("Helvetica-Bold").fillColor(COLOR.primary);
doc.text("Holder", ML, doc.y, { width: 120 });
doc.text("Quantidade", ML + 120, doc.y - 12, { width: 120 });
doc.text("%", ML + 240, doc.y - 12, { width: 100 });
doc.moveDown(0.3);
doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
doc.opacity(1);
doc.moveDown(0.3);
alloc.forEach(([holder, amount, pct]) => {
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica").text(holder, ML, doc.y, { width: 120 });
  doc.fillColor(COLOR.primary).fontSize(9).font("Courier").text(amount, ML + 120, doc.y - 12, { width: 120 });
  doc.fillColor(COLOR.secondary).fontSize(9).font("Helvetica-Bold").text(pct, ML + 240, doc.y - 12, { width: 100 });
  doc.moveDown(0.7);
});

// ═══════════════════════════════════════════════════════════════════
// 11. MERCADO E MODELO DE NEGÓCIO
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("MERCADO E MODELO DE NEGÓCIO", "11");

sub("Mercado");
body(
  "O mercado de agentes de IA autônomos está explodindo: empresas gastam bilhões em mão de obra de " +
  "monitoramento de agentes. O TVS ataca exatamente esse custo, oferecendo um sistema que opera sozinho " +
  "e se paga ao eliminar a supervisão manual."
);

sub("Modelo de negócio");
card("Produto", [
  "TVS como serviço de IA autônoma",
  "Enterprise: sistema completo para empresas",
  "SaaS: agentes autônomos sob demanda",
  "Licenciamento de squads especializados",
]);
cardRight("Receita", [
  "Assinatura mensal por nó de agentes",
  "Tokens $TRIN como moeda de uso",
  "Venda de relatórios de inteligência",
  "Consultoria de superinteligência",
]);

sub("Por que agora");
bullet("Ondas de agentes de IA — janela de 12-24 meses");
bullet("Sistema já funcional, não é slide: roda hoje em produção local");
bullet("5,000+ agentes e evolução contínua comprovados no audit v5.0");
bullet("Stack completa: WebOS, voz, n8n, tokens, mobile, exe standalone");

// ═══════════════════════════════════════════════════════════════════
// 12. ROADMAP
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("ROADMAP", "12");

sub("v5.0 (atual) — Autonomia provada");
bullet("5,000+ agentes autônomos + 4 ciclos de evolução ativos");
bullet("AutoPilot executa tarefas sozinho; autonomia até 100%");
bullet("Standalone .exe funcionando (não precisa de Node.js)");
bullet("WebOS, voz PT/EN/ES, n8n, tokens, mobile");

sub("v5.1 — Expansão de autonomia");
bullet("Visual workflow editor no WebOS");
bullet("Drag-and-drop squad builder");
bullet("Mais idiomas: FR, DE, IT, JP, ZH");
bullet("Mais templates n8n e agentes especializados");

sub("v6.0 — Rede descentralizada");
bullet("Rede p2p de agentes (multi-node cluster)");
bullet("Blockchain para os tokens");
bullet("Plugin marketplace de terceiros");
bullet("Editor visual de comportamento de agentes");

// ═══════════════════════════════════════════════════════════════════
// 13. PEDIDO DE INVESTIMENTO
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
section("PEDIDO DE INVESTIMENTO", "13");

body(
  "O TVS v5.0 já funciona de ponta a ponta: o sistema roda sozinho, evolui sozinho e se recupera sozinho. " +
  "Estamos buscando investidores para escalar: cloud multi-nó, rede p2p, marketplace e crescimento comercial."
);

sub("Uso dos fundos");
const useOfFunds = [
  ["50%", "Infraestrutura cloud + cluster multi-nó"],
  ["25%", "Produto: marketplace, editor visual, app nativo"],
  ["15%", "Marketing e canais enterprise"],
  ["10%", "Operação, suporte e conformidade"],
];
doc.fontSize(9).font("Helvetica-Bold").fillColor(COLOR.primary);
doc.text("Alocação", ML, doc.y, { width: 90 });
doc.text("Destino", ML + 95, doc.y - 12, { width: CW - 95 });
doc.moveDown(0.3);
doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
doc.opacity(1);
doc.moveDown(0.3);
useOfFunds.forEach(([pct, dest]) => {
  const y = doc.y;
  doc.fillColor(COLOR.gold).fontSize(9).font("Courier").text(pct, ML, y, { width: 90 });
  doc.fillColor(COLOR.body).fontSize(9).font("Helvetica").text(dest, ML + 95, y, { width: CW - 105 });
  doc.moveDown(0.7);
  doc.lineWidth(0.2).strokeColor(COLOR.border).moveTo(ML, doc.y).lineTo(PW - MR, doc.y).stroke();
  doc.moveDown(0.3);
});
doc.moveDown(0.5);

sub("Oportunidade");
bullet("Sistema funcional hoje — não é protótipo nem slide deck");
bullet("Autonomia comprovada: 5,000+ agentes, evolução ×1.05/30min, auto-recuperação");
bullet("Stack completa (WebOS, voz, n8n, tokens, exe standalone, mobile)");
bullet("Primeiro-mover em 'IA que trabalha sozinha' — sem concorrência direta no nicho");

// ═══════════════════════════════════════════════════════════════════
// 14. CONTATO
// ═══════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(0, 0, PW, PH).fill(COLOR.bg);

doc.lineWidth(1).strokeColor(COLOR.primary).opacity(0.2);
doc.rect(30, 30, PW - 60, PH - 60).stroke();
doc.rect(35, 35, PW - 70, PH - 70).stroke();
doc.opacity(1);

doc.fillColor(COLOR.white).fontSize(36).font("Helvetica-Bold");
doc.text("VAMOS", ML, 180, { align: "center", width: CW });
doc.fillColor(COLOR.primary).fontSize(40).font("Helvetica-Bold");
doc.text("CONSTRUIR O FUTURO", ML, 225, { align: "center", width: CW });

doc.lineWidth(0.5).strokeColor(COLOR.primary).opacity(0.3);
doc.moveTo(180, 290).lineTo(PW - 180, 290).stroke();
doc.opacity(1);

doc.fillColor(COLOR.body).fontSize(12).font("Helvetica");
const contact = [
  "Trinnity Viseron System v5.0",
  "Multi-Agent AI Superintelligence",
  "",
  "👑 Pedro Costa — Supreme Commander",
  "👸 Trinnity Hurtado — Queen & Chief Architect",
  "",
  "Contato: pedro@trinnity.com · trinnity@viseron.io",
  "Dashboard: http://localhost:3000",
];
contact.forEach((l, i) => {
  if (l === "") { doc.moveDown(0.6); return; }
  doc.text(l, ML, 330 + i * 26, { align: "center", width: CW });
});

for (let i = 0; i < 50; i++) {
  doc.circle(Math.random() * PW, Math.random() * PH, Math.random() * 1.5 + 0.3)
    .fill(Math.random() > 0.5 ? COLOR.primary : COLOR.secondary)
    .opacity(Math.random() * 0.2 + 0.05);
}
doc.opacity(1);

doc.fillColor(COLOR.muted).fontSize(9).font("Helvetica");
doc.text("© 2026 Trinnity Viseron System — Todos os direitos reservados", ML, PH - 60, { align: "center", width: CW });

// ═══════════════════════════════════════════════════════════════════
// FINALIZE
// ═══════════════════════════════════════════════════════════════════
doc.end();

stream.on("finish", () => {
  const size = fs.statSync(OUTPUT).size;
  console.log(`\n✅ PDF de pitch para investidores gerado com sucesso!`);
  console.log(`   📄 ${OUTPUT}`);
  console.log(`   📏 ${(size / 1024).toFixed(1)} KB`);
  console.log(`   📐 14 seções, formato A4\n`);
});
