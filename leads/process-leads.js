const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const LEADS_DIR = __dirname;

// Ensure output directory exists
if (!fs.existsSync(path.join(BASE, 'data', 'leads'))) {
  fs.mkdirSync(path.join(BASE, 'data', 'leads'), { recursive: true });
}

function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[\s\-\+\(\)\.]/g, '');
  // Spanish 9-digit mobile
  if (/^[67]\d{8}$/.test(cleaned)) return `+34${cleaned}`;
  // Already has country code
  if (/^34[67]\d{8}$/.test(cleaned)) return `+${cleaned}`;
  // Portuguese
  if (/^9[123]\d{7}$/.test(cleaned)) return `+351${cleaned}`;
  return null;
}

function normalizeEmail(email) {
  if (!email) return null;
  const cleaned = String(email).toLowerCase().trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return cleaned;
  return null;
}

function parseSpanishDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch { return null; }
}

function scoreLead(lead) {
  let score = 0;
  if (lead.phone) score += 30;
  if (lead.email) score += 25;
  if (lead.name) score += 15;
  if (lead.dni) score += 10;
  if (lead.province) score += 10;
  if (lead.segment) score += 5;
  if (lead.bank) score += 5;
  return score;
}

function getChannelReadiness(lead) {
  const channels = [];
  if (lead.phoneE164) {
    channels.push('sms');
    channels.push('rcs');
    channels.push('whatsapp');
  }
  if (lead.email) channels.push('email');
  if (lead.name) channels.push('linkedin_research');
  return channels;
}

async function process45KFile() {
  console.log('Processing 45k telecomunicaciones.xlsx...');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(LEADS_DIR, '45k telecomunicaciones.xlsx'));

  const leads = new Map(); // DNI → lead

  workbook.eachSheet((ws) => {
    if (ws.name === 'Hoja3') {
      // Best structured sheet with proper headers
      ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
        if (rowNum === 1) return;
        const dni = String(row.getCell(3).text || '').trim();
        if (!dni) return;

        const phone1 = normalizePhone(row.getCell(4).text);
        const phone2 = normalizePhone(row.getCell(5).text);
        const phone3 = normalizePhone(row.getCell(6).text);
        const phone = phone1 || phone2 || phone3;

        const name = String(row.getCell(14).text || '').trim();
        const lastName1 = String(row.getCell(7).text || '').trim();
        const lastName2 = String(row.getCell(9).text || '').trim();
        const fullName = [name, lastName1, lastName2].filter(Boolean).join(' ');

        leads.set(dni, {
          source: '45k_telecom',
          dni,
          name: fullName || null,
          phone,
          phoneE164: phone,
          phone2: phone2,
          phone3: phone3,
          email: null,
          province: String(row.getCell(15).text || '').trim() || null,
          segment: String(row.getCell(2).text || '').trim() || null,
          operator: String(row.getCell(1).text || '').trim() || null,
          tariff: String(row.getCell(16).text || '').trim() || null,
          bank: null,
          iban: null,
          birthDate: null
        });
      });
    } else if (ws.name.includes('Sheet9') || ws.name.includes('Hoja')) {
      // Other sheets with email
      ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
        if (rowNum === 1) return;
        const dni = String(row.getCell(4).text || '').trim();
        if (!dni) return;

        const email = normalizeEmail(row.getCell(8).text);
        const phone = normalizePhone(row.getCell(7).text);
        const name = String(row.getCell(3).text || '').trim();

        if (!leads.has(dni)) {
          leads.set(dni, {
            source: '45k_telecom',
            dni,
            name: name || null,
            phone,
            phoneE164: phone,
            email,
            province: String(row.getCell(6).text || '').trim() || null,
            segment: String(row.getCell(2).text || '').trim() || null,
            operator: String(row.getCell(1).text || '').trim() || null,
            tariff: null,
            bank: null,
            iban: null,
            birthDate: null
          });
        } else if (email) {
          // Merge email if existing lead doesn't have one
          const existing = leads.get(dni);
          if (!existing.email) existing.email = email;
        }
      });
    }
  });

  return Array.from(leads.values());
}

