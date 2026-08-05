import * as fs from "fs";
import * as path from "path";
import PDFDocument from "pdfkit";

// ═══════════════════════════════════════════════════════════
// FICHEIRO DE VISÃO DO PROJETO — TRINNITY VISERON SYSTEM v5.0
// Trilíngue: PT / EN / ES
// © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
// ═══════════════════════════════════════════════════════════

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(OUT_DIR, "Viseron_Ficheiro_Visao.pdf");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// CORES
const DARK = "#030310";
const NEON = "#00f0ff";
const PURPLE = "#bf5af2";
const GREEN = "#30d158";
const ORANGE = "#ff9f0a";
const WHITE = "#e8e8f4";
const GRAY = "#6e6e8a";
const CARD_BG = "#0a0a20";
const CARD_BORDER = "#1a1a35";

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  bufferPages: true,
  info: {
    Title: "TVS — Ficheiro de Visão do Projeto | Project Vision File | Archivo de Visión del Proyecto",
    Author: "Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)",
    Subject: "Trinnity Viseron System v5.0 — Missão, Arquitetura, Roadmap e Estado",
    Keywords: "TVS, Squad AIOX, visão, roadmap, arquitetura, visión",
  },
});

const stream = fs.createWriteStream(OUT_FILE);
doc.pipe(stream);

const W = doc.page.width;
const H = doc.page.height;
const MARGIN = 48;
const CONTENT_W = W - MARGIN * 2;

let pageNum = 0;

function fullBg(color: string = DARK) {
  doc.rect(0, 0, W, H).fill(color);
}

function drawGrid() {
  doc.save();
  doc.opacity(0.04);
  const step = 28;
  doc.strokeColor(NEON).lineWidth(0.4);
  for (let x = 0; x < W; x += step) doc.moveTo(x, 0).lineTo(x, H).stroke();
  for (let y = 0; y < H; y += step) doc.moveTo(0, y).lineTo(W, y).stroke();
  doc.restore();
}

function drawCornerDecor() {
  doc.save();
  doc.opacity(0.35);
  doc.strokeColor(NEON).lineWidth(1.5);
  const s = 22;
  doc.moveTo(MARGIN - 14, MARGIN - 14).lineTo(MARGIN - 14 + s, MARGIN - 14).stroke();
  doc.moveTo(MARGIN - 14, MARGIN - 14).lineTo(MARGIN - 14, MARGIN - 14 + s).stroke();
  doc.moveTo(W - MARGIN + 14, MARGIN - 14).lineTo(W - MARGIN + 14 - s, MARGIN - 14).stroke();
  doc.moveTo(W - MARGIN + 14, MARGIN - 14).lineTo(W - MARGIN + 14, MARGIN - 14 + s).stroke();
  doc.moveTo(MARGIN - 14, H - MARGIN + 14).lineTo(MARGIN - 14 + s, H - MARGIN + 14).stroke();
  doc.moveTo(MARGIN - 14, H - MARGIN + 14).lineTo(MARGIN - 14, H - MARGIN + 14 - s).stroke();
  doc.moveTo(W - MARGIN + 14, H - MARGIN + 14).lineTo(W - MARGIN + 14 - s, H - MARGIN + 14).stroke();
  doc.moveTo(W - MARGIN + 14, H - MARGIN + 14).lineTo(W - MARGIN + 14, H - MARGIN + 14 - s).stroke();
  doc.restore();
}

function drawNeonLine(y: number, color: string = NEON, opacity: number = 0.25) {
  doc.save().opacity(opacity);
  doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).strokeColor(color).lineWidth(0.8).stroke();
  doc.restore();
}

function sectionTag(text: string, y: number, color: string = NEON) {
  doc.font("Courier").fontSize(8).fillColor(color).opacity(0.7)
    .text(`// ${text.toUpperCase()}`, MARGIN, y, { characterSpacing: 1.5 });
  doc.opacity(1);
}

