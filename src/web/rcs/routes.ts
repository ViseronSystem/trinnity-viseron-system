import { Router, Response } from "express";
import { AuthedRequest, requireAuth } from "../auth/middleware";
import { RcsEngine } from "../../core/rcs/RcsEngine";

/**
 * RCS router — mensagens de marca do TVS (RCS com fallback SMS/MMS via Twilio).
 * status/logo: público (leitura). send/history: autenticado (JWT).
 * POST /api/rcs/status: webhook de estado do Twilio (sem auth).
 */
export function createRcsRouter(rcs: RcsEngine): Router {
  const router = Router();

  router.get("/rcs/status", (_req, res: Response) => {
    res.json(rcs.status());
  });

  router.get("/rcs/logo", (_req, res: Response) => {
    const file = rcs.logoFile;
    if (!file) {
      res.status(404).json({ ok: false, error: "Logo da TVS não encontrado" });
      return;
    }
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(file);
  });

  router.get("/rcs/broadcasts", requireAuth, (_req: AuthedRequest, res: Response) => {
    res.json({ ok: true, broadcasts: rcs.list(50) });
  });

  router.post("/rcs/send", requireAuth, async (req: AuthedRequest, res: Response) => {
    const to = req.body?.to;
    const message = String(req.body?.message || "").trim();
    const label = String(req.body?.label || "").trim() || undefined;
    if (!to) {
      res.status(400).json({ ok: false, error: "Campo 'to' obrigatório (número único ou lista de números)" });
      return;
    }
    const result = await rcs.sendBroadcast({ to, message, label });
    if (!result.ok && !result.broadcast.messages.length) {
      res.status(400).json({ ok: false, error: result.error || "Falha no envio" });
      return;
    }
    res.json({ ok: result.ok, mode: result.broadcast.mode, ...result.broadcast.results, broadcastId: result.broadcast.id });
  });

  router.post("/rcs/status", (req, res: Response) => {
    rcs.updateStatus(req.body || {});
    res.status(200).send("<Response></Response>");
  });

  return router;
}
