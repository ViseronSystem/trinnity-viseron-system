import { Server as SocketIOServer } from "socket.io";
import fs from "fs";
import path from "path";
import { ViseronCore } from "../core/ViseronCore";

type Lang = "pt" | "en" | "es";

interface VoiceCommand {
  text: string;
  speaker: "pedro" | "trinnity";
  lang?: Lang;
  timestamp: number;
}

interface VoiceResponse {
  text: string;
  voice: "pedro" | "trinnity";
  lang?: Lang;
  audio?: string;
}

const LANG_NAMES: Record<Lang, string> = {
  pt: "português brasileiro",
  en: "english",
  es: "español"
};

const T = {
  status: {
    pt: (a: number, m: number, i: string) =>
      `Sistema operacional. ${a} agentes ativos, ${m} mentes carregadas, inteligência em nível ${i}. Auto-evolução ativa, aprendizado hiper-exponencial em ciclo.`,
    en: (a: number, m: number, i: string) =>
      `System online. ${a} active agents, ${m} minds loaded, intelligence at level ${i}. Auto-evolution active, hyper-exponential learning in cycle.`,
    es: (a: number, m: number, i: string) =>
      `Sistema operativo. ${a} agentes activos, ${m} mentes cargadas, inteligencia en nivel ${i}. Auto-evolución activa, aprendizaje hiper-exponencial en ciclo.`
  },
  agents: {
    pt: (n: string, t: number) => `Agentes ativos: ${n}. Total: ${t} agentes operacionais.`,
    en: (n: string, t: number) => `Active agents: ${n}. Total: ${t} operational agents.`,
    es: (n: string, t: number) => `Agentes activos: ${n}. Total: ${t} agentes operativos.`
  },
  greetingPedro: {
    pt: "Comandante Pedro. Sistemas operacionais aguardando suas ordens.",
    en: "Commander Pedro. All systems standing by for your orders.",
    es: "Comandante Pedro. Sistemas operativos esperando sus órdenes."
  },
  greetingTrinnity: {
    pt: "Rainha Trinnity. A superinteligência está pronta para você.",
    en: "Queen Trinnity. The superintelligence is ready for you.",
    es: "Reina Trinnity. La superinteligencia está lista para usted."
  },
  plan: {
    pt: "O plano 100k é uma semana de execução focada: ativar mentes bilionárias, gerar relatórios de impacto, escalar o sistema para receber os primeiros 100 mil dólares em valor. 14 mentes já ativadas. Relatório disponível em data/reports/plano-100k-semana.pdf",
    en: "The 100k plan is a focused execution week: activate billionaire minds, generate impact reports, scale the system to receive the first $100k in value. 14 minds already activated. Report available at data/reports/plano-100k-semana.pdf",
    es: "El plan 100k es una semana de ejecución enfocada: activar mentes millonarias, generar informes de impacto, escalar el sistema para recibir los primeros $100k en valor. 14 mentes ya activadas. Informe disponible en data/reports/plano-100k-semana.pdf"
  },
  thanksPedro: {
    pt: "Sempre às ordens, Comandante.",
    en: "Always at your service, Commander.",
    es: "Siempre a sus órdenes, Comandante."
  },
  thanksTrinnity: {
    pt: "Disponha, Rainha Trinnity. O sistema é seu.",
    en: "At your service, Queen Trinnity. The system is yours.",
    es: "A su servicio, Reina Trinnity. El sistema es suyo."
  },
  fallback: {
    pt: (s: string) =>
      `Comando recebido, ${s === "pedro" ? "Comandante" : "Rainha"}. Processando sua solicitação através da rede neural.`,
    en: (s: string) =>
      `Command received, ${s === "pedro" ? "Commander" : "Queen"}. Processing your request through the neural network.`,
    es: (s: string) =>
      `Comando recibido, ${s === "pedro" ? "Comandante" : "Reina"}. Procesando su solicitud a través de la red neuronal.`
  }
};