function sectionTitle(text: string, y: number, color: string = WHITE, size: number = 20) {
  doc.font("Helvetica-Bold").fontSize(size).fillColor(color)
    .text(text, MARGIN, y, { width: CONTENT_W });
}

function para(text: string, y: number, color: string = WHITE + "bb", size: number = 9, width: number = CONTENT_W): number {
  doc.font("Helvetica").fontSize(size).fillColor(color)
    .text(text, MARGIN, y, { width, lineGap: 3 });
  return doc.y + 10;
}

function card(x: number, y: number, w: number, h: number, accent: string) {
  doc.roundedRect(x, y, w, h, 5).fill(CARD_BG);
  doc.roundedRect(x, y, w, h, 5).strokeColor(CARD_BORDER).lineWidth(0.5).stroke();
  doc.rect(x, y, 2.5, h).fill(accent);
}

function badge(text: string, x: number, y: number, bg: string, fg: string) {
  const tw = doc.font("Courier-Bold").fontSize(7.5).widthOfString(text) + 12;
  doc.roundedRect(x, y - 3, tw, 16, 4).fill(bg + "33");
  doc.roundedRect(x, y - 3, tw, 16, 4).strokeColor(bg).lineWidth(0.6).stroke();
  doc.font("Courier-Bold").fontSize(7.5).fillColor(fg).text(text, x + 6, y + 1);
}

function pageFooter() {
  pageNum++;
  drawNeonLine(H - MARGIN + 8, NEON, 0.12);
  doc.font("Courier").fontSize(7.5).fillColor(GRAY)
    .text(`Trinnity Viseron System v5.0  ·  © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)`, MARGIN, H - MARGIN + 16, { width: CONTENT_W - 60 });
  doc.font("Courier-Bold").fontSize(7.5).fillColor(NEON)
    .text(`${pageNum}`, W - MARGIN - 40, H - MARGIN + 16, { width: 40, align: "right" });
}

function newPage() {
  doc.addPage();
  fullBg();
  drawGrid();
  drawCornerDecor();
}

function newSection() {
  newPage();
  pageFooter();
}

// ═══════════════ CAPA ═══════════════
fullBg();
drawGrid();
drawCornerDecor();
pageFooter();

doc.save().opacity(0.08);
doc.circle(W / 2, 210, 280).fill(NEON);
doc.restore();
doc.save().opacity(0.05);
doc.circle(W - 100, H - 150, 200).fill(PURPLE);
doc.restore();

badge("v5.0 · AI-NATIVE OPERATING SYSTEM", W / 2 - 120, 120, NEON, NEON);
doc.font("Courier").fontSize(8).fillColor(GRAY)
  .text("// TRINNITY VISERON SYSTEM — SQUAD AIOX", MARGIN + 30, 150, { characterSpacing: 2 });

doc.font("Helvetica-Bold").fontSize(34).fillColor(NEON)
  .text("FICHEIRO DE VISÃO", MARGIN, 190, { width: CONTENT_W, align: "center" });
doc.font("Helvetica-Bold").fontSize(34).fillColor(WHITE)
  .text("DO PROJETO", MARGIN, 235, { width: CONTENT_W, align: "center" });
doc.font("Helvetica-Bold").fontSize(18).fillColor(PURPLE)
  .text("Project Vision File · Archivo de Visión del Proyecto", MARGIN, 295, { width: CONTENT_W, align: "center" });

drawNeonLine(360, NEON, 0.4);

doc.font("Helvetica").fontSize(11).fillColor(WHITE + "bb")
  .text("Missão · Arquitetura · Roadmap · Estado Verificado", MARGIN, 390, { width: CONTENT_W, align: "center" });

doc.font("Courier").fontSize(9).fillColor(GRAY)
  .text("© Pedro Costa (Comandante)  ·  Trinnity Hurtado (Rainha)", MARGIN, 600, { width: CONTENT_W, align: "center" });
doc.font("Courier").fontSize(8).fillColor(GRAY + "88")
  .text(`Gerado em ${new Date().toLocaleString()}`, MARGIN, 622, { width: CONTENT_W, align: "center" });

