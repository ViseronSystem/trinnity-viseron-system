import { Router, Response } from "express";
import { AuthedRequest, requireAuth } from "../auth/middleware";
import { AgencyStore, AgencyLead, newAgencyId } from "../../core/agency/store";
import { AGENCY_PACKAGES, capacityIndicators, projectionTable, LEGACY_FEE, NEW_FEE } from "../../core/agency/finance";
import { ReportingAgent, LeadResponseAgent, CreativesAgent, NurturingAgent } from "./agents";

export interface AgencyDeps {
  store: AgencyStore;
  reporting: ReportingAgent;
  leadResponse: LeadResponseAgent;
  creatives: CreativesAgent;
  nurturing: NurturingAgent;
}

export function createAgencyDeps(dataDir: string): AgencyDeps {
  const store = new AgencyStore(dataDir);
  return {
    store,
    reporting: new ReportingAgent(),
    leadResponse: new LeadResponseAgent(),
    creatives: new CreativesAgent(),
    nurturing: new NurturingAgent(),
  };
}

export function createAgencyRouter(deps: AgencyDeps, logger?: { info?: (message: string, meta?: Record<string, unknown>) => void }): Router {
  const router = Router();
  const store = deps.store;
  const log = (msg: string) => {
    if (logger && logger.info) logger.info(`[agency] ${msg}`);
    else console.log(`[agency] ${msg}`);
  };

  router.get("/agency/status", (_req: AuthedRequest, res: Response) => {
    const clients = store.listClients();
    const leads = store.listLeads();
    const active = clients.filter((c) => c.status === "active").length;
    const report = deps.reporting.generate(store);
    const cap = capacityIndicators(active);
    const projection = projectionTable(active, LEGACY_FEE, NEW_FEE);
    res.json({
      ok: true,
      clients: {
        total: clients.length,
        active,
        onboarding: clients.filter((c) => c.status === "onboarding").length,
        paused: clients.filter((c) => c.status === "paused").length,
        mrr: projection[0].mrr,
        avgFee: projection[0].avgFee,
      },
      leads: {
        total: leads.length,
        new: leads.filter((l) => l.status === "new").length,
        responded: leads.filter((l) => l.status === "responded").length,
        nurturing: leads.filter((l) => l.status === "nurturing").length,
        won: leads.filter((l) => l.status === "won").length,
      },
      capacity: cap,
      report: { summary: report.summary, generatedAt: report.generatedAt },
      projection: projection.map((p) => ({ totalClients: p.totalClients, newClients: p.newClients, mrr: p.mrr, avgFee: p.avgFee, arr: p.arr })),
    });
  });

  // ---- Clientes ----
  router.get("/agency/clients", (req: AuthedRequest, res: Response) => {
    const status = String(req.query.status || "").trim() as any;
    res.json({ ok: true, clients: store.listClients(status) });
  });

  router.post("/agency/clients", requireAuth, (req: AuthedRequest, res: Response) => {
    const name = String(req.body?.name || "").trim();
    if (!name) return void res.status(400).json({ ok: false, error: "name required" });
    const plan = ["bundle", "solo_ads", "solo_creativos", "landing"].includes(req.body?.plan) ? req.body.plan : "bundle";
    const fee = Number(req.body?.fee);
    const now = new Date().toISOString();
    const client = store.addClient({
      id: newAgencyId("cli"),
      name: name.slice(0, 120),
      niche: String(req.body?.niche || "").slice(0, 80),
      plan,
      fee: Number.isFinite(fee) && fee > 0 ? fee : plan === "bundle" ? 1500 : 900,
      status: ["active", "onboarding", "paused"].includes(req.body?.status) ? req.body.status : "active",
      owner: ["pedro", "trafico", "premi"].includes(req.body?.owner) ? req.body.owner : "trafico",
      country: String(req.body?.country || "GB").slice(0, 3).toUpperCase(),
      createdAt: now,
      updatedAt: now,
      notes: String(req.body?.notes || "").slice(0, 500),
    });
    log(`client created: ${client.id} (${name})`);
    res.json({ ok: true, client });
  });

  router.patch("/agency/clients/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    const id = String(req.params.id || "");
    const client = store.updateClient(id, {
      ...(req.body?.name ? { name: String(req.body.name).slice(0, 120) } : {}),
      ...(req.body?.niche !== undefined ? { niche: String(req.body.niche).slice(0, 80) } : {}),
      ...(["bundle", "solo_ads", "solo_creativos", "landing"].includes(req.body?.plan) ? { plan: req.body.plan } : {}),
      ...(Number.isFinite(Number(req.body?.fee)) && Number(req.body.fee) > 0 ? { fee: Number(req.body.fee) } : {}),
      ...(["active", "onboarding", "paused"].includes(req.body?.status) ? { status: req.body.status } : {}),
      ...(["pedro", "trafico", "premi"].includes(req.body?.owner) ? { owner: req.body.owner } : {}),
      ...(req.body?.notes !== undefined ? { notes: String(req.body.notes).slice(0, 500) } : {}),
    });
    if (!client) return void res.status(404).json({ ok: false, error: "client not found" });
    res.json({ ok: true, client });
  });

  router.delete("/agency/clients/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    const ok = store.removeClient(String(req.params.id || ""));
    if (!ok) return void res.status(404).json({ ok: false, error: "client not found" });
    res.json({ ok: true });
  });

  // ---- Leads + Respuesta automática ----
  router.get("/agency/leads", (req: AuthedRequest, res: Response) => {
    const status = String(req.query.status || "").trim() as any;
    res.json({ ok: true, leads: store.listLeads(status) });
  });

  router.post("/agency/leads", requireAuth, async (req: AuthedRequest, res: Response) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return void res.status(400).json({ ok: false, error: "email required" });
    const now = new Date().toISOString();
    const lang = ["es", "pt", "en"].includes(req.body?.lang) ? req.body.lang : "es";
    const lead: AgencyLead = {
      id: newAgencyId("lead"),
      name: String(req.body?.name || "Cliente").slice(0, 120),
      email: email.slice(0, 160),
      company: String(req.body?.company || "").slice(0, 120),
      source: String(req.body?.source || "web").slice(0, 80),
      status: "new",
      lang,
      firstContact: now,
      lastContact: now,
      followUpAt: "",
      notes: String(req.body?.message || "").slice(0, 600),
    };
    store.addLead(lead);
    log(`lead created: ${lead.id} (${email})`);
    const { reply, usedAI } = await deps.leadResponse.respond(store, lead, String(req.body?.message || "").slice(0, 600));
    res.json({ ok: true, lead: store.getLead(lead.id), response: { reply, usedAI } });
  });

  router.post("/agency/leads/:id/respond", requireAuth, async (req: AuthedRequest, res: Response) => {
    const lead = store.getLead(String(req.params.id || ""));
    if (!lead) return void res.status(404).json({ ok: false, error: "lead not found" });
    const { reply, usedAI } = await deps.leadResponse.respond(store, lead, String(req.body?.message || "").slice(0, 600));
    res.json({ ok: true, response: { reply, usedAI }, lead: store.getLead(lead.id) });
  });

  router.patch("/agency/leads/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    const lead = store.updateLead(String(req.params.id || ""), {
      ...(["new", "responded", "nurturing", "won", "lost"].includes(req.body?.status) ? { status: req.body.status } : {}),
      ...(req.body?.notes !== undefined ? { notes: String(req.body.notes).slice(0, 600) } : {}),
    });
    if (!lead) return void res.status(404).json({ ok: false, error: "lead not found" });
    res.json({ ok: true, lead });
  });

  // ---- Métricas (Reporting) ----
  router.get("/agency/metrics", (req: AuthedRequest, res: Response) => {
    const clientId = String(req.query.clientId || "") || undefined;
    res.json({ ok: true, metrics: store.listMetrics(clientId) });
  });

  router.post("/agency/metrics", requireAuth, (req: AuthedRequest, res: Response) => {
    const clientId = String(req.body?.clientId || "").trim();
    const platform = req.body?.platform === "meta" ? "meta" : "google";
    const spend = Number(req.body?.spend);
    const conversions = Number(req.body?.conversions);
    if (!clientId || !Number.isFinite(spend)) return void res.status(400).json({ ok: false, error: "clientId and spend required" });
    const rec = store.addMetrics({
      id: newAgencyId("met"),
      clientId,
      platform,
      period: String(req.body?.period || new Date().toISOString().slice(0, 10)),
      spend: Math.max(0, spend),
      conversions: Math.max(0, Number.isFinite(conversions) ? conversions : 0),
      cpa: 0,
      roas: 0,
      recordedAt: new Date().toISOString(),
    });
    res.json({ ok: true, metrics: rec });
  });

  router.post("/agency/report/generate", requireAuth, (_req: AuthedRequest, res: Response) => {
    const report = deps.reporting.generate(store);
    log("report generated");
    res.json({ ok: true, report });
  });

  // ---- Creativos ----
  router.get("/agency/creatives", (req: AuthedRequest, res: Response) => {
    res.json({ ok: true, creatives: store.listCreatives() });
  });

  router.post("/agency/creatives/generate", requireAuth, async (req: AuthedRequest, res: Response) => {
    const niche = String(req.body?.niche || "").trim();
    if (!niche) return void res.status(400).json({ ok: false, error: "niche required" });
    const platform = req.body?.platform === "meta" ? "meta" : "google";
    const lang = ["es", "pt", "en"].includes(req.body?.lang) ? req.body.lang : "en";
    const job = await deps.creatives.generate(store, niche.slice(0, 80), platform, lang);
    log(`creatives generated: ${job.id} (${niche})`);
    res.json({ ok: true, creative: job });
  });

  // ---- Nurturing ----
  router.get("/agency/nurture", (req: AuthedRequest, res: Response) => {
    res.json({ ok: true, actions: store.listNurture() });
  });

  router.post("/agency/nurture/run", requireAuth, (_req: AuthedRequest, res: Response) => {
    const created = deps.nurturing.run(store);
    res.json({ ok: true, created, total: store.listNurture().length });
  });

  router.post("/agency/nurture/:id/sent", requireAuth, (req: AuthedRequest, res: Response) => {
    const action = store.markNurtureSent(String(req.params.id || ""));
    if (!action) return void res.status(404).json({ ok: false, error: "action not found" });
    res.json({ ok: true, action });
  });

  // ---- Financeiro / projeção ----
  router.get("/agency/projection", (_req: AuthedRequest, res: Response) => {
    const active = store.listClients("active").length;
    res.json({ ok: true, packages: AGENCY_PACKAGES, legacyFee: LEGACY_FEE, newFee: NEW_FEE, projection: projectionTable(active, LEGACY_FEE, NEW_FEE) });
  });

  router.get("/agency/capacity", (_req: AuthedRequest, res: Response) => {
    const active = store.listClients("active").length;
    res.json({ ok: true, ...capacityIndicators(active) });
  });

  return router;
}
