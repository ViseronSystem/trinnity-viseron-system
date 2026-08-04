import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ModelRouter } from "../../core/model-router/ModelRouter";
import { ModelProvider, ModelRoutingCriteria } from "../../core/types";

export type AITaskType = "code" | "research" | "reasoning" | "general" | "creative" | "automation" | "vision" | "privacy";

export interface AIRouteResult {
  provider: string;
  modelName: string;
  isLocal: boolean;
  text: string;
  latencyMs: number;
  strategy: string;
}

export interface AIRouterOptions {
  fallbackChain?: ModelProvider[];
  defaultProvider?: ModelProvider;
}

const PROVIDER_BY_TASK: Record<string, { provider: ModelProvider; strategy: string }> = {
  creative: { provider: "openai", strategy: "creative→openai" },
  reasoning: { provider: "claude", strategy: "reasoning→claude" },
  research: { provider: "claude", strategy: "research→claude" },
  multimodal: { provider: "gemini", strategy: "multimodal→gemini" },
  vision: { provider: "gemini", strategy: "vision→gemini" },
  code: { provider: "deepseek", strategy: "code→deepseek" },
  privacy: { provider: "ollama", strategy: "privacy→local" },
  automation: { provider: "omniroute", strategy: "automation→omniroute" },
  general: { provider: "ollama", strategy: "general→local" },
};

export class AIRouter {
  private readonly providerFactory: ProviderFactory;
  private readonly modelRouter: ModelRouter;
  private readonly fallbackChain: ModelProvider[];
  private readonly defaultProvider: ModelProvider;

  constructor(providerFactory?: ProviderFactory, modelRouter?: ModelRouter, options: AIRouterOptions = {}) {
    this.providerFactory = providerFactory ?? new ProviderFactory();
    this.modelRouter = modelRouter ?? new ModelRouter();
    this.fallbackChain = options.fallbackChain ?? ["ollama", "omniroute", "openai", "claude", "gemini", "grok"];
    this.defaultProvider = options.defaultProvider ?? "ollama";
  }

  public route(criteria: ModelRoutingCriteria) {
    return this.modelRouter.route(criteria);
  }

  public async resolve(task: string, opts?: { taskType?: ModelRoutingCriteria["taskType"]; privacyRequired?: "HIGH" | "MEDIUM" | "LOW"; forceLocal?: boolean }): Promise<AIRouteResult> {
    const start = Date.now();
    const taskType = this.inferTaskType(task);
    const chain = this.buildChain(taskType, opts);
    const lastError: string[] = [];

    for (const providerId of chain) {
      const result = await this.tryProvider(providerId, task, opts);
      if (result) {
        return { ...result, latencyMs: Date.now() - start, strategy: `fallback:${providerId}` };
      }
      lastError.push(providerId);
    }

    return {
      provider: "internal",
      modelName: "built-in",
      isLocal: true,
      text: `[AIRouter] Nenhum provedor disponível (${lastError.join(", ")}). Resposta interna do sistema.`,
      latencyMs: Date.now() - start,
      strategy: "internal-fallback",
    };
  }

  private buildChain(taskType: string, opts?: { forceLocal?: boolean; privacyRequired?: "HIGH" | "MEDIUM" | "LOW" }): ModelProvider[] {
    if (opts?.forceLocal || opts?.privacyRequired === "HIGH") {
      return this.chainStartingAt("ollama");
    }
    const preferred = PROVIDER_BY_TASK[taskType]?.provider;
    return preferred ? this.chainStartingAt(preferred) : this.fallbackChain;
  }

  private chainStartingAt(preferred: ModelProvider): ModelProvider[] {
    const ordered = [preferred, ...this.fallbackChain.filter((p) => p !== preferred)];
    return Array.from(new Set(ordered));
  }

  private async tryProvider(providerId: ModelProvider, task: string, opts?: any): Promise<Omit<AIRouteResult, "latencyMs" | "strategy"> | null> {
    try {
      const provider = this.providerFactory.getProvider(providerId);
      if (!provider) return null;
      const available = await provider.isAvailable();
      if (!available) return null;
      const response = await provider.generateResponse({
        prompt: `## Tarefa\n${task}\n\nForneça uma resposta completa, prática e acionável.`,
        temperature: 0.6,
        maxTokens: 1024,
      });
      if (!response?.text) return null;
      return {
        provider: response.provider || providerId,
        modelName: response.modelName || "auto",
        isLocal: ["ollama", "deepseek", "qwen", "mistral"].includes(providerId),
        text: response.text,
      };
    } catch {
      return null;
    }
  }

  public inferTaskType(task: string): AITaskType {
    const t = task.toLowerCase();
    if (t.includes("imagem") || t.includes("imagen") || t.includes("foto") || t.includes("camera") || t.includes("image") || t.includes("visão") || t.includes("vision")) return "vision";
    if (t.includes("código") || t.includes("codigo") || t.includes("programar") || t.includes("desarrollar") || t.includes("desenvolver") || t.includes("code") || t.includes("bug")) return "code";
    if (t.includes("investigar") || t.includes("research") || t.includes("pesquisar") || t.includes("analys") || t.includes("analiz")) return "research";
    if (t.includes("razonar") || t.includes("raciocinar") || t.includes("arquitectura") || t.includes("arquitetura") || t.includes("diseñar") || t.includes("reason")) return "reasoning";
    if (t.includes("privacidad") || t.includes("privacidade") || t.includes("confidencial") || t.includes("local")) return "privacy";
    if (t.includes("automatizar") || t.includes("automatizar") || t.includes("deploy") || t.includes("automation")) return "automation";
    if (t.includes("crear") || t.includes("criar") || t.includes("create") || t.includes("marketing") || t.includes("proposta") || t.includes("propuesta")) return "creative";
    return "general";
  }

}
