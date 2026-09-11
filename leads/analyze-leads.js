const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const FILES = [
  { path: '45k telecomunicaciones.xlsx', label: '45K TELECOM' },
  { path: 'Lead 450K para publicidad Viseron.xlsx', label: '450K LEADS' }
];

const BASE = __dirname;

const KEY_FIELDS = {
  email: ['email', 'correo', 'e-mail', 'mail', 'email_address', 'correo_electronico', 'emailpersonal', 'emailempresa'],
  phone: ['phone', 'telefono', 'tel', 'movil', 'celular', 'telefono1', 'telefono2', 'phone_number', 'telf', 'móvil'],
  name: ['nombre', 'name', 'nombres', 'first_name', 'nombre_completo', 'apellidos', 'last_name', 'razon_social'],
  company: ['empresa', 'company', 'organizacion', 'organization', 'razon_social', 'compania', 'sociedad'],
  country: ['pais', 'country', 'provincia', 'province', 'region', 'ciudad', 'city', 'departamento'],
  language: ['idioma', 'language', 'lang', 'nivel', 'nivel_ingles'],
  source: ['fuente', 'source', 'origen', 'canal', 'medio'],
  segment: ['segmento', 'segment', 'nivel', 'categoria', 'type', 'tipo'],
  nif: ['dni', 'nif', 'cif', 'cedula', 'passport'],
  tariff: ['tarifa', 'plan', 'rate', 'precio']
};

function normalizeHeader(h) {
  return String(h || '').toLowerCase().trim().replace(/[\s\-_]+/g, '_');
}

function matchField(normalizedHeader, fieldAliases) {
  return fieldAliases.some(a => normalizedHeader.includes(a));
}

function detectFields(headers) {
  const detected = {};
  for (const [field, aliases] of Object.entries(KEY_FIELDS)) {
    const matches = headers.filter(h => matchField(h, aliases));
    if (matches.length > 0) detected[field] = matches;
  }
  return detected;
}

function sampleRows(ws, count) {
  const rows = [];
  let i = 0;
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum === 1) return; // skip header
    if (i >= count) return;
    const vals = {};
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const header = ws.getRow(1).getCell(colNum).text || `col_${colNum}`;
      vals[header] = String(cell.text || cell.value || '').substring(0, 100);
    });
    rows.push(vals);
    i++;
  });
  return rows;
}

function getNonEmptyCount(ws, colIndex) {
  let count = 0;
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum === 1) return;
    const val = row.getCell(colIndex).text || row.getCell(colIndex).value;
    if (val && String(val).trim()) count++;
  });
  return count;
}

