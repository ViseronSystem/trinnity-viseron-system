import axios from "axios";
import { ILLMProvider, LLMRequest, LLMResponse, ProviderCapabilities, ProviderHealth } from "./BaseProvider";
import { ModelProvider } from "../types";
import { ProviderExecutionError, RealityMode } from "../policy";

export class OllamaProvider implements ILLMProvider {
  public providerId: ModelProvider = "ollama";
  public readonly mode: RealityMode = "REAL";
  private host: string;
  private cachedModels: string[] | null = null;
  private cacheTime = 0;

  constructor(host?: string) {
    this.host = host || process.env.OLLAMA_HOST || "http://localhost:11434";
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.host}/api/tags`, { timeout: 2000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  public async health(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await axios.get(`${this.host}/api/tags`, { timeout: 3000 });
      const models = (res.data?.models || []).length;
      return { ok: true, latencyMs: Date.now() - start, detail: `${models} modelos locais`, checkedAt: Date.now() };
    } catch (e: any) {
      return { ok: false, latencyMs: Date.now() - start, detail: e?.message || "unreachable", checkedAt: Date.now() };
    }
  }

  public capabilities(): ProviderCapabilities {
    return {
      tasks: ["general", "chat", "code", "reasoning", "creative", "research", "automation"],
      contextWindow: 32768,
      isLocal: true,
      hasCredentials: true,
    };
  }

  private async detectModels(): Promise<string[]> {
    if (this.cachedModels && Date.now() - this.cacheTime < 30000) return this.cachedModels;
    try {
      const res = await axios.get(`${this.host}/api/tags`, { timeout: 3000 });
      const models: string[] = (res.data?.models || []).map((m: any) => m.name || m.model).filter(Boolean);
      this.cachedModels = models;
      this.cacheTime = Date.now();
      return models;
    } catch {
      return [];
    }
  }

  private pickModel(requested?: string): string {
    if (requested && requested.trim()) return requested.trim();
    const defaultModel = (process.env.OLLAMA_MODEL || "qwen2.5:3b").trim();
    return defaultModel;
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const requestedModel = this.pickModel(request.modelName);

    const available = await this.detectModels();
    if (available.length === 0) {
      throw new ProviderExecutionError("ollama", "servidor local não responde em " + this.host);
    }

    let finalModel = requestedModel;
    let fallbackReason: string | undefined;

    if (!available.includes(requestedModel)) {
      finalModel = available[0] || requestedModel;
      fallbackReason = `modelo "${requestedModel}" não disponível (disponíveis: ${available.join(", ")}) → fallback para "${finalModel}"`;
      console.warn(`[OllamaProvider] ${fallbackReason}`);
    }

    try {
      const res = await axios.post(`${this.host}/api/generate`, {
        model: finalModel,
        prompt: request.prompt,
        system: request.systemPrompt,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 2048,
        },
      }, { timeout: 150000 });

      const text = res.data.response || "";
      if (!text.trim()) {
        throw new ProviderExecutionError("ollama", "resposta vazia do modelo local");
      }
      return {
        provider: this.providerId,
        modelName: finalModel,
        text,
        latencyMs: Date.now() - start,
        ...(fallbackReason ? { _modelFallback: { requested: requestedModel, used: finalModel, reason: fallbackReason } as any } : {}),
      };
    } catch (e: any) {
      if (e instanceof ProviderExecutionError) throw e;
      throw new ProviderExecutionError("ollama", e?.message || String(e));
    }
  }
}
