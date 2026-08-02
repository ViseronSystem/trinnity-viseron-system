import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

// TVS - COFRE DE CREDENCIAIS
// Gera data/Viseron_Cofre_Credenciais.pdf com TODAS as plataformas, chaves,
// tokens e logins que o projeto já criou (lidas do .env).
//   npm run cofre
// ATENÇÃO: ficheiro CONFIDENCIAL. Guarda-o encriptado, não o partilhes.

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

interface Platform {
  name: string;
  url: string;
  email: string;
  keys: string[];
  note: string;
}

function main() {
  const env = readEnv();
  console.log("Gerando cofre de credenciais...");

  const platforms: Platform[] = [
    {
      name: "CLOUDFLARE (DNS, CDN, R2)",
      url: "https://dash.cloudflare.com",
      email: "? (conta que registou) — cola aqui o teu email de login",
      keys: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ZONE_ID", "CLOUDFLARE_R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_SECRET_ACCESS_KEY", "CLOUDFLARE_R2_ENDPOINT"],
      note: "Zona trinnityviseron.com ativa (status active). NS da zona: chad.ns.cloudflare.com + kay.ns.cloudflare.com. Ainda NÃO são autoritativos (registador manda nos NS).",
    },
    {
      name: "RENDER (deploy / hosting da app)",
      url: "https://dashboard.render.com",
      email: "? (conta que registou)",
      keys: ["RENDER_API_KEY", "RENDER_API_URL", "RENDER_SERVICE_ID", "RENDER_WEB_URL"],
      note: "Serviço viseron-web → https://viseron-web.onrender.com. Env vars já definidas no Render: TVS_PUBLIC_URL=https://www.trinnityviseron.com e EMAIL_FROM.",
    },
    {
      name: "HOSTALIA (registrador do domínio trinnityviseron.com)",
      url: "https://www.hostalia.com",
      email: "? (email da conta Hostalia onde registou o domínio)",
      keys: ["HOSTALIA_FTP_HOST", "HOSTALIA_FTP_USER", "HOSTALIA_FTP_PASS", "HOSTALIA_FTP_PATH", "HOSTALIA_FTP_SSL"],
      note: "FTP ainda com valores placeholder (ftp.seusite.com.br) — sem acesso real. Falta trocar os NS de servicio-online.net para chad.ns.cloudflare.com + kay.ns.cloudflare.com no painel.",
    },
    {
      name: "AVIRATO PAYMENTS (cobranças — processador de pagamento)",
      url: "https://app.aviratopayments.com",
      email: "? (conta que registou na Avirato)",
      keys: ["AVIRATO_API_KEY", "AVIRATO_WEBCODE", "AVIRATO_CLIENT_SECRET", "AVIRATO_ENV"],
      note: "Ambiente LIVE. Doc: avirato.money/en/developers. Checkout: POST /payment/session (webcode + montante em cêntimos EUR) → paymentUrl. Webhook: HMAC SHA256 com o client secret (header X-Avirato-Signature).",
    },
    {
      name: "TWILIO (SMS / verificação)",
      url: "https://console.twilio.com",
      email: "? (conta que registou)",
      keys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
      note: "Usado para SMS/verificação de código.",
    },
    {
      name: "SISTEMA TVS (configuração local)",
      url: "local .env",
      email: "",
      keys: ["OLLAMA_HOST", "PORT", "REPORT_PORT", "PUBLIC_HOSTNAME", "NODE_ENV", "OMNIROUTE_ENABLED", "OMNIROUTE_PORT", "OMNIROUTE_DATA_DIR"],
      note: "Configuração do sistema; não são segredos, mas convém manter no cofre.",
    },
  ];

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
    doc.fontSize(8).fillColor("#888888").text(`TVS v5.0 — Cofre de Credenciais · ${new Date().toLocaleString("pt-PT")} · CONFIDENCIAL · p.${doc.bufferedPageRange().count + 1}`, 50, H - 28, { width: W - 100 });
  };

  // Capa
  doc.fillColor("#050510").rect(0, 0, W, H).fill();
  doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(11).text("TRINNITY VISERON SYSTEM", W / 2, 150, { align: "center", width: W - 100 });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(30).text("COFRE DE CREDENCIAIS", W / 2, 190, { align: "center", width: W - 100 });
  doc.fillColor("#94a3b8").font("Helvetica").fontSize(12).text("Todas as plataformas, logins, chaves e tokens do projeto", W / 2, 250, { align: "center", width: W - 100 });
  doc.fillColor("#ef4444").font("Helvetica-Bold").fontSize(12).text("CONFIDENCIAL — guardar em local seguro, não partilhar", W / 2, 290, { align: "center", width: W - 100 });
  doc.addPage();
  drawFooter();

  // Missing keys
  const pending: string[] = [];
  if (!env["AVIRATO_WEBCODE"]) pending.push("AVIRATO_WEBCODE (painel Avirato → Integrations → API Keys)");
  if (!env["AVIRATO_CLIENT_SECRET"]) pending.push("AVIRATO_CLIENT_SECRET (painel Avirato → Integrations → API Keys → Client secret)");
  if (!env["STRIPE_SECRET_KEY"]) pending.push("STRIPE_SECRET_KEY (opcional — se preferires Stripe em vez de Avirato)");
  if (!env["STRIPE_WEBHOOK_SECRET"]) pending.push("STRIPE_WEBHOOK_SECRET (opcional — se usar Stripe)");
  if (!env["GMAIL_CLIENT_ID"]) pending.push("GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET (Google Cloud OAuth)");
  if (!env["GMAIL_REFRESH_TOKEN"]) pending.push("GMAIL_REFRESH_TOKEN (após consentimento)");
  if (!env["DATABASE_URL"]) pending.push("DATABASE_URL (Postgres — criar Neon/Supabase)");

  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("A CRIAR AINDA (não perder de vista)", 50, doc.y + 10);
  doc.fillColor("#ef4444").font("Helvetica").fontSize(10).text(`  ${pending.join("\n  ")}`, 50, doc.y + 6, { width: W - 100 });
  doc.moveDown(1.5);

  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("CHAVES E TOKENS POR PLATAFORMA", 50, doc.y);
  doc.moveDown(0.6);

  for (const p of platforms) {
    if (doc.y > H - 160) { doc.addPage(); drawFooter(); }
    doc.fillColor("#050510").rect(50, doc.y - 4, W - 100, 24).fill();
    doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(12).text(p.name, 56, doc.y - 1);
    doc.moveDown(1);
    doc.fillColor("#1e293b").font("Helvetica").fontSize(9.5).text(`Login em: ${p.url}`, 56, doc.y, { width: W - 112 });
    doc.moveDown(0.3);
    doc.fillColor("#475569").font("Helvetica").fontSize(9.5).text(`Conta/email: ${p.email}`, 56, doc.y, { width: W - 112 });
    doc.moveDown(0.3);
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9.5).text("Chaves / tokens:", 56, doc.y);
    doc.moveDown(0.2);
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

  doc.end();
}

main();
