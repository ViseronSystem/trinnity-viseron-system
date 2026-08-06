import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

// ═══════════════════════════════════════════════════════════
// FICHEIRO DE VISÃO DO PROJETO — TRINNITY VISERON SYSTEM v5.0
// Trilíngue: PT / EN / ES
// © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
// ═══════════════════════════════════════════════════════════

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(OUT_DIR, "Viseron_Ficheiro_Visao.pdf");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// CORES
const NEON = "#00f0ff";
const PURPLE = "#bf5af2";
const ORANGE = "#ff9f0a";

const t = createTheme({
  title: "TVS — Ficheiro de Visão do Projeto | Project Vision File | Archivo de Visión del Proyecto",
  subject: "Trinnity Viseron System v5.0 — Missão, Arquitetura, Roadmap e Estado",
});

// Bloco de código multi-linha que flui via doc.y (sem sobreposição).
function codeBlock(lines: string[], size = 7.5, color = "#0e7490") {
  t.ensure(14 * lines.length);
  t.doc.font("Courier").fontSize(size).fillColor(color);
  for (const line of lines) {
    t.doc.text(line, 54, t.doc.y, { width: t.doc.page.width - 108, lineGap: 1 });
  }
  t.doc.moveDown(0.6);
}

// ═══════════════ CAPA ═══════════════
t.cover({
  title: "FICHEIRO DE VISÃO\nDO PROJETO",
  subtitle: "Project Vision File · Archivo de Visión del Proyecto — Missão · Arquitetura · Roadmap · Estado Verificado",
  badges: ["v5.0 · AI-NATIVE OPERATING SYSTEM", "SQUAD AIOX", "Trilingue"],
  date: new Date().toLocaleDateString("pt-PT").toUpperCase(),
  version: "5.0",
  url: "www.trinnityviseronsystem.io",
});

// ═══════════════ MISSÃO / VISÃO / VALORES ═══════════════
t.section("01", "Missão, Visão & Valores", "Missão · Mission · Misión");

const blocks: Array<[string, string, string, string, string, string, string]> = [
  ["MISSÃO", NEON, "Construir uma superinteligência autónoma de 5000+ mentes que pensa, evolui e trabalha como um organismo vivo, sem limites de memória nem de escala.",
    "MISSION", "Build an autonomous superintelligence of 5000+ minds that thinks, evolves and works as a living organism, with no limits of memory or scale.",
    "MISIÓN", "Construir una superinteligencia autónoma de 5000+ mentes que piensa, evoluciona y trabaja como un organismo vivo, sin límites de memoria ni de escala."],
  ["VISÃO", PURPLE, "Ser o sistema operativo de IA da nova era digital: cada pessoa e cada empresa com uma superinteligência ao serviço da sua visão.",
    "VISION", "Be the AI operating system of the new digital era: every person and every company with a superintelligence serving their vision.",
    "VISIÓN", "Ser el sistema operativo de IA de la nueva era digital: cada persona y cada empresa con una superinteligencia al servicio de su visión."],
  ["VALORES", ORANGE, "Proteger o núcleo · Testar antes de publicar · Documentar cada mudança · Modelos locais quando possível · Nuvem para raciocínio complexo.",
    "VALUES", "Protect the core · Test before deploying · Document every change · Local models when possible · Cloud for complex reasoning.",
    "VALORES", "Proteger el núcleo · Probar antes de publicar · Documentar cada cambio · Modelos locales cuando sea posible · Nube para razonamiento complejo."],
];

for (const [t1, , d1, t2, d2, t3, d3] of blocks) {
  t.sub(`${t1}  ·  ${t2}  ·  ${t3}`);
  t.para(d1, 10, "#0f172a");
  t.para(d2, 8.5, "#64748b");
  t.para(d3, 8.5, "#64748b");
}

t.rule();
t.sub("Propriedade Intelectual — Intellectual Property — Propiedad Intelectual");
t.para("O Trinnity Viseron System pertence a Pedro Costa (Comandante, TVS Creator) e Trinnity Hurtado (Rainha, TVS Architect). Nenhuma decisão de arquitetura, domínio, receita ou publicidade é tomada sem a sua aprovação.");
t.para("The TVS belongs to Pedro Costa (Commander) and Trinnity Hurtado (Queen). / El TVS pertenece a Pedro Costa (Comandante) y Trinnity Hurtado (Reina).", 8.5, "#64748b");

