import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import * as fs from "fs-extra";
import { OmniRouteProvider } from "./OmniRouteProvider";
import { AIProviderBridge, AIProviderConfig } from "../../core/bridge/AIProviderBridge";
import { ILLMProvider } from "../../core/providers/BaseProvider";

// NOTA (v3): o OmniRoute é agora um SERVIÇO PERSISTENTE independente do TVS.
// Arranca DETACHED com log próprio e sobrevive aos restarts do TVS — nunca é
// morto quando o servidor morre. O restart (scripts/restart.ps1) mata só o
// servidor principal e REUTILIZA o OmniRoute que já está na porta 20128.
// O arranque standalone fica em scripts/omniroute-standalone.cjs.

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
  private restartTimer: NodeJS.Timeout | null = null;
  private healthTimer: NodeJS.Timeout | null = null;
  private restartAttempts = 0;
  private stopped = false;
  private portInUse = false;
  private readonly MAX_RESTART_ATTEMPTS = 10;

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
      // Arranque NÃO-bloqueante: o boot do TVS avança já; o OmniRoute fica
      // pronto em background (o health check volta a tentar se falhar).
      this.startProcess().catch((err: any) => {
        console.warn(`  [OmniRoute] Start in background falhou: ${err.message}`);
      });
    }

    this.startHealthCheck();

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

    if (this.portInUse) {
      try {
        const available = await this.provider.isAvailable();
        if (available) {
          console.log(`  [OmniRoute] Porta ${this.config.port} em uso — a reutilizar servidor existente (sem crash-loop)`);
          return;
        }
      } catch {}
      console.warn(`  [OmniRoute] Porta ${this.config.port} ocupada por outro processo; a manter modo on-demand`);
      return;
    }

    try {
      const isAvailable = await this.provider.isAvailable();
      if (isAvailable) {
        console.log(`  [OmniRoute] Server already running at ${this.config.baseUrl}`);
        return;
      }
    } catch {}

    console.log(`  [OmniRoute] Starting OmniRoute server (detached, persistent)...`);

    const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";
    const cmd = `${npxBin} omniroute --port ${this.config.port} --no-open`;

    // Log próprio em data/omniroute.log — sobrevive ao pai (o pipe morre com o TVS).
    let logFd: number | null = null;
    try {
      fs.ensureDirSync(path.join(process.cwd(), "data"));
      logFd = fs.openSync(path.join(process.cwd(), "data", "omniroute.log"), "a");
    } catch {}

    try {
      this.process = spawn(cmd, {
        detached: true,
        stdio: logFd !== null ? ["ignore", logFd, logFd] : ["ignore", "pipe", "pipe"],
        shell: true,
        windowsHide: true,
        env: {
          ...process.env,
          PORT: String(this.config.port),
          OMNIROUTE_DATA_DIR: this.config.dataDir,
        },
      });
      // DETACHED: o OmniRoute continua vivo quando o TVS (pai) morre ou reinicia.
      this.process.unref();
    } catch (err: any) {
      console.warn(`  [OmniRoute] Failed to spawn server: ${err.message} (will use on-demand mode)`);
      this.process = null;
      return;
    }

    this.process.on("error", (err: Error) => {
      console.warn(`  [OmniRoute] Server process error: ${err.message} (will use on-demand mode)`);
      this.process = null;
    });

    if (logFd === null) {
      this.process.stdout?.on("data", (data: Buffer) => {
        const msg = data.toString().trim();
        if (msg) console.log(`  [OmniRoute] ${msg}`);
      });

      this.process.stderr?.on("data", (data: Buffer) => {
        const msg = data.toString().trim();
        if (msg && !msg.includes("ExperimentalWarning")) {
          if (/EADDRINUSE|address already in use|already in use|port .* in use/i.test(msg)) {
            this.portInUse = true;
            console.warn(`  [OmniRoute] Porta ${this.config.port} já em uso — a reutilizar servidor existente (sem crash-loop)`);
          } else {
            console.error(`  [OmniRoute:err] ${msg}`);
          }
        }
      });
    }

    this.process.on("exit", (code) => {
      console.log(`  [OmniRoute] Process exited with code ${code}`);
      this.process = null;
      if (!this.stopped && this.config.autoStart && !this.portInUse) {
        this.scheduleRestart();
      }
    });

    const ready = await this.waitForReady(30000);
    if (ready) {
      this.restartAttempts = 0;
      console.log(`  [OmniRoute] Server ready at ${this.config.baseUrl}`);
    }
  }

  private scheduleRestart(): void {
    if (this.restartTimer) return;
    if (this.restartAttempts >= this.MAX_RESTART_ATTEMPTS) {
      console.warn(`  [OmniRoute] Restart limit reached (${this.MAX_RESTART_ATTEMPTS}). Manual intervention required.`);
      return;
    }
    this.restartAttempts += 1;
    const delay = Math.min(1000 * Math.pow(2, this.restartAttempts - 1), 60000);
    console.log(`  [OmniRoute] Scheduling restart in ${delay / 1000}s (attempt ${this.restartAttempts}/${this.MAX_RESTART_ATTEMPTS})...`);
    this.restartTimer = setTimeout(async () => {
      this.restartTimer = null;
      if (this.stopped) return;
      try {
        await this.startProcess();
      } catch (err: any) {
        console.warn(`  [OmniRoute] Restart failed: ${err.message}`);
      }
    }, delay);
  }

  private startHealthCheck(): void {
    if (this.healthTimer) return;
    this.healthTimer = setInterval(async () => {
      if (this.stopped) return;
      try {
        const available = await this.provider.isAvailable();
        if (!available && !this.process && !this.restartTimer && !this.portInUse) {
          console.log(`  [OmniRoute] Health check: server down, restarting...`);
          try {
            await this.startProcess();
          } catch (err: any) {
            console.warn(`  [OmniRoute] Health-check restart failed: ${err.message}`);
          }
        }
      } catch {}
    }, 15000);
    this.healthTimer.unref?.();
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
    this.stopped = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    // OmniRoute é um SERVIÇO PERSISTENTE: não é morto no stop do TVS.
    // Continua na porta 20128 e é reutilizado no próximo arranque.
    this.process = null;
    console.log(`  [OmniRoute] Serviço mantido vivo (persistente) — reutilizado no próximo boot`);
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
