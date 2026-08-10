import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { EventBus } from "../kernel/EventBus";

// VAEC — VISERON Autonomous Evolution & Continuity
// Política operacional de evolução autónoma com GATES obrigatórios:
//   IMPLEMENT → TEST → SYNC → BUILD → VERIFY → LEARN → PROMOTE
// Se qualquer gate falhar → ROLLBACK (restaura o estado anterior e regista).
// Todo o ciclo é gravado num jornal (data/state/vaec-journal.jsonl) e publicado
// no EventBus do kernel (vaec:stage / vaec:gate / vaec:promoted / vaec:rollback).

export type VaecStage =
  | "IDLE"
  | "IMPLEMENT"
  | "TEST"
  | "SYNC"
  | "BUILD"
  | "VERIFY"
  | "LEARN"
  | "PROMOTE"
  | "COMPLETED"
  | "FAILED"
  | "HOLD"
  | "ROLLBACK"
  | "VERIFIED";

export type VaecOutcome = "PROMOTED" | "HOLD" | "ROLLED_BACK" | "FAILED";

export interface GateResult {
  stage: VaecStage;
  ok: boolean;
  evidence: string[];
  error?: string;
}

export interface VaecRunRecord {
  id: string;
  at: string;
  description: string;
  baseRef: string;
  headRef?: string;
  stages: Array<{ stage: VaecStage; ok: boolean; at: string; evidence: string[]; error?: string }>;
  outcome: VaecOutcome;
  promoted?: boolean;
  rollbackTo?: string;
}

export interface VaecRunners {
  /** Aplica a mudança: cria um commit com o working tree e devolve o novo ref. */
  implement?: (ctx: VaecContext) => Promise<{ ref: string; message: string }>;
  /** Gate de testes (npm run test). */
  test?: (ctx: VaecContext) => Promise<GateResult>;
  /** Gate de sincronização (git pull --ff-only + regenerar System of Truth). */
  sync?: (ctx: VaecContext) => Promise<GateResult>;
  /** Gate de build (npm run build). */
  build?: (ctx: VaecContext) => Promise<GateResult>;
  /** Gate de verificação (npm run status:system + live health). */
  verify?: (ctx: VaecContext) => Promise<GateResult>;
  /** Aprendizagem pós-verificação (best-effort). */
  learn?: (ctx: VaecContext) => Promise<GateResult>;
  /** Promoção: push para o remoto (opcional). */
  promote?: (ctx: VaecContext) => Promise<{ pushed: boolean; pushedTo?: string }>;
  /** Rollback: restaura o estado anterior (git reset --hard baseRef + rebuild). */
  rollback?: (ctx: VaecContext) => Promise<GateResult>;
}

export interface VaecContext {
  rootDir: string;
  description: string;
  baseRef: string;
  headRef?: string;
  record: Partial<VaecRunRecord>;
}

export interface VaecOptions {
  rootDir?: string;
  events?: EventBus;
  runners?: VaecRunners;
  journalPath?: string;
  autoPush?: boolean;
  testCmd?: string;
  buildCmd?: string;
  statusCmd?: string;
  healthUrl?: string;
}

