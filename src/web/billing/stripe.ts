import { getPlan, Plan } from "./plans";

export interface CheckoutSession {
  url: string | null;
  mode: string;
  provider: "stripe" | "manual";
}

export class StripeBilling {
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

  async createCheckoutSession(input: {
    plan: string;
    customerEmail: string;
    tenantId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
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
    return { url: session.url, mode: "subscription", provider: "stripe" };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ type: string; tenantId?: string; plan?: string } | null> {
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
