import path from "path";
import { ProspectionStore, ProspectionEngine } from "../src/core/prospection";
import { createEmailService } from "../src/web/email/service";

// TVS — PROSPECTION OS · CLI
// npm run prospeccao:status · npm run prospeccao:demo · npm run prospeccao:campanha -- <id> personalize|send|leads

const DATA_DIR = path.resolve(__dirname, "..", "data");

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "status";
  const store = new ProspectionStore(DATA_DIR);
  const email = createEmailService(DATA_DIR);
  const engine = new ProspectionEngine(store, email);

  if (cmd === "status") {
    const s = store.stats();
    console.log("=".repeat(58));
    console.log("PROSPECTION OS — ESTADO");
    console.log("=".repeat(58));
    console.log(`Campanhas:    ${s.campaigns}`);
    console.log(`Leads:        ${s.leads}  (fila: ${s.queued} · enviados: ${s.sent} · respostas: ${s.responded} · interessados: ${s.interested})`);
    console.log(`Enviados hoje: ${s.sentToday}  (restam ${s.remainingToday} do limite diário)`);
    console.log(`Warm-up:      ${s.warmupActive ? "ATIVO (" + s.warmupDaysLeft + " dias)" : "concluído/não configurado"}`);
    console.log(`Supressões:   ${store.suppressionList().length}  (LGPD: nunca voltar a contactar)`);
    console.log(`Provider:     ${email.transport.provider} (${email.transport.enabled ? "ativo" : "inativo"})`);
    for (const c of store.listCampaigns()) {
      console.log(`\n— ${c.name} (${c.id}) · ${c.status} · cap ${c.dailyCap}/dia`);
      const by = store.leadsByStatus(c.id);
      console.log(`  new:${by.new} queued:${by.queued} sent:${by.sent} responded:${by.responded} interested:${by.interested} bounce:${by.bounced}`);
    }
    return;
  }

  if (cmd === "demo") {
    console.log("=".repeat(58));
    console.log("PROSPECTION OS — DEMO REAL (pipeline completo)");
    console.log("=".repeat(58));
    const campaign = store.createCampaign({
      name: "Demo Clínicas 2026",
      niche: "saude",
      target: "clinicas odontologicas",
      dailyCap: 20,
      warmupDays: 0,
      sender: "TVS Outbound",
      signature: "Equipa TVS",
      status: "draft",
    });
    console.log(`\n[1] Campanha criada: ${campaign.name} (${campaign.id})`);
    const result = store.importLeads(campaign.id, [
      { name: "Dra. Ana Silva", clinic: "Clínica Sorriso Vivo", city: "Belo Horizonte", email: "ana.silva@example.com" },
      { name: "Dr. Carlos Mendes", clinic: "Instituto Dental MG", city: "Uberlândia", email: "carlos.mendes@example.com" },
      { name: "Enf. Maria Costa", clinic: "Clínica Vida Nova", city: "Juiz de Fora", email: "maria.costa@example.com" },
      { name: "Dr. João Pereira", clinic: "Odonto Center", city: "Contagem", email: "invalid-email" },
      { name: "Dra. Sofia Rodrigues", clinic: "Clínica Prime", city: "Montes Claros", email: "sofia.rodrigues@example.com" },
    ]);
    console.log(`[2] Leads importados: +${result.added} (inválidos: ${result.skipped} · duplicados: ${result.dupes})`);
    const pers = await engine.personalizeCampaign(campaign.id);
    console.log(`[3] Personalização por IA: ${pers.done} ok / ${pers.failed} falhas`);
    const sample = store.listLeads(campaign.id, "queued")[0];
    if (sample?.message) console.log(`\n    EXEMPLO (${sample.clinic}):\n    ${sample.message.split("\n").join("\n    ").slice(0, 300)}...`);
    const send = await engine.sendBatch(campaign.id);
    console.log(`[4] Envio (provider ${email.transport.provider}): ${send.sent} enviados · ${send.skipped} saltados${send.warmup ? " · WARM-UP ATIVO" : ""}`);
    console.log(`[5] Resposta simulada (interessado):`);
    const lead = store.listLeads(campaign.id, "sent")[0] || store.listLeads(campaign.id)[0];
    if (lead) {
      const resp = await engine.captureResponse(lead.id, "Olá! Quanto custa e como funciona? Podemos agendar uma chamada?", "email");
      console.log(`    ${resp?.email} → intenção: ${resp?.intent} (status: ${resp?.status})`);
      console.log(`[6] Alerta ao gestor: registado no audit (integração WhatsApp/Slack quando ligada)`);
    }
    console.log(`\nEstado final: ${JSON.stringify(store.stats(campaign.id))}`);
    console.log("\nAudit (últimos eventos):");
    for (const a of store.auditLog().slice(-8)) console.log(`  ${a.at?.slice(11, 19)} ${a.event}${a.email ? " · " + a.email : ""}${a.campaignId ? " · " + a.campaignId : ""}`);
    return;
  }

  if (cmd === "campanha") {
    const id = args[1];
    const action = args[2] || "status";
    const campaign = store.getCampaign(id || "");
    if (!campaign) { console.error("Campanha não encontrada. Correr primeiro: npm run prospeccao:demo"); process.exit(1); }
    if (action === "personalize") {
      const r = await engine.personalizeCampaign(campaign.id);
      console.log(`Personalização: ${r.done} ok · ${r.failed} falhas`);
    } else if (action === "send") {
      const r = await engine.sendBatch(campaign.id);
      console.log(`Envio: ${r.sent} enviados · ${r.skipped} saltados${r.warmup ? " · WARM-UP ATIVO: " + r.reason : ""}`);
    } else if (action === "leads") {
      for (const l of store.listLeads(campaign.id)) console.log(`  ${l.status.padEnd(14)} ${l.email} · ${l.clinic}${l.intent ? " · intenção " + l.intent : ""}`);
    } else {
      console.log(JSON.stringify(store.stats(campaign.id), null, 2));
    }
    return;
  }

  console.log("Uso: npm run prospeccao:status | npm run prospeccao:demo | npm run prospeccao:campanha -- <id> personalize|send|leads");
}

main().catch((e) => { console.error(e); process.exit(1); });