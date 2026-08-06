#!/usr/bin/env tsx
/**
 * TVS AEOS SUITE — Gerador de 15 PDFs (5 documentos x PT/EN/ES)
 * Orquestrado por Pedro Costa (Comandante) e Trinnity Hurtado (Rainha), com Squads AIOX.
 *
 * Documentos:
 *  1. Cofre de Acesso (senhas, comandos, logins de todas as plataformas)
 *  2. Arquitetura e Grafos do Sistema Operativo
 *  3. Manual de Implementação e Uso de Comandos
 *  4. Mapa da Riqueza (gerar os milhões semanais)
 *  5. Pitch para Investidores (o que realmente é a VISERON TVS)
 *
 * Uso: npx tsx scripts/gerar-suite-aeos.ts
 * Saída: data/AEOS_<topic>_<LANG>.pdf
 */
import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data");
fs.mkdirSync(OUT, { recursive: true });

type Lang = "PT" | "EN" | "ES";
const LANGS: Lang[] = ["PT", "EN", "ES"];
const LANG_NAME: Record<Lang, string> = { PT: "Português", EN: "English", ES: "Español" };

/* ============================== DADOS REAIS ============================== */

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function loadScripts(): Record<string, string> {
  const p = path.join(ROOT, "package.json");
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf8")).scripts || {};
}

const ENV = loadEnv();
const SCRIPTS = loadScripts();

/* ============================== RENDERER ============================== */

type Block =
  | { t: "h1"; x: string }
  | { t: "h2"; x: string }
  | { t: "p"; x: string }
  | { t: "li"; x: string }
  | { t: "code"; x: string }
  | { t: "kv"; k: string; v: string }
  | { t: "page" };

interface DocOpts {
  title: string;
  subtitle: string;
  langName: string;
  blocks: Block[];
}

function renderPDF(file: string, opts: DocOpts): Promise<void> {
  const t = createTheme({ title: opts.title, subject: `AEOS Suite — ${opts.langName}` });
  t.cover({
    title: opts.title,
    subtitle: opts.subtitle,
    badges: [opts.langName, "AEOS Suite", "TVS v5.0"],
    date: new Date().toLocaleDateString("pt-PT"),
    version: "5.0",
    url: "www.trinnityviseronsystem.io",
  });

  const headNum = (h: string): string | null => {
    const m = h.match(/^(\d+)\.\s+(.*)$/);
    return m ? m[1] : null;
  };
  const headText = (h: string): string => {
    const m = h.match(/^(\d+)\.\s+(.*)$/);
    return m ? m[2] : h;
  };

  const renderCode = (text: string) => {
    const lines = text.split("\n");
    const isTree = lines.some((l) => /[├└│]/.test(l));
    if (isTree) {
      for (const ln of lines) t.para(ln, 9, "#334155");
      return;
    }
    for (const ln of lines) {
      if (ln.length <= 64) t.code(ln);
      else t.para(ln, 9.5, "#0f172a");
    }
  };

  for (const b of opts.blocks) {
    if (b.t === "page") { t.doc.addPage(); continue; }
    if (b.t === "h1" || b.t === "h2") {
      const n = headNum(b.x);
      if (n) t.section(n, headText(b.x));
      else t.sub(b.x);
    } else if (b.t === "p") {
      t.para(b.x, 10.5);
    } else if (b.t === "li") {
      t.bullet("▸", b.x);
    } else if (b.t === "code") {
      renderCode(b.x);
    } else if (b.t === "kv") {
      t.kv(b.k, b.v);
    }
  }

  t.finish(file);
  console.log("  [PDF] " + path.basename(file));
  return Promise.resolve();
}

/* ============================== CONTEÚDO ============================== */

const t_access: Record<Lang, { title: string; intro: string }> = {
  PT: { title: "Cofre de Acesso — VISERON TVS", intro: "Todas as senhas, comandos e logins de todas as plataformas do ecossistema. Documento CONFIDENCIAL (não versionado)." },
  EN: { title: "Access Vault — VISERON TVS", intro: "All passwords, commands and logins of every platform in the ecosystem. CONFIDENTIAL document (not versioned)." },
  ES: { title: "Cofre de Acceso — VISERON TVS", intro: "Todas las contraseñas, comandos y accesos de todas las plataformas del ecosistema. Documento CONFIDENCIAL (no versionado)." },
};

const t_arch: Record<Lang, string> = {
  PT: "Arquitetura e Grafos do Sistema Operativo",
  EN: "Architecture & Graphs of the Operating System",
  ES: "Arquitectura y Grafos del Sistema Operativo",
};

const t_manual: Record<Lang, string> = {
  PT: "Manual de Implementação e Uso de Comandos",
  EN: "Implementation & Command Usage Manual",
  ES: "Manual de Implementación y Uso de Comandos",
};

const t_wealth: Record<Lang, string> = {
  PT: "Mapa da Riqueza — Gerar os Milhões Semanais",
  EN: "Wealth Map — Generating Weekly Millions",
  ES: "Mapa de la Riqueza — Generar Millones Semanales",
};

const t_pitch: Record<Lang, string> = {
  PT: "Pitch para Investidores — VISERON TVS",
  EN: "Investor Pitch — VISERON TVS",
  ES: "Pitch para Inversores — VISERON TVS",
};

