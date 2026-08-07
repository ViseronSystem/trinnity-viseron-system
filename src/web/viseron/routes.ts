import { Router } from "express";
import { RateLimiter } from "../auth/rate-limiter";
import { ViseronAgent } from "./agent";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

// VISERON — API web da Superinteligência Autónoma (voz + brain + supervisão AIOX).
//   GET  /api/viseron/status       → estado (nome, voz, wake words, autonomia, supervisão)
//   POST /api/viseron/chat         → { message, speaker, lang, sessionId } → resposta falável
//   GET  /api/viseron/supervision  → operações supervisionadas pelo squad AIOX

export function createViseronRouter(ctx: {
  dataDir: string;
  accounts: any;
  billing: any;
  email: any;
  messaging: any;
  blog: any;
  composio: any;
  agency: any;
  rcs?: any;
  logger: ILogger;
  metrics: IMetrics;
}): Router {
  const router = Router();
  const viseron = new ViseronAgent(ctx);
  const chatLimiter = new RateLimiter(60, 60 * 1000);

  router.get("/viseron/status", (_req, res) => {
    res.json(viseron.status());
  });

  router.post("/viseron/chat", chatLimiter.middleware, async (req, res) => {
    try {
      const message = String(req.body?.message || "").trim();
      if (!message) return res.status(400).json({ error: "Mensagem vazia" });
      const speaker = String(req.body?.speaker || "pedro");
      const lang = String(req.body?.lang || "");
      const sessionId = String(req.body?.sessionId || "").trim() || undefined;
      const reply = await viseron.chat({
        message,
        speaker: (["pedro", "trinnity", "guest"].includes(speaker) ? speaker : "guest") as any,
        lang: (["es", "pt", "en"].includes(lang) ? lang : undefined) as any,
        sessionId,
        name: String(req.body?.name || "").trim() || undefined,
        email: String(req.body?.email || "").trim() || undefined,
      });
      res.json({ ok: true, ...reply });
    } catch (e: any) {
      ctx.logger.error(`[VISERON] Erro no chat: ${e.message}`);
      res.status(500).json({ error: "Falha ao processar a mensagem." });
    }
  });

  router.get("/viseron/supervision", (_req, res) => {
    res.json(viseron.supervision(30));
  });

  return router;
}
