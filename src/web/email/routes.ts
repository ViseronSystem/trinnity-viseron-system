import { Router } from "express";
import { AccountStore } from "../auth/store";
import { AuthedRequest, requireAuth } from "../auth/middleware";
import { EmailService, gmailConfigured, gmailAuthUrl } from "./service";
import { hashPassword } from "../auth/password";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

export function createEmailRouter(
  store: AccountStore,
  email: EmailService,
  logger: ILogger,
  metrics: IMetrics
): Router {
  const router = Router();

  router.get("/email/status", (_req, res) => {
    res.json({
      provider: email.transport.provider,
      enabled: email.transport.enabled,
      gmail: gmailConfigured(),
      gmailAuthUrl: gmailConfigured() ? undefined : gmailAuthUrl(`${process.env.TVS_PUBLIC_URL || "https://www.trinnityviseronsystem.io"}/api/email/gmail/callback`),
    });
  });

  router.post("/email/test", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const user = store.getUserById(req.user!.sub);
      if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });
      const result = await email.send({
        to: user.email,
        subject: "Teste de email — Trinnity Viseron System",
        text: "Este é um email de teste. Se o recebeste, o teu transporte de email está a funcionar.",
        html: "<p>Este é um <b>email de teste</b>. Se o recebeste, o transporte está a funcionar.</p>",
      });
      metrics.inc("email_test_total");
      if (!result.ok) return res.status(502).json({ ok: false, error: result.error, provider: result.provider });
      res.json({ ok: true, provider: result.provider, messageId: result.messageId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/email/verify/send", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const user = store.getUserById(req.user!.sub);
      if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });
      const { result, code } = await email.sendVerification(user.email, user.name);
      metrics.inc("email_verification_sent_total");
      logger.info(`Verificação enviada para ${user.email}`);
      if (!result.ok) return res.status(502).json({ ok: false, error: result.error, provider: result.provider });
      res.json({ ok: true, provider: result.provider, devCode: result.provider === "dev" ? code : undefined });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/email/verify/confirm", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const user = store.getUserById(req.user!.sub);
      if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });
      const code = String(req.body?.code || "").trim();
      const token = email.tokens.consume(user.email, "verify", code);
      if (!token) return res.status(400).json({ error: "Código inválido ou expirado" });
      email.tokens.markVerified(user.email);
      metrics.inc("email_verified_total");
      logger.info(`Email verificado: ${user.email}`);
      res.json({ ok: true, verified: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/email/verified", requireAuth, (req: AuthedRequest, res) => {
    const user = store.getUserById(req.user!.sub);
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });
    res.json({ verified: email.tokens.isVerified(user.email) });
  });

  router.post("/email/reset/send", async (req, res) => {
    try {
      const emailAddress = String(req.body?.email || "").trim().toLowerCase();
      const user = store.findUserByEmail(emailAddress);
      if (!user) return res.json({ ok: true, message: "Se o email existir, receberás um código." });
      const { result, code } = await email.sendReset(user.email, user.name);
      metrics.inc("email_reset_sent_total");
      logger.info(`Reset pedido para ${user.email}`);
      if (!result.ok) return res.status(502).json({ ok: false, error: result.error, provider: result.provider });
      res.json({ ok: true, provider: result.provider, devCode: result.provider === "dev" ? code : undefined });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/email/reset/confirm", async (req, res) => {
    try {
      const emailAddress = String(req.body?.email || "").trim().toLowerCase();
      const code = String(req.body?.code || "").trim();
      const password = String(req.body?.password || "");
      const user = store.findUserByEmail(emailAddress);
      if (!user) return res.status(400).json({ error: "Utilizador não encontrado" });
      if (password.length < 8) return res.status(400).json({ error: "Password deve ter pelo menos 8 caracteres" });
      const token = email.tokens.consume(emailAddress, "reset", code);
      if (!token) return res.status(400).json({ error: "Código inválido ou expirado" });
      store.updateUser(user.id, { passwordHash: hashPassword(password) });
      metrics.inc("email_reset_completed_total");
      logger.info(`Password reposta: ${emailAddress}`);
      res.json({ ok: true, message: "Password atualizada com sucesso." });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
