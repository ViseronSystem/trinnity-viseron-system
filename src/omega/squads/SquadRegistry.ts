import * as fs from "fs";
import * as path from "path";
import { SquadSpec, parseSquadSpec } from "./SquadSpec";
import { AgentRuntime } from "../agent-runtime/AgentRuntime";

export interface SquadRegistryStatus {
  loaded: number;
  active: number;
  squads: { id: string; name: string; domain: string; status: string; agents: number }[];
  failures: string[];
}

export interface SquadRunResult {
  squad: string;
  task: string;
  results: { agentId: string; name?: string; role?: string; success?: boolean; output?: string; error?: string }[];
  failed: number;
  succeeded: number;
  executionTimeMs: number;
}

export class SquadRegistry {
  private squads = new Map<string, SquadSpec>();
  private failures: string[] = [];

  public loadSquads(raw: unknown[]): { valid: number; invalid: number } {
    let valid = 0;
    for (const entry of raw) {
      try {
        const spec = parseSquadSpec(entry);
        this.squads.set(spec.id, spec);
        valid++;
      } catch (err: any) {
        this.failures.push(err?.issues?.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ") || String(err));
      }
    }
    return { valid, invalid: this.failures.length };
  }

  public loadFromFile(filePath: string): { valid: number; invalid: number } {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const array = Array.isArray(raw) ? raw : [raw];
    return this.loadSquads(array);
  }

  public loadFromDir(dirPath: string): { valid: number; invalid: number; files: number } {
    let valid = 0;
    let files = 0;
    if (!fs.existsSync(dirPath)) return { valid, invalid: 0, files: 0 };
    for (const entry of fs.readdirSync(dirPath)) {
      if (!entry.endsWith(".json")) continue;
      files++;
      const result = this.loadFromFile(path.join(dirPath, entry));
      valid += result.valid;
    }
    return { valid, invalid: this.failures.length, files };
  }

  public getSquad(id: string): SquadSpec | undefined {
    return this.squads.get(id);
  }

  public listSquads(): SquadSpec[] {
    return Array.from(this.squads.values());
  }

  public getSquadMembers(runtime: AgentRuntime, squadId: string): { present: string[]; missing: string[] } {
    const squad = this.squads.get(squadId);
    if (!squad) return { present: [], missing: [] };
    const present: string[] = [];
    const missing: string[] = [];
    for (const agentId of squad.agents) {
      if (runtime.getAgent(agentId) || runtime.getSpec(agentId)) present.push(agentId);
      else missing.push(agentId);
    }
    return { present, missing };
  }

  public async runSquad(runtime: AgentRuntime, squadId: string, task: string, context?: Record<string, any>): Promise<SquadRunResult> {
    const squad = this.squads.get(squadId);
    if (!squad) throw new Error(`[SquadRegistry] Squad "${squadId}" not loaded`);
    const start = Date.now();
    const results: SquadRunResult["results"] = [];
    let failed = 0;
    for (const agentId of squad.agents) {
      const agent = runtime.getAgent(agentId);
      if (!agent) {
        failed++;
        results.push({ agentId, error: "agent not loaded" });
        continue;
      }
      try {
        const res = await agent.execute(task, context);
        results.push({ agentId, name: agent.name, role: agent.role, success: res.success, output: res.output });
        if (!res.success) failed++;
      } catch (e: any) {
        failed++;
        results.push({ agentId, error: e.message });
      }
    }
    return { squad: squadId, task, results, failed, succeeded: results.length - failed, executionTimeMs: Date.now() - start };
  }

  public status(): SquadRegistryStatus {
    const squads = this.listSquads();
    return {
      loaded: squads.length,
      active: squads.filter((s) => s.status === "ACTIVE").length,
      squads: squads.map((s) => ({ id: s.id, name: s.name, domain: s.domain, status: s.status, agents: s.agents.length })),
      failures: [...this.failures],
    };
  }
}
