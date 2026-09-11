import { ViseronModelRouter } from "../model-router/ViseronModelRouter";

/**
 * TaskPlanner — Planejador autônomo que decompõe pedidos complexos em etapas executáveis.
 * 
 * Capacidades:
 *   - Análise de intenção do utilizador
 *   - Decomposição em subtarefas com dependências
 *   - Priorização e sequenciamento
 *   - Estimativa de ferramentas necessárias
 *   - Adaptação por contexto do cliente
 */

export type TaskCategory =
  | "research" | "code" | "create" | "automate"
  | "audit" | "learn" | "correct" | "operate"
  | "coordinate" | "adapt" | "evolve" | "communicate"
  | "general";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface PlannedStep {
  id: string;
  description: string;
  category: TaskCategory;
  toolsNeeded: string[];
  dependsOn: string[];
  priority: TaskPriority;
  estimatedSeconds: number;
  canParallel: boolean;
  retryable: boolean;
}

export interface ExecutionPlan {
  id: string;
  originalRequest: string;
  language: "es" | "pt" | "en";
  category: TaskCategory;
  steps: PlannedStep[];
  totalEstimatedSeconds: number;
  clientContext?: string;
  createdAt: string;
}

export interface PlanOptions {
  language?: "es" | "pt" | "en";
  clientContext?: string;
  maxSteps?: number;
  preferLocal?: boolean;
}

const PLANNING_PROMPT = `You are the Task Planner of the Trinnity Viseron System (TVS).
Analyze the user's request and decompose it into executable steps.

Return ONLY a JSON object (no markdown, no explanation) with this schema:
{
  "category": "research|code|create|automate|audit|learn|correct|operate|coordinate|adapt|evolve|communicate",
  "steps": [
    {
      "id": "step_1",
      "description": "clear description of what to do",
      "category": "same as root or more specific",
      "toolsNeeded": ["tool1", "tool2"],
      "dependsOn": [],
      "priority": "critical|high|medium|low",
      "estimatedSeconds": 30,
      "canParallel": false,
      "retryable": true
    }
  ]
}

Rules:
- Max 8 steps (merge small tasks)
- Each step must be independently executable
- Use toolsNeeded: ["composio_<app>"] for external apps, ["code"] for programming, ["file"] for file ops, ["ai"] for LLM calls, ["shell"] for commands
- dependsOn references step IDs for sequential execution
- Set canParallel=true when step has no dependencies
- Be specific: "Create a landing page for dental clinic" → steps for HTML/CSS/JS generation
- Respond in the SAME LANGUAGE as the user's request`;

export class TaskPlanner {
  private router: ViseronModelRouter;

  constructor(router: ViseronModelRouter) {
    this.router = router;
  }

  async plan(request: string, options: PlanOptions = {}): Promise<ExecutionPlan> {
    const lang = options.language || this.detectLanguage(request);
    const maxSteps = options.maxSteps || 8;

    const contextHint = options.clientContext
      ? `\nClient context: ${options.clientContext}`
      : "";

    const prompt = `${PLANNING_PROMPT}${contextHint}\n\nUser request: "${request}"`;

    try {
      const result = await this.router.resolve(prompt, {
        taskType: "reasoning",
        temperature: 0.3,
        maxTokens: 2000,
      });

      if (result.ok && result.text) {
        const parsed = this.parsePlan(result.text, request, lang);
        if (parsed && parsed.steps && parsed.steps.length > 0) {
          return this.finalizePlan(parsed, request, lang, options.clientContext);
        }
      }
    } catch (e: any) {
      console.warn(`[TaskPlanner] AI planning failed: ${e.message}`);
    }

    return this.fallbackPlan(request, lang);
  }

