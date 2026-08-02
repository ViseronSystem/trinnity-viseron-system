import { Router } from "express";
import { getRevenueReadiness } from "./readiness";
import { IMetrics } from "../monitoring/metrics";

export function createRevenueRouter(metrics: IMetrics): Router {
  const router = Router();

  router.get("/revenue/readiness", (_req, res) => {
    const report = getRevenueReadiness();
    metrics.inc("revenue_readiness_checks", { ok: String(report.ok) });
    res.json(report);
  });

  return router;
}
