import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import * as fs from "fs-extra";
import { OmniRouteProvider } from "./OmniRouteProvider";
import { AIProviderBridge, AIProviderConfig } from "../../core/bridge/AIProviderBridge";
import { ILLMProvider } from "../../core/providers/BaseProvider";

export interface OmniRouteConfig {
  port: number;
  dataDir: string;
  autoStart: boolean;
  baseUrl: string;
}

export class OmniRouteBridge {
  public name = "OmniRoute AI Gateway";
  public provider: OmniRouteProvider;
  private process: ChildProcess | null = null;
  private config: OmniRouteConfig;
  private aiBridge: AIProviderBridge;

  static readonly OMNIROUTE_PROVIDERS: AIProviderConfig[] = [
    {
      id: "omniroute" as any, name: "OmniRoute AI Gateway", isLocal: false, priority: 0,
      models: [
        { id: "auto", name: "Auto (Smart Router)", capabilities: ["code", "research", "reasoning", "general", "creative", "chat"], costPer1kTokens: 0, contextWindow: 128000, speed: "balanced" },
        { id: "oc/free", name: "OpenCode Free", capabilities: ["code", "general", "chat"], costPer1kTokens: 0, contextWindow: 128000, speed: "fast" },
        { id: "felo/free", name: "Felo Free", capabilities: ["research", "general", "chat"], costPer1kTokens: 0, contextWindow: 128000, speed: "fast" },
        { id: "kimi-k3", name: "Kimi K3", capabilities: ["code", "research", "reasoning", "creative", "chat"], costPer1kTokens: 0.002, contextWindow: 1000000, speed: "balanced" },
        { id: "claude-sonnet-4", name: "Claude Sonnet 4", capabilities: ["code", "research", "reasoning", "creative", "chat"], costPer1kTokens: 0.003, contextWindow: 200000, speed: "balanced" },
        { id: "gpt-4o", name: "GPT-4o", capabilities: ["code", "research", "reasoning", "general", "creative", "chat"], costPer1kTokens: 0.01, contextWindow: 128000, speed: "quality" },
        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", capabilities: ["code", "research", "reasoning", "general", "chat"], costPer1kTokens: 0.00015, contextWindow: 1048576, speed: "fast" },
        { id: "deepseek-chat", name: "DeepSeek Chat", capabilities: ["code", "reasoning", "general", "chat"], costPer1kTokens: 0.0005, contextWindow: 128000, speed: "balanced" },
        { id: "grok-3", name: "Grok 3", capabilities: ["code", "research", "reasoning", "creative", "chat"], costPer1kTokens: 0.002, contextWindow: 131072, speed: "balanced" },
      ],
      baseUrl: "http://localhost:20128"
    },
  ];

  constructor(aiBridge: AIProviderBridge, config?: Partial<OmniRouteConfig>) {
    const port = config?.port ?? parseInt(process.env.OMNIROUTE_PORT || "20128", 10);
    this.config = {
      port,
      dataDir: config?.dataDir ?? process.env.OMNIROUTE_DATA_DIR ?? "./data/omniroute",
      autoStart: config?.autoStart ?? true,
      baseUrl: config?.baseUrl ?? `http://localhost:${port}`,
    };
    this.provider = new OmniRouteProvider(this.config.baseUrl);
    this.aiBridge = aiBridge;
  }

  async initialize(): Promise<number> {
    console.log(`\n══════════════════════════════════════════════`);
    console.log(`   OMNIROUTE AI GATEWAY INTEGRATION`);
    console.log(`   290+ AI Providers — 90+ Free Tiers`);
    console.log(`══════════════════════════════════════════════\n`);

    fs.ensureDirSync(this.config.dataDir);

    if (this.config.autoStart) {
      await this.startProcess();
    }

    await this.registerWithBridge();

    console.log(`  [OmniRoute] Bridge initialized`);
    console.log(`  [OmniRoute] Endpoint: ${this.config.baseUrl}/v1`);
    console.log(`  [OmniRoute] Dashboard: http://localhost:${this.config.port}`);
    console.log(`  [OmniRoute] Models: auto, oc/free, felo/free, kimi-k3, claude-sonnet-4, gpt-4o, gemini-2.5-flash, deepseek-chat, grok-3`);
    console.log(`  [OmniRoute] Free tiers: ~1.53B tokens/mo across 43 provider pools\n`);

    return OmniRouteBridge.OMNIROUTE_PROVIDERS[0].models.length;
  }

  private async registerWithBridge(): Promise<void> {
    if (!this.aiBridge) return;
    for (const cfg of OmniRouteBridge.OMNIROUTE_PROVIDERS) {
      this.aiBridge.registerExternalProvider(
        cfg.id as any,
        this.provider as unknown as ILLMProvider,
        cfg
      );
    }
  }

  async startProcess(): Promise<void> {
    if (this.process) return;

    try {
      const isAvailable = await this.provider.isAvailable();
      if (isAvailable) {
        console.log(`  [OmniRoute] Server already running at ${this.config.baseUrl}`);
        return;
      }
    } catch {}

    console.log(`  [OmniRoute] Starting OmniRoute server...`);

    const omnirouteCmd = process.platform === "win32" ? "npx.cmd" : "npx";
    const args = ["omniroute", "--port", String(this.config.port)];

    if (process.env.OMNIROUTE_DATA_DIR) {
      args.push("--data-dir", process.env.OMNIROUTE_DATA_DIR);
    }

    this.process = spawn(omnirouteCmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PORT: String(this.config.port),
        OMNIROUTE_DATA_DIR: this.config.dataDir,
      },
    });

    this.process.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.log(`  [OmniRoute] ${msg}`);
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes("ExperimentalWarning")) {
        console.error(`  [OmniRoute:err] ${msg}`);
      }
    });

    this.process.on("exit", (code) => {
      console.log(`  [OmniRoute] Process exited with code ${code}`);
      this.process = null;
    });

    const ready = await this.waitForReady(30000);
    if (ready) {
      console.log(`  [OmniRoute] Server ready at ${this.config.baseUrl}`);
    }
  }

  private async waitForReady(timeoutMs: number): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const available = await this.provider.isAvailable();
        if (available) return true;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.warn(`  [OmniRoute] Server did not become ready within ${timeoutMs}ms (will retry on demand)`);
    return false;
  }

  stop(): void {
    if (this.process) {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(this.process.pid), "/f", "/t"]);
      } else {
        this.process.kill("SIGTERM");
      }
      this.process = null;
      console.log(`  [OmniRoute] Server stopped`);
    }
  }

  getStats() {
    return {
      endpoint: this.config.baseUrl,
      port: this.config.port,
      running: this.process !== null,
      models: OmniRouteBridge.OMNIROUTE_PROVIDERS[0].models.length,
      providers: "290+",
      freeTiers: "90+",
    };
  }
}
