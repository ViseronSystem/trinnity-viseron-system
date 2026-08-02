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
  const gmail = gmailConfigured();
  const emailProvider = process.env.EMAIL_PROVIDER || "dev";
  const dbUrl = process.env.DATABASE_URL || "";
  const publicUrl = process.env.TVS_PUBLIC_URL || "";

  const requirements: RevenueRequirement[] = [
    {
      key: "stripe",
      label: "Stripe (cobranças reais)",
      description: "Chave secreta de produção para checkout de subscrições e faturação",
      ready: !!stripeKey,
      value: stripeKey ? "configurado" : "modo manual/dev",
      action: "Criar conta em stripe.com → 'Developers → API keys' → definir STRIPE_SECRET_KEY (sk_live_...)",
    },
    {
      key: "stripe_webhook",
      label: "Stripe Webhook",
      description: "Endpoint /api/billing/webhook assinado para upgrade automático do plano",
      ready: !!stripeWebhook,
      value: stripeWebhook ? "configurado" : "sem STRIPE_WEBHOOK_SECRET",
      action: "No dashboard Stripe: Developers → Webhooks → apontar para https://viseron-web.onrender.com/api/billing/webhook e definir STRIPE_WEBHOOK_SECRET",
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
      description: "www.trinnityviseronsystem.io registado e com HTTPS para converter vendas",
      ready: !!publicUrl && publicUrl.includes("trinnityviseronsystem.io"),
      value: publicUrl || "sem TVS_PUBLIC_URL",
      action: "Registar o domínio (Cloudflare/Namecheap/GoDaddy) e definir TVS_PUBLIC_URL",
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
  if (stripeKey) revenueModes.push("stripe");
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
