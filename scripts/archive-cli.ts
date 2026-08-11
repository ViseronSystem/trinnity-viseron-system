import { ViseronCore } from "../src/core/ViseronCore";

(async () => {
  const cmd = process.argv[2];
  const core = new ViseronCore();
  await core.initialize();

  const platform = (core as any).platform || (core as any).omega;
  if (!platform?.archive) {
    console.error("KnowledgeArchive não disponível (OmegaPlatform não inicializado)");
    process.exit(1);
  }

  const archive = platform.archive;

  if (cmd === "status") {
    const s = archive.status();
    console.log("VISERON Knowledge Archive Status");
    console.log("=".repeat(40));
    console.log(`Versão:     ${s.version}`);
    console.log(`Criado:     ${s.createdAt}`);
    console.log(`Milestone:  ${s.lastMilestone || "—"}`);
    console.log(`Health:     ${s.health}`);
    console.log("");
    console.log(`Execuções:  ${s.counts.executions}`);
    console.log(`Falhas:     ${s.counts.failures}`);
    console.log(`Decisões:   ${s.counts.decisions}`);
    console.log(`Snapshots:  ${s.counts.snapshots}`);
  } else if (cmd === "timeline") {
    const tl = archive.timeline();
    console.log("VISERON Timeline");
    console.log("=".repeat(40));
    for (const e of tl.slice(0, 20)) {
      const icon = e.type === "milestone" ? "★" : e.type === "failure" ? "✗" : e.type === "snapshot" ? "◎" : "○";
      console.log(`${icon} ${e.date.slice(0, 10)}  [${e.type}] ${e.summary || e.event}`);
    }
    if (tl.length > 20) console.log(`... +${tl.length - 20} registos`);
  } else if (cmd === "snapshot") {
    const reason = process.argv.slice(3).join(" ") || "snapshot via CLI";
    archive.snapshot(reason);
    console.log(`Snapshot criado: "${reason}"`);
  } else {
    console.log("Comandos: archive:status | archive:timeline | archive:snapshot <razão>");
  }

  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
