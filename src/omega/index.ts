import * as path from "path";
import { Kernel } from "./kernel/Kernel";
import { AgentRuntime } from "./agent-runtime/AgentRuntime";
import { KnowledgeGraph } from "./memory-engine/KnowledgeGraph";
import { AIRouter } from "./ai-router/AIRouter";
import { AutonomyLayer, PlannerEngineAdapter, EvolutionEngineAdapter, LearningEngineAdapter } from "./autonomy";
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
}

export interface OmegaPlatformStatus {
  kernel: ReturnType<Kernel["status"]>;
  runtime: ReturnType<AgentRuntime["status"]>;
  graph: ReturnType<KnowledgeGraph["getStats"]>;
  router: { providers: string[]; default: string };
  autonomy: ReturnType<AutonomyLayer["status"]>;
}

const SPECS_DIR = path.join(__dirname, "agent-runtime", "specs");

export class OmegaPlatform {
  public readonly kernel: Kernel;
  public readonly agents: AgentRuntime;
  public readonly graph: KnowledgeGraph;
  public readonly router: AIRouter;
  public readonly autonomy: AutonomyLayer;

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
  }

  public loadCoreAgents(): { valid: number; invalid: number; files: number } {
    return this.agents.loadSpecsFromDir(SPECS_DIR);
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
    };
  }
}

export function createOmegaPlatform(options: OmegaOptions = {}): OmegaPlatform {
  return new OmegaPlatform(options);
}
