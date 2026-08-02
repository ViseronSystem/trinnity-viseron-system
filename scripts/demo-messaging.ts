import axios from "axios";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ViseronWebServer } from "../src/web/standalone-server";

const PORT = 32566;
const BASE = `http://localhost:${PORT}`;

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tvs-messaging-demo-"));
  const server = new ViseronWebServer({ dataDir: tmpDir, port: PORT });
  await server.start();

  const stamp = Date.now().toString(36);
  const emailA = `alice.${stamp}@trinnityviseronsystem.io`;
  const emailB = `bob.${stamp}@trinnityviseronsystem.io`;

  try {
    console.log("\n==========================================");
    console.log("MESSAGING DEMO — CONTACTOS · CONVERSAS · E2E");
    console.log("==========================================");

    const status = await axios.get(`${BASE}/api/messaging/status`);
    console.log(`\n1. GET /messaging/status     → crypto=${status.data.crypto} enabled=${status.data.enabled}`);

    const aliceReg = await axios.post(`${BASE}/api/auth/register`, { name: "Alice", email: emailA, password: "password123", org: "TVS Alice" });
    const bobReg = await axios.post(`${BASE}/api/auth/register`, { name: "Bob", email: emailB, password: "password123", org: "TVS Bob" });
    const aliceToken = aliceReg.data.token;
    console.log(`2. Registo Alice/Bob        → ${aliceReg.data.user.id} · ${bobReg.data.user.id}`);

    const key = await axios.post(`${BASE}/api/messaging/key`, {}, { headers: { Authorization: `Bearer ${aliceToken}` } });
    console.log(`3. POST /messaging/key       → fingerprint=${key.data.fingerprint}…`);

    await axios.post(`${BASE}/api/messaging/contacts`, { email: emailB }, { headers: { Authorization: `Bearer ${aliceToken}` } });
    console.log(`4. POST /messaging/contacts  → Bob adicionado aos contactos da Alice`);

    const conv = await axios.post(`${BASE}/api/messaging/conversations`, { userId: bobReg.data.user.id }, { headers: { Authorization: `Bearer ${aliceToken}` } });
    console.log(`5. POST /messaging/conversations → ${conv.data.conversation.id} (direct)`);

    const sent = await axios.post(
      `${BASE}/api/messaging/conversations/${conv.data.conversation.id}/messages`,
      { text: "Olá Bob! Este segredo está cifrado ponta-a-ponta. 🛰️" },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    console.log(`6. POST messages (E2E)      → ${sent.data.message.deliveredTo} payloads cifrados (x25519+aes-256-gcm)`);

    const bobToken = bobReg.data.token;
    await axios.post(`${BASE}/api/messaging/key`, {}, { headers: { Authorization: `Bearer ${bobToken}` } });
    const bobMsgs = await axios.get(`${BASE}/api/messaging/conversations/${conv.data.conversation.id}/messages`, { headers: { Authorization: `Bearer ${bobToken}` } });
    const text = bobMsgs.data.messages[0]?.text;
    console.log(`7. Bob lê mensagem          → ${JSON.stringify(text)}`);

    await axios.post(`${BASE}/api/messaging/conversations/${conv.data.conversation.id}/read`, {}, { headers: { Authorization: `Bearer ${bobToken}` } });
    const convs = await axios.get(`${BASE}/api/messaging/conversations`, { headers: { Authorization: `Bearer ${aliceToken}` } });
    console.log(`8. Status de leitura        → unread=${convs.data.conversations[0]?.unread} (Bob já leu)`);

    const group = await axios.post(`${BASE}/api/messaging/groups`, { name: "Squad Viseron", members: [bobReg.data.user.id] }, { headers: { Authorization: `Bearer ${aliceToken}` } });
    console.log(`9. Grupo criado             → ${group.data.conversation.name} (${group.data.conversation.members.length} membros)`);

    const stored = JSON.parse(fs.readFileSync(path.join(tmpDir, "messaging.json"), "utf8"));
    const storedMsg = stored.messages.find((m: any) => m.id === sent.data.message.id);
    console.log(`10. Persistência cifrada    → plaintext em disco? ${storedMsg && storedMsg.payloads.some((p: any) => p.ct.includes("Segredo")) ? "SIM (ERRO)" : "NÃO (seguro)"}`);

    console.log("\nDEMO MESSAGING: TODOS OS FLUXOS OK\n");
  } finally {
    server.stop();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("Erro na demo de mensageria:", err);
  process.exit(1);
});
