#!/usr/bin/env node
/**
 * Import leads from Excel — handles actual column names from both files
 * Priority: 45k file first (smaller, has real data), 450K in chunks if possible
 */
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const LEADS_DIR = path.join(__dirname, "..", "leads");
const OUTPUT_DIR = path.join(__dirname, "..", "data", "campaigns");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "leads.json");

function normalizePhone(phone) {
  if (!phone) return "";
  let p = String(phone).replace(/[^0-9]/g, "");
  if (p.startsWith("34") && p.length >= 11) return p;
  if (p.length === 9) return "34" + p;
  if (p.length >= 10) return p;
  return "";
}

function mapSegment(seg) {
  const s = (seg || "").toLowerCase();
  if (s.includes("platino")) return "platino";
  if (s.includes("gold")) return "gold";
  if (s.includes("silver")) return "silver";
  if (s.includes("bronze")) return "bronze";
  if (s.includes("cantera")) return "cantera";
  return "general";
}

async function import45k() {
  const leads = [];
  const file = path.join(LEADS_DIR, "45k telecomunicaciones.xlsx");
  if (!fs.existsSync(file)) { console.log("45k file not found"); return leads; }

  console.log("Importing 45k telecomunicaciones.xlsx...");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);

  for (const sheet of wb.worksheets) {
    const rows = [];
    const headers = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = String(cell.value || "").trim();
        });
        return;
      }
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        rowData[headers[colNumber]] = String(cell.value || "").trim();
      });
      rows.push(rowData);
    });

    for (const row of rows) {
      // Handle different column naming across sheets
      const phones = [];
      const phoneFields = ["CT_C_PHONE1", "CT_C_PHONE2", "CT_C_PHONE3", "phone", "movil", "telefono", "CONTACTO",
        // Sheet8-style positional: col3, col4, col5 are phones
        "3", "4", "5"
      ];

      // Also check by value pattern (9+ digits)
      for (const [key, val] of Object.entries(row)) {
        if (typeof val === "string" && /^[6-9]\d{8,}/.test(val.replace(/\s/g, ""))) {
          phones.push(normalizePhone(val));
        }
      }

      const validPhones = [...new Set(phones.filter(p => p && p.length >= 10))];
      if (validPhones.length === 0) continue;

      // Name: try various columns
      const name = row.CT_C_NOMBRE || row.NOMBRE || row.name || row.nombre || "";
      const lastName = row.CT_C_APELLIDOS || row.APELLIDOS || row.apellidos || "";
      const fullName = [name, lastName].filter(Boolean).join(" ") || "Sin nombre";

      // Operator
      const operator = row.CT_C_OPERADOR || row.OPERADOR || row.operador || row.operator || "";

      // Segment
      const segment = row.CT_C_METAL || row.segmento || row.segment || "";

      // Province
      const province = row.CT_C_PROVINCIA || row.PROVINCIA || row.provincia || "";

      // Tariff
      const tariff = row.CT_TARIFA_ACTUAL || row.tarifa || "";

      // Email
      const email = row.CORREO || row.email || row.correo || "";

      // DNI
      const dni = row.CT_C_DNI || row.DNI || row.dni || "";

      leads.push({
        source: "telecom",
        name: fullName,
        dni: dni || undefined,
        phones: validPhones,
        email: email || undefined,
        operator: operator || undefined,
        segment: mapSegment(segment),
        province: province || undefined,
        tariff: tariff || undefined,
        language: "es",
        tags: ["telecom", operator, segment].filter(Boolean),
      });
    }
  }

  console.log(`  45k: ${leads.length} leads imported`);
  return leads;
}

