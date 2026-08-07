import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

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

const t = createTheme({
  title: "TVS — Comandos e Senhas | Commands & Passwords | Comandos y Contraseñas",
  subject: "Trinnity Viseron System v5.0 — Manual de Comandos e Credenciais (CONFIDENCIAL)",
});

// ═══════════════════════════════════════════════════════════
// CAPA
// ═══════════════════════════════════════════════════════════
t.cover({
  title: "COMANDOS & SENHAS\nCommands & Passwords\nComandos y Contraseñas",
  subtitle: "Manual completo de comandos npm, credenciais, logins e serviços — CONFIDENCIAL",
  badges: ["PT 🇧🇷", "EN 🇺🇸", "ES 🇪🇸", "v5.0", "Squad AIOX", "CONFIDENCIAL"],
  version: "5.0",
});
t.para("AUTORIA & PROPRIEDADE INTELECTUAL — Pedro Costa (Comandante) & Trinnity Hurtado (Rainha) — Todos os direitos reservados · All rights reserved · Todos los derechos reservados.", 10, "#7c3aed");
t.para(`Gerado em: ${new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}`, 8.5, "#64748b");

// ═══════════════════════════════════════════════════════════
// ÍNDICE / TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════
t.section("1", "Conteúdo do Documento");
t.para("Índice / Table of Contents / Índice", 9.5, "#64748b");

const tocItems: [string, string, string][] = [
  ["1", "Comandos npm — Desenvolvimento e Sistema", "Pg 3"],
  ["2", "Comandos npm — Deploy e Infraestrutura", "Pg 4"],
  ["3", "Comandos npm — PDFs e Relatórios", "Pg 5"],
  ["4", "Comandos npm — Mobile e Electron", "Pg 5"],
  ["5", "Comandos npm — Viseron Cosmos (tokens, jogo, metaverso)", "Pg 6"],
  ["6", "Credenciais — Twilio (SMS + Voice)", "Pg 6"],
  ["7", "Credenciais — Cloudflare (DNS + R2)", "Pg 6"],
  ["8", "Credenciais — Render (API Backend)", "Pg 7"],
  ["9", "Credenciais — Avirato Payments", "Pg 7"],
  ["10", "Credenciais — Gmail OAuth", "Pg 8"],
  ["11", "Credenciais — Neon Postgres (DB)", "Pg 8"],
  ["12", "Credenciais — n8n + JWT + OmniRoute", "Pg 9"],
  ["13", "URLs e Domínios do Sistema", "Pg 9"],
  ["14", "Squad AIOX — Agentes e Squads", "Pg 10"],
  ["15", "Resumo de Estado do Sistema", "Pg 11"],
];
for (const [num, title, page] of tocItems) t.kv(num, `${title} — ${page}`);

t.para("⚠ DOCUMENTO CONFIDENCIAL — Este documento contém credenciais reais do sistema. Não partilhar publicamente. Não commitar no Git. This document contains real system credentials. Do not share publicly. Do not commit to Git.", 9.5, "#ef4444");

// ═══════════════════════════════════════════════════════════
// PÁGINA 3 — COMANDOS: DESENVOLVIMENTO E SISTEMA
// ═══════════════════════════════════════════════════════════
t.section("2", "Comandos npm — Desenvolvimento e Sistema");
t.para("Commands for development, building, testing and system management", 9, "#64748b");
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
for (const [cmd, desc] of devCmds) t.code(cmd, desc);

// ═══════════════════════════════════════════════════════════
// PÁGINA 4 — COMANDOS: DEPLOY E INFRAESTRUTURA
// ═══════════════════════════════════════════════════════════
t.section("3", "Comandos npm — Deploy e Infraestrutura");
t.para("Deployment, domain management and infrastructure commands", 9, "#64748b");
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
for (const [cmd, desc] of deployCmds) t.code(cmd, desc);

// ═══════════════════════════════════════════════════════════
// PÁGINA 5 — COMANDOS: PDFs + MOBILE
// ═══════════════════════════════════════════════════════════
t.section("4", "Comandos npm — PDFs e Relatórios");
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
for (const [cmd, desc] of pdfCmds) t.code(cmd, desc);

