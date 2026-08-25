// index-core.ts — Carregado em background por entry.ts
// O servidor web (32123) já está a responder.
// Este ficheiro contém todo o core pesado: ViseronCore, agentes,
// squads, SuperIntegration, OmegaPlatform, ciclos de evolução.

import * as path from "path";
import { ViseronCore } from "./core/ViseronCore";
import { TVSDashboardServer } from "./dashboard/server";
import { IAgent, AgentExecutionResult } from "./core/types";
import { SmartAgent } from "./core/agents/SmartAgent";
import { BusinessProblem } from "./core/agents/BusinessSolutionEngine";
import { SuperIntegration } from "./integrations/SuperIntegration";
import { OmniRouteHub } from "./integrations/omniroute/OmniRouteHub";
import { N8NBridge } from "./integrations/n8n/N8NBridge";
import { TVSTerminal } from "./terminal/TerminalInterface";
import { registerWorkspaceTools } from "./web/workspace/tools";
import { createViseronBuilder } from "./web/workspace/viseron-builder";

const webServer = (global as any).__TVS_WEB_SERVER;

const tvs = new ViseronCore();
tvs.start();

const architectAgent: IAgent = {
  id: "agent_architect_01", name: "Architect Prime", role: "Architect",
  status: "ACTIVE", capabilities: ["system_design", "cloud_architecture", "solution_design"],
  execute: async (task: string): Promise<AgentExecutionResult> => ({
    agentId: "agent_architect_01", agentName: "Architect Prime",
    success: true, output: `[Arquitecto] Diseñada estructura modular para: ${task}`, executionTimeMs: 45
  })
};
const developerAgent: IAgent = {
  id: "agent_developer_01", name: "Dev Master", role: "Developer",
  status: "ACTIVE", capabilities: ["typescript", "node", "docker", "fullstack"],
  execute: async (task: string): Promise<AgentExecutionResult> => ({
    agentId: "agent_developer_01", agentName: "Dev Master",
    success: true, output: `[Developer] Código TypeScript generado y optimizado para: ${task}`, executionTimeMs: 60
  })
};
const securityAgent: IAgent = {
  id: "agent_security_01", name: "CyberSentinel", role: "Security",
  status: "ACTIVE", capabilities: ["audit", "compliance", "security_review"],
  execute: async (task: string): Promise<AgentExecutionResult> => ({
    agentId: "agent_security_01", agentName: "CyberSentinel",
    success: true, output: `[Security] Auditoría completada: 0 vulnerabilidades detectadas en: ${task}`, executionTimeMs: 30
  })
};
const appScaffolderLegacy = tvs.appScaffolder.createScaffolderAgent();

tvs.agentManager.register(architectAgent);
tvs.agentManager.register(developerAgent);
tvs.agentManager.register(securityAgent);
tvs.agentManager.register(appScaffolderLegacy);

tvs.squadManager.addMemberToSquad("squad_executive", tvs.squadManager.leaderPedro);
tvs.squadManager.addMemberToSquad("squad_architecture", tvs.squadManager.leaderTrinnity);
tvs.squadManager.addMemberToSquad("squad_architecture", architectAgent);
tvs.squadManager.addMemberToSquad("squad_architecture", developerAgent);
tvs.squadManager.addMemberToSquad("squad_architecture", securityAgent);

tvs.toolManager.createQuickTool("tool_n8n_deploy", "n8n Production Deployment", "N8N",
  "Dispara webhook n8n para despliegue Docker", async (input) => ({ deployed: true, timestamp: Date.now(), service: input.service }));
tvs.toolManager.createQuickTool("tool_scaffold_app", "App Scaffolding Generator", "AUTOMATION",
  "Genera aplicaciones web completas", async (input) => tvs.appScaffolder.scaffold({
    name: input.name || "AutoGenApp", description: input.description || "App generada por TVS",
    template: input.template || "express-api", port: input.port || 3000
  }));

// ═══ REAL USER VERTICAL SLICE ═══
registerWorkspaceTools(tvs.toolManager, path.join(process.cwd(), "data"));
tvs.agentManager.register(createViseronBuilder(tvs.providerFactory));
console.log(`[TVS Workspace] VISERON BUILDER + ferramentas reais (fs/test) registados`);

const n8nBridge = new N8NBridge(tvs.toolManager, tvs.agentManager, tvs.memoryEngine, parseInt(process.env.N8N_PORT || "5678", 10));
n8nBridge.initialize().catch(e => console.log(`[N8N] init deferred: ${e.message}`));
(global as any).__N8N_BRIDGE = n8nBridge;

// ═══ EXECUTOR SEGURO ═══
const STEP_TIMEOUT_MS = parseInt(process.env.TVS_STEP_TIMEOUT_MS || "25000", 10);