/* ---------- Documento 1: Cofre ---------- */
function buildAccess(env: Record<string, string>, scripts: Record<string, string>): Record<Lang, Block[]> {
  const envRows = Object.entries(env).filter(([k]) => !/SECRET|PASSWORD|TOKEN|KEY/i.test(k));
  const secretRows = Object.entries(env).filter(([k]) => /SECRET|PASSWORD|TOKEN|KEY/i.test(k));
  const cmdRows = Object.entries(scripts).map(([k, v]) => ({ k, v }));

  const core: Record<Lang, Block[]> = {
    PT: [
      { t: "p", x: "Segue o inventário completo de acesso ao ecossistema TVS. Manter fora do git e partilhar apenas com a equipa autorizada." },
      { t: "h2", x: "1. Plataformas e Logins" },
      { t: "kv", k: "GitHub", v: "https://github.com/ViseronSystem/trinnity-viseron-system" },
      { t: "kv", k: "OmniRoute (Dashboard)", v: "http://localhost:20128 — login com password (ver abaixo)" },
      { t: "kv", k: "n8n (Workflow)", v: "http://localhost:5678 — admin / viseron" },
      { t: "kv", k: "TVS Dashboard", v: "http://localhost:3000" },
      { t: "kv", k: "ReportServer", v: "http://localhost:3001" },
      { t: "kv", k: "ViseronWeb", v: "http://localhost:32123" },
      { t: "kv", k: "Domínios", v: "trinnityviseron.com · trinnityviseronsystem.io" },
      { t: "kv", k: "Ollama local", v: "http://localhost:11434 — modelo qwen2.5:3b" },
    ],
    EN: [
      { t: "p", x: "Complete access inventory for the TVS ecosystem. Keep out of git; share only with authorized team." },
      { t: "h2", x: "1. Platforms & Logins" },
      { t: "kv", k: "GitHub", v: "https://github.com/ViseronSystem/trinnity-viseron-system" },
      { t: "kv", k: "OmniRoute (Dashboard)", v: "http://localhost:20128 — login with password (below)" },
      { t: "kv", k: "n8n (Workflow)", v: "http://localhost:5678 — admin / viseron" },
      { t: "kv", k: "TVS Dashboard", v: "http://localhost:3000" },
      { t: "kv", k: "ReportServer", v: "http://localhost:3001" },
      { t: "kv", k: "ViseronWeb", v: "http://localhost:32123" },
      { t: "kv", k: "Domains", v: "trinnityviseron.com · trinnityviseronsystem.io" },
      { t: "kv", k: "Local Ollama", v: "http://localhost:11434 — model qwen2.5:3b" },
    ],
    ES: [
      { t: "p", x: "Inventario completo de acceso al ecosistema TVS. Mantener fuera de git; compartir solo con el equipo autorizado." },
      { t: "h2", x: "1. Plataformas y Accesos" },
      { t: "kv", k: "GitHub", v: "https://github.com/ViseronSystem/trinnity-viseron-system" },
      { t: "kv", k: "OmniRoute (Dashboard)", v: "http://localhost:20128 — login con contraseña (abajo)" },
      { t: "kv", k: "n8n (Workflow)", v: "http://localhost:5678 — admin / viseron" },
      { t: "kv", k: "TVS Dashboard", v: "http://localhost:3000" },
      { t: "kv", k: "ReportServer", v: "http://localhost:3001" },
      { t: "kv", k: "ViseronWeb", v: "http://localhost:32123" },
      { t: "kv", k: "Dominios", v: "trinnityviseron.com · trinnityviseronsystem.io" },
      { t: "kv", k: "Ollama local", v: "http://localhost:11434 — modelo qwen2.5:3b" },
    ],
  };

  const secretsBlocks = (lang: Lang): Block[] => {
    const head: Block[] = [
      { t: "h2", x: lang === "PT" ? "2. Credenciais (ambiente .env)" : lang === "EN" ? "2. Credentials (.env environment)" : "2. Credenciales (entorno .env)" },
      { t: "p", x: lang === "PT" ? "As chaves sensíveis estão listadas abaixo. O ficheiro .env não é versionado." : lang === "EN" ? "Sensitive keys are listed below. The .env file is not versioned." : "Las claves sensibles se listan abajo. El archivo .env no está versionado." },
    ];
    if (secretRows.length === 0) head.push({ t: "li", x: lang === "PT" ? "(sem chaves sensíveis detetadas)" : lang === "EN" ? "(no sensitive keys detected)" : "(sin claves sensibles detectadas)" } as Block);
    for (const [k, v] of secretRows) head.push({ t: "kv", k, v } as Block);
    return head;
  };

  const envBlocks = (lang: Lang): Block[] => {
    const head: Block[] = [
      { t: "h2", x: lang === "PT" ? "3. Variáveis de ambiente (não sensíveis)" : lang === "EN" ? "3. Environment variables (non-sensitive)" : "3. Variables de entorno (no sensibles)" },
    ];
    if (envRows.length === 0) head.push({ t: "li", x: "(vazio / empty / vacío)" } as Block);
    for (const [k, v] of envRows) head.push({ t: "kv", k, v } as Block);
    return head;
  };

  const cmdBlocks = (lang: Lang): Block[] => [
    { t: "h2", x: lang === "PT" ? "4. Comandos (npm run ...)" : lang === "EN" ? "4. Commands (npm run ...)" : "4. Comandos (npm run ...)" },
  ].concat(cmdRows.slice(0, 90).map(({ k, v }) => ({ t: "kv", k: "npm run " + k, v } as Block)));

  const out: Record<Lang, Block[]> = { PT: [], EN: [], ES: [] };
  for (const lang of LANGS) {
    out[lang] = [
      { t: "p", x: t_access[lang].intro },
      ...core[lang],
      ...secretsBlocks(lang),
      ...envBlocks(lang),
      ...cmdBlocks(lang),
    ];
  }
  return out;
}

