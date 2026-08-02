import { Router } from "express";
import { AccountStore } from "../auth/store";
import { BillingProvider } from "../billing/types";
import { EmailService } from "../email/service";
import { MessageStore } from "../messaging/store";
import { BlogStorage } from "../blog-storage";
import { RateLimiter } from "../auth/rate-limiter";
import { JarvisAgent } from "./agent";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

export function createJarvisRouter(ctx: {
  dataDir: string;
  accounts: AccountStore;
  billing: BillingProvider;
  email: EmailService;
  messaging: MessageStore;
  blog: BlogStorage;
  logger: ILogger;
  metrics: IMetrics;
}): Router {
  const router = Router();
  const agent = new JarvisAgent(ctx);
  const chatLimiter = new RateLimiter(30, 60 * 1000);

  router.get("/jarvis/status", (_req, res) => {
    const provider = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "XAI_API_KEY"].find((k) => process.env[k])
      ? "cloud"
      : "ollama-local";
    res.json({
      ok: true,
      ready: true,
      name: "JARVIS — Trinnity Viseron Assistant",
      online: true,
      provider,
      capabilities: [
        "system_status",
        "list_plans",
        "checkout",
        "register_info",
        "blog",
        "trigger_content",
        "email_status",
        "messaging_status",
        "audit_info",
      ],
      autonomy: "executa operações reais (estado, planos, checkout, conteúdo, mensageria, email)",
    });
  });

  router.post("/jarvis/chat", chatLimiter.middleware, async (req, res) => {
    try {
      const message = String(req.body?.message || "").trim();
      const sessionId = String(req.body?.sessionId || "").trim() || undefined;
      const name = String(req.body?.name || "").trim() || undefined;
      const email = String(req.body?.email || "").trim() || undefined;
      if (!message) return res.status(400).json({ error: "Mensagem vazia" });
      const reply = await agent.chat({ sessionId, message, name, email });
      ctx.metrics.inc("jarvis_http_total");
      res.json({ ok: true, ...reply });
    } catch (e: any) {
      ctx.logger.error(`[JARVIS] Erro no chat: ${e.message}`);
      res.status(500).json({ error: "Falha ao processar a mensagem." });
    }
  });

  return router;
}
