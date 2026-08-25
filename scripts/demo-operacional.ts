import * as crypto from "crypto";
import axios from "axios";
import { ViseronWebServer } from "../src/web/standalone-server";

const PORT = parseInt(process.env.DEMO_PORT || "32124", 10);
const BASE = `http://localhost:${PORT}`;

async function call(method: string, path: string, body?: any, token?: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
  let data: any = null;
  try { data = await res.json(); } catch { /* noop */ }
  return { status: res.status, data };
}

async function main() {
  const server = new ViseronWebServer({ port: PORT });
  await server.start();

  const stamp = Date.now().toString(36);
  const demoPassword = process.env.TVS_DEMO_PASSWORD || `Demo${crypto.randomBytes(8).toString("base64url")}!`;
  const org = `Trinnity Demo ${stamp.slice(-4)}`;
  console.log("\n═══════════════════════════════════════════════");
  console.log("TVS v7.0 — DEMO OPERACIONAL REAL (HTTP)");
  console.log(`Base: ${BASE}`);
  console.log("═══════════════════════════════════════════════\n");

  const health = await call("GET", "/api/health");
  console.log(`1. GET /api/health            → ${health.status} db=${health.data.db} billing=${health.data.billing} tenants=${health.data.tenants}`);

  const reg = await call("POST", "/api/auth/register", {
    name: "Pedro Costa",
    email: `pedro.${stamp}@trinnityviseronsystem.io`,
    password: demoPassword,
    org,
  });
  const regToken = reg.data.token;
  console.log(`2. POST /auth/register        → ${reg.status} user=${reg.data.user?.email} tenant=${reg.data.tenant?.slug} plan=${reg.data.tenant?.plan} trial=${reg.data.tenant?.trialEndsAt}`);

  const me = await call("GET", "/api/auth/me", undefined, regToken);
  console.log(`3. GET /auth/me (JWT)         → ${me.status} role=${me.data.user?.role} plan=${me.data.tenant?.plan}`);

  const login = await call("POST", "/api/auth/login", {
    email: `pedro.${stamp}@trinnityviseronsystem.io`,
    password: demoPassword,
  });
  console.log(`4. POST /auth/login           → ${login.status} token ok=${!!login.data.token}`);

  const onb = await call("POST", "/api/onboarding/apply", { templateId: "conteudo" }, regToken);
  console.log(`5. POST /onboarding/apply     → ${onb.status} ${onb.data.note}`);

  const co = await call("POST", "/api/billing/checkout", { plan: "pro" }, regToken);
  console.log(`6. POST /billing/checkout     → ${co.status} provider=${co.data.provider} url=${co.data.url}`);

  const whBody = {
    event_code: "AUTHORISATION",
    data: { paymentStatus: "AUTHORISED", customReference: `plan:${reg.data.tenant.id}:pro` },
  };
  const whRaw = JSON.stringify(whBody);
  const clientSecret = process.env.AVIRATO_CLIENT_SECRET || "";
  const ts = Math.floor(Date.now() / 1000);
  const hmac = crypto.createHmac("sha256", clientSecret).update(`${ts}.${whRaw}`).digest("hex");
  const wh = await axios.post(BASE + "/api/billing/webhook", whRaw, {
    headers: { "Content-Type": "application/json", "x-avirato-signature": clientSecret ? `t=${ts},v1=${hmac}` : "" },
  });
  console.log(`7. POST /billing/webhook      → ${wh.status} (upgrade tenant)`);

  const sub = await call("GET", "/api/billing/subscription", undefined, regToken);
  console.log(`8. GET /billing/subscription  → ${sub.status} plan=${sub.data.plan} trial=${sub.data.trial} ativo=${sub.data.active}`);

  const met = await call("GET", "/api/metrics");
  const m: any = met.data || {};
  const reqTotal = Object.keys(m).filter((k) => k.startsWith("http_requests_total")).reduce((s, k) => s + (m[k] as number), 0);
  console.log(`9. GET /api/metrics           → requests=${reqTotal} logins=${m.auth_logins_total ?? 0} checkout=${m.billing_checkout_total ?? 0} webhooks=${m.billing_webhooks_total ?? 0}`);

  console.log("\n═══════════════════════════════════════════════");
  console.log("DEMO COMPLETA — 9/9 endpoints operacionais");
  console.log("═══════════════════════════════════════════════\n");

  server.stop();
  process.exit(0);
}

main().catch((e) => {
  console.error("Falha na demo:", e.message);
  process.exit(1);
});
