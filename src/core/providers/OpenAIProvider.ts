import { ILLMProvider, LLMRequest, LLMResponse } from "./BaseProvider";
import { ModelProvider } from "../types";

export class OpenAIProvider implements ILLMProvider {
  public providerId: ModelProvider = "openai";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const model = request.modelName || "gpt-4o";

    if (!this.apiKey) {
      return {
        provider: this.providerId,
        modelName: model,
        text: `[OpenAI Connector Ready] (Respuesta simulada sin API Key configurada): ${request.prompt}`,
        latencyMs: Date.now() - start
      };
    }

    try {
      // Invocación a API OpenAI si la key está presente
      const axios = require("axios");
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model,
          messages: [
            ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
            { role: "user", content: request.prompt }
          ],
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 1024
        },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` }
        }
      );

      const content = response.data.choices[0]?.message?.content || "";
      return {
        provider: this.providerId,
        modelName: model,
        text: content,
        usage: {
          promptTokens: response.data.usage?.prompt_tokens || 0,
          completionTokens: response.data.usage?.completion_tokens || 0,
          totalTokens: response.data.usage?.total_tokens || 0
        },
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        provider: this.providerId,
        modelName: model,
        text: `[OpenAI Error Fallback]: ${err.message || String(err)}`,
        latencyMs: Date.now() - start
      };
    }
  }
}
