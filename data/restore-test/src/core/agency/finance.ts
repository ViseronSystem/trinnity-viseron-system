// TVS — AGENCY OS · Financeiro
// Preços (Londres 2026) e projeção financeira MRR/ARR, conforme o plano
// "Estructura del Equipo" da agência.

export interface AgencyPackage {
  id: string;
  name: string;
  priceMin: number;
  priceMax: number;
  unit: "month" | "once";
  includes: string;
}

export interface ProjectionRow {
  totalClients: number;
  newClients: number;
  newFee: number;
  currentFee: number;
  mrr: number;
  avgFee: number;
  arr: number;
}

export const AGENCY_PACKAGES: AgencyPackage[] = [
  { id: "solo_ads", name: "Solo Ads", priceMin: 900, priceMax: 1200, unit: "month", includes: "Gestión Google/Meta Ads" },
  { id: "solo_creativos", name: "Solo Creativos/IA", priceMin: 600, priceMax: 900, unit: "month", includes: "Copy, guiones, automatización de leads" },
  { id: "landing", name: "Landing Page", priceMin: 600, priceMax: 1200, unit: "once", includes: "Diseño + copy con apoyo de IA (pago único)" },
  { id: "bundle", name: "Bundle completo", priceMin: 1400, priceMax: 1800, unit: "month", includes: "Ads + Creativos/IA + Cuentas" },
];

export const LEGACY_FEE = 1000; // 50 clientes atuais a £1,000/mês
export const NEW_FEE = 1500;    // novos clientes a £1,500/mês (bundle)

// Projeção da tabela do documento: 50 → 100 clientes.
export const PROJECTION_CLIENTS = [50, 60, 70, 80, 100];

export function computeProjection(totalClients: number, current: number, currentFee = LEGACY_FEE, newFee = NEW_FEE): ProjectionRow {
  const newClients = Math.max(0, totalClients - current);
  const mrr = current * currentFee + newClients * newFee;
  const avgFee = totalClients > 0 ? mrr / totalClients : 0;
  return {
    totalClients,
    newClients,
    newFee,
    currentFee,
    mrr,
    avgFee: Math.round(avgFee),
    arr: mrr * 12,
  };
}

export function projectionTable(current: number, currentFee = LEGACY_FEE, newFee = NEW_FEE): ProjectionRow[] {
  return PROJECTION_CLIENTS.map((n) => computeProjection(n, current, currentFee, newFee));
}

// Capacidade operativa com agentes de IA (do documento).
export interface CapacityIndicators {
  clientsPerDayComfortable: number;
  clientsPerCycle: number;
  minutesPerClient: number;
  minutesWithoutAI: number;
  cycleDays: number;
  clientsPerCycleCurrent: number;
  capacityWarning: boolean;
}

export function capacityIndicators(activeClients: number): CapacityIndicators {
  const c = {
    clientsPerDayComfortable: 9,
    clientsPerCycle: 90,
    minutesPerClient: 50,
    minutesWithoutAI: 80,
    cycleDays: 14,
  };
  return {
    ...c,
    clientsPerCycleCurrent: activeClients,
    capacityWarning: activeClients >= c.clientsPerCycle,
  };
}
