import { ILLMProvider, LLMRequest, LLMResponse } from "./BaseProvider";
import { ModelProvider } from "../types";

export class ClaudeProvider implements ILLMProvider {
  public providerId: ModelProvider = "claude";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const model = request.modelName || "claude-3-7-sonnet";

    if (!this.apiKey) {
      return {
        provider: this.providerId,
        modelName: model,
        text: `[Claude Anthropic Connector Ready] (Respuesta simulada sin API Key): ${request.prompt}`,
        latencyMs: Date.now() - start
      };
    }

    try {
      const axios = require("axios");
      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model,
          max_tokens: request.maxTokens || 1024,
          system: request.systemPrompt,
          messages: [{ role: "user", content: request.prompt }]
        },
        {
          headers: {
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          }
        }
      );

      const text = response.data.content[0]?.text || "";
      return {
        provider: this.providerId,
        modelName: model,
        text,
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        provider: this.providerId,
        modelName: model,
        text: `[Claude Error Fallback]: ${err.message || String(err)}`,
        latencyMs: Date.now() - start
      };
    }
  }
}
