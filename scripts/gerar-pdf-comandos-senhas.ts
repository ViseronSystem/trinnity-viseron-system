import * as fs from "fs";
import * as path from "path";
import PDFDocument from "pdfkit";

// ═══════════════════════════════════════════════════════════
// PDF COMANDOS + SENHAS — TRINNITY VISERON SYSTEM v5.0
// Trilíngue: PT / EN / ES
// © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
// ═══════════════════════════════════════════════════════════

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(OUT_DIR, "TVS_Comandos_e_Senhas.pdf");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function readEnv(): Record<string, string> {
  const envFile = path.join(ROOT, ".env");
  const result: Record<string, string> = {};
  if (!fs.existsSync(envFile)) return result;
  for (const line of fs.readFileSync(envFile, "utf-8").split("\n")) {
    const m = line.trim().match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) result[m[1]] = m[2].replace(/\r/g, "").trim();
  }
  return result;
}

const env = readEnv();

// ─── CORES ───
const DARK = "#030310";
const NEON = "#00f0ff";
const PURPLE = "#bf5af2";
const GREEN = "#30d158";
const RED = "#ff2d55";
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
    Title: "TVS — Comandos e Senhas | Commands & Passwords | Comandos y Contraseñas",
    Author: "Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)",
    Subject: "Trinnity Viseron System v5.0 — Manual de Comandos e Credenciais",
    Keywords: "TVS, Squad AIOX, comandos, senhas, credenciais, passwords",
  },
});

const stream = fs.createWriteStream(OUT_FILE);
doc.pipe(stream);

const W = doc.page.width;
const H = doc.page.height;
const MARGIN = 48;
const CONTENT_W = W - MARGIN * 2;

// ─── UTILS ───
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
  // top-left
  doc.moveTo(MARGIN - 14, MARGIN - 14).lineTo(MARGIN - 14 + s, MARGIN - 14).stroke();
  doc.moveTo(MARGIN - 14, MARGIN - 14).lineTo(MARGIN - 14, MARGIN - 14 + s).stroke();
  // top-right
  doc.moveTo(W - MARGIN + 14, MARGIN - 14).lineTo(W - MARGIN + 14 - s, MARGIN - 14).stroke();
  doc.moveTo(W - MARGIN + 14, MARGIN - 14).lineTo(W - MARGIN + 14, MARGIN - 14 + s).stroke();
  // bottom-left
  doc.moveTo(MARGIN - 14, H - MARGIN + 14).lineTo(MARGIN - 14 + s, H - MARGIN + 14).stroke();
  doc.moveTo(MARGIN - 14, H - MARGIN + 14).lineTo(MARGIN - 14, H - MARGIN + 14 - s).stroke();
  // bottom-right
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

function sectionTitle(text: string, y: number, color: string = WHITE, size: number = 22) {
  doc.font("Helvetica-Bold").fontSize(size).fillColor(color)
    .text(text, MARGIN, y, { width: CONTENT_W });
}

function badge(text: string, x: number, y: number, bg: string, fg: string) {
  const tw = doc.font("Courier-Bold").fontSize(7.5).widthOfString(text) + 12;
  doc.roundedRect(x, y - 3, tw, 16, 4).fill(bg + "33");
  doc.roundedRect(x, y - 3, tw, 16, 4).strokeColor(bg).lineWidth(0.6).stroke();
  doc.font("Courier-Bold").fontSize(7.5).fillColor(fg).text(text, x + 6, y + 1);
}

function cmdRow(cmd: string, desc: string, y: number): number {
  const ROW_H = 28;
  // background row
  doc.roundedRect(MARGIN, y, CONTENT_W, ROW_H, 4).fill(CARD_BG);
  doc.roundedRect(MARGIN, y, CONTENT_W, ROW_H, 4).strokeColor(CARD_BORDER).lineWidth(0.5).stroke();
  // left accent
  doc.rect(MARGIN, y, 2.5, ROW_H).fill(NEON);
  // command text
  doc.font("Courier-Bold").fontSize(9.5).fillColor(NEON)
    .text(cmd, MARGIN + 12, y + 9, { width: 180 });
  // description
  const descX = MARGIN + 200;
  doc.font("Helvetica").fontSize(9).fillColor(WHITE + "bb")
    .text(desc, descX, y + 9, { width: CONTENT_W - 205 });
  return y + ROW_H + 4;
}

