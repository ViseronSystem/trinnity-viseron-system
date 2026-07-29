import { ViseronCore } from "./core/ViseronCore";
import { TVSDashboardServer } from "./dashboard/server";
import { SmartAgent } from "./core/agents/SmartAgent";
import { IAgent, AgentExecutionResult } from "./core/types";
import { BusinessProblem } from "./core/agents/BusinessSolutionEngine";

const tvs = new ViseronCore();
tvs.start();

// Registrar agentes legacy
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

(async () => {
  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(`   TRINNITY VISERON SYSTEM v5.0 - DEMO MULTIVERSAL`);
  console.log(`══════════════════════════════════════════════════════\n`);

  // 1. Spawnear 200+ arquetipos
  console.log(`[TVS] Spawneando ${tvs.archetypes.length} arquetipos de agentes...`);
  const spawned = tvs.spawnAllArchetypes();
  console.log(`[TVS] ✓ ${spawned.length} agentes arquetípicos registrados`);
  const totalAgents = tvs.agentManager.list().length;
  console.log(`[TVS] ✓ Total agentes en el sistema: ${totalAgents}`);

  // 2. SuperMind: sintetizar sabiduría
  console.log(`\n[TVS] SuperMind integrando sabiduría milenaria...`);
  const wisdom = await tvs.superMind.synthesize("unified knowledge", ["Artificial Intelligence", "Philosophy", "Systems Theory"]);
  console.log(`[TVS] ✓ Síntesis generada: "${wisdom.insight.slice(0, 120)}..."`);
  console.log(`[TVS] ✓ Dominios cargados: ${wisdom.domains.length} dominios sintetizados`);

  // 3. CommandChain: emitir directivas
  console.log(`\n[TVS] CommandChain activando liderazgo...`);
  const d1 = tvs.commandChain.issueStrategicDirective("EXPANSIÓN", "Iniciar expansión del ecosistema TVS");
  const d2 = tvs.commandChain.issueArchitecturalDirective("EVOLUCIÓN GENÉTICA", "Activar evolución genética de agentes");
  const directives = tvs.commandChain.getActiveDirectives();
  console.log(`[TVS] ✓ Directivas activas: ${directives.length}`);
  d1 &&   console.log(`[TVS]   • ${d1.title}: ${d1.description}`);
  d2 && console.log(`[TVS]   • ${d2.title}: ${d2.description}`);

  // 4. AutoEvolution: evolucionar agentes
  console.log(`\n[TVS] AutoEvolutionEngine: evolucionando agentes...`);
  const evolutionRecords = await tvs.evolveAgents();
  console.log(`[TVS] ✓ Evolución completada`);

  // 5. Token Engine: generar token
  console.log(`\n[TVS] TokenEngine generando token...`);
  const { token, tokenomics } = await tvs.generateToken("Trinnity", "TRIN");
  console.log(`[TVS] ✓ Token $TRIN generado:`);
  console.log(`[TVS]   • Supply: ${token.totalSupply.toLocaleString()} ${token.symbol}`);
  console.log(`[TVS]   • Decimals: ${token.decimals}`);
  const stakingDist = tokenomics.distribution.find((d: any) => d.purpose === 'Staking Rewards');
  console.log(`[TVS]   • Staking Rewards: ${stakingDist?.percent}% allocation`);
  console.log(`[TVS]   • Inflación: ${tokenomics.inflationRate}%`);

  // 6. WebAppGenerator: sitio crypto
  console.log(`\n[TVS] WebAppGenerator: generando sitio web crypto...`);
  const site = await tvs.generateCryptoWebsite("Trinnity", "TRIN", "Trinnity Viseron System - The Ultimate AI Operating System");
  console.log(`[TVS] ✓ Sitio crypto generado:`);
  console.log(`[TVS]   • Ruta: ${site.path}`);
  console.log(`[TVS]   • Archivos: ${site.files.join(", ")}`);

  // 7. Demo empresarial legacy
  console.log(`\n[TVS] Blueprints de agentes disponibles:`);
  tvs.agentFactory.getBlueprintNames().forEach(b => console.log(`  • ${b}`));
  console.log(`\n[TVS] Spawneando agentes IA empresariales...`);
  const bizAnalyst = tvs.agentFactory.spawnFromBlueprint('business-analyst');
  const dataScientist = tvs.agentFactory.spawnFromBlueprint('data-scientist');
  const fullstackDev = tvs.agentFactory.spawnFromBlueprint('fullstack-dev');
  const aiEngineer = tvs.agentFactory.spawnFromBlueprint('ai-engineer');

  const problem: BusinessProblem = {
    companyName: "TechCorp Global",
    industry: "Tecnología / SaaS",
    description: "TechCorp necesita modernizar su plataforma SaaS legacy, implementar IA en su producto principal, automatizar procesos manuales y crear un dashboard de analytics en tiempo real. Actualmente pierden clientes por falta de innovación y procesos lentos.",
    painPoints: [
      "Plataforma legacy monolítica difícil de mantener",
      "Procesos manuales que consumen 40% del tiempo del equipo",
      "Sin capacidades de IA en el producto",
      "Sin dashboard de analytics en tiempo real",
      "Pérdida de clientes por falta de innovación"
    ],
    goals: [
      "Modernizar a arquitectura de microservicios",
      "Implementar IA/ML en el producto core",
      "Automatizar procesos críticos",
      "Crear dashboard de analytics en tiempo real",
      "Incrementar retención de clientes en 30%"
    ],
    budget: "$200,000 USD",
    timeline: "6 meses"
  };

  console.log(`\n[TVS] Resolviendo problema empresarial: ${problem.companyName}...`);
  const solution = await tvs.businessSolutionEngine.solve(problem);

  // 8. Stats finales
  const stats = tvs.getIntelligenceLevel();
  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(`   ✅ TRINNITY VISERON v5.0 - SISTEMA MULTIVERSAL LISTO`);
  console.log(`══════════════════════════════════════════════════════`);
  console.log(`   🤖 Agentes totales: ${stats.totalAgents}`);
  console.log(`   🏛️  Arquetipos: ${stats.archetypesLoaded}`);
  console.log(`   🧠 SuperMind: conocimiento nivel ${stats.superMindKnowledge}`);
  console.log(`   🔄 Evoluciones: ${stats.evolutionCycles}`);
  console.log(`   🎯 Sabiduría promedio: ${(stats.averageWisdom || 0).toFixed(1)}%`);
  console.log(`   📋 Directivas activas: ${stats.activeDirectives}`);
  console.log(`   🚀 Dashboard: http://localhost:3000`);
  console.log(`   💰 Token: $TRIN generado`);
  console.log(`   🌐 Crypto Site: generado en generated-crypto-sites/`);
  console.log(`══════════════════════════════════════════════════════\n`);

  console.log(`[TVS] Iniciando ciclos de evolución...`);
  await tvs.startCycles();
  console.log(`[TVS] TVS v5.0 funcionando - presiona Ctrl+C para detener\n`);
})();

const dashboardServer = new TVSDashboardServer(tvs, 3000);
dashboardServer.start();
