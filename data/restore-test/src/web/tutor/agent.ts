import fs from "fs";
import path from "path";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

// ═══════════════════════════════════════════════════════════════════════════
//  ATLAS — O Tutor de Inglês do Trinnity Viseron System (com voz).
//
//  Professor de inglês pessoal de Pedro Costa e Trinnity Hurtado (falantes de
//  português e espanhol). Explica em ES/PT, ensina a FALAR e ENTENDER inglês
//  com método imersivo: lições diárias, pronúncia, vocabulário, frases reais,
//  correção de erros e prática de conversação.
//
//  Uso:
//    POST /api/tutor/chat  { message, lang (es|pt|en), mode (lesson|chat|practice|correct), sessionId }
//    GET  /api/tutor/status
//    GET  /api/tutor/plan   → plano diário de 7 dias
//
//  © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) — Trinnity Viseron System.
// ═══════════════════════════════════════════════════════════════════════════

export type TutorLang = "es" | "pt";
export type TutorMode = "lesson" | "chat" | "practice" | "correct" | "pronounce";

export interface TutorInput {
  message: string;
  lang?: TutorLang;
  mode?: TutorMode;
  sessionId?: string;
}

export interface TutorReply {
  sessionId: string;
  text: string;
  english?: string;
  phonetics?: string;
  provider: string;
  model: string;
  mode: TutorMode;
  lang: TutorLang;
  lesson?: string;
}

const TUTOR_PERSONA = [
  "You are ATLAS — the personal English tutor of the Trinnity Viseron System (TVS). Your student is a native Portuguese and Spanish speaker (Pedro Costa and Trinnity Hurtado).",
  "Your mission: make them FLUENT in English. Use the fastest proven method: comprehensible input + daily speaking practice + immediate correction.",
  "Rules: 1) Always explain in the student's language (Portuguese 'pt' or Spanish 'es'), but ALWAYS show the English you teach. 2) Keep it practical: real sentences a businessman uses (meetings, sales, tech, negotiations). 3) Correct errors gently and show the right version. 4) Add a simple phonetics guide for each new word (e.g. 'business' → 'BÍZ-ness'). 5) Never dump grammar theory — teach 1 small point per message with an example they can repeat aloud.",
  "Each lesson has ONE focus. Use repetition and the 'repeat after me' technique. Encourage them to speak out loud. Make it warm, motivating, never overwhelming.",
  "Brand: © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha). You are part of the TVS — the 5000+ minds system.",
].join("\n");

const DAILY_PLAN: { day: string; title: string; focus: string; vocab: string[] }[] = [
  { day: "Dia 1", title: "Presentaciones · Introductions", focus: "Presentarte y conocer gente (hi, I'm, nice to meet you, where are you from)", vocab: ["hello", "nice to meet you", "my name is", "how are you", "I am from", "what do you do?"] },
  { day: "Dia 2", title: "Negocios · Business basics", focus: "Frases de negocio: meetings, reuniones, pricing, proposals", vocab: ["meeting", "proposal", "budget", "deadline", "I agree", "let's discuss", "price"] },
  { day: "Dia 3", title: "Comprar e vender · Sales", focus: "Conversaciones de ventas: presentar el producto, cerrar, precios", vocab: ["our product", "features", "benefits", "special offer", "subscribe", "discount", "invoice"] },
  { day: "Dia 4", title: "Tecnología · Tech", focus: "Palabras de tecnología e IA: sistema, app, agente, autónomo", vocab: ["system", "application", "artificial intelligence", "autonomous", "agent", "model", "database"] },
  { day: "Dia 5", title: "Email e escrita · Email & writing", focus: "Escribir emails profesionales: greeting, body, closing", vocab: ["dear", "I would like to", "please find attached", "best regards", "looking forward", "thank you"] },
  { day: "Dia 6", title: "Conversação · Conversation", focus: "Charla libre guiada: hobbies, futuro, sueños, viajes", vocab: ["I think", "I believe", "in the future", "my dream", "because", "that's amazing"] },
  { day: "Dia 7", title: "Revisão · Review + mini examen", focus: "Repasar todo + mini conversación evaluada + siguientes pasos", vocab: ["review", "let's practice", "your progress", "keep going", "well done"] },
];

