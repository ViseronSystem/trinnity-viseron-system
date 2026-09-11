const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const BASE = __dirname;
const filePath = 'Lead 450K para publicidad Viseron.xlsx';

const KEY_FIELDS = {
  email: ['email', 'correo', 'e-mail', 'mail', 'email_address', 'correo_electronico'],
  phone: ['phone', 'telefono', 'tel', 'movil', 'celular', 'phone_number', 'telf', 'móvil', 'whatsapp'],
  name: ['nombre', 'name', 'nombres', 'first_name', 'nombre_completo', 'apellidos', 'last_name'],
  company: ['empresa', 'company', 'organizacion', 'organization', 'razon_social', 'compania'],
  country: ['pais', 'country', 'provincia', 'province', 'region', 'ciudad', 'city'],
  language: ['idioma', 'language', 'lang', 'nivel', 'nivel_ingles'],
  segment: ['segmento', 'segment', 'nivel', 'categoria', 'type', 'tipo'],
  nif: ['dni', 'nif', 'cif', 'cedula'],
  tariff: ['tarifa', 'plan', 'rate', 'precio'],
  source: ['fuente', 'source', 'origen', 'canal', 'medio']
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

function getNonEmptyCount(ws, colIndex) {
  let count = 0;
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum === 1) return;
    const val = row.getCell(colIndex).text || row.getCell(colIndex).value;
    if (val && String(val).trim()) count++;
  });
  return count;
}

async function main() {
  console.log(`ANALYZING: ${filePath}`);
  console.log(`Start: ${new Date().toISOString()}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(BASE, filePath));

  const sheets = [];
  workbook.eachSheet((ws, id) => {
    sheets.push({ id, name: ws.name, rows: ws.rowCount, cols: ws.columnCount });
  });

  console.log(`\nSHEETS FOUND: ${sheets.length}`);
  sheets.forEach(s => console.log(`  [${s.id}] "${s.name}" — ${s.rows} rows × ${s.cols} cols`));

  const allEmails = new Set();
  const allPhones = new Set();
  const allNames = new Set();

  for (const sheetInfo of sheets) {
    const ws = workbook.getWorksheet(sheetInfo.id);
    if (!ws) continue;

    console.log(`\n--- SHEET: "${sheetInfo.name}" (${sheetInfo.rows} rows) ---`);

    // Extract headers
    const headers = [];
    const headerRow = ws.getRow(1);
    for (let c = 1; c <= Math.min(ws.columnCount || 100, 200); c++) {
      const val = headerRow.getCell(c).text || headerRow.getCell(c).value || '';
      if (String(val).trim()) headers.push({ col: c, header: String(val).trim(), norm: normalizeHeader(val) });
    }

    console.log(`  COLUMNS (${headers.length}):`);
    headers.slice(0, 50).forEach(h => console.log(`    [${h.col}] ${h.header}`));
    if (headers.length > 50) console.log(`    ... and ${headers.length - 50} more`);

    // Detect key fields
    const normHeaders = headers.map(h => h.norm);
    const detected = detectFields(normHeaders);
    console.log(`\n  DETECTED FIELDS:`);
    for (const [field, matches] of Object.entries(detected)) {
      const originals = matches.map(m => headers.find(h => h.norm === m)?.header || m);
      console.log(`    ${field.toUpperCase()}: ${originals.join(', ')}`);
    }

    // Count non-empty for detected fields
    console.log(`\n  FIELD POPULATION:`);
    for (const [field, matches] of Object.entries(detected)) {
      let total = 0;
      for (const match of matches) {
        const header = headers.find(h => h.norm === match);
        if (header) total += getNonEmptyCount(ws, header.col);
      }
      const pct = ((total / Math.max(sheetInfo.rows - 1, 1)) * 100).toFixed(1);
      console.log(`    ${field}: ${total} non-empty (${pct}%)`);
    }

    // Collect unique values
    for (const [field, matches] of Object.entries(detected)) {
      for (const match of matches) {
        const header = headers.find(h => h.norm === match);
        if (!header) continue;
        let sampled = 0;
        ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
          if (rowNum === 1) return;
          if (sampled >= 50000) return; // sample first 50k for speed
          const val = String(row.getCell(header.col).text || row.getCell(header.col).value || '').trim().toLowerCase();
          if (!val) return;
          if (field === 'email' && val.includes('@')) allEmails.add(val);
          else if (field === 'phone' && val.replace(/[\s\-\+\(\)\.]/g, '').length >= 7) allPhones.add(val);
          else if (field === 'name' && val.length > 1) allNames.add(val);
          sampled++;
        });
      }
    }

    // Sample rows (first 3)
    console.log(`\n  SAMPLE (first 3 rows):`);
    let rowIdx = 0;
    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (rowNum === 1 || rowIdx >= 3) return;
      const vals = {};
      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        const header = ws.getRow(1).getCell(colNum).text || `col_${colNum}`;
        vals[header] = String(cell.text || cell.value || '').substring(0, 120);
      });
      console.log(`    Row ${rowNum}: ${JSON.stringify(vals).substring(0, 500)}`);
      rowIdx++;
    });
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('450K FILE SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`UNIQUE EMAILS (sampled): ${allEmails.size.toLocaleString()}`);
  console.log(`UNIQUE PHONES (sampled): ${allPhones.size.toLocaleString()}`);
  console.log(`UNIQUE NAMES (sampled): ${allNames.size.toLocaleString()}`);

  // Export report
  const report = {
    timestamp: new Date().toISOString(),
    file: filePath,
    sheets: sheets.map(s => ({ name: s.name, rows: s.rows, cols: s.cols })),
    uniqueEmails: allEmails.size,
    uniquePhones: allPhones.size,
    uniqueNames: allNames.size
  };
  fs.writeFileSync(path.join(BASE, 'analysis-450k.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport saved: leads/analysis-450k.json`);
}

main().catch(console.error);
