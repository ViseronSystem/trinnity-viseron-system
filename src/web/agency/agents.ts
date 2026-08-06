import { askLocalAI } from "../calls/learning";
import { AgencyStore, AgencyLead, CreativeJob, CreativeVariant, NurtureAction, newAgencyId } from "../../core/agency/store";
import { AGENCY_PACKAGES } from "../../core/agency/finance";

// TVS — AGENCY OS · Stack de agentes de IA (Pedro)
// 4 agentes ativos: Reporting · Respuesta a Leads · Creativos · Nurturing.
// Usam IA local (Ollama) quando disponível, com fallback por template trilingue.

export interface AgencyReport {
  generatedAt: string;
  totals: { platform: { google: PlatformTotals; meta: PlatformTotals }; all: PlatformTotals };
  perClient: { clientId: string; clientName: string; platform: string; spend: number; conversions: number; cpa: number; roas: number }[];
  summary: string;
}

interface PlatformTotals {
  spend: number;
  conversions: number;
  cpa: number;
  roas: number;
}

function emptyTotals(): PlatformTotals {
  return { spend: 0, conversions: 0, cpa: 0, roas: 0 };
}

export class ReportingAgent {
  generate(store: AgencyStore): AgencyReport {
    const metrics = store.listMetrics(undefined, 100000);
    const google = emptyTotals();
    const meta = emptyTotals();
    const perClientMap = new Map<string, { clientId: string; clientName: string; platform: string; spend: number; conversions: number; cpa: number; roas: number }>();

    for (const m of metrics) {
      const target = m.platform === "google" ? google : meta;
      target.spend += m.spend;
      target.conversions += m.conversions;
      const client = store.getClient(m.clientId);
      const key = `${m.clientId}:${m.platform}`;
      const row = perClientMap.get(key) || { clientId: m.clientId, clientName: client?.name || m.clientId, platform: m.platform, spend: 0, conversions: 0, cpa: 0, roas: 0 };
      row.spend += m.spend;
      row.conversions += m.conversions;
      perClientMap.set(key, row);
    }

    for (const row of perClientMap.values()) {
      row.cpa = row.conversions > 0 ? Math.round((row.spend / row.conversions) * 100) / 100 : 0;
      row.roas = 0;
    }

    const all = emptyTotals();
    all.spend = google.spend + meta.spend;
    all.conversions = google.conversions + meta.conversions;
    all.cpa = all.conversions > 0 ? Math.round((all.spend / all.conversions) * 100) / 100 : 0;
    google.cpa = google.conversions > 0 ? Math.round((google.spend / google.conversions) * 100) / 100 : 0;
    meta.cpa = meta.conversions > 0 ? Math.round((meta.spend / meta.conversions) * 100) / 100 : 0;

    const summary = `Google Ads: £${google.spend} · ${google.conversions} conv · CPA £${google.cpa} · Meta Ads: £${meta.spend} · ${meta.conversions} conv · CPA £${meta.cpa} · Total: £${all.spend} · ${all.conversions} conv · CPA £${all.cpa}`;

    return {
      generatedAt: new Date().toISOString(),
      totals: { platform: { google, meta }, all },
      perClient: Array.from(perClientMap.values()),
      summary,
    };
  }
}

const LEAD_FALLBACKS: Record<string, string> = {
  es: `¡Gracias por tu interés! Soy el agente de respuesta de la agencia. Nuestros paquetes: Ads (£900-1.200/mes), Creativos/IA (£600-900/mes), Landing page (£600-1.200) y Bundle completo (£1.400-1.800/mes). ¿Te interesa agendar una llamada con Premi?`,
  pt: `Obrigado pelo interesse! Sou o agente de resposta da agência. Os nossos pacotes: Ads (£900-1.200/mês), Criativos/IA (£600-900/mês), Landing page (£600-1.200) e Bundle completo (£1.400-1.800/mês). Quer agendar uma chamada com a Premi?`,
  en: `Thanks for your interest! I'm the agency's lead response agent. Our packages: Ads (£900-1,200/mo), Creatives/AI (£600-900/mo), Landing page (£600-1,200) and Full bundle (£1,400-1,800/mo). Would you like to book a call with Premi?`,
};

export class LeadResponseAgent {
  async respond(store: AgencyStore, lead: AgencyLead, customerMessage?: string): Promise<{ reply: string; usedAI: boolean }> {
    const packageList = AGENCY_PACKAGES.map((p) => `${p.name} £${p.priceMin}-${p.priceMax}/${p.unit === "month" ? "mes" : "único"}`).join("; ");
    const prompt = `You are the lead response agent of a London digital marketing agency (Google + Meta Ads management).
Lead: ${lead.name} (${lead.company || "unknown"}) from ${lead.source || "unknown source"}, language ${lead.lang}.
Initial message: ${(customerMessage || lead.notes || "no initial message").slice(0, 600)}
Packages: ${packageList}.
Reply in the lead's language (${lead.lang}), warm, concise (max 3 sentences), offering a discovery call with Premi (English-speaking markets) or Tráfico Pago. Don't invent prices beyond the list.`;

    let reply: string | null = null;
    let usedAI = false;
    try {
      const ai = await askLocalAI(prompt, "You are a warm, concise agency sales assistant. Reply in the lead's language.");
      if (ai && !ai.toLowerCase().includes("ollama mock")) {
        reply = ai;
        usedAI = true;
      }
    } catch {
      reply = null;
    }
    if (!reply) reply = LEAD_FALLBACKS[lead.lang] || LEAD_FALLBACKS.en;

    store.updateLead(lead.id, { status: "responded", notes: `${lead.notes ? lead.notes + " · " : ""}[${new Date().toISOString()}] resposta enviada: ${reply.slice(0, 200)}` });
    return { reply, usedAI };
  }
}

