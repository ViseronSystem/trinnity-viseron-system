import { Router, Request, Response } from "express";
import { ecosystemManager } from "../../core/ecosystem/EcosystemManager";
import { requireAuth } from "../auth/middleware";

export function createEcosystemRouter(): Router {
  const router = Router();

  // GET /api/ecosystem — Visão geral do ecossistema
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const status = ecosystemManager.getStatus();
      res.json({ ok: true, ...status });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/ecosystem/dashboard — Dashboard de monitoramento Pedro/Trinnity/Squads
  router.get("/dashboard", async (_req: Request, res: Response) => {
    try {
      const dashboard = ecosystemManager.getMonitoringDashboard();
      res.json({ ok: true, ...dashboard });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/ecosystem/module/:id — Detalhe de um módulo
  router.get("/module/:id", async (req: Request, res: Response) => {
    try {
      const moduleId = String(req.params.id);
      const detail = ecosystemManager.getModuleDetail(moduleId);
      if (!detail) {
        return res
          .status(404)
          .json({ ok: false, error: "Module not found" });
      }
      res.json({ ok: true, ...detail });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/ecosystem/logs — Logs de operações
  router.get("/logs", async (req: Request, res: Response) => {
    try {
      const logs = ecosystemManager.getLogs({
        moduleId: req.query.module as string,
        user: req.query.user as string,
        result: req.query.result as string,
        limit: parseInt(req.query.limit as string) || 50,
      });
      res.json({ ok: true, logs, total: logs.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /api/ecosystem/log — Registar operação (auth required)
  router.post("/log", requireAuth, async (req: Request, res: Response) => {
    try {
      const { moduleId, action, user, result, details, governanceApproved } =
        req.body;
      if (!moduleId || !action) {
        return res
          .status(400)
          .json({ ok: false, error: "moduleId and action required" });
      }
      const log = ecosystemManager.logOperation(
        moduleId,
        action,
        user || "system",
        result || "success",
        details || "",
        governanceApproved !== false
      );
      res.json({ ok: true, log });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/ecosystem/monitoring — Status do monitoramento
  router.get("/monitoring", async (_req: Request, res: Response) => {
    try {
      const status = ecosystemManager.getStatus();
      res.json({
        ok: true,
        monitoring: status.monitoring,
        authorship: status.authorship,
        modulesSummary: {
          total: status.totalModules,
          installed: status.installed,
          available: status.available,
        },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return router;
}
