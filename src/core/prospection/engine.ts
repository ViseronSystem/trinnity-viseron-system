import { askLocalAI } from "../../web/calls/learning";
import { EmailService } from "../../web/email/service";
import { ProspectionCampaign, ProspectionLead, ProspectionStore } from "./store";

// TVS — PROSPECTION OS · Pipeline E2E
// importar → limpar → personalizar (IA) → enviar (rate-limited, warm-up) → capturar respostas → classificar → alertar

const DEFAULT_SIGNATURE = "Equipa TVS · Trinnity Viseron System";

function templateMessage(lead: ProspectionLead, campaign: ProspectionCampaign, lang: "pt" | "es" | "en"): { subject: string; text: string } {
  const name = lead.name.split(" ")[0];
  const clinic = lead.clinic || lead.city || "a vossa clínica";
  if (lang === "pt") {
    return {
      subject: `Uma ideia para ${clinic}`,
      text: `Olá ${name}, tudo bem?\n\nEspecializamo-nos em trazer pacientes de verdade para clínicas como a ${clinic} — com gestão completa: anúncios, WhatsApp, seguimento de leads e relatórios.\n\nTem 5 minutos esta semana para eu partilhar um caso concreto de uma clínica parecida? Podemos falar por WhatsApp ou telefone.\n\n${DEFAULT_SIGNATURE}`,
    };
  }
  if (lang === "es") {
    return {
      subject: `Una idea para ${clinic}`,
      text: `Hola ${name}, ¿todo bien?\n\nNos especializamos en traer pacientes reales a clínicas como ${clinic} — con gestión completa: anuncios, WhatsApp, seguimiento de leads e informes.\n\n¿Tienes 5 minutos esta semana para compartirte un caso concreto de una clínica similar? Podemos hablar por WhatsApp o teléfono.\n\n${DEFAULT_SIGNATURE}`,
    };
  }
  return {
    subject: `An idea for ${clinic}`,
    text: `Hi ${name},\n\nWe specialise in bringing real patients to clinics like ${clinic} — full management: ads, WhatsApp, lead follow-up and reporting.\n\nDo you have 5 minutes this week for me to share a concrete case from a similar clinic? We can talk over WhatsApp or phone.\n\n${DEFAULT_SIGNATURE}`,
  };
}

export class ProspectionEngine {
  constructor(private store: ProspectionStore, private email: EmailService) {}

  // 1+2+3: personalização por IA (cadeia de providers via askLocalAI, fallback por template trilingue)
  async personalize(lead: ProspectionLead, campaign: ProspectionCampaign): Promise<{ subject: string; text: string; lang: string; ai: boolean }> {
    const name = lead.name.split(" ")[0];
    const clinic = lead.clinic || "a vossa clínica";
    const city = lead.city || "";
    const employees = lead.employees ? ` ${lead.employees} colaboradores.` : "";
    const prompt = `Write a short, natural, first-contact sales email (max 90 words) for a clinic marketing agency.
Lead: name=${lead.name}, clinic=${clinic}, city=${city}, employees=${employees || "unknown"}.
Purpose: request a 5-minute call about bringing more patients.
Rules: personalise with the real details, no fluff, no promises, never use placeholders like [Your Name] or brackets, end with a question, sign as "Equipa TVS · Trinnity Viseron System".
Reply with ONLY: SUBJECT: <subject>\nBODY: <email body>`;
    const raw = await askLocalAI(prompt, "You are a senior B2B cold-email copywriter. Output only the email. Language: match the language of the clinic's country (Portuguese if Brazil, Spanish if Spain/LatAm, English otherwise).");
    let lang: "pt" | "es" | "en" = "pt";
    if (raw) {
      const lower = raw.toLowerCase();
      if (/espa|hola|clientes de|te gustaría/i.test(lower)) lang = "es";
      else if (/hi |hello|your clinic|patients/i.test(lower) && !/você|sua clínica|olá/i.test(lower)) lang = "en";
      const subj = /SUBJECT:\s*(.+)/i.exec(raw);
      const body = /BODY:\s*([\s\S]+)/i.exec(raw);
      if (subj && body) {
        return { subject: subj[1].trim().slice(0, 140), text: body[1].trim().slice(0, 1200), lang, ai: true };
      }
    }
    const fb = templateMessage(lead, campaign, lang);
    return { ...fb, lang, ai: false };
  }

