import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// TVS — GERADOR DE RELATÓRIO DE UPDATE
// Roda a cada atualização: produz data/Viseron_Update_Report_<data>.pdf

interface Commit {
  hash: string;
  date: string;
  message: string;
}

function exec(cmd: string): string {
  const { execSync } = require("child_process");
  try {
    return execSync(cmd, { encoding: "utf8", cwd: process.cwd(), stdio: ["pipe", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

function getCommits(since: string | null, n = 15): Commit[] {
  const range = since ? `${since}..HEAD` : `HEAD`;
  const raw = exec(`git log ${range} --format=%h%x09%ad%x09%s --date=short -n ${n}`);
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, date, ...rest] = line.split("\t");
      return { hash, date, message: rest.join("\t") };
    });
}

function run(name: string, fn: () => string): { name: string; ok: boolean; out: string } {
  try {
    const out = fn();
    return { name, ok: out !== "" && !out.toLowerCase().includes("fail"), out };
  } catch (e: any) {
    return { name, ok: false, out: String(e?.message || "erro") };
  }
}

async function main() {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  const outFile = path.resolve("data", `Viseron_Update_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  if (!fs.existsSync(path.dirname(outFile))) fs.mkdirSync(path.dirname(outFile), { recursive: true });
  doc.pipe(fs.createWriteStream(outFile));

  const W = doc.page.width;
  const PH = doc.page.height;
  const drawFooter = () => {
    doc.page.margins.bottom = 8;
    doc.fontSize(8).fillColor("#888888").text(`TVS v5.0 · Trinnity Viseron System · ${new Date().toISOString().slice(0, 10)}`, 50, PH - 28, { width: W - 100 });
    doc.page.margins.bottom = 50;
  };

  // Capa
  doc.fillColor("#0f172a").rect(0, 0, W, PH).fill();
  doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(11).text("TRINNITY VISERON SYSTEM · RELATÓRIO DE UPDATE", W / 2, 180, { align: "center", width: W - 100 });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(34).text("UPDATE AUTOMÁTICO", W / 2, 220, { align: "center", width: W - 100 });
  doc.fillColor("#94a3b8").font("Helvetica").fontSize(14).text(new Date().toLocaleString("pt-PT"), W / 2, 290, { align: "center", width: W - 100 });
  doc.fillColor("#22d3ee").fontSize(12).text("www.trinnityviseronsystem.io", W / 2, 330, { align: "center", width: W - 100 });
  doc.addPage();
  drawFooter();

  // Seção 1: Versão e estado
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text("1. Versão e estado", 50, 60);
  const version = exec("node -p \"require('./package.json').version\"") || "5.0.0";
  const lastTag = exec("git describe --tags --abbrev=0") || "sem-tags";
  doc.fillColor("#1e293b").font("Helvetica").fontSize(11);
  doc.text(`Versão: ${version}`);
  doc.text(`Última tag: ${lastTag}`);
  doc.text(`Branch: ${exec("git branch --show-current") || "main"}`);
  doc.text(`Data do build: ${new Date().toISOString()}`);
  doc.moveDown();

  // Seção 2: Testes
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text("2. Estado dos testes", 50, doc.y);
  const tCore = run("core", () => exec("npx tsx tests/core.test.ts 2>&1"));
  const tWeb = run("web", () => exec("npx tsx tests/web.test.ts 2>&1"));
  const coreLine = tCore.out.split("\n").find((l) => l.includes("PASADAS")) || "n/a";
  const webLine = tWeb.out.split("\n").find((l) => l.includes("PASSED")) || "n/a";
  doc.fillColor("#1e293b").font("Helvetica").fontSize(11);
  doc.text(`Core: ${tCore.ok ? "PASS" : "FALHOU"} — ${coreLine.trim()}`);
  doc.text(`Web:  ${tWeb.ok ? "PASS" : "FALHOU"} — ${webLine.trim()}`);
  doc.moveDown();

  // Seção 3: Commits recentes
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text("3. Commits deste ciclo", 50, doc.y);
  const commits = getCommits(null);
  doc.fillColor("#1e293b").font("Helvetica").fontSize(10);
  for (const c of commits) {
    if (doc.y > PH - 90) { doc.addPage(); drawFooter(); }
    doc.text(`${c.date}  ${c.hash}  ${c.message}`);
  }
  doc.moveDown();

  // Seção 4: Ficheiros alterados
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text("4. Ficheiros alterados", 50, doc.y);
  const changed = exec("git diff --stat HEAD~1 2>&1").split("\n").filter(Boolean).slice(0, 25);
  doc.fillColor("#1e293b").font("Helvetica").fontSize(10);
  for (const line of changed) doc.text(line.length > 110 ? line.slice(0, 110) + "…" : line);

  doc.end();
  console.log(`✅ Relatório de update gerado: ${outFile}`);
}

main().catch((e) => {
  console.error("Falha ao gerar relatório:", e.message);
  process.exit(1);
});
