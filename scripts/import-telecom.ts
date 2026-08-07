import "dotenv/config";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

// TVS — IMPORTADOR 45K TELECOMUNICACIONES (v4, híbrido + fallback)
// Hoja3: tenta mapeamento CT_C_*; se a linha não encaixa, cai em deteção por conteúdo.
// Restantes folhas: deteção por tipo de conteúdo.
// Emails da Sheet9 fundidos por DNI no final. Uso: npm run import:telecom

const SRC = path.resolve("45k telecomunicaciones.xlsx");
const OUT_DIR = path.resolve("data/telecom");

const OPERATORS = new Set([
  "Movistar", "Orange", "Vodafone", "Vodafone Enabler", "Yoigo", "Euskaltel", "Jazztel", "Auna",
  "Airenetworks", "Ptv Telecom 4g", "Digi Spain Telecom", "DIGI SPAIN", "Masmovil", "MASMOVIL",
  "Pepephone", "Pepephone 3.0", "Kpn", "Lemonvil", "Opencable Telecomuni", "Republica Movil",
  "Lowi", "O2", "Simyo", "Carrefour Movil", "Hibox", "R Cable", "Adamov", "Amena", "Avatel",
  "Telecable", "Telefonica", "Onivia", "Finetwork", "Llamaya", "TIVIO", "Tuenti", "Mundo R",
  "Noroeste Telecom", "Quiero TV", "Bluevoz", "Xtra Telecom", "DIGI", "Global Comunicacion",
  "Least Cost Routing T", "RADIUS TELECOM", "Swisscom", "Auna Moviles",
]);

const METALS = new Set(["silver", "gold", "bronze", "platino", "cantera", "plomo", "caliza", "sin metal"]);

function clean(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim().replace(/\s+/g, " ");
}

function normPhone(s: string): string {
  let x = s.replace(/[^+\d]/g, "");
  if (!x) return "";
  if (x.startsWith("+34")) x = x.slice(3);
  if (x.length === 9 && /^[679]/.test(x)) return "+34" + x;
  return "";
}

function normDni(s: string): string {
  const x = s.toUpperCase().replace(/\s/g, "");
  if (/^[XYZ]?\d{7,8}[A-Z]$/.test(x)) return x;
  if (/^[XYZ]?\d{7,8}$/.test(x)) return x;
  return "";
}

function normEmail(s: string): string {
  const x = clean(s).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x) ? x : "";
}

function isTimestamp(s: string): boolean {
  return /^\d{12}$/.test(s) || /^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{10}$/.test(s);
}

function isNameText(s: string): boolean {
  if (!s || s.length < 3 || s.length > 120) return false;
  if (/[\d@]/.test(s)) return false;
  if (/^[IVX]+$/.test(s)) return false;
  const letters = s.replace(/[^a-zA-ZÀ-ÿÑñ]/g, "");
  return letters.length >= 3;
}

// Limpa ruído de colunas adjacentes ("DNI/NIF", "TARJETA DE RESIDENTE", ". .", ...)
const DIRT = /(\bDNI\/?NIF\b|\bD\.N\.?I\.?\b|\bN\.?I\.?F\.?\b|\bTARJETA DE RESIDENTE\b|\bNIE\b|\bNº\b|\bNUMERO?\b)/gi;
function cleanName(s: string): string {
  return clean(s.replace(DIRT, " ").replace(/[.,:;/\\\-_]+(\s|$)/g, "$1").replace(/\s{2,}/g, " ").replace(/^[. ]+|[. ]+$/g, "")).replace(/\s+/g, " ");
}

function isCp(s: string): boolean {
  return /^\d{5}$/.test(s);
}

function splitNames(full: string): { firstName: string; lastName: string } {
  const f = clean(full);
  if (f.includes(",")) {
    const [last, ...rest] = f.split(",");
    return { lastName: last.trim(), firstName: rest.join(",").trim() };
  }
  return { firstName: f, lastName: "" };
}

// Tenta mapeamento CT_C_* (Hoja3). null se a linha não encaixar bem.
function parseHoja3(row: ExcelJS.Row): Record<string, any> | null {
  const cell = (i: number) => clean(row.getCell(i).value);
  const operator = cell(1);
  const dni = normDni(cell(3));
  const phones = [normPhone(cell(4)), normPhone(cell(5)), normPhone(cell(6))].filter(Boolean);
  const lastName = cell(7);
  const firstName = cell(14);
  // Só considera válida se houver DNI ou telefone no sítio esperado (senão linha deslocada)
  if (!dni && !phones.length) return null;
  return {
    operator,
    metal: METALS.has(cell(2).toLowerCase()) ? cell(2).toLowerCase() : "",
    dni,
    phones,
    lastName,
    siebelId: cell(8),
    product: cell(9),
    cp: isCp(cell(10)) ? cell(10) : "",
    address: cell(11),
    clientId: cell(12),
    city: cell(13),
    firstName,
    province: cell(15),
    plan: cell(16),
    email: "",
    emails: [],
  };
}