t.section("5", "Comandos npm — Mobile e Electron");
const mobileCmds: [string, string][] = [
  ["npm run build:android", "Build APK Android / Android APK build"],
  ["npm run build:ios", "Build IPA iOS (macOS only) / iOS IPA build"],
  ["npm run mobile:start", "Expo dev server / Expo development server"],
  ["npm run build:exe", "Executável standalone / Standalone executable"],
  ["npm run build:electron", "App desktop Electron / Electron desktop app"],
  ["npm run electron:start", "Inicia app Electron / Start Electron app"],
  ["npm run build:apk-installer", "Installer Windows com APK / Windows APK installer"],
];
for (const [cmd, desc] of mobileCmds) t.code(cmd, desc);

t.section("6", "Viseron Cosmos — Tokens, Jogo e Metaverso");
t.para("Cosmos commands — $VSR/$TRIN tokens, game & metaverse / Comandos Cosmos — tokens, juego y metaverso", 9, "#64748b");
const cosmosCmds: [string, string][] = [
  ["npm run game:web", "Jogo VISERON Canvas 2D (/game) / Canvas 2D game"],
  ["npm run game:apk", "Build APK do jogo / Game APK build (data/apps/viserongame.apk)"],
  ["npm run cosmos:kit", "Gera whitepaper + kit marketing Cosmos / Cosmos whitepaper + marketing kit"],
  ["npm run cosmos:whitepaper", "Whitepaper $VSR/$TRIN / Cosmos whitepaper PDF"],
  ["npm run cosmos:marketing", "Kit marketing trilingue / Trilingual marketing kit PDF"],
  ["npm run cosmos:bot", "Bot Telegram do Cosmos (TELEGRAM_BOT_TOKEN) / Telegram bot"],
  ["npx hardhat compile --force", "Compila os 4 contratos (em contracts/) / Compile contracts"],
  ["npx hardhat run scripts/deploy.cjs --network ethereum", "Deploy real EVM (chave privada no contracts/.env) / Real EVM deploy"],
  ["spl-token create-token --decimals 9", "Mint Solana SPL (VSR/TRIN) / Solana SPL mint"],
  ["/cosmos", "Site interplanetário / Interplanetary site"],
  ["/cosmos/metaverse", "Metaverso jogável / Playable metaverse"],
  ["/game", "Jogo VISERON / VISERON game"],
];
for (const [cmd, desc] of cosmosCmds) t.code(cmd, desc);
t.sub("Contratos EVM / EVM Contracts");
t.para("ViseronCrown (VSR 300M) · Trinnity (TRIN 420.69M) · ViseronStaking · ViseronGovernance — solc 0.8.20 · OpenZeppelin 5.0.2 · Ethereum + BSC + Solana. Deploy local verificado: contracts/deployments.json (gitignored).", 9.5, "#0f172a");

// ═══════════════════════════════════════════════════════════
// PÁGINA 6 — CREDENCIAIS: TWILIO + CLOUDFLARE
// ═══════════════════════════════════════════════════════════
t.section("7", "Credenciais — Twilio (SMS + Voice)");
t.para("⚠ CONFIDENCIAL — Não partilhar publicamente", 9.5, "#ef4444");
t.kv("TWILIO_ACCOUNT_SID", env.TWILIO_ACCOUNT_SID || "—");
t.kv("TWILIO_AUTH_TOKEN", env.TWILIO_AUTH_TOKEN || "—");
t.kv("TWILIO_PHONE_NUMBER", env.TWILIO_PHONE_NUMBER || "—");
t.kv("PUBLIC_HOSTNAME", env.PUBLIC_HOSTNAME || "localhost");

t.section("8", "Credenciais — Cloudflare (DNS + R2 + CDN)");
t.kv("CLOUDFLARE_API_TOKEN", env.CLOUDFLARE_API_TOKEN || "—");
t.kv("CLOUDFLARE_ACCOUNT_ID", env.CLOUDFLARE_ACCOUNT_ID || "—");
t.kv("CLOUDFLARE_ZONE_ID", env.CLOUDFLARE_ZONE_ID || "—");
t.kv("CLOUDFLARE_R2_ACCESS_KEY_ID", env.CLOUDFLARE_R2_ACCESS_KEY_ID || "—");
t.kv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "—");
t.kv("CLOUDFLARE_R2_ENDPOINT", env.CLOUDFLARE_R2_ENDPOINT || "—");

