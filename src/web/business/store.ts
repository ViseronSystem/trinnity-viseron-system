import fs from "fs";
import path from "path";

export interface BusinessAgent {
  id: string;
  ownerTenantId: string;
  name: string;
  description: string;
  greeting: string;
  knowledge: string[];
  autoReply: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface BusinessMessage {
  id: string;
  agentId: string;
  from: string;
  message: string;
  reply: string;
  createdAt: string;
}

export class BusinessAgentStore {
  private dir: string;
  private agentsFile: string;
  private messagesDir: string;

  constructor(dataDir: string) {
    this.dir = path.join(dataDir, "business");
    if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
    this.agentsFile = path.join(this.dir, "agents.json");
    this.messagesDir = path.join(this.dir, "messages");
    if (!fs.existsSync(this.messagesDir)) fs.mkdirSync(this.messagesDir, { recursive: true });
  }

  private load(): BusinessAgent[] {
    try {
      if (!fs.existsSync(this.agentsFile)) return [];
      return JSON.parse(fs.readFileSync(this.agentsFile, "utf8")) as BusinessAgent[];
    } catch {
      return [];
    }
  }

  private saveAll(list: BusinessAgent[]): void {
    fs.writeFileSync(this.agentsFile, JSON.stringify(list, null, 2), "utf8");
  }

  create(agent: BusinessAgent): BusinessAgent {
    const all = this.load();
    all.push(agent);
    this.saveAll(all);
    return agent;
  }

  list(ownerTenantId?: string): BusinessAgent[] {
    const all = this.load();
    return ownerTenantId ? all.filter((a) => a.ownerTenantId === ownerTenantId) : all;
  }

  get(id: string): BusinessAgent | null {
    return this.load().find((a) => a.id === id) || null;
  }

  update(id: string, patch: Partial<BusinessAgent>): BusinessAgent | null {
    const all = this.load();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
    this.saveAll(all);
    return all[idx];
  }

  remove(id: string): boolean {
    const all = this.load();
    const next = all.filter((a) => a.id !== id);
    if (next.length === all.length) return false;
    this.saveAll(next);
    return true;
  }

  addMessage(msg: BusinessMessage): void {
    fs.appendFileSync(path.join(this.messagesDir, `${msg.agentId}.jsonl`), JSON.stringify(msg) + "\n", "utf8");
    const agent = this.get(msg.agentId);
    if (agent) this.update(msg.agentId, { messageCount: agent.messageCount + 1 });
  }

  messages(agentId: string, limit = 50): BusinessMessage[] {
    const file = path.join(this.messagesDir, `${agentId}.jsonl`);
    try {
      if (!fs.existsSync(file)) return [];
      const lines = fs.readFileSync(file, "utf8").split("\n").filter((l) => l.trim());
      return lines.slice(-limit).map((l) => JSON.parse(l) as BusinessMessage);
    } catch {
      return [];
    }
  }

  count(): number {
    return this.load().length;
  }
}

export function newAgentId(): string {
  return `biz_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