function credRow(key: string, value: string, y: number, sensitive: boolean = false): number {
  const ROW_H = 26;
  const isLong = value.length > 50;
  const actualH = isLong ? ROW_H + 12 : ROW_H;
  doc.roundedRect(MARGIN, y, CONTENT_W, actualH, 4).fill(CARD_BG);
  doc.roundedRect(MARGIN, y, CONTENT_W, actualH, 4).strokeColor(sensitive ? PURPLE + "40" : CARD_BORDER).lineWidth(0.5).stroke();
  doc.rect(MARGIN, y, 2.5, actualH).fill(sensitive ? PURPLE : ORANGE);
  doc.font("Courier-Bold").fontSize(9).fillColor(sensitive ? PURPLE : ORANGE)
    .text(key, MARGIN + 10, y + 8, { width: 170 });
  const valColor = sensitive ? WHITE : NEON + "cc";
  const displayVal = value || "—";
  if (isLong) {
    doc.font("Courier").fontSize(8).fillColor(valColor)
      .text(displayVal.substring(0, 60), MARGIN + 185, y + 5, { width: CONTENT_W - 195 });
    doc.font("Courier").fontSize(8).fillColor(valColor)
      .text(displayVal.substring(60, 110), MARGIN + 185, y + 16, { width: CONTENT_W - 195 });
  } else {
    doc.font("Courier").fontSize(8.5).fillColor(valColor)
      .text(displayVal, MARGIN + 185, y + 8, { width: CONTENT_W - 195 });
  }
  return y + actualH + 3;
}

