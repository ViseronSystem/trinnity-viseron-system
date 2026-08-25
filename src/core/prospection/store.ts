import fs from "fs";
import path from "path";

// TVS — PROSPECTION OS · Store persistente
// data/prospection/: campaigns.json · leads.json · suppression.json · audit.jsonl

export type LeadStatus =
  | "new"          // importado, sem mensagem
  | "queued"       // personalizado, à espera de envio
  | "sent"         // email enviado
  | "responded"    // respondeu (não qualificado ainda)
  | "interested"   // caliente — pediu preço/citação
  | "informative"  // curiosidade apenas
  | "not_interested"
  | "bounced"
  | "unsubscribed";

export type CampaignStatus = "draft" | "warming" | "active" | "paused" | "finished";

export interface ProspectionLead {
  id: string;
  campaignId: string;
  name: string;
  clinic: string;
  city: string;
  email: string;
  phone?: string;
  employees?: number;
  status: LeadStatus;
  message?: string;
  messageLang?: string;
  subject?: string;
  aiGenerated?: boolean;
  sentAt?: string;
  responseAt?: string;
  responseText?: string;
  intent?: "hot" | "info";
  createdAt: string;
  updatedAt: string;
}

export interface ProspectionCampaign {
  id: string;
  name: string;
  niche: string;
  target: string;
  dailyCap: number;
  warmupDays: number;
  sender: string;
  signature: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProspectionStats {
  campaigns: number;
  leads: number;
  queued: number;
  sent: number;
  responded: number;
  interested: number;
  bounced: number;
  unsubscribed: number;
  sentToday: number;
  remainingToday: number;
  warmupActive: boolean;
  warmupDaysLeft: number;
}

const STATUS_ORDER: LeadStatus[] = [
  "new", "queued", "sent", "responded", "interested", "informative", "not_interested", "bounced", "unsubscribed",
];

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class ProspectionStore {
  private dir: string;
  private campaigns: ProspectionCampaign[] = [];
  private leads: ProspectionLead[] = [];
  private suppression: string[] = [];
  private audit: string[] = [];

  constructor(dataDir: string) {
    this.dir = path.join(dataDir, "prospection");
    fs.mkdirSync(this.dir, { recursive: true });
    this.load<ProspectionCampaign[]>("campaigns.json", (d) => (this.campaigns = d));
    this.load<ProspectionLead[]>("leads.json", (d) => (this.leads = d));
    this.load<string[]>("suppression.json", (d) => (this.suppression = d));
    if (fs.existsSync(path.join(this.dir, "audit.jsonl"))) {
      this.audit = fs.readFileSync(path.join(this.dir, "audit.jsonl"), "utf8").split("\n").filter(Boolean).slice(-500);
    }
  }

  private load<T>(file: string, assign: (d: T) => void): void {
    try {
      const p = path.join(this.dir, file);
      if (fs.existsSync(p)) assign(JSON.parse(fs.readFileSync(p, "utf8")) as T);
    } catch (e) {
      console.error(`[prospection] erro a ler ${file}:`, (e as Error).message);
    }
  }

  private save(file: string, data: unknown): void {
    fs.writeFileSync(path.join(this.dir, file), JSON.stringify(data, null, 2));
  }

  private persist(): void {
    this.save("campaigns.json", this.campaigns);
    this.save("leads.json", this.leads);
    this.save("suppression.json", this.suppression);
  }

  logAudit(event: string, meta: Record<string, unknown>): void {
    const line = JSON.stringify({ at: new Date().toISOString(), event, ...meta });
    this.audit.push(line);
    fs.appendFileSync(path.join(this.dir, "audit.jsonl"), line + "\n");
    if (this.audit.length > 500) this.audit = this.audit.slice(-500);
  }

  auditLog(): Array<Record<string, unknown>> {
    return this.audit.map((l) => {
      try { return JSON.parse(l); } catch { return { raw: l }; }
    });
  }

  // ---- Campanhas ----
  createCampaign(input: Omit<ProspectionCampaign, "id" | "createdAt" | "updatedAt">): ProspectionCampaign {
    const now = new Date().toISOString();
    const campaign: ProspectionCampaign = {
      ...input,
      id: newId("cam"),
      createdAt: now,
      updatedAt: now,
      status: input.warmupDays > 0 ? "warming" : "draft",
    };
    this.campaigns.push(campaign);
    this.persist();
    this.logAudit("campaign.created", { id: campaign.id, name: campaign.name });
    return campaign;
  }

  getCampaign(id: string): ProspectionCampaign | undefined {
    return this.campaigns.find((c) => c.id === id);
  }

  listCampaigns(): ProspectionCampaign[] {
    return this.campaigns;
  }

  updateCampaign(id: string, patch: Partial<ProspectionCampaign>): ProspectionCampaign | undefined {
    const c = this.getCampaign(id);
    if (!c) return undefined;
    Object.assign(c, patch, { updatedAt: new Date().toISOString() });
    this.persist();
    this.logAudit("campaign.updated", { id, patch: Object.keys(patch) });
    return c;
  }

  campaignStatus(id: string): { warmupActive: boolean; warmupDaysLeft: number } {
    const c = this.getCampaign(id);
    if (!c || c.warmupDays <= 0) return { warmupActive: false, warmupDaysLeft: 0 };
    const start = new Date(c.createdAt).getTime();
    const days = Math.floor((Date.now() - start) / 86400000);
    const left = Math.max(0, c.warmupDays - days);
    return { warmupActive: left > 0, warmupDaysLeft: left };
  }

  // ---- Leads ----
  importLeads(campaignId: string, rows: Array<Partial<ProspectionLead>>): { added: number; skipped: number; dupes: number } {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) throw new Error(`campanha não existe: ${campaignId}`);
    const now = new Date().toISOString();
    let added = 0, skipped = 0, dupes = 0;
    const known = new Set(this.leads.map((l) => l.email.toLowerCase()));
    for (const row of rows) {
      const email = String(row.email || "").trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { skipped++; continue; }
      if (known.has(email) || this.suppression.includes(email)) { dupes++; continue; }
      known.add(email);
      const lead: ProspectionLead = {
        id: newId("lead"),
        campaignId,
        name: String(row.name || email.split("@")[0]).slice(0, 120),
        clinic: String(row.clinic || "").slice(0, 160),
        city: String(row.city || "").slice(0, 80),
        email,
        phone: row.phone ? String(row.phone).slice(0, 40) : undefined,
        employees: Number.isFinite(Number(row.employees)) ? Number(row.employees) : undefined,
        status: "new",
        createdAt: now,
        updatedAt: now,
      };
      this.leads.push(lead);
      added++;
    }
    this.persist();
    this.logAudit("leads.imported", { campaignId, added, skipped, dupes });
    return { added, skipped, dupes };
  }

