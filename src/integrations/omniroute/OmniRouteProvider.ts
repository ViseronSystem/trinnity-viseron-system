import { ILLMProvider, LLMRequest, LLMResponse } from "../../core/providers/BaseProvider";
import { ModelProvider } from "../../core/types";
import axios from "axios";

export class OmniRouteProvider implements ILLMProvider {
  public providerId: ModelProvider = "omniroute" as ModelProvider;
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:20128") {
    this.baseUrl = baseUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  async isAvailable(): Promise<boolean> {
    for (const probe of ["/api/health", "/v1/models", "/health", "/"]) {
      try {
        const res = await axios.get(`${this.baseUrl}${probe}`, { timeout: 1500 });
        if (res.status) return true;
      } catch (err: any) {
        if (err?.response?.status) return true;
      }
    }
    return false;
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const model = request.modelName || "auto";

    try {
      const res = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model,
          messages: [
            ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
            { role: "user", content: request.prompt }
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 4096,
        },
        { timeout: 120000 }
      );

      const data = res.data;
      return {
        provider: "omniroute" as ModelProvider,
        modelName: data.model || model,
        text: data.choices?.[0]?.message?.content || "",
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(`[OmniRoute] ${error.response.data.error.message}`);
      }
      throw new Error(`[OmniRoute] ${error.message || "Unknown error"}`);
    }
  }
}
