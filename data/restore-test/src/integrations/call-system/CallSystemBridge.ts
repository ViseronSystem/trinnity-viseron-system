import { IAgent, AgentExecutionResult } from "../../core/types";
import { AgentManager } from "../../core/AgentManager";
import { ToolManager } from "../../core/tools/ToolManager";
import { SmartAgent, SmartAgentConfig } from "../../core/agents/SmartAgent";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ModelRouter } from "../../core/model-router/ModelRouter";
import type { IntegrationBridge } from "../contract";

export interface CallSystemConfig {
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  openaiApiKey?: string;
  elevenLabsApiKey?: string;
  defaultVoice: string;
  port: number;
}

export interface CallRequest {
  to: string;
  from?: string;
  context?: Record<string, string>;
  assistantInstructions?: string;
  recordingEnabled?: boolean;
}

export interface CallResult {
  callSid: string;
  to: string;
  status: "queued" | "in-progress" | "completed" | "failed";
  duration?: number;
  recordingUrl?: string;
  transcript?: string;
  error?: string;
}

export class CallSystemBridge implements IntegrationBridge {
  public name = "TVS AI Call System";
  private config: CallSystemConfig;
  private agentManager: AgentManager;
  private toolManager: ToolManager;
  private activeCalls: Map<string, CallResult> = new Map();
  private callAgents: IAgent[] = [];

  static readonly CALLCENTER_AGENTS: SmartAgentConfig[] = [
    {
      id: "agent_outbound_caller", name: "OutboundCaller", role: "Call Agent",
      description: "Realiza chamadas salientes com IA via Twilio + OpenAI Realtime",
      capabilities: ["voice_calling", "twilio", "outbound", "conversation", "elevenlabs"],
      systemPrompt: `You are an AI outbound call agent integrated with Twilio and OpenAI Realtime API.
You make phone calls, handle conversations naturally, and achieve the call objective.
Speak clearly and professionally. Adapt to the conversation flow.`,
      temperature: 0.7, maxTokens: 2048,
    },
    {
      id: "agent_inbound_router", name: "InboundRouter", role: "Call Router",
      description: "Roteia chamadas inbound para o agente correto baseado em contexto",
      capabilities: ["call_routing", "ivr", "context_analysis"],
      systemPrompt: `You route incoming calls to the appropriate AI agent based on context and intent.
Analyze the caller's needs and route to the best available agent.`,
      temperature: 0.5, maxTokens: 1024,
    },
    {
      id: "agent_call_analyzer", name: "CallAnalyzer", role: "Call Analyst",
      description: "Analisa transcrições de chamadas para extrair insights",
      capabilities: ["transcript_analysis", "sentiment", "intent_extraction", "summarization"],
      systemPrompt: `You analyze call transcripts to extract key insights, sentiment, intents, and action items.
Provide structured summaries of each call interaction.`,
      temperature: 0.3, maxTokens: 2048,
    },
  ];

  constructor(
    agentManager: AgentManager,
    toolManager: ToolManager,
    providerFactory: ProviderFactory,
    modelRouter: ModelRouter,
    config?: Partial<CallSystemConfig>
  ) {
    this.config = {
      twilioAccountSid: config?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: config?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: config?.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER,
      openaiApiKey: config?.openaiApiKey || process.env.OPENAI_API_KEY,
      elevenLabsApiKey: config?.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY,
      defaultVoice: config?.defaultVoice || "alloy",
      port: config?.port || 5050,
    };
    this.agentManager = agentManager;
    this.toolManager = toolManager;
  }

