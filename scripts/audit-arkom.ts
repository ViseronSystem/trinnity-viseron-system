import path from "path";
import { createTheme } from "./pdf-theme";
import { ArkomEngine } from "../src/web/arkom/engine";

// TVS — AUDITORIA OPERACIONAL ARKOM / AIOX
// Corre os squads AIOX-1..5 + ARKOM (Observer/Guardian/Executor) e gera:
//   data/Viseron_Audit_ARKOM.pdf
// Uso: npm run audit:arkom

const DATA_DIR = path.resolve("data");

async function main() {
  console.log("\n==========================================");
  console.log("  ARKOM / AIOX — AUDITORIA OPERACIONAL");
  console.log("==========================================");

  const engine = new ArkomEngine(DATA_DIR);
  const report = await engine.run();

  console.log(`\nVerdicto: ${report.verdict === "GO" ? "GO ✓ (pode avançar)" : "NO-GO ✗"}  ·  blockers=${report.blockers}  ·  high=${report.counts.high}`);
  console.log(`Achados: ${report.counts.findings} (high=${report.counts.high}, medium=${report.counts.medium}, low=${report.counts.low}, info=${report.counts.info})`);

  for (const f of report.findings) {
    console.log(`\n[${f.severity.toUpperCase()}] (${f.squad}) ${f.title}`);
    console.log(`   ${f.detail.slice(0, 120)}`);
    if (f.fix !== "—") console.log(`   Fix: ${f.fix}`);
  }
  console.log("\n--- Ações executadas ---");
  for (const a of report.actions) console.log(`   ${a.ok ? "✓" : "✗"} ${a.tool}: ${a.detail}`);

  // ── PDF ────────────────────────────────────────────────────
  const outFile = path.join(DATA_DIR, "Viseron_Audit_ARKOM.pdf");
  const timestamp = new Date(report.timestamp).toLocaleString("pt-PT");

  const t = createTheme({
    title: "Trinnity Viseron System — Auditoria ARKOM / AIOX",
    subject: `Squads AIOX-1..5 + ARKOM · ${timestamp}`,
  });

  t.cover({
    title: "AUDITORIA OPERACIONAL",
    subtitle: `${report.verdict} · Squads AIOX-1..5 + ARKOM · ${timestamp}`,
    badges: [`${report.counts.findings} achados`, `${report.counts.high} high · ${report.counts.medium} medium`, "ARKOM Observer/Guardian/Executor"],
    date: timestamp,
    version: "5.0",
    url: "www.trinnityviseronsystem.io",
  });

  // 1. Verdicto e resumo
  t.section("1", "Verdicto e resumo");
  t.kv("Verdicto:", `${report.verdict}${report.verdict === "GO" ? " — pode avançar para deploy" : " — bloqueado: resolver blockers primeiro"}`);
  t.kv("Achados:", `${report.counts.findings} total · ${report.counts.high} high · ${report.counts.medium} medium · ${report.counts.low} low · ${report.counts.info} info`);
  t.kv("Blocker:", String(report.blockers));
  for (const s of report.summary) {
    t.bullet("▸", s);
  }

  // 2. Achados da auditoria
  t.section("2", "Achados da auditoria");
  for (const f of report.findings) {
    const color = f.severity === "blocker" ? "#ef4444" : f.severity === "high" ? "#f97316" : f.severity === "medium" ? "#eab308" : f.severity === "low" ? "#64748b" : "#22d3ee";
    t.bullet(`[${f.severity.toUpperCase()}]`, `${f.title}  (${f.squad})`, color);
    t.para(f.detail, 9.5, "#64748b");
    if (f.fix !== "—") {
      t.kv("Fix:", f.fix);
    }
  }

  // 3. Ações executadas
  t.section("3", "Ações executadas");
  for (const a of report.actions) {
    t.bullet(a.ok ? "✓" : "✗", `${a.tool} — ${a.detail}`, a.ok ? "#22c55e" : "#ef4444");
  }

  t.finish(outFile);
  console.log(`\n✅ Auditoria ARKOM gerada: ${outFile}`);
}

main().catch((e) => {
  console.error("Falha na auditoria ARKOM:", e.message);
  process.exit(1);
});
