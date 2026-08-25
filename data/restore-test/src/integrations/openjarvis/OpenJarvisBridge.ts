import { ChildProcess, spawn } from "child_process";
import { IAgent, AgentExecutionResult } from "../../core/types";
import { AgentManager } from "../../core/AgentManager";
import { ToolManager } from "../../core/tools/ToolManager";
import { SmartAgent, SmartAgentConfig } from "../../core/agents/SmartAgent";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ModelRouter } from "../../core/model-router/ModelRouter";
import type { IntegrationBridge } from "../contract";
import axios from "axios";

export interface OpenJarvisConfig {
  autoStart: boolean;
  pythonPath: string;
  serverPort: number;
  modelName: string;
  agentName: string;
}

export class OpenJarvisBridge implements IntegrationBridge {
  public name = "OpenJarvis Personal AI (Stanford)";
  private config: OpenJarvisConfig;
  private process: ChildProcess | null = null;
  private agentManager: AgentManager;
  private toolManager: ToolManager;
  private jarvisAvailable: boolean = false;
  private openJarvisAgents: IAgent[] = [];

  static readonly JARVIS_AGENTS: SmartAgentConfig[] = [
    {
      id: "agent_openjarvis", name: "OpenJarvis", role: "Personal AI Agent",
      description: "OpenJarvis da Stanford - AI pessoal em dispositivo local",
      capabilities: ["personal_ai", "local_inference", "on_device", "chat", "assistant", "memory"],
      systemPrompt: `You are OpenJarvis, a personal AI agent running on local devices.
You help users with daily tasks, answer questions, and assist with code, research, and conversation.
You prioritize local execution and only call cloud when necessary.`,
      temperature: 0.7, maxTokens: 4096,
    },
    {
      id: "agent_jarvis_morning", name: "MorningDigest", role: "Daily Briefing Agent",
      description: "Daily morning digest com email, calendário, notícias e TTS",
      capabilities: ["daily_briefing", "email", "calendar", "news", "tts", "scheduled"],
      systemPrompt: `You are a Morning Digest agent that creates daily briefings.
You check email, calendar, news, and health data to create a spoken daily briefing.`,
      temperature: 0.5, maxTokens: 2048,
    },
    {
      id: "agent_jarvis_research", name: "DeepResearch", role: "Research Agent",
      description: "Multi-hop deep research agent across web and local documents",
      capabilities: ["deep_research", "web_search", "document_analysis", "citations"],
      systemPrompt: `You are a Deep Research agent. You perform multi-hop research across web sources and local documents, providing well-cited answers.`,
      temperature: 0.3, maxTokens: 8192,
    },
    {
      id: "agent_jarvis_coder", name: "CodeAssistant", role: "Code Assistant",
      description: "AI coding assistant with code execution and shell access",
      capabilities: ["code_assistance", "code_execution", "shell_access", "file_io"],
      systemPrompt: `You are a Code Assistant agent. You help write, debug, and execute code. You have access to shell and file tools.`,
      temperature: 0.4, maxTokens: 4096,
    },
    {
      id: "agent_jarvis_operative", name: "OperativeAgent", role: "Autonomous Operative",
      description: "Persistent autonomous agent with state management and memory",
      capabilities: ["autonomous", "persistent", "stateful", "monitoring", "memory"],
      systemPrompt: `You are an Operative agent - a persistent autonomous agent that runs continuously with state management, memory, and scheduled tasks.`,
      temperature: 0.6, maxTokens: 4096,
    },
  ];

  static readonly JARVIS_SKILLS = [
    { name: "web_search", description: "Search the web for information" },
    { name: "file_read", description: "Read files from the filesystem" },
    { name: "code_interpreter", description: "Execute Python code" },
    { name: "shell_exec", description: "Execute shell commands" },
    { name: "memory_index", description: "Index documents into memory" },
    { name: "text_to_speech", description: "Convert text to spoken audio" },
    { name: "calendar_read", description: "Read calendar events" },
    { name: "email_read", description: "Read emails" },
  ];

  constructor(
    agentManager: AgentManager,
    toolManager: ToolManager,
    config?: Partial<OpenJarvisConfig>
  ) {
    this.config = {
      autoStart: config?.autoStart ?? true,
      pythonPath: config?.pythonPath || process.env.OPENJARVIS_PYTHON || "python",
      serverPort: config?.serverPort || 8000,
      modelName: config?.modelName || "qwen3:9b",
      agentName: config?.agentName || "simple",
    };
    this.agentManager = agentManager;
    this.toolManager = toolManager;
  }

