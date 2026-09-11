#!/usr/bin/env node
/**
 * Generates Campaign Strategy + Revenue Projection PDF
 * 34,933 leads → RCS/SMS/WhatsApp campaigns → Revenue
 */
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const leadsFile = path.join(__dirname, "..", "data", "campaigns", "leads.json");
const outputPath = path.join(__dirname, "..", "data", "Viseron_Campanha_Leads_35K.pdf");

let leadsData = { leads: [], stats: { total: 0, byChannel: {}, byOperator: {}, bySegment: {}, byProvince: {} } };
if (fs.existsSync(leadsFile)) {
  leadsData = JSON.parse(fs.readFileSync(leadsFile, "utf8"));
}

const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Colors
const NAVY = "#0a1628";
const CYAN = "#00f0ff";
const PURPLE = "#bf5af2";
const PINK = "#ff2d55";
const GREEN = "#30d158";
const GOLD = "#ffd166";
const WHITE = "#ffffff";
const GRAY = "#8892a4";

function addPage(title, subtitle) {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 120).fill(NAVY);
  doc.fontSize(28).fillColor(WHITE).font("Helvetica-Bold").text(title, 50, 40, { width: doc.page.width - 100 });
  doc.fontSize(12).fillColor(CYAN).font("Helvetica").text(subtitle || "Trinnity Viseron System v7.0", 50, 78, { width: doc.page.width - 100 });
  doc.moveDown(3);
}

function h1(t) { doc.moveDown(0.5); doc.fontSize(18).fillColor(CYAN).font("Helvetica-Bold").text(t); doc.moveDown(0.3); }
function h2(t) { doc.moveDown(0.3); doc.fontSize(14).fillColor(PURPLE).font("Helvetica-Bold").text(t); doc.moveDown(0.2); }
function p(t) { doc.fontSize(10).fillColor(NAVY).font("Helvetica").text(t, { lineGap: 4 }); doc.moveDown(0.3); }
function bullet(t) { doc.fontSize(10).fillColor(NAVY).font("Helvetica").text("  •  " + t, { lineGap: 3 }); }
function stat(l, v) { doc.fontSize(10).fillColor(GRAY).font("Helvetica").text(l + ": ", { continued: true }).fillColor(NAVY).font("Helvetica-Bold").text(String(v)); }

// COVER
doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY);
doc.fontSize(42).fillColor(WHITE).font("Helvetica-Bold").text("VISERON", 50, 150, { width: doc.page.width - 100 });
doc.fontSize(24).fillColor(CYAN).text("Campanha de Leads", 50, 210, { width: doc.page.width - 100 });
doc.fontSize(16).fillColor(PURPLE).text("34,933 Leads Prontos para RCS/SMS/WhatsApp", 50, 250, { width: doc.page.width - 100 });
doc.moveDown(2);
doc.fontSize(12).fillColor(WHITE).text(`${leadsData.stats.total} leads únicos · ${leadsData.stats.byChannel?.rcs || 0} prontos para RCS`, 50, 320, { width: doc.page.width - 100 });
doc.text(`${Object.keys(leadsData.stats.byOperator || {}).length} operadores · ${Object.keys(leadsData.stats.byProvince || {}).length} províncias`, 50, 345, { width: doc.page.width - 100 });
doc.moveDown(3);
doc.fontSize(11).fillColor(GRAY).text("Pedro Costa (Commander) & Trinnity Hurtado (Queen)", 50, 420);
doc.text("Trinnity Viseron System v7.0 — September 2026", 50, 440);
doc.text("CONFIDENTIAL — Commander Eyes Only", 50, 460);

// PAGE 2: Lead Overview
addPage("Visão Geral dos Leads", "Base de dados processada");

h1("Totais");
stat("Total de leads", leadsData.stats.total);
stat("Prontos para RCS/SMS/WhatsApp", leadsData.stats.byChannel?.rcs || 0);
stat("Com email", leadsData.stats.byChannel?.email || 0);
stat("Operadores de telecom", Object.keys(leadsData.stats.byOperator || {}).length);
stat("Províncias", Object.keys(leadsData.stats.byProvince || {}).length);

h1("Por Segmento");
const segments = leadsData.stats.bySegment || {};
for (const [seg, count] of Object.entries(segments).sort((a, b) => b[1] - a[1])) {
  bullet(`${seg}: ${count} leads (${Math.round(count / leadsData.stats.total * 100)}%)`);
}

h1("Top 10 Operadores");
const operators = Object.entries(leadsData.stats.byOperator || {})
  .filter(([k]) => !k.match(/^\d+$/))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
for (const [op, count] of operators) {
  bullet(`${op}: ${count} leads`);
}

h1("Top 10 Províncias");
const provinces = Object.entries(leadsData.stats.byProvince || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [prov, count] of provinces) {
  bullet(`${prov}: ${count} leads`);
}

// PAGE 3: Campaign ROI
addPage("ROI por Campanha", "Projeção de receita por canal");

const channels = [
  { name: "RCS de Marca", cost: 0.005, delivery: 0.95, response: 0.15, conversion: 0.02, rev: 150 },
  { name: "SMS", cost: 0.01, delivery: 0.98, response: 0.05, conversion: 0.02, rev: 150 },
  { name: "WhatsApp", cost: 0.002, delivery: 0.90, response: 0.20, conversion: 0.02, rev: 150 },
  { name: "Email", cost: 0.0001, delivery: 0.85, response: 0.03, conversion: 0.02, rev: 150 },
];

const totalLeads = leadsData.stats.byChannel?.rcs || leadsData.stats.total;

