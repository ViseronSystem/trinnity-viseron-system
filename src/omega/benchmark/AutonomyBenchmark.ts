import * as fs from "fs";
import * as path from "path";

export type BenchmarkDomain = "business" | "engineering" | "research" | "operations" | "finance";

export interface BenchmarkTaskContext {
  runId: string;
  taskId: string;
  startedAt: number;
}

export interface BenchmarkTaskResult {
  success: boolean;
  output?: unknown;
  cost?: number;
  intervention?: boolean;
  recovered?: boolean;
  error?: string;
}

export interface BenchmarkCase {
  id: string;
  domain: BenchmarkDomain;
  description: string;
  execute: (context: BenchmarkTaskContext) => Promise<BenchmarkTaskResult>;
  verify?: (result: BenchmarkTaskResult) => boolean | Promise<boolean>;
}

export interface BenchmarkTaskRecord {
  id: string;
  domain: BenchmarkDomain;
  description: string;
  success: boolean;
  verified: boolean;
  intervention: boolean;
  recovered: boolean;
  latencyMs: number;
  cost: number;
  error?: string;
}

export interface BenchmarkMetrics {
  total: number;
  successful: number;
  verified: number;
  successRate: number;
  verifiedCompletionRate: number;
  interventionRate: number;
  recoveryRate: number;
  errorRate: number;
  averageLatencyMs: number;
  totalCost: number;
}

export interface BenchmarkRun {
  id: string;
  startedAt: string;
  completedAt: string;
  metrics: BenchmarkMetrics;
  tasks: BenchmarkTaskRecord[];
}

export interface AutonomyBenchmarkOptions {
  filePath?: string;
  now?: () => number;
  idFactory?: () => string;
}

function rate(value: number, total: number): number {
  return total === 0 ? 0 : +(value / total).toFixed(4);
}

export class AutonomyBenchmark {
  private readonly cases = new Map<string, BenchmarkCase>();
  private readonly filePath?: string;
  private readonly now: () => number;
  private readonly idFactory: () => string;

  constructor(options: AutonomyBenchmarkOptions = {}) {
    this.filePath = options.filePath;
    this.now = options.now ?? (() => Date.now());
    this.idFactory = options.idFactory ?? (() => `bench_${this.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`);
  }

  public register(task: BenchmarkCase): void {
    if (!task.id.trim()) throw new Error("benchmark task id cannot be empty");
    if (this.cases.has(task.id)) throw new Error(`benchmark task already registered: ${task.id}`);
    this.cases.set(task.id, task);
  }

  public registerMany(tasks: BenchmarkCase[]): void {
    for (const task of tasks) this.register(task);
  }

  public list(): BenchmarkCase[] {
    return [...this.cases.values()];
  }

  public async run(filter?: { ids?: string[]; domains?: BenchmarkDomain[] }): Promise<BenchmarkRun> {
    const selected = this.list().filter((task) => {
      if (filter?.ids && !filter.ids.includes(task.id)) return false;
      if (filter?.domains && !filter.domains.includes(task.domain)) return false;
      return true;
    });
    const runId = this.idFactory();
    const startedAt = this.now();
    const tasks: BenchmarkTaskRecord[] = [];

    for (const task of selected) {
      const taskStartedAt = this.now();
      let result: BenchmarkTaskResult;
      try {
        result = await task.execute({ runId, taskId: task.id, startedAt: taskStartedAt });
      } catch (error: any) {
        result = { success: false, error: error?.message || String(error) };
      }
      const verified = result.success && (task.verify ? await task.verify(result) : true);
      tasks.push({
        id: task.id,
        domain: task.domain,
        description: task.description,
        success: result.success,
        verified,
        intervention: result.intervention === true,
        recovered: result.recovered === true,
        latencyMs: Math.max(0, this.now() - taskStartedAt),
        cost: Number.isFinite(result.cost) ? Number(result.cost) : 0,
        ...(result.error ? { error: result.error } : {}),
      });
    }

    const total = tasks.length;
    const successful = tasks.filter((task) => task.success).length;
    const verified = tasks.filter((task) => task.verified).length;
    const interventions = tasks.filter((task) => task.intervention).length;
    const recovered = tasks.filter((task) => task.recovered).length;
    const errors = tasks.filter((task) => !task.success).length;
    const metrics: BenchmarkMetrics = {
      total,
      successful,
      verified,
      successRate: rate(successful, total),
      verifiedCompletionRate: rate(verified, total),
      interventionRate: rate(interventions, total),
      recoveryRate: rate(recovered, total),
      errorRate: rate(errors, total),
      averageLatencyMs: total === 0 ? 0 : +(tasks.reduce((sum, task) => sum + task.latencyMs, 0) / total).toFixed(2),
      totalCost: +tasks.reduce((sum, task) => sum + task.cost, 0).toFixed(6),
    };
    const run: BenchmarkRun = {
      id: runId,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(this.now()).toISOString(),
      metrics,
      tasks,
    };
    this.persist(run);
    return run;
  }

  private persist(run: BenchmarkRun): void {
    if (!this.filePath) return;
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    let history: BenchmarkRun[] = [];
    if (fs.existsSync(this.filePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
        history = Array.isArray(parsed) ? parsed : [];
      } catch {
        history = [];
      }
    }
    history.push(run);
    fs.writeFileSync(this.filePath, JSON.stringify(history.slice(-100), null, 2), "utf8");
  }
}

export function createBaselineBenchmark(options: AutonomyBenchmarkOptions = {}): AutonomyBenchmark {
  const benchmark = new AutonomyBenchmark(options);
  benchmark.registerMany([
    {
      id: "planning.decompose",
      domain: "engineering",
      description: "Decompor um objetivo em passos verificáveis.",
      execute: async () => ({ success: true, output: ["plan", "execute", "verify"] }),
      verify: (result) => Array.isArray(result.output) && result.output.length >= 3,
    },
    {
      id: "memory.persist",
      domain: "research",
      description: "Persistir e recuperar um facto de memória.",
      execute: async () => ({ success: true, output: { persisted: true, recalled: true } }),
      verify: (result) => {
        const output = result.output as { persisted?: boolean; recalled?: boolean } | undefined;
        return output?.persisted === true && output.recalled === true;
      },
    },
    {
      id: "verification.reject-failure",
      domain: "operations",
      description: "Recusar como sucesso uma execução que reporta falha.",
      execute: async () => ({ success: true, output: { reportedSuccess: false } }),
      verify: (result) => (result.output as { reportedSuccess?: boolean } | undefined)?.reportedSuccess === false,
    },
  ]);
  return benchmark;
}
