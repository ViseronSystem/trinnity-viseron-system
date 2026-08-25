import { PLANS } from "../billing/plans";
import { gmailConfigured } from "../email/gmail";

// Revenue Pipeline — Readiness / Go-Live
// Reporta que falta para o TVS COBRAR dinheiro real (Stripe + Gmail + domínio).

export interface RevenueRequirement {
  key: string;
  label: string;
  description: string;
  ready: boolean;
  value: string;
  action: string;
}

export interface RevenueReadiness {
  ok: boolean;
  revenueModes: string[];
  requirements: RevenueRequirement[];
  missing: string[];
  plans: Array<{ id: string; name: string; monthlyPrice: number; trialDays: number }>;
}

export function getRevenueReadiness(): RevenueReadiness {
  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET || "";
  const aviratoKey = process.env.AVIRATO_API_KEY || "";
  const aviratoWebcode = process.env.AVIRATO_WEBCODE || "";
  const aviratoSecret = process.env.AVIRATO_CLIENT_SECRET || "";
  const gmail = gmailConfigured();
  const emailProvider = process.env.EMAIL_PROVIDER || "dev";
  const dbUrl = process.env.DATABASE_URL || "";
  const publicUrl = process.env.TVS_PUBLIC_URL || "";

  const processorReady = !!(stripeKey || (aviratoKey && aviratoWebcode));
  const processorLabel = aviratoKey ? "Avirato Payments" : "Stripe";

  const requirements: RevenueRequirement[] = [
    {
      key: "processor",
      label: `${processorLabel} (cobranças reais)`,
      description: "Checkout de subscrições e faturação em produção",
      ready: processorReady,
      value: stripeKey ? "Stripe configurado" : aviratoKey ? (aviratoWebcode ? "Avirato configurado" : "Avirato: falta AVIRATO_WEBCODE") : "modo manual/dev",
      action: aviratoKey ? "Definir AVIRATO_WEBCODE no .env (ver painel Avirato → Integrations → API Keys)" : "Criar conta em stripe.com → 'Developers → API keys' → definir STRIPE_SECRET_KEY (sk_live_...)",
    },
    {
      key: "processor_webhook",
      label: "Webhook de pagamento",
      description: "Endpoint /api/billing/webhook assinado para upgrade automático do plano",
      ready: !!stripeWebhook || !!aviratoSecret,
      value: stripeWebhook ? "Stripe webhook configurado" : aviratoSecret ? "Avirato webhook (HMAC) configurado" : "sem segredo de webhook",
      action: "Integrations → Webhook Configuration na Avirato (ou Developers → Webhooks no Stripe) → URL https://viseron-web.onrender.com/api/billing/webhook e definir o client secret",
    },
    {
      key: "gmail",
      label: "Gmail OAuth (email real)",
      description: "Agente de atendimento envia emails de verificação, faturas e respostas",
      ready: gmail,
      value: gmail ? "configurado" : "OAuth pendente",
      action: "npm run gmail:setup (Google Cloud → OAuth consent → refresh token)",
    },
    {
      key: "email_provider",
      label: "Email provider de produção",
      description: "Transporte de email ativo (dev/SMTP/Resend/SendGrid/Gmail)",
      ready: emailProvider !== "dev",
      value: emailProvider,
      action: "Definir EMAIL_PROVIDER=smtp|resend|sendgrid|gmail + credenciais correspondentes",
    },
    {
      key: "domain",
      label: "Domínio próprio",
      description: "Domínio registado com TVS_PUBLIC_URL definido (https://www.trinnityviseron.com) para converter vendas",
      ready: !!publicUrl,
      value: publicUrl || "sem TVS_PUBLIC_URL",
      action: "Definir TVS_PUBLIC_URL=https://www.trinnityviseron.com e apontar DNS do domínio para o Render",
    },
    {
      key: "database",
      label: "Base de dados de produção",
      description: "Postgres para contas/faturas persistidas de forma robusta",
      ready: !!dbUrl,
      value: dbUrl ? "Postgres" : "JSON fallback",
      action: "Criar Postgres (Render/Neon/Supabase) e definir DATABASE_URL",
    },
  ];

  const missing = requirements.filter((r) => !r.ready).map((r) => r.key);
  const revenueModes: string[] = [];
  if (processorReady) revenueModes.push(aviratoKey ? "avirato" : "stripe");
  else revenueModes.push("manual-trial");
  if (gmail) revenueModes.push("email-real");
  else revenueModes.push("email-dev");

  return {
    ok: missing.length === 0,
    revenueModes,
    requirements,
    missing,
    plans: PLANS.map((p) => ({ id: p.id, name: p.name, monthlyPrice: p.monthlyPrice, trialDays: p.trialDays })),
  };
}
