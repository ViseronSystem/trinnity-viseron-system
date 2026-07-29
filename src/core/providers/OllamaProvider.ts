import axios from "axios";
import { ILLMProvider, LLMRequest, LLMResponse } from "./BaseProvider";
import { ModelProvider } from "../types";

export class OllamaProvider implements ILLMProvider {
  public providerId: ModelProvider = "ollama";
  private host: string;

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

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const model = request.modelName || "llama3:8b";

    try {
      const res = await axios.post(`${this.host}/api/generate`, {
        model,
        prompt: request.prompt,
        system: request.systemPrompt,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 1024
        }
      });

      return {
        provider: this.providerId,
        modelName: model,
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
