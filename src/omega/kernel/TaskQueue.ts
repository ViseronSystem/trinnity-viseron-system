import { EventBus } from "./EventBus";
import * as fs from "fs";
import * as path from "path";

export type TaskPriority = "critical" | "high" | "normal" | "low";
export type TaskState =
  | "CREATED"
  | "PLANNING"
  | "QUEUED"
  | "RUNNING"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "RECOVERING"
  | "CANCELLED";

export type VerificationStatus = "PASS" | "FAIL" | "RETRY" | "HUMAN";

export interface TaskVerification {
  status: VerificationStatus;
  reasons: string[];
  evidence?: any;
  at?: number;
}

export interface TaskToolCall {
  toolId: string;
  input: any;
  success: boolean;
  result?: any;
  error?: string;
  executionTimeMs: number;
}

export interface TaskPlanStep {
  action: string;
  description: string;
  tool?: string;
  input?: any;
}

export interface KernelTask<TPayload = any, TResult = any> {
  id: string;
  type: string;
  title: string;
  payload?: TPayload;
  priority: TaskPriority;
  state: TaskState;
  assignedAgentId?: string;
  attempts: number;
  maxAttempts: number;
  plan?: TaskPlanStep[];
  tools?: TaskToolCall[];
  verification?: TaskVerification;
  cancelRequested?: boolean;
  latencyMs?: number;
  cost?: number;
  result?: TResult;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export type TaskExecutor<TPayload = any, TResult = any> = (task: KernelTask<TPayload>, meta: any) => Promise<TResult>;
export type TaskPlanner = (task: KernelTask) => TaskPlanStep[] | Promise<TaskPlanStep[]>;
export type TaskVerifierFn = (task: KernelTask, result: any, meta: any) => TaskVerification | Promise<TaskVerification>;

export interface TaskQueueOptions {
  concurrency?: number;
  defaultMaxAttempts?: number;
  filePath?: string;
}

export interface TaskQueueStats {
  queued: number;
  running: number;
  verifying: number;
  recovering: number;
  completed: number;
  failed: number;
  cancelled: number;
  total: number;
  verified: number;
}

const TERMINAL_STATES: TaskState[] = ["COMPLETED", "FAILED", "CANCELLED"];

export class TaskQueue {
  private queue: KernelTask[] = [];
  private runningTasks = new Map<string, KernelTask>();
  private archive: KernelTask[] = [];
  private executors = new Map<string, TaskExecutor>();
  private defaultExecutor?: TaskExecutor;
  private planner?: TaskPlanner;
  private verifier?: TaskVerifierFn;
  private running = 0;
  private completed = 0;
  private failed = 0;
  private cancelled = 0;
  private verified = 0;
  private total = 0;
  private readonly concurrency: number;
  private readonly defaultMaxAttempts: number;
  private readonly bus: EventBus;
  private readonly filePath: string | null;

  constructor(bus: EventBus, options: TaskQueueOptions = {}) {
    this.bus = bus;
    this.concurrency = options.concurrency ?? 4;
    this.defaultMaxAttempts = options.defaultMaxAttempts ?? 3;
    this.filePath = options.filePath ?? null;
    if (this.filePath && fs.existsSync(this.filePath)) this.load();
  }

  public registerExecutor<TPayload = any, TResult = any>(taskType: string, executor: TaskExecutor<TPayload, TResult>): void {
    this.executors.set(taskType, executor as TaskExecutor);
  }

  public setDefaultExecutor<TPayload = any, TResult = any>(executor: TaskExecutor<TPayload, TResult>): void {
    this.defaultExecutor = executor as TaskExecutor;
  }

  public setPlanner(planner: TaskPlanner): void {
    this.planner = planner;
  }

  public setVerifier(verifier: TaskVerifierFn): void {
    this.verifier = verifier;
  }

