import { IAgent } from "../../core/types";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ViseronModelRouter } from "../../core/model-router/ViseronModelRouter";

/**
 * VISERON BUILDER — o agente real do vertical slice.
 *
 * Cadeia REAL, nunca mock: a tarefa do utilizador passa pelo
 * ViseronModelRouter (avalia dinamicamente availability/health/task_type)
 * → provider local Ollama primeiro (ou cloud com credenciais reais) →
 * o texto gerado é o OUTPUT REAL devolvido ao kernel.
 *
 * Sem provider real disponível → falha HONESTA (success:false + reason
 * NOT_IMPLEMENTED), nunca texto falso apresentado como sucesso.
 */

export const VISERON_BUILDER_ID = "viseron_builder";

export function createViseronBuilder(factory?: ProviderFactory): IAgent {
  const router = new ViseronModelRouter(factory ?? new ProviderFactory());

  return {
    id: VISERON_BUILDER_ID,
    name: "VISERON BUILDER",
    role: "Builder",
    status: "ACTIVE",
    capabilities: ["code_build", "file_write", "test_run", "problem_solving", "documentation"],
    async execute(task: string, context?: Record<string, any>): Promise<any> {
      const start = Date.now();
      const taskType = router.inferTaskType(task);
      const res = await router.resolve(task, { taskType, maxTokens: 512 });

      const base = {
        agentId: VISERON_BUILDER_ID,
        agentName: "VISERON BUILDER",
      };

      if (!res.ok) {
        return {
          ...base,
          success: false,
          output: "",
          error: `sem provider real para "${taskType}" — ${res.reason}`,
          executionTimeMs: res.latencyMs,
          model: { provider: res.provider, model: res.model, isLocal: res.isLocal, mode: res.mode },
        };
      }

      const tools = Array.isArray(context?.tools)
        ? context.tools.map((t: any) => ({
            toolId: t?.toolId,
            success: t?.success === true,
            result: t?.result ?? null,
            error: t?.error ?? null,
          }))
        : [];

      return {
        ...base,
        success: true,
        output: res.text,
        executionTimeMs: res.latencyMs,
        model: {
          provider: res.provider,
          model: res.model,
          isLocal: res.isLocal,
          mode: res.mode,
          strategy: res.strategy,
          latencyMs: res.latencyMs,
        },
        tools,
        project: {
          tenantId: context?.tenantId ?? null,
          projectId: context?.projectId ?? null,
        },
      };
    },
  };
}
