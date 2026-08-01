import { Router } from "express";
import { AccountStore } from "./store";
import { signToken } from "./jwt";
import { authSecret, AuthedRequest, requireAuth, requireRole } from "./middleware";
import { hashPassword, verifyPassword } from "./password";
import { RateLimiter } from "./rate-limiter";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `org-${Date.now().toString(36)}`;
}

export function createAuthRouter(store: AccountStore, logger: ILogger, metrics: IMetrics): Router {
  const router = Router();
  const loginLimiter = new RateLimiter(10, 60_000);
  const registerLimiter = new RateLimiter(5, 60_000);

  const issueToken = (userId: string, tenantId: string, role: any, email: string) =>
    signToken({ sub: userId, tenantId, role, email }, authSecret());

  // POST /api/auth/register  { name, email, password, org }
  router.post("/auth/register", registerLimiter.middleware, (req, res) => {
    try {
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      const org = String(req.body?.org || name || "Minha Organização").trim();

      if (name.length < 2) return res.status(400).json({ error: "Nome muito curto" });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Email inválido" });
      if (password.length < 8) return res.status(400).json({ error: "Password deve ter pelo menos 8 caracteres" });

      const tenant = store.createTenant(org, slugify(org));
      const user = store.createUser({
        tenantId: tenant.id,
        name,
        email,
        passwordHash: hashPassword(password),
        role: "owner",
      });
      metrics.inc("auth_registrations_total", { plan: tenant.plan });
      metrics.inc("tenants_total");
      logger.info(`Registo: ${email} → tenant ${tenant.slug}`);
      const token = issueToken(user.id, tenant.id, user.role, user.email);
      res.status(201).json({
        ok: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, plan: tenant.plan, trialEndsAt: tenant.trialEndsAt },
      });
    } catch (e: any) {
      const status = e.message?.includes("já existe") || e.message?.includes("já registado") ? 409 : 400;
      res.status(status).json({ error: e.message || "Falha no registo" });
    }
  });

  // POST /api/auth/login  { email, password }
  router.post("/auth/login", loginLimiter.middleware, (req, res) => {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      const user = store.findUserByEmail(email);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        metrics.inc("auth_login_failures_total");
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      const tenant = store.getTenantById(user.tenantId);
      metrics.inc("auth_logins_total");
      logger.info(`Login: ${email}`);
      const token = issueToken(user.id, user.tenantId, user.role, user.email);
      res.json({
        ok: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        tenant: { id: tenant?.id, slug: tenant?.slug, name: tenant?.name, plan: tenant?.plan, trialEndsAt: tenant?.trialEndsAt },
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Falha no login" });
    }
  });

  // GET /api/auth/me
  router.get("/auth/me", requireAuth, (req: AuthedRequest, res) => {
    const user = store.getUserById(req.user!.sub);
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });
    const tenant = store.getTenantById(user.tenantId);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
      tenant: tenant ? { id: tenant.id, slug: tenant.slug, name: tenant.name, plan: tenant.plan, trialEndsAt: tenant.trialEndsAt } : null,
    });
  });

  // PATCH /api/auth/profile  { name } | { role } (owner/admin only for role)
  router.patch("/auth/profile", requireAuth, (req: AuthedRequest, res) => {
    const user = store.getUserById(req.user!.sub);
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });
    const name = String(req.body?.name || "").trim();
    if (name.length >= 2) {
      store.updateUser(user.id, { name });
    }
    const targetRole = req.body?.role as string | undefined;
    if (targetRole && req.user!.role === "owner") {
      const allowed = ["owner", "admin", "member"];
      if (allowed.includes(targetRole)) store.updateUser(user.id, { role: targetRole as any });
    }
    const updated = store.getUserById(user.id)!;
    res.json({ ok: true, user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } });
  });

  // GET /api/auth/users  (owner/admin) — listar membros do tenant
  router.get("/auth/users", requireAuth, requireRole("owner", "admin"), (req: AuthedRequest, res) => {
    const users = store.listUsers(req.user!.tenantId).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }));
    res.json({ ok: true, users });
  });

  router.post("/auth/logout", (_req, res) => {
    res.json({ ok: true, message: "Sessão terminada (descarte o token)" });
  });

  return router;
}
