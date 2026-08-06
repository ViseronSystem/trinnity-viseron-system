import fs from "fs";
import path from "path";
import { createTheme } from "./pdf-theme";

// TVS - AUDITORIA COMPLETA (v1)
// Gera data/Viseron_Auditoria_Completa.pdf com:
//   PARTE 1 - Tudo o que o sistema faz (scripts, endpoints, módulos, providers, deploys)
//   PARTE 2 - TUDAS as credenciais: logins, senhas, contas, emails, API keys, tokens
// Uso: npm run audit:full
// ATENÇÃO: ficheiro CONFIDENCIAL (parte 2 tem segredos) — gitignored.

function readEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const envFile = fs.readFileSync(path.resolve(".env"), "utf8");
    for (const line of envFile.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim().trim('"').trim("'");
    }
  } catch {}
  return out;
}

const env = readEnv();

const today = new Date().toLocaleDateString("pt-PT");
const t = createTheme({ title: "TVS — Auditoria Completa", subject: "CONFIDENCIAL — o que o sistema faz + contas, senhas, chaves e tokens" });

t.cover({
  title: "AUDITORIA COMPLETA",
  subtitle: "O que o sistema faz + todas as contas, senhas, chaves e tokens",
  badges: ["CONFIDENCIAL", "TVS v5.0", "Segredos reais"],
  date: today,
  version: "5.0",
});
t.para("CONFIDENCIAL — contém segredos reais. Não partilhar.", 11, "#f87171");

let sec = 0;
const section = (title: string) => {
  sec++;
  t.section(String(sec), title);
};

// ── PARTE 1: O QUE O SISTEMA FAZ ──
t.title("PARTE 1 — TUDO O QUE O SISTEMA FAZ", 17);

section("MISSÃO");
t.kv("Visão", "Sistema Operacional Multi-Agente de Superinteligência — 5000+ mentes, auto-evolução genética.");
t.kv("Comando", "Pedro Costa (Supreme Commander) · Trinnity Hurtado (Queen Architect).");
t.kv("Agentes", "5112 no total: 4742 mentes históricas + 246 arquétipos + 114 batalhão (59 Corona / 57 Hierro) + 10 core.");

section("COMANDOS (npm run ...)");
const scripts: Array<[string, string]> = [
  ["start / dev / build / lint", "correr, dev com hot reload, compilar, verificação TS"],
  ["super:start / start:web / dev:web", "arranque core / servidor web"],
  ["init / init:full", "build + backup + start / inicialização completa"],
  ["test / test:core / test:web / test:hyper", "99 asserts: core 15, web 74, hyperbrain 10"],
  ["backup / backup:schedule", "ZIP diário / agendar 03:00 (retenção 30 dias)"],
  ["update:auto", "self-update: pull → install → PDFs → build → testes → report → deploy"],
  ["deploy / deploy:github / deploy:render / deploy:vercel / deploy:hostalia", "deploy para todos os destinos"],
  ["deploy:domain / deploy:domain:check / domain:check", "config + validação do domínio trinnityviseron.com (NS Cloudflare)"],
  ["go-live:stripe / demo:avirato", "planos Stripe em 1 comando / teste checkout Avirato real"],
  ["demo / demo:jarvis / demo:email / demo:messaging", "demos operacionais reais"],
  ["pdfs:all / pitch / roadmap / docs:100 / report:update / report:state / docs:revenue / audit:arkom / audit:full / cofre", "geradores de PDF/relatórios"],
  ["gmail:setup", "setup OAuth Gmail para o agente de atendimento"],
  ["skills:install / skills", "instalar coleções de skills (958 skills de 4 coleções) / CLI"],
  ["omniroute:install / omniroute:start", "gateway AI (porta 20128, 290+ providers)"],
  ["call:start / jarvis:start / asno:start", "bridges: CallSystem (Twilio+Realtime+ElevenLabs), OpenJarvis, ASNO"],
  ["cudacyclone", "GPU puzzle solver (status/build/run/benchmark)"],
  ["build:android / build:ios / build:exe / build:electron", "builds APK, IPA, executável standalone, app desktop"],
];
for (const [k, v] of scripts) t.kv(k, v);