const CREATIVE_FALLBACK = (niche: string, platform: string): CreativeVariant[] => [
  { headline: "Resultados reales para " + niche, primaryText: `Campañas de ${platform === "google" ? "Google" : "Meta"} Ads gestionadas con agentes de IA. Reportes quincenales y optimización continua.`, cta: "Reserva una llamada", script: `Hook: ¿Tu inversión en ads da resultados? Aquí está cómo la IA mejora tu ROAS.` },
  { headline: "Real results for " + niche, primaryText: `${platform === "google" ? "Google" : "Meta"} Ads campaigns managed with AI agents. Biweekly reports and continuous optimization.`, cta: "Book a call", script: `Hook: Is your ad spend paying off? Here's how AI improves your ROAS.` },
  { headline: "Resultados reais para " + niche, primaryText: `Campanhas de ${platform === "google" ? "Google" : "Meta"} Ads geridas com agentes de IA. Relatórios quinzenais e otimização contínua.`, cta: "Marque uma chamada", script: `Hook: O seu investimento em ads dá resultados? Veja como a IA melhora o seu ROAS.` },
];

export class CreativesAgent {
  async generate(store: AgencyStore, niche: string, platform: "google" | "meta", lang: "es" | "pt" | "en"): Promise<CreativeJob> {
    const job: CreativeJob = {
      id: newAgencyId("cr"),
      niche,
      platform,
      lang,
      status: "failed",
      variants: [],
      createdAt: new Date().toISOString(),
    };
    const prompt = `You generate ad creatives for a London digital marketing agency targeting "${niche}" businesses on ${platform === "google" ? "Google" : "Meta"} Ads.
Return STRICT JSON only: an array of 3 objects, each with keys headline (string), primaryText (string, max 90 words), cta (string), script (string, 15s video script).
Write in ${lang}. Focus on the agency's value: AI agents, biweekly reporting, £1,400-1,800/mo full bundle.`;

    const raw = await askLocalAI(prompt, "You output only valid JSON, nothing else.");
    let variants: CreativeVariant[] | null = null;
    if (raw) {
      const parsed = safeParseJson(raw);
      if (Array.isArray(parsed)) {
        variants = parsed
          .filter((v) => v && typeof v.headline === "string" && typeof v.primaryText === "string")
          .slice(0, 3)
          .map((v) => ({
            headline: String(v.headline).slice(0, 120),
            primaryText: String(v.primaryText).slice(0, 1200),
            cta: String(v.cta || "Reservar llamada").slice(0, 80),
            script: typeof v.script === "string" ? String(v.script).slice(0, 600) : undefined,
          }));
      }
    }
    if (variants && variants.length >= 3) {
      job.variants = variants;
      job.status = "generated";
    } else {
      job.variants = CREATIVE_FALLBACK(niche, platform);
      job.status = "generated";
    }
    store.addCreative(job);
    return job;
  }
}

export class NurturingAgent {
  // Encontra leads sem conversão e prepara follow-ups automáticos (continuos).
  run(store: AgencyStore, now = new Date()): NurtureAction[] {
    const created: NurtureAction[] = [];
    const leads = store.listLeads();
    for (const lead of leads) {
      if (lead.status === "won" || lead.status === "lost") continue;
      const lastContact = new Date(lead.lastContact || lead.firstContact).getTime();
      const daysWaiting = (now.getTime() - lastContact) / 86400000;
      const daysForFollowUp = lead.status === "new" ? 2 : 7;
      if (daysWaiting < daysForFollowUp) continue;
      const existing = store.listNurture(100000).some((a) => a.leadId === lead.id && a.status === "queued");
      if (existing) continue;
      const action: NurtureAction = {
        id: newAgencyId("act"),
        leadId: lead.id,
        leadEmail: lead.email,
        subject: NURTURE_SUBJECTS[lead.lang] || NURTURE_SUBJECTS.en,
        body: (NURTURE_BODIES[lead.lang] || NURTURE_BODIES.en)(lead.name),
        status: "queued",
        createdAt: new Date().toISOString(),
      };
      store.addNurture(action);
      store.updateLead(lead.id, { status: "nurturing" });
      created.push(action);
    }
    return created;
  }
}

const NURTURE_SUBJECTS: Record<string, string> = {
  es: "¿Siguen siendo relevantes tus objetivos de crecimiento?",
  pt: "Os seus objetivos de crescimento continuam a fazer sentido?",
  en: "Are your growth goals still on track?",
};

const NURTURE_BODIES: Record<string, (name: string) => string> = {
  es: (name) => `Hola ${name}, el equipo (Pedro, Premi y Tráfico Pago) quedó disponible por si quieres retomar la conversación sobre Ads con agentes de IA. ¿Te va bien una llamada esta semana?`,
  pt: (name) => `Olá ${name}, a equipa (Pedro, Premi e Tráfico Pago) continua disponível caso queira retomar a conversa sobre Ads com agentes de IA. Que tal uma chamada esta semana?`,
  en: (name) => `Hi ${name}, the team (Pedro, Premi and Tráfico Pago) is still available if you'd like to pick up the conversation about AI-managed ads. Would a call this week work for you?`,
};

function safeParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {}
  const m = raw.match(/\[[\s\S]*\]/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }
  return null;
}
