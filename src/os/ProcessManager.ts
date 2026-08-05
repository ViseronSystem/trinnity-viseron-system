import { AgentRuntime } from "../omega/agent-runtime/AgentRuntime";

export type TVSProcessStatus = "RUNNING" | "COMPLETED" | "FAILED" | "TIMEOUT" | "KILLED";

export interface TVSProcess {
  pid: number;
  agentId: string;
  agentName: string;
  role: string;
  task: string;
  status: TVSProcessStatus;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  output?: string;
  error?: string;
}

export interface ProcessManagerStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  killed: number;
  activePids: number[];
}

export interface ProcessManagerOptions {
  timeoutMs?: number;
  maxHistory?: number;
}

export class ProcessManager {
  private processes = new Map<number, TVSProcess>();
  private nextPid = 1;
  private readonly timeoutMs: number;
  private readonly maxHistory: number;
  private readonly runtime?: AgentRuntime;

  constructor(runtime?: AgentRuntime, options: ProcessManagerOptions = {}) {
    this.runtime = runtime;
    this.timeoutMs = options.timeoutMs ?? 180000;
    this.maxHistory = options.maxHistory ?? 200;
  }

  public spawn(agentId: string, task: string, context?: Record<string, any>): TVSProcess {
    const proc: TVSProcess = {
      pid: this.nextPid++,
      agentId,
      agentName: agentId,
      role: "agent",
      task,
      status: "RUNNING",
      startedAt: Date.now(),
    };

    if (!this.runtime) {
      proc.status = "FAILED";
      proc.error = "Agent Runtime não ligado";
      proc.finishedAt = Date.now();
      proc.durationMs = 0;
      this.record(proc);
      return proc;
    }

    const agent = this.runtime.getAgent(agentId);
    if (agent) {
      proc.agentName = agent.name;
      proc.role = agent.role;
    }

    this.record(proc);
    this.executeAsync(proc, task, context).catch(() => { /* o próprio executor trata os erros */ });
    return proc;
  }

  private async executeAsync(proc: TVSProcess, task: string, context?: Record<string, any>): Promise<void> {
    try {
      const res = await Promise.race([
        this.runtime!.execute(proc.agentId, task, context),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`processo ${proc.pid} excedeu ${this.timeoutMs}ms`)), this.timeoutMs),
        ),
      ]);
      proc.status = res?.success === false ? "FAILED" : "COMPLETED";
      proc.output = res?.output ?? JSON.stringify(res) ?? "ok";
      proc.error = res?.error;
    } catch (e: any) {
      proc.status = e?.message?.includes("excedeu") ? "TIMEOUT" : "FAILED";
      proc.error = e?.message ?? String(e);
    } finally {
      proc.finishedAt = Date.now();
      proc.durationMs = proc.finishedAt - proc.startedAt;
      this.trim();
    }
  }

  public kill(pid: number): TVSProcess | undefined {
    const proc = this.processes.get(pid);
    if (!proc) return undefined;
    if (proc.status === "RUNNING") {
      proc.status = "KILLED";
      proc.finishedAt = Date.now();
      proc.durationMs = proc.finishedAt - proc.startedAt;
      proc.error = "Encerrado pelo operador";
    }
    return proc;
  }

  public get(pid: number): TVSProcess | undefined {
    return this.processes.get(pid);
  }

  public list(status?: TVSProcessStatus): TVSProcess[] {
    const all = Array.from(this.processes.values()).sort((a, b) => b.startedAt - a.startedAt);
    return status ? all.filter((p) => p.status === status) : all;
  }

  public running(): TVSProcess[] {
    return this.list("RUNNING");
  }

  private record(proc: TVSProcess): void {
    this.processes.set(proc.pid, proc);
    this.trim();
  }

  private trim(): void {
    if (this.processes.size <= this.maxHistory) return;
    const sorted = Array.from(this.processes.values()).sort((a, b) => b.startedAt - a.startedAt);
    for (const proc of sorted.slice(this.maxHistory)) {
      this.processes.delete(proc.pid);
    }
  }

  public stats(): ProcessManagerStats {
    const all = this.list();
    return {
      total: all.length,
      running: all.filter((p) => p.status === "RUNNING").length,
      completed: all.filter((p) => p.status === "COMPLETED").length,
      failed: all.filter((p) => p.status === "FAILED").length,
      killed: all.filter((p) => p.status === "KILLED").length,
      activePids: all.filter((p) => p.status === "RUNNING").map((p) => p.pid),
    };
  }

  public clearFinished(): number {
    let cleared = 0;
    for (const [pid, proc] of this.processes.entries()) {
      if (proc.status !== "RUNNING") {
        this.processes.delete(pid);
        cleared++;
      }
    }
    return cleared;
  }
}
