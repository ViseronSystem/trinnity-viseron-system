import * as fs from "fs";
import * as path from "path";
import { AppStore } from "./AppStore";
import { AgentRuntime } from "../omega/agent-runtime/AgentRuntime";
import { EnterpriseHub } from "../omega/enterprise";
import { SquadRegistry } from "../omega/squads";
import { SelfHealWatchdog } from "../omega/selfheal";

export interface DoctorIssue {
  severity: "OK" | "WARN" | "CRIT";
  check: string;
  detail: string;
}

export interface PackageManagerOptions {
  store: AppStore;
  runtime?: AgentRuntime;
  enterprise?: EnterpriseHub;
  squads?: SquadRegistry;
  watchdog?: SelfHealWatchdog;
  specsDir?: string;
}

export class PackageManager {
  private readonly store: AppStore;
  private readonly runtime?: AgentRuntime;
  private readonly enterprise?: EnterpriseHub;
  private readonly squads?: SquadRegistry;
  private readonly watchdog?: SelfHealWatchdog;
  private readonly specsDir: string;

  constructor(options: PackageManagerOptions) {
    this.store = options.store;
    this.runtime = options.runtime;
    this.enterprise = options.enterprise;
    this.squads = options.squads;
    this.watchdog = options.watchdog;
    this.specsDir = options.specsDir ?? path.join(__dirname, "..", "omega", "agent-runtime", "specs");
  }

  public install(pkgId: string): { id: string; status: string; app: ReturnType<AppStore["install"]> } {
    const app = this.store.install(pkgId);
    return { id: pkgId, status: "installed", app };
  }

  public uninstall(pkgId: string): { id: string; status: string; app: ReturnType<AppStore["uninstall"]> } {
    const app = this.store.uninstall(pkgId);
    return { id: pkgId, status: "uninstalled", app };
  }

  public update(): { reloaded: string[]; valid: number; failed: number } {
    const reloaded: string[] = [];
    let valid = 0;
    let failed = 0;
    if (this.runtime) {
      const specsDir = fs.existsSync(this.specsDir) ? this.specsDir : path.join(process.cwd(), "src", "omega", "agent-runtime", "specs");
      const r = this.runtime.loadSpecsFromDir(specsDir);
      valid += r.valid;
      failed += r.invalid;
      reloaded.push(`runtime (${r.valid} specs válidos)`);
    }
    if (this.enterprise) {
      const manifestsDir = path.join(__dirname, "..", "omega", "enterprise", "manifests");
      const dir = fs.existsSync(manifestsDir) ? manifestsDir : path.join(process.cwd(), "src", "omega", "enterprise", "manifests");
      const r = this.enterprise.loadFromDir(dir);
      valid += r.valid;
      failed += r.invalid;
      reloaded.push(`enterprise (${r.valid} módulos)`);
    }
    if (this.squads) {
      const manifestsDir = path.join(__dirname, "..", "omega", "squads", "manifests");
      const dir = fs.existsSync(manifestsDir) ? manifestsDir : path.join(process.cwd(), "src", "omega", "squads", "manifests");
      const r = this.squads.loadFromDir(dir);
      valid += r.valid;
      failed += r.invalid;
      reloaded.push(`squads (${r.valid} squads)`);
    }
    return { reloaded, valid, failed };
  }

  public doctor(): { healthy: boolean; issues: DoctorIssue[] } {
    const issues: DoctorIssue[] = [];

    issues.push(this.runtime
      ? { severity: this.runtime.status().loaded > 0 ? "OK" : "CRIT", check: "Agent Runtime", detail: `${this.runtime.status().loaded} agentes carregados` }
      : { severity: "WARN", check: "Agent Runtime", detail: "não ligado" });

    issues.push(this.watchdog
      ? { severity: this.watchdog.status().enabled ? "OK" : "WARN", check: "Self-Heal Watchdog", detail: `ativo com ${this.watchdog.status().targets.length} alvos` }
      : { severity: "WARN", check: "Self-Heal Watchdog", detail: "não ligado" });

    const storeStats = this.store.stats();
    issues.push(storeStats.catalog > 0
      ? { severity: "OK", check: "App Store", detail: `${storeStats.catalog} apps no catálogo` }
      : { severity: "WARN", check: "App Store", detail: "catálogo vazio" });

    try {
      const testFile = path.join(this.store["dataFile"] ?? "", "..", ".doctor-test");
      fs.writeFileSync(path.resolve(testFile), "ok", "utf-8");
      fs.unlinkSync(path.resolve(testFile));
      issues.push({ severity: "OK", check: "Disco / data-tvs-os", detail: "gravável" });
    } catch {
      issues.push({ severity: "CRIT", check: "Disco / data-tvs-os", detail: "sem permissão de escrita" });
    }

    const crit = issues.filter((i) => i.severity === "CRIT").length;
    return { healthy: crit === 0, issues };
  }

  public listInstalled(): ReturnType<AppStore["list"]> {
    const all = this.store.list();
    return all.filter((a) => a.installed);
  }
}
