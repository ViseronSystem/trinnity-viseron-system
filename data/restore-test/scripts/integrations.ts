import * as fs from "fs-extra";
import * as path from "path";
import { skillsRegistry, SKILL_SOURCES, VENDOR_DIR } from "../src/core/skills";

/**
 * Viseron Integrations CLI v1.0
 * Estado das integrações externas (skills + repositórios do ecossistema TVS).
 *   npm run integrations        -> status geral
 *   npm run integrations:status -> status geral
 *   npm run integrations:ecc    -> detalhe ECC (harness system)
 *   npm run integrations:loop   -> detalhe Loop Engineering (patterns/starters)
 *   npm run integrations:crm    -> detalhe Comp AI CRM
 *   npm run integrations:comp   -> detalhe Comp AI (compliance)
 *   npm run integrations:tutor  -> detalhe DeepTutor
 */

const INTEGRATIONS = [
  {
    id: "graphify",
    name: "Graphify",
    repo: "https://github.com/Graphify-Labs/graphify",
    license: "MIT",
    where: ".opencode/skills/graphify + graphify-out/",
    desc: "Knowledge graph operativo do TVS (query/path/explain).",
    local: () => fs.existsSync(path.resolve(process.cwd(), ".opencode", "skills", "graphify", "SKILL.md")),
  },
  {
    id: "claude-plugins-official",
    name: "Claude Plugins Official",
    repo: "https://github.com/anthropics/claude-plugins-official",
    license: "Apache-2.0",
    where: "skills/vendor/claude-plugins-official",
    desc: "Plugin skills oficiais da Anthropic (plugin-dev, mcp-integration...).",
    local: () => fs.existsSync(path.join(VENDOR_DIR, "claude-plugins-official")),
  },
  {
    id: "awesome-claude-skills",
    name: "Awesome Claude Skills",
    repo: "https://github.com/ComposioHQ/awesome-claude-skills",
    license: "Apache-2.0",
    where: "skills/vendor/awesome-claude-skills",
    desc: "Coleção da comunidade (864 skills de produtividade/marketing).",
    local: () => fs.existsSync(path.join(VENDOR_DIR, "awesome-claude-skills")),
  },
  {
    id: "ecc",
    name: "ECC",
    repo: "https://github.com/affaan-m/ECC",
    license: "MIT",
    where: "skills/vendor/ecc",
    desc: "Harness OS: 67 agents + 284+ skills + hooks + memória + AgentShield.",
    local: () => fs.existsSync(path.join(VENDOR_DIR, "ecc")),
  },
  {
    id: "superpowers",
    name: "Superpowers",
    repo: "https://github.com/obra/superpowers",
    license: "MIT",
    where: "skills/vendor/superpowers",
    desc: "Skill system multi-harness (Claude/Codex/opencode/cursor).",
    local: () => fs.existsSync(path.join(VENDOR_DIR, "superpowers")),
  },
  {
    id: "comp-crm",
    name: "Comp AI CRM",
    repo: "https://github.com/trycompai/crm",
    license: "MIT",
    where: "skills/vendor/comp-crm",
    desc: "CRM agentic-first (agente de pesquisa autónomo por contacto/deal).",
    local: () => fs.existsSync(path.join(VENDOR_DIR, "comp-crm")),
  },
  {
    id: "comp-ai",
    name: "Comp AI",
    repo: "https://github.com/trycompai/comp",
    license: "AGPL-3.0",
    where: "skills/vendor/comp-ai",
    desc: "Plataforma de compliance (SOC 2 / GDPR / ISO 27001) — alternativa Vanta/Drata.",
    local: () => fs.existsSync(path.join(VENDOR_DIR, "comp-ai")),
  },
  {
    id: "deeptutor",
    name: "DeepTutor",
    repo: "https://github.com/HKUDS/DeepTutor",
    license: "Apache-2.0",
    where: "skills/vendor/deeptutor",
    desc: "Tutor lifelong personalizado (memória L1/L2/L3 + RAG multi-engine).",
    local: () => fs.existsSync(path.join(VENDOR_DIR, "deeptutor")),
  },
  {
    id: "loop-engineering",
    name: "Loop Engineering",
    repo: "https://github.com/cobusgreyling/loop-engineering",
    license: "MIT",
    where: "skills/vendor/loop-engineering",
    desc: "Design de loops: patterns + starters + loop-audit/init/cost.",
    local: () => fs.existsSync(path.join(VENDOR_DIR, "loop-engineering")),
  },
];

function box(title: string): void {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log(`║  ${title}`);
  console.log("╚══════════════════════════════════════════════════════════╝");
}

