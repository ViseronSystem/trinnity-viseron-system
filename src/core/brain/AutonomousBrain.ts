import * as path from "path";
import { ViseronModelRouter } from "../model-router/ViseronModelRouter";
import { ComposioBridge } from "../composio/ComposioBridge";
import { ToolManager } from "../tools/ToolManager";
import { TaskPlanner, ExecutionPlan, PlanOptions } from "./TaskPlanner";
import { ToolExecutor, ToolExecution } from "./ToolExecutor";
import { LearningEngine, LearningRecord, LearningStats } from "./LearningEngine";

/**
 * AutonomousBrain — Cérebro autônomo central do Trinnity Viseron System.
 * 
 * Unifica planejamento, execução, aprendizagem e adaptação num único pipeline:
 * 
 *   Request → Plan → Execute → Learn → Adapt → Response
 * 
 * Capacidades reais:
 *   - Pensar: analisa e planeja passos
 *   - Pesquisar: busca informações via IA e web
 *   - Programar: gera e executa código
 *   - Criar: sites, apps, documentos, conteúdo
 *   - Automatizar: integra Composio (1000+ apps)
 *   - Auditar: revisa código, segurança, performance
 *   - Aprender: regista cada execução e melhora
 *   - Corrigir: identifica e resolve erros
 *   - Operar: gere empresas, clientes, receita
 *   - Coordenar: delega a agentes especializados
 *   - Adaptar: personaliza soluções por cliente
 *   - Evoluir: melhoria contínua baseada em dados
 */

export interface BrainRequest {
  message: string;
  sessionId?: string;
  clientContext?: string;
  language?: "es" | "pt" | "en";
  maxSteps?: number;
  preferLocal?: boolean;
}

export interface BrainResponse {
  success: boolean;
  reply: string;
  plan: ExecutionPlan;
  results: ToolExecution[];
  lessons: string[];
  durationMs: number;
  provider: string;
  model: string;
  actions: Array<{ tool: string; detail: string; ok: boolean }>;
}

export interface BrainStatus {
  configured: boolean;
  composioConnected: boolean;
  composioTools: number;
  modelRouterAvailable: boolean;
  learningStats: LearningStats;
  totalExecutions: number;
  recentSuccessRate: number;
}

export class AutonomousBrain {
  private router: ViseronModelRouter;
  private composio: ComposioBridge;
  private toolManager: ToolManager;
  private planner: TaskPlanner;
  private executor: ToolExecutor;
  private learning: LearningEngine;
  private dataDir: string;

  constructor(options: {
    router: ViseronModelRouter;
    composio: ComposioBridge;
    toolManager: ToolManager;
    dataDir: string;
  }) {
    this.router = options.router;
    this.composio = options.composio;
    this.toolManager = options.toolManager;
    this.dataDir = options.dataDir;
    this.planner = new TaskPlanner(this.router);
    this.executor = new ToolExecutor(this.composio, this.toolManager, this.router);
    this.learning = new LearningEngine(this.dataDir);
  }

  /**
   * Pipeline completo: Request → Plan → Execute → Learn → Response
   */
  async process(request: BrainRequest): Promise<BrainResponse> {
    const start = Date.now();
    const lang = request.language || this.planner.detectLanguage(request.message);

    console.log(`[Brain] Processing: "${request.message.slice(0, 80)}..." (${lang})`);

    // 1. PLANEJAR
    const plan = await this.planner.plan(request.message, {
      language: lang,
      clientContext: request.clientContext,
      maxSteps: request.maxSteps,
      preferLocal: request.preferLocal,
    });

    console.log(`[Brain] Plan: ${plan.steps.length} steps, ~${plan.totalEstimatedSeconds}s (${plan.category})`);

    // 2. EXECUTAR cada step
    const results: ToolExecution[] = [];
    const previousResults: Record<string, any> = {};

    for (const step of plan.steps) {
      console.log(`[Brain] Executing step ${step.id}: ${step.description.slice(0, 60)}...`);

      const result = await this.executor.executeStep({
        step,
        request: request.message,
        previousResults,
        dataDir: this.dataDir,
        sessionId: request.sessionId,
        clientContext: request.clientContext,
      });

      results.push(result);
      previousResults[step.id] = result.output;

      if (!result.success) {
        console.log(`[Brain] Step ${step.id} failed: ${result.error}`);
      } else {
        console.log(`[Brain] Step ${step.id} completed in ${result.durationMs}ms`);
      }
    }

    // 3. APRENDER com o resultado
    const allSuccess = results.every(r => r.success);
    const anySuccess = results.some(r => r.success);
    const overallSuccess = results.length > 0 ? (anySuccess || allSuccess) : false;
    const errorSummary = results
      .filter(r => !r.success)
      .map(r => r.error || "unknown")
      .join("; ");

    const record = this.learning.recordExecution(
      plan,
      results,
      overallSuccess,
      errorSummary || undefined
    );

    // 4. CONSTRUIR resposta
    const reply = this.buildReply(plan, results, lang, overallSuccess);
    const actions = results.map(r => ({
      tool: `${r.toolType}:${r.toolName}`,
      detail: typeof r.output === "string"
        ? r.output.slice(0, 200)
        : JSON.stringify(r.output).slice(0, 200),
      ok: r.success,
    }));

    const durationMs = Date.now() - start;
    const lastTrace = this.router.lastTrace;

    console.log(`[Brain] Completed in ${durationMs}ms (success=${overallSuccess}, steps=${results.length})`);

    return {
      success: overallSuccess,
      reply,
      plan,
      results,
      lessons: record.lessonsLearned,
      durationMs,
      provider: lastTrace.chosen || "internal",
      model: lastTrace.model || "none",
      actions,
    };
  }

