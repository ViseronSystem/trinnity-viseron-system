import fs from "fs";
import path from "path";

// TVS — AGENCY OS (Estructura del Equipo · marketing digital)
// Modelo de dados da agência: clientes, leads, métricas (Google/Meta Ads),
// creatives e ciclos operativos de 2 semanas. Persistido em data/agency/agency.json.

export type ClientOwner = "pedro" | "trafico" | "premi";
export type ClientPlan = "bundle" | "solo_ads" | "solo_creativos" | "landing";
export type ClientStatus = "active" | "onboarding" | "paused";
export type LeadStatus = "new" | "responded" | "nurturing" | "won" | "lost";
export type Platform = "google" | "meta";

export interface AgencyClient {
  id: string;
  name: string;
  niche: string;
  plan: ClientPlan;
  fee: number; // GBP/mês
  status: ClientStatus;
  owner: ClientOwner;
  country: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface AgencyLead {
  id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  status: LeadStatus;
  lang: "es" | "pt" | "en";
  firstContact: string;
  lastContact: string;
  followUpAt: string;
  notes: string;
}

export interface MetricsRecord {
  id: string;
  clientId: string;
  platform: Platform;
  period: string; // ISO week/semana ou mês
  spend: number;
  conversions: number;
  cpa: number;
  roas: number;
  recordedAt: string;
}

export interface CreativeVariant {
  headline: string;
  primaryText: string;
  cta: string;
  script?: string;
}

export interface CreativeJob {
  id: string;
  niche: string;
  platform: Platform;
  lang: string;
  status: "generated" | "failed";
  variants: CreativeVariant[];
  createdAt: string;
}

export interface NurtureAction {
  id: string;
  leadId: string;
  leadEmail: string;
  subject: string;
  body: string;
  status: "queued" | "sent";
  createdAt: string;
}

export interface AgencySnapshot {
  clients: AgencyClient[];
  leads: AgencyLead[];
  metrics: MetricsRecord[];
  creatives: CreativeJob[];
  nurture: NurtureAction[];
  currentCycleStart: string;
}

export class AgencyStore {
  private file: string;

  constructor(dataDir: string) {
    const dir = path.join(dataDir, "agency");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, "agency.json");
  }

  private load(): AgencySnapshot {
    const base: AgencySnapshot = {
      clients: [],
      leads: [],
      metrics: [],
      creatives: [],
      nurture: [],
      currentCycleStart: new Date().toISOString(),
    };
    try {
      if (!fs.existsSync(this.file)) return base;
      const parsed = JSON.parse(fs.readFileSync(this.file, "utf8")) as Partial<AgencySnapshot>;
      return { ...base, ...parsed };
    } catch {
      return base;
    }
  }

  private saveAll(s: AgencySnapshot): void {
    fs.writeFileSync(this.file, JSON.stringify(s, null, 2), "utf8");
  }

  // ---- Clientes ----
  addClient(client: AgencyClient): AgencyClient {
    const s = this.load();
    s.clients.push(client);
    this.saveAll(s);
    return client;
  }

  listClients(status?: ClientStatus): AgencyClient[] {
    const s = this.load();
    const list = status ? s.clients.filter((c) => c.status === status) : s.clients;
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  getClient(id: string): AgencyClient | null {
    return this.load().clients.find((c) => c.id === id) || null;
  }

  updateClient(id: string, patch: Partial<AgencyClient>): AgencyClient | null {
    const s = this.load();
    const idx = s.clients.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    s.clients[idx] = { ...s.clients[idx], ...patch, updatedAt: new Date().toISOString() };
    this.saveAll(s);
    return s.clients[idx];
  }

  removeClient(id: string): boolean {
    const s = this.load();
    const next = s.clients.filter((c) => c.id !== id);
    if (next.length === s.clients.length) return false;
    s.clients = next;
    this.saveAll(s);
    return true;
  }

  // ---- Leads ----
  addLead(lead: AgencyLead): AgencyLead {
    const s = this.load();
    s.leads.push(lead);
    this.saveAll(s);
    return lead;
  }

  listLeads(status?: LeadStatus): AgencyLead[] {
    const s = this.load();
    const list = status ? s.leads.filter((l) => l.status === status) : s.leads;
    return list.sort((a, b) => b.firstContact.localeCompare(a.firstContact));
  }

  getLead(id: string): AgencyLead | null {
    return this.load().leads.find((l) => l.id === id) || null;
  }

  updateLead(id: string, patch: Partial<AgencyLead>): AgencyLead | null {
    const s = this.load();
    const idx = s.leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    s.leads[idx] = { ...s.leads[idx], ...patch, lastContact: new Date().toISOString() };
    this.saveAll(s);
    return s.leads[idx];
  }

  // ---- Métricas ----
  addMetrics(rec: MetricsRecord): MetricsRecord {
    const s = this.load();
    s.metrics.push(rec);
    this.saveAll(s);
    return rec;
  }

  listMetrics(clientId?: string, limit = 200): MetricsRecord[] {
    const s = this.load();
    const list = clientId ? s.metrics.filter((m) => m.clientId === clientId) : s.metrics;
    return list.slice(-limit);
  }

  // ---- Creatives ----
  addCreative(job: CreativeJob): CreativeJob {
    const s = this.load();
    s.creatives.push(job);
    this.saveAll(s);
    return job;
  }

  listCreatives(limit = 50): CreativeJob[] {
    return this.load().creatives.slice(-limit).reverse();
  }

  // ---- Nurturing ----
  addNurture(action: NurtureAction): NurtureAction {
    const s = this.load();
    s.nurture.push(action);
    this.saveAll(s);
    return action;
  }

  listNurture(limit = 100): NurtureAction[] {
    return this.load().nurture.slice(-limit).reverse();
  }

  markNurtureSent(id: string): NurtureAction | null {
    const s = this.load();
    const idx = s.nurture.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    s.nurture[idx].status = "sent";
    this.saveAll(s);
    return s.nurture[idx];
  }

  // ---- Ciclo operativo ----
  setCycleStart(iso: string): void {
    const s = this.load();
    s.currentCycleStart = iso;
    this.saveAll(s);
  }

  snapshot(): AgencySnapshot {
    return this.load();
  }
}

export function newAgencyId(prefix: "cli" | "lead" | "met" | "cr" | "act"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
