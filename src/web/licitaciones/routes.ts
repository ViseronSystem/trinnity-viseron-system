import { Router, Response } from "express";
import { AuthedRequest } from "../auth/middleware";
import { LicitacionStore } from "../../core/licitaciones";

export function createLicitacionesRouter(store: LicitacionStore, logger?: { info?: (message: string, meta?: Record<string, unknown>) => void }): Router {
  const router = Router();
  const log = (msg: string) => {
    if (logger && logger.info) logger.info(`[licitaciones] ${msg}`);
    else console.log(`[licitaciones] ${msg}`);
  };

  router.get("/licitaciones/status", (_req: AuthedRequest, res: Response) => {
    res.json({ ok: true, ...store.status() });
  });

  router.get("/licitaciones", (_req: AuthedRequest, res: Response) => {
    res.json({
      ok: true,
      licitaciones: store.list().map((l) => ({ ...l, daysLeft: store.daysLeft(l) })),
    });
  });

  router.post("/licitaciones", (_req: AuthedRequest, res: Response) => {
    const name = String(_req.body?.name || "").trim();
    if (!name) return void res.status(400).json({ ok: false, error: "name required" });
    const deadline = String(_req.body?.deadline || "");
    if (!deadline) return void res.status(400).json({ ok: false, error: "deadline required (ISO)" });
    const item = store.add({
      name: name.slice(0, 200),
      organ: String(_req.body?.organ || "").slice(0, 120),
      url: String(_req.body?.url || "").slice(0, 300),
      budget: Number.isFinite(Number(_req.body?.budget)) ? Number(_req.body.budget) : 0,
      deadline,
      status: (["vigilancia", "estudio", "preparacion", "presentada", "adjudicada", "perdida", "archivada"] as const).includes(_req.body?.status) ? _req.body.status : "vigilancia",
      phases: Array.isArray(_req.body?.phases) ? _req.body.phases.map(String) : [],
      checklist: Array.isArray(_req.body?.checklist) ? _req.body.checklist.map((c: unknown) => typeof c === "string" ? { done: false, task: c } : c as any) : [],
      notes: String(_req.body?.notes || "").slice(0, 1000),
    });
    log(`licitacion added: ${item.id} (${name})`);
    res.json({ ok: true, licitacion: item });
  });

  router.patch("/licitaciones/:id", (_req: AuthedRequest, res: Response) => {
    const patch: Record<string, unknown> = {};
    if (_req.body?.name) patch.name = String(_req.body.name).slice(0, 200);
    if (_req.body?.organ) patch.organ = String(_req.body.organ).slice(0, 120);
    if (_req.body?.url) patch.url = String(_req.body.url).slice(0, 300);
    if (Number.isFinite(Number(_req.body?.budget))) patch.budget = Number(_req.body.budget);
    if (_req.body?.deadline) patch.deadline = String(_req.body.deadline);
    if (["vigilancia", "estudio", "preparacion", "presentada", "adjudicada", "perdida", "archivada"].includes(_req.body?.status)) patch.status = _req.body.status;
    if (Array.isArray(_req.body?.phases)) patch.phases = _req.body.phases.map(String);
    if (Array.isArray(_req.body?.checklist)) patch.checklist = _req.body.checklist;
    if (_req.body?.notes !== undefined) patch.notes = String(_req.body.notes).slice(0, 1000);
    const item = store.update(String(_req.params.id), patch);
    if (!item) return void res.status(404).json({ ok: false, error: "licitacion not found" });
    res.json({ ok: true, licitacion: item });
  });

  router.post("/licitaciones/:id/checklist/:index", (_req: AuthedRequest, res: Response) => {
    const item = store.toggleChecklist(String(_req.params.id), Number(_req.params.index));
    if (!item) return void res.status(404).json({ ok: false, error: "licitacion or index not found" });
    res.json({ ok: true, licitacion: item });
  });

  router.delete("/licitaciones/:id", (_req: AuthedRequest, res: Response) => {
    const ok = store.remove(String(_req.params.id));
    if (!ok) return void res.status(404).json({ ok: false, error: "licitacion not found" });
    res.json({ ok: true });
  });

  router.get("/licitaciones/audit", (_req: AuthedRequest, res: Response) => {
    res.json({ ok: true, audit: store.auditLog().slice(-100) });
  });

  return router;
}