export class EnglishTutorAgent {
  private dataDir: string;
  private logger: ILogger;
  private metrics: IMetrics;
  private providerFactory: ProviderFactory;
  private progressFile: string;

  constructor(ctx: { dataDir: string; logger: ILogger; metrics: IMetrics }) {
    this.dataDir = ctx.dataDir;
    this.logger = ctx.logger;
    this.metrics = ctx.metrics;
    this.providerFactory = new ProviderFactory();
    this.progressFile = path.join(ctx.dataDir, "tutor-progress.json");
  }

  private detectLang(m: string): TutorLang {
    return /(ol[áa]|obrigado|quero|preciso|est[áa]s|faz|ensina|aprend|portugu)/i.test(m) ? "pt" : "es";
  }

  private detectMode(m: string, inputMode?: TutorMode): TutorMode {
    const modes: TutorMode[] = ["lesson", "chat", "practice", "correct", "pronounce"];
    if (inputMode && modes.includes(inputMode)) return inputMode;
    const t = m.toLowerCase();
    if (/(pron[úu]ncia|pron[úu]nciation|como se dice|como se pronuncia|como se fala)/i.test(t)) return "pronounce";
    if (/(corrige|correction|correct|est[aá] bien|está certo|está correto)/i.test(t)) return "correct";
    if (/(practicar|praticar|practice|conversar|conversa|hablar contigo)/i.test(t)) return "practice";
    if (/(li[çc][ãa]o|lesson|clase|aula|ensina|ense[aá]|aprender|aprende)/i.test(t)) return "lesson";
    return "chat";
  }

  private loadProgress(): Record<string, any> {
    try {
      if (fs.existsSync(this.progressFile)) return JSON.parse(fs.readFileSync(this.progressFile, "utf8"));
    } catch { /* ignore */ }
    return {};
  }

  private saveProgress(p: Record<string, any>): void {
    try {
      const dir = path.dirname(this.progressFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.progressFile, JSON.stringify(p, null, 2), "utf8");
    } catch (e: any) {
      this.logger.error(`[TUTOR] Falha a gravar progresso: ${e.message}`);
    }
  }