  private parsePlan(text: string, request: string, lang: string): Partial<ExecutionPlan> | null {
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const obj = JSON.parse(jsonMatch[0]);
      if (!obj.steps || !Array.isArray(obj.steps)) return null;
      return {
        category: obj.category || "general",
        steps: obj.steps.map((s: any, i: number) => ({
          id: s.id || `step_${i + 1}`,
          description: s.description || `Step ${i + 1}`,
          category: s.category || obj.category || "general",
          toolsNeeded: Array.isArray(s.toolsNeeded) ? s.toolsNeeded : ["ai"],
          dependsOn: Array.isArray(s.dependsOn) ? s.dependsOn : [],
          priority: s.priority || "medium",
          estimatedSeconds: s.estimatedSeconds || 30,
          canParallel: s.canParallel || false,
          retryable: s.retryable !== false,
        })),
      };
    } catch {
      return null;
    }
  }

  private finalizePlan(
    partial: Partial<ExecutionPlan>,
    request: string,
    lang: "es" | "pt" | "en",
    clientContext?: string
  ): ExecutionPlan {
    const steps = (partial.steps || []).slice(0, 8);
    const totalSeconds = steps.reduce((sum, s) => sum + (s.estimatedSeconds || 30), 0);
    return {
      id: `plan_${Date.now().toString(36)}`,
      originalRequest: request,
      language: lang,
      category: (partial.category as TaskCategory) || "general",
      steps,
      totalEstimatedSeconds: totalSeconds,
      clientContext,
      createdAt: new Date().toISOString(),
    };
  }

  private fallbackPlan(request: string, lang: "es" | "pt" | "en"): ExecutionPlan {
    const category = this.inferCategory(request);
    const tools = this.inferTools(category);
    const step: PlannedStep = {
      id: "step_1",
      description: request.slice(0, 200),
      category,
      toolsNeeded: tools,
      dependsOn: [],
      priority: "medium",
      estimatedSeconds: 60,
      canParallel: false,
      retryable: true,
    };
    return {
      id: `plan_${Date.now().toString(36)}`,
      originalRequest: request,
      language: lang,
      category,
      steps: [step],
      totalEstimatedSeconds: 60,
      createdAt: new Date().toISOString(),
    };
  }

  detectLanguage(m: string): "es" | "pt" | "en" {
    const es = (m.match(/(hola|qu[eé] tal|por favor|gracias|quiero|necesito|puedes|hazme)/gi) || []).length;
    const pt = (m.match(/(ol[áa]|obrigado|podes|quero|preciso|faz|envia|escreve)/gi) || []).length;
    const en = (m.match(/(hello|please|thanks|can you|i want|i need|create|send)/gi) || []).length;
    if (pt > es && pt >= en) return "pt";
    if (en > es && en >= pt) return "en";
    return "es";
  }

  private inferCategory(request: string): TaskCategory {
    const r = request.toLowerCase();
    if (/(pesquis|research|investig|analisa|stud)/.test(r)) return "research";
    if (/(program|c[oó]digo|code|desenvolv|develop|bug|fix)/.test(r)) return "code";
    if (/(cria|crea|create|gera|genera|build|site|app|landing)/.test(r)) return "create";
    if (/(automat|automatiz|pipeline|fluxo|workflow)/.test(r)) return "automate";
    if (/(audita|audit|revisa|review|seguran|security)/.test(r)) return "audit";
    if (/(aprend|learn|estuda|study|treina|train)/.test(r)) return "learn";
    if (/(corrige|correct|fix|arruma|repara)/.test(r)) return "correct";
    if (/(opera|empresa|business|client|venda|sale)/.test(r)) return "operate";
    if (/(coordena|coordina|orquesta|delegate|agent)/.test(r)) return "coordinate";
    if (/(adapta|adapt|personaliz|customiz)/.test(r)) return "adapt";
    if (/(evolui|evolve|melhora|improve|upgrade)/.test(r)) return "evolve";
    if (/(email|mensag|message|envia|send|comunica)/.test(r)) return "communicate";
    return "general" as TaskCategory;
  }

  private inferTools(category: TaskCategory): string[] {
    const map: Record<TaskCategory, string[]> = {
      research: ["ai", "web"],
      code: ["ai", "code", "shell"],
      create: ["ai", "code", "file"],
      automate: ["ai", "composio", "shell"],
      audit: ["ai", "code", "shell"],
      learn: ["ai", "web"],
      correct: ["ai", "code"],
      operate: ["ai", "composio"],
      coordinate: ["ai"],
      adapt: ["ai"],
      evolve: ["ai", "code"],
      communicate: ["ai", "composio"],
      general: ["ai"],
    };
    return map[category] || ["ai"];
  }
}