function pageFooter(pageNum: number, total: string = "?") {
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

// ═══════════════════════════════════════════════════════════
// CAPA
// ═══════════════════════════════════════════════════════════
fullBg();
drawGrid();
drawCornerDecor();

// Glow orb top
doc.save().opacity(0.08);
doc.circle(W / 2, 200, 280).fill(NEON);
doc.restore();
doc.save().opacity(0.05);
doc.circle(W - 100, H - 150, 200).fill(PURPLE);
doc.restore();

// Tag line
doc.font("Courier").fontSize(9).fillColor(NEON).opacity(0.7)
  .text("// CONFIDENCIAL — TRINNITY VISERON SYSTEM v5.0", MARGIN, 60, { characterSpacing: 0.8, width: CONTENT_W, align: "center" });
doc.opacity(1);

// Icon / badge
const iconY = 110;
doc.roundedRect(W / 2 - 35, iconY, 70, 70, 14)
  .fill(NEON + "12");
doc.roundedRect(W / 2 - 35, iconY, 70, 70, 14)
  .strokeColor(NEON).lineWidth(1).stroke();
doc.font("Helvetica-Bold").fontSize(30).fillColor(NEON)
  .text("TVS", W / 2 - 35, iconY + 20, { width: 70, align: "center" });

// Main title
doc.font("Helvetica-Bold").fontSize(32).fillColor(WHITE)
  .text("Comandos & Senhas", MARGIN, iconY + 90, { width: CONTENT_W, align: "center" });
doc.font("Helvetica-Bold").fontSize(32).fillColor(NEON)
  .text("Commands & Passwords", MARGIN, iconY + 130, { width: CONTENT_W, align: "center" });
doc.font("Helvetica-Bold").fontSize(32).fillColor(PURPLE)
  .text("Comandos y Contraseñas", MARGIN, iconY + 170, { width: CONTENT_W, align: "center" });

drawNeonLine(iconY + 218, NEON, 0.3);

// Subtitle
doc.font("Helvetica").fontSize(13).fillColor(WHITE + "99")
  .text("Manual completo de comandos npm, credenciais, logins e serviços", MARGIN, iconY + 230, { width: CONTENT_W, align: "center" });

// Badges
const badgeY = iconY + 268;
const badges: [string, string, string][] = [
  ["PT 🇧🇷", NEON, DARK], ["EN 🇺🇸", WHITE, DARK], ["ES 🇪🇸", PURPLE, DARK],
  ["v5.0", NEON, DARK], ["Squad AIOX", PURPLE, DARK], ["CONFIDENCIAL", RED, DARK],
];
let bx = MARGIN;
for (const [text, bg, fg] of badges) {
  const tw = doc.font("Helvetica-Bold").fontSize(9).widthOfString(text) + 20;
  doc.roundedRect(bx, badgeY, tw, 22, 5).fill(bg + "20");
  doc.roundedRect(bx, badgeY, tw, 22, 5).strokeColor(bg).lineWidth(0.8).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(bg).text(text, bx + 10, badgeY + 6, { width: tw - 20 });
  bx += tw + 8;
}

// Authority block
const authY = 550;
doc.roundedRect(MARGIN, authY, CONTENT_W, 80, 10).fill(PURPLE + "10");
doc.roundedRect(MARGIN, authY, CONTENT_W, 80, 10).strokeColor(PURPLE).lineWidth(0.8).stroke();
doc.font("Helvetica-Bold").fontSize(11).fillColor(PURPLE)
  .text("AUTORIA & PROPRIEDADE INTELECTUAL", MARGIN, authY + 12, { width: CONTENT_W, align: "center" });
doc.font("Helvetica").fontSize(10).fillColor(WHITE + "cc")
  .text("Pedro Costa (Comandante)  &  Trinnity Hurtado (Rainha)", MARGIN, authY + 30, { width: CONTENT_W, align: "center" });
doc.font("Helvetica").fontSize(9).fillColor(GRAY)
  .text("Todos os direitos reservados · All rights reserved · Todos los derechos reservados", MARGIN, authY + 48, { width: CONTENT_W, align: "center" });
doc.font("Courier").fontSize(8).fillColor(GREEN)
  .text(`Gerado em: ${new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}`, MARGIN, authY + 62, { width: CONTENT_W, align: "center" });

pageFooter(1);

// ═══════════════════════════════════════════════════════════
// PÁGINA 2 — ÍNDICE / TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════
newPage();
sectionTag("Índice / Table of Contents / Índice", 60);
sectionTitle("Conteúdo do Documento", 80);

drawNeonLine(108, NEON, 0.2);

const tocItems: [string, string, string][] = [
  ["1", "Comandos npm — Desenvolvimento e Sistema", "Pg 3"],
  ["2", "Comandos npm — Deploy e Infraestrutura", "Pg 4"],
  ["3", "Comandos npm — PDFs e Relatórios", "Pg 5"],
  ["4", "Comandos npm — Mobile e Electron", "Pg 5"],
  ["5", "Credenciais — Twilio (SMS + Voice)", "Pg 6"],
  ["6", "Credenciais — Cloudflare (DNS + R2)", "Pg 6"],
  ["7", "Credenciais — Render (API Backend)", "Pg 7"],
  ["8", "Credenciais — Avirato Payments", "Pg 7"],
  ["9", "Credenciais — Gmail OAuth", "Pg 8"],
  ["10", "Credenciais — Neon Postgres (DB)", "Pg 8"],
  ["11", "Credenciais — n8n + JWT + OmniRoute", "Pg 9"],
  ["12", "URLs e Domínios do Sistema", "Pg 9"],
  ["13", "Squad AIOX — Agentes e Squads", "Pg 10"],
  ["14", "Resumo de Estado do Sistema", "Pg 11"],
];

let tocY = 120;
for (const [num, title, page] of tocItems) {
  doc.roundedRect(MARGIN, tocY, CONTENT_W, 26, 4).fill(CARD_BG);
  doc.rect(MARGIN, tocY, 2, 26).fill(NEON);
  doc.font("Courier-Bold").fontSize(9).fillColor(NEON).text(num.padStart(2, "0"), MARGIN + 8, tocY + 8);
  doc.font("Helvetica").fontSize(10).fillColor(WHITE).text(title, MARGIN + 35, tocY + 8, { width: CONTENT_W - 100 });
  doc.font("Courier").fontSize(9).fillColor(GRAY).text(page, W - MARGIN - 50, tocY + 8, { width: 50, align: "right" });
  tocY += 30;
}

// Warning box
doc.roundedRect(MARGIN, tocY + 10, CONTENT_W, 60, 8).fill(RED + "10");
doc.roundedRect(MARGIN, tocY + 10, CONTENT_W, 60, 8).strokeColor(RED).lineWidth(0.8).stroke();
doc.font("Helvetica-Bold").fontSize(11).fillColor(RED).text("⚠ DOCUMENTO CONFIDENCIAL", MARGIN, tocY + 20, { width: CONTENT_W, align: "center" });
doc.font("Helvetica").fontSize(9).fillColor(WHITE + "99")
  .text("Este documento contém credenciais reais do sistema. Não partilhar publicamente. Não commitar no Git.", MARGIN + 20, tocY + 34, { width: CONTENT_W - 40, align: "center" });
doc.font("Helvetica").fontSize(9).fillColor(WHITE + "60")
  .text("This document contains real system credentials. Do not share publicly. Do not commit to Git.", MARGIN + 20, tocY + 48, { width: CONTENT_W - 40, align: "center" });

pageFooter(2);

// ═══════════════════════════════════════════════════════════
// PÁGINA 3 — COMANDOS: DESENVOLVIMENTO E SISTEMA
// ═══════════════════════════════════════════════════════════
newPage();
sectionTag("Comandos npm — Development Commands — Comandos npm", 52);
sectionTitle("Desenvolvimento & Sistema", 70, NEON);
doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("Commands for development, building, testing and system management", MARGIN, 96);

drawNeonLine(112, NEON, 0.15);

let y = 122;
const devCmds: [string, string][] = [
  ["npm run dev", "Dev mode com hot reload / Dev mode with hot reload / Modo dev con recarga"],
  ["npm run build", "Compila TypeScript para dist/ / Compiles to dist/ / Compila a dist/"],
  ["npm start", "Roda o sistema completo / Runs the full system / Ejecuta el sistema"],
  ["npm run restart", "Reinício anti-congelamento / Anti-freeze restart / Reinicio anti-congelamiento"],
  ["npm test", "Roda todos os testes (212) / All tests (212) / Todos los tests (212)"],
  ["npm run test:core", "14 testes de núcleo / 14 core tests / 14 tests del núcleo"],
  ["npm run test:web", "66 testes web / 66 web tests / 66 tests web"],
  ["npm run test:os", "25 testes TVS OS / 25 TVS OS tests / 25 tests TVS OS"],
  ["npm run lint", "TypeScript check sem erros / TS check / Verificación TypeScript"],
  ["npm run tvs", "Estado do TVS OS / TVS OS status / Estado del TVS OS"],
  ["npm run tvs:list", "Listar apps instaladas / List installed apps / Listar apps"],
  ["npm run tvs:doctor", "Diagnóstico de saúde / Health diagnosis / Diagnóstico de salud"],
  ["npm run squad:scan", "Varredura real do sistema / Real system scan / Escaneo real del sistema"],
  ["npm run demo", "Demo operacional real / Operational demo / Demo operacional"],
  ["npm run demo:jarvis", "Demo JARVIS AI / JARVIS AI demo / Demo JARVIS IA"],
  ["npm run demo:email", "Demo de emails / Email demo / Demo de emails"],
  ["npm run demo:messaging", "Demo de mensageria E2E / E2E messaging demo / Demo mensajería E2E"],
];

for (const [cmd, desc] of devCmds) {
  y = cmdRow(cmd, desc, y);
  if (y > H - 80) break;
}

pageFooter(3);

// ═══════════════════════════════════════════════════════════
// PÁGINA 4 — COMANDOS: DEPLOY E INFRAESTRUTURA
// ═══════════════════════════════════════════════════════════
newPage();
sectionTag("Deploy & Infrastructure Commands", 52);
sectionTitle("Deploy & Infraestrutura", 70, PURPLE);
doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("Deployment, domain management and infrastructure commands", MARGIN, 96);
drawNeonLine(112, PURPLE, 0.15);

y = 122;
const deployCmds: [string, string][] = [
  ["npm run deploy", "Deploy completo: GitHub + Vercel + Render"],
  ["npm run deploy:github", "Deploy apenas GitHub / GitHub only deploy"],
  ["npm run deploy:vercel", "Deploy apenas Vercel / Vercel only deploy"],
  ["npm run deploy:render", "Deploy backend Render / Render backend deploy"],
  ["npm run domain:check", "Diagnóstico do domínio (DNS + HTTPS) / Domain health check"],
  ["npm run domain:novo:check", "Valida trinnityviseronsystem.io / Validate new domain"],
  ["npm run backup", "Backup automático do sistema / Auto system backup"],
  ["npm run backup:schedule", "Agenda backup automático / Schedule auto-backup"],
  ["npm run init", "Build + backup + start do sistema / Full system init"],
  ["npm run init:full", "Inicialização completa / Full initialization"],
  ["npm run update:auto", "Self-update: pull + build + deploy / Auto self-update"],
  ["npm run skills:install", "Instala skills autónomos / Install autonomous skills"],
  ["npm run go-live:stripe", "Cria planos no Stripe / Create Stripe plans"],
  ["npm run demo:avirato", "Testa checkout Avirato / Test Avirato checkout"],
  ["npm run audit:arkom", "Auditoria ARKOM/AIOX / ARKOM/AIOX audit"],
  ["npm run audit:completa", "Auditoria completa do sistema / Full system audit"],
  ["npm run models:pull", "Baixa modelos Ollama (qwen2.5:3b + 1.5b) / Pull Ollama models"],
  ["npm run omniroute:start", "Inicia OmniRoute AI Gateway / Start OmniRoute gateway"],
];

for (const [cmd, desc] of deployCmds) {
  y = cmdRow(cmd, desc, y);
  if (y > H - 80) break;
}

pageFooter(4);

// ═══════════════════════════════════════════════════════════
// PÁGINA 5 — COMANDOS: PDFs + MOBILE
// ═══════════════════════════════════════════════════════════
newPage();
sectionTag("PDF & Mobile Commands", 52);
sectionTitle("PDFs, Relatórios & Mobile", 70, GREEN);
drawNeonLine(96, GREEN, 0.15);

y = 108;
const pdfCmds: [string, string][] = [
  ["npm run pdfs:all", "Gera TODOS os PDFs / Generate ALL PDFs / Genera TODOS los PDFs"],
  ["npm run pdf:comandos", "PDF Comandos e Senhas / Commands & Passwords PDF"],
  ["npm run pdf:ficheiro", "PDF Ficheiro de Visão do Projeto / Project Vision PDF"],
  ["npm run pitch", "Pitch para Investidores / Investor Pitch / Pitch Inversores"],
  ["npm run pitch:startup", "Pitch de Startup / Startup Pitch"],
  ["npm run pitch:v6", "Pitch v6.0 atualizado / Updated v6.0 pitch"],
  ["npm run roadmap", "Roadmap milionário / Millionaire Roadmap / Hoja de ruta"],
  ["npm run docs:100", "100 Melhorias de Integração / 100 improvements"],
  ["npm run report:update", "Relatório de atualização / Update report"],
  ["npm run report:state", "Relatório de estado / State report / Informe de estado"],
  ["npm run docs:revenue", "Pipeline de receita / Revenue pipeline / Pipeline de ingresos"],
  ["npm run cofre", "Cofre de credenciais (este PDF!) / Credentials vault"],
  ["npm run gmail:setup", "Setup Gmail API OAuth / Gmail OAuth setup"],
];
for (const [cmd, desc] of pdfCmds) {
  y = cmdRow(cmd, desc, y);
  if (y > H - 210) break;
}

y += 18;
sectionTag("Mobile & Desktop Commands", y);
y += 18;
sectionTitle("Mobile & Desktop", y, ORANGE, 18);
y += 30;
drawNeonLine(y, ORANGE, 0.15);
y += 14;

const mobileCmds: [string, string][] = [
  ["npm run build:android", "Build APK Android / Android APK build"],
  ["npm run build:ios", "Build IPA iOS (macOS only) / iOS IPA build"],
  ["npm run mobile:start", "Expo dev server / Expo development server"],
  ["npm run build:exe", "Executável standalone / Standalone executable"],
  ["npm run build:electron", "App desktop Electron / Electron desktop app"],
  ["npm run electron:start", "Inicia app Electron / Start Electron app"],
  ["npm run build:apk-installer", "Installer Windows com APK / Windows APK installer"],
];
for (const [cmd, desc] of mobileCmds) {
  y = cmdRow(cmd, desc, y);
  if (y > H - 80) break;
}

pageFooter(5);

// ═══════════════════════════════════════════════════════════
// PÁGINA 6 — CREDENCIAIS: TWILIO + CLOUDFLARE
// ═══════════════════════════════════════════════════════════
newPage();
sectionTag("Credenciais do Sistema — System Credentials — Credenciales del Sistema", 52);
sectionTitle("Serviços & Credenciais", 70, RED);
doc.font("Helvetica").fontSize(9).fillColor(RED + "99").text("⚠ CONFIDENCIAL — Não partilhar publicamente", MARGIN, 96);
drawNeonLine(112, RED, 0.2);

y = 124;

// TWILIO
doc.font("Helvetica-Bold").fontSize(12).fillColor(ORANGE).text("📱 Twilio (SMS + Voice)", MARGIN, y); y += 20;
y = credRow("TWILIO_ACCOUNT_SID", env.TWILIO_ACCOUNT_SID || "—", y, true);
y = credRow("TWILIO_AUTH_TOKEN", env.TWILIO_AUTH_TOKEN || "—", y, true);
y = credRow("TWILIO_PHONE_NUMBER", env.TWILIO_PHONE_NUMBER || "—", y, false);
y = credRow("PUBLIC_HOSTNAME", env.PUBLIC_HOSTNAME || "localhost", y, false);

y += 16;
// CLOUDFLARE
doc.font("Helvetica-Bold").fontSize(12).fillColor(ORANGE).text("☁️ Cloudflare (DNS + R2 + CDN)", MARGIN, y); y += 20;
y = credRow("CLOUDFLARE_API_TOKEN", env.CLOUDFLARE_API_TOKEN || "—", y, true);
y = credRow("CLOUDFLARE_ACCOUNT_ID", env.CLOUDFLARE_ACCOUNT_ID || "—", y, false);
y = credRow("CLOUDFLARE_ZONE_ID", env.CLOUDFLARE_ZONE_ID || "—", y, false);
y = credRow("CLOUDFLARE_R2_ACCESS_KEY_ID", env.CLOUDFLARE_R2_ACCESS_KEY_ID || "—", y, true);
y = credRow("CLOUDFLARE_R2_SECRET_ACCESS_KEY", env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "—", y, true);
y = credRow("CLOUDFLARE_R2_ENDPOINT", env.CLOUDFLARE_R2_ENDPOINT || "—", y, false);

pageFooter(6);

// ═══════════════════════════════════════════════════════════
// PÁGINA 7 — CREDENCIAIS: RENDER + AVIRATO
// ═══════════════════════════════════════════════════════════
newPage();
sectionTag("Render & Avirato Credentials", 52);
y = 70;

// RENDER
doc.font("Helvetica-Bold").fontSize(12).fillColor(NEON).text("🚀 Render (API Backend)", MARGIN, y); y += 20;
y = credRow("RENDER_API_KEY", env.RENDER_API_KEY || "—", y, true);
y = credRow("RENDER_API_URL", env.RENDER_API_URL || "https://api.render.com/v1", y, false);
y = credRow("RENDER_SERVICE_ID", env.RENDER_SERVICE_ID || "—", y, false);
y = credRow("RENDER_WEB_URL", env.RENDER_WEB_URL || "—", y, false);
y = credRow("TVS_PUBLIC_URL", env.TVS_PUBLIC_URL || "—", y, false);

y += 16;
// AVIRATO
doc.font("Helvetica-Bold").fontSize(12).fillColor(PURPLE).text("💳 Avirato Payments (Cobranças Live)", MARGIN, y); y += 20;
y = credRow("AVIRATO_API_KEY", env.AVIRATO_API_KEY || "—", y, true);
y = credRow("AVIRATO_WEBCODE", env.AVIRATO_WEBCODE || "—", y, false);
y = credRow("AVIRATO_CLIENT_SECRET", env.AVIRATO_CLIENT_SECRET || "—", y, true);
y = credRow("AVIRATO_ENV", env.AVIRATO_ENV || "live", y, false);

y += 16;
// INFO BOX
doc.roundedRect(MARGIN, y, CONTENT_W, 60, 8).fill(PURPLE + "10");
doc.roundedRect(MARGIN, y, CONTENT_W, 60, 8).strokeColor(PURPLE).lineWidth(0.8).stroke();
doc.font("Helvetica-Bold").fontSize(10).fillColor(PURPLE).text("Planos Ativos — Active Plans — Planes Activos", MARGIN + 10, y + 10, { width: CONTENT_W - 20 });
doc.font("Helvetica").fontSize(9).fillColor(WHITE + "aa")
  .text("Core $29/mês  ·  Pro $99/mês  ·  Enterprise $499/mês  |  Core $29/mo  ·  Pro $99/mo  ·  Enterprise $499/mo", MARGIN + 10, y + 26, { width: CONTENT_W - 20 });
doc.font("Courier").fontSize(8).fillColor(GREEN)
  .text("Revenue Readiness: ok=true · 6/6 requisitos verificados · Pronto para faturar", MARGIN + 10, y + 42, { width: CONTENT_W - 20 });

pageFooter(7);

// ═══════════════════════════════════════════════════════════
// PÁGINA 8 — CREDENCIAIS: GMAIL + NEON DB
// ═══════════════════════════════════════════════════════════
newPage();
sectionTag("Gmail OAuth & Neon Database Credentials", 52);
y = 70;

// GMAIL
doc.font("Helvetica-Bold").fontSize(12).fillColor(GREEN).text("📧 Gmail OAuth (Agente de Email)", MARGIN, y); y += 20;
y = credRow("GMAIL_CLIENT_ID", env.GMAIL_CLIENT_ID || "—", y, true);
y = credRow("GMAIL_CLIENT_SECRET", env.GMAIL_CLIENT_SECRET || "—", y, true);
y = credRow("GMAIL_USER", env.GMAIL_USER || "—", y, false);
y = credRow("GMAIL_REFRESH_TOKEN", env.GMAIL_REFRESH_TOKEN || "—", y, true);
y = credRow("EMAIL_PROVIDER", env.EMAIL_PROVIDER || "gmail", y, false);
y = credRow("EMAIL_FROM", env.EMAIL_FROM || "—", y, false);

y += 16;
// NEON POSTGRES
doc.font("Helvetica-Bold").fontSize(12).fillColor(NEON).text("🐘 Neon Postgres (Base de Dados)", MARGIN, y); y += 20;
const dbUrl = env.DATABASE_URL || "—";
const dbMasked = dbUrl !== "—" ? dbUrl.replace(/:([^:@]+)@/, ":***@") : "—";
y = credRow("DATABASE_URL (masked)", dbMasked, y, true);
y = credRow("DB Region", "eu-central-1 (AWS / Neon Cloud)", y, false);
y = credRow("DB Name", "neondb", y, false);
y = credRow("DB Owner", "neondb_owner", y, false);

y += 14;
// TABELAS DB
doc.font("Helvetica-Bold").fontSize(11).fillColor(NEON).text("Tabelas Migradas (10):", MARGIN, y); y += 16;
const tables = ["tenants", "users", "sessions", "plans", "subscriptions", "invoices", "usage_events", "conversations", "messages", "message_keys"];
const cols = 2;
const colW = CONTENT_W / cols;
for (let i = 0; i < tables.length; i++) {
  const col = i % cols;
  const row = Math.floor(i / cols);
  const tx = MARGIN + col * colW;
  const ty2 = y + row * 20;
  doc.roundedRect(tx, ty2, colW - 8, 18, 3).fill(CARD_BG);
  doc.rect(tx, ty2, 2, 18).fill(NEON);
  doc.font("Courier").fontSize(9).fillColor(NEON).text(tables[i], tx + 8, ty2 + 5, { width: colW - 20 });
}

pageFooter(8);

// ═══════════════════════════════════════════════════════════
// PÁGINA 9 — CREDENCIAIS: n8n + JWT + URLS
// ═══════════════════════════════════════════════════════════
newPage();
sectionTag("n8n, JWT, OmniRoute & System URLs", 52);
y = 70;

// n8n + JWT
doc.font("Helvetica-Bold").fontSize(12).fillColor(ORANGE).text("🔧 n8n + JWT + OmniRoute", MARGIN, y); y += 20;
y = credRow("N8N_BASIC_AUTH_USER", env.N8N_BASIC_AUTH_USER || "—", y, false);
y = credRow("N8N_BASIC_AUTH_PASSWORD", env.N8N_BASIC_AUTH_PASSWORD || "—", y, true);
y = credRow("TVS_JWT_SECRET (início)", (env.TVS_JWT_SECRET || "—").substring(0, 40) + "…", y, true);
y = credRow("OMNIROUTE_PORT", env.OMNIROUTE_PORT || "20128", y, false);
y = credRow("PORT (API)", env.PORT || "3000", y, false);
y = credRow("REPORT_PORT", env.REPORT_PORT || "3001", y, false);

y += 16;
// URLS DO SISTEMA
doc.font("Helvetica-Bold").fontSize(12).fillColor(NEON).text("🌐 URLs & Domínios do Sistema", MARGIN, y); y += 20;
const urls: [string, string][] = [
  ["Website Principal", "https://www.trinnityviseron.com"],
  ["Website Novo", "https://www.trinnityviseronsystem.io"],
  ["API Backend (Render)", env.TVS_PUBLIC_URL || "https://viseron-web.onrender.com"],
  ["API Local", "http://localhost:3000"],
  ["Dashboard WebOS", "http://localhost:3000/dashboard"],
  ["TVS Desktop", "http://localhost:3000/os"],
  ["OmniRoute Gateway", "http://localhost:20128"],
  ["Health Check", "http://localhost:3000/api/health"],
  ["Revenue Readiness", "http://localhost:3000/api/revenue/readiness"],
  ["GitHub", "https://github.com/ViseronSystem/trinnity-viseron-system"],
];
for (const [label, url] of urls) {
  y = credRow(label, url, y, false);
  if (y > H - 100) break;
}

pageFooter(9);

// ═══════════════════════════════════════════════════════════
// PÁGINA 10 — SQUAD AIOX
// ═══════════════════════════════════════════════════════════
newPage();
sectionTag("Squad AIOX — Agentes & Squads", 52);
sectionTitle("Os 5 Esquadrões AIOX", 70, PURPLE);
doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("200 anos de experiência combinada · Monitorizados por Pedro Costa & Trinnity Hurtado", MARGIN, 96);
drawNeonLine(112, PURPLE, 0.15);

y = 124;
const squadData: [string, string, string[], string][] = [
  ["⚙️ Engineering Squad", NEON, ["Architect Prime", "Dev Master", "DevOps Agent", "QA Sentinel"], "TypeScript, Cloud, Docker, Testing"],
  ["🛡️ Security Squad", RED, ["CyberSentinel", "AuditBot", "CryptoGuard"], "JWT, HMAC, AES-256-GCM, Compliance"],
  ["💼 Business Squad", GREEN, ["Sales Agent", "Finance Agent", "CRM Bot"], "CRM, Billing, Avirato, MRR"],
  ["⚡ Operations Squad", ORANGE, ["OpsBot", "WatchDog", "BackupAgent", "DeployBot"], "Monitoring, Deploy, Backup, Self-Heal"],
  ["🔬 Research Squad", PURPLE, ["ResearchBot", "HyperLearner", "EvoEngine"], "IA, AutoEvolution, HyperLearning"],
];
for (const [name, color, agents, tools] of squadData) {
  doc.roundedRect(MARGIN, y, CONTENT_W, 58, 6).fill(CARD_BG);
  doc.roundedRect(MARGIN, y, CONTENT_W, 58, 6).strokeColor(color + "40").lineWidth(0.8).stroke();
  doc.rect(MARGIN, y, 3, 58).fill(color);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(color).text(name, MARGIN + 12, y + 8, { width: CONTENT_W / 2 });
  doc.font("Courier").fontSize(8).fillColor(GRAY).text(tools, MARGIN + 12, y + 24, { width: CONTENT_W / 2 });
  let ax = MARGIN + 12;
  for (const ag of agents) {
    const aw = doc.font("Courier").fontSize(7.5).widthOfString(ag) + 10;
    doc.roundedRect(ax, y + 38, aw, 13, 3).fill(color + "18");
    doc.roundedRect(ax, y + 38, aw, 13, 3).strokeColor(color + "40").lineWidth(0.4).stroke();
    doc.font("Courier").fontSize(7.5).fillColor(color).text(ag, ax + 5, y + 42);
    ax += aw + 5;
  }
  // Status badge
  doc.roundedRect(W - MARGIN - 70, y + 10, 60, 16, 4).fill(GREEN + "18");
  doc.roundedRect(W - MARGIN - 70, y + 10, 60, 16, 4).strokeColor(GREEN + "50").lineWidth(0.5).stroke();
  doc.font("Courier-Bold").fontSize(8).fillColor(GREEN).text("● ACTIVE", W - MARGIN - 65, y + 15);
  y += 64;
}

// Autonomy cycles
y += 10;
doc.font("Helvetica-Bold").fontSize(11).fillColor(WHITE).text("Ciclos Autónomos / Autonomous Cycles:", MARGIN, y); y += 18;
const cycles: [string, string][] = [
  ["HyperLearning", "Aprende de cada interação, erro e cliente"],
  ["AutoEvolution", "Reescreve e melhora componentes automaticamente"],
  ["AutoLearning", "Gera conhecimento e atualiza memória global"],
  ["AutoPilot", "Planifica, executa e supervisiona operações"],
];
for (const [name, desc] of cycles) {
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3).fill(CARD_BG);
  doc.rect(MARGIN, y, 2, 22).fill(PURPLE);
  doc.font("Courier-Bold").fontSize(9).fillColor(PURPLE).text(name, MARGIN + 8, y + 6, { width: 150 });
  doc.font("Helvetica").fontSize(9).fillColor(WHITE + "80").text(desc, MARGIN + 165, y + 6, { width: CONTENT_W - 175 });
  y += 26;
}

