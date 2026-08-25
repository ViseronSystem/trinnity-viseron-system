import * as fs from "fs";
import * as path from "path";
import { Kernel } from "../kernel/Kernel";
import { Actor } from "../kernel/Permissions";
import { EnterpriseModuleSpec, EnterpriseActionInput, EnterpriseActionResult, EnterpriseHubStatus, enterpriseModuleSchema } from "./EnterpriseSpec";
import { AgentRuntime } from "../agent-runtime/AgentRuntime";
import { heartbeats } from "../selfheal";

const ACTOR: Actor = { id: "enterprise", name: "TVS Enterprise Hub", role: "operator" };

const AGENT_TIMEOUT_MS = 180000;

function withTimeout<T>(promise: Promise<T>, ms: number, agentId: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`agente ${agentId} excedeu ${ms}ms (modelo de IA sem resposta)`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export interface EnterpriseHubOptions {
  agentTimeoutMs?: number;
}

export class EnterpriseHub {
  public readonly name = "TVS Enterprise Hub";
  public readonly kernel: Kernel;

  private modules = new Map<string, EnterpriseModuleSpec>();
  private failures: string[] = [];
  private runtime?: AgentRuntime;
  private agentTimeoutMs: number;

  constructor(kernel: Kernel, runtime?: AgentRuntime, options: EnterpriseHubOptions = {}) {
    this.kernel = kernel;
    this.runtime = runtime;
    this.agentTimeoutMs = options.agentTimeoutMs ?? AGENT_TIMEOUT_MS;
  }

  public attachRuntime(runtime: AgentRuntime): void {
    this.runtime = runtime;
  }

  public loadModules(raw: unknown[]): { valid: number; invalid: number } {
    let valid = 0;
    for (const entry of raw) {
      try {
        const spec = enterpriseModuleSchema.parse(entry);
        this.modules.set(spec.id, spec);
        valid++;
      } catch (err: any) {
        this.failures.push(err?.issues?.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ") || String(err));
      }
    }
    return { valid, invalid: this.failures.length };
  }

  public loadFromFile(filePath: string): { valid: number; invalid: number } {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return this.loadModules(Array.isArray(raw) ? raw : [raw]);
  }

  public loadFromDir(dirPath: string): { valid: number; invalid: number; files: number } {
    let valid = 0;
    let files = 0;
    if (!fs.existsSync(dirPath)) return { valid, invalid: 0, files: 0 };
    for (const entry of fs.readdirSync(dirPath)) {
      if (!entry.endsWith(".json")) continue;
      files++;
      valid += this.loadFromFile(path.join(dirPath, entry)).valid;
    }
    return { valid, invalid: this.failures.length, files };
  }

  public getModule(id: string): EnterpriseModuleSpec | undefined {
    return this.modules.get(id);
  }

  public listModules(): EnterpriseModuleSpec[] {
    return Array.from(this.modules.values());
  }

  public getModuleAgents(moduleId: string): { present: string[]; missing: string[] } {
    const mod = this.modules.get(moduleId);
    if (!mod || !this.runtime) return { present: [], missing: [] };
    const present: string[] = [];
    const missing: string[] = [];
    for (const agentId of mod.agents) {
      if (this.runtime.getAgent(agentId) || this.runtime.getSpec(agentId)) present.push(agentId);
      else missing.push(agentId);
    }
    return { present, missing };
  }

  public async runAction(input: EnterpriseActionInput): Promise<EnterpriseActionResult> {
    const mod = this.modules.get(input.moduleId);
    if (!mod) throw new Error(`[EnterpriseHub] Módulo "${input.moduleId}" não carregado`);
    if (!this.runtime) throw new Error("[EnterpriseHub] Runtime não ligado — attachRuntime() em falta");

    heartbeats.begin("enterprise");
    try {
      return await this.runActionInner(input, mod);
    } finally {
      heartbeats.end("enterprise");
    }
  }

  private async runActionInner(input: EnterpriseActionInput, mod: EnterpriseModuleSpec): Promise<EnterpriseActionResult> {
    if (!this.runtime) throw new Error("[EnterpriseHub] Runtime não ligado — attachRuntime() em falta");
    await this.kernel.events.publish("omega:enterprise:action", { moduleId: mod.id, workflow: input.workflowId ?? null }, ACTOR.id);
    const start = Date.now();
    const results: EnterpriseActionResult["results"] = [];
    let failed = 0;
    for (const agentId of mod.agents) {
      const agent = this.runtime.getAgent(agentId);
      if (!agent) {
        failed++;
        results.push({ agentId, error: "agente não carregado" });
        continue;
      }
      try {
        const task = input.workflowId ? `[${mod.name}/${input.workflowId}] ${input.task}` : `[${mod.name}] ${input.task}`;
        const res = await withTimeout(agent.execute(task, input.context), this.agentTimeoutMs, agent.id);
        results.push({ agentId, name: agent.name, role: agent.role, success: res.success, output: res.output });
        if (!res.success) failed++;
      } catch (e: any) {
        failed++;
        results.push({ agentId, error: e.message });
      }
    }
    const outcome: EnterpriseActionResult = {
      moduleId: mod.id,
      moduleName: mod.name,
      domain: mod.domain,
      workflow: input.workflowId,
      results,
      failed,
      succeeded: results.length - failed,
      executionTimeMs: Date.now() - start,
    };
    await this.kernel.events.publish("omega:enterprise:complete", { moduleId: mod.id, succeeded: outcome.succeeded, failed: outcome.failed }, ACTOR.id);
    return outcome;
  }

  public status(): EnterpriseHubStatus {
    const mods = this.listModules();
    return {
      loaded: mods.length,
      active: mods.filter((m) => m.status === "ACTIVE").length,
      modules: mods.map((m) => ({ id: m.id, name: m.name, domain: m.domain, status: m.status, agents: m.agents.length, kpis: m.kpis })),
      failures: [...this.failures],
    };
  }
}