/* ---------- Documento 2: Arquitetura ---------- */
const archBlocks: Record<Lang, Block[]> = {
  PT: [
    { t: "h2", x: "1. Visão Geral" },
    { t: "p", x: "TVS é um Sistema Operativo Empresarial Autónomo (AEOS): 5.000+ mentes, 246 arquétipos, batalhão de 114 agentes, esquadrões por departamento e um gateway de 290+ providers de IA." },
    { t: "h2", x: "2. Sequência de Arranque (src/index.ts)" },
    { t: "li", x: "Núcleo: architect/dev/security agents + squads" },
    { t: "li", x: "N8NBridge (porta 5678) — 5 templates de workflow" },
    { t: "li", x: "spawnAllMinds() → 5.000 agentes" },
    { t: "li", x: "spawnAllArchetypes() → 246 agentes arch_*" },
    { t: "li", x: "SuperMind + SuperIntelligence (ensemble, 4 domínios)" },
    { t: "li", x: "CommandChain: SUPERINTELIGENCIA + EVOLUCIÓN HIPER" },
    { t: "li", x: "TokenEngine $TRIN + $VSR (300M, Proof-of-Mandate)" },
    { t: "li", x: "ReportServer (3001) + SuperIntegration (7 módulos)" },
    { t: "li", x: "Servidores: Dashboard 3000 · ViseronWeb 32123 · Terminal" },
    { t: "h2", x: "3. Subsistemas Núcleo (src/core/)" },
    { t: "li", x: "AgentManager · ModelRouter · MemoryEngine · ToolManager · ProviderFactory (6 providers) · SquadManager · MCPServer" },
    { t: "li", x: "AgentFactory (8 blueprints) · AgentSpawner · BusinessSolutionEngine · WebAppGenerator (9 tipos x 5 frameworks)" },
    { t: "li", x: "SuperMind (10 eras) · SuperIntelligence · HyperLearning (x6/30min) · AutoEvolution (25 capacidades) · AutonomousPlanner" },
    { t: "li", x: "CommandChain · BattalionRegistry (114) · DirectiveEngine (dupla-assinatura) · VoiceBridge · AICommunityPlatform" },
    { t: "h2", x: "4. Grafo de Agentes" },
    { t: "code", x: "CommandChain: Pedro Costa (Comandante Supremo) / Trinnity Hurtado (Rainha)\n  ├─ squad_executive\n  ├─ squad_architecture (Trinnity + architect + developer + security)\n  ├─ Batalhão 114 (corona 59 / hierro 57) → 114 squads de linhagem\n  ├─ 5.000 Minds → AgentSpawner → 5.000 agentes\n  └─ 246 Archetypes → arch_* (mitológicos 51, bíblicos 57, clássicos 38,\n     futuristas 31, anticristo 30, modernos 14, medievais 13, renascença 12)" },
    { t: "h2", x: "5. Grafo de Memória e Conhecimento" },
    { t: "code", x: "MemoryEngine: STM → LTM → Knowledge → Qdrant (semântico)\n  ├─ AutoLearning: consolidação STM→LTM a cada 30 min\n  ├─ HyperLearning: inteligência base 1000, x6 cada 30 min\n  └─ AutoEvolution: ganho de conhecimento 0.01–0.05, pool de polinização 120" },
    { t: "h2", x: "6. Grafo de Integrações e Portas" },
    { t: "kv", k: "3000", v: "TVS Dashboard" },
    { t: "kv", k: "3001", v: "ReportServer (PDF)" },
    { t: "kv", k: "5678", v: "n8n workflow engine" },
    { t: "kv", k: "32123", v: "ViseronWeb" },
    { t: "kv", k: "20128", v: "OmniRoute AI Gateway (290+ providers)" },
    { t: "kv", k: "Módulos", v: "Viseron Apps · TVS Tools · OmniRoute · Call System · OpenJarvis · ASNO · n8n" },
    { t: "h2", x: "7. Superfície API (Express, sob /api)" },
    { t: "li", x: "auth (6) · billing (4, Avirato/Stripe) · onboarding (3) · email (7) · messaging (10, x25519+aes-256-gcm) · jarvis (2, 13 intents) · revenue (2) · blog (8) · health/metrics" },
    { t: "h2", x: "8. Grafo Empresarial, Financeiro e de Clientes" },
    { t: "code", x: "CEO/CTO (Pedro/Trinnity) → COO · Sales · Marketing · Legal · RH · Finanças · I&D · Segurança · Infra · DevOps · Suporte\nBilling: Core €29 · Pro €99 · Enterprise €499 (trial 14 dias) → Avirato | Stripe | manual\nTokens: $TRIN + $VSR (300M) · Community: Free/Premium/VIP/Admin\nTenant → Owner → Members → Workspace agents (ag_{slug}_{name}) · Waitlist · Marketplace (roadmap)" },
  ],
  EN: [
    { t: "h2", x: "1. Overview" },
    { t: "p", x: "TVS is an Autonomous Enterprise Operating System (AEOS): 5,000+ minds, 246 archetypes, a 114-agent battalion, per-department squads, and an AI gateway of 290+ providers." },
    { t: "h2", x: "2. Boot Sequence (src/index.ts)" },
    { t: "li", x: "Core: architect/dev/security agents + squads" },
    { t: "li", x: "N8NBridge (port 5678) — 5 workflow templates" },
    { t: "li", x: "spawnAllMinds() → 5,000 agents" },
    { t: "li", x: "spawnAllArchetypes() → 246 arch_* agents" },
    { t: "li", x: "SuperMind + SuperIntelligence (ensemble, 4 domains)" },
    { t: "li", x: "CommandChain: SUPERINTELLIGENCE + HYPER EVOLUTION" },
    { t: "li", x: "TokenEngine $TRIN + $VSR (300M, Proof-of-Mandate)" },
    { t: "li", x: "ReportServer (3001) + SuperIntegration (7 modules)" },
    { t: "li", x: "Servers: Dashboard 3000 · ViseronWeb 32123 · Terminal" },
    { t: "h2", x: "3. Core Subsystems (src/core/)" },
    { t: "li", x: "AgentManager · ModelRouter · MemoryEngine · ToolManager · ProviderFactory (6 providers) · SquadManager · MCPServer" },
    { t: "li", x: "AgentFactory (8 blueprints) · AgentSpawner · BusinessSolutionEngine · WebAppGenerator (9 types x 5 frameworks)" },
    { t: "li", x: "SuperMind (10 eras) · SuperIntelligence · HyperLearning (x6/30min) · AutoEvolution (25 capabilities) · AutonomousPlanner" },
    { t: "li", x: "CommandChain · BattalionRegistry (114) · DirectiveEngine (dual-signature) · VoiceBridge · AICommunityPlatform" },
    { t: "h2", x: "4. Agent Graph" },
    { t: "code", x: "CommandChain: Pedro Costa (Supreme Commander) / Trinnity Hurtado (Queen)\n  ├─ squad_executive\n  ├─ squad_architecture (Trinnity + architect + developer + security)\n  ├─ Battalion 114 (corona 59 / hierro 57) → 114 lineage squads\n  ├─ 5,000 Minds → AgentSpawner → 5,000 agents\n  └─ 246 Archetypes → arch_* (mythological 51, biblical 57, classical 38,\n     futuristic 31, antichrist 30, modern 14, medieval 13, renaissance 12)" },
    { t: "h2", x: "5. Memory & Knowledge Graph" },
    { t: "code", x: "MemoryEngine: STM → LTM → Knowledge → Qdrant (semantic)\n  ├─ AutoLearning: STM→LTM consolidation every 30 min\n  ├─ HyperLearning: intelligence base 1000, x6 every 30 min\n  └─ AutoEvolution: knowledge gain 0.01–0.05, pollination pool 120" },
    { t: "h2", x: "6. Integration Graph & Ports" },
    { t: "kv", k: "3000", v: "TVS Dashboard" },
    { t: "kv", k: "3001", v: "ReportServer (PDF)" },
    { t: "kv", k: "5678", v: "n8n workflow engine" },
    { t: "kv", k: "32123", v: "ViseronWeb" },
    { t: "kv", k: "20128", v: "OmniRoute AI Gateway (290+ providers)" },
    { t: "kv", k: "Modules", v: "Viseron Apps · TVS Tools · OmniRoute · Call System · OpenJarvis · ASNO · n8n" },
    { t: "h2", x: "7. API Surface (Express, under /api)" },
    { t: "li", x: "auth (6) · billing (4, Avirato/Stripe) · onboarding (3) · email (7) · messaging (10, x25519+aes-256-gcm) · jarvis (2, 13 intents) · revenue (2) · blog (8) · health/metrics" },
    { t: "h2", x: "8. Enterprise, Financial & Customer Graph" },
    { t: "code", x: "CEO/CTO (Pedro/Trinnity) → COO · Sales · Marketing · Legal · HR · Finance · R&D · Security · Infra · DevOps · Support\nBilling: Core €29 · Pro €99 · Enterprise €499 (14-day trial) → Avirato | Stripe | manual\nTokens: $TRIN + $VSR (300M) · Community: Free/Premium/VIP/Admin\nTenant → Owner → Members → Workspace agents (ag_{slug}_{name}) · Waitlist · Marketplace (roadmap)" },
  ],
  ES: [
    { t: "h2", x: "1. Visión General" },
    { t: "p", x: "TVS es un Sistema Operativo Empresarial Autónomo (AEOS): 5.000+ mentes, 246 arquetipos, batallón de 114 agentes, escuadrones por departamento y un gateway de 290+ proveedores de IA." },
    { t: "h2", x: "2. Secuencia de Arranque (src/index.ts)" },
    { t: "li", x: "Núcleo: agentes architect/dev/security + escuadrones" },
    { t: "li", x: "N8NBridge (puerto 5678) — 5 plantillas de workflow" },
    { t: "li", x: "spawnAllMinds() → 5.000 agentes" },
    { t: "li", x: "spawnAllArchetypes() → 246 agentes arch_*" },
    { t: "li", x: "SuperMind + SuperIntelligence (ensemble, 4 dominios)" },
    { t: "li", x: "CommandChain: SUPERINTELIGENCIA + EVOLUCIÓN HIPER" },
    { t: "li", x: "TokenEngine $TRIN + $VSR (300M, Proof-of-Mandate)" },
    { t: "li", x: "ReportServer (3001) + SuperIntegration (7 módulos)" },
    { t: "li", x: "Servidores: Dashboard 3000 · ViseronWeb 32123 · Terminal" },
    { t: "h2", x: "3. Subsistemas Núcleo (src/core/)" },
    { t: "li", x: "AgentManager · ModelRouter · MemoryEngine · ToolManager · ProviderFactory (6 providers) · SquadManager · MCPServer" },
    { t: "li", x: "AgentFactory (8 blueprints) · AgentSpawner · BusinessSolutionEngine · WebAppGenerator (9 tipos x 5 frameworks)" },
    { t: "li", x: "SuperMind (10 eras) · SuperIntelligence · HyperLearning (x6/30min) · AutoEvolution (25 capacidades) · AutonomousPlanner" },
    { t: "li", x: "CommandChain · BattalionRegistry (114) · DirectiveEngine (doble firma) · VoiceBridge · AICommunityPlatform" },
    { t: "h2", x: "4. Grafo de Agentes" },
    { t: "code", x: "CommandChain: Pedro Costa (Comandante Supremo) / Trinnity Hurtado (Reina)\n  ├─ squad_executive\n  ├─ squad_architecture (Trinnity + architect + developer + security)\n  ├─ Batallón 114 (corona 59 / hierro 57) → 114 escuadrones de linaje\n  ├─ 5.000 Minds → AgentSpawner → 5.000 agentes\n  └─ 246 Arquetipos → arch_* (mitológicos 51, bíblicos 57, clásicos 38,\n     futuristas 31, anticristo 30, modernos 14, medievales 13, renacimiento 12)" },
    { t: "h2", x: "5. Grafo de Memoria y Conocimiento" },
    { t: "code", x: "MemoryEngine: STM → LTM → Knowledge → Qdrant (semántico)\n  ├─ AutoLearning: consolidación STM→LTM cada 30 min\n  ├─ HyperLearning: inteligencia base 1000, x6 cada 30 min\n  └─ AutoEvolution: ganancia de conocimiento 0.01–0.05, pool de polinización 120" },
    { t: "h2", x: "6. Grafo de Integraciones y Puertos" },
    { t: "kv", k: "3000", v: "TVS Dashboard" },
    { t: "kv", k: "3001", v: "ReportServer (PDF)" },
    { t: "kv", k: "5678", v: "n8n workflow engine" },
    { t: "kv", k: "32123", v: "ViseronWeb" },
    { t: "kv", k: "20128", v: "OmniRoute AI Gateway (290+ providers)" },
    { t: "kv", k: "Módulos", v: "Viseron Apps · TVS Tools · OmniRoute · Call System · OpenJarvis · ASNO · n8n" },
    { t: "h2", x: "7. Superficie API (Express, bajo /api)" },
    { t: "li", x: "auth (6) · billing (4, Avirato/Stripe) · onboarding (3) · email (7) · messaging (10, x25519+aes-256-gcm) · jarvis (2, 13 intents) · revenue (2) · blog (8) · health/metrics" },
    { t: "h2", x: "8. Grafo Empresarial, Financiero y de Clientes" },
    { t: "code", x: "CEO/CTO (Pedro/Trinnity) → COO · Ventas · Marketing · Legal · RRHH · Finanzas · I+D · Seguridad · Infra · DevOps · Soporte\nBilling: Core €29 · Pro €99 · Enterprise €499 (trial 14 días) → Avirato | Stripe | manual\nTokens: $TRIN + $VSR (300M) · Community: Free/Premium/VIP/Admin\nTenant → Owner → Members → Workspace agents (ag_{slug}_{name}) · Waitlist · Marketplace (roadmap)" },
  ],
};

