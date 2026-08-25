// Agent Interaction API — endpoints para conversar, listar e atribuir tarefas a agentes.
import { Router, Request, Response } from "express";
import { AgentActivationEngine } from "../../omega/activation/AgentActivationEngine";

export function createAgentRouter(engine: AgentActivationEngine): Router {
  const router = Router();

  // GET /api/agents — listar todos os agentes ativos
  router.get("/", (_req: Request, res: Response) => {
    try {
      const agents = engine.listAgents();
      const stats = engine.getStats();
      res.json({ ok: true, total: agents.length, stats, agents });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // GET /api/agents/stats — estatísticas agregadas
  router.get("/stats", (_req: Request, res: Response) => {
    try {
      const stats = engine.getStats();
      res.json({ ok: true, ...stats });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // GET /api/agents/:id — detalhe de um agente
  router.get("/:id", (req: Request, res: Response) => {
    try {
      const agents = engine.listAgents();
      const agent = agents.find(a => a.agentId === req.params.id as string);
      if (!agent) { res.status(404).json({ ok: false, error: "Agent not found" }); return; }
      res.json({ ok: true, agent });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // GET /api/agents/:id/memory — memória do agente
  router.get("/:id/memory", (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) as string || "50", 10);
      const records = engine.getMemory(req.params.id as string, limit);
      res.json({ ok: true, agentId: req.params.id as string, total: records.length, records });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // GET /api/agents/:id/tasks — tarefas do agente
  router.get("/:id/tasks", (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) as string || "50", 10);
      const tasks = engine.getTasks(req.params.id as string, limit);
      res.json({ ok: true, agentId: req.params.id as string, total: tasks.length, tasks });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // POST /api/agents/:id/chat — conversar com um agente específico
  router.post("/:id/chat", async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        res.status(400).json({ ok: false, error: "Body must include {message: string}" });
        return;
      }
      const result = await engine.chat(req.params.id as string, message.slice(0, 4000));
      res.json({ ok: true, ...result });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // POST /api/agents/:id/task — atribuir tarefa a um agente
  router.post("/:id/task", async (req: Request, res: Response) => {
    try {
      const { task } = req.body;
      if (!task || typeof task !== "string") {
        res.status(400).json({ ok: false, error: "Body must include {task: string}" });
        return;
      }
      const result = await engine.executeTask(req.params.id as string, task.slice(0, 4000));
      res.json({ ok: true, ...result });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  return router;
}
