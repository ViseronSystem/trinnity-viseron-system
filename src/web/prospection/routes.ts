import { Router, Response } from "express";
import { AuthedRequest } from "../auth/middleware";
import { ProspectionStore, ProspectionEngine } from "../../core/prospection";

export interface ProspectionDeps {
  store: ProspectionStore;
  engine: ProspectionEngine;
}

export function createProspectionDeps(dataDir: string, email: import("../email/service").EmailService): ProspectionDeps {
  const store = new ProspectionStore(dataDir);
  return { store, engine: new ProspectionEngine(store, email) };
}

export function createProspectionRouter(deps: ProspectionDeps, logger?: { info?: (message: string, meta?: Record<string, unknown>) => void }): Router {
  const router = Router();
  const { store, engine } = deps;
  const log = (msg: string) => {
    if (logger && logger.info) logger.info(`[prospection] ${msg}`);
    else console.log(`[prospection] ${msg}`);
  };

  router.get("/prospection/status", (_req: AuthedRequest, res: Response) => {
    res.json({ ok: true, stats: store.stats(), campaigns: store.listCampaigns(), suppression: store.suppressionList().length });
  });

  router.post("/prospection/campaigns", (_req: AuthedRequest, res: Response) => {
    const name = String(_req.body?.name || "").trim();
    if (!name) return void res.status(400).json({ ok: false, error: "name required" });
    const campaign = store.createCampaign({
      name: name.slice(0, 120),
      niche: String(_req.body?.niche || "saude").slice(0, 80),
      target: String(_req.body?.target || "clinicas").slice(0, 120),
      dailyCap: Math.max(1, Math.min(200, Number(_req.body?.dailyCap) || 50)),
      warmupDays: Math.max(0, Math.min(30, Number(_req.body?.warmupDays) || 0)),
      sender: String(_req.body?.sender || "TVS Outbound").slice(0, 120),
      signature: String(_req.body?.signature || "").slice(0, 200),
      status: "draft",
    });
    log(`campaign created: ${campaign.id} (${name})`);
    res.json({ ok: true, campaign });
  });

  router.get("/prospection/campaigns", (_req: AuthedRequest, res: Response) => {
    const campaigns = store.listCampaigns().map((c) => ({
      ...c,
      stats: store.stats(c.id),
      leads: store.listLeads(c.id).length,
    }));
    res.json({ ok: true, campaigns });
  });

  router.post("/prospection/campaigns/:id/leads", (_req: AuthedRequest, res: Response) => {
    try {
      const rows = Array.isArray(_req.body?.leads) ? _req.body.leads : [];
      if (!rows.length) return void res.status(400).json({ ok: false, error: "leads[] required" });
      const result = store.importLeads(String(_req.params.id), rows);
      res.json({ ok: true, ...result });
    } catch (e) {
      res.status(404).json({ ok: false, error: (e as Error).message });
    }
  });

  router.get("/prospection/campaigns/:id/leads", (_req: AuthedRequest, res: Response) => {
    const status = String(_req.query.status || "");
    res.json({ ok: true, leads: store.listLeads(String(_req.params.id), status ? (status as any) : undefined) });
  });

  router.post("/prospection/campaigns/:id/personalize", async (_req: AuthedRequest, res: Response) => {
    const result = await engine.personalizeCampaign(String(_req.params.id));
    res.json({ ...result, ok: result.ok });
  });

  router.post("/prospection/campaigns/:id/send", async (_req: AuthedRequest, res: Response) => {
    const limit = Number(_req.body?.limit) || undefined;
    const result = await engine.sendBatch(String(_req.params.id), limit);
    res.json({ ...result, ok: result.ok });
  });

  router.post("/prospection/webhook/response", async (_req: AuthedRequest, res: Response) => {
    const leadId = String(_req.body?.leadId || "");
    const text = String(_req.body?.response || "");
    const source = String(_req.body?.source || "email");
    if (!leadId) return void res.status(400).json({ ok: false, error: "leadId required" });
    const lead = await engine.captureResponse(leadId, text, source);
    if (!lead) return void res.status(404).json({ ok: false, error: "lead not found" });
    if (lead.intent === "hot") engine.alertManager(lead);
    log(`response captured: ${lead.email} → ${lead.intent || lead.status}`);
    res.json({ ok: true, lead });
  });

  router.post("/prospection/suppress", (_req: AuthedRequest, res: Response) => {
    const email = String(_req.body?.email || "").trim().toLowerCase();
    if (!email) return void res.status(400).json({ ok: false, error: "email required" });
    store.suppress(email);
    res.json({ ok: true, suppression: store.suppressionList().length });
  });

  router.get("/prospection/audit", (_req: AuthedRequest, res: Response) => {
    res.json({ ok: true, audit: store.auditLog().slice(-100) });
  });

  return router;
}