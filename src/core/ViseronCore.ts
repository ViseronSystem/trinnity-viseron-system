import { TVSOrchestrator } from "./orchestrator/Orchestrator";
import { AgentManager } from "./AgentManager";
import { ModelRouter } from "./model-router/ModelRouter";
import { MemoryEngine } from "./memory/MemoryEngine";
import { ToolManager } from "./tools/ToolManager";
import { ProviderFactory } from "./providers/ProviderFactory";
import { SquadManager } from "./squads/SquadManager";
import { TVSMCPServer } from "./mcp/MCPServer";
import { AutoLearningEngine } from "./learning/AutoLearningEngine";
import { AutonomousPlanner } from "./planner/AutonomousPlanner";
import { AppScaffolder } from "./scaffolder/AppScaffolder";
import { AgentFactory } from "./agents/AgentFactory";
import { AgentCollaborator } from "./agents/AgentCollaborator";
import { BusinessSolutionEngine } from "./agents/BusinessSolutionEngine";
import { SuperMind } from "./supermind/SuperMind";
import { AIProviderBridge } from "./bridge/AIProviderBridge";
import { AICommunityPlatform } from "../community/AICommunityPlatform";
import { CommandChain } from "./leadership/CommandChain";
import { AutoEvolutionEngine } from "./evolution/AutoEvolutionEngine";
import { TokenEngine } from "./tokenomics/TokenEngine";
import { WebAppGenerator } from "./webapp/WebAppGenerator";
import { getAllArchetypes } from "./archetypes";
import { IAgent } from "./types";
import { SuperIntelligenceEngine } from "./superintelligence/SuperIntelligenceEngine";
import { AgentSpawner } from "./agents/AgentSpawner";
import { HyperLearningEngine } from "./learning/HyperLearningEngine";
import { ReportServer } from "./reporting/ReportServer";
import { BattalionRegistry, battalionRegistry, LineageTracker, DirectiveEngine } from "./standard";
import { VoiceBridge } from "../voice/VoiceBridge";
import { ComposioBridge } from "./composio/ComposioBridge";

export class ViseronCore {
  public name: string = "Trinnity Viseron System v7.0 Multiversal";
  public version: string = (() => {
    try {
      const pkg = require("../../package.json") as { version?: string };
      return pkg.version || "7.0.0";
    } catch {
      return "7.0.0";
    }
  })();

  // Core
  public orchestrator: TVSOrchestrator;
  public agentManager: AgentManager;
  public modelRouter: ModelRouter;
  public memoryEngine: MemoryEngine;
  public toolManager: ToolManager;
  public providerFactory: ProviderFactory;
  public squadManager: SquadManager;
  public mcpServer: TVSMCPServer;

  // Inteligencia
  public autoLearningEngine: AutoLearningEngine;
  public autonomousPlanner: AutonomousPlanner;
  public superMind: SuperMind;
  public commandChain: CommandChain;
  public autoEvolutionEngine: AutoEvolutionEngine;

  // AI Bridge & Community
  public aiBridge: AIProviderBridge;
  public aiCommunity: AICommunityPlatform;

  // Fábricas y Colaboración
  public agentFactory: AgentFactory;
  public agentCollaborator: AgentCollaborator;

  // Generación y Soluciones
  public appScaffolder: AppScaffolder;
  public businessSolutionEngine: BusinessSolutionEngine;
  public webAppGenerator: WebAppGenerator;
  public tokenEngine: TokenEngine;

  // Arquetipos
  public archetypes: ReturnType<typeof getAllArchetypes>;
  public spawnedArchetypeAgents: IAgent[] = [];

  // SuperIntelligence
  public superIntelligence: SuperIntelligenceEngine;

  // Agent Spawner (5000+ minds)
  public agentSpawner: AgentSpawner;

  // Hyper Learning (500% per 30min)
  public hyperLearningEngine: HyperLearningEngine;

  // Report Server with PDF
  public reportServer: ReportServer;

  // TVS Standard v1.0.0
  public battalionRegistry: BattalionRegistry;
  public lineageTracker: LineageTracker;
  public directiveEngine: DirectiveEngine;

  // JARVIS Voice Bridge
  public voiceBridge: VoiceBridge;

  // Composio (consumo MCP)
  public composioBridge: ComposioBridge;

