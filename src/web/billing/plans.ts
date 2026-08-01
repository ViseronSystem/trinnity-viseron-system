export interface Plan {
  id: "core" | "pro" | "enterprise";
  name: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  trialDays: number;
  priceId: string;
}

export const PLANS: Plan[] = [
  {
    id: "core",
    name: "Core",
    monthlyPrice: 29,
    description: "Para equipas a automatizar o primeiro fluxo de trabalho.",
    features: ["100 agentes", "1.000 execuções/mês", "Memória persistente", "Suporte por email"],
    trialDays: 14,
    priceId: "price_core_monthly",
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 99,
    description: "Para empresas em escala com múltiplos agentes autónomos.",
    features: ["1.000 agentes", "10.000 execuções/mês", "Skills marketplace", "API + webhooks", "Suporte prioritário"],
    trialDays: 14,
    priceId: "price_pro_monthly",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 499,
    description: "SSO, SLA 99.9%, on-premise e white-label.",
    features: ["Agentes ilimitados", "Execuções ilimitadas", "On-premise/white-label", "SSO/SAML", "Gestor de conta dedicado"],
    trialDays: 14,
    priceId: "price_enterprise_monthly",
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
