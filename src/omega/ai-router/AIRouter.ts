import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ViseronModelRouter, RouterResolveResult, RouterResolveOptions, RouterTaskType } from "../../core/model-router/ViseronModelRouter";
import { ModelProvider } from "../../core/types";

export type AITaskType = RouterTaskType;

export interface AIRouteResult {
  provider: string;
  modelName: string;
  isLocal: boolean;
  text: string;
  latencyMs: number;
  strategy: string;
}

export interface AIRouterOptions {
  fallbackChain?: ModelProvider[];
  defaultProvider?: ModelProvider;
}

/**
 * AIRouter (omega) — camada fina sobre a abstração OFICIAL ViseronModelRouter.
 * Deixa de manter lógica de roteamento própria: UMA abstração, UMA cadeia,
 * avaliação dinâmica real (availability/health/capability/privacy/task_type).
 */
export class AIRouter {
  private readonly router: ViseronModelRouter;

  constructor(providerFactory?: ProviderFactory, _modelRouter?: unknown, options: AIRouterOptions = {}) {
    this.router = new ViseronModelRouter(providerFactory ?? new ProviderFactory());
    void options;
  }

  /** Seleção por critérios estruturados (retrocompatibilidade). */
  public route(criteria: any) {
    const taskType = (criteria?.taskType || "general") as RouterTaskType;
    const opts: RouterResolveOptions = {
      taskType,
      forceLocal: criteria?.forceLocal,
      privacyRequired: criteria?.privacyRequired,
      maxCostPer1kTokens: criteria?.maxCostPer1kTokens,
    };
    return {
      provider: TASK_DEFAULT[taskType] ?? "ollama",
      modelName: "auto",
      isLocal: taskType === "privacy" || !!criteria?.forceLocal || criteria?.privacyRequired === "HIGH",
      estimatedLatencyMs: 0,
      estimatedCostPer1kTokens: 0,
      reason: `rota (critérios) → ${taskType} (availability avaliada no resolve)`,
    };
  }

  public async resolve(task: string, opts?: { taskType?: RouterTaskType; privacyRequired?: "HIGH" | "MEDIUM" | "LOW"; forceLocal?: boolean }): Promise<AIRouteResult> {
    const result: RouterResolveResult = await this.router.resolve(task, {
      taskType: opts?.taskType,
      privacyRequired: opts?.privacyRequired,
      forceLocal: opts?.forceLocal,
    });
    return {
      provider: result.provider,
      modelName: result.model,
      isLocal: result.isLocal,
      text: result.ok ? result.text : `[AIRouter] Nenhum provider real disponível (${result.reason ?? "sem providers"}).`,
      latencyMs: result.latencyMs,
      strategy: result.strategy,
    };
  }

  public inferTaskType(task: string): AITaskType {
    return this.router.inferTaskType(task);
  }

  /** Estado dinâmico real dos providers. */
  public async status(): Promise<{ providers: any[]; default: string; availableCount: number }> {
    const s = await this.router.status();
    return { providers: s.providers, default: s.default, availableCount: s.availableCount };
  }
}

const TASK_DEFAULT: Record<string, string> = {
  privacy: "ollama",
  general: "ollama",
  chat: "ollama",
  code: "deepseek",
  reasoning: "claude",
  research: "claude",
  creative: "openai",
  vision: "gemini",
  automation: "omniroute",
};
