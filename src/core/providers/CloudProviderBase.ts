import axios from "axios";
import { ILLMProvider, LLMRequest, LLMResponse, ProviderCapabilities, ProviderHealth } from "./BaseProvider";
import { ModelProvider } from "../types";
import { ProviderUnavailableError, ProviderExecutionError, RealityMode } from "../policy";

export interface CloudProviderSpec {
  id: ModelProvider;
  envKey: string;
  defaultModel: string;
  endpoint: string;
  headers: (apiKey: string) => Record<string, string>;
  body: (request: LLMRequest, model: string) => Record<string, any>;
  extract: (data: any) => { text: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } };
  tasks: string[];
  contextWindow: number;
}

/**
 * Base honesta para providers cloud:
 *  - sem credenciais → NUNCA sucesso; isAvailable=false e generateResponse lança ProviderUnavailableError.
 *  - com credenciais → chamada real; falha real lança ProviderExecutionError (nunca texto fake).
 */
export abstract class CloudProviderBase implements ILLMProvider {
  public readonly providerId: ModelProvider;
  public readonly mode: RealityMode;
  protected readonly spec: CloudProviderSpec;
  protected readonly apiKey: string | undefined;

  constructor(spec: CloudProviderSpec) {
    this.spec = spec;
    this.providerId = spec.id;
    this.apiKey = process.env[spec.envKey];
    this.mode = this.apiKey ? "REAL" : "NOT_IMPLEMENTED";
  }

  public async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    // Evidência real mínima: endpoint responde (mesmo que 401/403 sem body significa reachable).
    try {
      await axios.get(this.spec.endpoint, { timeout: 5000, headers: this.spec.headers(this.apiKey), validateStatus: () => true });
      return true;
    } catch {
      return false;
    }
  }

  public async health(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return { ok: false, detail: `credentials_unavailable (${this.spec.envKey} ausente)`, checkedAt: Date.now() };
    }
    const start = Date.now();
    try {
      await axios.get(this.spec.endpoint, { timeout: 5000, headers: this.spec.headers(this.apiKey), validateStatus: () => true });
      return { ok: true, latencyMs: Date.now() - start, detail: "endpoint reachable", checkedAt: Date.now() };
    } catch (e: any) {
      return { ok: false, latencyMs: Date.now() - start, detail: e?.message || "unreachable", checkedAt: Date.now() };
    }
  }

  public capabilities(): ProviderCapabilities {
    return {
      tasks: this.spec.tasks,
      contextWindow: this.spec.contextWindow,
      isLocal: false,
      hasCredentials: Boolean(this.apiKey),
    };
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const model = request.modelName || this.spec.defaultModel;

    if (!this.apiKey) {
      throw new ProviderUnavailableError(this.providerId, `credentials_unavailable (${this.spec.envKey})`);
    }

    try {
      const response = await axios.post(
        this.spec.endpoint,
        this.spec.body(request, model),
        { headers: this.spec.headers(this.apiKey), timeout: 120000 }
      );
      const { text, usage } = this.spec.extract(response.data);
      if (!text || !text.trim()) {
        throw new ProviderExecutionError(this.providerId, "resposta vazia da API real");
      }
      return {
        provider: this.providerId,
        modelName: model,
        text,
        usage,
        latencyMs: Date.now() - start,
      };
    } catch (e: any) {
      if (e instanceof ProviderUnavailableError || e instanceof ProviderExecutionError) throw e;
      const detail = e?.response?.data?.error?.message || e?.response?.data?.error?.type || e?.message || String(e);
      throw new ProviderExecutionError(this.providerId, String(detail).slice(0, 300));
    }
  }
}
