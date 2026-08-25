import { getPlan, Plan } from "./plans";
import { BillingProvider, CheckoutInput, CheckoutSession, WebhookEvent } from "./types";

export class StripeBilling implements BillingProvider {
  name = "stripe";
  enabled: boolean;
  private stripe: any;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      try {
        // Lazy require so the SDK is only needed when configured.
        const Stripe = require("stripe");
        this.stripe = new Stripe(key, { apiVersion: undefined });
        this.enabled = true;
      } catch (e) {
        console.error(`[Billing] Stripe SDK falhou: ${(e as Error).message}`);
        this.enabled = false;
      }
    } else {
      this.enabled = false;
    }
  }

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    const plan: Plan | undefined = getPlan(input.plan);
    if (!plan) throw new Error("Plano inválido");

    if (!this.enabled) {
      // Modo manual (dev/sem chave): simula uma sessão de checkout e devolve a URL da app.
      const sep = input.successUrl.includes("?") ? "&" : "?";
      return {
        url: `${input.successUrl}${sep}plan=${plan.id}&trial=true`,
        mode: "trial",
        provider: "manual",
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: input.customerEmail,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      subscription_data: { trial_period_days: plan.trialDays },
      metadata: { tenantId: input.tenantId, plan: plan.id },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });
    return { url: session.url, mode: "subscription", provider: "stripe", sessionId: session.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<WebhookEvent | null> {
    if (!this.enabled) {
      // Sem chave Stripe: aceita eventos de dev ignorando a assinatura.
      try {
        const event = JSON.parse(rawBody.toString("utf8"));
        const tenantId = event?.data?.object?.metadata?.tenantId;
        const plan = event?.data?.object?.metadata?.plan;
        return { type: event?.type || "unknown", tenantId, plan };
      } catch {
        return null;
      }
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return null;
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    const tenantId = event.data?.object?.metadata?.tenantId;
    const plan = event.data?.object?.metadata?.plan;
    return { type: event.type, tenantId, plan };
  }
}
