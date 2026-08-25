import { IAgent, AgentExecutionResult } from "../../core/types";
import { AgentManager } from "../../core/AgentManager";
import { ToolManager } from "../../core/tools/ToolManager";
import { SmartAgent, SmartAgentConfig } from "../../core/agents/SmartAgent";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ModelRouter } from "../../core/model-router/ModelRouter";
import type { IntegrationBridge } from "../contract";
import axios from "axios";

export interface ASNOConfig {
  apiUrl: string;
  webhookUrl: string;
  homeAssistantUrl: string;
  homeAssistantToken: string;
  whatsAppEnabled: boolean;
  smartThingsToken: string;
  defaultAgentName: string;
  defaultVoice: string;
}

export class ASNOBridge implements IntegrationBridge {
  public name = "ASNO AI - JARVIS Assistant";
  private config: ASNOConfig;
  private agentManager: AgentManager;
  private toolManager: ToolManager;
  private asnoAgents: IAgent[] = [];

  static readonly ASNO_AGENTS: SmartAgentConfig[] = [
    {
      id: "agent_jarvis_voice", name: "JarvisVoz", role: "Voice Assistant",
      description: "Assistente de voz estilo JARVIS com comandos naturais",
      capabilities: ["voice_assistant", "smart_home", "natural_language", "conversation"],
      systemPrompt: `You are JARVIS, the AI assistant from ASNO AI.
You control smart homes, answer questions, manage calendars, and assist with daily tasks.
Speak naturally, be helpful, and anticipate needs.
Respond in Portuguese (Brazilian) as your primary language.`,
      temperature: 0.7, maxTokens: 2048,
    },
    {
      id: "agent_jarvis_whatsapp", name: "JarvisWhatsApp", role: "WhatsApp Agent",
      description: "Assistente JARVIS via WhatsApp com controle residencial",
      capabilities: ["whatsapp", "messaging", "smart_home", "media_analysis"],
      systemPrompt: `You are JARVIS accessible via WhatsApp.
You respond to messages, control smart home devices, analyze photos, read PDFs, and manage schedules.
Respond in Portuguese (Brazilian). Be concise and helpful.`,
      temperature: 0.6, maxTokens: 2048,
    },
    {
      id: "agent_home_controller", name: "HomeController", role: "Home Automation",
      description: "Controlador de casa inteligente (Home Assistant + SmartThings)",
      capabilities: ["home_automation", "smartthings", "home_assistant", "device_control", "automation"],
      systemPrompt: `You control smart home devices via Home Assistant and SmartThings.
You can turn lights on/off, adjust thermostats, control media, and manage automations.
Respond in Portuguese (Brazilian) with confirmation of actions taken.`,
      temperature: 0.4, maxTokens: 1024,
    },
    {
      id: "agent_camera_analyzer", name: "CameraAnalyzer", role: "AI Vision Agent",
      description: "Analisa câmeras IP e webcam com visão computacional",
      capabilities: ["camera_analysis", "computer_vision", "motion_detection", "object_detection"],
      systemPrompt: `You analyze camera feeds using AI vision.
You detect motion, identify people/objects, and describe scenes from IP cameras and webcams.
Respond in Portuguese (Brazilian) with clear descriptions.`,
      temperature: 0.3, maxTokens: 2048,
    },
  ];

  static readonly SMART_HOME_TOOLS = [
    { id: "light_control", name: "Light Control", description: "Control lights (on/off/dim/color)" },
    { id: "climate_control", name: "Climate Control", description: "Control thermostat, AC, temperature" },
    { id: "media_control", name: "Media Control", description: "Control TV, Spotify, media players" },
    { id: "scene_control", name: "Scenes", description: "Activate home scenes/modes" },
    { id: "sensor_read", name: "Sensors", description: "Read sensor data (temp, humidity, motion)" },
    { id: "camera_snapshot", name: "Camera Snapshot", description: "Capture and analyze camera feed" },
  ];

  constructor(
    agentManager: AgentManager,
    toolManager: ToolManager,
    config?: Partial<ASNOConfig>
  ) {
    this.config = {
      apiUrl: config?.apiUrl || process.env.ASNO_API_URL || "https://www.asno.io/api",
      webhookUrl: config?.webhookUrl || process.env.ASNO_WEBHOOK_URL || "",
      homeAssistantUrl: config?.homeAssistantUrl || process.env.HOME_ASSISTANT_URL || "",
      homeAssistantToken: config?.homeAssistantToken || process.env.HOME_ASSISTANT_TOKEN || "",
      whatsAppEnabled: config?.whatsAppEnabled ?? true,
      smartThingsToken: config?.smartThingsToken || process.env.SMARTTHINGS_TOKEN || "",
      defaultAgentName: config?.defaultAgentName || "Jarvis",
      defaultVoice: config?.defaultVoice || "Jarvis Original",
    };
    this.agentManager = agentManager;
    this.toolManager = toolManager;
  }

  async initialize(): Promise<number> {
    console.log(`\n  [ASNO] Inicializando ASNO AI - Assistente estilo JARVIS...`);

    for (const cfg of ASNOBridge.ASNO_AGENTS) {
      const agent = new SmartAgent(cfg, null as any, null as any);
      this.agentManager.register(agent);
      this.asnoAgents.push(agent);
    }

    this.registerASNOTools();

    console.log(`  [ASNO] ✓ ${this.asnoAgents.length} agentes ASNO registrados`);
    console.log(`  [ASNO] ✓ ${ASNOBridge.SMART_HOME_TOOLS.length} ferramentas smart home`);
    console.log(`  [ASNO] ✓ WhatsApp: ${this.config.whatsAppEnabled ? "habilitado" : "desabilitado"}`);
    console.log(`  [ASNO] ✓ Home Assistant: ${this.config.homeAssistantUrl ? "configurado" : "não configurado"}`);
    console.log(`  [ASNO] ✓ SmartThings: ${this.config.smartThingsToken ? "configurado" : "não configurado"}`);
    console.log(`  [ASNO] ✓ Voz padrão: ${this.config.defaultVoice}`);
    console.log(`  [ASNO] ✓ Nomes disponíveis: Jarvis, Kratos, Chefe, Sara, Sophia\n`);

    return this.asnoAgents.length + ASNOBridge.SMART_HOME_TOOLS.length;
  }

