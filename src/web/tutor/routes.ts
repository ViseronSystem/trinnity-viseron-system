import { Router } from "express";
import { RateLimiter } from "../auth/rate-limiter";
import { EnglishTutorAgent, TutorMode } from "./agent";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

// ATLAS — API web do Tutor de Inglês (com voz).
//   GET  /api/tutor/status  → estado (nome, plano de 7 dias, progresso, voz)
//   POST /api/tutor/chat    → { message, lang, mode, sessionId } → lição/resposta
//   GET  /api/tutor/plan    → plano diário de 7 dias + progresso

const MODES: TutorMode[] = ["lesson", "chat", "practice", "correct", "pronounce"];

export function createTutorRouter(ctx: {
  dataDir: string;
  logger: ILogger;
  metrics: IMetrics;
}): Router {
  const router = Router();
  const tutor = new EnglishTutorAgent(ctx);
  const chatLimiter = new RateLimiter(120, 60 * 1000);

  router.get("/tutor/status", (_req, res) => {
    res.json(tutor.status());
  });

  router.get("/tutor/plan", (_req, res) => {
    res.json(tutor.plan());
  });

  router.post("/tutor/chat", chatLimiter.middleware, async (req, res) => {
    try {
      const message = String(req.body?.message || "").trim();
      if (!message) return res.status(400).json({ error: "Mensagem vazia" });
      const lang = ["es", "pt", "en"].includes(req.body?.lang) ? req.body.lang : "es";
      const mode = MODES.includes(req.body?.mode) ? req.body.mode : undefined;
      const sessionId = String(req.body?.sessionId || "").trim() || undefined;
      const reply = await tutor.chat({ message, lang, mode, sessionId });
      res.json({ ok: true, ...reply });
    } catch (e: any) {
      ctx.logger.error(`[TUTOR] Erro no chat: ${e.message}`);
      res.status(500).json({ error: "Falha ao processar a mensagem." });
    }
  });

  return router;
}
