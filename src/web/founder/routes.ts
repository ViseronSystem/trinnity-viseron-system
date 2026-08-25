import { Router, Request, Response } from "express";
import { FounderAgent } from "./FounderAgent";

export function createFounderRouter(dataDir: string): Router {
  const router = Router();
  const agent = new FounderAgent(dataDir);

  router.get("/founder/status", (_req: Request, res: Response) => {
    try {
      const status = agent.getStatus();
      res.json({ ok: true, status });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  router.post("/founder/daily", (req: Request, res: Response) => {
    try {
      const input = {
        sleepQuality: req.body?.sleepQuality,
        energy: req.body?.energy,
        focus: req.body?.focus,
        stress: req.body?.stress,
        availableHours: req.body?.availableHours,
        date: req.body?.date,
      };
      const plan = agent.generateDailyPlan(input);
      res.json({ ok: true, plan });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  router.get("/founder/daily", (_req: Request, res: Response) => {
    try {
      const plan = agent.generateDailyPlan();
      res.json({ ok: true, plan });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  router.get("/founder/weekly", (_req: Request, res: Response) => {
    try {
      const review = agent.generateWeeklyReview();
      res.json({ ok: true, review });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  router.get("/founder/monthly", (_req: Request, res: Response) => {
    try {
      const review = agent.generateMonthlyReview();
      res.json({ ok: true, review });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  router.get("/founder/kpis", (_req: Request, res: Response) => {
    try {
      const kpis = agent.generateKPIs();
      res.json({ ok: true, kpis });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  return router;
}
