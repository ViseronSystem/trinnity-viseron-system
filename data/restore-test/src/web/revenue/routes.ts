import { Router } from "express";
import { getRevenueReadiness } from "./readiness";
import { getAIStatus } from "./ai-status";
import { IMetrics } from "../monitoring/metrics";
import { AccountStore } from "../auth/store";
import { CryptoPayments } from "../../core/crypto/payments";
import { PLANS } from "../billing/plans";
import { projectionTable, capacityIndicators } from "../../core/agency/finance";

export interface RevenueDeps {
  accounts?: AccountStore;
  crypto?: CryptoPayments;
  getAgencyActiveClients?: () => number;
}

export function createRevenueRouter(metrics: IMetrics, deps: RevenueDeps = {}): Router {
  const router = Router();

  router.get("/revenue/readiness", (_req, res) => {
    const report = getRevenueReadiness();
    metrics.inc("revenue_readiness_checks", { ok: String(report.ok) });
    res.json(report);
  });

  // Painel de receita real: planos, tenants, crypto, agência.
  router.get("/revenue/dashboard", async (_req, res) => {
    try {
      const tenants = deps.accounts ? await deps.accounts.listTenants() : [];
      const byPlan: Record<string, number> = { free: 0, core: 0, pro: 0, enterprise: 0 };
      for (const t of tenants) byPlan[t.plan] = (byPlan[t.plan] || 0) + 1;
      const mrrCards = PLANS.reduce((acc, p) => acc + (byPlan[p.id] || 0) * p.monthlyPrice, 0);
      const crypto = deps.crypto ? deps.crypto.totals() : { paidCount: 0, paidUsd: 0, pendingUsd: 0, pendingCount: 0 };
      const agencyActiveClients = deps.getAgencyActiveClients ? deps.getAgencyActiveClients() : 0;
      const agency = projectionTable(agencyActiveClients).at(-1);
      const capacity = capacityIndicators(agencyActiveClients);
      res.json({
        ok: true,
        plans: PLANS.map((p) => ({ id: p.id, name: p.name, monthlyPrice: p.monthlyPrice, subscribers: byPlan[p.id] || 0, mrr: (byPlan[p.id] || 0) * p.monthlyPrice })),
        tenants: tenants.length,
        mrrCards,
        arrCards: mrrCards * 12,
        crypto,
        agency: { activeClients: agencyActiveClients, projection: agency, capacity },
        revenueModes: getRevenueReadiness().revenueModes,
        updatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Falha ao gerar dashboard de receita" });
    }
  });

  router.get("/ai/status", async (_req, res) => {
    try {
      const status = await getAIStatus();
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Falha ao verificar estado da IA" });
    }
  });

  return router;
}
