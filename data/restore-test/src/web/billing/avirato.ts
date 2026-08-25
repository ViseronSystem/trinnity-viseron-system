import crypto from "crypto";
import { getPlan } from "./plans";
import { BillingProvider, CheckoutInput, CheckoutSession, WebhookEvent } from "./types";

// Avirato Payments (avirato.money) — External API
// Doc: https://avirato.money/en/developers
// Base Live: https://aviratopayments.com/external/v1/
// Base Test: https://aviratopayments.com/external/v1/test/

const AVIRATO_BASE = process.env.AVIRATO_BASE_URL || "https://aviratopayments.com/external/v1/";

export class AviratoBilling implements BillingProvider {
  name = "avirato";
  enabled: boolean;
  private apiKey: string;
  private webcode: string;
  private clientSecret: string;
  private test: boolean;

  constructor() {
    this.apiKey = process.env.AVIRATO_API_KEY || "";
    this.webcode = process.env.AVIRATO_WEBCODE || "";
    this.clientSecret = process.env.AVIRATO_CLIENT_SECRET || "";
    this.test = (process.env.AVIRATO_ENV || "live").toLowerCase() === "test";
    this.enabled = !!(this.apiKey && this.webcode);
  }

  private base(): string {
    return this.test ? `${AVIRATO_BASE}test/` : AVIRATO_BASE;
  }

  private async api(method: "POST" | "GET", path: string, body?: unknown): Promise<any> {
    const headers: Record<string, string> = {
      "X-API-KEY": this.apiKey,
      "Content-Type": "application/json",
    };
    const opts: RequestInit = { method, headers };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(`${this.base()}${path}`, opts);
    const json = await res.json().catch(() => ({}));
    if (!json?.success) {
      const err = json?.error || {};
      throw new Error(`Avirato [${err.code || res.status}] ${err.message || "erro desconhecido"} (traceId ${err.traceId || "-"})`);
    }
    return json.data;
  }

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    const plan = getPlan(input.plan);
    if (!plan) throw new Error("Plano inválido");

    if (!this.enabled) {
      // Modo manual (dev/sem configuração Avirato): simula sessão de checkout.
      const sep = input.successUrl.includes("?") ? "&" : "?";
      return { url: `${input.successUrl}${sep}plan=${plan.id}&trial=true`, mode: "trial", provider: "manual" };
    }

    const amount = plan.monthlyPrice * 100;
    const data = await this.api("POST", "payment/session", {
      webcode: this.webcode,
      amount: { value: amount, currency: "EUR" },
      urlOk: input.successUrl,
      urlKo: input.cancelUrl,
      countryCode: "PT",
      shopperLocale: "pt-PT",
      description: `Trinnity Viseron System - Plano ${plan.name}`,
      customReference: `tvs:${input.tenantId}:${plan.id}`,
    });
    return { url: data.paymentUrl, mode: "payment", provider: "avirato", sessionId: data.sessionId };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<WebhookEvent | null> {
    let body: any;
    try {
      body = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return null;
    }
    const eventCode: string = body?.event_code || "unknown";
    const d = body?.data || {};

    // Assinatura HMAC-SHA256: X-Avirato-Signature: t={ts},v1={hmac}
    if (this.clientSecret) {
      const m = signature.match(/^t=(\d+),v1=([a-f0-9]+)$/);
      if (!m) return null;
      const expected = crypto
        .createHmac("sha256", this.clientSecret)
        .update(`${m[1]}.${rawBody.toString("utf8")}`)
        .digest("hex");
      if (expected !== m[2]) return null;
    }

    if (eventCode === "AUTHORISATION") {
      if (d.paymentStatus !== "AUTHORISED") return { type: eventCode, plan: undefined };
      const ref: string = String(d.customReference || "");
      const parts = ref.split(":");
      return { type: "checkout.session.completed", tenantId: parts[1], plan: parts[2] };
    }
    return { type: eventCode };
  }
}
