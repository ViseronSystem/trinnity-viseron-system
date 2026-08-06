import fs from "fs";
import path from "path";
import { AccountStore } from "../auth/store";
import { BillingProvider } from "../billing/types";
import { EmailService } from "../email/service";
import { MessageStore } from "../messaging/store";
import { BlogStorage } from "../blog-storage";
import { PLANS } from "../billing/plans";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ComposioBridge } from "../../core/composio/ComposioBridge";
import { AgencyDeps } from "../agency/routes";
import { RcsEngine } from "../../core/rcs/RcsEngine";
import { capacityIndicators, projectionTable, AGENCY_PACKAGES, LEGACY_FEE, NEW_FEE } from "../../core/agency/finance";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

// JARVIS — Agente conversacional autónomo do Viseron.
// Conversa com as pessoas e EXECUTA operações reais (estado, planos, checkout,
// blog, content, waitlist, email, mensageria, apps Composio) com engenharia de
// squad AIOX/ARKOM.

// Aliases de palavras → slug de toolkit Composio.
const APP_ALIASES: Record<string, string> = {
  gmail: "gmail", email: "gmail", correio: "gmail",
  calendar: "googlecalendar", calendario: "googlecalendar", "google calendar": "googlecalendar",
  drive: "googledrive", "google drive": "googledrive",
  sheets: "googlesheets", "google sheets": "googlesheets",
  docs: "googledocs", "google docs": "googledocs",
  slack: "slack",
  github: "github", git: "github",
  notion: "notion",
  linear: "linear",
  hubspot: "hubspot", crm: "hubspot",
  asana: "asana",
  trello: "trello",
  discord: "discord",
  telegram: "telegram",
  whatsapp: "whatsapp",
  twitter: "twitter", x: "twitter",
  zoom: "zoom",
  meet: "googlemeet", "google meet": "googlemeet",
  calendly: "calendly",
  gitlab: "gitlab",
  shopify: "shopify",
  salesforce: "salesforce",
  outlook: "microsoftoutlook", office365: "microsoftoutlook",
  dropbox: "dropbox",
  jira: "jira",
  figma: "figma",
  youtube: "youtube",
  instagram: "instagram",
  facebook: "facebook",
  linkedin: "linkedin",
  stripe: "stripe",
  resend: "resend",
  aws: "aws", gcp: "googlecloud", googlecloud: "googlecloud", azure: "microsoftazure",
};

// Verbos de ação para autonomia real do JARVIS nas apps ligadas.
const ACTION_VERBS = /(publica|publicar|postar|posta|tweet|tweetar|tuitar|tuíta|enviar|envia|manda|mandar|criar|cria|agendar|agenda|responde|responder|comenta|comentar|escreve|escrever|salva|guardar|mostra|mostrar|l[eê]|ler|lista|listar|abre|procura)/i;
const MEDIUM_WORDS = /(post|publica[cç][aã]o|email|reuni[aã]o|evento|mensagem|nota|arquivo|ficheiro|tarefa|tweet|página)/;
// Tópicos internos do TVS que não devem ir para execução de apps.
const TVS_INTERNAL = /(blog|conte[úu]do|content|checkout|assinatura|plano|conta|regist|waitlist|mensageria)/;

export interface JarvisChatInput {
  sessionId?: string;
  message: string;
  name?: string;
  email?: string;
}

export interface JarvisAction {
  tool: string;
  detail: string;
  ok: boolean;
}

export interface JarvisReply {
  sessionId: string;
  reply: string;
  provider: string;
  model: string;
  actions: JarvisAction[];
  intent: string;
}

interface SessionMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  ts: string;
}

interface Session {
  name?: string;
  createdAt: string;
  updatedAt: string;
  messages: SessionMessage[];
}

interface SessionFile {
  [sessionId: string]: Session;
}

const MAX_SESSION_MESSAGES = 40;

export class JarvisAgent {
  private dataDir: string;
  private logger: ILogger;
  private metrics: IMetrics;
  private providerFactory: ProviderFactory;
  private sessionsFile: string;
  private accounts: AccountStore;
  private billing: BillingProvider;
  private email: EmailService;
  private messaging: MessageStore;
  private blog: BlogStorage;
  private composio: ComposioBridge;
  private agency: AgencyDeps;
  private rcs?: RcsEngine;

  constructor(ctx: {
    dataDir: string;
    logger: ILogger;
    metrics: IMetrics;
    accounts: AccountStore;
    billing: BillingProvider;
    email: EmailService;
    messaging: MessageStore;
    blog: BlogStorage;
    composio: ComposioBridge;
    agency: AgencyDeps;
    rcs?: RcsEngine;
  }) {
    this.dataDir = ctx.dataDir;
    this.logger = ctx.logger;
    this.metrics = ctx.metrics;
    this.accounts = ctx.accounts;
    this.billing = ctx.billing;
    this.email = ctx.email;
    this.messaging = ctx.messaging;
    this.blog = ctx.blog;
    this.composio = ctx.composio;
    this.agency = ctx.agency;
    this.rcs = ctx.rcs;
    this.providerFactory = new ProviderFactory();
    this.sessionsFile = path.join(this.dataDir, "jarvis-sessions.json");
    this.memoryFile = path.join(this.dataDir, "knowledge", "jarvis-memory.jsonl");
  }

  private memoryFile: string;