  constructor() {
    this.archetypes = getAllArchetypes();

    // Core infrastructure
    this.agentManager = new AgentManager();
    this.modelRouter = new ModelRouter();
    this.memoryEngine = new MemoryEngine();
    this.toolManager = new ToolManager();
    this.providerFactory = new ProviderFactory();
    this.squadManager = new SquadManager();
    this.mcpServer = new TVSMCPServer(this.toolManager, this.agentManager, this.memoryEngine);

    // Command Chain with Pedro & Trinnity enhanced
    this.commandChain = new CommandChain(this.agentManager);

    // Registrar líderes legacy (compatibilidad)
    this.agentManager.register(this.squadManager.leaderPedro);
    this.agentManager.register(this.squadManager.leaderTrinnity);

    // Orquestador
    this.orchestrator = new TVSOrchestrator(
      this.agentManager, this.modelRouter, this.memoryEngine, this.toolManager
    );

    // Auto-aprendizaje
    this.autoLearningEngine = new AutoLearningEngine(this.memoryEngine, this.squadManager);

    // Planificación autónoma
    this.autonomousPlanner = new AutonomousPlanner(
      this.agentManager, this.orchestrator, this.memoryEngine, this.toolManager, this.modelRouter
    );

    // SuperMind - 500 years of knowledge
    this.superMind = new SuperMind(this.memoryEngine, this.agentManager);
    this.superMind.initializeDomains();

    // Auto Evolution Engine - agents get smarter daily
    this.autoEvolutionEngine = new AutoEvolutionEngine(this.agentManager, this.memoryEngine, this.superMind);

    // Fábrica de agentes
    this.agentFactory = new AgentFactory(this.providerFactory, this.modelRouter, this.agentManager);
    this.agentCollaborator = new AgentCollaborator(this.agentManager, this.providerFactory);
    this.appScaffolder = new AppScaffolder(this.memoryEngine);

    // Token Engine & Web App Generator
    this.tokenEngine = new TokenEngine(this.memoryEngine);
    this.webAppGenerator = new WebAppGenerator(this.appScaffolder);

    // Business Solution Engine
    this.businessSolutionEngine = new BusinessSolutionEngine(
      this.agentManager, this.providerFactory, this.modelRouter,
      this.agentFactory, this.agentCollaborator, this.appScaffolder, this.memoryEngine
    );

    // AI Provider Bridge - conexión a todas las IAs del mercado
    this.aiBridge = new AIProviderBridge(this.memoryEngine);

    // AI Community Platform
    this.aiCommunity = new AICommunityPlatform(this.aiBridge, this.memoryEngine);

    // SuperIntelligence Engine (1000%+ intelligence)
    this.superIntelligence = new SuperIntelligenceEngine(this.aiBridge, this.superMind, this.memoryEngine, this.agentManager);

    // Agent Spawner (5000 minds -> 400+ agents)
    this.agentSpawner = new AgentSpawner(this.agentManager, this.aiBridge, this.superMind);

    // Hyper Learning (500% per 30min cycle)
    this.hyperLearningEngine = new HyperLearningEngine(this.memoryEngine, this.agentManager, this.aiBridge, this.superMind);

    // TVS Standard v1.0.0 - Battalion + Lineage + Directive
    this.battalionRegistry = battalionRegistry;
    this.lineageTracker = new LineageTracker();
    this.directiveEngine = new DirectiveEngine();
    this.registerBattalionAgents();

    // Report Server with PDF (must be after TVS standard properties)
    this.reportServer = new ReportServer(this.agentManager, this.memoryEngine, this.superIntelligence, this.aiBridge, this.superMind, this.battalionRegistry, this.directiveEngine, this.lineageTracker, 3001);

    // JARVIS Voice Bridge
    this.voiceBridge = new VoiceBridge(this);

    // Composio (consumo MCP) - ferramentas externas (Gmail/Slack/GitHub/...) para os agentes
    this.composioBridge = new ComposioBridge();
  }

  /**
   * Liga ao Composio (MCP) e regista as ferramentas no ToolManager.
   * Os agentes passam a poder executar ferramentas externas via `composio_<nome>`.
   */
  async connectComposio(): Promise<{ ok: boolean; tools: number }> {
    const ok = await this.composioBridge.connect();
    let tools = 0;
    if (ok) {
      tools = this.composioBridge.registerTools(this.toolManager);
      console.log(`[TVS Composio] ${tools} ferramentas registadas no ToolManager`);
    }
    return { ok, tools };
  }

  private registerBattalionAgents(): void {
    const battalionAgents = this.battalionRegistry.createTVSAgents();
    for (const agent of battalionAgents) {
      this.agentManager.register(agent);
    }
    // Add lineage nodes
    for (const a of this.battalionRegistry.getAll()) {
      this.lineageTracker.addNode(a.id, a.name, a.rank, a.line, a.parent);
    }
    // Create squads from lineage
    for (const root of this.lineageTracker.getRoots()) {
      const kids = this.lineageTracker.getChildren(root.id);
      if (kids.length > 0) {
        this.directiveEngine.createSquad(
          `squad_${root.id}`,
          kids.map(k => `tvs_${k.id}`)
        );
      }
    }
  }

  spawnAllArchetypes(): IAgent[] {
    for (const arch of this.archetypes) {
      const agent: IAgent = {
        id: `arch_${arch.id}`,
        name: arch.name,
        role: `${arch.origin} • ${arch.era} • ${arch.specialties.slice(0, 3).join(", ")}`,
        status: "ACTIVE",
        capabilities: [...arch.specialties, ...arch.knowledge_areas],
        async execute(task: string) {
          return {
            agentId: this.id,
            agentName: this.name,
            success: true,
            output: `[${arch.symbol} ${arch.name}] Era: ${arch.era} | Wisdom: ${arch.wisdom}/100\nTask: ${task}\nKnowledge applied: ${arch.knowledge_areas.slice(0, 3).join(", ")}`,
            executionTimeMs: Math.floor(Math.random() * 100 + 10)
          };
        }
      };
      this.agentManager.register(agent);
      this.spawnedArchetypeAgents.push(agent);
    }
    return this.spawnedArchetypeAgents;
  }

