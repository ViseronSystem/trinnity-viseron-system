// VISERON Fine-Tuning API Routes
// © Pedro Costa · Trinnity Hurtado — VISERON™

import { Router, Request, Response } from "express";
import { getFineTuningPipeline } from "./FineTuningPipeline";

export function createFineTuningRouter(): Router {
  const router = Router();
  const pipeline = getFineTuningPipeline();

  // GET /api/fine-tuning/stats
  router.get("/stats", (_req: Request, res: Response) => {
    res.json({ ok: true, ...pipeline.getStats() });
  });

  // POST /api/fine-tuning/record — Registar interação para treino
  router.post("/record", (req: Request, res: Response) => {
    try {
      const { input, output, category, quality, metadata } = req.body;
      if (!input || !output) return res.status(400).json({ ok: false, error: "input and output required" });
      pipeline.recordInteraction(input, output, category || "general", quality || 0.5, metadata || { provider: "api", model: "unknown", latencyMs: 0 });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // POST /api/fine-tuning/feedback — Registar feedback do utilizador
  router.post("/feedback", (req: Request, res: Response) => {
    try {
      const { input, output, category, feedback, latencyMs } = req.body;
      if (!input || !output || !feedback) return res.status(400).json({ ok: false, error: "input, output, and feedback required" });
      pipeline.recordFromFeedback(input, output, category || "general", feedback, latencyMs || 0);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // POST /api/fine-tuning/export — Exportar dataset
  router.post("/export", (req: Request, res: Response) => {
    try {
      const { format } = req.body; // "ollama" or "alpaca"
      const dataDir = require("path").join(process.cwd(), "data", "fine-tuning");
      const filePath = require("path").join(dataDir, `export-${Date.now()}.${format === "alpaca" ? "json" : "jsonl"}`);
      const count = format === "alpaca" ? pipeline.exportAlpaca(filePath) : pipeline.exportForOllama(filePath);
      res.json({ ok: true, filePath, count });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // POST /api/fine-tuning/train — Criar job de treino
  router.post("/train", async (req: Request, res: Response) => {
    try {
      const { baseModel } = req.body;
      const job = await pipeline.createTrainingJob(baseModel || "qwen2.5:3b");
      res.json({ ok: true, job });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // POST /api/fine-tuning/train/:jobId/run — Executar job
  router.post("/train/:jobId/run", async (req: Request, res: Response) => {
    try {
      const jobId = req.params.jobId as string;
      await pipeline.executeTrainingJob(jobId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  return router;
}