for (const ch of channels) {
  h2(ch.name);
  const count = ch.name === "Email" ? (leadsData.stats.byChannel?.email || 100) : totalLeads;
  const cost = count * ch.cost;
  const delivered = Math.floor(count * ch.delivery);
  const responses = Math.floor(delivered * ch.response);
  const conversions = Math.floor(responses * ch.conversion);
  const revenue = conversions * ch.rev;
  const roi = cost > 0 ? Math.round((revenue - cost) / cost * 100) : 0;

  stat("Leads alvo", count);
  stat("Custo por unidade", "€" + ch.cost.toFixed(3));
  stat("Custo total", "€" + cost.toFixed(2));
  stat("Entregues", delivered + " (" + Math.round(ch.delivery * 100) + "%)");
  stat("Respostas", responses + " (" + Math.round(ch.response * 100) + "%)");
  stat("Conversões", conversions + " (" + Math.round(ch.conversion * 100) + "%)");
  stat("Receita estimada", "€" + revenue.toLocaleString());
  stat("ROI", roi + "%");
  stat("Lucro", "€" + (revenue - cost).toLocaleString());
  doc.moveDown(0.5);
}

// PAGE 4: Revenue Projection
addPage("Projeção de Receita", "12 meses de campanhas");

h1("Projeção Mensal (RCS — melhor canal)");
let cumulative = 0;
const months = ["Set 2026", "Out 2026", "Nov 2026", "Dez 2026", "Jan 2027", "Fev 2027", "Mar 2027", "Abr 2027", "Mai 2027", "Jun 2027", "Jul 2027", "Ago 2027"];

for (let m = 0; m < 12; m++) {
  const leadsThisMonth = Math.floor(totalLeads * (0.1 + m * 0.05));
  const convRate = 0.01 + m * 0.003;
  const conv = Math.floor(leadsThisMonth * convRate);
  const rev = conv * 150;
  cumulative += rev;
  bullet(`${months[m]}: ${leadsThisMonth} leads → ${conv} convs → €${rev.toLocaleString()} (acum: €${cumulative.toLocaleString()})`);
}

h1("Projeção Anual");
stat("Total de leads contactados", (totalLeads * 6).toLocaleString());
stat("Taxa de conversão média", "2.5%");
stat("Conversões estimadas", Math.floor(totalLeads * 6 * 0.025).toLocaleString());
stat("Receita anual estimada", "€" + (Math.floor(totalLeads * 6 * 0.025) * 150).toLocaleString());
stat("Custo anual (RCS)", "€" + (totalLeads * 6 * 0.005).toFixed(2));
stat("Lucro anual", "€" + (Math.floor(totalLeads * 6 * 0.025) * 150 - totalLeads * 6 * 0.005).toLocaleString());

// PAGE 5: Execution Plan
addPage("Plano de Execução", "Como vamos fazer dinheiro");

h1("Fase 1: Setup (Semana 1-2)");
bullet("Importar 34,933 leads para o sistema de campanhas");
bullet("Configurar Twilio RCS Sender + Messaging Service");
bullet("Criar 3 templates por segmento (telecom, banking, general)");
bullet("Aprovar marca RCS no Google (4-6 semanas)");

h1("Fase 2: Primeira Campanha (Semana 3-4)");
bullet("Enviar batch de 1,000 leads (teste A/B)");
bullet("Medir delivery rate, response rate, conversion rate");
bullet("Otimizar mensagens baseado nos resultados");
bullet("Escalar para 5,000 leads/semana");

h1("Fase 3: Escala (Mês 2-3)");
bullet("Envio automático de 10,000 leads/semana");
bullet("Multi-canal: RCS + SMS + WhatsApp simultâneo");
bullet("AI personalization para cada lead");
bullet("Tracking de conversões em tempo real");

h1("Fase 4: Receita (Mês 4-6)");
bullet("€5,000/mês em receita de campanhas");
bullet("€15,000/mês com escala (3x)");
bullet("€50,000/mês com multi-canal");
bullet("Meta: €100K MRR ao final do Ano 1");

h1("Ferramentas Necessárias");
bullet("Twilio Account SID + Auth Token (já configurados)");
bullet("RCS Service SID (pendente — brand approval)");
bullet("Ollama local para AI personalization (já ativo)");
bullet("Node.js server (já ativo na porta 3000)");

// PAGE 6: Integration with VISERON
addPage("Integração com VISERON", "Como os leads alimentam o sistema");

h1("Fluxo de Dados");
bullet("Excel leads → LeadStore (34,933 leads)");
bullet("LeadStore → CampaignEngine (mensagens personalizadas)");
bullet("CampaignEngine → Twilio RCS/SMS (envio)");
bullet("Twilio Webhooks → LeadStore (delivery tracking)");
bullet("AI Analysis → Otimização automática");

h1("Automação com Agentes");
bullet("JARVIS: 'Crie uma campanha para o segmento platino'");
bullet("VISERON: 'Analise o ROI da última campanha'");
bullet("Agency OS: 'Gere relatório de conversões'");
bullet("Auto Learning: 'Aprenda com as respostas dos leads'");

h1("Comandos Disponíveis");
bullet("npm run import:telecom — Importar leads do Excel");
bullet("npm run campaign:create — Criar campanha");
bullet("npm run campaign:send — Enviar campanha");
bullet("npm run campaign:stats — Ver estatísticas");
bullet("npm run campaign:revenue — Ver projeção de receita");

// Finalize
doc.end();
stream.on("finish", () => {
  const size = fs.statSync(outputPath).size;
  console.log("PDF generated:", outputPath, "(" + (size / 1024).toFixed(1) + " KB)");
});
stream.on("error", (err) => {
  console.error("PDF generation failed:", err.message);
  process.exit(1);
});