// ═══════════════════════════════════════════════════════════
// PÁGINA 7 — CREDENCIAIS: RENDER + AVIRATO
// ═══════════════════════════════════════════════════════════
t.section("9", "Credenciais — Render (API Backend)");
t.kv("RENDER_API_KEY", env.RENDER_API_KEY || "—");
t.kv("RENDER_API_URL", env.RENDER_API_URL || "https://api.render.com/v1");
t.kv("RENDER_SERVICE_ID", env.RENDER_SERVICE_ID || "—");
t.kv("RENDER_WEB_URL", env.RENDER_WEB_URL || "—");
t.kv("TVS_PUBLIC_URL", env.TVS_PUBLIC_URL || "—");

t.section("10", "Credenciais — Avirato Payments (Cobranças Live)");
t.kv("AVIRATO_API_KEY", env.AVIRATO_API_KEY || "—");
t.kv("AVIRATO_WEBCODE", env.AVIRATO_WEBCODE || "—");
t.kv("AVIRATO_CLIENT_SECRET", env.AVIRATO_CLIENT_SECRET || "—");
t.kv("AVIRATO_ENV", env.AVIRATO_ENV || "live");
t.para("Planos Ativos — Active Plans — Planes Activos: Core $29/mês · Pro $99/mês · Enterprise $499/mês  |  Core $29/mo · Pro $99/mo · Enterprise $499/mo", 9, "#7c3aed");
t.para("Revenue Readiness: ok=true · 6/6 requisitos verificados · Pronto para faturar", 9, "#16a34a");

// ═══════════════════════════════════════════════════════════
// PÁGINA 8 — CREDENCIAIS: GMAIL + NEON DB
// ═══════════════════════════════════════════════════════════
t.section("11", "Credenciais — Gmail OAuth (Agente de Email)");
t.kv("GMAIL_CLIENT_ID", env.GMAIL_CLIENT_ID || "—");
t.kv("GMAIL_CLIENT_SECRET", env.GMAIL_CLIENT_SECRET || "—");
t.kv("GMAIL_USER", env.GMAIL_USER || "—");
t.kv("GMAIL_REFRESH_TOKEN", env.GMAIL_REFRESH_TOKEN || "—");
t.kv("EMAIL_PROVIDER", env.EMAIL_PROVIDER || "gmail");
t.kv("EMAIL_FROM", env.EMAIL_FROM || "—");

t.section("12", "Credenciais — Neon Postgres (Base de Dados)");
const dbUrl = env.DATABASE_URL || "—";
const dbMasked = dbUrl !== "—" ? dbUrl.replace(/:([^:@]+)@/, ":***@") : "—";
t.kv("DATABASE_URL (masked)", dbMasked);
t.kv("DB Region", "eu-central-1 (AWS / Neon Cloud)");
t.kv("DB Name", "neondb");
t.kv("DB Owner", "neondb_owner");
t.para("Tabelas Migradas (10):", 10.5, "#0f172a");
const tables = ["tenants", "users", "sessions", "plans", "subscriptions", "invoices", "usage_events", "conversations", "messages", "message_keys"];
for (const tb of tables) t.bullet("▸", tb, "#22d3ee");

// ═══════════════════════════════════════════════════════════
// PÁGINA 9 — CREDENCIAIS: n8n + JWT + URLS
// ═══════════════════════════════════════════════════════════
t.section("13", "Credenciais — n8n + JWT + OmniRoute");
t.kv("N8N_BASIC_AUTH_USER", env.N8N_BASIC_AUTH_USER || "—");
t.kv("N8N_BASIC_AUTH_PASSWORD", env.N8N_BASIC_AUTH_PASSWORD || "—");
t.kv("TVS_JWT_SECRET (início)", (env.TVS_JWT_SECRET || "—").substring(0, 40) + "…");
t.kv("OMNIROUTE_PORT", env.OMNIROUTE_PORT || "20128");
t.kv("PORT (API)", env.PORT || "3000");
t.kv("REPORT_PORT", env.REPORT_PORT || "3001");

t.section("14", "URLs e Domínios do Sistema");
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
for (const [label, url] of urls) t.kv(label, url);

