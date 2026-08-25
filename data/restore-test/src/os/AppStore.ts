import * as fs from "fs";
import * as path from "path";
import { EnterpriseHub } from "../omega/enterprise";
import { SquadRegistry } from "../omega/squads";
import { AgentRuntime } from "../omega/agent-runtime/AgentRuntime";

export type TVSAppKind = "agent" | "squad" | "module" | "skill";

export interface TVSApp {
  id: string;
  name: string;
  category: string;
  description: string;
  kind: TVSAppKind;
  tags: string[];
  installed: boolean;
}

export interface AppStoreOptions {
  runtime?: AgentRuntime;
  enterprise?: EnterpriseHub;
  squads?: SquadRegistry;
  dataFile?: string;
}

export class AppStore {
  private readonly runtime?: AgentRuntime;
  private readonly enterprise?: EnterpriseHub;
  private readonly squads?: SquadRegistry;
  private readonly dataFile: string;
  private installed = new Set<string>();

  constructor(options: AppStoreOptions = {}) {
    this.runtime = options.runtime;
    this.enterprise = options.enterprise;
    this.squads = options.squads;
    this.dataFile = options.dataFile ?? path.join(process.cwd(), "data", "tvs-os", "apps-installed.json");
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const raw = JSON.parse(fs.readFileSync(this.dataFile, "utf-8"));
        if (Array.isArray(raw)) for (const id of raw) this.installed.add(id);
      }
    } catch { /* estado de instalação corrompido — começa vazio */ }
  }

  private persist(): void {
    try {
      fs.mkdirSync(path.dirname(this.dataFile), { recursive: true });
      fs.writeFileSync(this.dataFile, JSON.stringify(Array.from(this.installed), null, 2), "utf-8");
    } catch (err) {
      console.error(`[TVS-OS] Falha a persistir app store: ${(err as Error).message}`);
    }
  }

  public catalog(): TVSApp[] {
    const apps: TVSApp[] = [];

    for (const agent of this.runtime?.listAgents() ?? []) {
      apps.push({
        id: agent.id,
        name: agent.name,
        category: "Agentes",
        description: agent.description ?? "",
        kind: "agent",
        tags: agent.capabilities ?? [],
        installed: this.isInstalled(agent.id),
      });
    }

    for (const squad of this.squads?.listSquads() ?? []) {
      apps.push({
        id: squad.id,
        name: squad.name,
        category: "Squads AIOX",
        description: squad.description ?? `Squad ${squad.domain}`,
        kind: "squad",
        tags: [squad.domain],
        installed: this.isInstalled(squad.id),
      });
    }

    for (const mod of this.enterprise?.listModules() ?? []) {
      apps.push({
        id: mod.id,
        name: mod.name,
        category: "Módulos Enterprise",
        description: mod.description ?? `Módulo ${mod.domain}`,
        kind: "module",
        tags: [mod.domain, ...(mod.kpis ?? [])],
        installed: this.isInstalled(mod.id),
      });
    }

    return apps.sort((a, b) => a.name.localeCompare(b.name));
  }

  public list(kind?: TVSAppKind): TVSApp[] {
    return kind ? this.catalog().filter((a) => a.kind === kind) : this.catalog();
  }

  public get(id: string): TVSApp | undefined {
    return this.catalog().find((a) => a.id === id);
  }

  public install(id: string): TVSApp {
    const app = this.get(id);
    if (!app) throw new Error(`[TVS-Store] App "${id}" não existe no catálogo`);
    this.installed.add(id);
    this.persist();
    return { ...app, installed: true };
  }

  public uninstall(id: string): TVSApp {
    const app = this.get(id);
    if (!app) throw new Error(`[TVS-Store] App "${id}" não existe no catálogo`);
    this.installed.delete(id);
    this.persist();
    return { ...app, installed: false };
  }

  public isInstalled(id: string): boolean {
    return this.installed.has(id);
  }

  public installedList(): string[] {
    return Array.from(this.installed);
  }

  public stats(): { catalog: number; installed: number; byKind: Record<string, number> } {
    const byKind: Record<string, number> = {};
    for (const app of this.catalog()) byKind[app.kind] = (byKind[app.kind] ?? 0) + 1;
    return { catalog: this.catalog().length, installed: this.installed.size, byKind };
  }
}