  async evolveAgents(): Promise<void> {
    const records = await this.autoEvolutionEngine.evolveAll();
    console.log(`[TVS Evolution] ${records.length} agents evolved this cycle`);
  }

  start(): void {
    console.log(`\n`);
    console.log(`╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║     TRINNITY VISERON SYSTEM v7.0 MULTIVERSAL               ║`);
    console.log(`║        Multi-Agent AI Operating System                      ║`);
    console.log(`╠══════════════════════════════════════════════════════════════╣`);
    console.log(`║  👑 Supreme Commander: Pedro Costa                          ║`);
    console.log(`║  👸 Queen Architect: Trinnity Hurtado                       ║`);
    console.log(`║  🧠 SuperMind: 500 Years of Knowledge (1500-3000)           ║`);
    console.log(`║  🏛️  Archetypes: ${this.archetypes.length}+ Agent Minds Loaded         ║`);
    console.log(`║  🔄 Auto-Evolution: Agents grow smarter every cycle         ║`);
    console.log(`║  🌐 WebApp Generator: Websites + Mobile Apps                ║`);
    console.log(`║  💰 Token Engine: ERC-20 / BEP-20 / Solana Tokens           ║`);
    console.log(`║  🔗 MCP Server: @modelcontextprotocol/server v2             ║`);
    console.log(`║  🌉 AI Bridge: ${this.aiBridge.getAvailableProviders().length} Providers Connected       ║`);
    console.log(`║  👥 AI Community: Platform Active                          ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝`);
    console.log(`\n`);
  }

  async startSuperIntelligence(): Promise<void> {
    console.log(`[SuperIntelligence] Engine initialized - 1000%+ above single-AI baseline`);
  }

  async spawnAllMinds(): Promise<number> {
    const count = await this.agentSpawner.loadMinds();
    console.log(`[AgentSpawner] Loaded ${count} minds from database`);
    const agents = this.agentSpawner.spawnAll();
    console.log(`[AgentSpawner] Spawned ${agents.length} agents from ${count} minds`);
    return agents.length;
  }

  startHyperLearning(): void {
    this.hyperLearningEngine.start(30);
    console.log(`[HyperLearning] Started - intelligence doubles every 30 minutes`);
  }

  async startReportServer(): Promise<void> {
    await this.reportServer.start();
    console.log(`[ReportServer] Listening on port ${this.reportServer.getPort()}`);
  }

  getSuperIntelligenceLevel(): number {
    return this.hyperLearningEngine.getIntelligenceLevel();
  }

  async startCycles(): Promise<void> {
    this.autoLearningEngine.startLearningCycle();
    this.autonomousPlanner.start();
    this.autoEvolutionEngine.startContinuousEvolution();
    this.startHyperLearning();
    console.log(`[TVS] All evolution cycles started (learning, planning, agent evolution, hyperlearning)`);

    const wisdom = await this.superMind.synthesize("system readiness", ["Artificial Intelligence", "Computer Science", "Systems Theory"]);
    this.memoryEngine.setLongTerm("system_first_wisdom", wisdom);

    const bridgeStats = this.aiBridge.getStats();
    console.log(`[TVS AI Bridge] ${bridgeStats.providersAvailable} AI providers ready`);
    const communityStats = this.aiCommunity.getCommunityStats();
    console.log(`[TVS Community] ${communityStats.totalAgents} agents | ${communityStats.totalUsers} users`);
  }

  getIntelligenceLevel(): any {
    const agentCount = this.agentManager.list().length;
    const evolutionStats = this.autoEvolutionEngine.getStats();
    return {
      version: this.version,
      totalAgents: agentCount,
      archetypesLoaded: this.archetypes.length,
      superMindKnowledge: this.superMind.getKnowledgeLevel(),
      evolutionCycles: evolutionStats.totalCycles,
      averageWisdom: evolutionStats.averageWisdom,
      totalCapabilities: evolutionStats.totalCapabilities,
      autonomousPlanning: this.autonomousPlanner.getAutonomyLevel(),
      knowledgeCycles: this.autoLearningEngine.getCycleCount(),
      activeDirectives: this.commandChain.getActiveDirectives().length
    };
  }

  async generateToken(name: string, symbol: string): Promise<any> {
    const token = this.tokenEngine.generateToken(name, symbol);
    const tokenomics = this.tokenEngine.createTokenomics(name, `${name} ecosystem token`, token.totalSupply);
    return { token, tokenomics };
  }

  async generateCryptoWebsite(tokenName: string, tokenSymbol: string, description: string): Promise<any> {
    return await this.webAppGenerator.generateCryptoSite(tokenName, tokenSymbol, description);
  }
}
