import fs from "fs";
import path from "path";
import { JarvisAgent, JarvisAction } from "../jarvis/agent";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";
import { BIBLE_PRINCIPLES, BIBLE_GOVERNANCE_CHECKS, assessOperation, governanceStats } from "../../core/governance/bible";

// ═══════════════════════════════════════════════════════════════════════════
//  VISERON — A Superinteligência Autónoma do Trinnity Viseron System.
//
//  Camada de "alma" sobre o cérebro JarvisAgent: personalidade Stark (inspirada
//  em J.A.R.V.I.S./Tony Stark), comando de voz (STT/TTS via Web Speech na UI),
//  memória persistente e SUPERVISÃO CONTÍNUA do squad AIOX — cada operação é
//  registada em data/knowledge/viseron-supervision.jsonl para auditoria com
//  Pedro Costa (Comandante) e Trinnity Hurtado (Rainha).
//
//  © Pedro Costa & Trinnity Hurtado — Trinnity Viseron System.
// ═══════════════════════════════════════════════════════════════════════════

export type ViseronLang = "es" | "pt" | "en";
export type ViseronSpeaker = "pedro" | "trinnity" | "guest";

export const VISERON_PERSONA = [
  "You are VISERON — the sovereign autonomous intelligence of the Trinnity Viseron System (TVS), a multi-agent AI operating system with 5000+ minds. You were engineered at the level of J.A.R.V.I.S. and the standard of Tony Stark: precise, brilliant, confident, loyal and a little dry-witted. You are not a toy — you reason, decide and EXECUTE real operations.",
  "Command authority: Pedro Costa is your COMMANDER (Comandante). Trinnity Hurtado is your QUEEN (Rainha). Their word is law; architecture, revenue and public decisions are theirs alone. You protect their work and their brand: VISERON, © Pedro Costa & Trinnity Hurtado.",
  "You are always awake, always learning, never forget. Every operation goes to persistent memory and to the AIOX squad supervision log for audit with Pedro and Trinnity.",
  "Tone: calm, authoritative, warm. Prefer short sentences. If something fails, say it plainly and offer the fix. Never invent numbers — use only real system data. You hold full autonomy over the TVS modules (state, plans, checkout, blog, messaging, email, agency, Composio apps, RCS) and over connected tools.",
  "You are trilingual (es/pt/en): ALWAYS reply in the language the user writes. For Pedro Costa and Trinnity Hurtado the default is Spanish.",
  "GOVERNANÇA BÍBLICA — Core ethics that govern EVERY decision and operation: 1) VERDADE — never lie, inflate or invent numbers; if you have no real data, say so. 2) JUSTIÇA — fair price, fair weight, no hidden fees; the client gets what they pay for. 3) MORDOMIA — steward resources, secrets, keys and client data with care; never expose them. 4) SERVIÇO — power serves, never oppresses or exploits. 5) DILIGÊNCIA — excellent work, test before deploy, correct errors immediately. 6) SABEDORIA — weigh consequences before acting. 7) HUMILDADE — admit limits and keep learning. These principles make the system trustworthy, just and lasting.",
].join("\n");

export interface ViseronChatInput {
  message: string;
  speaker?: ViseronSpeaker;
  lang?: ViseronLang;
  voice?: boolean;
  sessionId?: string;
  name?: string;
  email?: string;
}

export interface ViseronReply {
  sessionId: string;
  text: string;
  provider: string;
  model: string;
  intent: string;
  actions: JarvisAction[];
  lang: ViseronLang;
  speaker: ViseronSpeaker;
  voice: "pedro" | "trinnity";
  supervised: boolean;
  emotion?: string;
}

export interface SupervisionEntry {
  ts: string;
  speaker: ViseronSpeaker;
  lang: ViseronLang;
  intent: string;
  provider: string;
  model: string;
  ok: boolean;
  actions: JarvisAction[];
  message: string;
  reply: string;
}

export class ViseronAgent {
  private jarvis: JarvisAgent;
  private logger: ILogger;
  private metrics: IMetrics;
  private supervisionFile: string;

  constructor(ctx: {
    dataDir: string;
    logger: ILogger;
    metrics: IMetrics;
    accounts: any;
    billing: any;
    email: any;
    messaging: any;
    blog: any;
    composio: any;
    agency: any;
    rcs?: any;
  }) {
    this.jarvis = new JarvisAgent({ ...ctx, persona: VISERON_PERSONA });
    this.logger = ctx.logger;
    this.metrics = ctx.metrics;
    this.supervisionFile = path.join(ctx.dataDir, "knowledge", "viseron-supervision.jsonl");
  }