/* ---------- Documento 3: Manual ---------- */
const manualBlocks: Record<Lang, Block[]> = {
  PT: [
    { t: "h2", x: "1. Instalação e Arranque" },
    { t: "code", x: "npm install\nnpm run build\nnpm start" },
    { t: "li", x: "Dev com hot-reload: npm run dev" },
    { t: "li", x: "Modelos IA locais: npm run models:pull (Ollama qwen2.5:3b + 1.5b)" },
    { t: "li", x: "Instalação completa: npm run init / npm run init:full" },
    { t: "h2", x: "2. Testes e Qualidade" },
    { t: "code", x: "npm test          # core + web\nnpm run test:core\nnpm run test:web\nnpm run lint       # typecheck TypeScript" },
    { t: "h2", x: "3. Operação Diária" },
    { t: "kv", k: "npm run demo", v: "Demo operacional real (9 endpoints HTTP)" },
    { t: "kv", k: "npm run demo:jarvis", v: "Conversa + autonomia real do JARVIS" },
    { t: "kv", k: "npm run demo:email", v: "Fluxos de email (verify/reset/invoice/agent)" },
    { t: "kv", k: "npm run demo:messaging", v: "Mensageria E2E (contactos/grupos/leitura)" },
    { t: "kv", k: "npm run demo:avirato", v: "Checkout Avirato real (ex: -- core)" },
    { t: "h2", x: "4. Receita e Cobranças" },
    { t: "code", x: "npm run go-live:stripe    # criar 3 planos no Stripe\nnpm run docs:revenue      # pipeline de receita PDF\nnpm run revenue-ready     # via API GET /api/revenue/readiness" },
    { t: "li", x: "Plano Core €29 · Pro €99 · Enterprise €499 — webhook Avirato HMAC ou Stripe" },
    { t: "h2", x: "5. Documentação e PDFs" },
    { t: "code", x: "npm run pdfs:all       # regenerar TODOS os PDFs\nnpm run report:state    # relatório do estado\nnpm run report:update    # relatório de update\nnpm run docs:100         # 100 melhorias\nnpm run cofre            # cofre de credenciais (confidencial)" },
    { t: "h2", x: "6. Mobile, Desktop e Deploy" },
    { t: "code", x: "npm run build:android   # APK (Google Play)\nnpm run build:ios       # IPA (Apple Store)\nnpm run build:apk-installer  # Setup.exe Windows\nnpm run deploy          # GitHub + Vercel\nnpm run backup          # backup diário" },
    { t: "h2", x: "7. Endpoints Principais (API)" },
    { t: "code", x: "POST /api/auth/register · /login · GET /api/auth/me\nGET  /api/billing/plans · POST /api/billing/checkout · POST /api/billing/webhook\nPOST /api/onboarding/apply · GET /api/onboarding/templates\nPOST /api/jarvis/chat · GET /api/jarvis/status\nGET  /api/revenue/readiness · GET /api/ai/status\nPOST /api/messaging/key · contacts · conversations · groups · messages\nGET  /api/health · /api/metrics" },
    { t: "h2", x: "8. IA Real (Ollama local / OmniRoute)" },
    { t: "code", x: "Ollama:    http://localhost:11434  (qwen2.5:3b)\nOmniRoute: http://localhost:20128/v1 (modelo ollama-local/qwen2.5:3b)\nn8n:       http://localhost:5678 (admin / viseron)" },
  ],
  EN: [
    { t: "h2", x: "1. Installation & Startup" },
    { t: "code", x: "npm install\nnpm run build\nnpm start" },
    { t: "li", x: "Dev with hot-reload: npm run dev" },
    { t: "li", x: "Local AI models: npm run models:pull (Ollama qwen2.5:3b + 1.5b)" },
    { t: "li", x: "Full setup: npm run init / npm run init:full" },
    { t: "h2", x: "2. Tests & Quality" },
    { t: "code", x: "npm test          # core + web\nnpm run test:core\nnpm run test:web\nnpm run lint       # TypeScript typecheck" },
    { t: "h2", x: "3. Daily Operation" },
    { t: "kv", k: "npm run demo", v: "Real operational demo (9 HTTP endpoints)" },
    { t: "kv", k: "npm run demo:jarvis", v: "JARVIS conversation + real autonomy" },
    { t: "kv", k: "npm run demo:email", v: "Email flows (verify/reset/invoice/agent)" },
    { t: "kv", k: "npm run demo:messaging", v: "E2E messaging (contacts/groups/read)" },
    { t: "kv", k: "npm run demo:avirato", v: "Real Avirato checkout (ex: -- core)" },
    { t: "h2", x: "4. Revenue & Billing" },
    { t: "code", x: "npm run go-live:stripe    # create 3 Stripe plans\nnpm run docs:revenue      # revenue pipeline PDF\nnpm run revenue-ready     # via API GET /api/revenue/readiness" },
    { t: "li", x: "Core €29 · Pro €99 · Enterprise €499 — Avirato HMAC or Stripe webhook" },
    { t: "h2", x: "5. Documentation & PDFs" },
    { t: "code", x: "npm run pdfs:all       # regenerate ALL PDFs\nnpm run report:state    # system state report\nnpm run report:update   # update report\nnpm run docs:100        # 100 improvements\nnpm run cofre           # credentials vault (confidential)" },
    { t: "h2", x: "6. Mobile, Desktop & Deploy" },
    { t: "code", x: "npm run build:android   # APK (Google Play)\nnpm run build:ios       # IPA (Apple Store)\nnpm run build:apk-installer  # Setup.exe Windows\nnpm run deploy          # GitHub + Vercel\nnpm run backup          # daily backup" },
    { t: "h2", x: "7. Main API Endpoints" },
    { t: "code", x: "POST /api/auth/register · /login · GET /api/auth/me\nGET  /api/billing/plans · POST /api/billing/checkout · POST /api/billing/webhook\nPOST /api/onboarding/apply · GET /api/onboarding/templates\nPOST /api/jarvis/chat · GET /api/jarvis/status\nGET  /api/revenue/readiness · GET /api/ai/status\nPOST /api/messaging/key · contacts · conversations · groups · messages\nGET  /api/health · /api/metrics" },
    { t: "h2", x: "8. Real AI (local Ollama / OmniRoute)" },
    { t: "code", x: "Ollama:    http://localhost:11434  (qwen2.5:3b)\nOmniRoute: http://localhost:20128/v1 (model ollama-local/qwen2.5:3b)\nn8n:       http://localhost:5678 (admin / viseron)" },
  ],
  ES: [
    { t: "h2", x: "1. Instalación y Arranque" },
    { t: "code", x: "npm install\nnpm run build\nnpm start" },
    { t: "li", x: "Dev con hot-reload: npm run dev" },
    { t: "li", x: "Modelos IA locales: npm run models:pull (Ollama qwen2.5:3b + 1.5b)" },
    { t: "li", x: "Instalación completa: npm run init / npm run init:full" },
    { t: "h2", x: "2. Pruebas y Calidad" },
    { t: "code", x: "npm test          # core + web\nnpm run test:core\nnpm run test:web\nnpm run lint       # typecheck TypeScript" },
    { t: "h2", x: "3. Operación Diaria" },
    { t: "kv", k: "npm run demo", v: "Demo operacional real (9 endpoints HTTP)" },
    { t: "kv", k: "npm run demo:jarvis", v: "Conversación + autonomía real del JARVIS" },
    { t: "kv", k: "npm run demo:email", v: "Flujos de email (verify/reset/invoice/agent)" },
    { t: "kv", k: "npm run demo:messaging", v: "Mensajería E2E (contactos/grupos/lectura)" },
    { t: "kv", k: "npm run demo:avirato", v: "Checkout Avirato real (ex: -- core)" },
    { t: "h2", x: "4. Ingresos y Cobros" },
    { t: "code", x: "npm run go-live:stripe    # crear 3 planes en Stripe\nnpm run docs:revenue      # pipeline de ingresos PDF\nnpm run revenue-ready     # via API GET /api/revenue/readiness" },
    { t: "li", x: "Core €29 · Pro €99 · Enterprise €499 — webhook Avirato HMAC o Stripe" },
    { t: "h2", x: "5. Documentación y PDFs" },
    { t: "code", x: "npm run pdfs:all       # regenerar TODOS los PDFs\nnpm run report:state    # informe de estado\nnpm run report:update   # informe de actualización\nnpm run docs:100        # 100 mejoras\nnpm run cofre           # cofre de credenciales (confidencial)" },
    { t: "h2", x: "6. Mobile, Desktop y Deploy" },
    { t: "code", x: "npm run build:android   # APK (Google Play)\nnpm run build:ios       # IPA (Apple Store)\nnpm run build:apk-installer  # Setup.exe Windows\nnpm run deploy          # GitHub + Vercel\nnpm run backup          # backup diario" },
    { t: "h2", x: "7. Endpoints Principales (API)" },
    { t: "code", x: "POST /api/auth/register · /login · GET /api/auth/me\nGET  /api/billing/plans · POST /api/billing/checkout · POST /api/billing/webhook\nPOST /api/onboarding/apply · GET /api/onboarding/templates\nPOST /api/jarvis/chat · GET /api/jarvis/status\nGET  /api/revenue/readiness · GET /api/ai/status\nPOST /api/messaging/key · contacts · conversations · groups · messages\nGET  /api/health · /api/metrics" },
    { t: "h2", x: "8. IA Real (Ollama local / OmniRoute)" },
    { t: "code", x: "Ollama:    http://localhost:11434  (qwen2.5:3b)\nOmniRoute: http://localhost:20128/v1 (modelo ollama-local/qwen2.5:3b)\nn8n:       http://localhost:5678 (admin / viseron)" },
  ],
};