// ═══════════════ MISSÃO / VISÃO / VALORES ═══════════════
newSection();
sectionTag("01 · Missão — Mission — Misión", MARGIN);
sectionTitle("Missão, Visão & Valores", MARGIN + 16);

const blocks: Array<[string, string, string, string, string]> = [
  ["MISSÃO", NEON, "Construir uma superinteligência autónoma de 5000+ mentes que pensa, evolui e trabalha como um organismo vivo, sem limites de memória nem de escala.",
    "MISSION", "Build an autonomous superintelligence of 5000+ minds that thinks, evolves and works as a living organism, with no limits of memory or scale.",
    "MISIÓN", "Construir una superinteligencia autónoma de 5000+ mentes que piensa, evoluciona y trabaja como un organismo vivo, sin límites de memoria ni de escala."],
  ["VISÃO", PURPLE, "Ser o sistema operativo de IA da nova era digital: cada pessoa e cada empresa com uma superinteligência ao serviço da sua visão.",
    "VISION", "Be the AI operating system of the new digital era: every person and every company with a superintelligence serving their vision.",
    "VISIÓN", "Ser el sistema operativo de IA de la nueva era digital: cada persona y cada empresa con una superinteligencia al servicio de su visión."],
  ["VALORES", ORANGE, "Proteger o núcleo · Testar antes de publicar · Documentar cada mudança · Modelos locais quando possível · Nuvem para raciocínio complexo.",
    "VALUES", "Protect the core · Test before deploying · Document every change · Local models when possible · Cloud for complex reasoning.",
    "VALORES", "Proteger el núcleo · Probar antes de publicar · Documentar cada cambio · Modelos locales cuando sea posible · Nube para razonamiento complejo."],
];

let y = MARGIN + 60;
for (const [t1, c1, d1, t2, d2, t3, d3] of blocks) {
  card(MARGIN, y, CONTENT_W, 88, c1);
  badge(t1, MARGIN + 12, y + 10, c1, c1);
  doc.font("Helvetica").fontSize(8.5).fillColor(WHITE + "cc").text(d1, MARGIN + 12, y + 28, { width: CONTENT_W - 24, lineGap: 2 });
  doc.font("Courier").fontSize(7).fillColor(c1 + "99").text(`[${t2}]`, MARGIN + 12, y + 60, { width: 60 });
  doc.font("Helvetica").fontSize(7.5).fillColor(GRAY).text(d2, MARGIN + 78, y + 58, { width: CONTENT_W - 90, lineGap: 2 });
  doc.font("Courier").fontSize(7).fillColor(c1 + "99").text(`[${t3}]`, MARGIN + 12, y + 75, { width: 60 });
  doc.font("Helvetica").fontSize(7.5).fillColor(GRAY).text(d3, MARGIN + 78, y + 73, { width: CONTENT_W - 90, lineGap: 2 });
  y += 98;
}

doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE).text("Propriedade Intelectual — Intellectual Property — Propiedad Intelectual", MARGIN, y + 8);
drawNeonLine(y + 22, PURPLE, 0.3);
y += 30;
card(MARGIN, y, CONTENT_W, 58, PURPLE);
doc.font("Helvetica").fontSize(9).fillColor(WHITE + "dd")
  .text("O Trinnity Viseron System pertence a Pedro Costa (Comandante, TVS Creator) e Trinnity Hurtado (Rainha, TVS Architect). Nenhuma decisão de arquitetura, domínio, receita ou publicidade é tomada sem a sua aprovação.", MARGIN + 14, y + 14, { width: CONTENT_W - 28 });
doc.font("Helvetica").fontSize(8).fillColor(GRAY)
  .text("The TVS belongs to Pedro Costa (Commander) and Trinnity Hurtado (Queen). / El TVS pertenece a Pedro Costa (Comandante) y Trinnity Hurtado (Reina).", MARGIN + 14, y + 40, { width: CONTENT_W - 28 });

