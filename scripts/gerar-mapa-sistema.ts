import path from "path";
import { createTheme } from "./pdf-theme";

// TVS — MAPA COMPLETO DO SISTEMA (trilingue ES · PT · EN)
// Saída: data/Viseron_Mapa_Sistema.pdf

const CORE_MODULES: Array<[string, string]> = [
  ["ViseronCore", "Orquestrador central do sistema"],
  ["AgentManager", "Registo de agentes (246+ arquetipos, 18 executáveis)"],
  ["AgentFactory", "7 blueprints + SmartAgent"],
  ["ProviderFactory + ModelRouter", "Ollama → OpenAI → Claude → Gemini → Grok → OmniRoute"],
  ["MemoryEngine", "4 camadas: STM → LTM → KB → Vector (Qdrant)"],
  ["MemoryConsolidation", "Consolidação STM→LTM"],
  ["AutonomousPlanner", "Planeamento autónomo de tarefas"],
  ["AutoEvolutionEngine", "Evolução automática dos agentes"],
  ["ContinuousLearning", "Aprendizagem contínua com métricas"],
  ["SuperMind / SuperIntelligenceEngine", "Camadas de superinteligência"],
  ["Orchestrator", "Orquestração de subtarefas"],
  ["BibleGovernance", "9 princípios bíblicos — bloqueia fraude/mentira/vazamento"],
  ["BusinessSolutionEngine", "Soluções de negócio por empresa"],
  ["ReportServer", "Servidor de relatórios"],
];

const OMEGA_MODULES: Array<[string, string]> = [
  ["Kernel", "Dispatch de agentes, memória, verificação, eventos"],
  ["TaskQueue", "9 estados (CREATED→…→COMPLETED), fila persistente"],
  ["EventBus", "43 tópicos, wildcards, retry, replay, ring buffer"],
  ["EventBridge", "SSE + Socket.IO em tempo real"],
  ["TaskVerifier", "PASS / FAIL / RETRY / HUMAN"],
  ["Permissions", "RBAC com 8 roles"],
  ["AutonomyLayer + AutonomyOS", "Níveis L0-L5 com políticas financeiras e de risco"],
  ["AgentRuntime", "10 agentes nucleares spec-driven"],
  ["SquadRegistry + SquadScanner", "6 manifestos de squads"],
  ["EnterpriseHub", "6 módulos empresariais com KPIs"],
  ["FactoryEngine", "Pipeline ANALYZE/DESIGN/BUILD/DEPLOY"],
  ["SelfHealWatchdog + Heartbeats", "Auto-recuperação de componentes"],
  ["VaecOrchestrator", "IMPLEMENT→TEST→SYNC→BUILD→VERIFY→LEARN→PROMOTE (rollback)"],
  ["TelemetryEngine", "Telemetria de execução"],
  ["KnowledgeArchive", "Memória histórica com SHA-256"],
  ["KnowledgeGraph", "963 entidades / relações"],
  ["AIRouter", "Roteamento de modelo por tarefa e privacidade"],
  ["Intelligence (GraphifyAdapter, ContextBuilder, RiskAnalyzer)", "Inteligência de arquitetura sobre o grafo"],
];

const WEB_APIS: Array<[string, string]> = [
  ["Auth", "JWT multi-tenant, scrypt, membros, roles"],
  ["Billing", "Avirato + Stripe + cripto (Core $29 / Pro $99 / Enterprise $499)"],
  ["Email", "Gmail OAuth, verify/reset/invoice"],
  ["Messaging E2E", "x25519 + aes-256-gcm, grupos, leitura"],
  ["Onboarding", "5 templates que materializam agentes"],
  ["JARVIS", "23 intents, 6 providers, memória"],
  ["VISERON", "Persona Stark, voz, supervisão AIOX"],
  ["ATLAS", "Tutor de inglês com voz (7 dias)"],
  ["Agency OS", "4 agentes: Reporting, Leads, Creativos, Nurturing"],
  ["Composio", "MCP: Gmail/Slack/GitHub/Notion..."],
  ["RCS", "Mensagens de marca Twilio (logo TVS)"],
  ["Calls", "Inbound/outbound Twilio + IA local"],
  ["Sites generator", "Site completo gerado por IA"],
  ["Apps generator", "Scaffold Expo + APK real"],
  ["Business agents", "Agentes de atendimento por empresa"],
  ["Crypto payments", "Faturas USDT/BTC/ETH"],
  ["TVS OS", "Process Manager, VFS, App Store, Security"],
  ["Revenue readiness", "6/6 pronto (Avirato, Gmail, Postgres, domínio, webhook)"],
];

