import { Router } from "express";
import { PLANS } from "./plans";
import { BillingProvider } from "./types";
import { AccountStore } from "../auth/store";
import { AuthedRequest, requireAuth } from "../auth/middleware";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";
import { EmailService } from "../email/service";
import { CryptoPayments } from "../../core/crypto/payments";

export function createBillingRouter(
  store: AccountStore,
  billing: BillingProvider,
  logger: ILogger,
  metrics: IMetrics,
  email?: EmailService,
  crypto?: CryptoPayments
): Router {
  const router = Router();

  router.get("/billing/plans", (_req, res) => {
    res.json({ ok: true, plans: PLANS });
  });

  router.get("/billing/subscription", requireAuth, async (req: AuthedRequest, res) => {
    const tenant = await store.getTenantById(req.user!.tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant não encontrado" });
    const plan = PLANS.find((p) => p.id === tenant.plan);
    res.json({
      plan: tenant.plan,
      planName: plan?.name,
      trial: !!tenant.trialEndsAt,
      trialEndsAt: tenant.trialEndsAt,
      active: tenant.plan !== "free" || !!tenant.trialEndsAt,
    });
  });

  router.post("/billing/checkout", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const plan = String(req.body?.plan || "");
      if (!plan) return res.status(400).json({ error: "Plano é obrigatório" });
      const user = await store.getUserById(req.user!.sub);
      if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });

      // Pagamento em cripto (BTC/ETH/USDT) — fatura real na exchange.
      const method = String(req.body?.method || "card").toLowerCase();
      if (method === "crypto") {
        if (!crypto) return res.status(400).json({ error: "Pagamento cripto não disponível" });
        const currency = String(req.body?.currency || "USDT").toUpperCase() as "BTC" | "ETH" | "USDT";
        if (!["BTC", "ETH", "USDT"].includes(currency)) return res.status(400).json({ error: "Moeda inválida (BTC|ETH|USDT)" });
        const planInfo = PLANS.find((p) => p.id === plan);
        if (!planInfo) return res.status(400).json({ error: "Plano inválido (core|pro|enterprise)" });
        const invoice = await crypto.createInvoice({
          plan: planInfo.id,
          planName: planInfo.name,
          amountUsd: planInfo.monthlyPrice,
          currency,
          tenantId: user.tenantId,
        });
        metrics.inc("billing_checkout_total", { plan, method: "crypto" });
        logger.info(`Checkout crypto: ${user.email} → ${plan} ${currency} (${invoice.id})`);
        return res.json({ ok: true, provider: "crypto", mode: crypto.status().mode, invoice });
      }

      const base = req.headers.origin || `http://localhost:${process.env.PORT || "3000"}`;
      const session = await billing.createCheckoutSession({
        plan,
        customerEmail: user.email,
        tenantId: user.tenantId,
        successUrl: `${base}/dashboard?checkout=success`,
        cancelUrl: `${base}/dashboard?checkout=cancel`,
      });
      metrics.inc("billing_checkout_total", { plan });
      logger.info(`Checkout iniciado: ${user.email} → ${plan} (${session.provider})`);
      res.json({ ok: true, ...session });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Falha ao criar sessão de checkout" });
    }
  });

  router.post("/billing/webhook", async (req, res) => {
    try {
      const rawBody = (req as any).rawBody as Buffer | undefined;
      const signature = String(req.headers["stripe-signature"] || req.headers["x-avirato-signature"] || "");
      const event = await billing.handleWebhook(rawBody || Buffer.from("{}"), signature);
      if (!event) return res.status(400).json({ error: "Evento inválido" });
      metrics.inc("billing_webhooks_total", { type: event.type });
      if (event.type === "checkout.session.completed") {
        const plan = event.plan || "pro";
        await store.updateTenantPlan(event.tenantId || "", plan as any);
        logger.info(`Pagamento confirmado: tenant ${event.tenantId} → plano ${plan} (${billing.name})`);
        if (email?.transport.enabled) {
          const owner = (await store.listUsers(event.tenantId || "")).find((u) => u.role === "owner");
          if (owner) {
            const planInfo = PLANS.find((p) => p.id === plan);
            const amount = planInfo ? `${planInfo.monthlyPrice}€/mês` : plan;
            email
              .sendInvoice(owner.email, owner.name, plan, amount, `${process.env.TVS_PUBLIC_URL || "https://www.trinnityviseronsystem.io"}/dashboard`)
              .catch(() => {});
          }
        }
      }
      res.json({ ok: true, received: true });
    } catch (e: any) {
      logger.error(`Webhook ${billing.name}: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
