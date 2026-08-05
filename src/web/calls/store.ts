import fs from "fs";
import path from "path";

export interface CallAnalysis {
  summary: string;
  sentiment: "positive" | "neutral" | "negative" | "unknown";
  intents: string[];
  actionItems: string[];
  learnedAt?: string;
}

export interface CallRecord {
  id: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  status: string;
  callSid?: string;
  durationSec?: number;
  recordingUrl?: string;
  transcript: string;
  analysis?: CallAnalysis;
  createdAt: string;
  updatedAt: string;
}

export class CallLogStore {
  private dir: string;
  private file: string;

  constructor(dataDir: string) {
    this.dir = path.join(dataDir, "calls");
    this.file = path.join(this.dir, "calls.jsonl");
    if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
  }

  append(record: CallRecord): CallRecord {
    fs.appendFileSync(this.file, JSON.stringify(record) + "\n", "utf8");
    return record;
  }

  update(id: string, patch: Partial<CallRecord>): CallRecord | null {
    const records = this.list();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    records[idx] = { ...records[idx], ...patch, updatedAt: new Date().toISOString() };
    this._writeAll(records);
    return records[idx];
  }

  list(limit = 100): CallRecord[] {
    try {
      if (!fs.existsSync(this.file)) return [];
      const lines = fs
        .readFileSync(this.file, "utf8")
        .split("\n")
        .filter((l) => l.trim().length > 0);
      return lines.slice(-limit).map((l) => JSON.parse(l) as CallRecord);
    } catch {
      return [];
    }
  }

  get(id: string): CallRecord | undefined {
    return this.list().find((r) => r.id === id);
  }

  count(): { total: number; inbound: number; outbound: number } {
    const all = this.list(100000);
    return {
      total: all.length,
      inbound: all.filter((r) => r.direction === "inbound").length,
      outbound: all.filter((r) => r.direction === "outbound").length,
    };
  }

  private _writeAll(records: CallRecord[]): void {
    const content = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
    fs.writeFileSync(this.file, content, "utf8");
  }
}