async function analyzeFile(filePath) {
  const fullPath = path.join(BASE, filePath);
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FILE: ${filePath}`);
  console.log(`${'='.repeat(80)}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(fullPath);

  const sheets = [];
  workbook.eachSheet((ws, id) => {
    sheets.push({ id, name: ws.name, rows: ws.rowCount, cols: ws.columnCount });
  });

  console.log(`\nSHEETS FOUND: ${sheets.length}`);
  sheets.forEach(s => console.log(`  [${s.id}] "${s.name}" — ${s.rows} rows × ${s.cols} cols`));

  const allData = {
    sheets: [],
    totalRows: 0,
    fieldCounts: {},
    uniqueEmails: new Set(),
    uniquePhones: new Set(),
    uniqueNames: new Set()
  };

  for (const sheetInfo of sheets) {
    const ws = workbook.getWorksheet(sheetInfo.id);
    if (!ws) continue;

    console.log(`\n--- SHEET: "${sheetInfo.name}" ---`);

    // Extract headers
    const headers = [];
    const headerRow = ws.getRow(1);
    for (let c = 1; c <= (ws.columnCount || 100); c++) {
      const val = headerRow.getCell(c).text || headerRow.getCell(c).value || '';
      if (String(val).trim()) headers.push({ col: c, header: String(val).trim(), norm: normalizeHeader(val) });
    }

    console.log(`\n  COLUMNS (${headers.length}):`);
    headers.forEach((h, i) => console.log(`    [${h.col}] ${h.header}`));

    // Detect key fields
    const normHeaders = headers.map(h => h.norm);
    const detected = detectFields(normHeaders);
    console.log(`\n  DETECTED FIELDS:`);
    for (const [field, matches] of Object.entries(detected)) {
      const originals = matches.map(m => headers.find(h => h.norm === m)?.header || m);
      console.log(`    ${field.toUpperCase()}: ${originals.join(', ')}`);
    }

    // Sample rows
    const sample = sampleRows(ws, 3);
    console.log(`\n  SAMPLE (first 3 rows):`);
    sample.forEach((row, i) => {
      console.log(`    Row ${i + 1}: ${JSON.stringify(row).substring(0, 400)}`);
    });

    // Count non-empty for detected fields
    const fieldCounts = {};
    for (const [field, matches] of Object.entries(detected)) {
      let total = 0;
      for (const match of matches) {
        const header = headers.find(h => h.norm === match);
        if (header) total += getNonEmptyCount(ws, header.col);
      }
      fieldCounts[field] = total;
    }
    console.log(`\n  FIELD POPULATION:`);
    for (const [field, count] of Object.entries(fieldCounts)) {
      const pct = ((count / Math.max(sheetInfo.rows - 1, 1)) * 100).toFixed(1);
      console.log(`    ${field}: ${count} non-empty (${pct}%)`);
    }

    // Collect unique values
    for (const [field, matches] of Object.entries(detected)) {
      for (const match of matches) {
        const header = headers.find(h => h.norm === match);
        if (!header) continue;
        ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
          if (rowNum === 1) return;
          const val = String(row.getCell(header.col).text || row.getCell(header.col).value || '').trim().toLowerCase();
          if (!val) return;
          if (field === 'email' && val.includes('@')) allData.uniqueEmails.add(val);
          else if (field === 'phone' && val.replace(/[\s\-\+\(\)]/g, '').length >= 7) allData.uniquePhones.add(val);
          else if (field === 'name' && val.length > 1) allData.uniqueNames.add(val);
        });
      }
    }

    allData.sheets.push({ name: sheetInfo.name, rows: sheetInfo.rows, cols: headers.length, detected, fieldCounts });
    allData.totalRows += sheetInfo.rows - 1; // minus header
  }

  return allData;
}

