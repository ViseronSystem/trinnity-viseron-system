import { Router } from "express";
import { TVSOs } from "./index";

export function createOsGateway(os: TVSOs): Router {
  const router = Router();

  router.get("/status", (_req, res) => {
    res.json(os.status());
  });

  // ── Process Manager ──
  router.get("/processes", (req, res) => {
    const status = typeof req.query.status === "string" ? (req.query.status as any) : undefined;
    res.json({ stats: os.processes.stats(), processes: os.processes.list(status) });
  });

  router.post("/processes/spawn", (req, res) => {
    try {
      const { agentId, task, context } = req.body ?? {};
      if (!agentId || !task) return res.status(400).json({ error: "agentId e task são obrigatórios" });
      const proc = os.spawn(agentId, task, context);
      res.status(201).json(proc);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/processes/:pid/kill", (req, res) => {
    const proc = os.processes.kill(parseInt(req.params.pid, 10));
    if (!proc) return res.status(404).json({ error: `Processo ${req.params.pid} não encontrado` });
    res.json(proc);
  });

  // ── Virtual File System ──
  router.get("/fs/list", (req, res) => {
    try {
      res.json({ path: (req.query.path as string) || "/", entries: os.fs.ls(req.query.path as string) });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  router.get("/fs/read", (req, res) => {
    try {
      res.json({ path: req.query.path, content: os.fs.read(req.query.path as string) });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post("/fs/write", (req, res) => {
    try {
      const { path, content } = req.body ?? {};
      if (!path || content === undefined) return res.status(400).json({ error: "path e content são obrigatórios" });
      res.json(os.fs.write(path, String(content)));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ── App Store ──
  router.get("/store", (req, res) => {
    res.json({ stats: os.store.stats(), apps: os.store.list((req.query.kind as any) || undefined) });
  });

  router.post("/store/install", (req, res) => {
    try {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id obrigatório" });
      res.json(os.store.install(id));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/store/uninstall", (req, res) => {
    try {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id obrigatório" });
      res.json(os.store.uninstall(id));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Package Manager ──
  router.post("/pkg/install", (req, res) => {
    try {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id obrigatório" });
      res.json(os.pkg.install(id));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/pkg/uninstall", (req, res) => {
    try {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id obrigatório" });
      res.json(os.pkg.uninstall(id));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/pkg/update", (_req, res) => {
    res.json(os.pkg.update());
  });

  router.get("/pkg/doctor", (_req, res) => {
    res.json(os.pkg.doctor());
  });

  router.get("/pkg/list", (_req, res) => {
    res.json({ installed: os.pkg.listInstalled() });
  });

  // ── Security Center ──
  router.get("/security", (_req, res) => {
    res.json(os.security.status());
  });

  router.post("/security/authorize", (req, res) => {
    const { role, permission } = req.body ?? {};
    res.json({ allowed: os.security.can(role, permission), role, permission });
  });

  return router;
}
