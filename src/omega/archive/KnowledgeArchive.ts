import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { KnowledgeGraph } from "../memory-engine/KnowledgeGraph";
import { EventBus, KernelEventMeta } from "../kernel/EventBus";

export interface ArchiveExecutionRecord {
  id: string;
  timestamp: string;
  stage: string;
  success: boolean;
  model: { provider: string; model: string; isLocal: boolean; strategy: string };
  tools: { requested: number; executed: number; succeeded: number; failed: number; verification: string };
  executedBy: string;
  hash: string;
}

export interface ArchiveDecisionRecord {
  title: string;
  date: string;
  tags: string[];
  hash: string;
}

export interface ArchiveSnapshotRecord {
  reason: string;
  timestamp: string;
  entities: number;
  relations: number;
  path: string;
}

export interface ArchiveStatus {
  version: string;
  createdAt: string;
  lastMilestone: string | null;
  counts: { executions: number; failures: number; decisions: number; snapshots: number };
  health: "OK" | "DEGRADED";
}

export interface TimelineEntry {
  date: string;
  event: string;
  type: "milestone" | "execution" | "decision" | "failure" | "snapshot";
  summary: string;
}

export interface ArchiveOptions {
  graph: KnowledgeGraph;
  bus: EventBus;
  archiveDir?: string;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

export class KnowledgeArchive {
  public readonly archiveDir: string;
  private readonly graph: KnowledgeGraph;
  private readonly bus: EventBus;
  private unsubscribers: Array<() => void> = [];

  constructor(options: ArchiveOptions) {
    this.graph = options.graph;
    this.bus = options.bus;
    this.archiveDir = options.archiveDir ?? path.join(process.cwd(), "data", "archive");

    this.ensureDirs();
    this.ensureState();
    this.subscribe();
  }

  public status(): ArchiveStatus {
    const state = this.loadState();
    const execDir = path.join(this.archiveDir, "executions");
    const failDir = path.join(execDir, "failures");
    const decDir = path.join(this.archiveDir, "decisions");
    const graphDir = path.join(this.archiveDir, "graph");
    const execIndex = this.loadIndex(path.join(execDir, "index.json"));
    const failIndex = this.loadIndex(path.join(failDir, "index.json"));
    const decIndex = this.loadIndex(path.join(decDir, "index.json"));
    const graphIndex = this.loadIndex(path.join(graphDir, "index.json"));
    return {
      version: state.version || "1.0.0",
      createdAt: state.createdAt || new Date().toISOString(),
      lastMilestone: state.lastMilestone || null,
      counts: {
        executions: execIndex.length,
        failures: failIndex.length,
        decisions: decIndex.length,
        snapshots: graphIndex.length,
      },
      health: "OK",
    };
  }

  public timeline(): TimelineEntry[] {
    const entries: TimelineEntry[] = [];
    const execDir = path.join(this.archiveDir, "executions");
    const decDir = path.join(this.archiveDir, "decisions");
    const graphDir = path.join(this.archiveDir, "graph");
    for (const entry of this.loadIndex(path.join(execDir, "index.json"))) {
      entries.push({ date: entry.timestamp || "", event: entry.id || "", type: "execution", summary: entry.summary || "" });
    }
    for (const entry of this.loadIndex(path.join(execDir, "failures", "index.json"))) {
      entries.push({ date: entry.timestamp || "", event: entry.id || "", type: "failure", summary: entry.summary || "" });
    }
    for (const entry of this.loadIndex(path.join(decDir, "index.json"))) {
      entries.push({ date: entry.date || "", event: entry.title || "", type: "decision", summary: entry.title || "" });
    }
    for (const entry of this.loadIndex(path.join(graphDir, "index.json"))) {
      entries.push({ date: entry.timestamp || "", event: entry.reason || "", type: "snapshot", summary: entry.reason || "" });
    }
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  }

  public snapshot(reason: string): void {
    const stats = this.graph.getStats();
    const graphDir = path.join(this.archiveDir, "graph");
    const filename = `snapshot-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.json`;
    const filepath = path.join(graphDir, filename);
    const snapshotData = { reason, timestamp: new Date().toISOString(), stats };
    fs.writeFileSync(filepath, JSON.stringify(snapshotData, null, 2));
    this.appendIndex(path.join(graphDir, "index.json"), {
      reason,
      timestamp: new Date().toISOString(),
      entities: stats.entities,
      relations: stats.relations,
      byType: stats.byType,
      path: filename,
    });
    this.updateState({ lastSnapshot: filename });
    console.log(`[KnowledgeArchive] snapshot: ${reason} → ${filename}`);
  }