function printSummary(results) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('COMPREHENSIVE ANALYSIS SUMMARY');
  console.log(`${'='.repeat(80)}`);

  let totalRows = 0;
  let allEmails = new Set();
  let allPhones = new Set();
  let allNames = new Set();
  let allSheets = [];

  for (const r of results) {
    totalRows += r.totalRows;
    for (const e of r.uniqueEmails) allEmails.add(e);
    for (const p of r.uniquePhones) allPhones.add(p);
    for (const n of r.uniqueNames) allNames.add(n);
    allSheets.push(...r.sheets);
  }

  console.log(`\nTOTAL ROWS ACROSS BOTH FILES: ${totalRows.toLocaleString()}`);
  console.log(`UNIQUE EMAILS: ${allEmails.size.toLocaleString()}`);
  console.log(`UNIQUE PHONES: ${allPhones.size.toLocaleString()}`);
  console.log(`UNIQUE NAMES: ${allNames.size.toLocaleString()}`);

  // Channel recommendations
  console.log(`\n${'='.repeat(80)}`);
  console.log('CHANNEL SUITABILITY ANALYSIS');
  console.log(`${'='.repeat(80)}`);

  const hasEmail = allEmails.size > 0;
  const hasPhone = allPhones.size > 0;

  console.log(`\n1. EMAIL CAMPAIGNS:`);
  console.log(`   Available: ${hasEmail ? 'YES' : 'NO'}`);
  if (hasEmail) console.log(`   Unique emails: ${allEmails.size.toLocaleString()}`);
  console.log(`   Fields needed: email, nombre (personalization)`);
  console.log(`   Recommended: Warm-up domain, SPF/DKIM/DMARC, double opt-in for EU leads`);

  console.log(`\n2. SMS/RCS CAMPAIGNS (Twilio):`);
  console.log(`   Available: ${hasPhone ? 'YES' : 'NO'}`);
  if (hasPhone) console.log(`   Unique phones: ${allPhones.size.toLocaleString()}`);
  console.log(`   Fields needed: phone (E.164 format), nombre`);
  console.log(`   Note: Need to validate E.164 format (+34..., +52..., +1...)`);

  console.log(`\n3. WHATSAPP OUTREACH:`);
  console.log(`   Available: ${hasPhone ? 'YES' : 'NO'}`);
  if (hasPhone) console.log(`   Potential WhatsApp contacts: ${allPhones.size.toLocaleString()}`);
  console.log(`   Fields needed: phone, nombre`);
  console.log(`   Note: WhatsApp Business API requires opt-in; bulk requires BSP`);

  console.log(`\n4. LINKEDIN OUTREACH:`);
  console.log(`   Fields needed: nombre, empresa, email (for connection requests)`);
  console.log(`   Note: LinkedIn scraping against ToS; better to use Sales Navigator + manual`);

  // Detailed sheet breakdown
  console.log(`\n${'='.repeat(80)}`);
  console.log('DETAILED SHEET BREAKDOWN');
  console.log(`${'='.repeat(80)}`);

  for (const sheet of allSheets) {
    console.log(`\n  Sheet: "${sheet.name}" (${sheet.rows} rows)`);
    console.log(`  Detected fields: ${Object.entries(sheet.detected).map(([k,v]) => `${k}(${v.length})`).join(', ')}`);
    for (const [field, count] of Object.entries(sheet.fieldCounts)) {
      const pct = ((count / Math.max(sheet.rows - 1, 1)) * 100).toFixed(1);
      console.log(`    ${field}: ${count} values (${pct}%)`);
    }
  }

  // Export sample data
  console.log(`\n${'='.repeat(80)}`);
  console.log('FIELD MAPPING FOR MONETIZATION');
  console.log(`${'='.repeat(80)}`);

  const fieldMap = {
    email: [],
    phone: [],
    name: [],
    company: [],
    country: [],
    language: [],
    segment: []
  };

  for (const sheet of allSheets) {
    for (const [field, headers] of Object.entries(sheet.detected)) {
      if (fieldMap[field]) {
        fieldMap[field].push(...headers.map(h => `"${sheet.name}" → ${h}`));
      }
    }
  }

  for (const [field, mappings] of Object.entries(fieldMap)) {
    if (mappings.length > 0) {
      console.log(`\n  ${field.toUpperCase()}:`);
      mappings.forEach(m => console.log(`    ${m}`));
    }
  }
}

async function main() {
  console.log('LEAD DATABASE ANALYSIS — TRINNITY VISERON SYSTEM');
  console.log('Analyzing 495K+ contacts for monetization...');
  console.log(`Start: ${new Date().toISOString()}`);

  const results = [];
  for (const file of FILES) {
    try {
      const data = await analyzeFile(file.path);
      results.push(data);
    } catch (err) {
      console.error(`Error processing ${file.path}: ${err.message}`);
    }
  }

  printSummary(results);

  // Save JSON report
  const report = {
    timestamp: new Date().toISOString(),
    files: FILES.map(f => f.path),
    summary: {
      totalRows: results.reduce((s, r) => s + r.totalRows, 0),
      uniqueEmails: [...new Set(results.flatMap(r => [...r.uniqueEmails]))].length,
      uniquePhones: [...new Set(results.flatMap(r => [...r.uniquePhones]))].length,
      uniqueNames: [...new Set(results.flatMap(r => [...r.uniqueNames]))].length
    },
    sheets: results.flatMap(r => r.sheets.map(s => ({
      name: s.name,
      rows: s.rows,
      cols: s.cols,
      detectedFields: Object.keys(s.detected),
      fieldCounts: s.fieldCounts
    })))
  };

  fs.writeFileSync(path.join(BASE, 'analysis-report.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport saved: leads/analysis-report.json`);
  console.log(`End: ${new Date().toISOString()}`);
}

main().catch(console.error);