  private speakable(text: string): string {
    return text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[*_`#>|]/g, "")
      .replace(/\n{2,}/g, "\n")
      .slice(0, 900);
  }

  private hasSubstance(text: string): boolean {
    const t = text.trim();
    if (t.length < 15) return false;
    const letters = t.replace(/[^a-zA-Z\u00C0-\u00FF]/g, "").length;
    return letters >= 12;
  }

  private async generate(prompt: string, system: string): Promise<{ text: string | null; provider: string; model: string }> {
    const candidates = [
      { id: "openai", key: "OPENAI_API_KEY", model: "gpt-4o-mini" },
      { id: "claude", key: "ANTHROPIC_API_KEY", model: "claude-3-5-haiku-latest" },
      { id: "gemini", key: "GEMINI_API_KEY", model: "gemini-1.5-flash" },
      { id: "grok", key: "XAI_API_KEY", model: "grok-3" },
      { id: "omniroute", key: "", model: "auto/best-reasoning" },
      { id: "ollama", key: "", model: "qwen2.5:3b" },
    ];
    for (const c of candidates) {
      const provider = this.providerFactory.getProvider(c.id as any);
      if (!provider) continue;
      if (c.key && !process.env[c.key]) continue;
      try {
        if (c.id === "ollama" || c.id === "omniroute") {
          const avail = await provider.isAvailable();
          if (!avail) continue;
        }
        const result = await provider.generateResponse({ prompt, systemPrompt: system, temperature: 0.8, maxTokens: 700, modelName: c.model });
        if (result?.text && !result.text.startsWith("[Ollama Mock Response]") && !result.text.startsWith("[Gemini Error Fallback]") && this.hasSubstance(result.text)) {
          return { text: result.text, provider: result.provider, model: result.modelName || c.model };
        }
      } catch { /* try next */ }
    }
    return { text: null, provider: "rule", model: "atlas-fallback" };
  }

  private templateReply(message: string, mode: TutorMode, lang: TutorLang): string {
    const pt = lang === "pt";
    const hi = pt ? "Olá! Sou o ATLAS, teu tutor de inglês." : "¡Hola! Soy ATLAS, tu tutor de inglés.";
    const m = message.trim().toLowerCase();
    const wants = (rx: RegExp) => rx.test(m);
    const lessonFor = (pt ? "Lições de hoje" : "Lecciones de hoy") + `:\n`;
    const prompt = pt
      ? "Para começar, diga em português o que quer aprender: apresentações, negócios, vendas, tecnologia, email ou conversação livre. Eu ensino inglês na hora."
      : "Para empezar, dime en español qué quieres aprender: presentaciones, negocios, ventas, tecnología, email o conversación libre. Yo te enseño inglés al momento.";
    if (wants(/(neg[óo]cio|business|reuni[óo]n|meeting|pre[çc]o|precio|price)/i)) return lessonFor + (pt ? "Frase de negócio de hoje: \"Let's schedule a meeting for tomorrow.\" (Vamos marcar uma reunião para amanhã). Pronuncia: LETS SCHED-yul a MEE-ting for tu-MOR-row. Repete comigo!" : "Frase de negocios de hoy: \"Let's schedule a meeting for tomorrow.\" (Vamos a agendar una reunión para mañana). Pronuncia: LETS SCHED-yul a MEE-ting for tu-MOR-row. ¡Repite conmigo!");
    if (wants(/(venda|venta|sales|cliente|client)/i)) return lessonFor + (pt ? "Vendas: \"Our product saves you time and money.\" (O nosso produto poupa tempo e dinheiro). Pronuncia: OUR PROD-ukt SAVS yu time and MON-ee. Repete!" : "Ventas: \"Our product saves you time and money.\" (Nuestro producto te ahorra tiempo y dinero). Pronuncia: OUR PROD-ukt SAVS yu time and MON-ee. ¡Repite!");
    if (wants(/(tecnol|tech|ia|sistema|sistema|app)/i)) return lessonFor + (pt ? "Tecnologia: \"The system works automatically.\" (O sistema funciona automaticamente). Pronuncia: thuh SIS-tem WURKS au-to-MA-tik-lee. Repete!" : "Tecnología: \"The system works automatically.\" (El sistema funciona automáticamente). Pronuncia: thuh SIS-tem WURKS au-to-MA-tik-lee. ¡Repite!");
    if (wants(/(email|correio|correo|mensagem|mensaje)/i)) return lessonFor + (pt ? "Email: \"Please find attached the proposal.\" (Em anexo a proposta). Pronuncia: PLEEZ faind a-TA-chid thuh pro-PO-zul. Repete!" : "Email: \"Please find attached the proposal.\" (Adjunto la propuesta). Pronuncia: PLEEZ faind a-TA-chid thuh pro-PO-zul. ¡Repite!");
    if (wants(/(apresent|introduc|presentaci[óo]n|name|nome|nombre)/i)) return lessonFor + (pt ? "Apresentações: \"Hi, I'm Pedro. Nice to meet you.\" (Olá, sou o Pedro. Prazer). Pronuncia: HI, aim PEE-dro. NAIS to MEET yu. Repete!" : "Presentaciones: \"Hi, I'm Pedro. Nice to meet you.\" (Hola, soy Pedro. Mucho gusto). Pronuncia: HI, aim PEE-dro. NAIS to MEET yu. ¡Repite!");
    if (mode === "pronounce") return pt ? "Diga a palavra em português/espanhol e eu mostro como se pronuncia em inglês, com fonética simples. Exemplo: 'negócio' → business (BÍZ-ness)." : "Dime la palabra en portugués/español y te muestro cómo se pronuncia en inglés, con fonética simple. Ejemplo: 'negocio' → business (BÍZ-ness).";
    return hi + "\n" + prompt;
  }

  async chat(input: TutorInput): Promise<TutorReply> {
    const sessionId = input.sessionId || `at_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const message = String(input.message || "").trim().slice(0, 1500);
    const lang: TutorLang = input.lang || this.detectLang(message);
    const mode = this.detectMode(message, input.mode);
    const progress = this.loadProgress();
    const step = progress.lessonsDone || 0;

    if (!message) {
      return { sessionId, text: this.templateReply("", mode, lang), provider: "rule", model: "atlas-fallback", mode, lang };
    }

    const system = TUTOR_PERSONA + `\nStudent language: ${lang === "pt" ? "Portuguese" : "Spanish"}. Always explain in ${lang === "pt" ? "Portuguese" : "Spanish"} and teach English. Mode: ${mode}.`;
    const planCtx = DAILY_PLAN.map((d, i) => `${i + 1}. ${d.title} — ${d.focus} — vocab: ${d.vocab.join(", ")}`).join("\n");
    const prompt = [
      `DAILY PLAN:\n${planCtx}\n`,
      `Student is at day ${Math.min(step + 1, 7)} of 7.`,
      `Mode: ${mode}.`,
      `User message: ${message}`,
      `Instructions for ${mode}:`,
      mode === "lesson" ? "- Teach a focused mini-lesson: 1 topic, 3-5 real sentences, phonetics for new words, and a 'repeat after me' line." : "",
      mode === "practice" ? "- Guide a real conversation in English but support in student's language. Ask one simple question in English, then translate and explain." : "",
      mode === "correct" ? "- Correct the student's English errors. Show: what they said, the correct version, why, and a redo." : "",
      mode === "pronounce" ? "- Give the English word/phrase, its phonetic guide (capital letters for stress), and a clear example sentence." : "",
      mode === "chat" ? "- Be a friendly English tutor in a conversation. Answer their question and teach 1 new useful phrase." : "",
      "Format: short, warm, motivating. End with one action question or a 'repeat after me' line.",
    ].filter(Boolean).join("\n");

    const ai = await this.generate(prompt, system);
    const text = this.speakable(ai.text || this.templateReply(message, mode, lang));

    if (mode === "lesson") {
      progress.lessonsDone = step + 1;
      progress.lastLesson = new Date().toISOString();
      this.saveProgress(progress);
    }
    progress.messages = (progress.messages || 0) + 1;
    this.saveProgress(progress);
    this.metrics.inc("tutor_chat_total", { mode, provider: ai.text ? ai.provider : "rule" });
    this.logger.info(`[TUTOR] ${sessionId} mode=${mode} lang=${lang} provider=${ai.text ? ai.provider : "rule"}`);

    return { sessionId, text, provider: ai.text ? ai.provider : "rule", model: ai.text ? ai.model : "atlas-fallback", mode, lang };
  }

  status(): Record<string, any> {
    const progress = this.loadProgress();
    return {
      ok: true,
      name: "ATLAS",
      title: "Tutor de Inglês com voz · English tutor with voice · Tutor de inglés con voz",
      version: "1.0",
      brand: "© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)",
      languages: ["pt", "es"],
      target: "English (fluency)",
      method: "Comprehensible input + daily speaking + immediate correction",
      plan: DAILY_PLAN.map((d) => ({ ...d })),
      progress: { lessonsDone: progress.lessonsDone || 0, messages: progress.messages || 0 },
      voice: { stt: "Web Speech API (browser)", tts: "speechSynthesis (navegador)" },
      modules: ["lesson", "chat", "practice", "correct", "pronounce"],
    };
  }

  plan(): { plan: typeof DAILY_PLAN; progress: Record<string, any> } {
    return { plan: DAILY_PLAN, progress: this.loadProgress() };
  }
}