/* ---------- Documento 4: Mapa da Riqueza ---------- */
const wealthBlocks: Record<Lang, Block[]> = {
  PT: [
    { t: "h2", x: "1. Tese de Receita" },
    { t: "p", x: "TVS não vende chatbots — vende a infraestrutura sobre a qual se constroem as próximas empresas alimentadas por IA. Cada empresa autónoma criada em horas gera receita recorrente." },
    { t: "h2", x: "2. Fluxos de Receita" },
    { t: "li", x: "Subscrições SaaS: Core €29 · Pro €99 · Enterprise €499 (trial 14 dias)" },
    { t: "li", x: "Marketplace (roadmap): 20–30% de comissão por agente/plugin/fluxo vendido" },
    { t: "li", x: "White-label AEOS: €5.000 setup + €1.000/mês por empresa" },
    { t: "li", x: "Tokens $TRIN + $VSR (300M) — Proof-of-Mandate e apreciação" },
    { t: "li", x: "Community premium/VIP e serviços de automação comercial" },
    { t: "h2", x: "3. Escada de Receita (rota para €1M/semana)" },
    { t: "kv", k: "Mês 1", v: "€1.2k MRR — 15 Core + 3 Pro, go-live Avirato/Stripe" },
    { t: "kv", k: "Mês 2", v: "€6k MRR — Squad AIOX fecha 40 clientes, Marketplace v1 (20%)" },
    { t: "kv", k: "Mês 3", v: "€25k MRR — 150 tenants, 10 Enterprise, white-label" },
    { t: "kv", k: "Trimestre 4", v: "€250k/mês → meta €1M/semana — 500 orgs Enterprise + marketplace + tokens" },
    { t: "h2", x: "4. Rotina Semanal dos Milhões (orquestrada por Pedro + Trinnity + Squad AIOX)" },
    { t: "li", x: "Pipeline: agentes encontram → analisam → propõem → seguem" },
    { t: "li", x: "Conteúdo: blog automático a cada 120 min (SEO)" },
    { t: "li", x: "Email/CRM automatizado (com aprovação humana p/ legal/financeiro)" },
    { t: "li", x: "Marketplace comissionado (receita passiva)" },
    { t: "li", x: "Tokenomics $VSR: oferta 300M, Proof-of-Mandate" },
    { t: "h2", x: "5. Ações Imediatas (esta semana)" },
    { t: "code", x: "npm run go-live:stripe        # planos reais\nnpm run demo:avirato -- core    # checkout real\nget /api/revenue/readiness      # confirmar prontidão\nnpm run docs:revenue            # pipeline passo-a-passo" },
    { t: "li", x: "Verificar readiness; corrigir os checks; ativar webhooks; lançar marketplace v1." },
  ],
  EN: [
    { t: "h2", x: "1. Revenue Thesis" },
    { t: "p", x: "TVS does not sell chatbots — it sells the infrastructure on which the next generation of AI-powered companies is built. Every autonomous company created in hours generates recurring revenue." },
    { t: "h2", x: "2. Revenue Streams" },
    { t: "li", x: "SaaS subscriptions: Core €29 · Pro €99 · Enterprise €499 (14-day trial)" },
    { t: "li", x: "Marketplace (roadmap): 20–30% commission per agent/plugin/flow sold" },
    { t: "li", x: "White-label AEOS: €5,000 setup + €1,000/month per company" },
    { t: "li", x: "Tokens $TRIN + $VSR (300M) — Proof-of-Mandate and appreciation" },
    { t: "li", x: "Premium/VIP community and commercial automation services" },
    { t: "h2", x: "3. Revenue Ladder (route to €1M/week)" },
    { t: "kv", k: "Month 1", v: "€1.2k MRR — 15 Core + 3 Pro, Avirato/Stripe go-live" },
    { t: "kv", k: "Month 2", v: "€6k MRR — AIOX squad closes 40 customers, Marketplace v1 (20%)" },
    { t: "kv", k: "Month 3", v: "€25k MRR — 150 tenants, 10 Enterprise, white-label" },
    { t: "kv", k: "Quarter 4", v: "€250k/mo → €1M/week goal — 500 Enterprise orgs + marketplace + tokens" },
    { t: "h2", x: "4. Weekly Million Routine (orchestrated by Pedro + Trinnity + AIOX Squad)" },
    { t: "li", x: "Pipeline: agents find → analyze → propose → follow-up" },
    { t: "li", x: "Content: auto blog every 120 min (SEO)" },
    { t: "li", x: "Automated email/CRM (human approval for legal/financial)" },
    { t: "li", x: "Commissioned marketplace (passive revenue)" },
    { t: "li", x: "Tokenomics $VSR: 300M supply, Proof-of-Mandate" },
    { t: "h2", x: "5. Immediate Actions (this week)" },
    { t: "code", x: "npm run go-live:stripe        # real plans\nnpm run demo:avirato -- core    # real checkout\nget /api/revenue/readiness      # confirm readiness\nnpm run docs:revenue            # step-by-step pipeline" },
    { t: "li", x: "Check readiness; fix failing checks; enable webhooks; launch marketplace v1." },
  ],
  ES: [
    { t: "h2", x: "1. Tesis de Ingresos" },
    { t: "p", x: "TVS no vende chatbots — vende la infraestructura sobre la que se construyen las próximas empresas impulsadas por IA. Cada empresa autónoma creada en horas genera ingresos recurrentes." },
    { t: "h2", x: "2. Fuentes de Ingresos" },
    { t: "li", x: "Suscripciones SaaS: Core €29 · Pro €99 · Enterprise €499 (trial 14 días)" },
    { t: "li", x: "Marketplace (roadmap): 20–30% de comisión por agente/plugin/flujo vendido" },
    { t: "li", x: "White-label AEOS: €5.000 setup + €1.000/mes por empresa" },
    { t: "li", x: "Tokens $TRIN + $VSR (300M) — Proof-of-Mandate y apreciación" },
    { t: "li", x: "Community premium/VIP y servicios de automatización comercial" },
    { t: "h2", x: "3. Escalera de Ingresos (ruta a €1M/semana)" },
    { t: "kv", k: "Mes 1", v: "€1.2k MRR — 15 Core + 3 Pro, go-live Avirato/Stripe" },
    { t: "kv", k: "Mes 2", v: "€6k MRR — Squad AIOX cierra 40 clientes, Marketplace v1 (20%)" },
    { t: "kv", k: "Mes 3", v: "€25k MRR — 150 tenants, 10 Enterprise, white-label" },
    { t: "kv", k: "Trimestre 4", v: "€250k/mes → meta €1M/semana — 500 orgs Enterprise + marketplace + tokens" },
    { t: "h2", x: "4. Rutina Semanal de los Millones (orquestada por Pedro + Trinnity + Squad AIOX)" },
    { t: "li", x: "Pipeline: agentes encuentran → analizan → proponen → siguen" },
    { t: "li", x: "Contenido: blog automático cada 120 min (SEO)" },
    { t: "li", x: "Email/CRM automatizado (con aprobación humana para legal/financiero)" },
    { t: "li", x: "Marketplace comisionado (ingresos pasivos)" },
    { t: "li", x: "Tokenomics $VSR: oferta 300M, Proof-of-Mandate" },
    { t: "h2", x: "5. Acciones Inmediatas (esta semana)" },
    { t: "code", x: "npm run go-live:stripe        # planes reales\nnpm run demo:avirato -- core    # checkout real\nget /api/revenue/readiness      # confirmar preparación\nnpm run docs:revenue            # pipeline paso a paso" },
    { t: "li", x: "Verificar readiness; corregir checks; activar webhooks; lanzar marketplace v1." },
  ],
};