section("API WEB — ENDPOINTS (viseron-web.onrender.com)");
const endpoints: Array<[string, string]> = [
  ["POST /api/auth/register", "registo multi-tenant (org → tenant + owner + JWT)"],
  ["POST /api/auth/login · GET /api/auth/me · PATCH /api/auth/profile", "login JWT, perfil, atualização"],
  ["GET /api/auth/users", "listar membros (owner/admin)"],
  ["GET /api/billing/plans", "planos Core €29 / Pro €99 / Enterprise €499"],
  ["POST /api/billing/checkout", "criar sessão de checkout (Avirato primário / Stripe opcional / manual)"],
  ["POST /api/billing/webhook", "webhook de pagamento → upgrade automático do plano"],
  ["GET /api/billing/subscription", "estado da subscrição/trial"],
  ["GET /api/onboarding/templates · POST /api/onboarding/apply", "5 templates → materializar agentes no workspace"],
  ["GET /api/messaging/status · /key · /contacts · /conversations · /groups · messages · read", "mensageria E2E (x25519 + aes-256-gcm) + socket.io"],
  ["GET /api/jarvis/status · POST /api/jarvis/chat", "JARVIS: estado + conversa com execução real (30/min)"],
  ["GET /api/revenue/readiness", "go-live de receita (6 requisitos)"],
  ["GET /api/health · GET /api/metrics · GET /api/system/status", "saúde, métricas, estado"],
  ["GET/POST /api/blog/posts · /api/content/generate · /trigger · /schedule", "blog + content agent"],
  ["POST /api/waitlist", "lista de espera"],
  ["GET /dashboard", "dashboard SPA com widget JARVIS"],
  ["Dashboard server (porta 3000)", "/api/agents · /api/synthesize · /api/battalion · /api/directives · /api/voice/* · /api/workflows · /api/skills"],
  ["Report server (porta 3001)", "/report · /report/pdf · /report/comprehensive-pdf · /superintelligence"],
];
for (const [k, v] of endpoints) t.kv(k, v);

section("MÓDULOS / FEATURES (src/)");
const modules: Array<[string, string]> = [
  ["ViseronCore / AgentManager / AgentSpawner", "orquestração, registo/lifecycle, spawn de 5000+ mentes"],
  ["ModelRouter / AIProviderBridge / ProviderFactory", "rotas local/cloud, 17 providers, estratégias single/compare/ensemble/fallback"],
  ["MemoryEngine v3.0 Hyper-Brain", "STM/LTM, índice full-text, vetores Qdrant 1536-dim, consolidação automática"],
  ["SuperIntelligenceEngine / SuperMind", "síntese multi-provider, 500 anos de conhecimento"],
  ["AutoLearning / AutoEvolution / HyperLearning", "ciclos 30-60 min, evolução genética, duplicação de inteligência"],
  ["TokenEngine", "geração ERC-20/BEP-20/Solana + tokenomics ($VSR 300M)"],
  ["WebAppGenerator / AppScaffolder", "gera websites + apps móveis (AutoGenApp, nfc-cloner)"],
  ["BattalionRegistry / LineageTracker / DirectiveEngine", "batalhão 114 agentes, linhagens Corona/Hierro, diretivas"],
  ["SkillsRegistry", "958 skills (awesome-claude-skills, superpowers, claude-plugins, marketingskills)"],
  ["SquadManager / CommandChain / AutonomousPlanner", "squads, cadeia de comando, planeamento autónomo"],
  ["ReportServer", "relatórios PDF/JSON"],
  ["ARKOM", "auditoria operacional com 5 squads AIOX + verdicto GO/NO-GO"],
  ["JARVIS", "agente conversacional com 11 intents e execução real"],
  ["CallSystem / OpenJarvis / ASNO / OmniRoute", "chamadas Twilio, assistente pessoal, voz/WhatsApp, gateway 290+ providers"],
  ["MCP Server", "servidor MCP (@modelcontextprotocol/server)"],
  ["n8n bridge", "workflow templates executáveis"],
];
for (const [k, v] of modules) t.kv(k, v);

section("AI PROVIDERS");
t.kv("Local (default)", "Ollama (llama3, qwen2, mistral) — sem API key");
t.kv("Cloud opcionais", "OpenAI (GPT-4o/o1), Claude (Sonnet/Opus 4), Gemini 2.5 (Flash/Pro 1M), Grok 3, Mistral, DeepSeek, Cohere, HuggingFace, Together, Perplexity");
t.kv("OmniRoute", "290+ providers / 500+ modelos");

section("DEPLOYS / INFRA");
t.kv("GitHub", "github.com/ViseronSystem/trinnity-viseron-system.git (main)");
t.kv("Render", "viseron-web → https://viseron-web.onrender.com (health /api/health)");
t.kv("Vercel / Cloudflare", "landing + DNS trinnityviseron.com → viseron-web.onrender.com (NS chad/kay.cloudflare.com)");
t.kv("Hostalia", "registrador do domínio (FTP ainda placeholder)");
t.kv("Docker / EXE / Electron", "docker-compose (tvs-core, ollama, qdrant, n8n) · tvs-viseron-win.exe · desktop app");
t.kv("Mobile", "Expo/React Native — 7 tabs, bundle com.trinnity.viseron, EAS projectId 723e1dfe-9ccc-41a4-bca2-bd68f4ddcfa7");

section("AUTOMAÇÃO DE FUNDO");
t.kv("ContentAgent", "gera e publica posts de blog a cada 120 min");
t.kv("AutoEvolution", "evolução genética a cada 60 min (níveis de inteligência 1050→1102.5%)");
t.kv("HyperLearning / AutoLearning", "ciclos a cada 30 min");
t.kv("Backup", "diário 03:00 via Task Scheduler 'TVS-DailyBackup'");
t.kv("Self-update", "npm run update:auto — pull + build + testes + PDFs + deploy");
t.kv("GitHub Actions", "CI lint+test+build no push; build APK mobile");