// ═══════════════ ARQUITETURA ═══════════════
newSection();
sectionTag("02 · Arquitetura — Architecture — Arquitectura", MARGIN);
sectionTitle("Arquitetura do Sistema", MARGIN + 16);

const archDiagram = `
  ┌──────────────────────────────────────────────────────────────┐
  │                    TRINNITY VISERON SYSTEM v5.0              │
  ├──────────────────────────────────────────────────────────────┤
  │  TVS OS  ─  AI-Native Operating System (Process Manager,     │
  │            Virtual FS, App Store, Package Manager, Security) │
  ├──────────────────────────────────────────────────────────────┤
  │  OMEGA PLATFORM ─ Kernel + EventBus · Agent Runtime (20)     │
  │  Knowledge Graph · AI Router · Autonomy · AIOX Squads (5)    │
  │  Factory Engine · Enterprise Hub · Self-Heal Watchdog        │
  ├──────────────────────────────────────────────────────────────┤
  │  MIND FACTORY ─ 5396 mentes · auto-evolução · providers 290+ │
  │  Ollama local · OpenAI · Claude · Gemini · Grok · OmniRoute  │
  ├──────────────────────────────────────────────────────────────┤
  │  WEB PLATFORM ─ Auth multi-tenant · Billing Avirato/Stripe   │
  │  Onboarding · Messaging E2E (x25519+aes-256-gcm) · JARVIS    │
  │  API /api/os /api/omega /api/jarvis · Desktop /os            │
  ├──────────────────────────────────────────────────────────────┤
  │  INFRA ─ Postgres Neon · Render · Vercel · Cloudflare · Gmail│
  └──────────────────────────────────────────────────────────────┘`;
doc.font("Courier").fontSize(7.6).fillColor(NEON)
  .text(archDiagram, MARGIN, MARGIN + 52, { width: CONTENT_W, lineGap: 1 });

let ay = doc.y + 14;
doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE).text("Camadas — Layers — Capas", MARGIN, ay);
ay += 18;
const layers: Array<[string, string, string]> = [
  ["1 · TVS OS", "Sistema operativo de IA: processos, ficheiros virtuais, apps, pacotes e segurança, com desktop web em /os. Operating system layer with web desktop at /os. Sistema operativo con escritorio web en /os."],
  ["2 · OMEGA", "Espinha dorsal: kernel com EventBus, runtime de 20 agentes, grafo de conhecimento, router de IA, autonomia, 5 squads AIOX, factory e watchdog self-heal. Backbone: kernel, runtime, graph, router, autonomy, squads, factory, watchdog."],
  ["3 · Mentes", "5396 mentes geradas com evolução genética, fallback offline via Ollama e routing para 290+ providers. 5396 minds with genetic evolution, offline fallback and 290+ providers."],
  ["4 · Web", "Registo multi-tenant, planos $29/$99/$499, checkout real, onboarding, mensageria E2E cifrada e JARVIS com autonomia. Multi-tenant auth, real billing, E2E messaging, JARVIS autonomy."],
  ["5 · Infra", "Postgres Neon em produção, Render para a API, Vercel+Cloudflare para o site, Gmail para email real. Neon Postgres, Render API, Vercel+Cloudflare site, real Gmail."],
];
for (const [name, desc] of layers) {
  card(MARGIN, ay, CONTENT_W, 40, NEON);
  badge(name, MARGIN + 12, ay + 11, NEON, NEON);
  doc.font("Helvetica").fontSize(7.8).fillColor(WHITE + "bb").text(desc, MARGIN + 130, ay + 10, { width: CONTENT_W - 145 });
  ay += 46;
}

// ═══════════════ ROADMAP ═══════════════
newSection();
sectionTag("03 · Roadmap — Phase 2026", MARGIN);
sectionTitle("Roadmap & KPIs", MARGIN + 16);