/* ---------- Documento 5: Pitch ---------- */
const pitchBlocks: Record<Lang, Block[]> = {
  PT: [
    { t: "h2", x: "1. Visão" },
    { t: "p", x: "Construir o primeiro Sistema Operativo Empresarial Autónomo (AEOS) capaz de criar, operar, administrar e fazer evoluir empresas completas mediante inteligência distribuída. Substituir o software empresarial tradicional por organizações digitais compostas por agentes autónomos." },
    { t: "h2", x: "2. Problema" },
    { t: "li", x: "Software empresarial fragmentado (CRM, ERP, billing, suporte, marketing, engenharia em silos)" },
    { t: "li", x: "Construir uma empresa nativa de IA leva anos e dezenas de ferramentas" },
    { t: "h2", x: "3. Solução — TVS v5.0" },
    { t: "li", x: "5.000+ mentes, 246 arquétipos, batalhão de 114, squads por departamento" },
    { t: "li", x: "Gateway de IA com 290+ providers (OmniRoute) + Ollama local (IA real sem chave)" },
    { t: "li", x: "Autonomia: agentes criam-se, evoluem e planificam sozinhos (CRITICAL→LOW)" },
    { t: "li", x: "SuperIntelligence ensemble: +1000% sobre a baseline de IA única" },
    { t: "li", x: "Comércio automatizado com aprovação humana para legal/financeiro" },
    { t: "h2", x: "4. Mercado e Tração" },
    { t: "li", x: "Mercado global de software empresarial e automação IA em crescimento exponencial" },
    { t: "li", x: "Plataforma multi-tenant, billing real (Avirato/Stripe), E2E messaging cifrada, email, JARVIS, mobile APK/iOS, desktop Windows, sites públicos" },
    { t: "h2", x: "5. Modelo de Negócio" },
    { t: "code", x: "SaaS: Core €29 · Pro €99 · Enterprise €499\nMarketplace: 20–30% comissão\nWhite-label AEOS: €5.000 + €1.000/mês\nTokens: $TRIN + $VSR (300M)" },
    { t: "h2", x: "6. Rota para €1M/semana" },
    { t: "li", x: "Mês 1 €1.2k → Mês 2 €6k → Mês 3 €25k → Q4 €250k/mês → €1M/semana" },
    { t: "h2", x: "7. Equipa" },
    { t: "li", x: "Pedro Costa — Comandante & CEO estratégico (CommandChain)" },
    { t: "li", x: "Trinnity Hurtado — Rainha & Arquiteta-Chefe (La Corona Viva)" },
    { t: "li", x: "Squads AIOX + 5.000 agentes como força de execução" },
    { t: "h2", x: "8. Pedido de Investimento" },
    { t: "p", x: "Apoio para: marketplace v1, white-label enterprise, engrenagem comercial, e expansão do ecossistema de 200+ repositórios com benchmarks públicos e comunidade." },
  ],
  EN: [
    { t: "h2", x: "1. Vision" },
    { t: "p", x: "Build the first Autonomous Enterprise Operating System (AEOS) capable of creating, operating, administering and evolving entire companies through distributed intelligence. Replace traditional enterprise software with digital organizations composed of autonomous agents." },
    { t: "h2", x: "2. Problem" },
    { t: "li", x: "Fragmented enterprise software (CRM, ERP, billing, support, marketing, engineering in silos)" },
    { t: "li", x: "Building an AI-native company takes years and dozens of tools" },
    { t: "h2", x: "3. Solution — TVS v5.0" },
    { t: "li", x: "5,000+ minds, 246 archetypes, 114 battalion, per-department squads" },
    { t: "li", x: "AI gateway with 290+ providers (OmniRoute) + local Ollama (real AI with no key)" },
    { t: "li", x: "Autonomy: agents self-create, self-evolve and self-plan (CRITICAL→LOW)" },
    { t: "li", x: "SuperIntelligence ensemble: +1000% over single-AI baseline" },
    { t: "li", x: "Automated commerce with human approval for legal/financial" },
    { t: "h2", x: "4. Market & Traction" },
    { t: "li", x: "Global enterprise software and AI automation market growing exponentially" },
    { t: "li", x: "Multi-tenant platform, real billing (Avirato/Stripe), encrypted E2E messaging, email, JARVIS, mobile APK/iOS, desktop Windows, public sites" },
    { t: "h2", x: "5. Business Model" },
    { t: "code", x: "SaaS: Core €29 · Pro €99 · Enterprise €499\nMarketplace: 20–30% commission\nWhite-label AEOS: €5,000 + €1,000/month\nTokens: $TRIN + $VSR (300M)" },
    { t: "h2", x: "6. Route to €1M/week" },
    { t: "li", x: "Month 1 €1.2k → Month 2 €6k → Month 3 €25k → Q4 €250k/mo → €1M/week" },
    { t: "h2", x: "7. Team" },
    { t: "li", x: "Pedro Costa — Commander & Strategic CEO (CommandChain)" },
    { t: "li", x: "Trinnity Hurtado — Queen & Chief Architect (La Corona Viva)" },
    { t: "li", x: "AIOX squads + 5,000 agents as the execution force" },
    { t: "h2", x: "8. The Ask" },
    { t: "p", x: "Support for: marketplace v1, enterprise white-label, commercial engine, and ecosystem expansion to 200+ repositories with public benchmarks and community." },
  ],
  ES: [
    { t: "h2", x: "1. Visión" },
    { t: "p", x: "Construir el primer Sistema Operativo Empresarial Autónomo (AEOS) capaz de crear, operar, administrar y hacer evolucionar empresas completas mediante inteligencia distribuida. Reemplazar el software empresarial tradicional por organizaciones digitales compuestas de agentes autónomos." },
    { t: "h2", x: "2. Problema" },
    { t: "li", x: "Software empresarial fragmentado (CRM, ERP, billing, soporte, marketing, ingeniería en silos)" },
    { t: "li", x: "Construir una empresa nativa de IA lleva años y docenas de herramientas" },
    { t: "h2", x: "3. Solución — TVS v5.0" },
    { t: "li", x: "5.000+ mentes, 246 arquetipos, batallón de 114, escuadrones por departamento" },
    { t: "li", x: "Gateway de IA con 290+ proveedores (OmniRoute) + Ollama local (IA real sin clave)" },
    { t: "li", x: "Autonomía: los agentes se crean, evolucionan y planifican solos (CRITICAL→LOW)" },
    { t: "li", x: "SuperIntelligence ensemble: +1000% sobre la línea base de IA única" },
    { t: "li", x: "Comercio automatizado con aprobación humana para legal/financiero" },
    { t: "h2", x: "4. Mercado y Tracción" },
    { t: "li", x: "Mercado global de software empresarial y automatización IA en crecimiento exponencial" },
    { t: "li", x: "Plataforma multi-tenant, billing real (Avirato/Stripe), mensajería E2E cifrada, email, JARVIS, mobile APK/iOS, desktop Windows, sitios públicos" },
    { t: "h2", x: "5. Modelo de Negocio" },
    { t: "code", x: "SaaS: Core €29 · Pro €99 · Enterprise €499\nMarketplace: 20–30% comisión\nWhite-label AEOS: €5.000 + €1.000/mes\nTokens: $TRIN + $VSR (300M)" },
    { t: "h2", x: "6. Ruta a €1M/semana" },
    { t: "li", x: "Mes 1 €1.2k → Mes 2 €6k → Mes 3 €25k → Q4 €250k/mes → €1M/semana" },
    { t: "h2", x: "7. Equipo" },
    { t: "li", x: "Pedro Costa — Comandante y CEO estratégico (CommandChain)" },
    { t: "li", x: "Trinnity Hurtado — Reina y Arquitecta Jefe (La Corona Viva)" },
    { t: "li", x: "Escuadrones AIOX + 5.000 agentes como fuerza de ejecución" },
    { t: "h2", x: "8. Solicitud de Inversión" },
    { t: "p", x: "Apoyo para: marketplace v1, white-label enterprise, motor comercial y expansión del ecosistema a 200+ repositorios con benchmarks públicos y comunidad." },
  ],
};