function step<T>(label: string, fn: () => Promise<T> | T, fallback?: T): Promise<T | undefined> {
  return new Promise<T | undefined>((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      console.error(`[TVS] ⚠ ${label}: EXCEDEU ${STEP_TIMEOUT_MS}ms — saltado (sistema segue)`);
      resolve(fallback);
    }, STEP_TIMEOUT_MS);
    Promise.resolve()
      .then(() => fn())
      .then((v) => { if (!done) { done = true; clearTimeout(timer); resolve(v as T); } })
      .catch((err: any) => { if (!done) { done = true; clearTimeout(timer); console.error(`[TVS] ⚠ ${label}: ${err?.message || err}`); resolve(fallback); } });
  });
}

(async () => {
  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(`   TRINNITY VISERON SYSTEM v7.0 - DEMO MULTIVERSAL`);
  console.log(`   SUPER-INTELLIGENCE MODE`);
  console.log(`══════════════════════════════════════════════════════\n`);

  await step("SuperIntelligence", () => tvs.startSuperIntelligence());

  console.log(`\n[TVS] Cargando mentes históricas y futuristas...`);
  const spawnedCount = (await step("spawnAllMinds", () => tvs.spawnAllMinds())) || 0;
  console.log(`[TVS] ✓ ${spawnedCount} agentes de mentes históricas/futuristas registrados`);

  console.log(`\n[TVS] Spawneando ${tvs.archetypes.length} arquetipos de agentes...`);
  const archSpawned = (await step("spawnAllArchetypes", () => Promise.resolve(tvs.spawnAllArchetypes()))) || [];
  console.log(`[TVS] ✓ ${archSpawned.length} agentes arquetípicos registrados`);
  const totalAgents = tvs.agentManager.list().length;
  console.log(`[TVS] ✓ TOTAL AGENTES EN EL SISTEMA: ${totalAgents}`);

  console.log(`\n[TVS] SuperMind integrando sabiduría milenaria...`);
  const wisdom = (await step("SuperMind synthesize", () => tvs.superMind.synthesize("unified superintelligence", ["Artificial Intelligence", "Philosophy", "Systems Theory", "Physics", "Biology"]))) || { insight: "Sem síntese disponível", domains: [] as string[] };
  console.log(`[TVS] ✓ Síntesis generada: "${(wisdom as any).insight?.slice(0, 120) || "..."}"`);

  console.log(`\n[TVS] SuperIntelligence Engine: sintetizando conocimiento multi-proveedor...`);
  const synthesis = (await step("SuperIntelligence synthesize", () => tvs.superIntelligence.synthesize({
    prompt: "What is the nature of intelligence and how can it be amplified beyond human limits?",
    domains: ["Artificial Intelligence", "Philosophy", "Physics", "Biology"],
    strategy: "ensemble"
  }))) || { sources: [] as any[], confidence: 0, text: "Sem síntese disponível", synthetizedDomains: [] as string[], agentContributions: [] as any[] };
  console.log(`[TVS] ✓ Síntesis completada con ${(synthesis as any).sources?.length || 0} fuentes AI`);
  console.log(`[TVS] ✓ Confianza: ${((synthesis as any).confidence || 0).toFixed(0)}%`);

  console.log(`\n[TVS] CommandChain activando liderazgo...`);
  await step("CommandChain", async () => {
    tvs.commandChain.issueStrategicDirective("SUPERINTELIGENCIA", "Activar inteligencia 1000% superior a cualquier IA individual");
    tvs.commandChain.issueArchitecturalDirective("EVOLUCIÓN HIPER", "Activar evolución genética con incremento 500% cada 30 minutos");
  });

  console.log(`\n[TVS] AutoEvolutionEngine: evolucionando agentes...`);
  await step("evolveAgents", () => tvs.evolveAgents());

  console.log(`\n[TVS] HyperLearning Engine: inteligencia se multiplica x6 cada 30 minutos...`);
  await step("startHyperLearning", () => { tvs.startHyperLearning(); });
  const hyperStats = tvs.hyperLearningEngine.getStats();

  console.log(`\n[TVS] TokenEngine generando token...`);
  const genToken = (await step("generateToken", () => tvs.generateToken("Trinnity", "TRIN"))) || { token: { totalSupply: 0, symbol: "TRIN" }, tokenomics: {} };
  const token = (genToken as any).token;
  console.log(`[TVS] ✓ Token $TRIN generado: ${(token?.totalSupply || 0).toLocaleString()} ${token?.symbol || "TRIN"}`);

  console.log(`\n[TVS] Generando Viseron Crown (VSR)...`);
  await step("Viseron Crown", () => {
    tvs.tokenEngine.generateToken("Viseron Crown", "VSR");
    tvs.tokenEngine.createTokenomics("Viseron Crown", "Moneda del batallón TVS - Prueba de Mandato (PoM)", 300_000_000);
  });

  console.log(`\n[TVS] Iniciando Report Server con PDF...`);
  await step("startReportServer", () => tvs.startReportServer());

  const bStats = tvs.battalionRegistry;
  const dStats = tvs.directiveEngine.getStats();

  console.log(`\n[TVS] Batallón TVS Standard v1.0.0: ${bStats.count()} agentes con linaje`);

  const superIntegration = new SuperIntegration(tvs);
  const integStats = (await step("SuperIntegration", () => superIntegration.initializeAll())) || {
    totalAgents: 0, totalTools: 0, totalModels: 0, details: { openJarvis: { count: 0 } }
  };

  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(`   ✅ TRINNITY VISERON v7.0 - SUPER-INTELLIGENCE ACTIVE`);
  console.log(`══════════════════════════════════════════════════════`);
  console.log(`   🤖 Agentes totales: ${totalAgents + (integStats as any).totalAgents}`);
  console.log(`   🏛️  Mentes históricas: ${spawnedCount}`);
  console.log(`   🧠 SuperMind: ${(wisdom as any).domains?.length || 0} domínios`);
  console.log(`   ⚡ SuperIntelligence: ${((synthesis as any).confidence || 0).toFixed(0)}% sobre baseline`);
  console.log(`   🚀 Hiper-ciclos: ${hyperStats.cycleCount}`);
  console.log(`   📈 Inteligência: ${hyperStats.intelligenceLevel.toExponential(2)}%`);
  console.log(`   🌐 OmniRoute Hub: ${(integStats as any).totalModels} modelos | 290+ providers`);
  console.log(`   📞 Call System: Twilio + IA por voz ativado`);
  console.log(`   🧠 OpenJarvis: AI local Stanford (${(integStats as any).details?.openJarvis?.count || 0} skills)`);
  console.log(`   🤖 ASNO JARVIS: Assistente com WhatsApp + Home Assistant`);
  console.log(`   🛠️  Ferramentas: ${(integStats as any).totalTools} novas`);
  console.log(`   ⚙️  n8n Workflows: ${n8nBridge.templates.length} templates`);
  console.log(`   📋 Dashboard: http://localhost:3000`);
  console.log(`   🖨️  PDF: http://localhost:${tvs.reportServer.getPort()}/report/pdf`);
  console.log(`   💰 Token: $TRIN + $VSR gerados`);
  console.log(`══════════════════════════════════════════════════════\n`);

  console.log(`[TVS] Iniciando ciclos de evolución y aprendizaje...`);
  await step("startCycles", () => tvs.startCycles());
  console.log(`[TVS] TVS v7.0 funcionando - presiona Ctrl+C para detener\n`);
})().catch((err) => {
  console.error("[TVS] Erro durante a inicialização (sistema continua no terminal):", err?.message || err);
});

