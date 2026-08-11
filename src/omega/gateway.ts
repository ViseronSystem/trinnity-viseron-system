import { Router } from "express";
import { OmegaPlatform } from "./index";
import { openSSEStream } from "./kernel/EventBridge";

/**
 * Placeholder montado na fase de setup (antes do catch-all 404): responde com
 * status honesto enquanto o OMEGA ainda não carregou. O mountOmega troca a
 * stack do MESMO router (padrão idêntico ao /api/os), garantindo que
 * `/api/omega/*` nunca caia no 404 do catch-all.
 */
export function createOmegaGatewayPlaceholder(): Router {
  const router = Router();
  router.use((_req, res) => {
    res.status(503).json({
      ok: false,
      error: "OMEGA kernel ainda não carregado — gateway será ligado no mountOmega",
      mount: "placeholder",
    });
  });
  return router;
}

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

  // Agent Evidence: prova do que cada agente realmente executou
  router.get("/agents/:id/evidence", (req, res) => {
    try {
      const agentId = req.params.id;
      const since = req.query.since as string;
      const fs = require("fs");
      const path = require("path");
      const logPath = path.resolve(process.cwd(), "data", "knowledge", "agent-activity.jsonl");
      if (!fs.existsSync(logPath)) {
        return res.json({ agentId, total: 0, recent: [] });
      }
      const lines = fs.readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean);
      const entries = lines
        .map((l: string) => { try { return JSON.parse(l); } catch { return null; } })
        .filter((e: any) => e && e.agentId === agentId);
      const filtered = since
        ? entries.filter((e: any) => new Date(e.ts) >= new Date(since))
        : entries;
      const last50 = filtered.slice(-50).reverse();
      const tasksCompleted = filtered.filter((e: any) => e.action === "task_completed").length;
      const tasksFailed = filtered.filter((e: any) => e.action === "task_failed").length;
      res.json({
        agentId,
        total: filtered.length,
        tasksCompleted,
        tasksFailed,
        successRate: tasksCompleted + tasksFailed > 0
          ? Math.round((tasksCompleted / (tasksCompleted + tasksFailed)) * 100) / 100
          : null,
        recent: last50,
      });
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

  // ── ARCHITECTURE INTELLIGENCE ──
  router.get("/architecture", (_req, res) => {
    if (!omega.architecture.isReady()) return res.status(503).json({ ready: false });
    res.json(omega.architecture.summary());
  });

  router.get("/architecture/query", (req, res) => {
    const term = (req.query.q as string) || "";
    if (!term) return res.status(400).json({ error: "q required (e.g. ?q=TaskQueue)" });
    const bundle = omega.architecture.query(term);
    res.json({ ...bundle, provenance: omega.architecture.provenance });
  });

  router.get("/architecture/risks", (req, res) => {
    const subject = (req.query.subject as string) || undefined;
    res.json(omega.architecture.risks.analyze(subject));
  });

  router.get("/architecture/path", (req, res) => {
    const { from, to } = req.query as { from?: string; to?: string };
    if (!from || !to) return res.status(400).json({ error: "from and to required" });
    res.json(omega.architecture.adapter.pathBetween(from, to));
  });

  router.get("/architecture/impact", (req, res) => {
    const subject = (req.query.subject as string) || "";
    if (!subject) return res.status(400).json({ error: "subject required" });
    res.json(omega.architecture.adapter.impact(subject, Number(req.query.hops) || 2));
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

  // ── AUTONOMY OS (L0-L5 permission engine) ──
  router.get("/autonomy/os", (_req, res) => {
    res.json(omega.autonomyOS.summary());
  });

  router.get("/autonomy/os/levels", (_req, res) => {
    res.json({ levels: omega.autonomyOS.getLevels() });
  });

  router.get("/autonomy/os/policies", (_req, res) => {
    res.json({ policies: omega.autonomyOS.getPolicies() });
  });

  router.get("/autonomy/os/audit", (req, res) => {
    const limit = Number(req.query.limit) || 50;
    res.json({ decisions: omega.autonomyOS.getAudit(limit) });
  });

  router.post("/autonomy/os/assess", async (req, res) => {
    try {
      const { domain, op, value, actor, permission } = req.body ?? {};
      if (!domain || !op) return res.status(400).json({ error: "domain and op required" });
      const decision = await omega.assessAutonomy({ domain, op, value, actor, permission });
      res.json(decision);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/autonomy/os/policies", (req, res) => {
    try {
      const policy = req.body?.policy;
      if (!policy?.domain || typeof policy.level !== "number") {
        return res.status(400).json({ error: "policy.domain and policy.level required" });
      }
      omega.autonomyOS.configure(policy);
      res.json({ ok: true, policy });
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

  // ── COGNITIVE TELEMETRY (Sistema 0) ──
  router.get("/telemetry/trace/:traceId", (req, res) => {
    const trace = omega.telemetry.getTrace(req.params.traceId);
    if (!trace) return res.status(404).json({ error: "Trace not found" });
    res.json(trace);
  });

  router.get("/telemetry/search", (req, res) => {
    const { agentId, source, since, limit } = req.query as Record<string, string>;
    const traces = omega.telemetry.searchTraces({
      agentId,
      source,
      since,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ total: traces.length, traces });
  });

  router.get("/telemetry/stats", (req, res) => {
    const since = req.query.since as string;
    res.json(omega.telemetry.getStats(since));
  });

  router.get("/telemetry/insights", (req, res) => {
    const since = req.query.since as string;
    res.json(omega.telemetry.getInsights(since));
  });

  router.get("/telemetry", (_req, res) => {
    res.json(omega.telemetry.status());
  });

  // ── EMBEDDINGS (Sistema 1) ──
  router.get("/memory/embed/status", (_req, res) => {
    res.json({
      provider: omega.embedding.name,
      model: omega.embedding.model,
      dimensions: omega.embedding.dimensions,
      available: omega.embedding.isAvailable(),
    });
  });

  router.post("/memory/embed", async (req, res) => {
    try {
      const { text } = req.body ?? {};
      if (!text || typeof text !== "string") return res.status(400).json({ error: "text required" });
      const trace = omega.telemetry.startTrace({ source: "rag", agentId: req.body?.agentId, input: { text, embeddingsModel: omega.embedding.model } });
      const result = await omega.embedding.embed(text);
      omega.telemetry.recordProcessing(trace.traceId, { embeddingMs: result.latencyMs });
      omega.telemetry.completeTrace(trace.traceId, {
        success: true, modelUsed: result.model, latencyMs: result.latencyMs, tokensUsed: result.tokensUsed, output: `vector[${result.dimensions}]`,
      });
      res.json({ ok: true, dimensions: result.dimensions, model: result.model, latencyMs: result.latencyMs, tokensUsed: result.tokensUsed, traceId: trace.traceId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── RAG PIPELINE (Sistema 2) ──
  router.get("/memory/rag/status", (_req, res) => {
    res.json({
      available: true,
      embeddingModel: omega.embedding.model,
      embeddingDimensions: omega.embedding.dimensions,
      hybridSearch: true,
      knowledgeGraphEnabled: true,
    });
  });

  router.post("/memory/rag", async (req, res) => {
    try {
      const { query, topK, agentId, includeKnowledgeGraph } = req.body ?? {};
      if (!query || typeof query !== "string") return res.status(400).json({ error: "query required" });
      const result = await omega.rag.query(query, {
        topK: topK || 10,
        agentId,
        includeKnowledgeGraph: includeKnowledgeGraph !== false,
      });
      res.json({
        ok: true,
        query: result.query,
        context: result.context.slice(0, 2000),
        sources: result.sources,
        chunks: result.chunks.length,
        metrics: result.metrics,
        traceId: result.traceId,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── VOICE NEURAL (Sistema 3) ──
  router.get("/voice/status", (_req, res) => {
    res.json(omega.voice.status());
  });

  router.post("/voice/stt", async (req, res) => {
    try {
      const { audio, lang } = req.body ?? {};
      if (!audio) return res.status(400).json({ error: "audio (base64) required" });
      if (!omega.voice.stt.isAvailable()) {
        return res.json({ ok: true, text: "", model: "fallback", note: "STT provider not configured. Use browser Web Speech API for now." });
      }
      const result = await omega.voice.stt.transcribe(audio, { lang });
      res.json({ ok: true, text: result.text, lang: result.lang, confidence: result.confidence, model: result.model, latencyMs: result.latencyMs });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/voice/tts", async (req, res) => {
    try {
      const { text, voice } = req.body ?? {};
      if (!text) return res.status(400).json({ error: "text required" });
      if (!omega.voice.tts.isAvailable()) {
        return res.json({ ok: true, audioBase64: "", model: "browser-speechSynthesis", note: "TTS provider not configured. Using browser speechSynthesis as fallback." });
      }
      const result = await omega.voice.tts.speak(text, { voice });
      res.json({ ok: true, audioBase64: result.audioBase64, format: result.format, voice: result.voice, model: result.model, latencyMs: result.latencyMs });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── MEMORY CONSOLIDATION (Sistema 4) ──
  router.get("/memory/consolidation/status", (_req, res) => {
    res.json({
      available: true,
      features: ["semantic_dedup", "summarization", "importance_classification", "kg_linking"],
      embeddingModel: omega.embedding.model,
      ltmItems: (omega.consolidation as any).memoryEngine?.ltmSize?.() || 0,
    });
  });

  router.post("/memory/consolidation/run", async (_req, res) => {
    try {
      const result = await omega.consolidation.runFullCycle();
      res.json({ ok: true, ...result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/memory/consolidation/insights", (_req, res) => {
    res.json({ insights: omega.consolidation.generateInsights() });
  });

  // ── GraphRAG (Sistema 5) ──
  router.get("/memory/graphrag/status", (_req, res) => {
    res.json(omega.graphrag.status());
  });

  router.post("/memory/graphrag/query", async (req, res) => {
    try {
      const { query, maxEntities, maxDepth, topK, agentId } = req.body ?? {};
      if (!query) return res.status(400).json({ error: "query required" });
      const result = await omega.graphrag.query(query, {
        maxEntities: maxEntities || 10,
        maxDepth: maxDepth || 2,
        topK: topK || 5,
        agentId,
      });
      res.json({
        ok: true,
        query: result.query,
        entities: result.entities.slice(0, 10),
        paths: result.paths.slice(0, 10),
        graphContext: result.graphContext.slice(0, 1500),
        metrics: result.metrics,
        traceId: result.traceId,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/memory/graphrag/entities/:id", (req, res) => {
    const detail = omega.graphrag.getEntityDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: "Entity not found" });
    res.json(detail);
  });

  // ── EVOLUTION LOOP (Sistema 6) ──
  router.get("/evolution/status", (_req, res) => {
    res.json(omega.evolution.status());
  });

  router.get("/evolution/history", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json({ events: omega.evolution.getHistory(limit) });
  });

  router.post("/evolution/analyze", (req, res) => {
    const since = req.body?.since;
    const analysis = omega.evolution.analyze(since);
    res.json(analysis);
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

  // ── VAEC (Evolution & Continuity) ──
  router.get("/vaec", (_req, res) => {
    try {
      res.json(omega.vaec.status());
    } catch (e: any) {
      res.json({ stage: "UNKNOWN", error: e.message });
    }
  });

  router.post("/vaec/recover", async (_req, res) => {
    try {
      const result = await omega.vaec.attemptRecovery();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ recovered: false, reason: e.message });
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