const run = (cmd: string, cwd: string, timeoutMs = 600000) => {
  const res = spawnSync(cmd, { cwd, shell: true, encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
  return {
    status: res.status,
    ok: res.status === 0,
    stdout: (res.stdout || "").trim(),
    stderr: (res.stderr || "").trim(),
    error: res.error?.message,
  };
};

export class VaecOrchestrator {
  private _stage: VaecStage;
  public readonly history: VaecRunRecord[];
  private readonly opts: Required<Pick<VaecOptions, "rootDir" | "autoPush">> & VaecOptions;

  constructor(options: VaecOptions = {}) {
    this.opts = {
      rootDir: path.resolve(options.rootDir ?? process.cwd()),
      autoPush: options.autoPush ?? false,
      ...options,
    };
    this._stage = this.loadStage();
    this.history = this.loadJournal();
  }

  /** Estado ATUAL do ciclo — persiste entre instâncias (nunca fica eternamente em IDLE). */
  public get stage(): VaecStage {
    return this._stage;
  }

  private get stagePath(): string {
    return path.join(this.opts.rootDir, "data", "state", "vaec-stage.json");
  }

  private loadStage(): VaecStage {
    try {
      const raw = fs.readFileSync(this.stagePath, "utf8");
      const parsed = JSON.parse(raw);
      return (parsed?.stage as VaecStage) ?? "IDLE";
    } catch {
      return "IDLE";
    }
  }

  private async persistStage(stage: VaecStage): Promise<void> {
    this._stage = stage;
    try {
      fs.mkdirSync(path.dirname(this.stagePath), { recursive: true });
      fs.writeFileSync(this.stagePath, JSON.stringify({ stage, at: new Date().toISOString() }), "utf8");
    } catch (e: any) {
      console.warn(`[VAEC] falha a persistir stage ${stage}: ${e?.message}`);
    }
  }

  private get journalPath(): string {
    return this.opts.journalPath ?? path.join(this.opts.rootDir, "data", "state", "vaec-journal.jsonl");
  }

  private loadJournal(): VaecRunRecord[] {
    try {
      if (!fs.existsSync(this.journalPath)) return [];
      return fs
        .readFileSync(this.journalPath, "utf8")
        .split(/\r?\n/)
        .filter((l) => l.trim())
        .map((l) => JSON.parse(l));
    } catch {
      return [];
    }
  }

  private async appendRecord(rec: VaecRunRecord): Promise<void> {
    fs.mkdirSync(path.dirname(this.journalPath), { recursive: true });
    fs.appendFileSync(this.journalPath, JSON.stringify(rec) + "\n", "utf8");
    this.history.push(rec);
  }

  private async emit(topic: string, payload: any): Promise<void> {
    if (this.opts.events) await this.opts.events.publish(topic, payload, "vaec");
  }

  private gitHead(): string {
    try {
      return execSync("git rev-parse HEAD", { cwd: this.opts.rootDir, encoding: "utf8" }).trim();
    } catch {
      return "unknown";
    }
  }

  private defaultImplement(ctx: VaecContext): Promise<{ ref: string; message: string }> {
    const res = run(`git add -A && git commit -m "vaec: ${ctx.description}"`, ctx.rootDir);
    if (!res.ok) throw new Error(`[VAEC] implement falhou: ${res.stderr || res.stdout || res.error}`);
    const ref = this.gitHead();
    return Promise.resolve({ ref, message: `vaec: ${ctx.description}` });
  }

  private defaultGate(cmd: string, stage: VaecStage, label: string): (ctx: VaecContext) => Promise<GateResult> {
    return async (ctx) => {
      const res = run(cmd, ctx.rootDir);
      const tail = res.stdout.split(/\r?\n/).slice(-6);
      const ok = res.ok;
      return { stage, ok, evidence: [`${label} exit=${res.status ?? "?"}`, ...tail.slice(0, 4)], error: ok ? undefined : (res.stderr || res.error || `exit ${res.status}`) };
    };
  }

  private defaultVerify(): (ctx: VaecContext) => Promise<GateResult> {
    return async (ctx) => {
      const statusCmd = this.opts.statusCmd ?? "npm run status:system";
      const res = run(statusCmd, ctx.rootDir);
      const evidence: string[] = [`System of Truth exit=${res.status ?? "?"}`];
      const out = (res.stdout || "") + "\n" + (res.stderr || "");
      const tail = out.split(/\r?\n/).filter((l) => l).slice(-8);
      evidence.push(...tail.slice(0, 6));
      const ok = res.ok && /(?:\d+)\/(?:\d+)\s*(?:testes|tests)/i.test(out) && !/FALHA|FAILED|ERRO/i.test(out.split("\n").slice(-4).join("\n"));
      if (!ok) {
        return { stage: "VERIFY", ok: false, evidence, error: "status:system não passou por completo" };
      }
      if (this.opts.healthUrl) {
        try {
          const h = run(`curl -s -o /dev/null -w "%{http_code}" --max-time 10 ${JSON.stringify(this.opts.healthUrl)}`, ctx.rootDir, 30000);
          evidence.push(`live health HTTP=${h.stdout} ${h.ok ? "OK" : "FALHOU"}`);
          if (h.stdout !== "200") return { stage: "VERIFY", ok: false, evidence, error: `health live não respondeu 200 (${h.stdout})` };
        } catch (e: any) {
          evidence.push(`live health check ignorado: ${e?.message}`);
        }
      }
      return { stage: "VERIFY", ok: true, evidence };
    };
  }

  private defaultSync(): (ctx: VaecContext) => Promise<GateResult> {
    return async (ctx) => {
      const pull = run("git pull --ff-only", ctx.rootDir, 180000);
      const evidence = [`git pull --ff-only exit=${pull.status ?? "?"}`, ...(pull.stdout || pull.stderr).split(/\r?\n/).slice(-3)];
      if (!pull.ok && /conflict|error/i.test(pull.stderr + pull.stdout)) {
        return { stage: "SYNC", ok: false, evidence, error: "conflito no git pull" };
      }
      return { stage: "SYNC", ok: true, evidence };
    };
  }

  private defaultLearn(): (ctx: VaecContext) => Promise<GateResult> {
    return async (ctx) => {
      const learnDir = path.join(ctx.rootDir, "data", "knowledge");
      fs.mkdirSync(learnDir, { recursive: true });
      const entry = {
        at: new Date().toISOString(),
        source: "vaec",
        intent: "evolution_learn",
        description: ctx.description,
        baseRef: ctx.baseRef,
        headRef: ctx.headRef,
        outcome: ctx.record.outcome,
      };
      fs.appendFileSync(path.join(learnDir, "vaec-learned.jsonl"), JSON.stringify(entry) + "\n", "utf8");
      return { stage: "LEARN", ok: true, evidence: [`aprendizado registado: ${entry.at}`] };
    };
  }

  private defaultRollback(): (ctx: VaecContext) => Promise<GateResult> {
    return async (ctx) => {
      const reset = run(`git reset --hard ${ctx.baseRef}`, ctx.rootDir);
      if (!reset.ok) return { stage: "ROLLBACK", ok: false, evidence: [], error: `reset falhou: ${reset.stderr || reset.error}` };
      run("npm run build", ctx.rootDir, 600000);
      return { stage: "ROLLBACK", ok: true, evidence: [`restaurado para ${ctx.baseRef}`, "build de restauro executado"] };
    };
  }

  private defaultPromote(): (ctx: VaecContext) => Promise<{ pushed: boolean; pushedTo?: string }> {
    return async (ctx) => {
      if (!this.opts.autoPush) return { pushed: false };
      const res = run("git push", ctx.rootDir, 180000);
      if (!res.ok) throw new Error(`[VAEC] push falhou: ${res.stderr || res.error}`);
      return { pushed: true, pushedTo: "origin" };
    };
  }

  private getRunners(): Required<VaecRunners> {
    const r = this.opts.runners ?? {};
    return {
      implement: r.implement ?? ((ctx) => this.defaultImplement(ctx)),
      test: r.test ?? this.defaultGate(this.opts.testCmd ?? "npm run test", "TEST", "TEST"),
      sync: r.sync ?? this.defaultSync(),
      build: r.build ?? this.defaultGate(this.opts.buildCmd ?? "npm run build", "BUILD", "BUILD"),
      verify: r.verify ?? this.defaultVerify(),
      learn: r.learn ?? this.defaultLearn(),
      promote: r.promote ?? this.defaultPromote(),
      rollback: r.rollback ?? this.defaultRollback(),
    };
  }

  /** Executa um ciclo VAEC completo com gates obrigatórios. */
  public async runCycle(description: string): Promise<VaecRunRecord> {
    const id = `vaec_${Date.now()}`;
    const baseRef = this.gitHead();
    const record: VaecRunRecord = {
      id,
      at: new Date().toISOString(),
      description,
      baseRef,
      stages: [],
      outcome: "HOLD",
    };
    const runners = this.getRunners();
    const ctx: VaecContext = { rootDir: this.opts.rootDir, description, baseRef, record };

    await this.emit("vaec:stage", { id, stage: "IMPLEMENT" });
    await this.persistStage("IMPLEMENT");
    try {
      const impl = await runners.implement(ctx);
      record.headRef = impl.ref;
      ctx.headRef = impl.ref;
      record.stages.push({ stage: "IMPLEMENT", ok: true, at: new Date().toISOString(), evidence: [impl.message] });
      await this.emit("vaec:stage", { id, stage: "TEST" });
      await this.persistStage("TEST");

      const gates: Array<{ stage: VaecStage; fn: (c: VaecContext) => Promise<GateResult> }> = [
        { stage: "TEST", fn: runners.test },
        { stage: "SYNC", fn: runners.sync },
        { stage: "BUILD", fn: runners.build },
        { stage: "VERIFY", fn: runners.verify },
      ];
      for (const g of gates) {
        await this.emit("vaec:stage", { id, stage: g.stage });
        await this.persistStage(g.stage);
        const result = await g.fn(ctx);
        record.stages.push({ stage: g.stage, ok: result.ok, at: new Date().toISOString(), evidence: result.evidence, error: result.error });
        await this.emit("vaec:gate", { id, stage: g.stage, ok: result.ok, evidence: result.evidence, error: result.error });
        if (!result.ok) {
          record.outcome = "ROLLED_BACK";
          await this.emit("vaec:stage", { id, stage: "ROLLBACK" });
          await this.persistStage("ROLLBACK");
          const rb = await runners.rollback(ctx);
          record.stages.push({ stage: "ROLLBACK", ok: rb.ok, at: new Date().toISOString(), evidence: rb.evidence, error: rb.error });
          record.rollbackTo = baseRef;
          await this.emit("vaec:rollback", { id, stage: g.stage, error: result.error, ok: rb.ok });
          await this.persistStage(rb.ok ? "VERIFIED" : "FAILED");
          await this.emit("vaec:stage", { id, stage: rb.ok ? "VERIFIED" : "FAILED" });
          await this.appendRecord(record);
          return record;
        }
      }

      // LEARN (best-effort, nunca bloqueia a promoção)
      const learn = await runners.learn(ctx);
      record.stages.push({ stage: "LEARN", ok: learn.ok, at: new Date().toISOString(), evidence: learn.evidence, error: learn.error });

      await this.emit("vaec:stage", { id, stage: "PROMOTE" });
      await this.persistStage("PROMOTE");
      try {
        const promoted = await runners.promote(ctx);
        record.promoted = promoted.pushed;
        record.outcome = "PROMOTED";
      } catch (e: any) {
        record.promoted = false;
        record.outcome = "FAILED";
        record.stages.push({ stage: "PROMOTE", ok: false, at: new Date().toISOString(), evidence: [], error: e?.message || String(e) });
      }
      await this.emit("vaec:promoted", { id, promoted: record.promoted, outcome: record.outcome });
      await this.persistStage("COMPLETED");
      await this.emit("vaec:stage", { id, stage: "COMPLETED" });
      await this.appendRecord(record);
      return record;
    } catch (e: any) {
      record.outcome = "FAILED";
      record.stages.push({ stage: "IMPLEMENT", ok: false, at: new Date().toISOString(), evidence: [], error: e?.message || String(e) });
      await this.emit("vaec:rollback", { id, stage: "IMPLEMENT", error: e?.message || String(e), ok: false });
      await this.persistStage("FAILED");
      await this.appendRecord(record);
      return record;
    }
  }

  public status(): { stage: VaecStage; historySize: number; lastOutcome?: VaecOutcome; lastAt?: string; persistedStage: VaecStage } {
    const last = this.history[this.history.length - 1];
    return {
      stage: this.stage,
      persistedStage: this.loadStage(),
      historySize: this.history.length,
      lastOutcome: last?.outcome,
      lastAt: last?.at,
    };
  }
}
