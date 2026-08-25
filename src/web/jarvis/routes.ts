import { Router } from "express";
import { AccountStore } from "../auth/store";
import { BillingProvider } from "../billing/types";
import { EmailService } from "../email/service";
import { MessageStore } from "../messaging/store";
import { BlogStorage } from "../blog-storage";
import { RateLimiter } from "../auth/rate-limiter";
import { requireAuth } from "../auth/middleware";
import { JarvisAgent } from "./agent";
import { ComposioBridge } from "../../core/composio/ComposioBridge";
import { AgencyDeps } from "../agency/routes";
import { RcsEngine } from "../../core/rcs/RcsEngine";
import { SkillBridge } from "../../core/intelligence/SkillBridge";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

export function createJarvisRouter(ctx: {
  dataDir: string;
  accounts: AccountStore;
  billing: BillingProvider;
  email: EmailService;
  messaging: MessageStore;
  blog: BlogStorage;
  composio: ComposioBridge;
  agency: AgencyDeps;
  rcs?: RcsEngine;
  skillBridge?: SkillBridge;
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
        "composio_status",
        "composio_connect",
        "composio_execute",
        "memory_recall",
        "agency_status",
        "agency_lead_add",
        "agency_report",
        "agency_creative",
        "agency_nurture",
        "agency_projection",
        "rcs_broadcast",
        "trilingual",
      ],
      autonomy: "executa operações reais (estado, planos, checkout, conteúdo, mensageria, email, ligar apps via Composio e executar posts/mensagens/emails nas apps ligadas) · RCS: envia mensagens de marca com o logo da TVS para qualquer número (fallback SMS/MMS) · Agency OS: regista leads e responde, gera reportes e criativos, corre nurturing, projeta MRR/ARR · trilingue es/pt/en · memória persistente (nunca esquece, auditável pelo squad AIOX)",
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

  router.get("/jarvis/memory", requireAuth, (_req, res) => {
    try {
      const m = agent.recentOperations(25);
      res.json({ ok: true, file: "data/knowledge/jarvis-memory.jsonl", total: m.total, byTool: m.byTool, recent: m.recent });
    } catch (e: any) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  return router;
}
