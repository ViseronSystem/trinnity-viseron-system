import * as path from "path";
import { Kernel } from "./kernel/Kernel";
import { AgentRuntime } from "./agent-runtime/AgentRuntime";
import { KnowledgeGraph } from "./memory-engine/KnowledgeGraph";
import { AIRouter } from "./ai-router/AIRouter";
import { AutonomyLayer, PlannerEngineAdapter, EvolutionEngineAdapter, LearningEngineAdapter } from "./autonomy";
import { SquadRegistry } from "./squads";
import { FactoryEngine, SolutionEngineAdapter, ScaffolderAdapter } from "./factory";
import { EnterpriseHub } from "./enterprise";
import { SelfHealWatchdog } from "./selfheal";
import { heartbeats } from "./selfheal";
import { AgentManager } from "../core/AgentManager";
import { MemoryEngine } from "../core/memory/MemoryEngine";
import { ProviderFactory } from "../core/providers/ProviderFactory";
import { ModelRouter } from "../core/model-router/ModelRouter";

export interface OmegaOptions {
  agentManager?: AgentManager;
  memoryEngine?: MemoryEngine;
  providerFactory?: ProviderFactory;
  modelRouter?: ModelRouter;
  graphFilePath?: string;
  planner?: PlannerEngineAdapter;
  evolution?: EvolutionEngineAdapter;
  learning?: LearningEngineAdapter;
  solutionEngine?: SolutionEngineAdapter;
  scaffolder?: ScaffolderAdapter;
}

export interface OmegaPlatformStatus {
  kernel: ReturnType<Kernel["status"]>;
  runtime: ReturnType<AgentRuntime["status"]>;
  graph: ReturnType<KnowledgeGraph["getStats"]>;
  router: { providers: string[]; default: string };
  autonomy: ReturnType<AutonomyLayer["status"]>;
  squads: ReturnType<SquadRegistry["status"]>;
  factory: ReturnType<FactoryEngine["status"]>;
  enterprise: ReturnType<EnterpriseHub["status"]>;
  watchdog: ReturnType<SelfHealWatchdog["status"]>;
}

const SPECS_DIR = path.join(__dirname, "agent-runtime", "specs");
const SQUADS_DIR = path.join(__dirname, "squads", "manifests");
const ENTERPRISE_DIR = path.join(__dirname, "enterprise", "manifests");

export class OmegaPlatform {
  public readonly kernel: Kernel;
  public readonly agents: AgentRuntime;
  public readonly graph: KnowledgeGraph;
  public readonly router: AIRouter;
  public readonly autonomy: AutonomyLayer;
  public readonly squads: SquadRegistry;
  public readonly factory: FactoryEngine;
  public readonly enterprise: EnterpriseHub;
  public readonly watchdog: SelfHealWatchdog;

  private readonly agentManager?: AgentManager;

  constructor(options: OmegaOptions = {}) {
    this.agentManager = options.agentManager;
    this.kernel = new Kernel();
    this.graph = new KnowledgeGraph({
      filePath: options.graphFilePath ?? path.join(process.cwd(), "database", "memory", "knowledge-graph.json"),
    });
    this.router = new AIRouter(options.providerFactory, options.modelRouter);
    this.agents = new AgentRuntime({
      providerFactory: options.providerFactory,
      modelRouter: options.modelRouter,
      registerHook: (agent) => this.agentManager?.register(agent),
    });
    this.autonomy = new AutonomyLayer(this.kernel, {
      planner: options.planner,
      evolution: options.evolution,
      learning: options.learning,
    });
    this.squads = new SquadRegistry();
    this.squads.loadFromDir(SQUADS_DIR);
    this.factory = new FactoryEngine(this.kernel, {
      solutionEngine: options.solutionEngine,
      scaffolder: options.scaffolder,
    });
    this.enterprise = new EnterpriseHub(this.kernel);
    this.enterprise.loadFromDir(ENTERPRISE_DIR);

    if (options.agentManager) {
      this.kernel.attachAgentRegistry({
        getAgents: () => options.agentManager!.list(),
        runAgent: (id, task, ctx) => options.agentManager!.run(id, task, ctx),
      });
    }

    if (options.memoryEngine) {
      this.kernel.attachMemory({
        unifiedSearch: (q, opts) => options.memoryEngine!.unifiedSearch(q, opts),
        setLongTerm: (key, value, tags) => options.memoryEngine!.setLongTerm(key, value, tags),
        getStats: () => options.memoryEngine!.getStats(),
      });
    }

    this.kernel.attachAIRouter({
      route: (criteria) => this.router.route(criteria),
      resolve: async (task, opts) => this.router.resolve(task, opts),
    });

    this.watchdog = new SelfHealWatchdog({
      kernel: this.kernel,
      autonomy: this.autonomy,
      runtime: this.agents,
      squads: this.squads,
    });
    this.watchdog.register({ id: "kernel", label: "Kernel / EventBus", reset: () => heartbeats.reset("kernel") });
    this.watchdog.register({ id: "runtime", label: "Agent Runtime (10 agentes)", reset: () => heartbeats.reset("runtime") });
    this.watchdog.register({ id: "squads", label: "SquadRegistry (5 squads AIOX)", reset: () => heartbeats.reset("squads") });
    this.watchdog.register({ id: "enterprise", label: "Enterprise Hub (6 módulos)", reset: () => heartbeats.reset("enterprise") });
    this.watchdog.register({ id: "factory", label: "Factory (pipeline de 4 stages)", reset: () => heartbeats.reset("factory") });
  }

  public loadCoreAgents(): { valid: number; invalid: number; files: number } {
    const result = this.agents.loadSpecsFromDir(SPECS_DIR);
    this.enterprise.attachRuntime(this.agents);
    this.watchdog.start();
    return result;
  }

  public async recordDecision(entityId: string, entityType: string, name: string, relations: { target: string; type: string; weight?: number }[], properties?: Record<string, any>): Promise<void> {
    this.graph.upsertEntity(entityId, entityType, name, properties);
    for (const rel of relations) {
      if (!this.graph.getEntity(rel.target)) {
        this.graph.upsertEntity(rel.target, "unknown", rel.target);
      }
      this.graph.addRelation(entityId, rel.target, rel.type, rel.weight ?? 1);
    }
    this.graph.save();
    await this.kernel.publish("omega:decision", { entityId, entityType, name }, "omega-platform");
  }

  public status(): OmegaPlatformStatus {
    return {
      kernel: this.kernel.status(),
      runtime: this.agents.status(),
      graph: this.graph.getStats(),
      router: {
        providers: ["ollama", "omniroute", "openai", "claude", "gemini", "grok"],
        default: "ollama",
      },
      autonomy: this.autonomy.status(),
      squads: this.squads.status(),
      factory: this.factory.status(),
      enterprise: this.enterprise.status(),
      watchdog: this.watchdog.status(),
    };
  }
}

export function createOmegaPlatform(options: OmegaOptions = {}): OmegaPlatform {
  return new OmegaPlatform(options);
}