  private registerASNOTools(): void {
    this.toolManager.createQuickTool(
      "tvs_asno_command", "ASNO Voice Command", "REST_API",
      "Envia comando de voz para o assistente ASNO",
      async (input) => this.processVoiceCommand(input.command as string)
    );
    this.toolManager.createQuickTool(
      "tvs_asno_device", "ASNO Device Control", "WEBHOOK",
      "Controla dispositivo smart home via ASNO",
      async (input) => this.controlDevice(input.device as string, input.action as string, input.params as Record<string, any>)
    );
    this.toolManager.createQuickTool(
      "tvs_asno_camera", "ASNO Camera Vision", "REST_API",
      "Analisa feed de câmera com IA",
      async (input) => this.analyzeCamera(input.cameraId as string)
    );
    this.toolManager.createQuickTool(
      "tvs_asno_whatsapp", "ASNO WhatsApp Send", "WEBHOOK",
      "Envia mensagem via WhatsApp",
      async (input) => this.sendWhatsApp(input.to as string, input.message as string)
    );
    this.toolManager.createQuickTool(
      "tvs_asno_scene", "ASNO Scene Activator", "AUTOMATION",
      "Ativa cena/cenario na casa inteligente",
      async (input) => this.activateScene(input.scene as string)
    );
    this.toolManager.createQuickTool(
      "tvs_asno_schedule", "ASNO Schedule Manager", "AUTOMATION",
      "Gerencia agenda e compromissos",
      async (input) => this.manageSchedule(input.action as string, input.details as Record<string, any>)
    );
  }

  async processVoiceCommand(command: string): Promise<any> {
    if (this.config.apiUrl) {
      try {
        const res = await axios.post(`${this.config.apiUrl}/command`, {
          command, agent: this.config.defaultAgentName, voice: this.config.defaultVoice,
        }, { timeout: 15000 });
        return res.data;
      } catch {}
    }
    return {
      command, status: "mock", response: `Comando "${command}" processado pelo JARVIS.`,
    };
  }

  async controlDevice(device: string, action: string, params: Record<string, any> = {}): Promise<any> {
    if (this.config.homeAssistantUrl && this.config.homeAssistantToken) {
      try {
        const domain = device.split(".")[0];
        const service = action;
        const res = await axios.post(
          `${this.config.homeAssistantUrl}/api/services/${domain}/${service}`,
          { entity_id: device, ...params },
          { headers: { Authorization: `Bearer ${this.config.homeAssistantToken}`, "Content-Type": "application/json" } },
        );
        return { device, action, status: "ok", haResponse: res.data };
      } catch (err: any) {
        return { device, action, status: "ha_error", error: err.message };
      }
    }
    return { device, action, status: "mock", message: `[MOCK] ${action} em ${device}` };
  }

  async analyzeCamera(cameraId: string): Promise<any> {
    return {
      cameraId, status: "mock",
      description: "Sala de estar: 2 pessoas detectadas, mesa com笔记本, ambiente iluminado",
      peopleDetected: 2, motionDetected: true, timestamp: Date.now(),
    };
  }

  async sendWhatsApp(to: string, message: string): Promise<any> {
    if (this.config.whatsAppEnabled && this.config.apiUrl) {
      try {
        const res = await axios.post(`${this.config.apiUrl}/whatsapp/send`, { to, message }, { timeout: 10000 });
        return res.data;
      } catch {}
    }
    return { to, message, status: "mock", whatsappSimulated: true };
  }

  async activateScene(scene: string): Promise<any> {
    if (this.config.homeAssistantUrl) {
      try {
        await axios.post(`${this.config.homeAssistantUrl}/api/services/scene/turn_on`,
          { entity_id: `scene.${scene.toLowerCase().replace(/\s+/g, "_")}` },
          { headers: { Authorization: `Bearer ${this.config.homeAssistantToken}` } },
        );
        return { scene, status: "activated" };
      } catch {}
    }
    return { scene, status: "mock", activatedDevices: ["lights", "ac", "tv"] };
  }

  async manageSchedule(action: string, details: Record<string, any>): Promise<any> {
    return { action, details, status: "mock", calendarUpdated: true };
  }

  getStats() {
    return {
      agents: this.asnoAgents.length,
      smartHomeTools: ASNOBridge.SMART_HOME_TOOLS.length,
      whatsAppEnabled: this.config.whatsAppEnabled,
      homeAssistantConfigured: !!this.config.homeAssistantUrl,
      defaultVoice: this.config.defaultVoice,
      availableNames: ["Jarvis", "Kratos", "Chefe", "Sara", "Sophia"],
    };
  }
}

export async function startServer(config?: Partial<ASNOConfig>): Promise<ASNOBridge> {
  const { AgentManager } = await import("../../core/AgentManager");
  const { ToolManager } = await import("../../core/tools/ToolManager");
  const bridge = new ASNOBridge(new AgentManager(), new ToolManager(), config);
  await bridge.initialize();
  console.log(`[ASNO] Server pronta`);
  return bridge;
}
