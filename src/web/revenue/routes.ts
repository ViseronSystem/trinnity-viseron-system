import { Router } from "express";
import { getRevenueReadiness } from "./readiness";
import { getAIStatus } from "./ai-status";
import { IMetrics } from "../monitoring/metrics";

export function createRevenueRouter(metrics: IMetrics): Router {
  const router = Router();

  router.get("/revenue/readiness", (_req, res) => {
    const report = getRevenueReadiness();
    metrics.inc("revenue_readiness_checks", { ok: String(report.ok) });
    res.json(report);
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