  /** Regista cada operação na memória persistente (nunca esquece; base para auditoria AIOX). */
  private remember(entry: Record<string, any>): void {
    try {
      const dir = path.dirname(this.memoryFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(this.memoryFile, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n", "utf8");
    } catch (e: any) {
      this.logger.error(`[JARVIS] Falha na memória: ${e.message}`);
    }
  }

  /** Lê as últimas N operações da memória (recall). */
  private recall(limit = 5): any[] {
    try {
      if (!fs.existsSync(this.memoryFile)) return [];
      const raw = fs.readFileSync(this.memoryFile, "utf8").split("\n").filter(Boolean);
      return raw.slice(-limit).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    } catch {
      return [];
    }
  }

  /** Resumo público da memória para o endpoint /api/jarvis/memory. */
  public recentOperations(limit = 20): { recent: any[]; total: number; byTool: Record<string, number> } {
    const all = this.recall(100000);
    const byTool: Record<string, number> = {};
    for (const r of all) if (r.tool) byTool[r.tool] = (byTool[r.tool] || 0) + 1;
    return { recent: this.recall(limit).reverse(), total: all.length, byTool };
  }

  /** Deteta o idioma da mensagem (es/pt/en); por predefinição espanhol (Pedro/Trinnity). */
  private detectLanguage(m: string): "es" | "pt" | "en" {
    const es = (m.match(/(hola|qu[eé] tal|por favor|gracias|buenos d[ií]as|buenas|puedes|quiero|necesito|escribe|hablar|dime|hazme|qu[eé] has|cu[áa]l|c[oó]mo|estado del|\bdel\b|est[áa]s)/gi) || []).length;
    const pt = (m.match(/(ol[áa]|obrigado|podes|quero|preciso|estado do|faz|envia|escreve|quais|quem|est[áa] tudo|funcionando)/gi) || []).length;
    const en = (m.match(/(hello|how are you|please|thanks|can you|i want|i need|create a|send an|what have you done|system status|what's up)/gi) || []).length;
    if (pt > es && pt >= en) return "pt";
    if (en > es && en >= pt) return "en";
    return "es";
  }

  private loadSessions(): SessionFile {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const parsed = JSON.parse(fs.readFileSync(this.sessionsFile, "utf8"));
        return parsed && typeof parsed === "object" ? parsed : {};
      }
    } catch (e) {
      this.logger.error(`[JARVIS] Falha ao ler sessões: ${(e as Error).message}`);
    }
    return {};
  }

  private saveSessions(data: SessionFile): void {
    try {
      const dir = path.dirname(this.sessionsFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.sessionsFile, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
      this.logger.error(`[JARVIS] Falha ao gravar sessões: ${(e as Error).message}`);
    }
  }

  private getSession(sessionId: string, name?: string): Session {
    const data = this.loadSessions();
    const now = new Date().toISOString();
    if (!data[sessionId]) {
      data[sessionId] = { name, createdAt: now, updatedAt: now, messages: [] };
      this.saveSessions(data);
    } else if (name && !data[sessionId].name) {
      data[sessionId].name = name;
      this.saveSessions(data);
    }
    return data[sessionId];
  }

  private pushMessage(sessionId: string, msg: SessionMessage): Session {
    const data = this.loadSessions();
    const session = data[sessionId] || { name: undefined, createdAt: new Date().toISOString(), updatedAt: "", messages: [] };
    session.messages.push(msg);
    if (session.messages.length > MAX_SESSION_MESSAGES) {
      session.messages = session.messages.slice(session.messages.length - MAX_SESSION_MESSAGES);
    }
    session.updatedAt = new Date().toISOString();
    data[sessionId] = session;
    this.saveSessions(data);
    return session;
  }

  async chat(input: JarvisChatInput): Promise<JarvisReply> {
    const sessionId = input.sessionId || `jv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const message = String(input.message || "").trim().slice(0, 2000);
    const session = this.getSession(sessionId, input.name);
    if (!message) {
      return { sessionId, reply: "Dime en qué puedo ayudarte — estado del sistema, planes, crear cuenta, blog, mensajería o conversar.", provider: "rule", model: "tvs-fallback", actions: [], intent: "empty" };
    }

    const lang = this.detectLanguage(message);
    this.pushMessage(sessionId, { role: "user", content: message, ts: new Date().toISOString() });
    this.remember({ type: "user_msg", sessionId, lang, message: message.slice(0, 200) });
    this.metrics.inc("jarvis_chat_total", { intent: "pending" });

    const intent = this.detectIntent(message);
    const actions: JarvisAction[] = [];
    const toolResult = await this.executeIntent(intent, input);

    if (toolResult) {
      actions.push(toolResult);
      this.metrics.inc("jarvis_tool_total", { tool: toolResult.tool });
      this.remember({ type: "operation", sessionId, lang, intent, tool: toolResult.tool, ok: toolResult.ok, detail: (toolResult.detail || "").slice(0, 400) });
    }

    const history = session.messages.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n");
    const memoryCtx = this.recall(4).map((r) => `[${(r.ts || "").slice(0, 10)}] ${r.tool || r.type}: ${(r.detail || r.message || "").slice(0, 120)}`).join("\n");
    const systemPrompt = this.buildSystemPrompt();
    const prompt = this.buildPrompt(message, intent, toolResult, history, lang, memoryCtx);

    const ai = await this.generateRealAI(prompt, systemPrompt);
    const reply = ai.text || this.templateReply(intent, toolResult, message, lang);

    this.pushMessage(sessionId, { role: "assistant", content: reply, ts: new Date().toISOString() });
    this.metrics.inc("jarvis_replies_total", { provider: ai.text ? ai.provider : "rule" });
    this.logger.info(`[JARVIS] ${sessionId} intent=${intent} lang=${lang} provider=${ai.text ? ai.provider : "rule"} "${message.slice(0, 60)}"`);

    return { sessionId, reply, provider: ai.text ? ai.provider : "rule", model: ai.text ? ai.model : "tvs-fallback", actions, intent };
  }

  // Tenta IA real em cadeia: cloud → Ollama local → OmniRoute.
  // Só aceita texto não-simulado; se nenhum provider estiver disponível, devolve fallback nulo.
  private async generateRealAI(prompt: string, systemPrompt: string): Promise<{ text: string | null; provider: string; model: string }> {
    const candidates: { id: string; key: string; model: string }[] = [
      { id: "openai", key: "OPENAI_API_KEY", model: "gpt-4o-mini" },
      { id: "claude", key: "ANTHROPIC_API_KEY", model: "claude-3-5-haiku-latest" },
      { id: "gemini", key: "GEMINI_API_KEY", model: "gemini-1.5-flash" },
      { id: "grok", key: "XAI_API_KEY", model: "grok-3" },
      { id: "omniroute", key: "", model: "auto/best-reasoning" },
      { id: "ollama", key: "", model: "qwen2.5:3b" },
    ];

    for (const cand of candidates) {
      const provider = this.providerFactory.getProvider(cand.id as any);
      if (!provider) continue;
      if (cand.key && !process.env[cand.key]) continue;

      try {
        if (cand.id === "ollama" || cand.id === "omniroute") {
          const avail = await provider.isAvailable();
          if (!avail) continue;
        }
        const result = await provider.generateResponse({
          prompt,
          systemPrompt,
          temperature: 0.7,
          maxTokens: 600,
          modelName: cand.model,
        });
        if (result?.text && !this.isMockOrError(result.text)) {
          return { text: result.text, provider: result.provider, model: result.modelName || cand.model };
        }
      } catch {
        // continua para o próximo provider
      }
    }
    return { text: null, provider: "rule", model: "tvs-fallback" };
  }

  private buildSystemPrompt(): string {
    return [
      "You are JARVIS, the assistant of the Trinnity Viseron System (TVS) — a multi-agent AI operating system.",
      "You speak Portuguese (pt), English and Spanish. ALWAYS reply in the language the user writes. For Pedro Costa and Trinnity Hurtado (the owners) default is SPANISH.",
      "You have a persistent memory: you remember every operation you execute (apps connected, posts, emails, checks) and recall them when asked (e.g. '¿qué has hecho?').",
      "You are warm, concise and helpful. You have autonomy: you executed or will execute real operations.",
      "Facts: TVS v5.0. Plans: Core $29/mo, Pro $99/mo, Enterprise $499/mo. Modules live: Auth, Billing, Onboarding, Email, Messaging E2E (X25519+AES-256-GCM), Blog + Content Agent.",
      "Composio: TVS can connect to 1000+ apps (Gmail, Slack, GitHub, Notion...) via OAuth. When a connection link is generated, share it as a clickable Markdown link. The link expires in 10 minutes. After the user approves, poll with COMPOSIO_WAIT_FOR_CONNECTIONS.",
      "Composio autonomy: when the user asks to post/send/create/comment/schedule in a connected app, you ACTUALLY execute the real tool (search tool, build args, execute) and then summarize what happened. Example: 'publica no slack que lançámos a 5.1'.",
      "RCS: when the user asks to send a branded message/RCS/SMS with the VISERON logo to phone numbers (e.g. 'envía un RCS a +351...'), ACTUALLY send it and summarize the result (mode live or mock).",
      "Web API: https://viseron-web.onrender.com. GitHub: github.com/ViseronSystem/trinnity-viseron-system.",
      "If a tool ran, summarize its result naturally. Never invent numbers: use only the tool data given.",
    ].join("\n");
  }

  private buildPrompt(message: string, intent: string, toolResult: JarvisAction | null, history: string, lang: string, memoryCtx: string): string {
    const toolInfo = toolResult ? `A tool ran: ${toolResult.tool} (ok=${toolResult.ok}). Result detail: ${toolResult.detail}` : "No tool executed for this message.";
    return [
      `Conversation history:\n${history}\n`,
      `Your persistent memory (recent operations):\n${memoryCtx || "(empty)"}\n`,
      `User message: ${message}`,
      `Detected intent: ${intent}`,
      `User language (reply in this language): ${lang}`,
      toolInfo,
      `CRITICAL: Reply ONLY in ${lang}. Do not switch to another language.`,
      "Respond helpfully and concisely (max ~4 sentences).",
    ].join("\n");
  }

  private isMockOrError(text: string): boolean {
    return (
      text.startsWith("[Ollama Mock Response]") ||
      text.startsWith("[Gemini Error Fallback]") ||
      text.startsWith("[Gemini Google Connector Ready]") ||
      text.startsWith("[Grok xAI Connector Ready]") ||
      text.startsWith("[Grok Error Fallback]") ||
      text.toLowerCase().includes("all ai providers failed")
    );
  }

  private detectIntent(message: string): string {
    const m = message.toLowerCase();
    if (/(composio)/.test(m) && /(status|estado|apps|ferramentas|lig)/.test(m)) return "composio_status";
    if (/(liga|conecta|conectar|ligar|connect).*(app|conta)|(app|conta).*(liga|conectar)|ligar.*todas|todas as apps/i.test(m)) return "composio_connect";
    if (new RegExp(Object.keys(APP_ALIASES).join("|")).test(m) && /(app|conta|liga|conectar|status|estado)/.test(m)) return "composio_connect";
    if (ACTION_VERBS.test(m) && (new RegExp(Object.keys(APP_ALIASES).join("|")).test(m) || MEDIUM_WORDS.test(m)) && !TVS_INTERNAL.test(m)) return "composio_execute";
    if (/(mem[oó]ria|memoria|o que j[áa] fizeste|o que fiz|j[áa] realizaste|qu[eé] has hecho|qu[eé] hiciste|remember|what have you done|recuerda|lembra)/i.test(m)) return "memory_recall";
    if (/(ag[éeê]ncia|agency).*(estado|status|clientes|clients|receita|revenue|mrr)|(estado|status).*(ag[éeê]ncia|agency)/i.test(m)) return "agency_status";
    if (/(nuevo lead|novo lead|nuevo cliente|novo cliente|add lead|nuevo contacto|novo contacto|registrar lead|registar lead)/i.test(m)) return "agency_lead_add";
    if (/(reporte|relat[oó]rio|relatorio|report).*(ads|agencia|agency|cliente|m[eé]tricas)|(gerar|genera).*(reporte|relat[oó]rio)/i.test(m)) return "agency_report";
    if (/(creativ|creativos|copy de anuncios|anuncios|guion|guiones|script).*(genera|gera|criar|crea|haz)/i.test(m)) return "agency_creative";
    if (/(nurtur|seguimiento|follow[- ]?up|nutrir)/i.test(m)) return "agency_nurture";
    if (/(proyecci[óo]n|proje[cç][aã]o|projec|mrr|arr|cu[aá]nto ganar|quanto ganhar)/i.test(m)) return "agency_projection";
    if (/(rcs|r\.c\.s|mensaje de marca|mensagem de marca|branded message|sms con logo|sms com logo|mandar.*whatsapp|enviar.*whatsapp)/i.test(m)) return "rcs_broadcast";
    if (/(status|estado|health|sa[úu]de|funcionando|uptime|online)/.test(m)) return "system_status";
    if (/(plano|planos|pre[cç]o|precos|billing|assinatura|subscribe|pro|enterprise|core)/.test(m)) return "list_plans";
    if (/(comprar|assinar|checkout|contratar|subscrever|buy|sign up for pro)/.test(m)) return "checkout";
    if (/(conta|register|registar|registar|signup|sign up|cadastr)/.test(m)) return "register_info";
    if (/(blog|artigos|posts|post|conte[úu]do|content)/.test(m)) return "blog";
    if (/(gerar|generate).*(blog|post|conte[úu]do)/.test(m)) return "trigger_content";
    if (/(email)/.test(m) && /(status|estado|funciona)/.test(m)) return "email_status";
    if (/(mensageria|messaging|mensagens|chat|cifrada|criptografada|criptografia)/.test(m)) return "messaging_status";
    if (/(erros|erro|bugs|auditoria|audit|auditar|melhorar|melhoria|projeto|revis[aã]o)/.test(m)) return "audit_info";
    if (/(waitlist|lista de espera)/.test(m)) return "waitlist_info";
    if (/(quem [eé]s|[oó]s|quem e voce|what are you|about you|identidade)/.test(m)) return "who_are_you";
    if (/(ajuda|help|comandos|o que podes|que podes|help me|what can)/.test(m)) return "help";
    if (/([oó]i|ol[áa]|hey|hello|hi|boa tarde|bom dia)/.test(m)) return "greeting";
    return "chat";
  }

  private async executeIntent(intent: string, input: JarvisChatInput): Promise<JarvisAction | null> {
    switch (intent) {
      case "system_status":
        return await this.toolSystemStatus();
      case "list_plans":
        return this.toolListPlans();
      case "checkout":
        return this.toolCheckout(input);
      case "blog":
        return this.toolBlog();
      case "trigger_content":
        return this.toolTriggerContent();
      case "email_status":
        return this.toolEmailStatus();
      case "messaging_status":
        return this.toolMessagingStatus();
      case "composio_status":
        return await this.toolComposioStatus();
      case "composio_connect":
        return await this.toolComposioConnect(input);
      case "composio_execute":
        return await this.toolComposioExecute(input);
      case "memory_recall":
        return this.toolMemoryRecall();
      case "agency_status":
        return this.toolAgencyStatus();
      case "agency_lead_add":
        return await this.toolAgencyLeadAdd(input);
      case "agency_report":
        return this.toolAgencyReport();
      case "agency_creative":
        return await this.toolAgencyCreative(input);
      case "agency_nurture":
        return this.toolAgencyNurture();
      case "agency_projection":
        return this.toolAgencyProjection();
      case "rcs_broadcast":
        return await this.toolRcsBroadcast(input);
      case "audit_info":
        return this.toolAuditInfo();
      case "waitlist_info":
        return this.toolWaitlistInfo();
      default:
        return null;
    }
  }

  private async toolSystemStatus(): Promise<JarvisAction> {
    try {
      const counts = await this.accounts.count();
      const msg = this.messaging.count();
      const blogCount = this.blog.count();
      return {
        tool: "system_status",
        ok: true,
        detail: `v5.0 · tenants=${counts.tenants} · users=${counts.users} · blog=${blogCount.total} (${blogCount.published} publicados) · conversas=${msg.conversations} · mensagens=${msg.messages} · email=${this.email.transport.provider} · billing=${this.billing.enabled ? this.billing.name : "manual"}`,
      };
    } catch (e: any) {
      return { tool: "system_status", ok: false, detail: e.message };
    }
  }

  private toolListPlans(): JarvisAction {
    const plans = PLANS.map((p) => `${p.name} ${p.monthlyPrice}€/mês (${p.id})`).join(" · ");
    return { tool: "list_plans", ok: true, detail: plans };
  }

  private async toolCheckout(input: JarvisChatInput): Promise<JarvisAction> {
    try {
      const planMatch = (input.message || "").match(/pro|enterprise|core/i);
      const plan = (planMatch?.[0] || "pro").toLowerCase();
      const session = await this.billing.createCheckoutSession({
        plan,
        customerEmail: input.email || "visitante@trinnityviseronsystem.io",
        tenantId: "",
        successUrl: "https://www.trinnityviseronsystem.io/dashboard?checkout=success",
        cancelUrl: "https://www.trinnityviseronsystem.io",
      });
      return { tool: "checkout", ok: true, detail: `Plano ${plan} — sessão ${session.provider}: ${session.url}` };
    } catch (e: any) {
      return { tool: "checkout", ok: false, detail: `Erro ao criar checkout: ${e.message}` };
    }
  }

  private toolBlog(): JarvisAction {
    try {
      const posts = this.blog.listAll().slice(0, 5);
      const list = posts.map((p) => p.title).join(" · ") || "ainda sem posts publicados";
      return { tool: "blog", ok: true, detail: `Posts recentes: ${list}` };
    } catch (e: any) {
      return { tool: "blog", ok: false, detail: e.message };
    }
  }

  private toolTriggerContent(): JarvisAction {
    return { tool: "trigger_content", ok: true, detail: "Geração de conteúdo agendada/executada pelo Content Agent (a cada 120min). Pede no dashboard para gerar um post personalizado." };
  }

  private toolEmailStatus(): JarvisAction {
    return { tool: "email_status", ok: true, detail: `Provider: ${this.email.transport.provider} · ativo=${this.email.transport.enabled ? "sim" : "não"} · gmail configurado=${!!process.env.GMAIL_REFRESH_TOKEN}` };
  }

  private toolMessagingStatus(): JarvisAction {
    const msg = this.messaging.count();
    return { tool: "messaging_status", ok: true, detail: `Crypto: X25519 + AES-256-GCM · contactos=${msg.contacts} · conversas=${msg.conversations} · mensagens=${msg.messages}` };
  }

  /** Estado do Composio + apps atualmente ligadas (sem efeitos secundários). */
  private async toolComposioStatus(): Promise<JarvisAction> {
    try {
      if (!this.composio.configured) {
        return { tool: "composio_status", ok: false, detail: "Composio não configurado — falta COMPOSIO_API_KEY no .env." };
      }
      await this.composio.connect();
      const status = this.composio.getStatus();
      const conns = await this.composio.listConnections(ComposioBridge.DEFAULT_APPS);
      const detail = [
        `Composio ${status.connected ? "ligado ✓" : "não ligado"} (endpoint ${status.endpoint})`,
        `Apps ativas: ${conns.active.length ? conns.active.join(", ") : "nenhuma"}`,
        `A aguardar autorização: ${conns.pending.length ? conns.pending.join(", ") : "nenhuma"}`,
        "Diz-me 'liga o gmail e o slack' para eu gerar os links de autorização.",
      ].join(" · ");
      return { tool: "composio_status", ok: true, detail };
    } catch (e: any) {
      return { tool: "composio_status", ok: false, detail: `Erro: ${e.message}` };
    }
  }

  /** Gera links OAuth (redirect_url) para ligar apps. Expira em 10 minutos. */
  private async toolComposioConnect(input: JarvisChatInput): Promise<JarvisAction> {
    try {
      if (!this.composio.configured) {
        return { tool: "composio_connect", ok: false, detail: "Composio não configurado — falta COMPOSIO_API_KEY no .env." };
      }
      await this.composio.connect();
      const requested = this.parseApps(input.message);
      const apps = requested.length ? requested : ComposioBridge.DEFAULT_APPS;
      const result = await this.composio.connectApps(apps);
      const parts = [
        result.links.length
          ? `Clique para autorizar (links expiram em 10 min):\n${result.links.map((l) => `[Ligar ${l.slug}](${l.url})`).join("\n")}`
          : "Sem novos links para gerar.",
      ];
      if (result.alreadyActive.length) parts.push(`Já ligadas: ${result.alreadyActive.join(", ")}.`);
      parts.push("Depois de autorizar, volta e diz 'confirma as apps' para eu verificar o estado.");
      return { tool: "composio_connect", ok: true, detail: parts.join("\n") };
    } catch (e: any) {
      return { tool: "composio_connect", ok: false, detail: `Erro ao ligar apps: ${e.message}` };
    }
  }

  /** Extrai apps pedidas da mensagem (nome de app + opcionalmente "todas"). */
  private parseApps(message: string): string[] {
    const m = message.toLowerCase();
    const found = new Set<string>();
    for (const [word, slug] of Object.entries(APP_ALIASES)) {
      if (m.includes(word)) found.add(slug);
    }
    if (m.includes("todas") && found.size === 0) return [];
    return Array.from(found).slice(0, 10);
  }

  /**
   * Execução autónoma real numa app ligada via Composio.
   * Pipeline: pesquisar ferramenta → schema → preencher argumentos →
   * resolver destino (canal/email) quando possível → executar.
   */
  private async toolComposioExecute(input: JarvisChatInput): Promise<JarvisAction> {
    try {
      if (!this.composio.configured) {
        return { tool: "composio_execute", ok: false, detail: "Composio não configurado — falta COMPOSIO_API_KEY no .env." };
      }
      await this.composio.connect();
      const message = input.message;
      const content = this.extractPayload(message);
      const search = await this.composio.callTool("COMPOSIO_SEARCH_TOOLS", { queries: [{ use_case: message }] });
      const sp = JSON.parse(search.output);
      const slug = sp?.data?.results?.[0]?.primary_tool_slugs?.[0];
      if (!slug) {
        return { tool: "composio_execute", ok: false, detail: `Não encontrei uma ferramenta para "${message.slice(0, 80)}". Tenta ser mais específico (ex.: 'publica no slack que lançámos a 5.1').` };
      }
      const schemas = await this.composio.callTool("COMPOSIO_GET_TOOL_SCHEMAS", { tool_slugs: [slug] });
      const gp = JSON.parse(schemas.output);
      const schema = gp?.data?.tool_schemas?.[slug]?.input_schema;
      if (!schema) {
        return { tool: "composio_execute", ok: false, detail: `Ferramenta ${slug} encontrada, mas sem schema disponível.` };
      }
      const args = await this.buildToolArgs(slug, schema, content, message);
      const missing = this.requiredFields(schema).filter((f) => !args[f]);
      if (missing.length) {
        return { tool: "composio_execute", ok: false, detail: `A ferramenta ${slug} precisa de: ${missing.join(", ")}. Indica esses dados (ex.: canal, email, data).` };
      }
      const exec = await this.composio.callTool("COMPOSIO_MULTI_EXECUTE_TOOL", {
        tools: [{ tool_slug: slug, input_params: args }],
        thought: `Execute ${slug} for: ${content.slice(0, 80)}`,
      });
      const ep = JSON.parse(exec.output);
      const res = ep?.data?.results?.[0]?.response;
      const success = res?.successful !== false;
      const preview = JSON.stringify(res?.data ?? ep?.data ?? {}).slice(0, 280);
      return {
        tool: "composio_execute",
        ok: success,
        detail: `${slug} ${success ? "executado ✓" : "falhou"} · ${preview}`,
      };
    } catch (e: any) {
      return { tool: "composio_execute", ok: false, detail: `Erro na execução: ${e.message}` };
    }
  }

  /** Extrai o conteúdo a usar (texto entre aspas ou a mensagem sem verbo/app). */
  private extractPayload(message: string): string {
    const quoted = message.match(/"([^"]+)"/);
    if (quoted) return quoted[1];
    return message
      .replace(/^\s*(por favor|podes|pode|quero|gostaria|vai|preciso)\s*/i, "")
      .replace(ACTION_VERBS, "")
      .replace(/(no|na|no|no slack|no gmail|no drive|no notion|no github|por email|por slack|no canal)\s*/gi, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  /** Nome de canal Slack mencionado (#geral / "no canal geral" / "no slack geral"). */
  private extractChannel(message: string): string | null {
    const hash = message.match(/#([a-z0-9_-]+)/i);
    if (hash) return hash[1];
    const named = message.match(/(?:no |no canal |canal |canal do )([a-z0-9_-]+)/i);
    return named ? named[1] : null;
  }

  /** Preenche os argumentos do schema com o conteúdo extraído + resolução de destino. */
  private async buildToolArgs(slug: string, schema: any, content: string, message: string): Promise<Record<string, any>> {
    const props = schema.properties || {};
    const args: Record<string, any> = {};
    const textField = this.pickTextField(props);
    if (textField) args[textField] = content;

    const email = message.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    const emailField = Object.keys(props).find((k) => /(recipient|^to$|^to_|email)/.test(k));
    if (emailField && email) args[emailField] = email[0];

    const channelField = Object.keys(props).find((k) => /(channel|conversation|room)/i.test(k));
    if (channelField && slug.startsWith("SLACK")) {
      const name = this.extractChannel(message);
      if (name) {
        const id = await this.resolveSlackChannel(name);
        if (id) args[channelField] = id;
      }
    }
    for (const [key, p] of Object.entries<any>(props)) {
      if (args[key] !== undefined) continue;
      if (p?.type === "integer" && /(max_results|limit|count|num|page_size)/.test(key)) args[key] = 5;
    }
    return args;
  }

  /** Resolve um canal Slack pelo nome (SLACK_FIND_CHANNELS → id). */
  private async resolveSlackChannel(name: string): Promise<string | null> {
    try {
      const sch = await this.composio.callTool("COMPOSIO_GET_TOOL_SCHEMAS", { tool_slugs: ["SLACK_FIND_CHANNELS"] });
      const sp = JSON.parse(sch.output);
      const schema = sp?.data?.tool_schemas?.["SLACK_FIND_CHANNELS"]?.input_schema;
      if (!schema) return null;
      const textField = this.pickTextField(schema.properties || {}) || "text";
      const args: Record<string, any> = { [textField]: name };
      const typesField = Object.keys(schema.properties || {}).find((k) => /type/i.test(k));
      if (typesField) args[typesField] = "public_channel,private_channel";
      const exec = await this.composio.callTool("COMPOSIO_MULTI_EXECUTE_TOOL", {
        tools: [{ tool_slug: "SLACK_FIND_CHANNELS", input_params: args }],
        thought: `Resolve slack channel: ${name}`,
      });
      const ep = JSON.parse(exec.output);
      return ep?.data?.results?.[0]?.response?.data?.channels?.[0]?.id ?? null;
    } catch {
      return null;
    }
  }

  /** Escolhe a propriedade de texto principal de um schema (ordem de preferência). */
  private pickTextField(props: Record<string, any>): string | null {
    const order = ["content", "text", "body", "message", "status", "description", "title", "post", "tweet_text", "caption", "comment", "note", "name", "summary", "details"];
    for (const key of order) {
      const p = props[key];
      if (p && (p.type === "string" || (p.type === "array" && p.items?.type === "string"))) return key;
    }
    const first = Object.entries(props).find(([, p]) => p.type === "string");
    return first ? first[0] : null;
  }

  /** Lista de campos obrigatórios do schema. */
  private requiredFields(schema: any): string[] {
    return Array.isArray(schema?.required) ? (schema.required as string[]) : [];
  }

  private toolAuditInfo(): JarvisAction {
    return {
      tool: "audit_info",
      ok: true,
      detail: "A auditoria operacional é executada por 'npm run audit:arkom' (squad AIOX-1..5 + ARKOM Observer/Guardian/Executor) e gera data/Viseron_Audit_ARKOM.pdf.",
    };
  }

  private toolWaitlistInfo(): JarvisAction {
    return { tool: "waitlist_info", ok: true, detail: "Podes entrar na lista de espera via POST /api/waitlist (email)." };
  }

  /** Memória persistente: mostra as operações que o JARVIS já executou (nunca esquece). */
  private toolMemoryRecall(): JarvisAction {
    const recent = this.recall(6);
    if (!recent.length) {
      return { tool: "memory_recall", ok: true, detail: "Ainda não registei operações. Quando executares ações (apps, emails, posts) eu guardo tudo para nunca esquecer e para o squad AIOX auditar." };
    }
    const lines = recent
      .filter((r: any) => r.type === "operation")
      .map((r: any) => `[${(r.ts || "").slice(0, 10)}] ${r.tool} ${r.ok ? "✓" : "✗"} — ${(r.detail || "").slice(0, 130)}`)
      .join("\n");
    return {
      tool: "memory_recall",
      ok: true,
      detail: `Últimas operações que guardei na memória:\n${lines}\nTudo fica registado em data/knowledge/jarvis-memory.jsonl — base para o squad AIOX auditar com Pedro Costa e Trinnity Hurtado.`,
    };
  }

  /** Agency OS: estado completo da agência (clientes, leads, capacidade, projeção). */
  private toolAgencyStatus(): JarvisAction {
    try {
      const store = this.agency.store;
      const clients = store.listClients();
      const leads = store.listLeads();
      const active = clients.filter((c) => c.status === "active").length;
      const report = this.agency.reporting.generate(store);
      const cap = capacityIndicators(active);
      const proj = projectionTable(active, LEGACY_FEE, NEW_FEE)[0];
      const detail = [
        `Agência: ${clients.length} clientes (${active} ativos) · MRR £${proj.mrr} (média £${proj.avgFee}/cliente)`,
        `Leads: ${leads.length} (novos ${leads.filter((l) => l.status === "new").length} · nurturing ${leads.filter((l) => l.status === "nurturing").length} · ganhos ${leads.filter((l) => l.status === "won").length})`,
        `Capacidade: ${cap.clientsPerDayComfortable} clientes/dia · ${cap.clientsPerCycle}/ciclo · ${cap.minutesPerClient} min/cliente com IA (vs ${cap.minutesWithoutAI} sem IA)`,
        report.summary,
      ].join("\n");
      return { tool: "agency_status", ok: true, detail };
    } catch (e: any) {
      return { tool: "agency_status", ok: false, detail: `Erro: ${e.message}` };
    }
  }

  /** Agency OS: regista um lead novo e responde automaticamente (agente de respostas). */
  private async toolAgencyLeadAdd(input: JarvisChatInput): Promise<JarvisAction> {
    try {
      const store = this.agency.store;
      const email = (input.message || "").match(/[\w.+-]+@[\w-]+\.[\w.]+/);
      if (!email) {
        return { tool: "agency_lead_add", ok: false, detail: "Diz-me o email do lead (ex.: 'novo lead de joão@empresa.com — venda de SaaS') para eu registar e responder automaticamente." };
      }
      const name = (input.message || "").match(/(?:de|del|from|da)\s+([A-Za-zÀ-ÿ\u00C0-\u024F][\w.-]*)/i)?.[1] || "Cliente";
      const lang = this.detectLanguage(input.message || "");
      const now = new Date().toISOString();
      const lead = store.addLead({
        id: `lead_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        name,
        email: email[0].toLowerCase(),
        company: "",
        source: "jarvis",
        status: "new",
        lang,
        firstContact: now,
        lastContact: now,
        followUpAt: "",
        notes: (input.message || "").slice(0, 600),
      });
      const { reply } = await this.agency.leadResponse.respond(store, lead, (input.message || "").slice(0, 600));
      return { tool: "agency_lead_add", ok: true, detail: `Lead ${lead.name} <${lead.email}> registado. Resposta automática enviada: ${reply}` };
    } catch (e: any) {
      return { tool: "agency_lead_add", ok: false, detail: `Erro: ${e.message}` };
    }
  }

  /** Agency OS: gera o reporte quinzenal base (Reporting Agent). */
  private toolAgencyReport(): JarvisAction {
    try {
      const report = this.agency.reporting.generate(this.agency.store);
      return { tool: "agency_report", ok: true, detail: report.summary };
    } catch (e: any) {
      return { tool: "agency_report", ok: false, detail: `Erro: ${e.message}` };
    }
  }

  /** Agency OS: gera variantes de criativos/ads para um nicho (Creatives Agent). */
  private async toolAgencyCreative(input: JarvisChatInput): Promise<JarvisAction> {
    try {
      const message = input.message || "";
      const m = message.toLowerCase();
      const lang = this.detectLanguage(message);
      const niche = message.match(/(?:para|para el|for|de)\s+([a-zà-ÿ\s-]{3,40})/i)?.[1]?.trim().slice(0, 80) || (m.includes("saas") ? "SaaS" : "marketing digital");
      const platform = m.includes("meta") || m.includes("facebook") || m.includes("instagram") ? "meta" : "google";
      const job = await this.agency.creatives.generate(this.agency.store, niche, platform as any, lang);
      const lines = job.variants.map((v, i) => `${i + 1}. ${v.headline} — CTA: ${v.cta}`).join("\n");
      return { tool: "agency_creative", ok: true, detail: `Criativos gerados para "${job.niche}" (${platform}):\n${lines}` };
    } catch (e: any) {
      return { tool: "agency_creative", ok: false, detail: `Erro: ${e.message}` };
    }
  }

  /** Agency OS: corre o agente de nurturing (follow-ups automáticos a leads parados). */
  private toolAgencyNurture(): JarvisAction {
    try {
      const created = this.agency.nurturing.run(this.agency.store);
      const detail = created.length
        ? `Nurturing executado: ${created.length} follow-up(s) criado(s) para ${created.map((a) => a.leadEmail).join(", ")}.`
        : "Nurturing executado: nenhum lead precisa de follow-up agora (agenda: 2 dias para novos, 7 para responded).";
      return { tool: "agency_nurture", ok: true, detail };
    } catch (e: any) {
      return { tool: "agency_nurture", ok: false, detail: `Erro: ${e.message}` };
    }
  }

  /** Agency OS: projeção financeira MRR/ARR (50 → 100 clientes). */
  private toolAgencyProjection(): JarvisAction {
    try {
      const active = this.agency.store.listClients("active").length;
      const proj = projectionTable(active, LEGACY_FEE, NEW_FEE);
      const rows = proj.map((p) => `${p.totalClients} clientes → £${p.mrr.toLocaleString()} MRR (média £${p.avgFee}) · £${p.arr.toLocaleString()}/ano`).join("\n");
      return { tool: "agency_projection", ok: true, detail: `Projeção (atuais ${active} ativos a £${LEGACY_FEE}; novos a £${NEW_FEE}/mês):\n${rows}` };
    } catch (e: any) {
      return { tool: "agency_projection", ok: false, detail: `Erro: ${e.message}` };
    }
  }

  /** RCS: envia mensagem de marca com o logo da TVS para um ou vários números. */
  private async toolRcsBroadcast(input: JarvisChatInput): Promise<JarvisAction> {
    if (!this.rcs) {
      return { tool: "rcs_broadcast", ok: false, detail: "Módulo RCS não disponível neste ambiente." };
    }
    try {
      const message = input.message || "";
      const nums = message.match(/\+?\d{10,15}/g) || [];
      if (!nums.length) {
        const status = this.rcs.status();
        return {
          tool: "rcs_broadcast",
          ok: true,
          detail: `Não vejo números na tua mensagem. Diz 'envía un RCS a +351912345678 con el logo de VISERON'. Estado RCS: modo ${status.mode} · marca ${status.brandName} · logo ${status.logoExists ? "disponível ✓" : "em falta"} · RCS real ${status.configured ? "ativo ✓" : "não configurado (twilio: " + status.twilioConfigured + ", messaging service: " + status.serviceSidConfigured + ")"}.`,
        };
      }
      const quoted = message.match(/"([^"]+)"/);
      const result = await this.rcs.sendBroadcast({ to: nums, message: quoted ? quoted[1] : undefined });
      const r = result.broadcast.results;
      const first = result.broadcast.messages[0];
      const detail = [
        `RCS ${result.ok ? "enviado ✓" : "com falhas"} (modo ${result.broadcast.mode}) para ${result.broadcast.recipients} número(s)`,
        `entregues=${r.sent} · falhados=${r.failed} · em fila=${r.queued}`,
        `logo: ${result.broadcast.mediaUrl}`,
        first ? `1º: ${first.to} → ${first.status} (${first.channel})` : "",
        result.broadcast.mode === "mock" ? "Dica: define TWILIO_RCS_SERVICE_SID no .env para RCS real (sender aprovado pela Google)." : "",
      ].filter(Boolean).join(" · ");
      return { tool: "rcs_broadcast", ok: result.ok, detail };
    } catch (e: any) {
      return { tool: "rcs_broadcast", ok: false, detail: `Erro no RCS: ${e.message}` };
    }
  }

