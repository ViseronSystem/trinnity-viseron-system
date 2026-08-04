import { Router } from "express";
import { OmegaPlatform } from "./index";

export function createOmegaGateway(omega: OmegaPlatform): Router {
  const router = Router();

  router.get("/status", (_req, res) => {
    res.json(omega.status());
  });

  router.get("/agents", (_req, res) => {
    res.json(omega.agents.status());
  });

  router.get("/agents/:id", (req, res) => {
    const agent = omega.agents.getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: `Agent "${req.params.id}" not loaded` });
    res.json({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      status: agent.status,
      capabilities: agent.capabilities,
    });
  });

  router.post("/agents/:id/execute", async (req, res) => {
    try {
      const { task, context } = req.body ?? {};
      if (!task) return res.status(400).json({ error: "task required" });
      const result = await omega.agents.execute(req.params.id, task, context);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/kernel", (_req, res) => {
    res.json(omega.kernel.status());
  });

  router.get("/kernel/events", (_req, res) => {
    res.json(omega.kernel.events.getStats());
  });

  router.get("/tasks", (_req, res) => {
    res.json(omega.kernel.tasks.getStats());
  });

  router.post("/tasks", async (req, res) => {
    try {
      const { type, title, payload, priority } = req.body ?? {};
      if (!type || !title) return res.status(400).json({ error: "type and title required" });
      const task = await omega.kernel.runTask(type, title, payload, priority ?? "normal");
      res.status(201).json(task);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/memory/graph", (_req, res) => {
    res.json(omega.graph.getStats());
  });

  router.get("/memory/graph/entities", (req, res) => {
    const q = (req.query.q as string) || "";
    if (q) return res.json(omega.graph.searchEntities(q));
    return res.json({ entities: Object.keys(omega.graph.getStats().byType), stats: omega.graph.getStats() });
  });

  router.get("/memory/graph/entity/:id", (req, res) => {
    const entity = omega.graph.getEntity(req.params.id);
    if (!entity) return res.status(404).json({ error: "Entity not found" });
    res.json({ entity, neighbors: omega.graph.getNeighbors(req.params.id) });
  });

  router.post("/memory/graph", async (req, res) => {
    try {
      const { id, type, name, relations, properties } = req.body ?? {};
      if (!id || !type || !name) return res.status(400).json({ error: "id, type and name required" });
      await omega.recordDecision(id, type, name, relations ?? [], properties);
      res.status(201).json({ id, type, name });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/memory/search", async (req, res) => {
    const q = (req.query.q as string) || "";
    if (!q) return res.json({ results: [] });
    const results = await omega.kernel.searchMemory(q, { maxResults: 10 });
    res.json({ results });
  });

  router.post("/ai/resolve", async (req, res) => {
    try {
      const { task, options } = req.body ?? {};
      if (!task) return res.status(400).json({ error: "task required" });
      const result = await omega.router.resolve(task, options);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/permissions", (_req, res) => {
    res.json({ roles: omega.kernel.permissions.listRoles() });
  });

  // ── AUTONOMY LAYER ──
  router.get("/autonomy", (_req, res) => {
    res.json(omega.autonomy.status());
  });

  router.post("/autonomy/cycle", async (req, res) => {
    try {
      const { kind } = req.body ?? {};
      if (!["planning", "evolution", "learning"].includes(kind)) {
        return res.status(400).json({ error: "kind must be planning | evolution | learning" });
      }
      const result = await omega.autonomy.runCycle(kind);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/autonomy/tasks", (_req, res) => {
    res.json({ tasks: omega.autonomy.getTasks() });
  });

  router.post("/autonomy/tasks", async (req, res) => {
    try {
      const { title, description, priority, category } = req.body ?? {};
      if (!title) return res.status(400).json({ error: "title required" });
      const task = await omega.autonomy.submitTask(title, description, priority, category);
      res.status(201).json(task);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── AIOX SQUADS ──
  router.get("/squads", (_req, res) => {
    res.json(omega.squads.status());
  });

  router.get("/squads/:id", (req, res) => {
    const squad = omega.squads.getSquad(req.params.id);
    if (!squad) return res.status(404).json({ error: `Squad "${req.params.id}" not loaded` });
    res.json({ ...squad, members: omega.squads.getSquadMembers(omega.agents, req.params.id) });
  });

  router.post("/squads/:id/run", async (req, res) => {
    try {
      const { task, context } = req.body ?? {};
      if (!task) return res.status(400).json({ error: "task required" });
      const result = await omega.squads.runSquad(omega.agents, req.params.id, task, context);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