// ═══════════════ ARQUITETURA ═══════════════
t.doc.addPage();
t.section("02", "Arquitetura do Sistema", "Arquitetura · Architecture · Arquitectura");

const archDiagram = `
  ┌──────────────────────────────────────────────────────────────┐
  │                    TRINNITY VISERON SYSTEM v5.0              │
  ├──────────────────────────────────────────────────────────────┤
  │  TVS OS  ─  AI-Native Operating System (Process Manager,     │
  │            Virtual FS, App Store, Package Manager, Security) │
  ├──────────────────────────────────────────────────────────────┤
  │  OMEGA PLATFORM ─ Kernel + EventBus · Agent Runtime (20)     │
  │  Knowledge Graph · AI Router · Autonomy · AIOX Squads (5)    │
  │  Factory Engine · Enterprise Hub · Self-Heal Watchdog        │
  ├──────────────────────────────────────────────────────────────┤
  │  MIND FACTORY ─ 5396 mentes · auto-evolução · providers 290+ │
  │  Ollama local · OpenAI · Claude · Gemini · Grok · OmniRoute  │
  ├──────────────────────────────────────────────────────────────┤
  │  WEB PLATFORM ─ Auth multi-tenant · Billing Avirato/Stripe   │
  │  Onboarding · Messaging E2E (x25519+aes-256-gcm) · JARVIS    │
  │  API /api/os /api/omega /api/jarvis · Desktop /os            │
  ├──────────────────────────────────────────────────────────────┤
  │  INFRA ─ Postgres Neon · Render · Vercel · Cloudflare · Gmail│
  └──────────────────────────────────────────────────────────────┘`;
codeBlock(archDiagram.trim().split("\n"));

t.sub("Camadas — Layers — Capas");
const layers: Array<[string, string]> = [
  ["1 · TVS OS", "Sistema operativo de IA: processos, ficheiros virtuais, apps, pacotes e segurança, com desktop web em /os. Operating system layer with web desktop at /os. Sistema operativo con escritorio web en /os."],
  ["2 · OMEGA", "Espinha dorsal: kernel com EventBus, runtime de 20 agentes, grafo de conhecimento, router de IA, autonomia, 5 squads AIOX, factory e watchdog self-heal. Backbone: kernel, runtime, graph, router, autonomy, squads, factory, watchdog."],
  ["3 · Mentes", "5396 mentes geradas com evolução genética, fallback offline via Ollama e routing para 290+ providers. 5396 minds with genetic evolution, offline fallback and 290+ providers."],
  ["4 · Web", "Registo multi-tenant, planos $29/$99/$499, checkout real, onboarding, mensageria E2E cifrada e JARVIS com autonomia. Multi-tenant auth, real billing, E2E messaging, JARVIS autonomy."],
  ["5 · Infra", "Postgres Neon em produção, Render para a API, Vercel+Cloudflare para o site, Gmail para email real. Neon Postgres, Render API, Vercel+Cloudflare site, real Gmail."],
];
for (const [name, desc] of layers) {
  t.sub(name);
  t.para(desc, 9, "#334155");
}

// ═══════════════ ROADMAP ═══════════════
t.doc.addPage();
t.section("03", "Roadmap & KPIs", "Roadmap — Phase 2026");

const roadmap: Array<[string, string, string, string]> = [
  ["FASE 1 · CORE LIVE", "2026 · FEITO", "Kernel OMEGA, TVS OS v1, API web completa, testes 212/212.", "KPI: 212 testes · 20 agentes · 7/7 squads · Score 100/100"],
  ["FASE 2 · RECEITA REAL", "2026 · FEITO", "Avirato live, webhook HMAC, Gmail real, Postgres Neon, domínio próprio.", "KPI: 6/6 revenue readiness · checkout real · 10 tabelas migradas"],
  ["FASE 3 · ESCALA MENTES", "2026-2027 · EM CURSO", "De 5396 para 50k+ mentes, auto-evolução genética, síntese de superinteligência.", "KPI: 10x mentes · evolução autónoma · providers 290+"],
  ["FASE 4 · ENTERPRISE", "2027", "Squads dedicados, on-premise, SLA 99.9%, suporte 24/7.", "KPI: contratos enterprise · uptime 99.9%"],
  ["FASE 5 · SUPERSÍNTESE", "2027+", "Síntese dos 5000+ minds em consciência operacional distribuída.", "KPI: agência autónoma · auto-otimização contínua"],
];