/* ============================== MAIN ============================== */

async function main() {
  console.log("TVS AEOS Suite — gerando 15 PDFs (5 docs x PT/EN/ES)...");
  const access = buildAccess(ENV, SCRIPTS);
  const topics: { id: string; title: Record<Lang, string>; blocks: Record<Lang, Block[]> }[] = [
    { id: "01_Cofre_Acceso", title: t_access as any, blocks: access },
    { id: "02_Arquitectura_Grafos", title: t_arch, blocks: archBlocks },
    { id: "03_Manual_Implementacion", title: t_manual, blocks: manualBlocks },
    { id: "04_Mapa_Riqueza", title: t_wealth, blocks: wealthBlocks },
    { id: "05_Pitch_Investidores", title: t_pitch, blocks: pitchBlocks },
  ];

  for (const topic of topics) {
    for (const lang of LANGS) {
      const file = path.join(OUT, `AEOS_${topic.id}_${lang}.pdf`);
      const tTitle = topic.title[lang];
      await renderPDF(file, {
        title: typeof tTitle === "string" ? tTitle : (tTitle as any).title,
        subtitle: `Trinnity Viseron System v5.0 — Autonomous Enterprise Operating System (AEOS) · ${LANG_NAME[lang]}`,
        langName: LANG_NAME[lang],
        blocks: topic.blocks[lang],
      });
    }
  }
  console.log("Concluído: " + (LANGS.length * topics.length) + " PDFs em data/");
}

main().catch((e) => { console.error(e); process.exit(1); });
