#!/usr/bin/env node
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

async function run() {
  const leads = [];
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(__dirname, "..", "leads", "45k telecomunicaciones.xlsx"));

  for (const sheet of wb.worksheets) {
    const headers = [];
    sheet.eachRow((row, n) => {
      if (n === 1) {
        row.eachCell((c, col) => { headers[col] = String(c.value || "").trim(); });
        return;
      }
      const r = {};
      row.eachCell((c, col) => { if (headers[col]) r[headers[col]] = String(c.value || "").trim(); });

      const phones = [];
      for (const [k, v] of Object.entries(r)) {
        if (typeof v === "string" && /^[6-9]\d{8,}/.test(v.replace(/\s/g, ""))) {
          let p = v.replace(/[^0-9]/g, "");
          if (p.length === 9) p = "34" + p;
          if (p.length >= 10) phones.push(p);
        }
      }
      const up = [...new Set(phones)];
      if (up.length === 0) return;

      const name = ((r.CT_C_NOMBRE || r.NOMBRE || "") + " " + (r.CT_C_APELLIDOS || r.APELLIDOS || "")).trim();
      const seg = (r.CT_C_METAL || r.segmento || "").toLowerCase();
      let segment = "general";
      if (seg.includes("platino")) segment = "platino";
      else if (seg.includes("gold")) segment = "gold";
      else if (seg.includes("silver")) segment = "silver";
      else if (seg.includes("bronze")) segment = "bronze";
      else if (seg.includes("cantera")) segment = "cantera";

      leads.push({
        source: "telecom",
        name: name || "Sin nombre",
        phones: up,
        operator: r.CT_C_OPERADOR || r.OPERADOR || undefined,
        segment,
        province: r.CT_C_PROVINCIA || r.PROVINCIA || undefined,
        tariff: r.CT_TARIFA_ACTUAL || r.tarifa || undefined,
        language: "es",
        tags: ["telecom"],
      });
    });
  }

  const seen = new Set();
  const unique = leads.filter(l => {
    const k = l.phones[0];
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const stats = {
    total: unique.length,
    byChannel: { rcs: unique.length, sms: unique.length, whatsapp: unique.length, email: 0 },
    byOperator: {},
    bySegment: {},
    byProvince: {},
  };
  for (const l of unique) {
    if (l.operator) stats.byOperator[l.operator] = (stats.byOperator[l.operator] || 0) + 1;
    stats.bySegment[l.segment] = (stats.bySegment[l.segment] || 0) + 1;
    if (l.province) stats.byProvince[l.province] = (stats.byProvince[l.province] || 0) + 1;
  }

  const outDir = path.join(__dirname, "..", "data", "campaigns");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "leads.json"), JSON.stringify({
    leads: unique, stats, importedAt: new Date().toISOString(), version: 2,
  }, null, 2));

  console.log("Imported:", unique.length, "leads");
  console.log("Operators:", JSON.stringify(stats.byOperator));
  console.log("Segments:", JSON.stringify(stats.bySegment));
  console.log("Top provinces:", JSON.stringify(Object.entries(stats.byProvince).sort((a, b) => b[1] - a[1]).slice(0, 10)));
}

run().catch(e => { console.error("Error:", e.message); process.exit(1); });