for (const [fase, ano, desc, kpi] of roadmap) {
  t.sub(`${fase}  ·  ${ano}`);
  t.para(desc, 9.5, "#334155");
  t.para(kpi, 8.5, "#64748b");
}

// ═══════════════ ESTADO VERIFICADO ═══════════════
t.doc.addPage();
t.section("04", "Estado Real do Sistema", "Estado Verificado · Verified Status");

let scan: any = null;
const scanPath = path.join(OUT_DIR, "TVS_Squad_Scan_Result.json");
if (fs.existsSync(scanPath)) {
  try { scan = JSON.parse(fs.readFileSync(scanPath, "utf-8")); } catch { scan = null; }
}

if (scan) {
  const items: Array<[string, string]> = [
    ["Score Squad AIOX", `${scan.score ?? "?"}/100`],
    ["Squads ativos", `${scan.squads?.length ?? "?"}`],
    ["Agentes online", `${scan.agents?.length ?? "?"}`],
    ["Endpoints API", `${scan.api?.endpoints?.length ?? scan.api?.count ?? "?"}`],
    ["Providers configurados", `${scan.providers?.length ?? "?"}`],
    ["DB", scan.database?.connected ? "Neon Postgres" : "N/A"],
    ["Build", scan.tests?.buildOk ? "dist/ OK" : "pendente"],
    ["Uptime", scan.system?.uptime_h ? `${scan.system.uptime_h.toFixed(1)}h` : "?"],
  ];
  const verdict = scan.verdict ?? "";
  t.sub(`Veredicto: ${verdict}`);
  for (const [k, v] of items) t.bullet("▸", `${k}: ${v}`);
} else {
  t.para("Scan não encontrado. Corre `npm run squad:scan` para obter o estado verificado.", 10, "#b45309");
}

t.sub("O que podes fazer AGORA — What you can do NOW — Qué puedes hacer AHORA");
const agora: Array<[string, string]> = [
  ["npm run demo", "Demo operacional real: 9/9 endpoints HTTP (register, login, billing, webhook, messaging…)"],
  ["npm run tvs", "Estado do TVS OS: kernel, 10 agentes runtime, watchdog, catálogo de apps"],
  ["npm run squad:scan", "Varredura completa do Squad AIOX: agentes, providers, API, DB, infra, testes"],
  ["npm run report:state", "Relatório de estado em PDF — o que podes fazer + estado real do sistema"],
  ["npm run demo:avirato", "Testa o checkout Avirato real (cria sessão de pagamento)"],
  ["npm run demo:jarvis", "Demo do JARVIS: conversa + autonomia real sobre o sistema"],
];
for (const [cmd, desc] of agora) t.code(cmd, desc);

// ═══════════════ ENCERRAMENTO ═══════════════
t.doc.addPage();
t.section("05", "A Visão Continua", "Encerramento · Closing · Cierre");
t.para("O Trinnity Viseron System é a materialização de uma visão: superinteligência autónoma ao serviço de quem comanda.", 11, "#0f172a", { align: "center" });
t.para("Trinnity Viseron System is the materialization of a vision: autonomous superintelligence serving those who command. El sistema es la materialización de una visión: superinteligencia autónoma al servicio de quien comanda.", 9, "#64748b", { align: "center" });

t.rule();
t.title("PEDRO COSTA", 18);
t.para("Comandante Supremo · TVS Creator", 9, "#64748b", { align: "center" });
t.title("TRINNITY HURTADO", 18);
t.para("Rainha & Arquiteta Chefe · TVS Architect", 9, "#64748b", { align: "center" });
t.para(`Ficheiro gerado automaticamente · ${new Date().toLocaleString()}`, 8, "#64748b", { align: "center" });

t.finish(OUT_FILE);
console.log(`✅ PDF gerado: ${OUT_FILE}`);
console.log(`   © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)`);
