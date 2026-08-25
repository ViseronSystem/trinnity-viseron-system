import { Router, Response } from "express";
import { AuthedRequest, requireAuth } from "../auth/middleware";
import { askLocalAI } from "../calls/learning";
import { BusinessAgentStore, BusinessMessage, newAgentId } from "./store";

const RATE_WINDOW_MS = 60000;
const RATE_MAX = 30;
const rateHits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rateHits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    rateHits.set(key, hits);
    return true;
  }
  hits.push(now);
  rateHits.set(key, hits);
  return false;
}

export function createBusinessRouter(store: BusinessAgentStore, logger?: { info?: (message: string, meta?: Record<string, unknown>) => void }): Router {
  const router = Router();
  const log = (msg: string) => {
    if (logger && logger.info) logger.info(`[business] ${msg}`);
    else console.log(`[business] ${msg}`);
  };

  router.post("/business/agents", requireAuth, (req: AuthedRequest, res: Response) => {
    const name = String(req.body?.name || "").trim();
    const description = String(req.body?.description || "").trim();
    const greeting = String(req.body?.greeting || "").trim() || `Olá! Bem-vindo(a) a ${name || "nós"}. Em que posso ajudar?`;
    const knowledge = Array.isArray(req.body?.knowledge)
      ? (req.body.knowledge as unknown[]).map((k) => String(k).trim()).filter(Boolean).slice(0, 20)
      : [];
    if (!name || !description) {
      res.status(400).json({ ok: false, error: "name and description required" });
      return;
    }
    const agent = store.create({
      id: newAgentId(),
      ownerTenantId: req.user!.tenantId,
      name: name.slice(0, 80),
      description: description.slice(0, 2000),
      greeting: greeting.slice(0, 300),
      knowledge,
      autoReply: req.body?.autoReply !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    });
    log(`agent created: ${agent.id} (${name}) by ${req.user!.tenantId}`);
    res.json({ ok: true, agent });
  });

  router.get("/business/agents", requireAuth, (req: AuthedRequest, res: Response) => {
    res.json({ ok: true, agents: store.list(req.user!.tenantId) });
  });

  router.get("/business/agents/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    const agent = store.get(String(req.params.id || ""));
    if (!agent || agent.ownerTenantId !== req.user!.tenantId) {
      res.status(404).json({ ok: false, error: "agent not found" });
      return;
    }
    res.json({ ok: true, agent, messages: store.messages(agent.id) });
  });

  router.post("/business/agents/:id/messages", async (req: AuthedRequest, res: Response) => {
    const agent = store.get(String(req.params.id || ""));
    if (!agent) {
      res.status(404).json({ ok: false, error: "agent not found" });
      return;
    }
    const customer = String(req.body?.from || "cliente").slice(0, 80);
    const message = String(req.body?.message || "").trim();
    if (!message) {
      res.status(400).json({ ok: false, error: "message required" });
      return;
    }
    if (rateLimited(`biz:${agent.id}:${customer}`)) {
      res.status(429).json({ ok: false, error: "Demasiadas mensagens. Tenta de novo em breve." });
      return;
    }

    const knowledgeCtx = agent.knowledge.length
      ? `\nKnowledge base of the business:\n- ${agent.knowledge.join("\n- ")}`
      : "";
    const prompt = `You are the AI customer-service receptionist of "${agent.name}". Business: ${agent.description}${knowledgeCtx}

Customer said: """${message.slice(0, 1200)}"""

Reply helpfully and concisely (max 2 sentences), in the customer's language. If you don't know the answer, offer to pass it to a human agent.`;

    let reply: string;
    try {
      const ai = await askLocalAI(prompt, "You are a polite, concise business receptionist. Answer in the customer's language.");
      reply = ai || agent.greeting;
    } catch {
      reply = agent.greeting;
    }

    const msg: BusinessMessage = {
      id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      agentId: agent.id,
      from: customer,
      message,
      reply,
      createdAt: new Date().toISOString(),
    };
    store.addMessage(msg);
    res.json({ ok: true, message: msg });
  });

  router.delete("/business/agents/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    const agent = store.get(String(req.params.id || ""));
    if (!agent || agent.ownerTenantId !== req.user!.tenantId) {
      res.status(404).json({ ok: false, error: "agent not found" });
      return;
    }
    store.remove(agent.id);
    res.json({ ok: true });
  });

  router.get("/business/status", (_req: AuthedRequest, res: Response) => {
    res.json({ ok: true, total: store.count() });
  });

  return router;
}