async function process450KFile() {
  console.log('Processing Lead 450K para publicidad Viseron.xlsx...');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(LEADS_DIR, 'Lead 450K para publicidad Viseron.xlsx'));

  const leads = new Map();
  let processed = 0;

  // Process each bank sheet
  workbook.eachSheet((ws) => {
    if (ws.name === 'DATOS') return; // Skip summary sheet

    const sheetName = ws.name;
    // Extract bank name from sheet name (e.g., "BBVA 101003" → "BBVA")
    const bankMatch = sheetName.match(/^(.+?)\s+\d+$/);
    const bankName = bankMatch ? bankMatch[1].trim() : sheetName;

    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (rowNum === 1) return; // Skip header row

      const dni = String(row.getCell(1).text || '').trim();
      if (!dni || dni.length < 6) return;

      // Skip if this is a header-like row
      if (/^(DNI|NIF|NOMBRE|CT_)/.test(dni)) return;

      const phone1 = normalizePhone(row.getCell(6).text);
      const phone2 = normalizePhone(row.getCell(7).text);
      const phone = phone1 || phone2;

      const firstName = String(row.getCell(3).text || '').trim();
      const lastName1 = String(row.getCell(4).text || '').trim();
      const lastName2 = String(row.getCell(5).text || '').trim();
      const fullName = [firstName, lastName1, lastName2].filter(Boolean).join(' ');

      const iban = String(row.getCell(8).text || '').trim() || null;

      if (!leads.has(dni)) {
        leads.set(dni, {
          source: '450k_banking',
          dni,
          name: fullName || null,
          phone,
          phoneE164: phone,
          phone2: phone2,
          email: null,
          province: null,
          segment: null,
          operator: null,
          tariff: null,
          bank: bankName,
          iban,
          birthDate: parseSpanishDate(row.getCell(2).text)
        });
      } else {
        // Add additional phone if available
        const existing = leads.get(dni);
        if (!existing.phone2 && phone2) existing.phone2 = phone2;
      }
      processed++;
    });
  });

  console.log(`  Processed ${processed} rows from 450K file`);
  return Array.from(leads.values());
}

