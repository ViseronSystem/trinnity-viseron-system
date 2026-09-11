/**
 * Campaign API Routes — /api/campaigns/*
 * Manages leads, campaigns, and ROI tracking
 */
import { Router, Response } from "express";
import { LeadStore, Lead, Campaign } from "../../core/leads/LeadStore";
import { CampaignEngine } from "../../core/leads/CampaignEngine";

interface AuthedRequest {
  user?: { id: string; role: string; tenantId: string };
  query: any;
  body: any;
  params: any;
}

export function createCampaignRoutes(store: LeadStore, engine: CampaignEngine): Router {
  const router = Router();

  // ---- LEADS ----

  // GET /api/campaigns/leads/stats — Lead statistics
  router.get("/leads/stats", (_req: any, res: Response) => {
    try {
      const stats = store.getStats();
      res.json({ ok: true, ...stats });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/campaigns/leads — List leads with filters
  router.get("/leads", (req: any, res: Response) => {
    try {
      const leads = store.getLeads({
        source: req.query.source as string,
        channel: req.query.channel as string,
        segment: req.query.segment as string,
        status: req.query.status as string,
        province: req.query.province as string,
        operator: req.query.operator as string,
        limit: parseInt(req.query.limit || "100"),
        offset: parseInt(req.query.offset || "0"),
      });
      res.json({ ok: true, count: leads.length, leads });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /api/campaigns/leads/import — Import leads from JSON
  router.post("/leads/import", (req: any, res: Response) => {
    try {
      const { leads } = req.body;
      if (!Array.isArray(leads)) {
        return res.status(400).json({ ok: false, error: "leads array required" });
      }
      const added = store.addLeadsBatch(leads);
      res.json({ ok: true, added, total: store.getStats().total });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // PATCH /api/campaigns/leads/:id — Update lead
  router.patch("/leads/:id", (req: any, res: Response) => {
    try {
      const lead = store.updateLead(req.params.id, req.body);
      if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });
      res.json({ ok: true, lead });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ---- CAMPAIGNS ----

  // GET /api/campaigns — List all campaigns
  router.get("/", (_req: any, res: Response) => {
    try {
      const campaigns = store.getCampaigns();
      res.json({ ok: true, count: campaigns.length, campaigns });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /api/campaigns — Create campaign with personalized messages
  router.post("/", (req: any, res: Response) => {
    try {
      const { name, type, targetSegment, limit } = req.body;
      if (!name || !type) {
        return res.status(400).json({ ok: false, error: "name and type required" });
      }

      const messages = engine.generateMessages({
        segment: targetSegment || "general",
        channel: type,
        limit: limit || 1000,
      });

      const campaign = store.createCampaign({
        name,
        type,
        targetSegment: targetSegment || "general",
        targetCount: messages.length,
        status: "draft",
        messages,
      });

      res.json({ ok: true, campaign, messageCount: messages.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/campaigns/:id — Get campaign detail
  router.get("/:id", (req: any, res: Response) => {
    try {
      const campaign = store.getCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ ok: false, error: "Campaign not found" });
      res.json({ ok: true, campaign });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /api/campaigns/:id/send — Mark campaign as sent
  router.post("/:id/send", (req: any, res: Response) => {
    try {
      const campaign = store.updateCampaign(req.params.id, {
        status: "sending",
        sentAt: new Date().toISOString(),
      });
      if (!campaign) return res.status(404).json({ ok: false, error: "Campaign not found" });
      res.json({ ok: true, campaign });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /api/campaigns/:id/complete — Mark campaign completed
  router.post("/:id/complete", (req: any, res: Response) => {
    try {
      const campaign = store.updateCampaign(req.params.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        sentCount: req.body.sentCount || 0,
        deliveredCount: req.body.deliveredCount || 0,
      });
      if (!campaign) return res.status(404).json({ ok: false, error: "Campaign not found" });
      res.json({ ok: true, campaign });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /api/campaigns/:id/convert — Track conversion
  router.post("/:id/convert", (req: any, res: Response) => {
    try {
      const { leadId, revenue } = req.body;
      if (!leadId || !revenue) {
        return res.status(400).json({ ok: false, error: "leadId and revenue required" });
      }
      store.trackConversion(leadId, revenue, req.params.id);
      res.json({ ok: true, message: "Conversion tracked" });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ---- METRICS ----

  // GET /api/campaigns/metrics/roi — ROI projection
  router.get("/metrics/roi", (req: any, res: Response) => {
    try {
      const channel = (req.query.channel as any) || "rcs";
      const count = parseInt(req.query.count || "10000");
      const metrics = engine.calculateCampaignMetrics({
        channel,
        targetCount: count,
      });
      res.json({ ok: true, ...metrics });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/campaigns/metrics/plan — Full campaign plan
  router.get("/metrics/plan", (_req: any, res: Response) => {
    try {
      const plan = engine.generateCampaignPlan();
      res.json({ ok: true, ...plan });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /api/campaigns/metrics/revenue — Revenue projection
  router.get("/metrics/revenue", (req: any, res: Response) => {
    try {
      const months = parseInt(req.query.months || "12");
      const projection = store.projectRevenue(months);
      res.json({ ok: true, projection });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return router;
}
