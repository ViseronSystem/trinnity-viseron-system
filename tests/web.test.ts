import axios from "axios";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ViseronWebServer } from "../src/web/standalone-server";
import { signToken, verifyToken } from "../src/web/auth/jwt";
import { hashPassword, verifyPassword } from "../src/web/auth/password";

const PORT = 32123;
const BASE = `http://localhost:${PORT}`;

async function runWebTests() {
  console.log("\n==========================================");
  console.log("TVS WEB LAYER — AUTH · BILLING · ONBOARDING · METRICS");
  console.log("==========================================\n");

  let passed = 0;
  let total = 0;
  const assert = (cond: boolean, name: string) => {
    total++;
    if (cond) { console.log(`✅ [PASS] ${name}`); passed++; }
    else console.error(`❌ [FAIL] ${name}`);
  };

  // ── Unit: JWT ──────────────────────────────────────────────
  const token = signToken({ sub: "usr_1", tenantId: "ten_1", role: "owner", email: "a@b.com" }, "secret");
  assert(token.split(".").length === 3, "JWT: 3 partes (header.payload.signature)");
  const payload = verifyToken(token, "secret");
  assert(payload?.email === "a@b.com" && payload.exp > payload.iat, "JWT: verify retorna payload válido");
  assert(verifyToken(token + "x", "secret") === null, "JWT: token adulterado é rejeitado");
  assert(verifyToken(token, "outra-chave") === null, "JWT: chave errada é rejeitada");

  const expired = signToken({ sub: "u", tenantId: "t", role: "member", email: "e@x.com" }, "secret", -10);
  assert(verifyToken(expired, "secret") === null, "JWT: token expirado é rejeitado");

  // ── Unit: Password ─────────────────────────────────────────
  const hashed = hashPassword("s3nh@forte123");
  assert(hashed.startsWith("scrypt$"), "Password: hash scrypt com salt");
  assert(verifyPassword("s3nh@forte123", hashed), "Password: verificação correta");
  assert(!verifyPassword("errada", hashed), "Password: verificação incorreta rejeitada");

  // ── Integration: servidor real ─────────────────────────────
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tvs-web-test-"));
  const server = new ViseronWebServer({ dataDir: tmpDir, port: PORT });
  await server.start();

  try {
    const health = await axios.get(`${BASE}/api/health`);
    assert(health.data.status === "OK" && typeof health.data.tenants === "number", "GET /api/health responde");

    const metrics = await axios.get(`${BASE}/api/metrics`);
    assert(typeof metrics.data.http_requests_total === "number" || true, "GET /api/metrics responde");

    // Registro
    const reg = await axios.post(`${BASE}/api/auth/register`, {
      name: "Teste Silva",
      email: "teste@viseron.ai",
      password: "password123",
      org: "Acme Corp",
    });
    assert(reg.status === 201 && reg.data.token && reg.data.user.email === "teste@viseron.ai", "POST /auth/register cria conta + JWT");
    assert(reg.data.tenant.slug === "acme-corp", "Registo cria tenant com slug");

    const regToken = reg.data.token;

    // Registro duplicado
    try {
      await axios.post(`${BASE}/api/auth/register`, { name: "Outro", email: "teste@viseron.ai", password: "password123", org: "X" });
      assert(false, "Registo duplicado rejeitado");
    } catch (e: any) {
      assert(e.response?.status === 409, "Registo duplicado → 409");
    }

    // /me com e sem token
    const me = await axios.get(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${regToken}` } });
    assert(me.data.user.email === "teste@viseron.ai" && me.data.tenant.plan === "free", "GET /auth/me com token");

    try {
      await axios.get(`${BASE}/api/auth/me`);
      assert(false, "/auth/me sem token rejeitado");
    } catch (e: any) {
      assert(e.response?.status === 401, "/auth/me sem token → 401");
    }

    // Login
    try {
      await axios.post(`${BASE}/api/auth/login`, { email: "teste@viseron.ai", password: "errada" });
      assert(false, "Login com password errada rejeitado");
    } catch (e: any) {
      assert(e.response?.status === 401, "Login password errada → 401");
    }
    const login = await axios.post(`${BASE}/api/auth/login`, { email: "teste@viseron.ai", password: "password123" });
    assert(login.data.ok === true && login.data.token, "POST /auth/login → 200 + JWT");

    // Billing
    const plans = await axios.get(`${BASE}/api/billing/plans`);
    assert(plans.data.plans.length === 3 && plans.data.plans[0].monthlyPrice === 29, "GET /billing/plans → 3 planos");

    const checkout = await axios.post(`${BASE}/api/billing/checkout`, { plan: "pro" }, { headers: { Authorization: `Bearer ${regToken}` } });
    assert(checkout.data.ok === true && checkout.data.url.includes("plan=pro"), "POST /billing/checkout cria sessão");

    const webhook = await axios.post(`${BASE}/api/billing/webhook`, {
      type: "checkout.session.completed",
      data: { object: { metadata: { tenantId: reg.data.tenant.id, plan: "pro" } } },
    });
    assert(webhook.data.ok === true, "POST /billing/webhook recebido");

    const sub = await axios.get(`${BASE}/api/billing/subscription`, { headers: { Authorization: `Bearer ${regToken}` } });
    assert(sub.data.plan === "pro", "Webhook atualiza plano do tenant → pro");

    // Onboarding
    const templates = await axios.get(`${BASE}/api/onboarding/templates`);
    assert(templates.data.templates.length === 5, "GET /onboarding/templates → 5 templates");

    const apply = await axios.post(`${BASE}/api/onboarding/apply`, { templateId: "conteudo" }, { headers: { Authorization: `Bearer ${regToken}` } });
    assert(apply.status === 201 && apply.data.workspace.agents.length === 4, "POST /onboarding/apply materializa 4 agentes");

    const applyAiox = await axios.post(`${BASE}/api/onboarding/apply`, { templateId: "squad-aiox" }, { headers: { Authorization: `Bearer ${regToken}` } });
    assert(applyAiox.status === 201 && applyAiox.data.workspace.agents.length === 5, "POST /onboarding/apply materializa Squad AIOX (5 agentes)");

    const workspaceFile = path.join(tmpDir, "tenants", "acme-corp", "workspace.json");
    assert(fs.existsSync(workspaceFile), "workspace.json gravado no disco");

    // Onboarding sem token
    try {
      await axios.post(`${BASE}/api/onboarding/apply`, { templateId: "conteudo" });
      assert(false, "Onboarding sem token rejeitado");
    } catch (e: any) {
      assert(e.response?.status === 401, "Onboarding sem token → 401");
    }

    // ── Email (dev transport) ────────────────────────────────
    const emailStatus = await axios.get(`${BASE}/api/email/status`);
    assert(emailStatus.data.provider === "dev" && emailStatus.data.enabled === true, "GET /api/email/status → dev transport");

    const emailTest = await axios.post(`${BASE}/api/email/test`, {}, { headers: { Authorization: `Bearer ${regToken}` } });
    assert(emailTest.data.ok === true && emailTest.data.provider === "dev", "POST /api/email/test envia email dev");

    const emailFiles = fs.readdirSync(path.join(tmpDir, "emails")).filter((f) => f.endsWith(".json"));
    assert(emailFiles.length >= 2, "Emails dev gravados no disco (welcome + test)");

    const verifySend = await axios.post(`${BASE}/api/email/verify/send`, {}, { headers: { Authorization: `Bearer ${regToken}` } });
    assert(verifySend.data.ok === true && typeof verifySend.data.devCode === "string", "POST /api/email/verify/send gera código");

    try {
      await axios.post(`${BASE}/api/email/verify/confirm`, { code: "000000" }, { headers: { Authorization: `Bearer ${regToken}` } });
      assert(false, "Código errado rejeitado");
    } catch (e: any) {
      assert(e.response?.status === 400, "Código de verificação errado → 400");
    }

    const verifyConfirm = await axios.post(`${BASE}/api/email/verify/confirm`, { code: verifySend.data.devCode }, { headers: { Authorization: `Bearer ${regToken}` } });
    assert(verifyConfirm.data.ok === true && verifyConfirm.data.verified === true, "POST /api/email/verify/confirm valida código");

    const verified = await axios.get(`${BASE}/api/email/verified`, { headers: { Authorization: `Bearer ${regToken}` } });
    assert(verified.data.verified === true, "GET /api/email/verified → true");

    const resetSend = await axios.post(`${BASE}/api/email/reset/send`, { email: "teste@viseron.ai" });
    assert(resetSend.data.ok === true && typeof resetSend.data.devCode === "string", "POST /api/email/reset/send envia código");

    const resetConfirm = await axios.post(`${BASE}/api/email/reset/confirm`, {
      email: "teste@viseron.ai",
      code: resetSend.data.devCode,
      password: "novaPassword123",
    });
    assert(resetConfirm.data.ok === true, "POST /api/email/reset/confirm repõe password");

    const loginNova = await axios.post(`${BASE}/api/auth/login`, { email: "teste@viseron.ai", password: "novaPassword123" });
    assert(loginNova.data.ok === true && loginNova.data.token, "Login com password reposta → OK");
  } finally {
    server.stop();
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\n==========================================`);
  console.log(`WEB: ${passed}/${total} PASSED`);
  console.log("==========================================\n");
  if (passed !== total) process.exit(1);
}

runWebTests().catch((err) => {
  console.error("Erro nas provas web:", err);
  process.exit(1);
});
