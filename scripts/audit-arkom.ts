import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
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
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const outFile = path.join(DATA_DIR, "Viseron_Audit_ARKOM.pdf");
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  doc.pipe(fs.createWriteStream(outFile));

  const W = doc.page.width;
  const PH = doc.page.height;
  const drawFooter = () => {
    doc.page.margins.bottom = 8;
    doc.fontSize(8).fillColor("#888888").text(`TVS v5.0 · Auditoria ARKOM/AIOX · ${new Date(report.timestamp).toLocaleString("pt-PT")}`, 50, PH - 28, { width: W - 100 });
    doc.page.margins.bottom = 50;
  };

  doc.fillColor("#0f172a").rect(0, 0, W, PH).fill();
  doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(11).text("TRINNITY VISERON SYSTEM · ARKOM / AIOX", W / 2, 170, { align: "center", width: W - 100 });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(32).text("AUDITORIA OPERACIONAL", W / 2, 210, { align: "center", width: W - 100 });
  doc.fillColor(report.verdict === "GO" ? "#00ff87" : "#ff2d55").font("Helvetica-Bold").fontSize(20).text(report.verdict, W / 2, 280, { align: "center", width: W - 100 });
  doc.fillColor("#94a3b8").font("Helvetica").fontSize(12).text(`Squads AIOX-1..5 + ARKOM · ${new Date(report.timestamp).toLocaleString("pt-PT")}`, W / 2, 330, { align: "center", width: W - 100 });
  doc.addPage();
  drawFooter();

  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text("1. Verdicto e resumo", 50, 60);
  doc.fillColor("#1e293b").font("Helvetica").fontSize(11);
  doc.text(`Verdicto: ${report.verdict}${report.verdict === "GO" ? " — pode avançar para deploy" : " — bloqueado: resolver blockers primeiro"}`);
  doc.text(`Achados: ${report.counts.findings} total · ${report.counts.high} high · ${report.counts.medium} medium · ${report.counts.low} low · ${report.counts.info} info`);
  doc.text(`Blocker: ${report.blockers}`);
  doc.moveDown(0.6);
  for (const s of report.summary) {
    doc.fillColor("#475569").font("Helvetica").fontSize(9.5).text(s);
  }
  doc.moveDown(1);

  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text("2. Achados da auditoria", 50, doc.y);
  doc.moveDown(0.3);
  for (const f of report.findings) {
    if (doc.y > PH - 100) { doc.addPage(); drawFooter(); }
    const color = f.severity === "blocker" ? "#ef4444" : f.severity === "high" ? "#f97316" : f.severity === "medium" ? "#eab308" : f.severity === "low" ? "#94a3b8" : "#22d3ee";
    doc.fillColor(color).font("Helvetica-Bold").fontSize(9).text(`[${f.severity.toUpperCase()}]`, 50, doc.y);
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text(` ${f.title}  (${f.squad})`, 100, doc.y);
    doc.fillColor("#64748b").font("Helvetica").fontSize(9.5).text(f.detail, 60, doc.y, { width: W - 120 });
    if (f.fix !== "—") {
      doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(9).text("Fix: ", 60, doc.y);
      doc.fillColor("#1e293b").font("Helvetica").fontSize(9).text(f.fix, 90, doc.y, { width: W - 150 });
    }
    doc.moveDown(0.5);
  }

  doc.moveDown(0.5);
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text("3. Ações executadas", 50, doc.y);
  for (const a of report.actions) {
    if (doc.y > PH - 60) { doc.addPage(); drawFooter(); }
    doc.fillColor(a.ok ? "#22c55e" : "#ef4444").font("Helvetica-Bold").fontSize(9.5).text(`${a.ok ? "✓" : "✗"} ${a.tool} — ${a.detail}`);
  }

  doc.end();
  console.log(`\n✅ Auditoria ARKOM gerada: ${outFile}`);
}

main().catch((e) => {
  console.error("Falha na auditoria ARKOM:", e.message);
  process.exit(1);
});
