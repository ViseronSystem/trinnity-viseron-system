import { ILLMProvider, LLMRequest, LLMResponse, ProviderCapabilities, ProviderHealth } from "../../core/providers/BaseProvider";
import { ModelProvider } from "../../core/types";
import { ProviderExecutionError, RealityMode } from "../../core/policy";
import axios from "axios";

export class OmniRouteProvider implements ILLMProvider {
  public providerId: ModelProvider = "omniroute" as ModelProvider;
  public readonly mode: RealityMode = "EXPERIMENTAL";
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
        if (res.status >= 200 && res.status < 500) return true;
      } catch (err: any) {
        if (err?.response?.status && err.response.status >= 200 && err.response.status < 500) return true;
      }
    }
    return false;
  }

  async health(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await axios.get(`${this.baseUrl}/v1/models`, { timeout: 3000 });
      return { ok: true, latencyMs: Date.now() - start, detail: `gateway reachable (HTTP ${res.status})`, checkedAt: Date.now() };
    } catch (e: any) {
      return { ok: false, latencyMs: Date.now() - start, detail: e?.message || "unreachable", checkedAt: Date.now() };
    }
  }

  capabilities(): ProviderCapabilities {
    return {
      tasks: ["code", "reasoning", "research", "general", "creative", "automation"],
      contextWindow: 131072,
      isLocal: false,
      hasCredentials: true,
    };
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
          stream: false,
        },
        { timeout: 120000 }
      );

      const data = res.data;
      const text = data.choices?.[0]?.message?.content || "";
      if (!text.trim()) {
        throw new ProviderExecutionError("omniroute", "resposta vazia do gateway");
      }
      return {
        provider: "omniroute" as ModelProvider,
        modelName: data.model || model,
        text,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      if (error instanceof ProviderExecutionError) throw error;
      if (error.response?.data?.error?.message) {
        throw new ProviderExecutionError("omniroute", error.response.data.error.message);
      }
      throw new ProviderExecutionError("omniroute", error.message || "Unknown error");
    }
  }
}
