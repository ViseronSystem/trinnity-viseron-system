import { Router, Request, Response } from "express";
import path from "path";
import { strixBridge } from "../../core/strix/StrixBridge";
import { requireAuth } from "../auth/middleware";
import type { StrixScanConfig } from "../../core/strix/types";

export function createStrixRouter(): Router {
  const router = Router();

  router.get("/status", async (_req: Request, res: Response) => {
    try {
      const status = await strixBridge.getStatus();
      res.json({
        ok: true,
        ...status,
        authorship: {
          project: "Trinnity Viseron System",
          integration: "Strix AI Pentesting",
          author: "Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)",
          copyright: `© ${new Date().getFullYear()} Trinnity Viseron System. All rights reserved.`,
        },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.post("/scan", requireAuth, async (req: Request, res: Response) => {
    try {
      const config: StrixScanConfig = req.body;

      if (!config.targets || config.targets.length === 0) {
        return res
          .status(400)
          .json({ ok: false, error: "At least one target is required" });
      }

      const status = await strixBridge.getStatus();
      if (!status.installed) {
        return res.status(400).json({
          ok: false,
          error: "Strix not installed. Run: cd strix && pip install -e .",
        });
      }
      if (!status.dockerAvailable) {
        return res.status(400).json({
          ok: false,
          error: "Docker not available. Strix requires Docker for sandboxed execution.",
        });
      }
      if (!status.configured) {
        return res.status(400).json({
          ok: false,
          error:
            "Strix not configured. Set STRIX_LLM and LLM_API_KEY in .env",
        });
      }

      const result = await strixBridge.runScan(config);
      res.json({ ok: true, scan: result });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.post("/scan/:id/cancel", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const cancelled = await strixBridge.cancelScan(id);
      res.json({ ok: cancelled, scanId: id });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get("/scan/:id", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const result = strixBridge.getScanResult(id);
      if (!result) {
        return res.status(404).json({ ok: false, error: "Scan not found" });
      }
      res.json({ ok: true, scan: result });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get("/scan/:id/vuln/:vulnId", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const vulnId = String(req.params.vulnId);
      const vuln = strixBridge.getVulnerabilityDetail(id, vulnId);
      if (!vuln) {
        return res
          .status(404)
          .json({ ok: false, error: "Vulnerability not found" });
      }
      res.json({ ok: true, vulnerability: vuln });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get("/history", async (_req: Request, res: Response) => {
    try {
      const history = strixBridge.listRunDirs();
      res.json({ ok: true, history, total: history.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get("/running", async (_req: Request, res: Response) => {
    try {
      const running = strixBridge.getRunningScans();
      res.json({ ok: true, running, total: running.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.post(
    "/scan-selftest",
    requireAuth,
    async (_req: Request, res: Response) => {
      try {
        const config: StrixScanConfig = {
          targets: [
            {
              value: path.resolve(__dirname, "../../../src"),
              type: "local_code",
              original: "./src",
            },
          ],
          scanMode: "quick",
          scanName: `tvs-selftest-${Date.now()}`,
          instruction:
            "Focus on OWASP Top 10 vulnerabilities. This is a self-scan of the Trinnity Viseron System.",
          maxBudgetUsd: 5,
          maxTurns: 50,
        };

        const result = await strixBridge.runScan(config);
        res.json({ ok: true, scan: result });
      } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
      }
    }
  );

  return router;
}
