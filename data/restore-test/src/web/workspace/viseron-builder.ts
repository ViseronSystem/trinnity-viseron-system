import { IAgent } from "../../core/types";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ViseronModelRouter } from "../../core/model-router/ViseronModelRouter";
import {
  parseToolCalls,
  validateToolCall,
  injectRuntimeArgs,
  buildToolPlanPrompt,
  buildToolFinalPrompt,
  ToolCallResult,
} from "./tool-contract";

/**
 * VISERON BUILDER — o agente REAL do vertical slice (structured tool-calls).
 *
 * Cadeia REAL, nunca mock: a tarefa do utilizador passa pelo
 * ViseronModelRouter (avalia dinamicamente availability/health/task_type)
 * → provider local Ollama primeiro (ou cloud com credenciais reais) →
 * o texto gerado é o OUTPUT REAL devolvido ao kernel.
 *
 * Protocolo de 2 fases com o kernel OMEGA:
 *  - phase "tool_plan": o modelo (qwen2.5:3b, sem tool-calling nativo) recebe
 *    o schema das ferramentas e é OBRIGADO a emitir blocos estruturados
 *    `TOOL_CALL_START {json} TOOL_CALL_END` — a camada de structured-output
 *    valida o schema e injeta tenantId/projectId/autorização.
 *  - phase "final": após o kernel executar as tool-calls de verdade, o modelo
 *    escreve o relatório final com os resultados reais.
 *
 * Sem provider real disponível → falha HONESTA (success:false + reason
 * NOT_IMPLEMENTED), nunca texto falso apresentado como sucesso.
 */

export const VISERON_BUILDER_ID = "viseron_builder";

export function createViseronBuilder(factory?: ProviderFactory): IAgent {
  const router = new ViseronModelRouter(factory ?? new ProviderFactory());

  const base = (res: { provider: string; model: string; isLocal: boolean; mode: string; strategy?: string; latencyMs?: number }) => ({
    agentId: VISERON_BUILDER_ID,
    agentName: "VISERON BUILDER",
    model: {
      provider: res.provider,
      model: res.model,
      isLocal: res.isLocal,
      mode: res.mode,
      strategy: res.strategy,
      latencyMs: res.latencyMs,
    },
  });

  return {
    id: VISERON_BUILDER_ID,
    name: "VISERON BUILDER",
    role: "Builder",
    status: "ACTIVE",
    capabilities: ["code_build", "file_write", "test_run", "problem_solving", "documentation"],
    async execute(task: string, context?: Record<string, any>): Promise<any> {
      const phase = context?.phase ?? "single";
      const taskType = router.inferTaskType(task);

      if (phase === "tool_plan") {
        const res = await router.resolve(buildToolPlanPrompt(task, context), {
          taskType: "automation",
          maxTokens: 1024,
          temperature: 0.3,
        });
        if (!res.ok) {
          return {
            ...base(res),
            success: false,
            output: "",
            error: `sem provider real para o plano de ferramentas — ${res.reason}`,
            executionTimeMs: res.latencyMs,
            toolCalls: [],
          };
        }
        const parsed = parseToolCalls(res.text);
        const toolCalls: ToolCallResult[] = parsed.map((call) => {
          const injected = injectRuntimeArgs(call, {
            tenantId: context?.tenantId,
            projectId: context?.projectId,
            authorized: context?.authorized === true,
          });
          return { call: injected, validation: validateToolCall(injected) };
        });
        return {
          ...base(res),
          success: true,
          output: res.text,
          executionTimeMs: res.latencyMs,
          toolCalls,
          noToolCall: parsed.length === 0,
        };
      }

      if (phase === "final") {
        const tools = Array.isArray(context?.tools) ? context.tools : [];
        const res = await router.resolve(buildToolFinalPrompt(task, tools), {
          taskType: "general",
          maxTokens: 512,
        });
        if (!res.ok) {
          return {
            ...base(res),
            success: false,
            output: "",
            error: `sem provider real para o relatório final — ${res.reason}`,
            executionTimeMs: res.latencyMs,
            tools,
          };
        }
        return {
          ...base(res),
          success: true,
          output: res.text,
          executionTimeMs: res.latencyMs,
          tools,
        };
      }

      // phase "single" (sem protocolo de tools) — comportamento original.
      const res = await router.resolve(task, { taskType, maxTokens: 512 });

      if (!res.ok) {
        return {
          ...base(res),
          success: false,
          output: "",
          error: `sem provider real para "${taskType}" — ${res.reason}`,
          executionTimeMs: res.latencyMs,
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
        ...base(res),
        success: true,
        output: res.text,
        executionTimeMs: res.latencyMs,
        tools,
        project: {
          tenantId: context?.tenantId ?? null,
          projectId: context?.projectId ?? null,
        },
      };
    },
  };
}
