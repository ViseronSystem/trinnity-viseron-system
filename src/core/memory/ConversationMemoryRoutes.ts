// VISERON Conversation Memory API Routes
// Expõe a memória cognitiva do VISERON via REST API.
// © Pedro Costa · Trinnity Hurtado — VISERON™

import { Router, Request, Response } from "express";
import { getNeuralMemory } from "./NeuralMemoryEngine";

export function createConversationMemoryRouter(): Router {
  const router = Router();
  const memory = getNeuralMemory();

  // GET /api/memory/stats — Estatísticas da memória
  router.get("/stats", (_req: Request, res: Response) => {
    try {
      const stats = memory.getStats();
      res.json({
        ok: true,
        ...stats,
        embeddingProvider: "openai→minilm→fallback",
        persistenceEnabled: true,
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // GET /api/memory/profile/:userId — Perfil do utilizador
  router.get("/profile/:userId", (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const profile = memory.getOrCreateUserProfile(userId);
      res.json({ ok: true, profile });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // PATCH /api/memory/profile/:userId — Atualizar perfil
  router.patch("/profile/:userId", (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      memory.updateUserProfile(userId, req.body);
      const profile = memory.getOrCreateUserProfile(userId);
      res.json({ ok: true, profile });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // POST /api/memory/conversation — Criar sessão de conversa
  router.post("/conversation", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ ok: false, error: "userId required" });
      const session = await memory.startConversation(userId);
      res.json({ ok: true, sessionId: session.id });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // POST /api/memory/conversation/:sessionId/turn — Adicionar turn
  router.post("/conversation/:sessionId/turn", async (req: Request, res: Response) => {
    try {
      const { role, content, metadata } = req.body;
      const sessionId = req.params.sessionId as string;
      if (!role || !content) return res.status(400).json({ ok: false, error: "role and content required" });
      const turn = await memory.addTurn(sessionId, role, content, metadata);
      res.json({ ok: true, turn });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // POST /api/memory/recall — Busca semântica na memória
  router.post("/recall", async (req: Request, res: Response) => {
    try {
      const { userId, query, limit, minScore, sessionId } = req.body;
      if (!userId || !query) return res.status(400).json({ ok: false, error: "userId and query required" });
      const results = await memory.recall(userId, query, { limit, minScore, sessionId });
      res.json({
        ok: true,
        results: results.map(r => ({
          content: r.turn.content.slice(0, 500),
          score: r.score,
          role: r.turn.role,
          timestamp: r.turn.timestamp,
          topics: r.turn.topics,
        })),
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // POST /api/memory/context — Construir contexto para o LLM
  router.post("/context", async (req: Request, res: Response) => {
    try {
      const { userId, query, sessionId } = req.body;
      if (!userId || !query) return res.status(400).json({ ok: false, error: "userId and query required" });
      const context = await memory.buildContext(userId, query, sessionId);
      res.json({ ok: true, context });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // GET /api/memory/patterns/:userId — Padrões aprendidos
  router.get("/patterns/:userId", (req: Request, res: Response) => {
    try {
      const patterns = (memory as any).patterns.filter((p: any) => p.userId === req.params.userId);
      res.json({ ok: true, patterns });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // DELETE /api/memory/conversation/:sessionId — Apagar conversa
  router.delete("/conversation/:sessionId", (req: Request, res: Response) => {
    try {
      (memory as any).conversations.delete(req.params.sessionId);
      memory.saveAll();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // GET /api/memory/conversations/:userId — Listar conversas do utilizador
  router.get("/conversations/:userId", (req: Request, res: Response) => {
    try {
      const convs: any[] = [];
      for (const conv of (memory as any).conversations.values()) {
        if (conv.userId === req.params.userId) {
          convs.push({
            id: conv.id,
            startedAt: conv.startedAt,
            lastActiveAt: conv.lastActiveAt,
            topics: conv.topics,
            turnCount: conv.turns.length,
            totalTokens: conv.totalTokens,
          });
        }
      }
      convs.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
      res.json({ ok: true, conversations: convs });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  return router;
}