  public async enqueue<TPayload = any, TResult = any>(
    type: string,
    title: string,
    payload?: TPayload,
    priority: TaskPriority = "normal"
  ): Promise<KernelTask<TPayload, TResult>> {
    const now = Date.now();
    const task: KernelTask<TPayload, TResult> = {
      id: `task_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      payload,
      priority,
      state: "CREATED",
      attempts: 0,
      maxAttempts: this.defaultMaxAttempts,
      createdAt: now,
    };
    this.total++;
    await this.bus.publish("task:created", task, "task-queue");
    await this.plan(task);
    task.state = "QUEUED";
    this.queue.push(task);
    await this.bus.publish("task:queued", task, "task-queue");
    this.save();
    this.drain();
    return task;
  }

  public cancel(taskId: string): boolean {
    const task = this.queue.find((t) => t.id === taskId && t.state === "QUEUED");
    if (task) {
      task.state = "CANCELLED";
      task.completedAt = Date.now();
      this.cancelled++;
      this.archive.push(task);
      void this.bus.publish("task:cancelled", task, "task-queue");
      this.save();
      return true;
    }
    const running = this.runningTasks.get(taskId);
    if (running) {
      running.cancelRequested = true;
      return true;
    }
    return false;
  }

  public getTask(taskId: string): KernelTask | undefined {
    return this.queue.find((t) => t.id === taskId) ?? this.runningTasks.get(taskId) ?? this.archive.find((t) => t.id === taskId);
  }

  public listTasks(status?: string): KernelTask[] {
    const all = [...this.queue, ...this.runningTasks.values(), ...this.archive];
    return status ? all.filter((t) => t.state === status) : all;
  }

  public history(): KernelTask[] {
    return [...this.archive];
  }

  public resume(): void {
    this.drain();
  }

  public verifierStats(): { attached: boolean; verified: number; failed: number } {
    return { attached: !!this.verifier, verified: this.verified, failed: this.failed };
  }

  public peek(): KernelTask[] {
    return [...this.queue].sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority));
  }

  public getStats(): TaskQueueStats {
    let verifying = 0;
    for (const t of this.runningTasks.values()) if (t.state === "VERIFYING") verifying++;
    return {
      queued: this.queue.length,
      running: this.running,
      verifying,
      recovering: this.queue.filter((t) => t.state === "RECOVERING").length,
      completed: this.completed,
      failed: this.failed,
      cancelled: this.cancelled,
      total: this.total,
      verified: this.verified,
    };
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  private async plan(task: KernelTask): Promise<void> {
    if (!this.planner) return;
    task.state = "PLANNING";
    const steps = await this.planner(task);
    task.plan = Array.isArray(steps) ? steps : [];
    await this.bus.publish("task:planned", task, "task-queue");
  }

  private async drain(): Promise<void> {
    while (this.running < this.concurrency && this.queue.length > 0) {
      this.queue.sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority));
      const task = this.queue.shift()!;
      if (task.state === "CANCELLED") continue;
      this.running++;
      task.state = "RUNNING";
      task.startedAt = Date.now();
      task.attempts++;
      task.cancelRequested = false;
      this.runningTasks.set(task.id, task);
      void this.bus.publish("task:started", task, "task-queue");
      this.save();
      void this.execute(task);
    }
  }

  private async execute(task: KernelTask): Promise<void> {
    const executor = this.executors.get(task.type) ?? this.defaultExecutor;
    try {
      if (!executor) {
        throw new Error(`[TaskQueue] No executor registered for task type "${task.type}"`);
      }
      const meta = { taskId: task.id };
      const result = await executor(task, meta);
      if (task.cancelRequested) {
        task.state = "CANCELLED";
        task.completedAt = Date.now();
        this.cancelled++;
        this.archive.push(task);
        await this.bus.publish("task:cancelled", task, "task-queue");
        this.save();
        return;
      }
      await this.verifyAndComplete(task, result, meta);
    } catch (err: any) {
      task.error = err?.message || String(err);
      const verificationError = err instanceof VerificationFailError ? err : null;
      const retryable = !verificationError || verificationError.verification.status === "RETRY";
      if (retryable && task.attempts < task.maxAttempts) {
        task.state = "RECOVERING";
        task.cancelRequested = false;
        await this.bus.publish("task:recovering", task, "task-queue");
        task.state = "QUEUED";
        this.queue.push(task);
        this.save();
      } else {
        task.state = "FAILED";
        task.completedAt = Date.now();
        this.failed++;
        if (verificationError) {
          task.verification = verificationError.verification;
          await this.bus.publish(`verification:${verificationError.verification.status.toLowerCase()}`, task, "task-queue");
        }
        await this.bus.publish("task:failed", task, "task-queue");
        this.archive.push(task);
        this.save();
      }
    } finally {
      this.runningTasks.delete(task.id);
      this.running--;
      this.drain();
    }
  }

  private async verifyAndComplete(task: KernelTask, result: any, meta: any): Promise<void> {
    const startedAt = task.startedAt ?? Date.now();
    task.latencyMs = Date.now() - startedAt;
    task.state = "VERIFYING";
    await this.bus.publish("task:verifying", task, "task-queue");
    if (!this.verifier) {
      task.result = result;
      await this.complete(task);
      return;
    }
    const verification = await this.verifier(task, result, meta);
    task.verification = { ...verification, at: Date.now() };
    await this.bus.publish(`verification:${verification.status.toLowerCase()}`, task, "task-queue");
    if (verification.status === "PASS") {
      this.verified++;
      task.result = result;
      await this.complete(task);
      return;
    }
    throw new VerificationFailError(task, verification);
  }

  private async complete(task: KernelTask): Promise<void> {
    task.state = "COMPLETED";
    task.completedAt = Date.now();
    this.completed++;
    this.archive.push(task);
    await this.bus.publish("task:completed", task, "task-queue");
    this.save();
  }

  private priorityWeight(p: TaskPriority): number {
    return { critical: 4, high: 3, normal: 2, low: 1 }[p];
  }

  private save(): void {
    if (!this.filePath) return;
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const payload = {
        queued: this.queue,
        running: Array.from(this.runningTasks.values()),
        archive: this.archive,
        counters: {
          completed: this.completed,
          failed: this.failed,
          cancelled: this.cancelled,
          verified: this.verified,
          total: this.total,
        },
      };
      fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), "utf-8");
    } catch (err: any) {
      console.warn(`[TaskQueue] save failed: ${err.message}`);
    }
  }

  private load(): void {
    if (!this.filePath || !fs.existsSync(this.filePath)) return;
    try {
      const payload = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      this.archive = Array.isArray(payload.archive) ? payload.archive : [];
      const counters = payload.counters ?? {};
      this.completed = counters.completed ?? 0;
      this.failed = counters.failed ?? 0;
      this.cancelled = counters.cancelled ?? 0;
      this.verified = counters.verified ?? 0;
      this.total = counters.total ?? 0;
      const pending: KernelTask[] = [...(payload.queued ?? []), ...(payload.running ?? [])];
      for (const t of pending) {
        if (!t || TERMINAL_STATES.includes(t.state)) continue;
        t.state = "RECOVERING";
        t.cancelRequested = false;
        void this.bus.publish("task:recovering", t, "task-queue");
        t.state = "QUEUED";
        this.queue.push(t);
      }
      this.total += this.queue.length;
    } catch (err: any) {
      console.warn(`[TaskQueue] Failed to load ${this.filePath}: ${err.message}`);
    }
  }
}

export class VerificationFailError extends Error {
  public readonly verification: TaskVerification;
  constructor(task: KernelTask, verification: TaskVerification) {
    super(`[TaskQueue] Task "${task.id}" failed verification: ${verification.reasons.join("; ") || verification.status}`);
    this.name = "VerificationFailError";
    this.verification = verification;
  }
}
