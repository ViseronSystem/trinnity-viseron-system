import { Router } from "express";
import { WorkspaceStore } from "./store";
import { UserTaskOrchestrator } from "./orchestrator";

/**
 * API do Workspace — REAL USER VERTICAL SLICE.
 *
 * AUTH → WORKSPACE → PROJECT → TASK → (kernel OMEGA: model router → Ollama →
 * VISERON BUILDER → tools → execution → test → verify → memory) → RESULT.
 *
 * Todas as rotas de escrita/leitura de dados exigem JWT (`requireAuth`) e são
 * isoladas por tenant (`req.user.tenantId`) — ninguém acede a dados de outro tenant.
 */

export interface WorkspaceDeps {
  store: WorkspaceStore;
  orchestrator: UserTaskOrchestrator;
  requireAuth: any;
}

export function createWorkspaceRouter(deps: WorkspaceDeps): Router {
  const { store, orchestrator, requireAuth } = deps;
  const router = Router();

  // Estado de prontidão do vertical slice (público — a UI consulta antes de logar).
  router.get("/workspace/status", (_req, res) => {
    res.json({
      ...orchestrator.status(),
      store: { ready: true },
      chain: [
        "AUTH",
        "WORKSPACE",
        "PROJECT",
        "TASK",
        "MODEL ROUTER",
        "OLLAMA",
        "AGENT (VISERON BUILDER)",
        "TOOL",
        "EXECUTION",
        "TEST",
        "VERIFY",
        "MEMORY",
        "RESULT",
      ],
    });
  });

  // ── Projects ──────────────────────────────────────────────
  router.get("/workspace/projects", requireAuth, (req: any, res) => {
    res.json({ projects: store.listProjects(req.user.tenantId) });
  });

  router.post("/workspace/projects", requireAuth, (req: any, res) => {
    const { name, description } = req.body ?? {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name obrigatório" });
    }
    const project = store.createProject(req.user.tenantId, req.user.sub, { name, description });
    res.status(201).json({ project });
  });

  router.get("/workspace/projects/:id", requireAuth, (req: any, res) => {
    const project = store.getProject(req.user.tenantId, req.params.id);
    if (!project) return res.status(404).json({ error: "project não encontrado" });
    res.json({ project, tasks: store.listTasks(req.user.tenantId, project.id) });
  });

  // ── Tasks ─────────────────────────────────────────────────
  router.post("/workspace/projects/:id/tasks", requireAuth, async (req: any, res) => {
    const project = store.getProject(req.user.tenantId, req.params.id);
    if (!project) return res.status(404).json({ error: "project não encontrado" });
    const { title, description, tools } = req.body ?? {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "title obrigatório" });
    }
    const safeTools = Array.isArray(tools)
      ? tools
          .filter((t) => t && typeof t.id === "string")
          .map((t) => ({
            id: String(t.id).slice(0, 80),
            name: t.name ? String(t.name).slice(0, 120) : undefined,
            input: t.input && typeof t.input === "object" ? t.input : {},
          }))
      : [];
    try {
      const task = await orchestrator.submit(req.user.tenantId, req.user.sub, project.id, {
        title: String(title),
        description: String(description || ""),
        tools: safeTools,
      });
      res.status(201).json({ task });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  router.get("/workspace/tasks", requireAuth, (req: any, res) => {
    const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
    res.json({ tasks: store.listTasks(req.user.tenantId, projectId) });
  });

  router.get("/workspace/tasks/:id", requireAuth, (req: any, res) => {
    const task = store.getTask(req.user.tenantId, req.params.id);
    if (!task) return res.status(404).json({ error: "task não encontrada" });
    res.json({ task });
  });

  router.post("/workspace/tasks/:id/cancel", requireAuth, (req: any, res) => {
    const result = orchestrator.cancel(req.user.tenantId, req.params.id);
    if (!result.ok) return res.status(409).json({ error: result.error });
    res.json({ cancelled: true, taskId: req.params.id });
  });

  return router;
}
