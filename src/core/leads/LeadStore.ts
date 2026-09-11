/**
 * Lead Store — Manages 526K+ leads from telecom + banking Excel files
 * Segments by channel readiness: RCS/SMS, WhatsApp, Email, LinkedIn
 * Persists to data/campaigns/leads.json
 */
import * as fs from "fs";
import * as path from "path";

export interface Lead {
  id: string;
  source: "telecom" | "banking" | "manual";
  name: string;
  dni?: string;
  phones: string[];
  email?: string;
  company?: string;
  bank?: string;
  iban?: string;
  province?: string;
  operator?: string;
  segment?: "platino" | "gold" | "silver" | "bronze" | "cantera" | "general";
  tariff?: string;
  language: "es" | "pt" | "en";
  channels: {
    rcs: boolean;
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
    linkedin: boolean;
  };
  tags: string[];
  status: "fresh" | "contacted" | "responded" | "converted" | "opted_out";
  createdAt: string;
  lastContactedAt?: string;
  notes?: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: "rcs" | "sms" | "whatsapp" | "email" | "multi";
  targetSegment: string;
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  respondedCount: number;
  convertedCount: number;
  revenue: number;
  cost: number;
  status: "draft" | "scheduled" | "sending" | "completed" | "paused";
  messages: CampaignMessage[];
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
}

export interface CampaignMessage {
  id: string;
  leadId: string;
  channel: "rcs" | "sms" | "whatsapp" | "email";
  content: string;
  personalization: Record<string, string>;
  status: "queued" | "sent" | "delivered" | "failed" | "responded";
  sentAt?: string;
  deliveredAt?: string;
  error?: string;
}

export interface LeadStats {
  total: number;
  bySource: Record<string, number>;
  byChannel: Record<string, number>;
  bySegment: Record<string, number>;
  byProvince: Record<string, number>;
  byOperator: Record<string, number>;
  byLanguage: Record<string, number>;
}

export class LeadStore {
  private file: string;
  private leads: Lead[] = [];
  private campaigns: Campaign[] = [];