  listLeads(campaignId?: string, status?: LeadStatus): ProspectionLead[] {
    return this.leads
      .filter((l) => (!campaignId || l.campaignId === campaignId) && (!status || l.status === status))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getLead(id: string): ProspectionLead | undefined {
    return this.leads.find((l) => l.id === id);
  }

  updateLead(id: string, patch: Partial<ProspectionLead>): ProspectionLead | undefined {
    const l = this.getLead(id);
    if (!l) return undefined;
    Object.assign(l, patch, { updatedAt: new Date().toISOString() });
    this.persist();
    return l;
  }

  leadsByStatus(campaignId: string): Record<LeadStatus, number> {
    const acc = {} as Record<LeadStatus, number>;
    for (const s of STATUS_ORDER) acc[s] = 0;
    for (const l of this.leads) if (!campaignId || l.campaignId === campaignId) acc[l.status]++;
    return acc;
  }

  // ---- Supressão (LGPD: nunca contactar de novo) ----
  suppress(email: string): void {
    const e = email.toLowerCase();
    if (!this.suppression.includes(e)) {
      this.suppression.push(e);
      this.persist();
      this.logAudit("suppression.added", { email: e });
    }
    for (const l of this.leads) {
      if (l.email.toLowerCase() === e && !["unsubscribed", "not_interested"].includes(l.status)) {
        this.updateLead(l.id, { status: "unsubscribed" });
      }
    }
  }

  isSuppressed(email: string): boolean {
    return this.suppression.includes(email.toLowerCase());
  }

  suppressionList(): string[] {
    return [...this.suppression];
  }

  // ---- Stats ----
  stats(campaignId?: string): ProspectionStats {
    const by = this.leadsByStatus(campaignId || "");
    const c = campaignId ? this.getCampaign(campaignId) : undefined;
    const warm = c ? this.campaignStatus(c.id) : { warmupActive: false, warmupDaysLeft: 0 };
    const today = new Date().toDateString();
    const sentToday = this.leads.filter(
      (l) => (!campaignId || l.campaignId === campaignId) && l.sentAt && new Date(l.sentAt).toDateString() === today
    ).length;
    const cap = c?.dailyCap || 0;
    return {
      campaigns: this.campaigns.length,
      leads: this.leads.filter((l) => !campaignId || l.campaignId === campaignId).length,
      queued: by.queued,
      sent: by.sent,
      responded: by.responded,
      interested: by.interested,
      bounced: by.bounced,
      unsubscribed: by.unsubscribed,
      sentToday,
      remainingToday: Math.max(0, cap - sentToday),
      warmupActive: warm.warmupActive,
      warmupDaysLeft: warm.warmupDaysLeft,
    };
  }
}