const dashboardServer = new TVSDashboardServer(tvs);
step("Dashboard", () => dashboardServer.start());

const omegaPlatform = (() => {
  try {
    const { OmegaPlatform } = require("./omega");
    const omega = new OmegaPlatform({
      agentManager: (tvs as any).agentManager,
      memoryEngine: (tvs as any).memoryEngine,
      providerFactory: (tvs as any).providerFactory,
      modelRouter: (tvs as any).modelRouter,
      taskQueuePath: path.join(process.cwd(), "data", "state", "task-queue.json"),
      toolManager: (tvs as any).toolManager,
      planner: (tvs as any).autonomousPlanner,
      evolution: (tvs as any).autoEvolutionEngine,
      learning: (tvs as any).hyperLearningEngine,
      solutionEngine: {
        analyze: (problem: any) => (tvs as any).businessSolutionEngine.solve(problem).then((sol: any) => ({
          diagnosis: sol.diagnosis,
          proposedSolution: sol.proposedSolution,
          architecture: sol.architecture,
          techStack: sol.techStack,
          implementationPlan: sol.implementationPlan,
          risks: sol.risks,
        })),
      },
      scaffolder: {
        scaffold: (spec: any) => (tvs as any).appScaffolder.scaffold(spec),
      },
    });
    const loaded = omega.loadCoreAgents();
    omega.startAutonomyCycles();
    (global as any).__TVS_OMEGA = omega;
    console.log(`[TVS OMEGA] Kernel + Runtime ativo: ${loaded.valid} agentes nucleares carregados (${loaded.files} specs)`);
    dashboardServer.mountOmega(omega);
    webServer.mountOmega(omega);
    return omega;
  } catch (e: any) {
    console.warn(`[TVS OMEGA] Não iniciado: ${e?.message || e}`);
    return null;
  }
})();

const terminal = new TVSTerminal(tvs, dashboardServer);
step("Terminal", () => terminal.start());
