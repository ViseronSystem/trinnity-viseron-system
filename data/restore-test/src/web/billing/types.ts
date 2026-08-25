export interface CheckoutSession {
  url: string | null;
  mode: string;
  provider: "stripe" | "avirato" | "manual";
  sessionId?: string;
}

export interface WebhookEvent {
  type: string;
  tenantId?: string;
  plan?: string;
}

export interface CheckoutInput {
  plan: string;
  customerEmail: string;
  tenantId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface BillingProvider {
  name: string;
  enabled: boolean;
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession>;
  handleWebhook(rawBody: Buffer, signature: string): Promise<WebhookEvent | null>;
}
