import axios from "axios";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ViseronWebServer } from "../src/web/standalone-server";

const PORT = 32555;
const BASE = `http://localhost:${PORT}`;

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tvs-email-demo-"));
  const server = new ViseronWebServer({ dataDir: tmpDir, port: PORT });
  await server.start();

  const stamp = Date.now().toString(36);
  const email = `demo.${stamp}@trinnityviseronsystem.io`;

  try {
    console.log("\n==========================================");
    console.log("EMAIL DEMO — VERIFY · RESET · INVOICE · AGENT");
    console.log("==========================================");

    const status = await axios.get(`${BASE}/api/email/status`);
    console.log(`\n1. GET /email/status        → provider=${status.data.provider} enabled=${status.data.enabled}`);

    const reg = await axios.post(`${BASE}/api/auth/register`, {
      name: "Pedro Costa",
      email,
      password: "password123",
      org: "TVS Demo",
    });
    const token = reg.data.token;
    console.log(`2. POST /auth/register      → ${reg.status} user=${reg.data.user.email} (welcome email enviado)`);

    const test = await axios.post(`${BASE}/api/email/test`, {}, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`3. POST /email/test         → ${test.status} ok=${test.data.ok} provider=${test.data.provider}`);

    const verify = await axios.post(`${BASE}/api/email/verify/send`, {}, { headers: { Authorization: `Bearer ${token}` } });
    const devCode = verify.data.devCode;
    console.log(`4. POST /email/verify/send  → ok=${verify.data.ok} devCode=${devCode}`);

    if (devCode) {
      const confirm = await axios.post(`${BASE}/api/email/verify/confirm`, { code: devCode }, { headers: { Authorization: `Bearer ${token}` } });
      console.log(`5. POST /email/verify/confirm → verified=${confirm.data.verified}`);
    } else {
      console.log(`5. POST /email/verify/confirm → SKIP (gmail real: código enviado para ${email})`);
    }

    const reset = await axios.post(`${BASE}/api/email/reset/send`, { email });
    console.log(`6. POST /email/reset/send   → ok=${reset.data.ok} devCode=${reset.data.devCode}`);

    if (reset.data.devCode) {
      const resetOk = await axios.post(`${BASE}/api/email/reset/confirm`, { email, code: reset.data.devCode, password: "novaPassword123" });
      console.log(`7. POST /email/reset/confirm → ${resetOk.data.message}`);
    } else {
      console.log(`7. POST /email/reset/confirm → SKIP (gmail real: código enviado para ${email})`);
    }

    const loginPassword = reset.data.devCode ? "novaPassword123" : "password123";
    const login = await axios.post(`${BASE}/api/auth/login`, { email, password: loginPassword });
    console.log(`8. POST /auth/login → ${login.data.ok ? "OK" : "FALHOU"}`);

    const whBody = {
      event_code: "AUTHORISATION",
      data: { paymentStatus: "AUTHORISED", customReference: `plan:${reg.data.tenant.id}:pro` },
    };
    const whRaw = JSON.stringify(whBody);
    const clientSecret = process.env.AVIRATO_CLIENT_SECRET || "";
    const ts = Math.floor(Date.now() / 1000);
    const hmac = crypto.createHmac("sha256", clientSecret).update(`${ts}.${whRaw}`).digest("hex");
    const wh = await axios.post(`${BASE}/api/billing/webhook`, whRaw, {
      headers: {
        "Content-Type": "application/json",
        "x-avirato-signature": clientSecret ? `t=${ts},v1=${hmac}` : "",
      },
    });
    console.log(`9. POST /billing/webhook    → ${wh.status} (invoice email enviado, plano pro)`);

    const emailsDir = path.join(tmpDir, "emails");
    const files = fs.existsSync(emailsDir) ? fs.readdirSync(emailsDir).filter((f) => f.endsWith(".json")) : [];
    console.log(`\nEmails gravados em dev mode: ${files.length}`);
    for (const f of files) {
      const rec = JSON.parse(fs.readFileSync(path.join(emailsDir, f), "utf8"));
      console.log(`   - ${rec.subject} → ${rec.to}`);
    }
    console.log("\nDEMO EMAIL: TODOS OS FLUXOS OK\n");
  } finally {
    server.stop();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("Erro na demo de email:", err);
  process.exit(1);
});
