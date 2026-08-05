import * as fs from "fs";
import * as path from "path";
import { AgentRuntime } from "../omega/agent-runtime/AgentRuntime";
import { ProcessManager } from "./ProcessManager";

export const OS_ROOTS = ["home", "apps", "agents", "processes", "memory", "models", "workspace", "system"] as const;
export type OSRoot = (typeof OS_ROOTS)[number];

export interface VFSEntry {
  name: string;
  type: "dir" | "file" | "virtual";
  size?: number;
  modifiedAt?: number;
}

export interface VirtualFileSystemOptions {
  baseDir?: string;
  runtime?: AgentRuntime;
  processes?: ProcessManager;
  installedApps?: () => string[];
}

export class VirtualFileSystem {
  private readonly baseDir: string;
  private readonly runtime?: AgentRuntime;
  private readonly processes?: ProcessManager;
  private readonly installedApps?: () => string[];

  constructor(options: VirtualFileSystemOptions = {}) {
    this.baseDir = options.baseDir ?? path.join(process.cwd(), "data", "tvs-os");
    this.runtime = options.runtime;
    this.processes = options.processes;
    this.installedApps = options.installedApps;
    this.ensureRoots();
  }

  private ensureRoots(): void {
    try {
      for (const root of OS_ROOTS) {
        fs.mkdirSync(path.join(this.baseDir, root), { recursive: true });
      }
    } catch (err) {
      console.error(`[TVS-FS] Falha a criar raízes em ${this.baseDir}: ${(err as Error).message}`);
    }
  }

  private sanitize(relPath: string): string {
    const normalized = path.normalize(relPath || "/").replace(/\\/g, "/");
    const clean = normalized.startsWith("/") ? normalized.slice(1) : normalized;
    if (clean.split("/").some((seg) => seg === "..")) throw new Error("[TVS-FS] Caminho inválido (.. não permitido)");
    return clean;
  }

  private resolve(relPath: string): string {
    const clean = this.sanitize(relPath);
    return path.join(this.baseDir, clean);
  }

  public ls(relPath?: string): VFSEntry[] {
    const clean = this.sanitize(relPath || "/");

    if (clean === "" || clean === ".") {
      return OS_ROOTS.map((name) => ({ name, type: "dir" as const }));
    }

    const parts = clean.split("/").filter(Boolean);
    const root = parts[0] as OSRoot;
    if (!OS_ROOTS.includes(root)) throw new Error(`[TVS-FS] Raiz "${root}" não existe`);

    if (root === "agents") {
      const agents = this.runtime?.listAgents() ?? [];
      return agents.map((a) => ({ name: `${a.id}.json`, type: "file" as const, size: 256, modifiedAt: Date.now() }));
    }

    if (root === "processes") {
      const procs = this.processes?.list() ?? [];
      return procs.map((p) => ({ name: `${p.pid}_${p.agentId}.${p.status.toLowerCase()}`, type: "file" as const, size: 128, modifiedAt: p.startedAt }));
    }

    if (root === "apps") {
      const apps = this.installedApps?.() ?? [];
      return apps.map((a) => ({ name: `${a}.app`, type: "file" as const, size: 512, modifiedAt: Date.now() }));
    }

    const dirPath = path.join(this.baseDir, clean);
    if (!fs.existsSync(dirPath)) return [];
    if (fs.statSync(dirPath).isFile()) {
      return [{ name: parts[parts.length - 1], type: "file" as const, size: fs.statSync(dirPath).size, modifiedAt: fs.statSync(dirPath).mtimeMs }];
    }
    return fs.readdirSync(dirPath).map((name) => {
      const full = path.join(dirPath, name);
      const st = fs.statSync(full);
      return { name, type: st.isDirectory() ? "dir" as const : "file" as const, size: st.size, modifiedAt: st.mtimeMs };
    });
  }

  public read(relPath: string): string {
    const clean = this.sanitize(relPath);
    const parts = clean.split("/").filter(Boolean);
    const root = parts[0] as OSRoot;

    if (root === "processes") {
      const pid = parseInt(parts[1]?.split("_")[0] ?? "0", 10);
      const proc = this.processes?.get(pid);
      return proc ? JSON.stringify(proc, null, 2) : `[TVS-FS] Processo ${pid} não encontrado`;
    }
    if (root === "agents") {
      const id = parts[1]?.replace(/\.json$/, "");
      const agent = this.runtime?.getAgent(id ?? "");
      return agent ? JSON.stringify({ id: agent.id, name: agent.name, role: agent.role, description: agent.description, capabilities: agent.capabilities }, null, 2) : `[TVS-FS] Agente ${id} não encontrado`;
    }

    const full = this.resolve(relPath);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) throw new Error(`[TVS-FS] Ficheiro não existe: ${clean}`);
    return fs.readFileSync(full, "utf-8");
  }

  public write(relPath: string, content: string): { path: string; bytes: number } {
    const full = this.resolve(relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf-8");
    return { path: "/" + this.sanitize(relPath), bytes: Buffer.byteLength(content) };
  }

  public mkdir(relPath: string): { path: string } {
    const full = this.resolve(relPath);
    fs.mkdirSync(full, { recursive: true });
    return { path: "/" + this.sanitize(relPath) };
  }

  public exists(relPath: string): boolean {
    try {
      return fs.existsSync(this.resolve(relPath));
    } catch {
      return false;
    }
  }

  public root(): string {
    return this.baseDir;
  }

  public status(): { root: string; roots: string[] } {
    return { root: this.baseDir, roots: [...OS_ROOTS] };
  }
}