  /**
   * Processa um pedido simples (sem planejamento complexo)
   */
  async quickProcess(message: string, lang?: "es" | "pt" | "en"): Promise<string> {
    const response = await this.process({
      message,
      language: lang,
      maxSteps: 1,
    });
    return response.reply;
  }

  /**
   * Status completo do brain
   */
  async getStatus(): Promise<BrainStatus> {
    let composioConnected = false;
    let composioTools = 0;

    try {
      if (this.composio.configured) {
        await this.composio.connect();
        composioConnected = this.composio.connected;
        composioTools = this.composio.toolCount;
      }
    } catch {}

    const routerStatus = await this.router.status();
    const learningStats = this.learning.getStats();
    const recent = this.learning.getRecent(10);
    const recentSuccess = recent.filter(r => r.success).length;

    return {
      configured: true,
      composioConnected,
      composioTools,
      modelRouterAvailable: routerStatus.availableCount > 0,
      learningStats,
      totalExecutions: learningStats.totalExecutions,
      recentSuccessRate: recent.length > 0 ? Math.round((recentSuccess / recent.length) * 100) : 0,
    };
  }

  /**
   * Histórico de aprendizagem
   */
  getLearningHistory(limit?: number): LearningRecord[] {
    return this.learning.getRecent(limit);
  }

  /**
   * Sugestões de melhoria
   */
  getSuggestions(category?: string): string[] {
    return this.learning.suggestImprovements(category);
  }

  /**
   * Memória de um cliente
   */
  getClientMemory(clientId: string) {
    return this.learning.getClientMemory(clientId);
  }

  private buildReply(
    plan: ExecutionPlan,
    results: ToolExecution[],
    lang: "es" | "pt" | "en",
    success: boolean
  ): string {
    const langMap = {
      es: {
        intro: success
          ? "Tarea completada exitosamente."
          : "Tarea procesada con algunos problemas.",
        steps: "Pasos ejecutados",
        failed: "pasos fallaron",
        duration: "Duración total",
        tools: "Herramientas usadas",
        result: "Resultado",
      },
      pt: {
        intro: success
          ? "Tarefa concluída com sucesso."
          : "Tarefa processada com alguns problemas.",
        steps: "Passos executados",
        failed: "passos falharam",
        duration: "Duração total",
        tools: "Ferramentas usadas",
        result: "Resultado",
      },
      en: {
        intro: success
          ? "Task completed successfully."
          : "Task processed with some issues.",
        steps: "Steps executed",
        failed: "steps failed",
        duration: "Total duration",
        tools: "Tools used",
        result: "Result",
      },
    };

    const t = langMap[lang];
    const successfulSteps = results.filter(r => r.success).length;
    const failedSteps = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((s, r) => s + r.durationMs, 0);
    const toolsUsed = [...new Set(results.map(r => `${r.toolType}:${r.toolName}`))];

    const lines: string[] = [t.intro, ""];

    // Show step results
    for (const step of plan.steps) {
      const stepResult = results.find(r => r.stepId === step.id);
      if (stepResult) {
        const status = stepResult.success ? "✓" : "✗";
        const detail = typeof stepResult.output === "string"
          ? stepResult.output.slice(0, 150)
          : typeof stepResult.output === "object"
            ? JSON.stringify(stepResult.output).slice(0, 150)
            : String(stepResult.output).slice(0, 150);
        lines.push(`${status} ${step.description.slice(0, 80)}`);
        if (detail) lines.push(`  → ${detail}`);
      }
    }

    lines.push("");
    lines.push(`${t.steps}: ${successfulSteps}/${results.length}${failedSteps > 0 ? ` (${failedSteps} ${t.failed})` : ""}`);
    lines.push(`${t.duration}: ${Math.round(totalDuration / 1000)}s`);
    if (toolsUsed.length > 0) {
      lines.push(`${t.tools}: ${toolsUsed.join(", ")}`);
    }

    return lines.join("\n");
  }
}
