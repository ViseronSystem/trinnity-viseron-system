import { Kernel } from "../kernel/Kernel";
import { heartbeats } from "./Heartbeats";
import { AgentRuntime } from "../agent-runtime/AgentRuntime";
import { SquadRegistry } from "../squads";
import { AutonomyLayer } from "../autonomy";

const DEFAULT_TICK_MS = 30000;
const DEFAULT_STALE_MS = 180000;
const RECOVERY_AGENT_TIMEOUT_MS = 15000;
const RESET_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} excedeu ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export interface WatchTarget {
  id: string;
  label: string;
  check?: () => boolean;
  reset?: () => void | Promise<void>;
}

export interface WatchIncident {
  component: string;
  label: string;
  detectedAt: number;
  resolvedAt?: number;
  aiAgent?: string;
  aiOutput?: string;
  action: string;
}

export interface SelfHealWatchdogOptions {
  kernel?: Kernel;
  autonomy?: AutonomyLayer;
  runtime?: AgentRuntime;
  squads?: SquadRegistry;
  tickMs?: number;
  staleMs?: number;
  aiAgentId?: string;
  enabled?: boolean;
}

export interface SelfHealWatchdogStatus {
  enabled: boolean;
  tickMs: number;
  staleMs: number;
  targets: { id: string; label: string }[];
  incidents: WatchIncident[];
  heartbeatSnapshot: Record<string, { lastPulse: number; activeOps: number; healthy: boolean }>;
}

export class SelfHealWatchdog {
  public readonly name = "TVS Self-Heal Watchdog";
  private readonly kernel?: Kernel;
  private readonly autonomy?: AutonomyLayer;
  private readonly runtime?: AgentRuntime;
  private readonly squads?: SquadRegistry;
  private readonly tickMs: number;
  private readonly staleMs: number;
  private readonly aiAgentId: string;
  private readonly enabled: boolean;
  private readonly targets = new Map<string, WatchTarget>();
  private incidents: WatchIncident[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  constructor(options: SelfHealWatchdogOptions = {}) {
    this.kernel = options.kernel;
    this.autonomy = options.autonomy;
    this.runtime = options.runtime;
    this.squads = options.squads;
    this.tickMs = options.tickMs ?? DEFAULT_TICK_MS;
    this.staleMs = options.staleMs ?? DEFAULT_STALE_MS;
    this.aiAgentId = options.aiAgentId ?? "agent_ceo";
    this.enabled = options.enabled ?? process.env.TVS_WATCHDOG_DISABLED !== "1";
  }

  public register(target: WatchTarget): void {
    this.targets.set(target.id, target);
  }

  public start(): void {
    if (!this.enabled) return;
    this.tickSafe();
    if (!this.timer) {
      this.timer = setInterval(() => this.tickSafe(), this.tickMs);
      this.timer.unref();
    }
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tickSafe(): void {
    this.tick().catch(() => { /* nunca deixa o watchdog travar o sistema */ });
  }

  private async tick(): Promise<void> {
    if (this.ticking) return;
    this.ticking = true;
    try {
      for (const target of this.targets.values()) {
        if (this.isStale(target)) {
          await this.recover(target);
        }
      }
    } finally {
      this.ticking = false;
    }
  }

  private isStale(target: WatchTarget): boolean {
    if (target.check) {
      try {
        return !target.check();
      } catch {
        return true;
      }
    }
    return heartbeats.isStale(target.id, this.staleMs);
  }

  public async healNow(id?: string): Promise<WatchIncident[]> {
    const list = id ? Array.from(this.targets.values()).filter((t) => t.id === id) : Array.from(this.targets.values());
    const incidents: WatchIncident[] = [];
    for (const target of list) {
      incidents.push(await this.recover(target));
    }
    return incidents;
  }

  private async recover(target: WatchTarget): Promise<WatchIncident> {
    const detectedAt = Date.now();
    const incident: WatchIncident = {
      component: target.id,
      label: target.label,
      detectedAt,
      action: "reset-forcado",
    };

    let aiAgent = this.aiAgentId;
    let aiOutput = "";

    try {
      await withTimeout(
        Promise.resolve().then(async () => {
          await this.autonomy?.submitTask(
            `[Watchdog] ${target.label} preso há mais de 3 minutos`,
            `O watchdog detetou operação presa no componente ${target.id}. Orquestra AIOX para diagnosticar e destravar.`,
            "CRITICAL",
            "selfheal",
          );
        }),
        RESET_TIMEOUT_MS,
        "autonomy-task",
      );
    } catch { /* autonomia nunca pode bloquear o watchdog */ }

    try {
      const agent = this.runtime?.getAgent(this.aiAgentId) ?? this.runtime?.listAgents()[0];
      if (agent) {
        const res = await withTimeout(
          agent.execute(`[WATCHDOG] Diagnostica e destrava: o componente ${target.label} está preso há mais de 3 minutos. Força a recuperação e confirma o estado.`, { emergency: true, source: "watchdog" }),
          RECOVERY_AGENT_TIMEOUT_MS,
          this.aiAgentId,
        );
        aiOutput = (res.output || "").slice(0, 200);
        incident.aiAgent = agent.id;
        if (res.success) incident.action = "reset-aiox-agent";
      }
    } catch (e: any) {
      aiOutput = `AIOX sem resposta em ${RECOVERY_AGENT_TIMEOUT_MS}ms — reset forçado aplicado (${e.message})`;
    }

    try {
      await withTimeout(
        Promise.resolve().then(() => target.reset?.()),
        RESET_TIMEOUT_MS,
        `${target.id}-reset`,
      );
    } catch (e: any) {
      aiOutput = `${aiOutput} | reset: ${e.message}`.trim();
    }
    heartbeats.reset(target.id);

    incident.resolvedAt = Date.now();
    incident.aiOutput = aiOutput;
    this.incidents.push(incident);
    if (this.incidents.length > 200) this.incidents = this.incidents.slice(-200);

    try {
      await this.kernel?.publish("omega:watchdog:recovered", {
        component: target.id,
        label: target.label,
        at: incident.resolvedAt,
        action: incident.action,
        aiAgent,
      }, "watchdog");
    } catch { /* evento não pode quebrar a recuperação */ }
    try {
      await this.kernel?.recordDecision(
        `selfheal_${target.id}_${detectedAt}`,
        { component: target.id, label: target.label, action: incident.action, aiAgent, recovered: true },
        ["selfheal", target.id],
      );
    } catch { /* decisão não pode quebrar a recuperação */ }

    return incident;
  }

  public status(): SelfHealWatchdogStatus {
    return {
      enabled: this.enabled,
      tickMs: this.tickMs,
      staleMs: this.staleMs,
      targets: Array.from(this.targets.values()).map((t) => ({ id: t.id, label: t.label })),
      incidents: [...this.incidents],
      heartbeatSnapshot: heartbeats.snapshot(),
    };
  }
}