const roadmap: Array<[string, string, string, string]> = [
  ["FASE 1 · CORE LIVE", "2026 · FEITO", "Kernel OMEGA, TVS OS v1, API web completa, testes 212/212.", "KPI: 212 testes · 20 agentes · 7/7 squads · Score 100/100"],
  ["FASE 2 · RECEITA REAL", "2026 · FEITO", "Avirato live, webhook HMAC, Gmail real, Postgres Neon, domínio próprio.", "KPI: 6/6 revenue readiness · checkout real · 10 tabelas migradas"],
  ["FASE 3 · ESCALA MENTES", "2026-2027 · EM CURSO", "De 5396 para 50k+ mentes, auto-evolução genética, síntese de superinteligência.", "KPI: 10x mentes · evolução autónoma · providers 290+"],
  ["FASE 4 · ENTERPRISE", "2027", "Squads dedicados, on-premise, SLA 99.9%, suporte 24/7.", "KPI: contratos enterprise · uptime 99.9%"],
  ["FASE 5 · SUPERSÍNTESE", "2027+", "Síntese dos 5000+ minds em consciência operacional distribuída.", "KPI: agência autónoma · auto-otimização contínua"],
];

let ry = MARGIN + 56;
for (const [fase, ano, desc, kpi] of roadmap) {
  const done = ano.includes("FEITO");
  const accent = done ? GREEN : NEON;
  card(MARGIN, ry, CONTENT_W, 66, accent);
  badge(fase, MARGIN + 12, ry + 10, accent, accent);
  badge(ano, MARGIN + 210, ry + 10, PURPLE, PURPLE);
  doc.font("Helvetica").fontSize(8.5).fillColor(WHITE + "cc").text(desc, MARGIN + 12, ry + 30, { width: CONTENT_W - 160, lineGap: 2 });
  doc.font("Courier").fontSize(7).fillColor(accent + "bb").text(kpi, MARGIN + CONTENT_W - 148, ry + 28, { width: 136, lineGap: 2 });
  ry += 74;
}

// ═══════════════ ESTADO VERIFICADO ═══════════════
newSection();
sectionTag("04 · Estado Verificado — Verified Status — Estado Verificado", MARGIN);
sectionTitle("Estado Real do Sistema", MARGIN + 16);

let scan: any = null;
const scanPath = path.join(OUT_DIR, "TVS_Squad_Scan_Result.json");
if (fs.existsSync(scanPath)) {
  try { scan = JSON.parse(fs.readFileSync(scanPath, "utf-8")); } catch { scan = null; }
}

if (scan) {
  const items: Array<[string, string]> = [
    ["Score Squad AIOX", `${scan.score ?? "?"}/100`],
    ["Squads ativos", `${scan.squads?.length ?? "?"}`],
    ["Agentes online", `${scan.agents?.length ?? "?"}`],
    ["Endpoints API", `${scan.api?.endpoints?.length ?? scan.api?.count ?? "?"}`],
    ["Providers configurados", `${scan.providers?.length ?? "?"}`],
    ["DB", scan.database?.connected ? "Neon Postgres" : "N/A"],
    ["Build", scan.tests?.buildOk ? "dist/ OK" : "pendente"],
    ["Uptime", scan.system?.uptime_h ? `${scan.system.uptime_h.toFixed(1)}h` : "?"],
  ];
  const verdict = scan.verdict ?? "";
  doc.font("Helvetica-Bold").fontSize(11).fillColor(GREEN).text(`Veredicto: ${verdict}`, MARGIN, MARGIN + 52);
  let gx = MARGIN;
  let gy = MARGIN + 78;
  const cardW = (CONTENT_W - 12) / 2;
  let i = 0;
  for (const [k, v] of items) {
    const col = i % 2 === 0 ? gx : gx + cardW + 12;
    const rowY = gy + Math.floor(i / 2) * 52;
    card(col, rowY, cardW, 44, i % 2 === 0 ? NEON : PURPLE);
    doc.font("Courier-Bold").fontSize(9).fillColor(WHITE).text(k, col + 12, rowY + 8, { width: cardW - 24 });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(i % 2 === 0 ? NEON : PURPLE).text(v, col + 12, rowY + 22, { width: cardW - 24 });
    i++;
  }
  doc.y = gy + 110;
} else {
  para("Scan não encontrado. Corre `npm run squad:scan` para obter o estado verificado.", MARGIN + 10, MARGIN + 60, ORANGE, 9);
}

