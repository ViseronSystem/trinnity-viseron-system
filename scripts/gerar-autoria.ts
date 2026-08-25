// TVS - Certificado de Autoría e Monitorización AIOX (PDF)
// Uso: node scripts/gerar-autoria.ts
const fs = require("fs-extra");
const path = require("path");
const { createTheme } = require("./pdf-theme");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(OUT_DIR, "Viseron_Certificado_Autoria_AIOX.pdf");
fs.ensureDirSync(OUT_DIR);

const t = createTheme({
  title: "Certificado de Autoria e Monitorização AIOX",
  subject: "Trinnity Viseron System v7.0 — Consolidação da autoria e do domínio operativo.",
});

t.cover({
  title: "CERTIFICADO DE AUTORIA\nE MONITORIZAÇÃO AIOX",
  subtitle: "Trinnity Viseron System v7.0 — Consolidação da autoria e do domínio operativo.",
  badges: ["AIOX", "TVS v7.0", "Autoria"],
  version: "5.0",
});

t.section("1", "AUTORES E DONOS DO SISTEMA");
t.para("Os únicos autores e donos do Trinnity Viseron System, com autoridade de criação:", 10, "#2a2a3a");
t.bullet("▸", "Pedro Costa — Comandante Supremo — clearance: tvs_creator · autoridade absoluta · criação · acesso ilimitado");
t.bullet("▸", "Trinnity Hurtado — Rainha & Arquiteta Chefe — clearance: tvs_architect · soberania técnica · arquitetura de IA");

t.section("2", "ONDE A AUTORIA ESTÁ MATERIALIZADA NO CÓDIGO");
t.bullet("▸", "src/core/leadership/CommandChain.ts — Pedro → tvs_creator, Trinnity → tvs_architect.");
t.bullet("▸", "src/core/squads/SquadManager.ts — líderes com todos os SYSTEM_ADMIN.");
t.bullet("▸", "src/core/standard/battalion.ts — soberanos das linhas hierro (Pedro) e corona (Trinnity).");
t.bullet("▸", "agents/registry.json — comandantes Pedro (expansão) e Trinnity (evolução), 5 squads, 25 agentes.");

t.section("3", "PLATAFORMA CODE — OPERAR E CRIAR VISERON");
t.bullet("▸", "WebOS → ícone CODE (http://localhost:3000/dashboard.html).");
t.bullet("▸", "Console: status, agents, blueprints, create <Nome> <Rol>, run <id> <tarefa>.");
t.bullet("▸", "Criar VISERON: 7 blueprints prontos ou configuração custom (nome, rol, capacidades, prompt).");
t.bullet("▸", "Apps LLM: 8 aplicações inspiradas em awesome-llm-apps (Deep Research, Local RAG, Mixture of Agents, Multi-Agent Team, Self-Evolving, Always-On Briefing, Voice RAG, Generative UI).");

t.section("4", "MONITORIZAÇÃO AIOX");
t.bullet("▸", "GET /api/code/aiox — nível de conhecimento AIOX, cérebro de Pedro/Trinnity, memória STM/LTM.");
t.bullet("▸", "AutoLearningEngine — ciclo de aprendizagem a cada 30 min, atualiza pedro_brain_state e trinnity_brain_state.");
t.bullet("▸", "AIOX Core Squad — 7 agentes (orchestrator, planner, evolver, learner, memory, provider, builder).");
t.bullet("▸", "Auditoria: npm run audit:arkom — squads AIOX-1..5 com veredito GO/NO-GO.");
t.bullet("▸", "Memória: categoria AIOX_EXPERIENCE com a base de conhecimento de 50 anos de inteligência coletiva.");

t.section("5", "REFERÊNCIA DE INSPIRAÇÃO");
t.bullet("▸", "Catálogo de apps LLM inspirado em https://github.com/Shubhamsaboo/awesome-llm-apps (Apache-2.0).");
t.bullet("▸", "A implementação em TVS é própria (TypeScript/Node); o conteúdo original das skills preserva source e license no frontmatter.");

t.spacer(2);
t.para("— Pedro Costa, Comandante Supremo · Trinnity Hurtado, Rainha & Arquiteta Chefe —", 11, "#7c3aed", { align: "center" });
t.para("Trinnity Viseron System v7.0 · gerado automaticamente", 8, "#6a6a8a", { align: "center" });

t.finish(OUT_FILE);
console.log(`PDF gerado: ${OUT_FILE}`);
