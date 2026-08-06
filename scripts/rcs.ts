import "dotenv/config";
import { RcsEngine } from "../src/core/rcs/RcsEngine";

/**
 * Viseron RCS CLI v1.0
 * Mensagens de marca (RCS com fallback SMS/MMS via Twilio) com o logo da TVS.
 *   npm run rcs:status                    -> estado do canal RCS
 *   npm run rcs:send -- +351912345678 "Olá VISERON" [--label X]
 *   npm run rcs:list                      -> histórico de broadcasts
 */
const command = process.argv[2] || "status";

async function main(): Promise<void> {
  const rcs = new RcsEngine();
  const status = rcs.status();
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  RCS — Mensagens de marca (Trinnity Viseron) ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`Modo:     ${status.mode} ${status.configured ? "(RCS real ✓)" : "(simulado — define TWILIO_RCS_SERVICE_SID para RCS real)"}`);
  console.log(`Marca:    ${status.brandName}`);
  console.log(`Logo:     ${status.logoExists ? `disponível ✓ (${status.logoUrl})` : "EM FALTA"}`);
  console.log(`Twilio:   ${status.twilioConfigured ? "credenciais ✓" : "sem credenciais"}`);
  console.log(`Messaging Service: ${status.serviceSidConfigured ? "✓ configurado" : "✗ não definido (TWILIO_RCS_SERVICE_SID)"}`);
  console.log(`Template rico:     ${status.contentSidConfigured ? "✓ (TWILIO_RCS_CONTENT_SID)" : "opcional (sem template)"}`);
  console.log(`Stats:    ${status.stats.messages} mensagens · ${status.stats.delivered} entregues · ${status.stats.read} lidas · ${status.stats.rcs} RCS · ${status.stats.failed} falhadas`);
  console.log(`Broadcasts: ${status.broadcasts}`);

  if (command === "send") {
    const to = process.argv[3];
    const msg = process.argv.slice(4).filter((a) => !a.startsWith("--")).join(" ") || undefined;
    if (!to) {
      console.error("\n[RCS] Uso: npm run rcs:send -- +351912345678 \"mensagem\" [--label Etiqueta]");
      process.exit(1);
    }
    const label = process.argv.includes("--label") ? process.argv[process.argv.indexOf("--label") + 1] : undefined;
    console.log(`\n[RCS] A enviar para ${to} (modo ${rcs.mode})...`);
    const result = await rcs.sendBroadcast({ to, message: msg, label });
    if (!result.ok && !result.broadcast.messages.length) {
      console.error(`[RCS] Falha: ${result.error}`);
      process.exit(1);
    }
    const first = result.broadcast.messages[0];
    console.log(`[RCS] Broadcast ${result.broadcast.id}`);
    console.log(`  → ${first.to}: ${first.status} (canal ${first.channel})${first.sid ? ` · SID ${first.sid}` : ""}`);
    if (first.error) console.log(`  ✗ ${first.error}`);
    console.log(`  logo: ${result.broadcast.mediaUrl}`);
    if (rcs.mode === "mock") {
      console.log("\nDica: para RCS real, cria o RCS Sender + aprova a marca na Google no console Twilio e define TWILIO_RCS_SERVICE_SID no .env.");
    }
  }

  if (command === "list") {
    const list = rcs.list(20);
    console.log(`\nÚltimos broadcasts (${list.length}):`);
    for (const b of list) {
      console.log(`  [${b.sentAt.slice(0, 10)}] ${b.label} · ${b.recipients} nº · modo ${b.mode} · entregues=${b.results.sent} falhados=${b.results.failed}`);
    }
  }
}

main().catch((e) => {
  console.error("[RCS] Erro:", e.message || e);
  process.exit(1);
});
