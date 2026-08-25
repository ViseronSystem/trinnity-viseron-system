import "dotenv/config";
import fs from "fs";
import path from "path";
import { createTheme } from "./pdf-theme";

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

  const t = createTheme({ title: "Registo de Expansão de Mercado", subject: "TVS — 30+ apps do mercado (trilingue ES · PT · EN)" });

  LANGS.forEach((lang, i) => {
    if (i > 0) t.doc.addPage();
    t.cover({
      title: lang.title,
      subtitle: lang.subtitle,
      badges: [lang.code, "Composio", `${data.summary.initiated} iniciadas`, `${data.summary.active} activas`, "Trilingue"],
      date: timestamp,
      version: "5.0",
    });

    t.section("1", "Resumen · Resumo · Summary");
    t.para(data.note, 10, "#334155");

    t.section("2", lang.title);
    t.para(lang.subtitle, 9.5, "#64748b");

    const statusColor = (s: string) => (s === "active" ? "#16a34a" : s === "initiated" ? "#ca8a04" : "#64748b");
    const statusLabel = (s: string) => (s === "active" ? "ACTIVE" : s === "initiated" ? "INICIADA" : "PENDIENTE");

    for (const app of apps) {
      t.bullet("▸", `${app.name} — ${statusLabel(app.status)} — ${app.category}`, statusColor(app.status));
      t.para(app.expertise, 9, "#334155");
    }
  });

  t.finish(outFile);
  console.log(`✔ Viseron_Registo_Expansao.pdf gerado (${apps.length} apps) + conhecimento em ${src}`);
}

main();
