import { BillingProvider } from "./types";
import { AviratoBilling } from "./avirato";
import { StripeBilling } from "./stripe";

export type { BillingProvider } from "./types";

// Escolhe o provedor de billing ativo:
//   1. Avirato (primário) — se AVIRATO_API_KEY + AVIRATO_WEBCODE definidos
//   2. Stripe (opcional)  — se STRIPE_SECRET_KEY definido
//   3. Modo manual        — dev/sem configuração
export function createBilling(): BillingProvider {
  if (process.env.AVIRATO_API_KEY && process.env.AVIRATO_WEBCODE) {
    return new AviratoBilling();
  }
  return new StripeBilling();
}
