// TVS - Certificado de Autoría e Monitorización AIOX (PDF)
// Uso: node scripts/gerar-autoria.ts
const fs = require("fs-extra");
const path = require("path");
const PDFDocument = require("pdfkit");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(OUT_DIR, "Viseron_Certificado_Autoria_AIOX.pdf");
fs.ensureDirSync(OUT_DIR);

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 50, bottom: 50, left: MARGIN, right: MARGIN },
});

let y = MARGIN;
function ensure(h = 40) {
  if (y + h > PAGE_H - 55) { doc.addPage(); y = MARGIN; }
}
function text(txt, size = 10, color = "#2a2a3a", opts = {}) {
  doc.font("Helvetica").fontSize(size).fillColor(color);
  doc.text(txt, MARGIN, y, { width: PAGE_W - MARGIN * 2, ...opts });
  y = doc.y + 6;
}
function section(num, title) {
  ensure(50);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 30).fill("#0a0a2e");
  doc.fillColor("#00ff87").font("Helvetica-Bold").fontSize(13);
  doc.text(`${num}. ${title}`, MARGIN + 10, y + 9, { width: PAGE_W - MARGIN * 2 - 20 });
  y += 42;
}
function bullet(txt) {
  ensure(24);
  text(`• ${txt}`, 9.5);
}

doc.font("Helvetica-Bold").fontSize(20).fillColor("#00f0ff").text("CERTIFICADO DE AUTORIA E MONITORIZAÇÃO AIOX", MARGIN, y, { align: "center" });
y += 22;
text("Trinnity Viseron System v5.0 — Consolidação da autoria e do domínio operativo.", 10.5, "#6a6a8a", { align: "center" });
y += 10;

section(1, "AUTORES E DONOS DO SISTEMA");
text("Os únicos autores e donos do Trinnity Viseron System, com autoridade de criação:", 10, "#2a2a3a");
y += 4;
ensure(70);
const cx = PAGE_W / 2;
doc.rect(MARGIN, y, (PAGE_W - MARGIN * 2 - 20) / 2, 52).fill("#0a0a2e");
doc.rect(MARGIN + (PAGE_W - MARGIN * 2 - 20) / 2 + 20, y, (PAGE_W - MARGIN * 2 - 20) / 2, 52).fill("#0a0a2e");
doc.fillColor("#00ff87").font("Helvetica-Bold").fontSize(11).text("Pedro Costa", MARGIN + 10, y + 8);
doc.fillColor("#bf5af2").font("Helvetica-Bold").fontSize(10).text("Comandante Supremo", MARGIN + 10, y + 24);
doc.fillColor("#c8c8e0").font("Helvetica").fontSize(8.5).text("clearance: tvs_creator · autoridade absoluta · criação · acesso ilimitado", MARGIN + 10, y + 38);
doc.fillColor("#00ff87").font("Helvetica-Bold").fontSize(11).text("Trinnity Hurtado", MARGIN + 12 + (PAGE_W - MARGIN * 2 - 20) / 2, y + 8);
doc.fillColor("#bf5af2").font("Helvetica-Bold").fontSize(10).text("Rainha & Arquiteta Chefe", MARGIN + 12 + (PAGE_W - MARGIN * 2 - 20) / 2, y + 24);
doc.fillColor("#c8c8e0").font("Helvetica").fontSize(8.5).text("clearance: tvs_architect · soberania técnica · arquitetura de IA", MARGIN + 12 + (PAGE_W - MARGIN * 2 - 20) / 2, y + 38);
y += 64;

section(2, "ONDE A AUTORIA ESTÁ MATERIALIZADA NO CÓDIGO");
bullet("src/core/leadership/CommandChain.ts — Pedro → tvs_creator, Trinnity → tvs_architect.");
bullet("src/core/squads/SquadManager.ts — líderes com todos os SYSTEM_ADMIN.");
bullet("src/core/standard/battalion.ts — soberanos das linhas hierro (Pedro) e corona (Trinnity).");
bullet("agents/registry.json — comandantes Pedro (expansão) e Trinnity (evolução), 5 squads, 25 agentes.");

section(3, "PLATAFORMA CODE — OPERAR E CRIAR VISERON");
bullet("WebOS → ícone CODE (http://localhost:3000/dashboard.html).");
bullet("Console: status, agents, blueprints, create <Nome> <Rol>, run <id> <tarefa>.");
bullet("Criar VISERON: 7 blueprints prontos ou configuração custom (nome, rol, capacidades, prompt).");
bullet("Apps LLM: 8 aplicações inspiradas em awesome-llm-apps (Deep Research, Local RAG, Mixture of Agents, Multi-Agent Team, Self-Evolving, Always-On Briefing, Voice RAG, Generative UI).");

section(4, "MONITORIZAÇÃO AIOX");
bullet("GET /api/code/aiox — nível de conhecimento AIOX, cérebro de Pedro/Trinnity, memória STM/LTM.");
bullet("AutoLearningEngine — ciclo de aprendizagem a cada 30 min, atualiza pedro_brain_state e trinnity_brain_state.");
bullet("AIOX Core Squad — 7 agentes (orchestrator, planner, evolver, learner, memory, provider, builder).");
bullet("Auditoria: npm run audit:arkom — squads AIOX-1..5 com veredito GO/NO-GO.");
bullet("Memória: categoria AIOX_EXPERIENCE com a base de conhecimento de 50 anos de inteligência coletiva.");

section(5, "REFERÊNCIA DE INSPIRAÇÃO");
bullet("Catálogo de apps LLM inspirado em https://github.com/Shubhamsaboo/awesome-llm-apps (Apache-2.0).");
bullet("A implementação em TVS é própria (TypeScript/Node); o conteúdo original das skills preserva source e license no frontmatter.");

doc.font("Helvetica-Bold").fontSize(11).fillColor("#bf5af2").text("— Pedro Costa, Comandante Supremo · Trinnity Hurtado, Rainha & Arquiteta Chefe —", MARGIN, PAGE_H - 90, { align: "center", width: PAGE_W - MARGIN * 2 });
doc.font("Helvetica").fontSize(8).fillColor("#6a6a8a").text("Trinnity Viseron System v5.0 · gerado automaticamente", MARGIN, PAGE_H - 70, { align: "center", width: PAGE_W - MARGIN * 2 });

doc.end();
const stream = fs.createWriteStream(OUT_FILE);
doc.pipe(stream);
stream.on("finish", () => {
  console.log(`PDF gerado: ${OUT_FILE}`);
});