  async initialize(): Promise<number> {
    console.log(`\n  [CallSystem] Inicializando TVS AI Call System...`);

    for (const cfg of CallSystemBridge.CALLCENTER_AGENTS) {
      const agent = new SmartAgent(cfg, null as any, null as any);
      this.agentManager.register(agent);
      this.callAgents.push(agent);
    }

    this.registerCallTools();

    console.log(`  [CallSystem] ✓ ${this.callAgents.length} agentes de chamada registrados`);
    console.log(`  [CallSystem] ✓ Twilio ${this.config.twilioAccountSid ? "configurado" : "não configurado (mock)"}`);
    console.log(`  [CallSystem] ✓ ElevenLabs ${this.config.elevenLabsApiKey ? "configurado" : "não configurado (mock)"}`);
    console.log(`  [CallSystem] ✓ Call agents: OutboundCaller, InboundRouter, CallAnalyzer`);

    return this.callAgents.length;
  }

  private registerCallTools(): void {
    this.toolManager.createQuickTool(
      "tvs_make_call", "TVS Make Outbound Call", "REST_API",
      "Faz uma chamada telefônica via Twilio com IA",
      async (input) => this.makeCall(input as CallRequest)
    );
    this.toolManager.createQuickTool(
      "tvs_call_status", "TVS Call Status", "REST_API",
      "Verifica o status de uma chamada ativa",
      async (input) => this.getCallStatus(input.callSid as string)
    );
    this.toolManager.createQuickTool(
      "tvs_analyze_transcript", "TVS Analyze Transcript", "AUTOMATION",
      "Analisa transcrição de chamada para extrair insights",
      async (input) => this.analyzeTranscript(input.transcript as string, input.context as string)
    );
  }

  async makeCall(request: CallRequest): Promise<CallResult> {
    const callSid = `CA${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
    const result: CallResult = {
      callSid,
      to: request.to,
      status: "queued",
    };

    if (this.config.twilioAccountSid && this.config.twilioAuthToken) {
      try {
        const twilio = require("twilio");
        const client = twilio(this.config.twilioAccountSid, this.config.twilioAuthToken);
        const call = await client.calls.create({
          twiml: `<Response><Say>Conectando ao assistente IA...</Say><Connect><Stream url="wss://${process.env.PUBLIC_HOSTNAME || "localhost"}/media-stream" /></Connect></Response>`,
          to: request.to,
          from: request.from || this.config.twilioPhoneNumber,
          record: request.recordingEnabled,
        });
        result.callSid = call.sid;
        result.status = "queued";
      } catch (err: any) {
        result.status = "failed";
        result.error = err.message;
        return result;
      }
    } else {
      console.log(`  [CallSystem] MOCK Call para ${request.to} (sem credenciais Twilio)`);
      result.status = "completed";
      result.duration = 120;
      result.transcript = `[MOCK] Call simulation for ${request.to} completed successfully.`;
    }

    this.activeCalls.set(callSid, result);
    return result;
  }

  getCallStatus(callSid: string): CallResult | null {
    return this.activeCalls.get(callSid) || null;
  }

  async analyzeTranscript(transcript: string, context?: string): Promise<any> {
    return {
      summary: `Call analysis: ${transcript.slice(0, 100)}...`,
      sentiment: "neutral",
      intents: ["information_request"],
      actionItems: ["follow_up_required"],
      duration: transcript.length / 10,
    };
  }

  getStats() {
    return {
      activeCalls: this.activeCalls.size,
      agents: this.callAgents.length,
      twilioConfigured: !!this.config.twilioAccountSid,
      elevenLabsConfigured: !!this.config.elevenLabsApiKey,
      port: this.config.port,
    };
  }

  stop(): void {
    this.activeCalls.clear();
  }
}

export async function startServer(config?: Partial<CallSystemConfig>): Promise<CallSystemBridge> {
  const { AgentManager } = await import("../../core/AgentManager");
  const { ToolManager } = await import("../../core/tools/ToolManager");
  const { ProviderFactory } = await import("../../core/providers/ProviderFactory");
  const { ModelRouter } = await import("../../core/model-router/ModelRouter");
  const bridge = new CallSystemBridge(
    new AgentManager(), new ToolManager(), new ProviderFactory(), new ModelRouter(), config
  );
  await bridge.initialize();
  console.log(`[CallSystem] Server pronta (porta ${bridge.getStats().port})`);
  return bridge;
}
