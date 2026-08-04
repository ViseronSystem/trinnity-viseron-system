import * as fs from "fs";
import * as path from "path";
import { AgentSpec, AgentSpecSchema, parseAgentSpec, validateAgentSpecs, specToSmartAgentConfig } from "./AgentSpec";
import { SmartAgent } from "../../core/agents/SmartAgent";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ModelRouter } from "../../core/model-router/ModelRouter";

export interface AgentRuntimeStatus {
  loaded: number;
  active: number;
  specs: { id: string; name: string; role: string; status: string }[];
  failures: string[];
}

export class AgentRuntime {
  private specs = new Map<string, AgentSpec>();
  private agents = new Map<string, SmartAgent>();
  private failures: string[] = [];
  private readonly providerFactory: ProviderFactory;
  private readonly modelRouter: ModelRouter;
  private readonly registerHook: ((agent: any) => void) | null;

  constructor(options?: { providerFactory?: ProviderFactory; modelRouter?: ModelRouter; registerHook?: (agent: any) => void }) {
    this.providerFactory = options?.providerFactory ?? new ProviderFactory();
    this.modelRouter = options?.modelRouter ?? new ModelRouter();
    this.registerHook = options?.registerHook ?? null;
  }

  public loadSpecs(specs: unknown[]): { valid: number; invalid: number } {
    const { valid, invalid } = validateAgentSpecs(specs);
    this.failures = [];
    for (const spec of valid) {
      this.specs.set(spec.id, spec);
      const agent = new SmartAgent(specToSmartAgentConfig(spec), this.providerFactory, this.modelRouter);
      this.agents.set(spec.id, agent);
      if (this.registerHook) this.registerHook(agent);
    }
    for (const entry of invalid) this.failures.push(`spec[${entry.index}]: ${entry.error}`);
    return { valid: valid.length, invalid: invalid.length };
  }

  public loadSpecsFromFile(filePath: string): { valid: number; invalid: number } {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const array = Array.isArray(raw) ? raw : [raw];
    return this.loadSpecs(array);
  }

  public loadSpecsFromDir(dirPath: string): { valid: number; invalid: number; files: number } {
    let valid = 0;
    let invalid = 0;
    let files = 0;
    if (!fs.existsSync(dirPath)) return { valid, invalid, files };
    for (const entry of fs.readdirSync(dirPath)) {
      if (!entry.endsWith(".json")) continue;
      files++;
      const result = this.loadSpecsFromFile(path.join(dirPath, entry));
      valid += result.valid;
      invalid += result.invalid;
    }
    return { valid, invalid, files };
  }

  public getSpec(id: string): AgentSpec | undefined {
    return this.specs.get(id);
  }

  public listSpecs(): AgentSpec[] {
    return Array.from(this.specs.values());
  }

  public getAgent(id: string): SmartAgent | undefined {
    return this.agents.get(id);
  }

  public listAgents(): SmartAgent[] {
    return Array.from(this.agents.values());
  }

  public async execute(id: string, task: string, context?: Record<string, any>): Promise<any> {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`[AgentRuntime] Agent "${id}" not loaded`);
    return agent.execute(task, context);
  }

  public validate(raw: unknown): { ok: boolean; errors: string[] } {
    const result = AgentSpecSchema.safeParse(raw);
    if (result.success) return { ok: true, errors: [] };
    return { ok: false, errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`) };
  }

  public status(): AgentRuntimeStatus {
    const specs = this.listSpecs();
    return {
      loaded: specs.length,
      active: specs.filter((s) => s.status === "ACTIVE").length,
      specs: specs.map((s) => ({ id: s.id, name: s.name, role: s.role, status: s.status })),
      failures: this.failures,
    };
  }
}

export function createAgentRuntime(options?: { providerFactory?: ProviderFactory; modelRouter?: ModelRouter; registerHook?: (agent: any) => void }): AgentRuntime {
  return new AgentRuntime(options);
}

export { parseAgentSpec };
