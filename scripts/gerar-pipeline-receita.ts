import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { getRevenueReadiness } from "../src/web/revenue/readiness";

// TVS — PLANO DE RECEITA REAL
// Passo a passo para o TVS COBRAR dinheiro real (Stripe + Gmail + domínio + Postgres)
// e o modelo de receita (preços, LTV, MRR, metas).
// Saída: data/Viseron_Pipeline_Receita.pdf (servido em /pitch/Viseron_Pipeline_Receita.pdf)
// Uso: npm run docs:revenue

const STEPS: Array<{ t: string; d: string; a: string[] }> = [
  {
    t: "1. Stripe — ativar cobranças reais",
    d: "Sem chave, o checkout cria sessões de demonstração (trial). Com STRIPE_SECRET_KEY de produção, o Stripe cobre subscrições e faturação.",
    a: [
      "Criar conta em dashboard.stripe.com",
      "Settings → Business → completar dados da empresa (nome, NIF/VAT, endereço)",
      "Developers → API keys → revelar chave secreta (sk_live_...)",
      "Definir STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET no Render (.env)",
      "Criar 3 produtos/preços no Stripe: Core 29€, Pro 99€, Enterprise 499€/mês",
      "Guardar os price ids nos plans (src/web/billing/plans.ts priceId)",
    ],
  },
  {
    t: "2. Stripe Webhook — upgrade automático",
    d: "O evento checkout.session.completed tem de chegar ao servidor para o tenant passar a Pro/Enterprise sem intervenção manual.",
    a: [
      "Stripe dashboard → Developers → Webhooks → Add endpoint",
      "URL: https://viseron-web.onrender.com/api/billing/webhook",
      "Eventos: checkout.session.completed, invoice.payment_failed, customer.subscription.deleted",
      "Copiar o signing secret (whsec_...) e definir STRIPE_WEBHOOK_SECRET",
      "Testar com o modo de teste do Stripe antes de ir para produção",
    ],
  },
  {
    t: "3. Gmail OAuth — emails reais",
    d: "O agente de atendimento envia emails de boas-vindas, verificação, reposição de password e faturas.",
    a: [
      "Google Cloud Console → criar projeto 'Viseron'",
      "APIs & Services → Enable Gmail API",
      "OAuth consent screen → configurar app (test mode), adicionar contas de teste",
      "Credentials → OAuth 2.0 Client ID (Web) com redirect para /api/email/gmail/callback",
      "Definir GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_USER",
      "Correr npm run gmail:setup → autorizar → guardar o GMAIL_REFRESH_TOKEN",
    ],
  },
  {
    t: "4. Email provider em produção",
    d: "Sem provider, os emails caem no modo dev (ficheiros). SMTP/Resend/SendGrid entregam emails reais.",
    a: [
      "Escolher um provider (Resend é o mais simples; SendGrid bom volume)",
      "Criar chave API + verificar o domínio no provider",
      "Definir EMAIL_PROVIDER=resend|sendgrid|smtp e a chave correspondente",
      "Definir EMAIL_FROM=Trinnity Viseron System <no-reply@trinnityviseronsystem.io>",
    ],
  },
  {
    t: "5. Domínio próprio + HTTPS",
    d: "www.trinnityviseronsystem.io dá credibilidade ao checkout e às faturas. Sem ele, o sucesso da compra cai num domínio Render.",
    a: [
      "Registar o domínio (Cloudflare ~10€/ano, Namecheap, GoDaddy)",
      "Apontar DNS: CNAME/ALIAS para o Render (ou usar Vercel na frente)",
      "Definir TVS_PUBLIC_URL=https://www.trinnityviseronsystem.io",
      "npm run deploy:domain:check para validar DNS/HTTPS",
      "Configurar SSL (Render/Vercel emitem certificado automático)",
    ],
  },
  {
    t: "6. Base de dados Postgres",
    d: "Contas e faturas em ficheiros JSON funcionam, mas Postgres dá robustez, concorrência e backups.",
    a: [
      "Criar Postgres grátis (Neon, Supabase) ou pago (Render, Railway)",
      "Definir DATABASE_URL=postgres://...",
      "npm run backup continua a arquivar os dados",
    ],
  },
];

const REVENUE_MODEL: Array<[string, string]> = [
  ["Preços", "Core $29 · Pro $99 · Enterprise $499/mês (trial 14 dias em todos)"],
  ["Conversão checkout → cliente", "Meta: 2-5% dos visitantes que iniciam o checkout"],
  ["LTV médio estimado", "Pro: 99€ × retenção ~12 meses ≈ 1.188€ por cliente"],
  ["MRR a 30 clientes Pro", "99€ × 30 = 2.970€/mês"],
  ["MRR a 100 clientes (mix)", "≈ 7.000€/mês (recurring, estável)"],
  ["Meta a 12 meses", "100-200 clientes pagantes · MRR 7-14k€/mês · ARR ~100k€"],
  ["Estratégia de arranque", "10 primeiros clientes via contacto direto + landing + JARVIS; depois canal de conteúdo automático"],
];

