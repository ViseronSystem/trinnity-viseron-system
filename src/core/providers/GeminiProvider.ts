import { ILLMProvider, LLMRequest, LLMResponse } from "./BaseProvider";
import { ModelProvider } from "../types";

export class GeminiProvider implements ILLMProvider {
  public providerId: ModelProvider = "gemini";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const model = request.modelName || "gemini-2.0-flash";

    if (!this.apiKey) {
      return {
        provider: this.providerId,
        modelName: model,
        text: `[Gemini Google Connector Ready] (Respuesta simulada sin API Key): ${request.prompt}`,
        latencyMs: Date.now() - start
      };
    }

    try {
      const axios = require("axios");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      const response = await axios.post(url, {
        contents: [
          {
            parts: [
              ...(request.systemPrompt ? [{ text: `System: ${request.systemPrompt}\n` }] : []),
              { text: request.prompt }
            ]
          }
        ]
      });

      const text = response.data.candidates[0]?.content?.parts[0]?.text || "";
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
        text: `[Gemini Error Fallback]: ${err.message || String(err)}`,
        latencyMs: Date.now() - start
      };
    }
  }
}