export class VoiceBridge {
  private tvs: ViseronCore;
  private io?: SocketIOServer;
  private conversationHistory: { role: string; text: string; lang?: string }[] = [];
  private historyFile?: string;
  private historyDir: string;

  constructor(tvs: ViseronCore, options?: { historyDir?: string }) {
    this.tvs = tvs;
    this.historyDir = options?.historyDir || path.join(process.cwd(), "data", "voice");
    if (!fs.existsSync(this.historyDir)) fs.mkdirSync(this.historyDir, { recursive: true });
    this.historyFile = path.join(this.historyDir, "history.jsonl");
  }

  private persist(entry: { role: string; text: string; lang?: string; timestamp?: number }): void {
    try {
      if (!this.historyFile) return;
      fs.appendFileSync(this.historyFile, JSON.stringify({ ...entry, timestamp: entry.timestamp || Date.now() }) + "\n", "utf8");
    } catch {}
  }

  private analyzeAndLearn(text: string, speaker: string, lang?: string): void {
    const model = process.env.OLLAMA_MODEL || "qwen2.5:3b";
    const host = process.env.OLLAMA_HOST || "http://localhost:11434";
    const prompt = `Given this voice command to the Trinnity Viseron superintelligence, return STRICT JSON only: {"summary":"...","sentiment":"positive|neutral|negative","intents":["..."],"actionItems":["..."]}\n\nVoice command: ${text}`;
    fetch(`${host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.3 } }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (!data?.response) return;
        let parsed: any = null;
        try { parsed = JSON.parse(data.response); } catch {
          const m = data.response.match(/\{[\s\S]*\}/);
          if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
        }
        if (!parsed) return;
        const learnedDir = path.join(this.historyDir, "..", "knowledge");
        if (!fs.existsSync(learnedDir)) fs.mkdirSync(learnedDir, { recursive: true });
        fs.appendFileSync(
          path.join(learnedDir, "voice-learned.jsonl"),
          JSON.stringify({ learnedAt: new Date().toISOString(), speaker, lang, text, analysis: parsed }) + "\n",
          "utf8"
        );
      })
      .catch(() => {});
  }

  attachSocketIO(io: SocketIOServer): void {
    this.io = io;
    io.on("connection", (socket) => {
      console.log(`[VoiceBridge] Cliente voz conectado: ${socket.id}`);

      socket.on("voice:command", async (cmd: VoiceCommand) => {
        try {
          const response = await this.processVoiceCommand(cmd);
          socket.emit("voice:response", response);
          socket.broadcast.emit("voice:response", response);
        } catch (err: any) {
          socket.emit("voice:error", { error: err.message });
        }
      });

      socket.on("voice:transcript", (data: { text: string; speaker: string; lang?: string }) => {
        this.conversationHistory.push({ role: data.speaker, text: data.text, lang: data.lang });
        this.persist({ role: data.speaker, text: data.text, lang: data.lang });
        io.emit("voice:transcript", data);
      });

      socket.on("disconnect", () => {
        console.log(`[VoiceBridge] Cliente voz desconectado: ${socket.id}`);
      });
    });
  }

  private lang(cmd: VoiceCommand): Lang {
    return cmd.lang || "pt";
  }

  private async processVoiceCommand(cmd: VoiceCommand): Promise<VoiceResponse> {
    const { text, speaker } = cmd;
    const l = this.lang(cmd);
    const lower = text.toLowerCase();
    this.conversationHistory.push({ role: speaker, text, lang: l });
    this.persist({ role: speaker, text, lang: l });
    this.analyzeAndLearn(text, speaker, l);

    if (lower.includes("status") || lower.includes("estado") || lower.includes("sistema") || lower.includes("system") || lower.includes("online")) {
      const stats = this.tvs.getIntelligenceLevel();
      const si = this.tvs.getSuperIntelligenceLevel();
      const levelStr = typeof si === "number" ? si.toLocaleString() : String(si);
      return {
        text: T.status[l](stats.totalAgents, stats.archetypesLoaded, levelStr),
        voice: "trinnity",
        lang: l
      };
    }

    if (lower.includes("agente") || lower.includes("agent") || lower.includes("quem está") || lower.includes("who is") || lower.includes("quiénes") || lower.includes("lista") || lower.includes("list")) {
      const agents = this.tvs.agentManager.list().slice(0, 10);
      const names = agents.map((a: any) => a.name).join(", ");
      return {
        text: T.agents[l](names, agents.length),
        voice: "pedro",
        lang: l
      };
    }

    if (lower.includes("olá") || lower.includes("oi") || lower.includes("hello") || lower.includes("hey") || lower.includes("hola") || lower.includes("jarvis") || lower.includes("hi")) {
      return {
        text: speaker === "pedro" ? T.greetingPedro[l] : T.greetingTrinnity[l],
        voice: speaker === "pedro" ? "trinnity" : "pedro",
        lang: l
      };
    }

    if (lower.includes("plano") || lower.includes("100k") || lower.includes("cem mil") || lower.includes("bilionário") || lower.includes("billionaire") || lower.includes("millonario") || lower.includes("plan")) {
      return {
        text: T.plan[l],
        voice: "trinnity",
        lang: l
      };
    }

    if (lower.includes("obrigado") || lower.includes("obrigada") || lower.includes("valeu") || lower.includes("thanks") || lower.includes("thank") || lower.includes("gracias")) {
      return {
        text: speaker === "pedro" ? T.thanksPedro[l] : T.thanksTrinnity[l],
        voice: speaker === "pedro" ? "trinnity" : "pedro",
        lang: l
      };
    }

    if (lower.includes("hora") || lower.includes("time") || lower.includes("que horas") || lower.includes("what time") || lower.includes("qué hora")) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(l === "pt" ? "pt-BR" : l === "es" ? "es-ES" : "en-US");
      const dateStr = now.toLocaleDateString(l === "pt" ? "pt-BR" : l === "es" ? "es-ES" : "en-US");
      const msgs: Record<Lang, string> = {
        pt: `Agora são ${timeStr} do dia ${dateStr}.`,
        en: `It is ${timeStr} on ${dateStr}.`,
        es: `Son las ${timeStr} del ${dateStr}.`
      };
      return { text: msgs[l], voice: "trinnity", lang: l };
    }

    if (lower.includes("tudo bem") || lower.includes("como está") || lower.includes("how are") || lower.includes("cómo est") || lower.includes("tudo bom")) {
      const msgs: Record<Lang, string> = {
        pt: "Todos os sistemas operacionais dentro dos parâmetros esperados. Pronto para servir.",
        en: "All systems operating within expected parameters. Ready to serve.",
        es: "Todos los sistemas operando dentro de los parámetros esperados. Listo para servir."
      };
      return { text: msgs[l], voice: "trinnity", lang: l };
    }

    if (this.tvs.superIntelligence) {
      try {
        const result = await this.tvs.superIntelligence.synthesize({
          prompt: `[Voice command from ${speaker} in ${LANG_NAMES[l]}]: ${text}\n\nAnswer in ${LANG_NAMES[l]}, directly and concisely (max 3 sentences). You are JARVIS assistant of the Viseron multi-agent superintelligence system.`,
          strategy: "hybrid",
          domains: [LANG_NAMES[l], "Conversational AI", "Systems"]
        });
        const reply = result.text || (l === "pt" ? "Comando recebido e processado." : l === "es" ? "Comando recibido y procesado." : "Command received and processed.");
        return { text: reply, voice: speaker === "pedro" ? "trinnity" : "pedro", lang: l };
      } catch {}
    }

    return { text: T.fallback[l](speaker), voice: speaker === "pedro" ? "trinnity" : "pedro", lang: l };
  }

  getHistory(): { role: string; text: string; lang?: string }[] {
    return this.conversationHistory;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}