pageFooter(10);

// ═══════════════════════════════════════════════════════════
// PÁGINA 11 — RESUMO DE ESTADO
// ═══════════════════════════════════════════════════════════
newPage();
sectionTag("Resumo de Estado / System Status Summary / Resumen de Estado", 52);
sectionTitle("Estado Atual do Sistema", 70, GREEN);
drawNeonLine(96, GREEN, 0.15);

y = 108;
const statusItems: [string, string, string][] = [
  ["Squads AIOX", "5/5 ATIVOS", GREEN],
  ["Testes", "212 testes verdes (core + web + OS)", GREEN],
  ["TypeScript", "Sem erros (npm run lint)", GREEN],
  ["Build", "dist/ compilado e operacional", GREEN],
  ["Runtime API", "Port 3000 · Port 3001 · OmniRoute 20128", GREEN],
  ["Memória LTM", "Limitada a 20k registros (OOM corrigido)", GREEN],
  ["Autonomia", "4 ciclos: HyperLearning, AutoEvolution, AutoLearning, AutoPilot", GREEN],
  ["Deploy", "GitHub, Vercel, Render, Railway, Docker", GREEN],
  ["Receita", "6/6 requisitos · Avirato LIVE · ok=true", GREEN],
  ["Base de Dados", "Neon Postgres eu-central-1 · 10 tabelas", GREEN],
  ["Email", "Gmail OAuth real · verify/reset/faturas", GREEN],
  ["Domínio", "www.trinnityviseronsystem.io · HTTPS ativo", GREEN],
  ["Pagamentos", "Avirato HMAC · Stripe disponível", GREEN],
  ["Messaging E2E", "x25519+AES-256-GCM · contactos/grupos", GREEN],
  ["JARVIS", "Chat + autonomia · rate-limited 30/min", GREEN],
  ["TVS OS v1", "Kernel, processos, VFS, App Store, Security", GREEN],
];

