import "dotenv/config";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// TVS — REGISTO DE EXPANSÃO DE MERCADO (30+ apps)
// Conhecimento para os agentes/squads AIOX e para Pedro Costa e Trinnity Hurtado.
// Lê data/knowledge/expansion-apps.json e gera:
//   data/Viseron_Registo_Expansao.pdf   (trilingue: ES · PT · EN)
// Uso: npm run expansion:pdf

const LANGS = [
  { code: "ES", title: "REGISTRO DE EXPANSIÓN — APPS DEL MERCADO", subtitle: "Conexión Composio · 19 iniciadas · 1 activa · 11 por confirmar" },
  { code: "PT", title: "REGISTO DE EXPANSÃO — APPS DO MERCADO", subtitle: "Ligação Composio · 19 iniciadas · 1 ativa · 11 a confirmar" },
  { code: "EN", title: "MARKET EXPANSION REGISTRY — APPS", subtitle: "Composio connection · 19 initiated · 1 active · 11 to confirm" },
];

function main() {
  const src = path.resolve("data", "knowledge", "expansion-apps.json");
  const outFile = path.resolve("data", "Viseron_Registo_Expansao.pdf");
  if (!fs.existsSync(src)) {
    console.error(`✖ Falta ${src}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(src, "utf8"));
  const apps = data.apps as Array<{ slug: string; name: string; status: string; category: string; expertise: string }>;
  const timestamp = new Date().toLocaleString("pt-PT");

  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  doc.pipe(fs.createWriteStream(outFile));

  const W = doc.page.width;
  const PH = doc.page.height;
  const drawFooter = () => {
    doc.page.margins.bottom = 8;
    doc.fontSize(8).fillColor("#888888").text(`TVS v5.0 · Registo de Expansão · ${timestamp} · p.${doc.bufferedPageRange().count + 1}`, 50, PH - 28, { width: W - 100 });
    doc.page.margins.bottom = 50;
  };
  const heading = (t: string) => {
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(17).text(t, 50, doc.y);
    doc.fillColor("#22d3ee").rect(50, doc.y + 2, 28, 2).fill();
    doc.moveDown();
  };

  // Capa
  doc.fillColor("#0f172a").rect(0, 0, W, PH).fill();
  doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(11).text("TRINNITY VISERON SYSTEM · MERCADO MUNDIAL", W / 2, 140, { align: "center", width: W - 100 });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(26).text("EXPANSIÓN · EXPANSÃO · EXPANSION", W / 2, 180, { align: "center", width: W - 100 });
  doc.fillColor("#22c55e").font("Helvetica-Bold").fontSize(15).text(`${data.summary.initiated} iniciadas · ${data.summary.active} activas · ${data.summary.unresolved} a confirmar`, W / 2, 250, { align: "center", width: W - 100 });
  doc.fillColor("#94a3b8").font("Helvetica").fontSize(11).text("Cada app ligada dá autonomia real ao JARVIS e conhecimento de 100 años a los agentes.", W / 2, 300, { align: "center", width: W - 100 });
  doc.fillColor("#22d3ee").fontSize(10).text("Pedro Costa — Comandante  |  Trinnity Hurtado — Rainha", W / 2, 360, { align: "center", width: W - 100 });
  doc.addPage();
  drawFooter();

  heading("Resumen · Resumo · Summary");
  doc.fillColor("#334155").font("Helvetica").fontSize(10).text(data.note, 50, doc.y, { width: W - 100 });
  doc.moveDown(1);

  // Lista de apps por estado
  for (const lang of LANGS) {
    heading(`${lang.title}`);
    doc.fillColor("#64748b").font("Helvetica").fontSize(9).text(lang.subtitle, 50, doc.y);
    doc.moveDown(0.3);

    const statusColor = (s: string) => (s === "active" ? "#16a34a" : s === "initiated" ? "#ca8a04" : "#64748b");
    const statusLabel = (s: string) => (s === "active" ? "ACTIVE" : s === "initiated" ? "INICIADA" : "PENDIENTE");

    for (const app of apps) {
      if (doc.y > PH - 80) { doc.addPage(); drawFooter(); }
      const y = doc.y;
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text(app.name, 50, y, { width: 130 });
      doc.fillColor(statusColor(app.status)).font("Helvetica-Bold").text(statusLabel(app.status), 195, y, { width: 80 });
      doc.fillColor("#22d3ee").font("Helvetica").fontSize(8).text(app.category, 280, y, { width: 210 });
      doc.moveDown(0.5);
      doc.fillColor("#334155").font("Helvetica").fontSize(8).text(app.expertise, 50, doc.y, { width: W - 100 });
      doc.moveDown(0.4);
      doc.strokeColor("#e2e8f0").moveTo(50, doc.y).lineTo(W - 50, doc.y).stroke();
      doc.moveDown(0.3);
    }
    doc.moveDown(1);
  }

  drawFooter();
  doc.end();
  console.log(`✔ Viseron_Registo_Expansao.pdf gerado (${apps.length} apps) + conhecimento em ${src}`);
}

main();