async function statusAll(): Promise<void> {
  box("INTEGRAÇÕES — ECOSSISTEMA TVS (9 repositórios + skills)");
  const stats = await skillsRegistry.stats();
  console.log(`Skills indexadas: ${stats.total} em ${stats.sources.length} coleções`);
  console.log("");
  console.log("REPOSITÓRIOS INTEGRADOS:");
  for (const it of INTEGRATIONS) {
    const present = it.local() ? "✓" : "✗ (npm run skills:install)";
    const count = stats.sources.find((s) => s.name === it.id)?.count;
    console.log(`  [${present}] ${it.name.padEnd(24)} ${it.license.padEnd(12)} skills=${count ?? "-"}  ${it.repo}`);
  }
  console.log("");
  console.log("SKILL SOURCES (registry):");
  for (const s of SKILL_SOURCES) {
    console.log(`  - ${s.name.padEnd(24)} ${s.license.padEnd(12)} ${s.repoUrl}`);
  }
  console.log("");
  console.log("Comandos novos: npm run ecc:setup · loop:init · loop:doctor · loop:audit ·");
  console.log("                npm run loop:cost · tutor:deeptutor · integrations:ecc/loop/crm/comp/tutor");
}

function showEcc(): void {
  box("ECC — AGENT HARNESS OPERATING SYSTEM (affaan-m/ECC)");
  console.log("67 agents · 284+ skills · hooks · memória · regras · AgentShield (MIT)");
  console.log("");
  console.log("Instalado em: skills/vendor/ecc (indexado no SkillsRegistry)");
  console.log("");
  console.log("Para ativar no harness opencode (instalador oficial, opcional):");
  console.log("  cd skills/vendor/ecc");
  console.log("  npm install");
  console.log("  npm run build:opencode");
  console.log("  powershell -ExecutionPolicy Bypass -File install.ps1 --profile full --target opencode");
  console.log("");
  console.log("Ou via npm:  npx ecc-universal install --guided");
  console.log("Consulta:    npx ecc-universal consult \"security reviews\" --target opencode");
  console.log("Nota: instalador escreve nos .opencode/ do projeto — correr só com autorização do Comandante.");
}

function showLoop(): void {
  box("LOOP ENGINEERING — cobusgreyling/loop-engineering");
  console.log("Design the loop, don't prompt the agent. 7 patterns + starters (MIT).");
  console.log("");
  console.log("Patterns: daily-triage · pr-babysitter · ci-sweeper · dependency-sweeper ·");
  console.log("          changelog-drafter · post-merge-cleanup · issue-triage");
  console.log("");
  console.log("Comandos TVS:  npm run loop:init    -> npx @cobusgreyling/loop init .");
  console.log("               npm run loop:doctor  -> npx @cobusgreyling/loop doctor .");
  console.log("               npm run loop:audit   -> npx @cobusgreyling/loop audit .");
  console.log("               npm run loop:cost    -> npx @cobusgreyling/loop-cost");
}

function showCrm(): void {
  box("COMP AI CRM — trycompai/crm (agentic-first CRM)");
  console.log("CRM onde o AGENTE mantém as notas: pesquisa autónoma por contacto/deal (MIT).");
  console.log("");
  console.log("Skills do agente (skills/vendor/comp-crm/.agents/skills/):");
  console.log("  evidence.md · identity-matching.md · data-boundaries.md · writing-a-brief.md");
  console.log("");
  console.log("Arquitetura: apps/agent (eve) · apps/app (Next.js) · apps/api (NestJS) · Postgres.");
  console.log("Run local:   git clone + bun install + docker compose up -d + bun run dev (:3000/:3001)");
  console.log("Integração TVS: a agência (Agency OS) e o Comp CRM partilham a lógica de contactos/leads.");
}

function showComp(): void {
  box("COMP AI — trycompai/comp (compliance AI-native)");
  console.log("Plataforma de compliance SOC 2 / GDPR / ISO 27001 — alternativa Vanta/Drata (AGPL-3.0).");
  console.log("");
  console.log("Skills indexadas: skills/vendor/comp-ai (53 skills de auditoria/compliance).");
  console.log("");
  console.log("Relevância TVS: o OMEGA (Audit/AIOX) e o Compliance OS podem reutilizar os playbooks.");
}

function showTutor(): void {
  box("DEEPTUTOR — HKUDS/DeepTutor (lifelong personalized tutoring)");
  console.log("Workspace de aprendizagem agente-native: chat/quiz/research/visualize/solve/mastery (Apache-2.0).");
  console.log("");
  console.log("Memória L1/L2/L3 · RAG multi-engine (LlamaIndex/PageIndex/GraphRAG/LightRAG) · 101 CLI apps.");
  console.log("");
  console.log("Run (Docker):  npm run tutor:deeptutor   -> ghcr.io/hkuds/deeptutor:latest em :3782");
  console.log("Run (PyPI):    pip install -U deeptutor && deeptutor init && deeptutor start");
  console.log("Complementa o ATLAS (tutor de inglês do TVS) com aprendizagem lifelong multi-domínio.");
}

const command = process.argv[2] || "status";

async function main(): Promise<void> {
  switch (command) {
    case "ecc":
      showEcc();
      break;
    case "loop":
      showLoop();
      break;
    case "crm":
      showCrm();
      break;
    case "comp":
      showComp();
      break;
    case "tutor":
      showTutor();
      break;
    case "status":
    default:
      await statusAll();
      break;
  }
}

main().catch((e) => {
  console.error("[Integrations] Erro:", e.message || e);
  process.exit(1);
});
