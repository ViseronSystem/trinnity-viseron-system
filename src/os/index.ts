import { AgentRuntime } from "../omega/agent-runtime/AgentRuntime";
import { EnterpriseHub } from "../omega/enterprise";
import { SquadRegistry } from "../omega/squads";
import { SelfHealWatchdog } from "../omega/selfheal";
import { Kernel } from "../omega/kernel/Kernel";
import { ProcessManager } from "./ProcessManager";
import { VirtualFileSystem } from "./VirtualFileSystem";
import { AppStore } from "./AppStore";
import { PackageManager } from "./PackageManager";
import { SecurityCenter } from "./SecurityCenter";

export interface TVSOsOptions {
  kernel?: Kernel;
  runtime?: AgentRuntime;
  enterprise?: EnterpriseHub;
  squads?: SquadRegistry;
  watchdog?: SelfHealWatchdog;
  baseDir?: string;
}

export class TVSOs {
  public readonly name = "TVS OS Core v1";
  public readonly version = "1.0.0";
  public readonly kernel?: Kernel;
  public readonly runtime?: AgentRuntime;
  public readonly watchdog?: SelfHealWatchdog;
  public readonly processes: ProcessManager;
  public readonly fs: VirtualFileSystem;
  public readonly store: AppStore;
  public readonly pkg: PackageManager;
  public readonly security: SecurityCenter;
  private readonly bootedAt = Date.now();

  constructor(options: TVSOsOptions = {}) {
    this.kernel = options.kernel;
    this.runtime = options.runtime;
    this.watchdog = options.watchdog;
    this.processes = new ProcessManager(options.runtime);
    this.fs = new VirtualFileSystem({
      baseDir: options.baseDir,
      runtime: options.runtime,
      processes: this.processes,
    });
    this.store = new AppStore({
      runtime: options.runtime,
      enterprise: options.enterprise,
      squads: options.squads,
      dataFile: options.baseDir ? require("path").join(options.baseDir, "apps-installed.json") : undefined,
    });
    this.pkg = new PackageManager({
      store: this.store,
      runtime: options.runtime,
      enterprise: options.enterprise,
      squads: options.squads,
      watchdog: options.watchdog,
    });
    this.security = new SecurityCenter({
      permissions: options.kernel?.permissions,
      auditFile: options.baseDir ? require("path").join(options.baseDir, "audit.json") : undefined,
    });
  }

  public boot(): { name: string; version: string; bootedAt: number } {
    this.kernel?.publish("os:boot", { name: this.name, at: Date.now() }, "os").catch(() => {});
    return { name: this.name, version: this.version, bootedAt: this.bootedAt };
  }

  public spawn(agentId: string, task: string, context?: Record<string, any>) {
    this.security.authorize({ id: "os", name: "TVS OS", role: "commander" }, "agents.manage");
    return this.processes.spawn(agentId, task, context);
  }

  public status() {
    return {
      name: this.name,
      version: this.version,
      bootedAt: this.bootedAt,
      uptimeMs: Date.now() - this.bootedAt,
      kernel: this.kernel?.status() ?? null,
      processes: this.processes.stats(),
      fs: this.fs.status(),
      store: this.store.stats(),
      security: this.security.status(),
      watchdog: this.watchdog?.status() ?? null,
      agents: this.runtime?.status() ?? null,
    };
  }
}
