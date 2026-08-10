import { ModelProvider } from "../types";
import { RealityMode } from "../policy";

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  modelName?: string;
}

export interface LLMResponse {
  provider: ModelProvider;
  modelName: string;
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface ProviderHealth {
  ok: boolean;
  latencyMs?: number;
  detail?: string;
  checkedAt: number;
}

export interface ProviderCapabilities {
  tasks: string[];
  contextWindow: number;
  isLocal: boolean;
  hasCredentials: boolean;
}

export interface ILLMProvider {
  providerId: ModelProvider;
  /** Disponibilidade real (credenciais + endpoint acessível). NUNCA marca como disponível sem evidência. */
  isAvailable(): Promise<boolean>;
  /** Estado de saúde: verificação live com latência. */
  health(): Promise<ProviderHealth>;
  /** Capacidades reais do provider. */
  capabilities(): ProviderCapabilities;
  /**
   * Gera resposta REAL.
   * NUNCA devolve texto mock marcado como sucesso: se não houver credenciais
   * lança ProviderUnavailableError; se a API real falhar, lança ProviderExecutionError.
   */
  generateResponse(request: LLMRequest): Promise<LLMResponse>;
  /** Modo de realidade declarado do provider (REAL quando isAvailable, senão NOT_IMPLEMENTED). */
  readonly mode: RealityMode;
}