section("TESTES");
t.kv("core.test.ts", "15 asserts — agents, router, memória, tools, squads, providers, MCP");
t.kv("web.test.ts", "74 asserts — auth, billing, onboarding, email, messaging E2E, jarvis, readiness");
t.kv("hyperbrain.test.ts", "10 asserts — líderes, permissões, providers, hyper-learning");

// ── PARTE 2: CREDENCIAIS ──
t.ensure(90);
t.title("PARTE 2 — CONTAS, SENHAS, CHAVES E TOKENS", 17);
t.para("CONFIDENCIAL — contém segredos reais. Não partilhar.", 10, "#ef4444");

section("CONTAS E EMAILS (no sistema)");
const emails: Array<[string, string]> = [
  ["viseron@trinnity.ai", "git identity (GitHub, utilizador ViseronSystem)"],
  ["pedro@trinnity.com", "contacto nos scripts de pitch"],
  ["trinnity@viseron.io", "contacto secundário nos pitches"],
  ["no-reply@trinnityviseronsystem.io", "remetente default do email transport"],
  ["teste@viseron.ai · bob@viseron.ai", "utilizadores de teste"],
  ["pedro.msa9fib1@trinnityviseronsystem.io", "conta demo registada (tenant trinnity-labs)"],
  ["pedro.msa9gtsc@trinnityviseronsystem.io", "conta demo registada (tenant trinnity-demo-gtsc)"],
];
for (const [k, v] of emails) t.kv(k, v);

section("SENHAS/LOGINS HARDCODED NO CÓDIGO");
const hardcoded: Array<[string, string]> = [
  ["n8n (N8NBridge.ts:172 + docker-compose.yml)", "utilizador: admin · senha: viseron"],
  ["JWT fallback (auth/middleware.ts:10)", "tvs-dev-secret-change-in-production (trocar por TVS_JWT_SECRET em produção)"],
  ["Admin demo (scripts/demo-operacional.ts)", "senha: ViseronSuper2026!"],
  ["Testes (tests/web.test.ts, demo-email, demo-messaging)", "password123 / novaPassword123 / errada"],
  ["Android debug keystore (mobile/android/app/debug.keystore)", "chave de assinatura de debug (default, sem segredo)"],
];
for (const [k, v] of hardcoded) t.kv(k, v);

section("CHAVES/TOKENS POR PLATAFORMA (do .env)");
const platforms: Array<[string, string[]]> = [
  ["AVIRATO PAYMENTS — cobranças PRIMÁRIO (live)", ["AVIRATO_API_KEY", "AVIRATO_WEBCODE", "AVIRATO_CLIENT_SECRET", "AVIRATO_ENV"]],
  ["CLOUDFLARE (DNS/CDN/R2)", ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ZONE_ID", "CLOUDFLARE_R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_SECRET_ACCESS_KEY", "CLOUDFLARE_R2_ENDPOINT"]],
  ["RENDER (hosting)", ["RENDER_API_KEY", "RENDER_API_URL", "RENDER_SERVICE_ID", "RENDER_WEB_URL"]],
  ["TWILIO (SMS)", ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]],
  ["HOSTALIA (registrador — FTP placeholder)", ["HOSTALIA_FTP_HOST", "HOSTALIA_FTP_USER", "HOSTALIA_FTP_PASS", "HOSTALIA_FTP_PATH", "HOSTALIA_FTP_SSL"]],
];
for (const [name, keys] of platforms) {
  t.sub(name);
  for (const k of keys) t.kv(k, env[k] || "(EM FALTA)");
}

section("TODAS AS OUTRAS VARIÁVEIS (.env)");
const known = new Set(platforms.flatMap((p) => p[1]));
for (const k of Object.keys(env).sort()) {
  if (!known.has(k)) t.kv(k, env[k] || "");
}

section("A CRIAR AINDA");
const pending = [
  env["GMAIL_CLIENT_ID"] ? null : "GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET + GMAIL_REFRESH_TOKEN (Google Cloud OAuth — npm run gmail:setup)",
  env["DATABASE_URL"] ? null : "DATABASE_URL (Postgres — Neon/Supabase)",
  env["STRIPE_SECRET_KEY"] ? null : "STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET (opcional — só se usar Stripe em vez de Avirato)",
  env["TVS_JWT_SECRET"] ? null : "TVS_JWT_SECRET (substituir o fallback de dev por um segredo forte)",
  env["EMAIL_PROVIDER"] !== "dev" ? null : "EMAIL_PROVIDER (smtp|resend|sendgrid|gmail) para email real",
].filter(Boolean) as string[];
for (const p of pending) t.bullet("▸", p, "#ef4444");

const out = path.resolve("data/Viseron_Auditoria_Completa.pdf");
t.finish(out);
console.log(`Auditoria completa gerada: ${out}`);
console.log("ATENÇÃO: contém segredos (parte 2). Confidencial, gitignored.");
