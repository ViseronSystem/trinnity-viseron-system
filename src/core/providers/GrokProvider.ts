import { ILLMProvider, LLMRequest, LLMResponse } from "./BaseProvider";
import { ModelProvider } from "../types";

export class GrokProvider implements ILLMProvider {
  public providerId: ModelProvider = "grok";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const model = request.modelName || "grok-3";

    if (!this.apiKey) {
      return {
        provider: this.providerId,
        modelName: model,
        text: `[Grok xAI Connector Ready] (Respuesta simulada sin API Key): ${request.prompt}`,
        latencyMs: Date.now() - start
      };
    }

    try {
      const axios = require("axios");
      const response = await axios.post(
        "https://api.x.ai/v1/chat/completions",
        {
          model,
          messages: [
            ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
            { role: "user", content: request.prompt }
          ],
          temperature: request.temperature || 0.7
        },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` }
        }
      );

      const text = response.data.choices[0]?.message?.content || "";
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
        text: `[Grok Error Fallback]: ${err.message || String(err)}`,
        latencyMs: Date.now() - start
      };
    }
  }
}