async function import450k() {
  const leads = [];
  const file = path.join(LEADS_DIR, "Lead 450K para publicidad Viseron.xlsx");
  if (!fs.existsSync(file)) { console.log("450K file not found"); return leads; }

  console.log("Importing Lead 450K para publicidad Viseron.xlsx (chunked)...");

  // Process in streaming mode - read one row at a time
  const wb = new ExcelJS.Workbook();
  const stream = fs.createReadStream(file);
  
  // Use a counter to track progress
  let rowCount = 0;
  let imported = 0;
  
  try {
    await wb.xlsx.read(stream);
    
    // Try to find a sheet with phone data
    for (const sheet of wb.worksheets) {
      if (sheet.rowCount < 100) continue;
      console.log(`  Trying sheet: ${sheet.name} (${sheet.rowCount} rows)`);
      
      const headers = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || "").trim();
          });
          console.log(`    Headers: ${headers.filter(Boolean).join(", ")}`);
          return;
        }
        
        rowCount++;
        if (rowCount % 10000 === 0) console.log(`    ...${rowCount} rows processed`);
        
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          if (headers[colNumber]) {
            rowData[headers[colNumber]] = String(cell.value || "").trim();
          }
        });
        
        // Find phone numbers - check all columns for 9+ digit numbers
        const phones = [];
        for (const [key, val] of Object.entries(rowData)) {
          if (typeof val === "string" && /^[6-9]\d{8,}/.test(val.replace(/\s/g, ""))) {
            phones.push(normalizePhone(val));
          }
        }
        
        const validPhones = [...new Set(phones.filter(p => p && p.length >= 10))];
        if (validPhones.length === 0) return;
        
        const name = rowData.name || rowData.nombre || rowData.apellidos || "";
        const dni = rowData.dni || rowData.nif || "";
        const bank = rowData.banco || rowData.bank || "";
        
        leads.push({
          source: "banking",
          name: name || "Sin nombre",
          dni: dni || undefined,
          phones: validPhones,
          bank: bank || undefined,
          language: "es",
          tags: ["banking", bank].filter(Boolean),
        });
        imported++;
      });
    }
  } catch (err) {
    console.log(`  450K: Error during import: ${err.message}`);
  }

  console.log(`  450K: ${imported} leads imported from ${rowCount} rows`);
  return leads;
}

async function main() {
  const allLeads = [];
  
  // Import 45k first
  const telecomLeads = await import45k();
  allLeads.push(...telecomLeads);

  // Import 450k if possible
  const bankLeads = await import450k();
  allLeads.push(...bankLeads);

  // Deduplicate by phone
  const seen = new Set();
  const unique = allLeads.filter(l => {
    const key = l.phones[0];
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Stats
  const stats = {
    total: unique.length,
    telecom: unique.filter(l => l.source === "telecom").length,
    banking: unique.filter(l => l.source === "banking").length,
    byOperator: {},
    byBank: {},
    byProvince: {},
    bySegment: {},
    byChannel: { rcs: 0, sms: 0, whatsapp: 0, email: 0 },
  };

  for (const lead of unique) {
    if (lead.operator) stats.byOperator[lead.operator] = (stats.byOperator[lead.operator] || 0) + 1;
    if (lead.bank) stats.byBank[lead.bank] = (stats.byBank[lead.bank] || 0) + 1;
    if (lead.province) stats.byProvince[lead.province] = (stats.byProvince[lead.province] || 0) + 1;
    if (lead.segment) stats.bySegment[lead.segment] = (stats.bySegment[lead.segment] || 0) + 1;
    if (lead.phones.length > 0) { stats.byChannel.rcs++; stats.byChannel.sms++; stats.byChannel.whatsapp++; }
    if (lead.email) stats.byChannel.email++;
  }

  // Save
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    leads: unique,
    stats,
    importedAt: new Date().toISOString(),
    version: 2,
  }, null, 2));

  console.log("\n=== IMPORT COMPLETE ===");
  console.log(`Total unique leads: ${stats.total}`);
  console.log(`  Telecom: ${stats.telecom}`);
  console.log(`  Banking: ${stats.banking}`);
  console.log(`  RCS/SMS/WhatsApp ready: ${stats.byChannel.rcs}`);
  console.log(`  Email ready: ${stats.byChannel.email}`);
  console.log(`  By Operator:`, JSON.stringify(stats.byOperator));
  console.log(`  By Segment:`, JSON.stringify(stats.bySegment));
  console.log(`  By Province (top 10):`, JSON.stringify(Object.entries(stats.byProvince).sort((a,b) => b[1] - a[1]).slice(0, 10)));
  console.log(`Output: ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch(err => {
  console.error("Import failed:", err.message);
  process.exit(1);
});