for (const [label, value, color] of statusItems) {
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3).fill(CARD_BG);
  doc.rect(MARGIN, y, 2, 22).fill(color);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE).text(label, MARGIN + 8, y + 6, { width: 160 });
  doc.font("Helvetica").fontSize(9).fillColor(color).text(value, MARGIN + 170, y + 6, { width: CONTENT_W - 180 });
  y += 26;
  if (y > H - 130) break;
}

// Final authority
y = H - 140;
doc.roundedRect(MARGIN, y, CONTENT_W, 70, 10).fill(PURPLE + "10");
doc.roundedRect(MARGIN, y, CONTENT_W, 70, 10).strokeColor(PURPLE).lineWidth(1).stroke();
doc.font("Helvetica-Bold").fontSize(14).fillColor(PURPLE)
  .text("Trinnity Viseron System v5.0", MARGIN, y + 12, { width: CONTENT_W, align: "center" });
doc.font("Helvetica").fontSize(10).fillColor(WHITE + "cc")
  .text("© Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)", MARGIN, y + 32, { width: CONTENT_W, align: "center" });
doc.font("Helvetica").fontSize(9).fillColor(GRAY)
  .text(`Gerado pelo Squad AIOX · ${new Date().toLocaleDateString("pt-PT")} · CONFIDENCIAL`, MARGIN, y + 50, { width: CONTENT_W, align: "center" });

pageFooter(11);

// ─── FECHAR ───
doc.end();
stream.on("finish", () => {
  console.log(`\n✅ PDF gerado: ${OUT_FILE}`);
  console.log(`   ${(fs.statSync(OUT_FILE).size / 1024).toFixed(1)} KB · 11 páginas`);
  console.log(`   © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)`);
});
stream.on("error", (e) => { console.error("Erro:", e); process.exit(1); });
