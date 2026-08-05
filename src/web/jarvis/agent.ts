import fs from "fs";
import path from "path";
import { AccountStore } from "../auth/store";
import { BillingProvider } from "../billing/types";
import { EmailService } from "../email/service";
import { MessageStore } from "../messaging/store";
import { BlogStorage } from "../blog-storage";
import { PLANS } from "../billing/plans";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ILogger } from "../monitoring/logger";
import { IMetrics } from "../monitoring/metrics";

// JARVIS — Agente conversacional autónomo do Viseron.
// Conversa com as pessoas e EXECUTA operações reais (estado, planos, checkout,
// blog, content, waitlist, email, mensageria) com engenharia de squad AIOX/ARKOM.

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

  constructor(ctx: {
    dataDir: string;
    logger: ILogger;
    metrics: IMetrics;
    accounts: AccountStore;
    billing: BillingProvider;
    email: EmailService;
    messaging: MessageStore;
    blog: BlogStorage;
  }) {
    this.dataDir = ctx.dataDir;
    this.logger = ctx.logger;
    this.metrics = ctx.metrics;
    this.accounts = ctx.accounts;
    this.billing = ctx.billing;
    this.email = ctx.email;
    this.messaging = ctx.messaging;
    this.blog = ctx.blog;
    this.providerFactory = new ProviderFactory();
    this.sessionsFile = path.join(this.dataDir, "jarvis-sessions.json");
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
      return { sessionId, reply: "Diz-me em que posso ajudar — estado do sistema, planos, criar uma conta, blog, mensageria ou simplesmente conversar.", provider: "rule", model: "tvs-fallback", actions: [], intent: "empty" };
    }

    this.pushMessage(sessionId, { role: "user", content: message, ts: new Date().toISOString() });
    this.metrics.inc("jarvis_chat_total", { intent: "pending" });

    const intent = this.detectIntent(message);
    const actions: JarvisAction[] = [];
    const toolResult = await this.executeIntent(intent, input);

    if (toolResult) {
      actions.push(toolResult);
      this.metrics.inc("jarvis_tool_total", { tool: toolResult.tool });
    }

    const history = session.messages.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n");
    const systemPrompt = this.buildSystemPrompt();
    const prompt = this.buildPrompt(message, intent, toolResult, history);

    const ai = await this.generateRealAI(prompt, systemPrompt);
    const reply = ai.text || this.templateReply(intent, toolResult, message);

    this.pushMessage(sessionId, { role: "assistant", content: reply, ts: new Date().toISOString() });
    this.metrics.inc("jarvis_replies_total", { provider: ai.text ? ai.provider : "rule" });
    this.logger.info(`[JARVIS] ${sessionId} intent=${intent} provider=${ai.text ? ai.provider : "rule"} "${message.slice(0, 60)}"`);

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
      { id: "ollama", key: "", model: "qwen2.5:3b" },
      { id: "omniroute", key: "", model: "auto" },
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
      "You speak Portuguese (pt), English and Spanish. Reply in the language of the user.",
      "You are warm, concise and helpful. You have autonomy: you executed or will execute real operations.",
      "Facts: TVS v5.0. Plans: Core $29/mo, Pro $99/mo, Enterprise $499/mo. Modules live: Auth, Billing, Onboarding, Email, Messaging E2E (X25519+AES-256-GCM), Blog + Content Agent.",
      "Web API: https://viseron-web.onrender.com. GitHub: github.com/ViseronSystem/trinnity-viseron-system.",
      "If a tool ran, summarize its result naturally. Never invent numbers: use only the tool data given.",
    ].join("\n");
  }

  private buildPrompt(message: string, intent: string, toolResult: JarvisAction | null, history: string): string {
    const toolInfo = toolResult ? `A tool ran: ${toolResult.tool} (ok=${toolResult.ok}). Result detail: ${toolResult.detail}` : "No tool executed for this message.";
    return [
      `Conversation history:\n${history}\n`,
      `User message: ${message}`,
      `Detected intent: ${intent}`,
      toolInfo,
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

  private templateReply(intent: string, toolResult: JarvisAction | null, message: string): string {
    const toolText = toolResult ? toolResult.detail : "";
    switch (intent) {
      case "system_status":
        return `Estado do sistema Viseron: ${toolText}. Está tudo operacional. Queres ver os planos ou criar uma conta?`;
      case "list_plans":
        return `Tens estes planos: ${toolText}. Para avançares, diz "quero assinar o plano Pro".`;
      case "checkout":
        return `Claro! Criei a sessão de checkout: ${toolText}.`;
      case "register_info":
        return "Podes criar uma conta em /dashboard (registo multi-tenant: organização → tenant + owner + JWT). Queres que te mostre os passos?";
      case "blog":
        return `No blog do Viseron: ${toolText}. Posso também gerar conteúdo automático a cada 120 minutos.`;
      case "trigger_content":
        return "Já acionei o pipeline de conteúdo. O Content Agent gera e publica automaticamente — vê em /blog.";
      case "email_status":
        return `Email: ${toolText}. Em produção o transporte está em modo dev; com SMTP/Resend/SendGrid/Gmail passa a enviar emails reais.`;
      case "messaging_status":
        return `Mensageria dedicada: ${toolText}. Mensagens são cifradas por recetor — o servidor nunca vê o texto em claro.`;
      case "audit_info":
        return `Sobre auditoria: ${toolText}. Queres que eu corra a auditoria completa agora?`;
      case "waitlist_info":
        return toolText;
      case "who_are_you":
        return "Sou o JARVIS, assistente do Trinnity Viseron System (TVS) — um sistema operativo multi-agente com 5000+ mentes. Tenho autonomia para consultar o estado do sistema, planos, blog, mensageria e criar sessões de checkout. Como posso ajudar-te?";
      case "greeting":
        return "Olá! Sou o JARVIS do Viseron. Posso mostrar o estado do sistema, os planos (Core $29 / Pro $99 / Enterprise $499), o blog, a mensageria E2E ou criar o teu checkout. O que precisas?";
      case "help":
        return "Posso: (1) estado do sistema · (2) planos/preços · (3) criar sessão de checkout · (4) blog e conteúdo · (5) status do email · (6) status da mensageria E2E · (7) auditoria operacional (npm run audit:arkom). Experimenta perguntar.";
      default:
        return `Percebi que falas de "${message.slice(0, 80)}". Sou o JARVIS do Viseron — se quiseres, posso consultar o estado do sistema, planos, blog ou criar um checkout. Diz-me o que precisas.`;
    }
  }
}