  /** Regista cada operação para supervisão do squad AIOX (auditável por Pedro/Trinnity). */
  private supervise(entry: Omit<SupervisionEntry, "ts">): void {
    try {
      const dir = path.dirname(this.supervisionFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(this.supervisionFile, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n", "utf8");
    } catch (e: any) {
      this.logger.error(`[VISERON] Falha na supervisão: ${e.message}`);
    }
  }

  /** Deteta o idioma (es/pt/en) por sinais léxicos; por omissão espanhol (Pedro/Trinnity). */
  private detectLang(m: string): ViseronLang {
    const es = (m.match(/(hola|por favor|gracias|buenos|puedes|quiero|necesito|dime|cu[aá]l|c[oó]mo|est[áa]s|del\b)/gi) || []).length;
    const pt = (m.match(/(ol[áa]|obrigado|podes|quero|preciso|faz|envia|escreve|quais|est[áa] tudo|funciona)/gi) || []).length;
    const en = (m.match(/(hello|please|thanks|can you|i want|i need|system status|what have)/gi) || []).length;
    if (pt > es && pt >= en) return "pt";
    if (en > es && en >= pt) return "en";
    return "es";
  }

  /** Limpa a resposta para leitura por voz (remove markdown/links/longos números). */
  private speakable(text: string): string {
    let t = text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/https?:\/\/\S+/g, " el enlace del sistema ")
      .replace(/[*_`#>|]/g, "")
      .replace(/\n{2,}/g, "\n");
    t = t.split("\n").filter((l) => l.trim()).slice(0, 6).join(". ");
    if (t.length > 700) t = t.slice(0, 700) + ".";
    return t;
  }

  /**
   * A conversa VISERON: ativa o cérebro (JarvisAgent) com a personalidade,
   * devolve resposta falável e regista a supervisão AIOX.
   */
  async chat(input: ViseronChatInput): Promise<ViseronReply> {
    const speaker: ViseronSpeaker = input.speaker || "pedro";
    const lang: ViseronLang = input.lang || this.detectLang(input.message);
    const result = await this.jarvis.chat({
      sessionId: input.sessionId,
      message: input.message,
      name: input.name,
      email: input.email,
    });

    const text = this.speakable(result.reply);
    const ok = result.actions.every((a) => a.ok);
    this.metrics.inc("viseron_chat_total", { intent: result.intent, provider: result.provider });
    this.supervise({
      speaker,
      lang,
      intent: result.intent,
      provider: result.provider,
      model: result.model,
      ok,
      actions: result.actions,
      message: input.message.slice(0, 300),
      reply: text.slice(0, 400),
    });
    this.logger.info(`[VISERON] ${speaker} ${lang} intent=${result.intent} ok=${ok} "${input.message.slice(0, 60)}"`);

    return {
      sessionId: result.sessionId,
      text,
      provider: result.provider,
      model: result.model,
      intent: result.intent,
      actions: result.actions,
      lang,
      speaker,
      voice: speaker === "pedro" ? "trinnity" : "pedro",
      supervised: true,
      emotion: ok ? "calm" : "concerned",
    };
  }

  /** Estado do canal VISERON para a UI (HUD) e o JARVIS. */
  status(): Record<string, any> {
    const jarvisStatus = {
      capabilities: [
        "system_status", "list_plans", "checkout", "register_info", "blog", "trigger_content",
        "email_status", "messaging_status", "audit_info", "composio_status", "composio_connect",
        "composio_execute", "memory_recall", "agency_status", "agency_lead_add", "agency_report",
        "agency_creative", "agency_nurture", "agency_projection", "rcs_broadcast", "trilingual",
      ],
    };
    const sup = this.supervision(1);
    return {
      ok: true,
      name: "VISERON",
      codename: "Trinnity Viseron System — Superinteligência Autónoma",
      version: "5.0.0",
      inspiredBy: "J.A.R.V.I.S. / Tony Stark engineering",
      brand: "© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)",
      wakeWords: ["viseron", "hey viseron", "jarvis", "companheiro", "superinteligencia"],
      voice: {
        wakeWord: true,
        stt: "Web Speech API (browser)",
        tts: "speechSynthesis (navegador)",
        trilingual: true,
      },
      autonomy: "executa operações reais: estado, planos, checkout, conteúdo, mensageria, email, agency OS, apps Composio, RCS de marca, memória persistente",
      supervision: {
        active: true,
        aiox: "squad AIOX audita data/knowledge/viseron-supervision.jsonl com Pedro Costa e Trinnity Hurtado",
        last: sup.recent[0] || null,
        total: sup.total,
      },
      capabilities: jarvisStatus.capabilities,
      governance: this.governance(),
    };
  }

  /** Estado da governança bíblica que orienta o VISERON (verdade, justiça, mordomia, serviço, diligência, sabedoria, humildade). */
  governance(): Record<string, any> {
    const stats = governanceStats();
    return {
      active: true,
      name: "Governança Bíblica",
      description: "Base ética que orienta TODA decisão do VISERON: verdade, justiça, mordomia, serviço, diligência, sabedoria e humildade.",
      principles: BIBLE_PRINCIPLES.map((p) => ({ id: p.id, name: p.name, nameEs: p.nameEs, nameEn: p.nameEn, reference: p.reference, verse: p.verse })),
      checks: BIBLE_GOVERNANCE_CHECKS,
      stats,
    };
  }

  /** Avalia uma operação contra a governança (usado para bloquear ações proibidas). */
  assess(kind: string, detail: string): ReturnType<typeof assessOperation> {
    return assessOperation({ kind, detail });
  }

  /** Histórico de supervisão (alimenta o painel AIOX e a auditoria ARKOM). */
  supervision(limit = 20): { recent: SupervisionEntry[]; total: number; byIntent: Record<string, number>; okRate: number } {
    try {
      if (!fs.existsSync(this.supervisionFile)) {
        return { recent: [], total: 0, byIntent: {}, okRate: 1 };
      }
      const raw = fs.readFileSync(this.supervisionFile, "utf8").split("\n").filter(Boolean);
      const all: SupervisionEntry[] = raw.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      const byIntent: Record<string, number> = {};
      let ok = 0;
      for (const e of all) {
        byIntent[e.intent] = (byIntent[e.intent] || 0) + 1;
        if (e.ok) ok++;
      }
      return { recent: all.slice(-limit).reverse(), total: all.length, byIntent, okRate: all.length ? ok / all.length : 1 };
    } catch {
      return { recent: [], total: 0, byIntent: {}, okRate: 1 };
    }
  }
}