function main() {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  const outFile = path.resolve("data", "Viseron_Pipeline_Receita.pdf");
  if (!fs.existsSync(path.dirname(outFile))) fs.mkdirSync(path.dirname(outFile), { recursive: true });
  doc.pipe(fs.createWriteStream(outFile));

  const W = doc.page.width;
  const PH = doc.page.height;
  const drawFooter = () => {
    doc.page.margins.bottom = 8;
    doc.fontSize(8).fillColor("#888888").text(`TVS v5.0 · Plano de Receita Real · ${new Date().toLocaleString("pt-PT")} · p.${doc.bufferedPageRange().count + 1}`, 50, PH - 28, { width: W - 100 });
    doc.page.margins.bottom = 50;
  };
  const heading = (n: string, t: string) => {
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text(`${n}. ${t}`, 50, doc.y);
    doc.fillColor("#22d3ee").rect(50, doc.y + 2, 28, 2).fill();
    doc.moveDown();
  };

  const readiness = getRevenueReadiness();

  // Capa
  doc.fillColor("#0f172a").rect(0, 0, W, PH).fill();
  doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(11).text("TRINNITY VISERON SYSTEM · RECEITA REAL", W / 2, 150, { align: "center", width: W - 100 });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(32).text("PLANO DE RECEITA", W / 2, 190, { align: "center", width: W - 100 });
  doc.fillColor(readiness.ok ? "#22c55e" : "#eab308").font("Helvetica-Bold").fontSize(18).text(readiness.ok ? "PRONTO PARA FATURAR" : "GO-LIVE PENDENTE", W / 2, 260, { align: "center", width: W - 100 });
  doc.fillColor("#94a3b8").font("Helvetica").fontSize(12).text(`${readiness.requirements.filter(r => r.ready).length}/${readiness.requirements.length} requisitos prontos · ${new Date().toLocaleString("pt-PT")}`, W / 2, 310, { align: "center", width: W - 100 });
  doc.fillColor("#22d3ee").fontSize(12).text("www.trinnityviseronsystem.io · Core $29 · Pro $99 · Enterprise $499", W / 2, 350, { align: "center", width: W - 100 });
  doc.addPage();
  drawFooter();

  // 1. Estado atual (readiness)
  heading("1", "Estado atual dos requisitos (ao vivo)");
  for (const r of readiness.requirements) {
    if (doc.y > PH - 90) { doc.addPage(); drawFooter(); }
    doc.fillColor(r.ready ? "#22c55e" : "#ef4444").font("Helvetica-Bold").fontSize(11).text(`${r.ready ? "✓" : "○"} ${r.label}`);
    doc.fillColor("#64748b").font("Helvetica").fontSize(9.5).text(`   ${r.value} — ${r.description}`, 60, doc.y, { width: W - 110 });
    doc.moveDown(0.5);
  }
  doc.moveDown(0.5);
  if (readiness.missing.length) {
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text("Em falta:");
    doc.fillColor("#ef4444").font("Helvetica").fontSize(10).text(`   ${readiness.missing.join(" · ")}`);
  }

  // 2. Passo a passo
  heading("2", "Passo a passo para faturar");
  for (const s of STEPS) {
    if (doc.y > PH - 180) { doc.addPage(); drawFooter(); }
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text(s.t);
    doc.fillColor("#64748b").font("Helvetica").fontSize(10).text(s.d, 55, doc.y, { width: W - 105 });
    doc.moveDown(0.4);
    for (const a of s.a) {
      if (doc.y > PH - 60) { doc.addPage(); drawFooter(); }
      doc.fillColor("#1e293b").font("Helvetica").fontSize(9.5).text(`   ▸ ${a}`, 55, doc.y, { width: W - 105 });
      doc.moveDown(0.2);
    }
    doc.moveDown(0.6);
  }

  // 3. Modelo de receita
  heading("3", "Modelo de receita");
  for (const [k, v] of REVENUE_MODEL) {
    if (doc.y > PH - 60) { doc.addPage(); drawFooter(); }
    doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(10).text(`${k}: `, 50, doc.y);
    doc.fillColor("#1e293b").font("Helvetica").fontSize(10).text(v, 50 + k.length * 4.5, doc.y, { width: W - 100 - k.length * 4.5 });
    doc.moveDown(0.6);
  }

  // 4. Próximo passo operacional
  heading("4", "Próximo passo imediato");
  const next = readiness.requirements.find((r) => !r.ready && r.key === "stripe") || readiness.requirements.find((r) => !r.ready);
  if (next) {
    doc.fillColor("#1e293b").font("Helvetica").fontSize(10.5);
    doc.text(`Começar por: ${next.label}`);
    doc.text(`Ação: ${next.action}`);
  } else {
    doc.fillColor("#22c55e").font("Helvetica-Bold").fontSize(11).text("Tudo pronto — ativar o modo cobrança e ligar o webhook!");
  }

  doc.end();
  console.log(`✅ Plano de receita gerado: ${outFile}`);
}

main();
