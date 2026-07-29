import { ILLMProvider, LLMRequest, LLMResponse } from "../providers/BaseProvider";
import { OllamaProvider } from "../providers/OllamaProvider";
import { OpenAIProvider } from "../providers/OpenAIProvider";
import { ClaudeProvider } from "../providers/ClaudeProvider";
import { GeminiProvider } from "../providers/GeminiProvider";
import { GrokProvider } from "../providers/GrokProvider";
import { MemoryEngine } from "../memory/MemoryEngine";

export type AIProviderId =
  | "ollama" | "deepseek" | "qwen" | "mistral"
  | "openai" | "claude" | "gemini" | "grok"
  | "cohere" | "ai21" | "together" | "replicate"
  | "huggingface" | "perplexity" | "anthropic" | "xai";

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  models: AIModelSpec[];
  baseUrl?: string;
  apiKey?: string;
  isLocal: boolean;
  priority: number;
}

export interface AIModelSpec {
  id: string;
  name: string;
  capabilities: string[];
  costPer1kTokens: number;
  contextWindow: number;
  speed: "fast" | "balanced" | "quality";
}

export interface AIBridgeRequest {
  prompt: string;
  systemPrompt?: string;
  modelId?: string;
  providerId?: AIProviderId;
  temperature?: number;
  maxTokens?: number;
  taskType?: "code" | "research" | "reasoning" | "general" | "creative" | "chat";
  strategy?: "single" | "compare" | "ensemble" | "fallback";
}

export interface AIBridgeResponse {
  success: boolean;
  text: string;
  provider: AIProviderId;
  model: string;
  latencyMs: number;
  cost: number;
  tokens?: { prompt: number; completion: number; total: number };
}

export interface AIModelCompareResult {
  model: string;
  provider: AIProviderId;
  text: string;
  latencyMs: number;
  cost: number;
  tokens: number;
}

export class AIProviderBridge {
  private providers: Map<AIProviderId, ILLMProvider>;
  private providerConfigs: Map<AIProviderId, AIProviderConfig>;
  private memory: MemoryEngine;
  private requestLog: AIBridgeResponse[] = [];

