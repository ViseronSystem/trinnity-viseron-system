import { Router } from "express";
import { CryptoPayments, CryptoCurrency } from "../../core/crypto/payments";
import { getPlan } from "../billing/plans";
import { AuthedRequest, requireAuth } from "../auth/middleware";

// ── TVS CRYPTO API — wallet real, faturas e monetização automática ────

export function createCryptoRouter(payments: CryptoPayments): Router {
  const router = Router();

  router.get("/crypto/status", (_req, res) => {
    const st = payments.status();
    const totals = payments.totals();
    res.json({ ok: true, ...st, totals });
  });

  router.get("/crypto/prices", async (_req, res) => {
    try {
      res.json({ ok: true, prices: await payments.prices() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/crypto/balances", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const balances = await payments.balances();
      const prices = await payments.prices();
      const usdTotal = balances.reduce((acc, b) => acc + (b.usd || 0), 0);
      res.json({ ok: true, mode: payments.status().mode, balances, prices, usdTotal });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/crypto/invoices", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const planId = String(req.body?.plan || "");
      const currency = String(req.body?.currency || "USDT").toUpperCase() as CryptoCurrency;
      const plan = getPlan(planId);
      if (!plan) return res.status(400).json({ error: "Plano inválido (core|pro|enterprise)" });
      if (!["BTC", "ETH", "USDT"].includes(currency)) return res.status(400).json({ error: "Moeda inválida (BTC|ETH|USDT)" });
      const invoice = await payments.createInvoice({
        plan: plan.id,
        planName: plan.name,
        amountUsd: plan.monthlyPrice,
        currency,
        tenantId: req.user!.tenantId,
      });
      res.status(201).json({ ok: true, invoice });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/crypto/invoices", requireAuth, (req: AuthedRequest, res) => {
    res.json({ ok: true, invoices: payments.list(req.user!.tenantId) });
  });

  router.get("/crypto/invoices/:id", requireAuth, (req: AuthedRequest, res) => {
    const invoice = payments.get(String(req.params.id || ""));
    if (!invoice) return res.status(404).json({ error: "Fatura não encontrada" });
    if (invoice.tenantId && invoice.tenantId !== req.user!.tenantId) return res.status(403).json({ error: "Sem permissão" });
    res.json({ ok: true, invoice });
  });

  router.post("/crypto/invoices/:id/confirm", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const id = String(req.params.id || "");
      const invoice = payments.get(id);
      if (!invoice) return res.status(404).json({ error: "Fatura não encontrada" });
      if (invoice.tenantId && invoice.tenantId !== req.user!.tenantId) return res.status(403).json({ error: "Sem permissão" });
      const result = await payments.confirm(id);
      res.json({ ok: true, ...result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Verificação automática de pagamentos pendentes (monetização automática).
  router.post("/crypto/check", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const expired = payments.expireStale();
      const paid = await payments.detect();
      res.json({ ok: true, expired, paid: paid.map((p) => ({ id: p.invoice.id, plan: p.invoice.plan, currency: p.invoice.currency })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
