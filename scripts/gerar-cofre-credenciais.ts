import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import PDFDocument from "pdfkit";

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

  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  const W = doc.page.width;
  const H = doc.page.height;
  const chunks: Buffer[] = [];

  doc.on("data", (c: Buffer) => chunks.push(c));
  doc.on("end", () => {
    const out = path.resolve("data/Viseron_Cofre_Credenciais.pdf");
    fs.writeFileSync(out, Buffer.concat(chunks));
    console.log(`Cofre gerado: ${out}`);
    console.log("ATENÇÃO: ficheiro confidencial. Guarda-o em local seguro (não partilhar).");
  });

  const drawFooter = () => {
    doc.fontSize(8).fillColor("#888888").text(`TVS v5.0 — Cofre de Credenciais (completo) · ${new Date().toLocaleString("pt-PT")} · CONFIDENCIAL · p.${doc.bufferedPageRange().count + 1}`, 50, H - 28, { width: W - 100 });
  };

  // Capa
  doc.fillColor("#050510").rect(0, 0, W, H).fill();
  doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(11).text("TRINNITY VISERON SYSTEM", W / 2, 140, { align: "center", width: W - 100 });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(30).text("COFRE DE CREDENCIAIS", W / 2, 180, { align: "center", width: W - 100 });
  doc.fillColor("#94a3b8").font("Helvetica").fontSize(12).text("Todas as senhas, chaves, emails, API keys e tokens do sistema", W / 2, 245, { align: "center", width: W - 100 });
  doc.fillColor("#ef4444").font("Helvetica-Bold").fontSize(12).text("CONFIDENCIAL — não partilhar · guardar em local seguro", W / 2, 285, { align: "center", width: W - 100 });
  doc.addPage();
  drawFooter();

  // Identidade / contas
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("CONTAS E EMAILS", 50, doc.y);
  doc.moveDown(0.4);
  doc.fillColor("#1e293b").font("Helvetica").fontSize(9.5).text(`GitHub (repo): https://github.com/ViseronSystem/trinnity-viseron-system · utilizador git: ${git("user.name")} · email git: ${git("user.email")}`, 56, doc.y, { width: W - 112 });
  doc.moveDown(0.4);
  const users = accounts.users || [];
  if (users.length === 0) {
    doc.fillColor("#64748b").font("Helvetica-Oblique").fontSize(9.5).text("Contas registadas no sistema (accounts.json): nenhuma ainda (regista-te em /api/auth/register para criar a primeira).", 56, doc.y, { width: W - 112 });
  } else {
    doc.fillColor("#1e293b").font("Helvetica").fontSize(9.5).text("Contas registadas no sistema (accounts.json):", 56, doc.y, { width: W - 112 });
    doc.moveDown(0.2);
    for (const u of users) {
      doc.fillColor("#334155").font("Helvetica").fontSize(9).text(`  • ${u.name || "?"} — ${u.email || "?"} (tenant ${u.tenantId || "?"}, role ${u.role || "?"})`, 60, doc.y, { width: W - 120 });
      doc.moveDown(0.1);
    }
  }
  doc.moveDown(0.6);
  if ((emailTokens.tokens || []).length > 0) {
    doc.fillColor("#334155").font("Helvetica").fontSize(9).text(`Email tokens armazenados: ${emailTokens.tokens.length} (Gmail OAuth)`);
    doc.moveDown(0.4);
  }
  doc.moveDown(1);

  // A criar ainda
  const pending: string[] = [];
  if (!env["AVIRATO_WEBCODE"]) pending.push("AVIRATO_WEBCODE");
  if (!env["AVIRATO_CLIENT_SECRET"]) pending.push("AVIRATO_CLIENT_SECRET");
  if (!env["STRIPE_SECRET_KEY"]) pending.push("STRIPE_SECRET_KEY (opcional — só se usar Stripe)");
  if (!env["GMAIL_CLIENT_ID"]) pending.push("GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET (Google Cloud OAuth)");
  if (!env["GMAIL_REFRESH_TOKEN"]) pending.push("GMAIL_REFRESH_TOKEN");
  if (!env["DATABASE_URL"]) pending.push("DATABASE_URL (Postgres — Neon/Supabase)");
  if (pending.length) {
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("A CRIAR AINDA", 50, doc.y);
    doc.fillColor("#ef4444").font("Helvetica").fontSize(10).text(`  ${pending.join("\n  ")}`, 50, doc.y + 6, { width: W - 100 });
    doc.moveDown(1.2);
  }

  // Chaves por plataforma
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("CHAVES E TOKENS POR PLATAFORMA", 50, doc.y);
  doc.moveDown(0.6);

  for (const p of platforms) {
    if (doc.y > H - 170) { doc.addPage(); drawFooter(); }
    doc.fillColor("#050510").rect(50, doc.y - 4, W - 100, 24).fill();
    doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(12).text(p.name, 56, doc.y - 1);
    doc.moveDown(1);
    doc.fillColor("#475569").font("Helvetica").fontSize(9.5).text(`Login: ${p.url} · conta: ${p.loginNote}`, 56, doc.y, { width: W - 112 });
    doc.moveDown(0.3);
    for (const k of p.keys) {
      const v = env[k] || "(EM FALTA)";
      if (doc.y > H - 70) { doc.addPage(); drawFooter(); }
      doc.fillColor("#334155").font("Helvetica-Bold").fontSize(9).text(`${k} =`, 60, doc.y);
      doc.fillColor("#7f1d1d").font("Courier").fontSize(9).text(v, 60 + k.length * 5.2 + 4, doc.y, { width: W - 124 - k.length * 5.2 });
      doc.moveDown(0.15);
    }
    doc.fillColor("#64748b").font("Helvetica-Oblique").fontSize(9).text(`Nota: ${p.note}`, 60, doc.y, { width: W - 120 });
    doc.moveDown(1.2);
  }

  // Resto das variáveis (todas as que não foram listadas acima)
  const rest = allKeys.filter((k) => !used.includes(k));
  if (rest.length) {
    if (doc.y > H - 120) { doc.addPage(); drawFooter(); }
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("OUTRAS VARIÁVEIS (configuração do sistema)", 50, doc.y);
    doc.moveDown(0.4);
    for (const k of rest) {
      if (doc.y > H - 70) { doc.addPage(); drawFooter(); }
      doc.fillColor("#334155").font("Helvetica-Bold").fontSize(9).text(`${k} =`, 56, doc.y);
      doc.fillColor("#475569").font("Courier").fontSize(9).text(env[k] || "", 56 + k.length * 5.2 + 4, doc.y, { width: W - 120 - k.length * 5.2 });
      doc.moveDown(0.15);
    }
  }

  doc.end();
}

main();