async function main() {
  console.log('=== UNIFIED LEAD PROCESSING ===');
  console.log(`Start: ${new Date().toISOString()}`);

  // Process both files
  const leads45K = await process45KFile();
  console.log(`45K file: ${leads45K.length} unique contacts`);

  const leads450K = await process450KFile();
  console.log(`450K file: ${leads450K.length} unique contacts`);

  // Merge and deduplicate by DNI
  const allLeads = new Map();
  for (const lead of leads45K) {
    allLeads.set(lead.dni, lead);
  }
  for (const lead of leads450K) {
    if (!allLeads.has(lead.dni)) {
      allLeads.set(lead.dni, lead);
    } else {
      // Merge: prefer 45K data (has email, province, operator)
      const existing = allLeads.get(lead.dni);
      if (!existing.email && lead.email) existing.email = lead.email;
      if (!existing.province && lead.province) existing.province = lead.province;
      if (!existing.bank && lead.bank) existing.bank = lead.bank;
      if (!existing.iban && lead.iban) existing.iban = lead.iban;
    }
  }

  const unifiedLeads = Array.from(allLeads.values());

  // Score and enrich
  for (const lead of unifiedLeads) {
    lead.score = scoreLead(lead);
    lead.channels = getChannelReadiness(lead);
    lead.rcsReady = !!lead.phoneE164;
    lead.emailReady = !!lead.email;
    lead.whatsappReady = !!lead.phoneE164;
  }

  // Sort by score (highest first)
  unifiedLeads.sort((a, b) => b.score - a.score);

  // Statistics
  const stats = {
    totalLeads: unifiedLeads.length,
    withPhone: unifiedLeads.filter(l => l.phone).length,
    withEmail: unifiedLeads.filter(l => l.email).length,
    withBoth: unifiedLeads.filter(l => l.phone && l.email).length,
    rcsReady: unifiedLeads.filter(l => l.rcsReady).length,
    emailReady: unifiedLeads.filter(l => l.emailReady).length,
    whatsappReady: unifiedLeads.filter(l => l.whatsappReady).length,
    bySource: {
      '45k_telecom': unifiedLeads.filter(l => l.source === '45k_telecom').length,
      '450k_banking': unifiedLeads.filter(l => l.source === '450k_banking').length
    },
    bySegment: {},
    byOperator: {},
    byBank: {},
    byProvince: {},
    byScore: {
      'high_80_100': unifiedLeads.filter(l => l.score >= 80).length,
      'medium_60_79': unifiedLeads.filter(l => l.score >= 60 && l.score < 80).length,
      'low_40_59': unifiedLeads.filter(l => l.score >= 40 && l.score < 60).length,
      'very_low_0_39': unifiedLeads.filter(l => l.score < 40).length
    }
  };

  // Count distributions
  for (const lead of unifiedLeads) {
    if (lead.segment) stats.bySegment[lead.segment] = (stats.bySegment[lead.segment] || 0) + 1;
    if (lead.operator) stats.byOperator[lead.operator] = (stats.byOperator[lead.operator] || 0) + 1;
    if (lead.bank) stats.byBank[lead.bank] = (stats.byBank[lead.bank] || 0) + 1;
    if (lead.province) stats.byProvince[lead.province] = (stats.byProvince[lead.province] || 0) + 1;
  }

  // Save unified leads (sample for testing)
  const sampleLeads = unifiedLeads.slice(0, 1000); // First 1000 for testing
  fs.writeFileSync(
    path.join(BASE, 'data', 'leads', 'unified-leads-sample.json'),
    JSON.stringify(sampleLeads, null, 2)
  );

  // Save full stats
  fs.writeFileSync(
    path.join(BASE, 'data', 'leads', 'lead-stats.json'),
    JSON.stringify(stats, null, 2)
  );

  // Save full leads in chunks (for large dataset)
  const CHUNK_SIZE = 50000;
  const chunks = Math.ceil(unifiedLeads.length / CHUNK_SIZE);
  for (let i = 0; i < chunks; i++) {
    const chunk = unifiedLeads.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    fs.writeFileSync(
      path.join(BASE, 'data', 'leads', `unified-leads-part${i + 1}.json`),
      JSON.stringify(chunk, null, 2)
    );
  }

  // Print summary
  console.log('\n=== UNIFIED LEAD DATABASE ===');
  console.log(`Total unique leads: ${stats.totalLeads}`);
  console.log(`With phone: ${stats.withPhone} (${((stats.withPhone / stats.totalLeads) * 100).toFixed(1)}%)`);
  console.log(`With email: ${stats.withEmail} (${((stats.withEmail / stats.totalLeads) * 100).toFixed(1)}%)`);
  console.log(`With both: ${stats.withBoth}`);
  console.log(`\nChannel readiness:`);
  console.log(`  RCS/SMS ready: ${stats.rcsReady}`);
  console.log(`  WhatsApp ready: ${stats.whatsappReady}`);
  console.log(`  Email ready: ${stats.emailReady}`);
  console.log(`\nBy source:`);
  for (const [source, count] of Object.entries(stats.bySource)) {
    console.log(`  ${source}: ${count}`);
  }
  console.log(`\nBy score:`);
  for (const [range, count] of Object.entries(stats.byScore)) {
    console.log(`  ${range}: ${count}`);
  }
  console.log(`\nTop banks:`);
  const topBanks = Object.entries(stats.byBank).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [bank, count] of topBanks) {
    console.log(`  ${bank}: ${count}`);
  }

  console.log(`\nFiles saved:`);
  console.log(`  data/leads/unified-leads-sample.json (1000 leads)`);
  console.log(`  data/leads/lead-stats.json`);
  console.log(`  data/leads/unified-leads-part1.json - part${chunks}.json`);
  console.log(`\nEnd: ${new Date().toISOString()}`);
}

main().catch(console.error);
