import axios from "axios";
import { ILLMProvider, LLMRequest, LLMResponse } from "./BaseProvider";
import { ModelProvider } from "../types";

export class OllamaProvider implements ILLMProvider {
  public providerId: ModelProvider = "ollama";
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
    const model = this.pickModel(request.modelName);

    try {
      const available = await this.detectModels();
      const finalModel = available.length && !available.includes(model)
        ? (available[0] || model)
        : model;

      const res = await axios.post(`${this.host}/api/generate`, {
        model: finalModel,
        prompt: request.prompt,
        system: request.systemPrompt,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 2048
        }
      }, { timeout: 150000 });

      return {
        provider: this.providerId,
        modelName: finalModel,
        text: res.data.response || "",
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        provider: this.providerId,
        modelName: model,
        text: `[Ollama Mock Response]: ${request.prompt}`,
        latencyMs: Date.now() - start
      };
    }
  }
}
