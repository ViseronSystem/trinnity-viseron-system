import { OmniRouteBridge, OmniRouteConfig } from "./OmniRouteBridge";
import { AIProviderBridge, AIProviderConfig } from "../../core/bridge/AIProviderBridge";
import { ILLMProvider } from "../../core/providers/BaseProvider";
import { ModelProvider } from "../../core/types";

export interface OmniRouteProviderSpec {
  id: string;
  name: string;
  models: { id: string; name: string; capabilities: string[]; costPer1kTokens: number; contextWindow: number; speed: "fast" | "balanced" | "quality" }[];
  baseUrl?: string;
  isFree: boolean;
  priority: number;
}

const OMNIROUTE_CATALOG: OmniRouteProviderSpec[] = [
  { id: "auto", name: "OmniRoute Smart Router", isFree: false, priority: 1,
    models: [{ id: "auto", name: "Auto (Smart Router)", capabilities: ["code","research","reasoning","general","creative","chat","automation"], costPer1kTokens: 0, contextWindow: 128000, speed: "balanced" }] },
  { id: "kimi", name: "Kimi (Moonshot AI)", isFree: false, priority: 2,
    models: [{ id: "kimi-k3", name: "Kimi K3", capabilities: ["code","research","reasoning","creative","chat"], costPer1kTokens: 0.002, contextWindow: 1000000, speed: "balanced" }] },
  { id: "claude-omniroute", name: "Claude via OmniRoute", isFree: false, priority: 3,
    models: [
      { id: "claude-sonnet-4", name: "Claude Sonnet 4", capabilities: ["code","research","reasoning","creative","chat"], costPer1kTokens: 0.003, contextWindow: 200000, speed: "balanced" },
      { id: "claude-opus-4", name: "Claude Opus 4", capabilities: ["code","research","reasoning","creative","chat"], costPer1kTokens: 0.015, contextWindow: 200000, speed: "quality" },
    ] },
  { id: "gpt-omniroute", name: "GPT via OmniRoute", isFree: false, priority: 4,
    models: [
      { id: "gpt-4o", name: "GPT-4o", capabilities: ["code","research","reasoning","general","creative","chat"], costPer1kTokens: 0.01, contextWindow: 128000, speed: "quality" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", capabilities: ["code","general","chat"], costPer1kTokens: 0.002, contextWindow: 128000, speed: "fast" },
    ] },
  { id: "gemini-omniroute", name: "Gemini via OmniRoute", isFree: false, priority: 5,
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", capabilities: ["code","research","reasoning","general","chat"], costPer1kTokens: 0.00015, contextWindow: 1048576, speed: "fast" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", capabilities: ["code","research","reasoning","creative","chat"], costPer1kTokens: 0.00125, contextWindow: 1048576, speed: "balanced" },
    ] },
  { id: "deepseek-omniroute", name: "DeepSeek via OmniRoute", isFree: false, priority: 6,
    models: [{ id: "deepseek-chat", name: "DeepSeek Chat", capabilities: ["code","reasoning","general","chat"], costPer1kTokens: 0.0005, contextWindow: 128000, speed: "balanced" }] },
  { id: "grok-omniroute", name: "Grok via OmniRoute", isFree: false, priority: 7,
    models: [{ id: "grok-3", name: "Grok 3", capabilities: ["code","research","reasoning","creative","chat"], costPer1kTokens: 0.002, contextWindow: 131072, speed: "balanced" }] },
  { id: "free-omniroute", name: "Free Tier Pool via OmniRoute", isFree: true, priority: 20,
    models: [
      { id: "oc/free", name: "OpenCode Free", capabilities: ["code","general","chat"], costPer1kTokens: 0, contextWindow: 128000, speed: "fast" },
      { id: "felo/free", name: "Felo Free", capabilities: ["research","general","chat"], costPer1kTokens: 0, contextWindow: 128000, speed: "fast" },
      { id: "pollinations/free", name: "Pollinations Free", capabilities: ["general","chat","creative"], costPer1kTokens: 0, contextWindow: 32768, speed: "fast" },
      { id: "kiro/free", name: "Kiro Free", capabilities: ["general","chat"], costPer1kTokens: 0, contextWindow: 16384, speed: "fast" },
    ] },
];

export class OmniRouteHub {
  private bridge: OmniRouteBridge;
  private aiBridge: AIProviderBridge;

  constructor(aiBridge: AIProviderBridge, config?: Partial<OmniRouteConfig>) {
    this.bridge = new OmniRouteBridge(aiBridge, config);
    this.aiBridge = aiBridge;
  }

  async initialize(): Promise<number> {
    console.log(`\n════════════════════════════════════════════════════`);
    console.log(`   OMNIROUTE HUB - UNIVERSAL AI GATEWAY`);
    console.log(`   290+ Providers · 500+ Models · Auto-Fallback`);
    console.log(`   RTK+Caveman Compression · MCP/A2A · Dashboard`);
    console.log(`════════════════════════════════════════════════════\n`);

    const baseCount = await this.bridge.initialize();

    for (const spec of OMNIROUTE_CATALOG) {
      const config: AIProviderConfig = {
        id: `omniroute-${spec.id}` as any,
        name: spec.name,
        isLocal: false,
        priority: spec.priority,
        models: spec.models.map(m => ({ ...m })),
        baseUrl: spec.baseUrl || `http://localhost:${this.bridge["config"].port}/v1`,
      };
      this.aiBridge.registerExternalProvider(
        config.id as any,
        this.bridge.provider as unknown as ILLMProvider,
        config
      );
    }

    const totalModels = this.countModels();
    console.log(`  [OmniRouteHub] ✓ ${totalModels} modelos registrados via OmniRoute`);
    console.log(`  [OmniRouteHub] ✓ Providers: ${OMNIROUTE_CATALOG.length} pools catalogados`);
    console.log(`  [OmniRouteHub] ✓ Free tiers: 90+ provedores gratuitos`);
    console.log(`  [OmniRouteHub] ✓ Dashboard: http://localhost:${this.bridge["config"].port}`);
    console.log(`  [OmniRouteHub] ✓ Endpoint: ${this.bridge["config"].baseUrl}/v1`);
    console.log(`  [OmniRouteHub] ✓ ~1.53B tokens grátis/mês disponíveis\n`);

    return totalModels;
  }

  private countModels(): number {
    return OMNIROUTE_CATALOG.reduce((acc, p) => acc + p.models.length, 0);
  }

  getStats() {
    const base = this.bridge.getStats();
    return { ...base, pools: OMNIROUTE_CATALOG.length, totalModels: this.countModels() };
  }

  stop(): void {
    this.bridge.stop();
  }
}