  async initialize(): Promise<number> {
    console.log(`\n  [OpenJarvis] Inicializando OpenJarvis (Stanford Personal AI)...`);

    for (const cfg of OpenJarvisBridge.JARVIS_AGENTS) {
      const agent = new SmartAgent(cfg, null as any, null as any);
      this.agentManager.register(agent);
      this.openJarvisAgents.push(agent);
    }

    this.registerJarvisTools();

    if (this.config.autoStart) {
      await this.startJarvisServer();
    }

    console.log(`  [OpenJarvis] ✓ ${this.openJarvisAgents.length} agentes OpenJarvis registrados`);
    console.log(`  [OpenJarvis] ✓ ${OpenJarvisBridge.JARVIS_SKILLS.length} skills catalogadas`);
    console.log(`  [OpenJarvis] ✓ Default model: ${this.config.modelName}`);
    console.log(`  [OpenJarvis] ✓ Presets: morning-digest, deep-research, code-assistant, chat-simple`);
    console.log(`  [OpenJarvis] ✓ Server: ${this.jarvisAvailable ? `http://localhost:${this.config.serverPort}` : "não iniciado (local)"}`);

    return this.openJarvisAgents.length + OpenJarvisBridge.JARVIS_SKILLS.length;
  }

  private registerJarvisTools(): void {
    this.toolManager.createQuickTool(
      "tvs_jarvis_ask", "Jarvis Ask", "REST_API",
      "Ask OpenJarvis a question via its API",
      async (input) => this.jarvisAsk(input.query as string, input.agent as string)
    );
    this.toolManager.createQuickTool(
      "tvs_jarvis_skill", "Jarvis Skill", "AUTOMATION",
      "Execute an OpenJarvis skill by name",
      async (input) => this.executeSkill(input.name as string, input.params as Record<string, any>)
    );
    this.toolManager.createQuickTool(
      "tvs_jarvis_index", "Jarvis Memory Index", "AUTOMATION",
      "Index files into OpenJarvis memory",
      async (input) => this.indexMemory(input.path as string)
    );
    for (const skill of OpenJarvisBridge.JARVIS_SKILLS) {
      this.toolManager.createQuickTool(
        `tvs_skill_${skill.name}`, `Skill: ${skill.name}`, "AUTOMATION",
        skill.description,
        async (input) => this.executeSkill(skill.name, input)
      );
    }
  }

  private async startJarvisServer(): Promise<void> {
    try {
      const installed = await this.checkJarvisInstalled();
      if (!installed) {
        console.log(`  [OpenJarvis] Jarvis CLI não encontrado. Use: pip install openjarvis`);
        console.log(`  [OpenJarvis] Ou: curl -fsSL https://open-jarvis.github.io/OpenJarvis/install.sh | bash`);
        this.jarvisAvailable = false;
        return;
      }

      const args = ["-m", "openjarvis.cli", "serve", "--port", String(this.config.serverPort)];
      this.process = spawn(this.config.pythonPath, args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, OPENJARVIS_MODEL: this.config.modelName },
      });

      this.process.stdout?.on("data", (d: Buffer) => {
        const msg = d.toString().trim();
        if (msg) console.log(`  [Jarvis] ${msg}`);
      });
      this.process.stderr?.on("data", (d: Buffer) => {
        const msg = d.toString().trim();
        if (msg && !msg.includes("WARNING")) console.error(`  [Jarvis:err] ${msg}`);
      });
      this.process.on("exit", (code) => {
        console.log(`  [Jarvis] Process exited (code ${code})`);
        this.process = null;
        this.jarvisAvailable = false;
      });

      await this.waitForJarvis(15000);
    } catch (err: any) {
      console.log(`  [OpenJarvis] Aviso: ${err.message}`);
      this.jarvisAvailable = false;
    }
  }

  private async checkJarvisInstalled(): Promise<boolean> {
    try {
      const { execSync } = require("child_process");
      execSync(`"${this.config.pythonPath}" -c "import openjarvis; print(openjarvis.__version__)"`, { stdio: "pipe", timeout: 5000 });
      return true;
    } catch { return false; }
  }

  private async waitForJarvis(timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        await axios.get(`http://localhost:${this.config.serverPort}/health`, { timeout: 2000 });
        this.jarvisAvailable = true;
        return;
      } catch {}
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  async jarvisAsk(query: string, agentName?: string): Promise<string> {
    if (this.jarvisAvailable) {
      try {
        const res = await axios.post(`http://localhost:${this.config.serverPort}/v1/chat`, {
          messages: [{ role: "user", content: query }],
          agent: agentName || this.config.agentName,
        }, { timeout: 60000 });
        return res.data.choices?.[0]?.message?.content || res.data.content || "(sem resposta)";
      } catch (err: any) {
        return `[Jarvis] Erro: ${err.message}`;
      }
    }
    return `[Jarvis] Mock: processando "${query.slice(0, 80)}..." com ${this.config.modelName} (modo local)`;
  }

  async executeSkill(name: string, params: Record<string, any> = {}): Promise<any> {
    if (this.jarvisAvailable) {
      try {
        const res = await axios.post(`http://localhost:${this.config.serverPort}/v1/skills/execute`, { name, params }, { timeout: 30000 });
        return res.data;
      } catch {}
    }
    return { skill: name, status: "mock", params };
  }

  async indexMemory(path: string): Promise<any> {
    if (this.jarvisAvailable) {
      try {
        const res = await axios.post(`http://localhost:${this.config.serverPort}/v1/memory/index`, { path }, { timeout: 60000 });
        return res.data;
      } catch {}
    }
    return { indexed: false, path, reason: "jarvis not available" };
  }

  getStats() {
    return {
      running: this.jarvisAvailable,
      agents: this.openJarvisAgents.length,
      skills: OpenJarvisBridge.JARVIS_SKILLS.length,
      model: this.config.modelName,
      serverPort: this.config.serverPort,
    };
  }

  stop(): void {
    if (this.process) {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(this.process.pid), "/f", "/t"]);
      } else {
        this.process.kill("SIGTERM");
      }
      this.process = null;
    }
  }
}

export async function startServer(config?: Partial<OpenJarvisConfig>): Promise<OpenJarvisBridge> {
  const { AgentManager } = await import("../../core/AgentManager");
  const { ToolManager } = await import("../../core/tools/ToolManager");
  const bridge = new OpenJarvisBridge(new AgentManager(), new ToolManager(), config);
  await bridge.initialize();
  console.log(`[OpenJarvis] Server pronta (porta ${bridge.getStats().serverPort})`);
  return bridge;
}
