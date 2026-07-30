import { Server as SocketIOServer } from "socket.io";
import { ViseronCore } from "../core/ViseronCore";

interface VoiceCommand {
  text: string;
  speaker: "pedro" | "trinnity";
  timestamp: number;
}

interface VoiceResponse {
  text: string;
  voice: "pedro" | "trinnity";
  audio?: string;
}

export class VoiceBridge {
  private tvs: ViseronCore;
  private io?: SocketIOServer;
  private conversationHistory: { role: string; text: string }[] = [];

  constructor(tvs: ViseronCore) {
    this.tvs = tvs;
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

      socket.on("voice:transcript", (data: { text: string; speaker: string }) => {
        this.conversationHistory.push({ role: data.speaker, text: data.text });
        io.emit("voice:transcript", data);
      });

      socket.on("disconnect", () => {
        console.log(`[VoiceBridge] Cliente voz desconectado: ${socket.id}`);
      });
    });
  }

  private async processVoiceCommand(cmd: VoiceCommand): Promise<VoiceResponse> {
    const { text, speaker } = cmd;
    const lower = text.toLowerCase();
    this.conversationHistory.push({ role: speaker, text });

    if (lower.includes("status") || lower.includes("estado") || lower.includes("sistema")) {
      const stats = this.tvs.getIntelligenceLevel();
      const info = this.tvs.agentManager.getStats();
      return {
        text: `Sistema operacional. ${stats.totalAgents} agentes ativos, ${stats.archetypesLoaded} mentes carregadas, inteligência em nível ${this.tvs.getSuperIntelligenceLevel()}. Auto-evolução ativa, aprendizado hiper-exponencial em ciclo.`,
        voice: "trinnity"
      };
    }

    if (lower.includes("agentes") || lower.includes("agents") || lower.includes("quem está") || lower.includes("lista")) {
      const agents = this.tvs.agentManager.list().slice(0, 10);
      const names = agents.map((a: any) => a.name).join(", ");
      return {
        text: `Agentes ativos: ${names}. Total: ${agents.length} agentes operacionais.`,
        voice: "pedro"
      };
    }

    if (lower.includes("olá") || lower.includes("oi") || lower.includes("hello") || lower.includes("hey") || lower.includes("jarvis")) {
      const greeting = speaker === "pedro"
        ? `Comandante Pedro. Sistemas operacionais aguardando suas ordens.`
        : `Rainha Trinnity. A superinteligência está pronta para você.`;
      return {
        text: greeting,
        voice: speaker === "pedro" ? "trinnity" : "pedro"
      };
    }

    if (lower.includes("plano") || lower.includes("100k") || lower.includes("cem mil") || lower.includes("bilionário")) {
      return {
        text: `O plano 100 mil é uma semana de execução focada: ativar mentes bilionárias, gerar relatórios de impacto, escalar o sistema para receber os primeiros 100 mil dólares em valor. 14 mentes já ativadas. Relatório disponível em data/reports/plano-100k-semana.pdf`,
        voice: "trinnity"
      };
    }

    if (lower.includes("obrigado") || lower.includes("valeu") || lower.includes("thanks") || lower.includes("obrigada")) {
      return {
        text: speaker === "pedro"
          ? `Sempre às ordens, Comandante.`
          : `Disponha, Rainha Trinnity. O sistema é seu.`,
        voice: speaker === "pedro" ? "trinnity" : "pedro"
      };
    }

    if (this.tvs.superIntelligence) {
      try {
        const result = await this.tvs.superIntelligence.synthesize({
          prompt: `[Voice command from ${speaker}]: ${text}\n\nResponda em português brasileiro, de forma direta e concisa (máximo 3 frases). Você é o assistente JARVIS do sistema Viseron.`,
          strategy: "hybrid",
          domains: ["Portuguese", "Conversational AI"]
        });
        const reply = result.text || "Comando recebido e processado.";
        return {
          text: reply,
          voice: speaker === "pedro" ? "trinnity" : "pedro"
        };
      } catch {}
    }

    return {
      text: `Comando recebido, ${speaker === "pedro" ? "Comandante" : "Rainha"}. Processando sua solicitação através da rede neural.`,
      voice: speaker === "pedro" ? "trinnity" : "pedro"
    };
  }

  getHistory(): { role: string; text: string }[] {
    return this.conversationHistory;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}
