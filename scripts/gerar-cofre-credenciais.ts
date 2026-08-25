import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createTheme } from "./pdf-theme";

// TVS - COFRE DE CREDENCIAIS (v2 — completo)
// Gera data/Viseron_Cofre_Credenciais.pdf com TUDO o que tem login/senha/chave:
// todas as variáveis do .env, contas e emails (accounts.json, git/GitHub),
// tokens, webhooks e logins de plataforma. Uso: npm run cofre
// ATENÇÃO: CONFIDENCIAL — ficheiro gitignored, guarda-o encriptado.

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

function readJson(p: string): any {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function git(prop: string): string {
  try {
    return execSync(`git config --get ${prop}`, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

interface Platform {
  name: string;
  url: string;
  loginNote: string;
  keys: string[];
  note: string;
}

function main() {
  const env = readEnv();
  const accounts = readJson(path.resolve("data/accounts.json")) || { tenants: [], users: [] };
  const emailTokens = readJson(path.resolve("data/email-tokens.json")) || { tokens: [] };

  const allKeys = Object.keys(env).sort();
  const used: string[] = [];

  const platforms: Platform[] = [
    {
      name: "AVIRATO PAYMENTS — cobranças (PRIMÁRIO)",
      url: "https://app.aviratopayments.com",
      loginNote: "? (conta que registou na Avirato) — preencher à mão",
      keys: ["AVIRATO_API_KEY", "AVIRATO_WEBCODE", "AVIRATO_CLIENT_SECRET", "AVIRATO_ENV"],
      note: "Ambiente: LIVE. Webhook LIVE configurado e ATIVO em https://viseron-web.onrender.com/api/billing/webhook (eventos Adyen). Doc: avirato.money/en/developers.",
    },
    {
      name: "CLOUDFLARE (DNS, CDN, R2)",
      url: "https://dash.cloudflare.com",
      loginNote: "? (email da conta Cloudflare) — preencher à mão",
      keys: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ZONE_ID", "CLOUDFLARE_R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_SECRET_ACCESS_KEY", "CLOUDFLARE_R2_ENDPOINT"],
      note: "Zona trinnityviseron.com (status active). Nameservers da zona: chad.ns.cloudflare.com + kay.ns.cloudflare.com. Ainda NÃO autoritativos (registador Hostalia manda).",
    },
    {
      name: "RENDER (hosting da app)",
      url: "https://dashboard.render.com",
      loginNote: "? (email da conta Render) — preencher à mão",
      keys: ["RENDER_API_KEY", "RENDER_API_URL", "RENDER_SERVICE_ID", "RENDER_WEB_URL"],
      note: "Serviço viseron-web → https://viseron-web.onrender.com. Env vars já no serviço: TVS_PUBLIC_URL, EMAIL_FROM, AVIRATO_API_KEY, AVIRATO_WEBCODE, AVIRATO_CLIENT_SECRET, AVIRATO_ENV.",
    },
    {
      name: "HOSTALIA (registrador do domínio trinnityviseron.com)",
      url: "https://www.hostalia.com",
      loginNote: "? (email da conta Hostalia) — preencher à mão",
      keys: ["HOSTALIA_FTP_HOST", "HOSTALIA_FTP_USER", "HOSTALIA_FTP_PASS", "HOSTALIA_FTP_PATH", "HOSTALIA_FTP_SSL"],
      note: "FTP ainda placeholder (ftp.seusite.com.br). Falta trocar NS de servicio-online.net para chad.ns.cloudflare.com + kay.ns.cloudflare.com no painel.",
    },
    {
      name: "TWILIO (SMS / verificação)",
      url: "https://console.twilio.com",
      loginNote: "? (email da conta Twilio) — preencher à mão",
      keys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
      note: "Usado para SMS/verificação de código.",
    },
  ];

  for (const p of platforms) p.keys.forEach((k) => used.push(k));

  const today = new Date().toLocaleDateString("pt-PT");
  const t = createTheme({ title: "TVS — Cofre de Credenciais", subject: "CONFIDENCIAL — todas as senhas, chaves, emails, API keys e tokens" });

  t.cover({
    title: "COFRE DE CREDENCIAIS",
    subtitle: "Todas as senhas, chaves, emails, API keys e tokens do sistema",
    badges: ["CONFIDENCIAL", "TVS v7.0", "Não partilhar"],
    date: today,
    version: "5.0",
  });
  t.para("CONFIDENCIAL — não partilhar · guardar em local seguro", 11, "#f87171");

  // Identidade / contas
  t.section("1", "CONTAS E EMAILS");
  t.para(`GitHub (repo): https://github.com/ViseronSystem/trinnity-viseron-system · utilizador git: ${git("user.name")} · email git: ${git("user.email")}`, 9.5);
  const users = accounts.users || [];
  if (users.length === 0) {
    t.para("Contas registadas no sistema (accounts.json): nenhuma ainda (regista-te em /api/auth/register para criar a primeira).", 9.5, "#64748b");
  } else {
    t.para("Contas registadas no sistema (accounts.json):", 9.5);
    for (const u of users) {
      t.bullet("▸", `${u.name || "?"} — ${u.email || "?"} (tenant ${u.tenantId || "?"}, role ${u.role || "?"})`, "#334155");
    }
  }
  if ((emailTokens.tokens || []).length > 0) {
    t.para(`Email tokens armazenados: ${emailTokens.tokens.length} (Gmail OAuth)`, 9.5, "#334155");
  }

  // A criar ainda
  const pending: string[] = [];
  if (!env["AVIRATO_WEBCODE"]) pending.push("AVIRATO_WEBCODE");
  if (!env["AVIRATO_CLIENT_SECRET"]) pending.push("AVIRATO_CLIENT_SECRET");
  if (!env["STRIPE_SECRET_KEY"]) pending.push("STRIPE_SECRET_KEY (opcional — só se usar Stripe)");
  if (!env["GMAIL_CLIENT_ID"]) pending.push("GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET (Google Cloud OAuth)");
  if (!env["GMAIL_REFRESH_TOKEN"]) pending.push("GMAIL_REFRESH_TOKEN");
  if (!env["DATABASE_URL"]) pending.push("DATABASE_URL (Postgres — Neon/Supabase)");
  if (pending.length) {
    t.section("2", "A CRIAR AINDA");
    for (const p of pending) t.bullet("▸", p, "#ef4444");
  }

  // Chaves por plataforma
  t.section("3", "CHAVES E TOKENS POR PLATAFORMA");
  for (const p of platforms) {
    t.sub(p.name);
    t.para(`Login: ${p.url} · conta: ${p.loginNote}`, 9.5, "#475569");
    for (const k of p.keys) {
      t.kv(k, env[k] || "(EM FALTA)");
    }
    t.para(`Nota: ${p.note}`, 9, "#64748b");
  }

  // Resto das variáveis (todas as que não foram listadas acima)
  const rest = allKeys.filter((k) => !used.includes(k));
  if (rest.length) {
    t.section("4", "OUTRAS VARIÁVEIS (configuração do sistema)");
    for (const k of rest) t.kv(k, env[k] || "");
  }

  const out = path.resolve("data/Viseron_Cofre_Credenciais.pdf");
  t.finish(out);
  console.log(`Cofre gerado: ${out}`);
  console.log("ATENÇÃO: ficheiro confidencial. Guarda-o em local seguro (não partilhar).");
}

main();