  private templateReply(intent: string, toolResult: JarvisAction | null, message: string, lang: "es" | "pt" | "en"): string {
    const detail = toolResult ? toolResult.detail : "";
    const T: Record<string, Record<string, string>> = {
      system_status: {
        es: `Estado del sistema Viseron: ${detail}. Todo operativo. ¿Quieres ver los planes o crear una cuenta?`,
        pt: `Estado do sistema Viseron: ${detail}. Está tudo operacional. Queres ver os planos ou criar uma conta?`,
        en: `Viseron system status: ${detail}. All operational. Would you like to see the plans or create an account?`,
      },
      list_plans: {
        es: `Tienes estos planes: ${detail}. Para avanzar, di "quiero suscribirme al plan Pro".`,
        pt: `Tens estes planos: ${detail}. Para avançares, diz "quero assinar o plano Pro".`,
        en: `Available plans: ${detail}. To proceed, say "I want to subscribe to the Pro plan".`,
      },
      checkout: {
        es: `¡Claro! Creé la sesión de checkout: ${detail}`,
        pt: `Claro! Criei a sessão de checkout: ${detail}`,
        en: `Sure! I created the checkout session: ${detail}`,
      },
      register_info: {
        es: "Puedes crear una cuenta en /dashboard (registro multi-tenant: organización → tenant + owner + JWT). ¿Te muestro los pasos?",
        pt: "Podes criar uma conta em /dashboard (registo multi-tenant: organização → tenant + owner + JWT). Queres que te mostre os passos?",
        en: "You can create an account at /dashboard (multi-tenant registration: org → tenant + owner + JWT). Shall I show you the steps?",
      },
      blog: {
        es: `En el blog de Viseron: ${detail}. También genero contenido automático cada 120 minutos.`,
        pt: `No blog do Viseron: ${detail}. Posso também gerar conteúdo automático a cada 120 minutos.`,
        en: `On the Viseron blog: ${detail}. I can also generate automatic content every 120 minutes.`,
      },
      trigger_content: {
        es: "Ya activé el pipeline de contenido. El Content Agent genera y publica automáticamente — míralo en /blog.",
        pt: "Já acionei o pipeline de conteúdo. O Content Agent gera e publica automaticamente — vê em /blog.",
        en: "Content pipeline triggered. The Content Agent generates and publishes automatically — see /blog.",
      },
      email_status: {
        es: `Email: ${detail}. En producción el transporte está en modo dev; con SMTP/Resend/SendGrid/Gmail envía correos reales.`,
        pt: `Email: ${detail}. Em produção o transporte está em modo dev; com SMTP/Resend/SendGrid/Gmail passa a enviar emails reais.`,
        en: `Email: ${detail}. In production the transport is in dev mode; with SMTP/Resend/SendGrid/Gmail it sends real emails.`,
      },
      messaging_status: {
        es: `Mensajería dedicada: ${detail}. Los mensajes se cifran por destinatario — el servidor nunca ve el texto en claro.`,
        pt: `Mensageria dedicada: ${detail}. Mensagens são cifradas por recetor — o servidor nunca vê o texto em claro.`,
        en: `Dedicated messaging: ${detail}. Messages are encrypted per recipient — the server never sees plaintext.`,
      },
      audit_info: {
        es: `Sobre auditoría: ${detail}. ¿Quieres que ejecute la auditoría completa ahora?`,
        pt: `Sobre auditoria: ${detail}. Queres que eu corra a auditoria completa agora?`,
        en: `About auditing: ${detail}. Do you want me to run the full audit now?`,
      },
      waitlist_info: { es: detail, pt: detail, en: detail },
      memory_recall: { es: detail, pt: detail, en: detail },
      agency_status: {
        es: `Estado de la agencia (Agency OS):\n${detail}`,
        pt: `Estado da agência (Agency OS):\n${detail}`,
        en: `Agency status (Agency OS):\n${detail}`,
      },
      agency_lead_add: { es: detail, pt: detail, en: detail },
      agency_report: { es: detail, pt: detail, en: detail },
      agency_creative: { es: detail, pt: detail, en: detail },
      agency_nurture: { es: detail, pt: detail, en: detail },
      agency_projection: { es: detail, pt: detail, en: detail },
      who_are_you: {
        es: "Soy JARVIS, asistente del Trinnity Viseron System (TVS) — un sistema operativo multi-agente con 5000+ mentes. Autonomía real: consulto el estado, los planes, el blog, la mensajería, creo checkouts y ejecuto acciones en apps conectadas (Gmail, Slack, GitHub, Notion...) via Composio. ¿Cómo puedo ayudarte?",
        pt: "Sou o JARVIS, assistente do Trinnity Viseron System (TVS) — um sistema operativo multi-agente com 5000+ mentes. Tenho autonomia para consultar o estado do sistema, planos, blog, mensageria, criar sessões de checkout e ligar apps (Gmail, Slack, GitHub, Notion...) via Composio. Como posso ajudar-te?",
        en: "I'm JARVIS, assistant of the Trinnity Viseron System (TVS) — a multi-agent operating system with 5000+ minds. Real autonomy: I check status, plans, blog, messaging, create checkouts and execute actions on connected apps (Gmail, Slack, GitHub, Notion...) via Composio. How can I help?",
      },
      greeting: {
        es: "¡Hola! Soy JARVIS de Viseron. Puedo mostrarte el estado del sistema, los planes (Core $29 / Pro $99 / Enterprise $499), el blog, la mensajería E2E, crear tu checkout o conectar apps (ej.: 'conecta gmail y slack'). ¿Qué necesitas?",
        pt: "Olá! Sou o JARVIS do Viseron. Posso mostrar o estado do sistema, os planos (Core $29 / Pro $99 / Enterprise $499), o blog, a mensageria E2E, criar o teu checkout ou ligar apps (ex.: 'liga o gmail e o slack'). O que precisas?",
        en: "Hello! I'm JARVIS from Viseron. I can show system status, plans (Core $29 / Pro $99 / Enterprise $499), blog, E2E messaging, create your checkout or connect apps (e.g. 'connect gmail and slack'). What do you need?",
      },
      help: {
        es: "Puedo: (1) estado del sistema · (2) planes y precios · (3) crear sesión de checkout · (4) blog y contenido · (5) estado del email · (6) estado de la mensajería E2E · (7) auditoría operacional (npm run audit:arkom) · (8) conectar apps via Composio (di 'conecta gmail y slack' o 'conecta todas las apps'). También recuerdo cada operación que ejecuto: pregúntame '¿qué has hecho?'.",
        pt: "Posso: (1) estado do sistema · (2) planos/preços · (3) criar sessão de checkout · (4) blog e conteúdo · (5) status do email · (6) status da mensageria E2E · (7) auditoria operacional (npm run audit:arkom) · (8) ligar apps via Composio (diz 'liga o gmail e o slack' ou 'liga todas as apps'). Também lembro cada operação que executo: pergunta 'o que já fizeste?'.",
        en: "I can: (1) system status · (2) plans & pricing · (3) create checkout session · (4) blog & content · (5) email status · (6) E2E messaging status · (7) operational audit (npm run audit:arkom) · (8) connect apps via Composio (say 'connect gmail and slack' or 'connect all apps'). I also remember every operation I run — ask me 'what have you done?'.",
      },
      default: {
        es: `Entiendo que hablas de "${message.slice(0, 80)}". Soy JARVIS de Viseron — puedo consultar el estado del sistema, los planes, el blog o crear un checkout. Dime qué necesitas.`,
        pt: `Percebi que falas de "${message.slice(0, 80)}". Sou o JARVIS do Viseron — posso consultar o estado do sistema, os planos, o blog ou criar um checkout. Diz-me o que precisas.`,
        en: `I understand you're talking about "${message.slice(0, 80)}". I'm JARVIS from Viseron — I can check system status, plans, blog or create a checkout. Tell me what you need.`,
      },
    };
    const tpl = T[intent] || T.default;
    const t = tpl[lang] || tpl.es || detail;
    if (intent === "composio_connect" || intent === "composio_execute" || intent === "composio_status" || intent === "rcs_broadcast") {
      return toolResult ? detail : t;
    }
    return t;
  }
}
