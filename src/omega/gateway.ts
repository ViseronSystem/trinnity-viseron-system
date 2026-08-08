import { Router } from "express";
import { OmegaPlatform } from "./index";
import { openSSEStream } from "./kernel/EventBridge";

export function createOmegaGateway(omega: OmegaPlatform): Router {
  const router = Router();

  router.get("/status", (_req, res) => {
    res.json(omega.status());
  });

  // ── SELF-HEAL WATCHDOG ──
  router.get("/watchdog", (_req, res) => {
    res.json(omega.watchdog.status());
  });

  router.post("/watchdog/heal", async (req, res) => {
    try {
      const { component } = req.body ?? {};
      const incidents = await omega.watchdog.healNow(component || undefined);
      res.json({ healed: incidents.length, incidents });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
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

  // Event bus reativo: stream SSE de eventos em tempo real (topics separados por vírgula)
  router.get("/events", (req, res) => {
    const topics = (req.query.topic as string)?.split(",").filter(Boolean);
    openSSEStream(res, omega.kernel.events, { topics });
  });

  // Event bus: histórico (replay) de eventos recentes, opcionalmente por tópico
  router.get("/events/history", (req, res) => {
    const topic = (req.query.topic as string) || undefined;
    const events = omega.kernel.events.history(topic);
    res.json({ total: events.length, events });
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

  // E2E task execution: listar / ver / cancelar / histórico
  router.get("/tasks/list", (req, res) => {
    const status = (req.query.status as string) || undefined;
    res.json({ tasks: omega.kernel.tasks.listTasks(status) });
  });

  router.get("/tasks/history", (_req, res) => {
    res.json({ tasks: omega.kernel.tasks.history() });
  });

  router.get("/tasks/:id", (req, res) => {
    const task = omega.kernel.tasks.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: `Task "${req.params.id}" not found` });
    res.json(task);
  });

  router.post("/tasks/:id/cancel", (req, res) => {
    const cancelled = omega.kernel.tasks.cancel(req.params.id);
    if (!cancelled) return res.status(404).json({ error: `Task "${req.params.id}" not cancellable or missing` });
    res.json({ cancelled: true, taskId: req.params.id });
  });

  router.get("/verifier", (_req, res) => {
    res.json({ ...omega.kernel.tasks.verifierStats(), states: ["CREATED", "PLANNING", "QUEUED", "RUNNING", "VERIFYING", "COMPLETED", "FAILED", "RECOVERING", "CANCELLED"] });
  });

  router.get("/tools", (_req, res) => {
    const tools = omega.kernel.getTools();
    res.json({ total: tools.length, tools });
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

  // ── FACTORY ──
  router.get("/factory", (_req, res) => {
    res.json(omega.factory.status());
  });

  router.get("/factory/runs", (_req, res) => {
    res.json(omega.factory.listRuns());
  });

  router.get("/factory/runs/:id", (req, res) => {
    const run = omega.factory.getRun(req.params.id);
    if (!run) return res.status(404).json({ error: `Factory run "${req.params.id}" not found` });
    res.json(run);
  });

  router.post("/factory/pipeline", async (req, res) => {
    try {
      const body = req.body ?? {};
      if (!body.name || !body.description) return res.status(400).json({ error: "name + description required" });
      const result = await omega.factory.runPipeline({
        name: body.name,
        industry: body.industry ?? "tecnologia",
        description: body.description,
        goals: body.goals ?? [],
        painPoints: body.painPoints ?? [],
        budget: body.budget,
        timeline: body.timeline,
        template: body.template ?? "express-api",
        deployTo: body.deployTo ?? ["local"],
        outputDir: body.outputDir,
      });
      res.status(201).json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── ENTERPRISE ──
  router.get("/enterprise", (_req, res) => {
    res.json(omega.enterprise.status());
  });

  router.get("/enterprise/:id", (req, res) => {
    const mod = omega.enterprise.getModule(req.params.id);
    if (!mod) return res.status(404).json({ error: `Module "${req.params.id}" not loaded` });
    res.json({ ...mod, members: omega.enterprise.getModuleAgents(req.params.id) });
  });

  router.post("/enterprise/:id/action", async (req, res) => {
    try {
      const { task, workflowId, context } = req.body ?? {};
      if (!task) return res.status(400).json({ error: "task required" });
      const result = await omega.enterprise.runAction({ moduleId: req.params.id, workflowId, task, context });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