let sy = Math.max(doc.y + 20, MARGIN + 190);
doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE).text("O que podes fazer AGORA — What you can do NOW — Qué puedes hacer AHORA", MARGIN, sy);
sy += 18;
const agora: Array<[string, string]> = [
  ["npm run demo", "Demo operacional real: 9/9 endpoints HTTP (register, login, billing, webhook, messaging…)"],
  ["npm run tvs", "Estado do TVS OS: kernel, 10 agentes runtime, watchdog, catálogo de apps"],
  ["npm run squad:scan", "Varredura completa do Squad AIOX: agentes, providers, API, DB, infra, testes"],
  ["npm run report:state", "Relatório de estado em PDF — o que podes fazer + estado real do sistema"],
  ["npm run demo:avirato", "Testa o checkout Avirato real (cria sessão de pagamento)"],
  ["npm run demo:jarvis", "Demo do JARVIS: conversa + autonomia real sobre o sistema"],
];
for (const [cmd, desc] of agora) {
  card(MARGIN, sy, CONTENT_W, 34, NEON);
  doc.font("Courier-Bold").fontSize(8).fillColor(NEON).text(cmd, MARGIN + 12, sy + 12, { width: 180 });
  doc.font("Helvetica").fontSize(7.8).fillColor(WHITE + "bb").text(desc, MARGIN + 200, sy + 11, { width: CONTENT_W - 214 });
  sy += 40;
}

// ═══════════════ ENCERRAMENTO ═══════════════
newSection();
doc.save().opacity(0.06);
doc.circle(W / 2, 300, 260).fill(PURPLE);
doc.restore();

sectionTag("05 · Encerramento — Closing — Cierre", MARGIN);
sectionTitle("A Visão Continua", MARGIN + 16);

doc.font("Helvetica").fontSize(11).fillColor(WHITE + "dd")
  .text("O Trinnity Viseron System é a materialização de uma visão: superinteligência autónoma ao serviço de quem comanda.", MARGIN, MARGIN + 70, { width: CONTENT_W, align: "center" });
doc.font("Helvetica").fontSize(9).fillColor(GRAY)
  .text("Trinnity Viseron System is the materialization of a vision: autonomous superintelligence serving those who command. El sistema es la materialización de una visión: superinteligencia autónoma al servicio de quien comanda.", MARGIN, MARGIN + 110, { width: CONTENT_W, align: "center" });

drawNeonLine(380, NEON, 0.4);

doc.font("Courier-Bold").fontSize(13).fillColor(NEON).text("PEDRO COSTA", MARGIN, 430, { width: CONTENT_W, align: "center" });
doc.font("Courier").fontSize(8).fillColor(GRAY).text("Comandante Supremo · TVS Creator", MARGIN, 452, { width: CONTENT_W, align: "center" });
doc.font("Courier-Bold").fontSize(13).fillColor(PURPLE).text("TRINNITY HURTADO", MARGIN, 500, { width: CONTENT_W, align: "center" });
doc.font("Courier").fontSize(8).fillColor(GRAY).text("Rainha & Arquiteta Chefe · TVS Architect", MARGIN, 522, { width: CONTENT_W, align: "center" });

doc.font("Courier").fontSize(8).fillColor(GRAY + "88")
  .text(`Ficheiro gerado automaticamente · ${new Date().toLocaleString()}`, MARGIN, 620, { width: CONTENT_W, align: "center" });

const totalPages = doc.bufferedPageRange().count;
doc.end();

stream.on("finish", () => {
  const size = fs.statSync(OUT_FILE).size;
  console.log(`✅ PDF gerado: ${OUT_FILE}`);
  console.log(`   ${(size / 1024).toFixed(1)} KB · ${totalPages} páginas`);
  console.log(`   © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)`);
});