  constructor(dataDir: string) {
    const dir = path.join(dataDir, "campaigns");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, "leads.json");
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.file)) {
        const data = JSON.parse(fs.readFileSync(this.file, "utf8"));
        this.leads = data.leads || [];
        this.campaigns = data.campaigns || [];
      }
    } catch {
      this.leads = [];
      this.campaigns = [];
    }
  }

  private save(): void {
    fs.writeFileSync(this.file, JSON.stringify({
      leads: this.leads,
      campaigns: this.campaigns,
      updatedAt: new Date().toISOString()
    }, null, 2));
  }

  // ---- LEADS ----

  addLead(lead: Omit<Lead, "id" | "createdAt" | "channels" | "status">): Lead {
    const existing = this.leads.find(l =>
      (l.dni && l.dni === lead.dni) ||
      (l.phones.length > 0 && lead.phones.some(p => l.phones.includes(p)))
    );
    if (existing) return existing;

    const newLead: Lead = {
      ...lead,
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      channels: {
        rcs: lead.phones.length > 0,
        sms: lead.phones.length > 0,
        whatsapp: lead.phones.length > 0,
        email: !!lead.email,
        linkedin: !!lead.name && !!lead.company,
      },
      status: "fresh",
      createdAt: new Date().toISOString(),
    };
    this.leads.push(newLead);
    return newLead;
  }

  addLeadsBatch(leads: Omit<Lead, "id" | "createdAt" | "channels" | "status">[]): number {
    let added = 0;
    for (const lead of leads) {
      const existing = this.leads.find(l =>
        (l.dni && l.dni === lead.dni) ||
        (l.phones.length > 0 && lead.phones.some(p => l.phones.includes(p)))
      );
      if (!existing) {
        this.leads.push({
          ...lead,
          id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          channels: {
            rcs: lead.phones.length > 0,
            sms: lead.phones.length > 0,
            whatsapp: lead.phones.length > 0,
            email: !!lead.email,
            linkedin: !!lead.name && !!lead.company,
          },
          status: "fresh",
          createdAt: new Date().toISOString(),
        });
        added++;
      }
    }
    return added;
  }

  getLeads(filters?: {
    source?: string;
    channel?: string;
    segment?: string;
    status?: string;
    province?: string;
    operator?: string;
    limit?: number;
    offset?: number;
  }): Lead[] {
    let result = [...this.leads];

    if (filters?.source) result = result.filter(l => l.source === filters.source);
    if (filters?.channel) { const ch = filters.channel; result = result.filter(l => (l.channels as any)[ch]); }
    if (filters?.segment) result = result.filter(l => l.segment === filters.segment);
    if (filters?.status) result = result.filter(l => l.status === filters.status);
    if (filters?.province) result = result.filter(l => l.province === filters.province);
    if (filters?.operator) result = result.filter(l => l.operator === filters.operator);

    if (filters?.offset) result = result.slice(filters.offset);
    if (filters?.limit) result = result.slice(0, filters.limit);

    return result;
  }

  getLead(id: string): Lead | undefined {
    return this.leads.find(l => l.id === id);
  }

  updateLead(id: string, patch: Partial<Lead>): Lead | null {
    const idx = this.leads.findIndex(l => l.id === id);
    if (idx === -1) return null;
    this.leads[idx] = { ...this.leads[idx], ...patch };
    this.save();
    return this.leads[idx];
  }

  getStats(): LeadStats {
    const bySource: Record<string, number> = {};
    const byChannel: Record<string, number> = { rcs: 0, sms: 0, whatsapp: 0, email: 0, linkedin: 0 };
    const bySegment: Record<string, number> = {};
    const byProvince: Record<string, number> = {};
    const byOperator: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};

    for (const lead of this.leads) {
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      if (lead.channels.rcs) byChannel.rcs++;
      if (lead.channels.sms) byChannel.sms++;
      if (lead.channels.whatsapp) byChannel.whatsapp++;
      if (lead.channels.email) byChannel.email++;
      if (lead.channels.linkedin) byChannel.linkedin++;
      if (lead.segment) bySegment[lead.segment] = (bySegment[lead.segment] || 0) + 1;
      if (lead.province) byProvince[lead.province] = (byProvince[lead.province] || 0) + 1;
      if (lead.operator) byOperator[lead.operator] = (byOperator[lead.operator] || 0) + 1;
      byLanguage[lead.language] = (byLanguage[lead.language] || 0) + 1;
    }

    return {
      total: this.leads.length,
      bySource,
      byChannel,
      bySegment,
      byProvince,
      byOperator,
      byLanguage,
    };
  }

  // ---- CAMPAIGNS ----

  createCampaign(campaign: Omit<Campaign, "id" | "createdAt" | "sentCount" | "deliveredCount" | "respondedCount" | "convertedCount" | "revenue" | "cost">): Campaign {
    const newCampaign: Campaign = {
      ...campaign,
      id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sentCount: 0,
      deliveredCount: 0,
      respondedCount: 0,
      convertedCount: 0,
      revenue: 0,
      cost: 0,
      createdAt: new Date().toISOString(),
    };
    this.campaigns.push(newCampaign);
    this.save();
    return newCampaign;
  }

  getCampaigns(): Campaign[] {
    return [...this.campaigns];
  }

  getCampaign(id: string): Campaign | undefined {
    return this.campaigns.find(c => c.id === id);
  }

  updateCampaign(id: string, patch: Partial<Campaign>): Campaign | null {
    const idx = this.campaigns.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.campaigns[idx] = { ...this.campaigns[idx], ...patch };
    this.save();
    return this.campaigns[idx];
  }

  // ---- CONVERSION TRACKING ----

  trackConversion(leadId: string, revenue: number, campaignId?: string): void {
    const lead = this.leads.find(l => l.id === leadId);
    if (lead) {
      lead.status = "converted";
      lead.notes = `${lead.notes || ""}\n[CONVERTED] Revenue: €${revenue} ${campaignId ? `Campaign: ${campaignId}` : ""}`;
    }
    if (campaignId) {
      const camp = this.campaigns.find(c => c.id === campaignId);
      if (camp) {
        camp.convertedCount++;
        camp.revenue += revenue;
      }
    }
    this.save();
  }

  // ---- REVENUE PROJECTION ----

  projectRevenue(months: number = 12): Array<{
    month: number;
    leads: number;
    conversionRate: number;
    conversions: number;
    revenuePerConversion: number;
    revenue: number;
    cumulativeRevenue: number;
  }> {
    const stats = this.getStats();
    const results = [];
    let cumulative = 0;

    for (let m = 1; m <= months; m++) {
      const leads = Math.floor(stats.total * 0.1 * (1 + m * 0.1));
      const conversionRate = 0.01 + m * 0.005;
      const conversions = Math.floor(leads * conversionRate);
      const revenuePerConversion = 150;
      const revenue = conversions * revenuePerConversion;
      cumulative += revenue;
      results.push({
        month: m,
        leads,
        conversionRate,
        conversions,
        revenuePerConversion,
        revenue,
        cumulativeRevenue: cumulative,
      });
    }
    return results;
  }
}
