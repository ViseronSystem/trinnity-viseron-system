import { ModelProvider } from "../types";

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

export interface ILLMProvider {
  providerId: ModelProvider;
  isAvailable(): Promise<boolean>;
  generateResponse(request: LLMRequest): Promise<LLMResponse>;
}
