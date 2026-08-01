import { Router } from "express";
import { PLANS } from "./plans";
import { StripeBilling } from "./stripe";
import { AccountStore } from "../auth/store";
import { AuthedRequest, requireAuth } from "../auth/middleware";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";
import { EmailService } from "../email/service";

export function createBillingRouter(
  store: AccountStore,
  billing: StripeBilling,
  logger: ILogger,
  metrics: IMetrics,
  email?: EmailService
): Router {
  const router = Router();

  router.get("/billing/plans", (_req, res) => {
    res.json({ ok: true, plans: PLANS });
  });

  router.get("/billing/subscription", requireAuth, (req: AuthedRequest, res) => {
    const tenant = store.getTenantById(req.user!.tenantId);
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
      const user = store.getUserById(req.user!.sub);
      if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });
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
      const signature = String(req.headers["stripe-signature"] || "");
      const event = await billing.handleWebhook(rawBody || Buffer.from("{}"), signature);
      if (!event) return res.status(400).json({ error: "Evento inválido" });
      metrics.inc("billing_webhooks_total", { type: event.type });
      if (event.type === "checkout.session.completed") {
        const plan = event.plan || "pro";
        store.updateTenantPlan(event.tenantId || "", plan as any);
        logger.info(`Pagamento confirmado: tenant ${event.tenantId} → plano ${plan}`);
        if (email?.transport.enabled) {
          const owner = store.listUsers(event.tenantId || "").find((u) => u.role === "owner");
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
      logger.error(`Webhook Stripe: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