  async personalizeCampaign(campaignId: string): Promise<{ ok: boolean; done: number; failed: number; errors: string[] }> {
    const campaign = this.store.getCampaign(campaignId);
    if (!campaign) return { ok: false, done: 0, failed: 0, errors: [`campanha não existe: ${campaignId}`] };
    const leads = this.store.listLeads(campaignId, "new");
    let done = 0, failed = 0;
    const errors: string[] = [];
    for (const lead of leads) {
      try {
        const msg = await this.personalize(lead, campaign);
        this.store.updateLead(lead.id, {
          message: msg.text,
          messageLang: msg.lang,
          status: "queued",
          subject: msg.subject,
          aiGenerated: msg.ai,
        });
        done++;
      } catch (e) {
        failed++;
        errors.push(`${lead.email}: ${(e as Error).message}`);
      }
    }
    if (done + failed > 0) this.store.logAudit("campaign.personalized", { campaignId, done, failed });
    return { ok: failed === 0, done, failed, errors };
  }

  // 4: envio com warm-up + rate limit diário (pipeline real via EmailService/Gmail; dev simulado)
  async sendBatch(campaignId: string, limit?: number): Promise<{ ok: boolean; sent: number; skipped: number; warmup: boolean; reason?: string }> {
    const campaign = this.store.getCampaign(campaignId);
    if (!campaign) return { ok: false, sent: 0, skipped: 0, warmup: false, reason: "campanha não existe" };
    const warm = this.store.campaignStatus(campaignId);
    const stats = this.store.stats(campaignId);
    const cap = limit ?? campaign.dailyCap;
    if (warm.warmupActive) {
      this.store.logAudit("send.blocked_warmup", { campaignId, daysLeft: warm.warmupDaysLeft });
      return { ok: false, sent: 0, skipped: 0, warmup: true, reason: `warm-up em curso (${warm.warmupDaysLeft} dias restantes) — enviar agora queima a reputação do domínio` };
    }
    if (stats.remainingToday <= 0) {
      return { ok: false, sent: 0, skipped: 0, warmup: false, reason: "limite diário atingido" };
    }
    const budget = Math.min(cap, stats.remainingToday);
    const leads = this.store.listLeads(campaignId, "queued").slice(0, budget);
    let sent = 0;
    for (const lead of leads) {
      const msg = lead.message;
      if (!msg || this.store.isSuppressed(lead.email)) {
        this.store.updateLead(lead.id, { status: this.store.isSuppressed(lead.email) ? "unsubscribed" : "queued" });
        continue;
      }
      const result = await this.email.send({
        to: lead.email,
        subject: lead.subject || `Uma ideia para ${lead.clinic || "a vossa clínica"}`,
        text: msg,
      });
      if (result.ok) {
        this.store.updateLead(lead.id, { status: "sent", sentAt: new Date().toISOString() });
        sent++;
      } else {
        this.store.updateLead(lead.id, { status: "bounced" });
        this.store.logAudit("send.failed", { leadId: lead.id, email: lead.email, error: result.error });
      }
    }
    this.store.logAudit("send.batch", { campaignId, sent, provider: this.email.transport.provider });
    return { ok: true, sent, skipped: leads.length - sent, warmup: false };
  }

  // 5+6: captura de respostas (webhook/email) + classificação de intenção
  async captureResponse(leadId: string, responseText: string, source: string): Promise<ProspectionLead | undefined> {
    const lead = this.store.getLead(leadId);
    if (!lead) return undefined;
    const text = String(responseText || "").slice(0, 4000);
    const lower = text.toLowerCase();
    let intent: "hot" | "info" = "info";
    if (/(quanto|preço|precio|price|agendar|marcar|cita|schedule|meet|liga|chama|whatsapp|interesad|interessad|vamos|quiero|quero)/.test(lower)) intent = "hot";
    let status: ProspectionLead["status"] = intent === "hot" ? "interested" : "responded";
    if (/(não|no |nao|nunca|quita|remove|parar|stop|spam)/.test(lower)) {
      status = "not_interested";
      this.store.suppress(lead.email);
    }
    this.store.updateLead(lead.id, {
      status,
      intent,
      responseText: text,
      responseAt: new Date().toISOString(),
    });
    this.store.logAudit("lead.responded", { leadId, email: lead.email, intent, source });
    return this.store.getLead(leadId);
  }

  // Alertar gestor (WhatsApp pessoal/Slack — via bridges disponíveis; aqui fica no audit + logs)
  alertManager(lead: ProspectionLead): void {
    this.store.logAudit("alert.manager", {
      message: `Novo lead: ${lead.name} · ${lead.clinic} · intenção: ${lead.intent || "?"} · origem: email`,
      leadId: lead.id,
    });
  }
}