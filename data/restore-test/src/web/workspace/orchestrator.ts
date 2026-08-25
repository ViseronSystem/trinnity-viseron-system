import { WorkspaceStore, WorkspaceTask, TaskStage } from "./store";

/**
 * UserTaskOrchestrator — liga o workspace persistido ao kernel OMEGA real.
 *
 * O utilizador submete uma tarefa → o orchestrator persiste o registo,
 * enfileira a tarefa no kernel OMEGA (`kernel.runTask`) com o agente
 * VISERON BUILDER + ferramentas reais + verificação + memória, e sincroniza
 * o estado do registo através dos eventos auditáveis do kernel (`task.*`).
 *
 * Sem kernel OMEGA carregado → a submissão falha de forma HONESTA
 * (`omegaLoaded: false`), nunca inventa execução.
 */

const KERNEL_TO_STAGE: Record<string, TaskStage> = {
  CREATED: "PLANNING",
  PLANNING: "PLANNING",
  QUEUED: "PLANNING",
  RUNNING: "EXECUTING",
  VERIFYING: "VERIFYING",
  RECOVERING: "EXECUTING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};

export class UserTaskOrchestrator {
  private omega: any = null;
  private unsub?: () => void;
  private unsubTools?: () => void;

  constructor(private readonly store: WorkspaceStore) {}

  public attach(omega: any): void {
    if (!omega || !omega.kernel || !omega.kernel.events) return;
    this.omega = omega;
    this.unsub?.();
    this.unsubTools?.();
    this.unsub = omega.kernel.events.subscribe("task.*", (payload: any, meta: any) => {
      this.handleEvent(meta.topic, payload, meta);
    });
    // Eventos de ferramentas também são auditáveis no workspace (tool.called/
    // tool.completed/tool.failed trazem `taskId` do kernel para casar com a tarefa).
    this.unsubTools = omega.kernel.events.subscribe("tool.*", (payload: any, meta: any) => {
      this.handleToolEvent(meta.topic, payload, meta);
    });
  }

  public isReady(): boolean {
    return !!this.omega && !!this.omega.kernel && typeof this.omega.kernel.runTask === "function";
  }

  public status(): Record<string, any> {
    const ready = this.isReady();
    const base: Record<string, any> = {
      omegaLoaded: ready,
      mode: ready ? "REAL" : "NOT_LOADED",
    };
    try {
      const s = this.omega.status();
      base.kernel = {
        tasks: s?.kernel?.tasks ?? 0,
        verified: s?.kernel?.verified ?? 0,
        completed: s?.kernel?.completed ?? 0,
        failed: s?.kernel?.failed ?? 0,
        tools: s?.kernel?.tools ?? 0,
        agents: s?.kernel?.agents ?? 0,
      };
    } catch (err: any) {
      base.kernelError = String(err?.message || err);
    }
    return base;
  }

  public async submit(
    tenantId: string,
    userId: string,
    projectId: string,
    input: { title: string; description?: string; tools?: Array<{ id: string; name?: string; input: Record<string, any> }> }
  ): Promise<WorkspaceTask> {
    const task = this.store.createTask(tenantId, userId, projectId, input);

    if (!this.isReady()) {
      this.store.updateTask(tenantId, task.id, {
        stage: "FAILED",
        error: "OMEGA não carregado — o kernel real não está ativo. Execução não iniciada (honesto, sem mock).",
        completedAt: new Date().toISOString(),
      });
      return this.store.getTask(tenantId, task.id)!;
    }

    // O envio da tarefa pelo utilizador é a AUTORIZAÇÃO explícita da execução
    // das ferramentas (gate de autonomia OMEGA: `authorized: true`).
    const tools = (task.tools ?? []).map((t) => ({
      id: t.id,
      input: { ...(t.input ?? {}), tenantId, projectId, authorized: true },
    }));

    let kernelTask: any;
    try {
      kernelTask = await this.omega.kernel.runTask("user_task", task.title, {
        assignedAgentId: "viseron_builder",
        protocol: "tool2phase",
        description: task.description || task.title,
        tenantId,
        projectId,
        userId,
        authorized: true,
        tools,
        verify: { require: ["success"], requireTruthy: "output" },
      });
    } catch (err: any) {
      this.store.updateTask(tenantId, task.id, {
        stage: "FAILED",
        error: `kernel recusou a tarefa: ${err?.message || String(err)}`,
        completedAt: new Date().toISOString(),
      });
      return this.store.getTask(tenantId, task.id)!;
    }

    this.store.updateTask(tenantId, task.id, {
      kernelTaskId: kernelTask?.id,
      stage: KERNEL_TO_STAGE[kernelTask?.state] ?? "PENDING",
    });

    return this.store.getTask(tenantId, task.id)!;
  }

  public cancel(tenantId: string, taskId: string): { ok: boolean; error?: string } {
    const task = this.store.getTask(tenantId, taskId);
    if (!task) return { ok: false, error: "tarefa não encontrada" };
    if (!task.kernelTaskId) return { ok: false, error: "tarefa sem kernelTaskId" };
    if (!this.isReady()) return { ok: false, error: "OMEGA não carregado" };
    const cancelled = this.omega.kernel.tasks.cancel(task.kernelTaskId);
    return cancelled ? { ok: true } : { ok: false, error: "tarefa não cancelável (já terminou?)" };
  }

  private handleEvent(topic: string, payload: any, meta: any): void {
    try {
      const taskId = payload?.id;
      if (!taskId || typeof taskId !== "string") return;
      const allTenants = this.findTenantsForTask(taskId);
      for (const tenantId of allTenants) {
        // O kernel identifica a tarefa pelo id do kernel; o registo do workspace
        // guarda esse id em `kernelTaskId`. Fallback por `id` cobre qualquer caso
        // em que os dois coincidam.
        const task = this.store.getTaskByKernelTaskId(tenantId, taskId) ?? this.store.getTask(tenantId, taskId);
        if (!task) continue;
        if (meta?.topic === "task:completed" || meta?.topic === "task:failed" || meta?.topic === "task:cancelled") {
          if (meta?.topic === "task:completed") {
            this.store.updateTask(tenantId, task.id, {
              stage: "COMPLETED",
              result: payload?.result ?? null,
              error: undefined,
              completedAt: new Date().toISOString(),
            });
          } else if (meta?.topic === "task:failed") {
            this.store.updateTask(tenantId, task.id, {
              stage: "FAILED",
              result: payload?.result ?? null,
              error: payload?.error || payload?.result?.error || "execução falhou",
              completedAt: new Date().toISOString(),
            });
          } else {
            this.store.updateTask(tenantId, task.id, {
              stage: "CANCELLED",
              error: "cancelada pelo utilizador",
              completedAt: new Date().toISOString(),
            });
          }
        } else {
          const stage = KERNEL_TO_STAGE[payload?.state] ?? task.stage;
          this.store.updateTask(tenantId, task.id, { stage });
        }
        this.store.appendEvent(tenantId, task.id, {
          topic: meta?.topic ?? topic,
          source: meta?.source,
          ts: meta?.timestamp ?? Date.now(),
          payload: this.summarize(payload),
        });
      }
    } catch (err: any) {
      console.warn(`[Workspace] handleEvent falhou: ${err?.message || err}`);
    }
  }

  private handleToolEvent(topic: string, payload: any, meta: any): void {
    try {
      const taskId = payload?.taskId;
      if (!taskId || typeof taskId !== "string") return;
      const allTenants = this.findTenantsForTask(taskId);
      for (const tenantId of allTenants) {
        const task = this.store.getTaskByKernelTaskId(tenantId, taskId);
        if (!task) continue;
        this.store.appendEvent(tenantId, task.id, {
          topic: meta?.topic ?? topic,
          source: meta?.source,
          ts: meta?.timestamp ?? Date.now(),
          payload: {
            toolId: payload?.toolId,
            success: payload?.success,
            result: payload?.result ?? null,
            error: payload?.error ?? null,
            executionTimeMs: payload?.executionTimeMs,
          },
        });
      }
    } catch (err: any) {
      console.warn(`[Workspace] handleToolEvent falhou: ${err?.message || err}`);
    }
  }

  private findTenantsForTask(taskId: string): string[] {
    // O kernel não conhece tenants; varre os ficheiros de estado do workspace
    // para encontrar o tenant dono do kernelTaskId. Barato: só corre em eventos.
    const found: string[] = [];
    try {
      const { readdirSync, existsSync } = require("fs") as typeof import("fs");
      const path = require("path") as typeof import("path");
      const fs2 = require("fs") as typeof import("fs");
      const base = path.join(this.store.getDataDir(), "workspace");
      if (!existsSync(base)) return found;
      for (const tenantId of readdirSync(base)) {
        const stateFile = path.join(base, tenantId, "state.json");
        if (!existsSync(stateFile)) continue;
        try {
          const data = JSON.parse(fs2.readFileSync(stateFile, "utf8"));
          const tasks: any[] = Array.isArray(data?.tasks) ? data.tasks : [];
          if (tasks.some((t) => t.kernelTaskId === taskId || t.id === taskId)) found.push(tenantId);
        } catch {
          /* ignora ficheiro corrompido */
        }
      }
    } catch {
      /* se o scan falhar, não sincroniza — nunca quebra o kernel */
    }
    return found;
  }

  private summarize(payload: any): Record<string, any> {
    if (payload == null) return {};
    const { result, ...rest } = payload;
    const summary: Record<string, any> = { ...rest };
    if (result && typeof result === "object") {
      summary.resultSummary = {
        success: result.success,
        executedBy: result.executedBy,
        model: result.model ?? null,
        tools: result.tools?.length ?? 0,
        latencyMs: result.latencyMs,
      };
    }
    return summary;
  }
}