const FRONTEND: Array<[string, string]> = [
  ["command-center.html", "Centro operacional 3D (1.089 linhas)"],
  ["index.html", "Landing page"],
  ["viseron.html", "HUD VISERON com voz"],
  ["atlas.html", "Tutor ATLAS"],
  ["operate.html", "Pipeline E2E com SSE"],
  ["workspace.html", "Workspace OMEGA"],
  ["desktop.html", "TVS OS Desktop"],
  ["dashboard.html", "App shell"],
  ["game/index.html", "Jogo Canvas 2D (web + APK)"],
  ["cosmos/", "Site tokens $VSR/$TRIN + metaverso"],
  ["blog/", "Blog com content agent"],
  ["visor/ + marketing.html", "Páginas de visor e marketing"],
];

const AGENTS: Array<[string, string]> = [
  ["VISERON", "Alma — persona Stark, governança bíblica, supervisão"],
  ["JARVIS", "Cérebro — 23 intents, 6 providers, execução real"],
  ["10 nucleares", "CEO, CTO, Finance, Sales, Research, Developer, DevOps, Security, Support, Vision"],
  ["ATLAS", "Tutor de inglês com voz"],
  ["Agency OS (4)", "Reporting, Respuesta a Leads, Creativos, Nurturing"],
  ["ContentAgent + CallLearning", "Blog automático e aprendizagem de chamadas"],
  ["Squads", "6 manifestos (Engenharia, Segurança, ...)"],
  ["Minds", "5.014 registados em dados (não processos ativos)"],
];

const INTEGRATIONS: Array<[string, string]> = [
  ["Ollama", "IA local (qwen2.5:3b + 1.5b)"],
  ["OpenAI / Anthropic / Gemini / Grok", "IA cloud opcional"],
  ["OmniRoute", "Roteador de modelos (porta 20128)"],
  ["Composio MCP", "Ferramentas externas via MCP"],
  ["Twilio", "Chamadas + RCS/SMS"],
  ["Gmail OAuth", "Email real"],
  ["n8n", "Workflows"],
  ["ASNO + OpenJarvis", "Bridges de agentes externos"],
  ["CallSystem", "Bridge de chamadas"],
  ["viseron-apps", "Cifra, Project1"],
  ["Skills Registry", "1.999 skills em 10 coleções"],
];

const OTHER: Array<[string, string]> = [
  ["TVS OS", "Process Manager, Virtual FS, App Store, Package Manager, Security Center (25/25 testes)"],
  ["Scripts (139+)", "PDFs PDFKit, deploy, backup, migração, VAEC, telecom, cripto, auditoria"],
  ["Contratos", "Solidity (ViseronCrown, Trinnity, Staking, Governance) + SPL Solana mainnet"],
  ["Cosmos", "$VSR 300M + $TRIN 420.69M — mints reais, authorities revogadas"],
  ["Mobile", "App Expo + viserongame APK + fábrica de apps"],
  ["Electron", "Desktop app"],
  ["Docker", "4 serviços (tvs-core, ollama, qdrant, n8n)"],
  ["Postgres", "Neon cloud, 10 tabelas, usage_events"],
  ["Campanha (cliente)", "Área separada e auditada em campanha/"],
];

const GOD_NODES: Array<[string, string]> = [
  ["scripts", "139 arestas"],
  ["MemoryEngine", "109 arestas"],
  ["AgentManager", "84 arestas"],
  ["runOmegaTests()", "72 arestas"],
  ["ViseronCore", "62 arestas"],
  ["JarvisAgent", "61 arestas"],
  ["IAgent", "60 arestas"],
  ["createTheme()", "52 arestas"],
  ["TVSTerminal", "52 arestas"],
  ["ProviderFactory", "48 arestas"],
];