  static readonly ALL_PROVIDERS: AIProviderConfig[] = [
    { id: "openai", name: "OpenAI", isLocal: false, priority: 1,
      models: [
        { id: "gpt-4o", name: "GPT-4o", capabilities: ["code","research","reasoning","general","creative","chat"], costPer1kTokens: 0.01, contextWindow: 128000, speed: "quality" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", capabilities: ["code","general","chat"], costPer1kTokens: 0.002, contextWindow: 128000, speed: "fast" },
        { id: "o1", name: "o1", capabilities: ["reasoning","research","code"], costPer1kTokens: 0.015, contextWindow: 200000, speed: "quality" },
      ],
      baseUrl: "https://api.openai.com/v1" },
    { id: "claude", name: "Anthropic Claude", isLocal: false, priority: 2,
      models: [
        { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", capabilities: ["code","research","reasoning","creative","chat"], costPer1kTokens: 0.003, contextWindow: 200000, speed: "balanced" },
        { id: "claude-opus-4-20250514", name: "Claude Opus 4", capabilities: ["code","research","reasoning","creative","chat"], costPer1kTokens: 0.015, contextWindow: 200000, speed: "quality" },
      ],
      baseUrl: "https://api.anthropic.com/v1" },
    { id: "gemini", name: "Google Gemini", isLocal: false, priority: 3,
      models: [
        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", capabilities: ["code","research","reasoning","general","chat"], costPer1kTokens: 0.00015, contextWindow: 1048576, speed: "fast" },
        { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", capabilities: ["code","research","reasoning","creative","chat"], costPer1kTokens: 0.00125, contextWindow: 1048576, speed: "balanced" },
      ],
      baseUrl: "https://generativelanguage.googleapis.com/v1beta" },
    { id: "grok", name: "xAI Grok", isLocal: false, priority: 4,
      models: [
        { id: "grok-3", name: "Grok 3", capabilities: ["code","research","reasoning","creative","chat"], costPer1kTokens: 0.002, contextWindow: 131072, speed: "balanced" },
      ],
      baseUrl: "https://api.x.ai/v1" },
    { id: "mistral", name: "Mistral AI", isLocal: false, priority: 5,
      models: [
        { id: "mistral-large", name: "Mistral Large", capabilities: ["code","reasoning","general","chat"], costPer1kTokens: 0.002, contextWindow: 128000, speed: "balanced" },
        { id: "mistral-small", name: "Mistral Small", capabilities: ["general","chat"], costPer1kTokens: 0.001, contextWindow: 32000, speed: "fast" },
      ],
      baseUrl: "https://api.mistral.ai/v1" },
    { id: "cohere", name: "Cohere", isLocal: false, priority: 6,
      models: [
        { id: "command-a", name: "Command A", capabilities: ["reasoning","general","chat"], costPer1kTokens: 0.0015, contextWindow: 128000, speed: "balanced" },
      ],
      baseUrl: "https://api.cohere.ai/v1" },
    { id: "deepseek", name: "DeepSeek", isLocal: false, priority: 7,
      models: [
        { id: "deepseek-chat", name: "DeepSeek Chat", capabilities: ["code","reasoning","general","chat"], costPer1kTokens: 0.0005, contextWindow: 128000, speed: "balanced" },
      ],
      baseUrl: "https://api.deepseek.com/v1" },
    { id: "ollama", name: "Ollama (Local)", isLocal: true, priority: 8,
      models: [
        { id: "llama3", name: "Llama 3", capabilities: ["general","chat","code"], costPer1kTokens: 0, contextWindow: 8192, speed: "fast" },
        { id: "qwen2", name: "Qwen 2", capabilities: ["code","general","chat"], costPer1kTokens: 0, contextWindow: 32768, speed: "fast" },
        { id: "mistral", name: "Mistral", capabilities: ["general","chat","reasoning"], costPer1kTokens: 0, contextWindow: 8192, speed: "fast" },
      ],
      baseUrl: "http://localhost:11434" },
    { id: "huggingface", name: "HuggingFace Inference", isLocal: false, priority: 9,
      models: [
        { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama 3.3 70B", capabilities: ["reasoning","general","chat","code"], costPer1kTokens: 0.0005, contextWindow: 8192, speed: "balanced" },
        { id: "mistralai/Mixtral-8x22B-Instruct", name: "Mixtral 8x22B", capabilities: ["code","reasoning","general","chat"], costPer1kTokens: 0.0004, contextWindow: 65536, speed: "balanced" },
      ],
      baseUrl: "https://api-inference.huggingface.co/v1" },
    { id: "together", name: "Together AI", isLocal: false, priority: 10,
      models: [
        { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Llama 3.3 70B Turbo", capabilities: ["code","reasoning","general","chat"], costPer1kTokens: 0.0005, contextWindow: 8192, speed: "fast" },
      ],
      baseUrl: "https://api.together.xyz/v1" },
    { id: "perplexity", name: "Perplexity AI", isLocal: false, priority: 11,
      models: [
        { id: "sonar-pro", name: "Sonar Pro", capabilities: ["research","reasoning","general"], costPer1kTokens: 0.001, contextWindow: 128000, speed: "balanced" },
      ],
      baseUrl: "https://api.perplexity.ai" },
  ];

  constructor(memory?: MemoryEngine) {
    this.providers = new Map();
    this.providerConfigs = new Map();
    this.memory = memory || new MemoryEngine();

    for (const cfg of AIProviderBridge.ALL_PROVIDERS) {
      this.providerConfigs.set(cfg.id, cfg);
    }

    this.registerInternalProviders();
  }

  private registerInternalProviders(): void {
    const registry: [AIProviderId, ILLMProvider][] = [
      ["ollama", new OllamaProvider()],
      ["openai", new OpenAIProvider()],
      ["claude", new ClaudeProvider()],
      ["gemini", new GeminiProvider()],
      ["grok", new GrokProvider()],
    ];
    for (const [id, provider] of registry) {
      this.providers.set(id, provider);
    }
  }

  registerExternalProvider(id: AIProviderId, provider: ILLMProvider, config: AIProviderConfig): void {
    this.providers.set(id, provider);
    this.providerConfigs.set(id, config);
    this.memory.addKnowledge(`Provider registered: ${id}`, "AI_PROVIDERS",
      `${config.name} registered with ${config.models.length} models`, ["ai", "provider", id]);
  }

  getAvailableProviders(): AIProviderConfig[] {
    return Array.from(this.providerConfigs.values());
  }

  getModelsByCapability(capability: string): AIModelSpec[] {
    const models: AIModelSpec[] = [];
    for (const cfg of this.providerConfigs.values()) {
      for (const model of cfg.models) {
        if (model.capabilities.includes(capability)) {
          models.push(model);
        }
      }
    }
    return models.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens);
  }

  getBestModelForTask(taskType: string, preferLocal: boolean = false): { provider: AIProviderId; model: AIModelSpec; config: AIProviderConfig } | null {
    let best: { provider: AIProviderId; model: AIModelSpec; config: AIProviderConfig } | null = null;
    let bestScore = -1;

    for (const [id, cfg] of this.providerConfigs) {
      if (preferLocal && !cfg.isLocal) continue;
      for (const model of cfg.models) {
        if (!model.capabilities.includes(taskType)) continue;
        let score = 0;
        if (model.speed === "fast") score += 10;
        else if (model.speed === "balanced") score += 5;
        if (model.costPer1kTokens === 0) score += 20;
        else score += Math.max(0, 10 - model.costPer1kTokens * 1000);
        score += Math.min(10, model.contextWindow / 10000);
        if (cfg.priority < 5) score += 5;
        if (cfg.isLocal) score += 3;
        if (score > bestScore) {
          bestScore = score;
          best = { provider: id, model, config: cfg };
        }
      }
    }
    return best;
  }

  async chat(request: AIBridgeRequest): Promise<AIBridgeResponse> {
    const startTime = Date.now();

    let providerId = request.providerId || "openai";
    let modelId = request.modelId;
    const taskType = request.taskType || "general";

    if (!modelId && !request.providerId) {
      const best = this.getBestModelForTask(taskType);
      if (best) {
        providerId = best.provider;
        modelId = best.model.id;
      }
    }

    const provider = this.providers.get(providerId);
    const config = this.providerConfigs.get(providerId);

    if (!provider) {
      const fallback = await this.fallback(request, [providerId]);
      return fallback;
    }

    try {
      const llmRequest: LLMRequest = {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        temperature: request.temperature ?? 0.7,
        maxTokens: request.maxTokens ?? 4096,
        modelName: modelId,
      };

      const response = await provider.generateResponse(llmRequest);
      const latency = Date.now() - startTime;
      const cost = config ? this.calculateCost(modelId || response.modelName, response.usage?.totalTokens || 0) : 0;

      const bridgeResponse: AIBridgeResponse = {
        success: true,
        text: response.text,
        provider: providerId,
        model: response.modelName,
        latencyMs: latency,
        cost,
        tokens: response.usage ? { prompt: response.usage.promptTokens, completion: response.usage.completionTokens, total: response.usage.totalTokens } : undefined,
      };

      this.requestLog.push(bridgeResponse);
      this.memory.addKnowledge(`AI Request: ${request.prompt.slice(0, 50)}...`, "AI_REQUESTS",
        `[${providerId}] ${response.text.slice(0, 200)}...`, ["ai", providerId, taskType]);

      return bridgeResponse;
    } catch (error: any) {
      return await this.fallback(request, [providerId]);
    }
  }

  private async fallback(request: AIBridgeRequest, exclude: AIProviderId[]): Promise<AIBridgeResponse> {
    const startTime = Date.now();
    const fallbackOrder: AIProviderId[] = ["openai", "claude", "gemini", "grok", "mistral", "ollama"];

    for (const altId of fallbackOrder) {
      if (exclude.includes(altId)) continue;
      const provider = this.providers.get(altId);
      if (!provider) continue;

      try {
        const response = await provider.generateResponse({
          prompt: request.prompt,
          systemPrompt: request.systemPrompt,
          temperature: request.temperature ?? 0.7,
          maxTokens: request.maxTokens ?? 4096,
        });

        return {
          success: true, text: response.text, provider: altId,
          model: response.modelName, latencyMs: Date.now() - startTime,
          cost: 0, tokens: response.usage ? { prompt: response.usage.promptTokens, completion: response.usage.completionTokens, total: response.usage.totalTokens } : undefined,
        };
      } catch { continue; }
    }

    return { success: false, text: "All AI providers failed", provider: "ollama", model: "none", latencyMs: Date.now() - startTime, cost: 0 };
  }

  async compareModels(request: AIBridgeRequest, modelIds: string[]): Promise<AIModelCompareResult[]> {
    const results: AIModelCompareResult[] = [];
    for (const modelId of modelIds) {
      try {
        const res = await this.chat({ ...request, modelId, strategy: "single" });
        results.push({ model: res.model, provider: res.provider, text: res.text, latencyMs: res.latencyMs, cost: res.cost, tokens: res.tokens?.total || 0 });
      } catch { continue; }
    }
    return results;
  }

  async ensemble(request: AIBridgeRequest, providers: AIProviderId[]): Promise<AIBridgeResponse> {
    const results = await Promise.allSettled(
      providers.map(p => this.chat({ ...request, providerId: p, strategy: "single" }))
    );

    const successful: AIBridgeResponse[] = [];
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.success) successful.push(r.value);
    }

    if (successful.length === 0) {
      return { success: false, text: "Ensemble: all providers failed", provider: "ollama" as AIProviderId, model: "none", latencyMs: 0, cost: 0 };
    }

    const best = successful.reduce((a, b) => a.latencyMs < b.latencyMs ? a : b);
    return { ...best, text: `[Ensemble ${successful.length}/${providers.length}]\n${best.text}` };
  }

  getStats(): { totalRequests: number; successRate: number; avgLatency: number; totalCost: number; providersAvailable: number } {
    if (this.requestLog.length === 0) {
      return { totalRequests: 0, successRate: 0, avgLatency: 0, totalCost: 0, providersAvailable: this.providers.size };
    }
    const success = this.requestLog.filter(r => r.success).length;
    return {
      totalRequests: this.requestLog.length,
      successRate: success / this.requestLog.length * 100,
      avgLatency: this.requestLog.reduce((a, r) => a + r.latencyMs, 0) / this.requestLog.length,
      totalCost: this.requestLog.reduce((a, r) => a + r.cost, 0),
      providersAvailable: this.providers.size,
    };
  }

  private calculateCost(modelName: string, totalTokens: number): number {
    for (const cfg of this.providerConfigs.values()) {
      for (const model of cfg.models) {
        if (model.id === modelName || model.name === modelName) {
          return (totalTokens / 1000) * model.costPer1kTokens;
        }
      }
    }
    return 0;
  }
}
