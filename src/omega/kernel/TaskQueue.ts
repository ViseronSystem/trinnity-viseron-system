import { EventBus } from "./EventBus";

export type TaskPriority = "critical" | "high" | "normal" | "low";
export type TaskState = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

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
  result?: TResult;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export type TaskExecutor<TPayload = any, TResult = any> = (task: KernelTask<TPayload>, meta: any) => Promise<TResult>;

export interface TaskQueueOptions {
  concurrency?: number;
  defaultMaxAttempts?: number;
}export interface TaskQueueStats {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  total: number;
}

export class TaskQueue {
  private queue: KernelTask[] = [];
  private running = 0;
  private executors = new Map<string, TaskExecutor>();
  private defaultExecutor?: TaskExecutor;
  private completed = 0;
  private failed = 0;
  private cancelled = 0;
  private total = 0;
  private readonly concurrency: number;
  private readonly defaultMaxAttempts: number;
  private readonly bus: EventBus;

  constructor(bus: EventBus, options: TaskQueueOptions = {}) {
    this.bus = bus;
    this.concurrency = options.concurrency ?? 4;
    this.defaultMaxAttempts = options.defaultMaxAttempts ?? 3;
  }

  public registerExecutor<TPayload = any, TResult = any>(taskType: string, executor: TaskExecutor<TPayload, TResult>): void {
    this.executors.set(taskType, executor as TaskExecutor);
  }

  public setDefaultExecutor<TPayload = any, TResult = any>(executor: TaskExecutor<TPayload, TResult>): void {
    this.defaultExecutor = executor as TaskExecutor;
  }

  public async enqueue<TPayload = any, TResult = any>(
    type: string,
    title: string,
    payload?: TPayload,
    priority: TaskPriority = "normal"
  ): Promise<KernelTask<TPayload, TResult>> {
    const task: KernelTask<TPayload, TResult> = {
      id: `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      payload,
      priority,
      state: "QUEUED",
      attempts: 0,
      maxAttempts: this.defaultMaxAttempts,
      createdAt: Date.now(),
    };
    this.queue.push(task as KernelTask);
    this.total++;
    await this.bus.publish("task:queued", task, "task-queue");
    this.drain();
    return task;
  }

  public cancel(taskId: string): boolean {
    const task = this.queue.find((t) => t.id === taskId && t.state === "QUEUED");
    if (!task) return false;
    task.state = "CANCELLED";
    this.cancelled++;
    void this.bus.publish("task:cancelled", task, "task-queue");
    return true;
  }

  public peek(): KernelTask[] {
    return [...this.queue].sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority));
  }

  public getStats(): TaskQueueStats {
    return {
      queued: this.queue.length,
      running: this.running,
      completed: this.completed,
      failed: this.failed,
      cancelled: this.cancelled,
      total: this.total,
    };
  }

  public getPendingCount(): number {
    return this.queue.length;
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
      void this.bus.publish("task:started", task, "task-queue");
      void this.execute(task);
    }
  }

  private async execute(task: KernelTask): Promise<void> {
    const executor = this.executors.get(task.type) ?? this.defaultExecutor;
    try {
      if (!executor) {
        throw new Error(`[TaskQueue] No executor registered for task type "${task.type}"`);
      }
      const result = await executor(task, { taskId: task.id });
      task.state = "COMPLETED";
      task.result = result;
      task.completedAt = Date.now();
      this.completed++;
      await this.bus.publish("task:completed", task, "task-queue");
    } catch (err: any) {
      task.error = err?.message || String(err);
      if (task.attempts < task.maxAttempts) {
        this.queue.push(task);
        await this.bus.publish("task:retrying", task, "task-queue");
      } else {
        task.state = "FAILED";
        task.completedAt = Date.now();
        this.failed++;
        await this.bus.publish("task:failed", task, "task-queue");
      }
    } finally {
      this.running--;
      this.drain();
    }
  }

  private priorityWeight(p: TaskPriority): number {
    return { critical: 4, high: 3, normal: 2, low: 1 }[p];
  }
}
