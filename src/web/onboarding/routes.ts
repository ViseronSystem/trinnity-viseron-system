import { Router } from "express";
import fs from "fs";
import path from "path";
import { getTemplate, ONBOARDING_TEMPLATES } from "./templates";
import { AccountStore } from "../auth/store";
import { AuthedRequest, requireAuth } from "../auth/middleware";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

export function createOnboardingRouter(
  store: AccountStore,
  dataDir: string,
  logger: ILogger,
  metrics: IMetrics
): Router {
  const router = Router();

  router.get("/onboarding/templates", (_req, res) => {
    res.json({ ok: true, templates: ONBOARDING_TEMPLATES.map((t) => ({ id: t.id, name: t.name, icon: t.icon, description: t.description, agents: t.agents.length })) });
  });

  // POST /api/onboarding/apply { templateId } — materializa o workspace do tenant
  router.post("/onboarding/apply", requireAuth, (req: AuthedRequest, res) => {
    try {
      const templateId = String(req.body?.templateId || "");
      const template = getTemplate(templateId);
      if (!template) return res.status(400).json({ error: "Template desconhecido" });

      const tenant = store.getTenantById(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ error: "Tenant não encontrado" });

      const tenantDir = path.join(dataDir, "tenants", tenant.slug);
      const workspaceFile = path.join(tenantDir, "workspace.json");
      if (!fs.existsSync(tenantDir)) fs.mkdirSync(tenantDir, { recursive: true });

      const workspace = {
        tenantId: tenant.id,
        template: template.id,
        templateName: template.name,
        agents: template.agents.map((a) => ({ ...a, id: `ag_${tenant.slug}_${a.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}` })),
        tools: template.tools,
        appliedAt: new Date().toISOString(),
        appliedBy: req.user!.email,
      };
      fs.writeFileSync(workspaceFile, JSON.stringify(workspace, null, 2), "utf8");

      metrics.inc("onboarding_applied_total", { template: template.id });
      logger.info(`Onboarding aplicado: ${tenant.slug} → ${template.name} (${template.agents.length} agentes)`);

      res.status(201).json({
        ok: true,
        workspace,
        note: `${template.agents.length} agentes materializados em ${tenant.slug}/workspace.json`,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Falha ao aplicar template" });
    }
  });

  // GET /api/onboarding/workspace — estado atual do tenant
  router.get("/onboarding/workspace", requireAuth, (req: AuthedRequest, res) => {
    const tenant = store.getTenantById(req.user!.tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant não encontrado" });
    const workspaceFile = path.join(dataDir, "tenants", tenant.slug, "workspace.json");
    if (!fs.existsSync(workspaceFile)) return res.json({ ok: true, applied: false });
    res.json({ ok: true, applied: true, workspace: JSON.parse(fs.readFileSync(workspaceFile, "utf8")) });
  });

  return router;
}
