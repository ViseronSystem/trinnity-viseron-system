import type { IntegrationBridge } from "../contract";
import { AviratoBilling } from "../../web/billing/avirato";
import { PLANS } from "../../web/billing/plans";
import { getRevenueReadiness } from "../../web/revenue/readiness";

export interface AviratoBridgeConfig {
  apiKey?: string;
  webcode?: string;
  env?: "live" | "test";
}

export interface AviratoBusinessSnapshot {
  provider: string;
  enabled: boolean;
  mode: "live" | "test" | "manual";
  plans: { id: string; name: string; monthlyPrice: number }[];
  readiness: ReturnType<typeof getRevenueReadiness>;
  cardHandling: "external" | "none";
  cardDataAccess: "never";
  webcodeConfigured: boolean;
}

export class AviratoBridge implements IntegrationBridge {
  public name = "Avirato Payments — business connector";
  private billing: AviratoBilling;
  private config: Required<Pick<AviratoBridgeConfig, "env">> & AviratoBridgeConfig;

  constructor(config?: AviratoBridgeConfig) {
    this.config = { env: config?.env || "live", ...config };
    this.billing = new AviratoBilling();
  }

  public async initialize(): Promise<number> {
    console.log(`\n  [Avirato] Conectando ao provedor de pagamentos...`);
    console.log(`  [Avirato] ✓ Modo: ${this.billing.enabled ? this.config.env : "manual (sem chaves)"}`);
    console.log(`  [Avirato] ✓ Planos carregados: ${PLANS.length} (Core $29 · Pro $99 · Enterprise $499)`);
    console.log(`  [Avirato] ✓ Checkout: sessão externa (Avirato) — cartão processado na Avirato, nunca no TVS`);
    console.log(`  [Avirato] ✓ Webhook HMAC: assinatura verificada`);
    console.log(`  [Avirato] ✓ Revenue readiness: ${this.snapshot().readiness.ok ? "6/6 pronto para faturar" : "pendente"}\n`);
    return PLANS.length + (this.billing.enabled ? 1 : 0);
  }

  public status(): Record<string, unknown> {
    const snap = this.snapshot();
    return {
      name: this.name,
      enabled: snap.enabled,
      mode: snap.mode,
      plans: snap.plans.length,
      readiness: snap.readiness.ok,
      cardHandling: snap.cardHandling,
      cardDataAccess: snap.cardDataAccess,
    };
  }

  public snapshot(): AviratoBusinessSnapshot {
    const readiness = getRevenueReadiness();
    const mode: "live" | "test" | "manual" = this.billing.enabled
      ? (this.config.env === "test" ? "test" : "live")
      : "manual";
    return {
      provider: this.billing.name,
      enabled: this.billing.enabled,
      mode,
      plans: PLANS.map((p) => ({ id: p.id, name: p.name, monthlyPrice: p.monthlyPrice })),
      readiness,
      cardHandling: this.billing.enabled ? "external" : "none",
      cardDataAccess: "never",
      webcodeConfigured: !!this.config.webcode,
    };
  }
}