function parseByContent(row: ExcelJS.Row): Record<string, any> | null {
  const cells: { col: number; v: string }[] = [];
  row.eachCell({ includeEmpty: false }, (c) => {
    const v = clean(c.value);
    if (v) cells.push({ col: c.col, v });
  });
  if (cells.length < 3) return null;

  const emails: string[] = [];
  const phones: string[] = [];
  const nameTexts: string[] = [];
  let dni = "";
  let cp = "";
  let operator = "";
  let metal = "";
  let city = "";
  let province = "";

  for (const { v } of cells) {
    if (v.includes("@")) {
      const e = normEmail(v);
      if (e && !emails.includes(e)) emails.push(e);
      continue;
    }
    const p = normPhone(v);
    if (p) {
      if (!phones.includes(p)) phones.push(p);
      continue;
    }
    const d = normDni(v);
    if (d && !dni) {
      dni = d;
      continue;
    }
    if (isCp(v) && !cp) {
      cp = v;
      continue;
    }
    if (isTimestamp(v)) continue;
    const lower = v.toLowerCase();
    if (METALS.has(lower)) {
      metal = lower;
      continue;
    }
    if (OPERATORS.has(v)) {
      if (!operator) operator = v;
      continue;
    }
    if (isNameText(v)) nameTexts.push(v);
  }

  if (!operator) {
    const firstText = cells.find(({ v }) => isNameText(v));
    if (firstText && cells[0].col === firstText.col) operator = firstText.v;
  }
  // Linhas deslocadas: o operador é a 1ª célula (coluna 1) mesmo sem whitelist
  if (!operator && cells[0] && cells[0].col === 1 && isNameText(cells[0].v)) {
    operator = cells[0].v;
  }

  const key = dni || phones[0];
  if (!key || (!operator && !nameTexts.length)) return null;

  const nm = splitNames(nameTexts.join(" "));
  return { operator, metal, dni, phones, cp, firstName: cleanName(nm.firstName), lastName: cleanName(nm.lastName), city, province, email: emails[0] || "", emails, product: "", plan: "" };
}

// Segunda tabela da Hoja3 (header: TelefonoContrato | Titular | Tipo Doc | Numero Doc | ...)
// c1=telefone, c2=titular(nome), c3=tipo doc, c4=nº doc, c5=persona contrato, c6=email, c7-9=contactos
function parseHoja3Seg(row: ExcelJS.Row): Record<string, any> | null {
  const cell = (i: number) => clean(row.getCell(i).value);
  const c1 = cell(1);
  const c2 = cell(2);
  const c3 = cell(3).toUpperCase();
  const isDocType = /DNI|NIE|PASAPORTE|TARJETA|RESIDENTE/.test(c3);
  const phone = normPhone(c1);
  if (!isDocType || !phone) return null;
  const dni = normDni(cell(4));
  const nameTxt = cell(5) && cell(5).length > 3 ? cell(5) : c2;
  const nm = splitNames(nameTxt);
  const phones = [phone, normPhone(cell(7)), normPhone(cell(8)), normPhone(cell(9))].filter(Boolean);
  const email = normEmail(cell(6));
  return {
    operator: "", metal: "", dni, phones, cp: "", firstName: cleanName(nm.firstName), lastName: cleanName(nm.lastName),
    city: "", province: "", email, emails: email ? [email] : [], product: "", plan: "",
  };
}

