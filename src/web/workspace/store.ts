import fs from "fs";
import path from "path";

/**
 * WorkspaceStore — persistência real de workspace/projects/tasks por tenant.
 *
 * Isolamento por tenant: cada tenant tem o seu próprio ficheiro JSON em
 * `<dataDir>/workspace/<tenantId>/state.json`. Os ficheiros produzidos pelos
 * agentes ficam no sandbox `<dataDir>/workspace/<tenantId>/projects/<projectId>/`.
 * Nada usa localStorage do browser — tudo é persistido no servidor.
 */

export type TaskStage =
  | "PENDING"
  | "PLANNING"
  | "EXECUTING"
  | "TESTING"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface WorkspaceProject {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceTaskTool {
  id: string;
  name?: string;
  input: Record<string, any>;
}

export interface WorkspaceTaskEvent {
  topic: string;
  source?: string;
  ts: number;
  payload: any;
}

export interface WorkspaceTask {
  id: string;
  tenantId: string;
  projectId: string;
  userId: string;
  title: string;
  description: string;
  stage: TaskStage;
  kernelTaskId?: string;
  tools: WorkspaceTaskTool[];
  authorizedBy: string;
  result?: any;
  error?: string;
  events: WorkspaceTaskEvent[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface TenantState {
  projects: WorkspaceProject[];
  tasks: WorkspaceTask[];
}

const MAX_EVENTS_PER_TASK = 200;

export class WorkspaceStore {
  constructor(private readonly dataDir: string) {}

  public workspaceDir(): string {
    return path.join(this.dataDir, "workspace");
  }

  public tenantDir(tenantId: string): string {
    return path.join(this.dataDir, "workspace", this.safeId(tenantId));
  }

  private stateFile(tenantId: string): string {
    return path.join(this.tenantDir(tenantId), "state.json");
  }

  private load(tenantId: string): TenantState {
    const file = this.stateFile(tenantId);
    try {
      if (fs.existsSync(file)) {
        const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
        return {
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        };
      }
    } catch (err: any) {
      console.warn(`[WorkspaceStore] Falha ao ler ${file}: ${err?.message || err}`);
    }
    return { projects: [], tasks: [] };
  }

  private save(tenantId: string, data: TenantState): void {
    const file = this.stateFile(tenantId);
    try {
      const dir = path.dirname(file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = `${file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
      fs.renameSync(tmp, file);
    } catch (err: any) {
      console.error(`[WorkspaceStore] Falha ao gravar ${file}: ${err?.message || err}`);
    }
  }

  private safeId(id: string): string {
    const clean = String(id || "").replace(/[^a-zA-Z0-9._-]/g, "");
    if (!clean) throw new Error("id inválido");
    return clean;
  }

  private newId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }

  // ── Projects ──────────────────────────────────────────────

  public createProject(tenantId: string, ownerId: string, input: { name: string; description?: string }): WorkspaceProject {
    const data = this.load(tenantId);
    const now = new Date().toISOString();
    const project: WorkspaceProject = {
      id: this.newId("proj"),
      tenantId: this.safeId(tenantId),
      ownerId: this.safeId(ownerId),
      name: String(input.name || "Sem nome").slice(0, 120),
      description: String(input.description || "").slice(0, 2000),
      createdAt: now,
      updatedAt: now,
    };
    data.projects.push(project);
    this.save(tenantId, data);
    return project;
  }

  public listProjects(tenantId: string): WorkspaceProject[] {
    return this.load(tenantId).projects.slice().reverse();
  }

  public getProject(tenantId: string, projectId: string): WorkspaceProject | undefined {
    return this.load(tenantId).projects.find((p) => p.id === projectId);
  }

  // ── Tasks ─────────────────────────────────────────────────

  public createTask(
    tenantId: string,
    userId: string,
    projectId: string,
    input: { title: string; description?: string; tools?: WorkspaceTaskTool[] }
  ): WorkspaceTask {
    const data = this.load(tenantId);
    const now = new Date().toISOString();
    const task: WorkspaceTask = {
      id: this.newId("task"),
      tenantId: this.safeId(tenantId),
      projectId: this.safeId(projectId),
      userId: this.safeId(userId),
      title: String(input.title || "Sem título").slice(0, 200),
      description: String(input.description || "").slice(0, 4000),
      stage: "PENDING",
      tools: Array.isArray(input.tools) ? input.tools : [],
      authorizedBy: this.safeId(userId),
      events: [],
      createdAt: now,
      updatedAt: now,
    };
    data.tasks.push(task);
    this.save(tenantId, data);
    return task;
  }

  public getTask(tenantId: string, taskId: string): WorkspaceTask | undefined {
    return this.load(tenantId).tasks.find((t) => t.id === taskId);
  }

  public getTaskByKernelTaskId(tenantId: string, kernelTaskId: string): WorkspaceTask | undefined {
    return this.load(tenantId).tasks.find((t) => t.kernelTaskId === kernelTaskId);
  }

  public listTasks(tenantId: string, projectId?: string): WorkspaceTask[] {
    const all = this.load(tenantId).tasks.slice().reverse();
    return projectId ? all.filter((t) => t.projectId === projectId) : all;
  }

  public updateTask(tenantId: string, taskId: string, patch: Partial<WorkspaceTask>): WorkspaceTask | undefined {
    const data = this.load(tenantId);
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;
    Object.assign(task, patch, { updatedAt: new Date().toISOString() });
    this.save(tenantId, data);
    return task;
  }

  public appendEvent(tenantId: string, taskId: string, event: WorkspaceTaskEvent): void {
    const data = this.load(tenantId);
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.events.push(event);
    if (task.events.length > MAX_EVENTS_PER_TASK) {
      task.events = task.events.slice(task.events.length - MAX_EVENTS_PER_TASK);
    }
    task.updatedAt = new Date().toISOString();
    this.save(tenantId, data);
  }
}