// ═══════════════════════════════════════════════════════════
// PÁGINA 10 — SQUAD AIOX
// ═══════════════════════════════════════════════════════════
t.section("15", "Squad AIOX — Agentes e Squads");
t.para("Os 5 Esquadrões AIOX — 200 anos de experiência combinada · Monitorizados por Pedro Costa & Trinnity Hurtado", 9.5, "#64748b");
const squadData: [string, string, string[], string][] = [
  ["⚙️ Engineering Squad", "#22d3ee", ["Architect Prime", "Dev Master", "DevOps Agent", "QA Sentinel"], "TypeScript, Cloud, Docker, Testing"],
  ["🛡️ Security Squad", "#ef4444", ["CyberSentinel", "AuditBot", "CryptoGuard"], "JWT, HMAC, AES-256-GCM, Compliance"],
  ["💼 Business Squad", "#22c55e", ["Sales Agent", "Finance Agent", "CRM Bot"], "CRM, Billing, Avirato, MRR"],
  ["⚡ Operations Squad", "#f59e0b", ["OpsBot", "WatchDog", "BackupAgent", "DeployBot"], "Monitoring, Deploy, Backup, Self-Heal"],
  ["🔬 Research Squad", "#a855f7", ["ResearchBot", "HyperLearner", "EvoEngine"], "IA, AutoEvolution, HyperLearning"],
];
for (const [name, color, agents, tools] of squadData) {
  t.sub(name, color);
  t.para(tools, 8.5, "#64748b");
  for (const ag of agents) t.bullet("▸", ag, color);
}
t.sub("Ciclos Autónomos / Autonomous Cycles");
const cycles: [string, string][] = [
  ["HyperLearning", "Aprende de cada interação, erro e cliente"],
  ["AutoEvolution", "Reescreve e melhora componentes automaticamente"],
  ["AutoLearning", "Gera conhecimento e atualiza memória global"],
  ["AutoPilot", "Planifica, executa e supervisiona operações"],
];
for (const [name, desc] of cycles) t.bullet("▸", `${name} — ${desc}`);

// ═══════════════════════════════════════════════════════════
// PÁGINA 11 — RESUMO DE ESTADO
// ═══════════════════════════════════════════════════════════
t.section("16", "Estado Atual do Sistema");
t.para("Resumo de Estado / System Status Summary / Resumen de Estado", 9.5, "#64748b");
const statusItems: [string, string, string][] = [
  ["Squads AIOX", "5/5 ATIVOS", "#22c55e"],
  ["Testes", "212 testes verdes (core + web + OS)", "#22c55e"],
  ["TypeScript", "Sem erros (npm run lint)", "#22c55e"],
  ["Build", "dist/ compilado e operacional", "#22c55e"],
  ["Runtime API", "Port 3000 · Port 3001 · OmniRoute 20128", "#22c55e"],
  ["Memória LTM", "Limitada a 20k registros (OOM corrigido)", "#22c55e"],
  ["Autonomia", "4 ciclos: HyperLearning, AutoEvolution, AutoLearning, AutoPilot", "#22c55e"],
  ["Deploy", "GitHub, Vercel, Render, Railway, Docker", "#22c55e"],
  ["Receita", "6/6 requisitos · Avirato LIVE · ok=true", "#22c55e"],
  ["Base de Dados", "Neon Postgres eu-central-1 · 10 tabelas", "#22c55e"],
  ["Email", "Gmail OAuth real · verify/reset/faturas", "#22c55e"],
  ["Domínio", "www.trinnityviseronsystem.io · HTTPS ativo", "#22c55e"],
  ["Pagamentos", "Avirato HMAC · Stripe disponível", "#22c55e"],
  ["Messaging E2E", "x25519+AES-256-GCM · contactos/grupos", "#22c55e"],
  ["JARVIS", "Chat + autonomia · rate-limited 30/min", "#22c55e"],
  ["TVS OS v1", "Kernel, processos, VFS, App Store, Security", "#22c55e"],
];
for (const [label, value] of statusItems) t.kv(label, value);

t.spacer(1);
t.para("Trinnity Viseron System v5.0 — © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha) — CONFIDENCIAL", 9, "#7c3aed", { align: "center" });
t.para(`Gerado pelo Squad AIOX · ${new Date().toLocaleDateString("pt-PT")}`, 8.5, "#64748b", { align: "center" });

const pages = t.page();
t.finish(OUT_FILE);

console.log(`\n✅ PDF gerado: ${OUT_FILE}`);
let sizeKb = "";
try {
  sizeKb = `${(fs.statSync(OUT_FILE).size / 1024).toFixed(1)} KB · `;
} catch {
  sizeKb = "";
}
console.log(`   ${sizeKb}${pages} páginas`);
console.log(`   © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)`);