  public record(title: string, body: string, tags: string[] = []): void {
    const decDir = path.join(this.archiveDir, "decisions");
    const date = new Date().toISOString().slice(0, 10);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").slice(0, 80);
    const filename = `${slug}-${date}.md`;
    const filepath = path.join(decDir, filename);
    const content = `# ${title}\n\n**Data:** ${date}\n\n**Tags:** ${tags.join(", ")}\n\n${body}\n\n---\n© 2026 Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)\n`;
    fs.writeFileSync(filepath, content);
    const hash = sha256(content);
    this.appendIndex(path.join(decDir, "index.json"), { title, date, tags, hash, file: filename });
    this.updateState({ lastMilestone: slug });
    console.log(`[KnowledgeArchive] decision: ${title} → ${filename}`);
  }

  public destroy(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
  }

  private subscribe(): void {
    const us1 = this.bus.subscribe("task:completed", (_payload: any, meta: KernelEventMeta) => {
      this.onTaskResult(_payload, meta, true);
    });
    const us2 = this.bus.subscribe("task:failed", (_payload: any, meta: KernelEventMeta) => {
      this.onTaskResult(_payload, meta, false);
    });
    this.unsubscribers.push(us1, us2);
  }

  private onTaskResult(payload: any, _meta: KernelEventMeta, success: boolean): void {
    try {
      const task = payload as any;
      const execDir = path.join(this.archiveDir, "executions");
      const subDir = success ? execDir : path.join(execDir, "failures");
      fs.mkdirSync(subDir, { recursive: true });

      const id = task?.taskId || task?.id || `task_${Date.now().toString(36)}`;
      const filename = `${id}.json`;
      const filepath = path.join(subDir, filename);

      const record: ArchiveExecutionRecord = {
        id,
        timestamp: new Date().toISOString(),
        stage: task?.stage || (success ? "COMPLETED" : "FAILED"),
        success,
        model: {
          provider: task?.model?.provider || task?.provider || "unknown",
          model: task?.model?.model || task?.modelName || "unknown",
          isLocal: task?.model?.isLocal ?? false,
          strategy: task?.model?.strategy || "",
        },
        tools: {
          requested: task?.toolsSummary?.requested ?? 0,
          executed: task?.toolsSummary?.executed ?? 0,
          succeeded: task?.toolsSummary?.succeeded ?? 0,
          failed: task?.toolsSummary?.failed ?? 0,
          verification: task?.toolsSummary?.verification || (success ? "PASS" : "FAIL"),
        },
        executedBy: task?.executedBy || "",
        hash: "",
      };
      const raw = JSON.stringify(record, null, 2);
      record.hash = sha256(raw);
      const final = JSON.stringify(record, null, 2);
      fs.writeFileSync(filepath, final);

      this.appendIndex(path.join(subDir, "index.json"), {
        id,
        timestamp: record.timestamp,
        summary: `${record.tools.succeeded}/${record.tools.executed} tools ${record.tools.verification} | ${record.model.provider}/${record.model.model}`,
      });

      if (success && task?.toolsSummary?.verification === "PASS") {
        this.updateState({ lastMilestone: id });
        const entries = this.loadIndex(path.join(execDir, "index.json"));
        if (entries.length <= 3) {
          const summary = `Modelo: ${record.model.provider}/${record.model.model}. Tools: ${record.tools.succeeded}/${record.tools.executed} com VERIFY ${record.tools.verification}. Executado por: ${record.executedBy}.`;
          this.record(`Execução verificada: ${id}`, summary, ["execution", "verified", record.model.provider]);
        }
      }
    } catch (err) {
      console.error("[KnowledgeArchive] erro ao arquivar:", err);
    }
  }

  private ensureDirs(): void {
    const dirs = ["executions", path.join("executions", "failures"), "decisions", "graph", "audits"];
    for (const d of dirs) {
      fs.mkdirSync(path.join(this.archiveDir, d), { recursive: true });
    }
  }

  private ensureState(): void {
    const statePath = path.join(this.archiveDir, "archive-state.json");
    if (!fs.existsSync(statePath)) {
      fs.writeFileSync(statePath, JSON.stringify({
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        lastMilestone: null,
      }, null, 2));
    }
  }

  private loadState(): Record<string, any> {
    const fp = path.join(this.archiveDir, "archive-state.json");
    try { return JSON.parse(fs.readFileSync(fp, "utf8")); } catch { return {}; }
  }

  private updateState(patch: Record<string, any>): void {
    const fp = path.join(this.archiveDir, "archive-state.json");
    const current = this.loadState();
    const merged = { ...current, ...patch, updatedAt: new Date().toISOString() };
    fs.writeFileSync(fp, JSON.stringify(merged, null, 2));
  }

  private loadIndex(indexPath: string): any[] {
    try { return JSON.parse(fs.readFileSync(indexPath, "utf8")); } catch { return []; }
  }

  private appendIndex(indexPath: string, entry: Record<string, any>): void {
    const entries = this.loadIndex(indexPath);
    entries.push(entry);
    fs.writeFileSync(indexPath, JSON.stringify(entries, null, 2));
  }
}