function toRecord(p: Record<string, any>, i: number, sheet: string): Record<string, any> {
  const firstName = p.firstName || "";
  const lastName = p.lastName || "";
  return {
    id: `tel-${i + 1}`,
    operator: p.operator || "",
    metal: p.metal || "",
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    dni: p.dni || "",
    phones: p.phones || [],
    primaryPhone: (p.phones && p.phones[0]) || "",
    email: p.email || "",
    emails: p.emails || [],
    city: p.city || "",
    province: p.province || "",
    cp: p.cp || "",
    address: p.address || "",
    plan: p.plan || "",
    product: p.product || "",
    siebelId: p.siebelId || "",
    clientId: p.clientId || "",
    source: sheet,
    sheet,
  };
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Ficheiro não encontrado: ${SRC}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("A ler Excel (4 MB)...");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SRC);

  const seen = new Set<string>();
  const contacts: Record<string, any>[] = [];
  const emailByDni = new Map<string, string>();
  let skipped = 0;
  let dedup = 0;

  // Ordem: Hoja3 (mais completa) → Sheet9 (emails) → resto
  const order = ["Hoja3", "Sheet9", ...wb.worksheets.map((w) => w.name).filter((n) => n !== "Hoja3" && n !== "Sheet9")];

  for (const name of order) {
    const ws = wb.getWorksheet(name);
    if (!ws) continue;
    let count = 0;
    for (let r = 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      let parsed = name === "Hoja3" ? parseHoja3(row) : null;
      if (!parsed && name === "Hoja3") parsed = parseHoja3Seg(row);
      if (!parsed) parsed = parseByContent(row);
      if (!parsed) { skipped++; continue; }
      const key = parsed.dni || parsed.phones[0];
      if (!key) { skipped++; continue; }
      if (parsed.email) emailByDni.set(parsed.dni, parsed.email);
      if (seen.has(key)) { dedup++; continue; }
      seen.add(key);
      contacts.push(toRecord(parsed, contacts.length, name));
      count++;
    }
    console.log(`[${name}] ${count} contactos`);
  }

  // Merge de emails por DNI
  for (const c of contacts) {
    if (!c.email && c.dni && emailByDni.has(c.dni)) {
      c.email = emailByDni.get(c.dni) || "";
      c.emails = c.email ? [c.email] : [];
    }
  }

  const byEmail = contacts.filter((c) => c.email);
  const smsSet = new Set<string>();
  const sms: Record<string, any>[] = [];
  for (const c of contacts) {
    for (const p of c.phones) {
      if (!smsSet.has(p)) {
        smsSet.add(p);
        sms.push({ phone: p, operator: c.operator, metal: c.metal, email: c.email, fullName: c.fullName, dni: c.dni, province: c.province });
      }
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, "contacts.json"), JSON.stringify(contacts, null, 2), "utf-8");
  fs.writeFileSync(path.join(OUT_DIR, "emails.json"), JSON.stringify(byEmail, null, 2), "utf-8");
  fs.writeFileSync(path.join(OUT_DIR, "sms.json"), JSON.stringify(sms, null, 2), "utf-8");

  const opCounts: Record<string, number> = {};
  const metalCounts: Record<string, number> = {};
  const pCounts: Record<string, number> = {};
  for (const c of contacts) {
    opCounts[c.operator || "n/d"] = (opCounts[c.operator || "n/d"] || 0) + 1;
    metalCounts[c.metal || "n/d"] = (metalCounts[c.metal || "n/d"] || 0) + 1;
    if (c.province) pCounts[c.province] = (pCounts[c.province] || 0) + 1;
  }

  const stats = {
    generatedAt: new Date().toISOString(),
    source: "45k telecomunicaciones.xlsx",
    totalContacts: contacts.length,
    skippedRows: skipped,
    deduped: dedup,
    withName: contacts.filter((c) => c.fullName).length,
    withDni: contacts.filter((c) => c.dni).length,
    withEmail: byEmail.length,
    withPhone: contacts.filter((c) => c.phones.length > 0).length,
    uniquePhones: sms.length,
    operators: Object.fromEntries(Object.entries(opCounts).sort((a, b) => b[1] - a[1]).slice(0, 25)),
    metals: Object.fromEntries(Object.entries(metalCounts).sort((a, b) => b[1] - a[1]).slice(0, 12)),
    provinces: Object.fromEntries(Object.entries(pCounts).sort((a, b) => b[1] - a[1]).slice(0, 15)),
  };
  fs.writeFileSync(path.join(OUT_DIR, "stats.json"), JSON.stringify(stats, null, 2), "utf-8");

  console.log("\n===== ESTATÍSTICAS FINAIS =====");
  console.log(`Contactos únicos: ${contacts.length} | skip: ${skipped} | duplicados: ${dedup}`);
  console.log(`Nome: ${stats.withName} | DNI: ${stats.withDni} | email: ${stats.withEmail} | telefones únicos: ${stats.uniquePhones}`);
  console.log("\nOperadores:");
  for (const [op, n] of Object.entries(opCounts).sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`  ${op}: ${n}`);
  console.log("\nSegmentos:");
  for (const [m, n] of Object.entries(metalCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${m}: ${n}`);
  console.log("\nProvíncias top:");
  for (const [p, n] of Object.entries(pCounts).sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${p}: ${n}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