const LIMITS: string[] = [
  "Embeddings são sin/cos placeholder — sem modelo de embedding real.",
  "Sem RAG semântico completo nem GraphRAG.",
  "Voz é Web Speech do navegador (não neural).",
  "Single-process — sem escala horizontal.",
  "5.014 minds são dados registados, não processos autónomos ativos.",
  "Billing/cripto podem estar em modo manual/mock sem credenciais reais.",
  "N8N engine em modo MOCK (honesto).",
  "Integrações externas exigem contas/credenciais válidas.",
];

const TESTS: Array<[string, string]> = [
  ["Core", "20/20 PASS"],
  ["Web", "109/109 PASS"],
  ["OMEGA", "250/250 PASS"],
  ["TVS OS", "25/25 PASS"],
  ["Restantes", "suite completa cortada por timeout de 120s"],
];

function main() {
  const outFile = path.resolve("data", "Viseron_Mapa_Sistema.pdf");
  const t = createTheme({
    title: "Trinnity Viseron System — Mapa Completo del Sistema",
    subject: "Mapa completo do sistema · Full system map (ES · PT · EN)",
  });

  t.cover({
    title: "MAPA COMPLETO DEL SISTEMA",
    subtitle: "Full system map · Mapa completo do sistema",
    badges: ["6.037 nós no grafo", "~188 endpoints", "OMEGA Kernel", "10 agentes nucleares", "TVS v7.0"],
    date: new Date().toLocaleString("pt-PT"),
    version: "7.0",
    url: "www.trinnityviseronsystem.io",
  });

  t.section("1", "Visión general · Visão geral · Overview");
  t.para("ES: El sistema es un AI Operating System de orquestación de agentes con kernel OMEGA, memoria de 4 capas, ~188 endpoints REST, eventos en tiempo real y agentes ejecutables. PT: O sistema é um AI Operating System de orquestação de agentes com kernel OMEGA, memória de 4 camadas, ~188 endpoints REST e eventos em tempo real. EN: The system is an AI Operating System for agent orchestration with OMEGA kernel, 4-layer memory, ~188 REST endpoints and real-time events.");
  t.code("standalone-server.ts (Express + Socket.IO :32123)", "Monta OMEGA Gateway (50) + Web Layer (~134) + Dashboard (13 páginas)");
  t.code("OMEGA PLATFORM", "Kernel · AgentRuntime · Autonomy · Squads · Enterprise · Factory · SelfHeal · VAEC · Telemetry");
  t.code("MEMORIA", "MemoryEngine (STM→LTM→KB→Vector) · KnowledgeGraph · KnowledgeArchive · Graphify");
  t.rule();

  t.section("2", "Núcleo · Core (30 módulos)");
  for (const [name, desc] of CORE_MODULES) t.bullet("▸", `${name} — ${desc}`);
  t.rule();

  t.section("3", "Kernel OMEGA · OMEGA Kernel");
  for (const [name, desc] of OMEGA_MODULES) t.bullet("▸", `${name} — ${desc}`);
  t.rule();

  t.section("4", "APIs Web · Web Layer (~134 endpoints)");
  for (const [name, desc] of WEB_APIS) t.bullet("▸", `${name} — ${desc}`);
  t.rule();

  t.section("5", "Frontend · UI (13 páginas)");
  for (const [name, desc] of FRONTEND) t.bullet("▸", `${name} — ${desc}`);
  t.rule();

  t.section("6", "Agentes · Agents");
  for (const [name, desc] of AGENTS) t.bullet("▸", `${name} — ${desc}`);
  t.rule();

  t.section("7", "Integraciones · Integrations (9)");
  for (const [name, desc] of INTEGRATIONS) t.bullet("▸", `${name} — ${desc}`);
  t.rule();

  t.section("8", "Otros dominios · Other domains");
  for (const [name, desc] of OTHER) t.bullet("▸", `${name} — ${desc}`);
  t.rule();

  t.section("9", "Estado verificado · Verified state");
  for (const [name, out] of TESTS) t.kv(name, out);
  t.rule();

  t.section("10", "God Nodes del grafo · Graph hubs");
  for (const [name, out] of GOD_NODES) t.kv(name, out);
  t.rule();

  t.section("11", "Límites honestos · Honest limits");
  for (const limit of LIMITS) t.bullet("⚠", limit);

  t.finish(outFile);
  console.log("[OK] PDF gerado:", outFile);
}

main();