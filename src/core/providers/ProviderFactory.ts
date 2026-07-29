import { ILLMProvider, LLMRequest, LLMResponse } from "./BaseProvider";
import { OllamaProvider } from "./OllamaProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { ClaudeProvider } from "./ClaudeProvider";
import { GeminiProvider } from "./GeminiProvider";
import { GrokProvider } from "./GrokProvider";
import { ModelProvider } from "../types";

export class ProviderFactory {
  private providers: Map<ModelProvider, ILLMProvider> = new Map();

  constructor() {
    this.registerProvider(new OllamaProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new ClaudeProvider());
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new GrokProvider());
  }

  public registerProvider(provider: ILLMProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  public getProvider(providerId: ModelProvider): ILLMProvider | undefined {
    return this.providers.get(providerId);
  }

  public async generate(providerId: ModelProvider, request: LLMRequest): Promise<LLMResponse> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`[ProviderFactory] Proveedor LLM '${providerId}' no registrado.`);
    }
    return await provider.generateResponse(request);
  }
}
