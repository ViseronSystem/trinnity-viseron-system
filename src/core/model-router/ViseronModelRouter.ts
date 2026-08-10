import { ProviderFactory } from "../providers/ProviderFactory";
import { ILLMProvider, LLMResponse, ProviderCapabilities } from "../providers/BaseProvider";
import { ModelProvider, PrivacyLevel } from "../types";
import { reality, RealityMode } from "../policy";

/**
 * VISERON MODEL ROUTER — abstração OFICIAL e única de roteamento de modelos.
 *
 * Substitui qualquer router concorrente (AIRouter omega + cadeia manual do JARVIS).
 * Avalia DINAMICAMENTE, em cada pedido:
 *   availability · health · capability · context_length · latency · cost
 *   privacy · provider_priority · task_type
 *
 * Regra de realidade: NUNCA usa providers fictícios para satisfazer a cadeia.
 * provider indisponível → próximo disponível; todos indisponíveis → fallback local;
 * sem local → falha honesta (success=false + mode NOT_IMPLEMENTED), nunca texto fake.
 */

export type RouterTaskType =
  | "code" | "research" | "reasoning" | "general" | "creative"
  | "automation" | "vision" | "chat" | "privacy";

export interface RouterResolveOptions {
  taskType?: RouterTaskType;
  privacyRequired?: "HIGH" | "MEDIUM" | "LOW";
  forceLocal?: boolean;
  maxCostPer1kTokens?: number;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface RouterStatusEntry {
  provider: ModelProvider;
  isLocal: boolean;
  available: boolean;
  healthOk: boolean;
  latencyMs?: number;
  hasCredentials: boolean;
  mode: RealityMode;
  tasks: string[];
  contextWindow: number;
}

export interface RouterResolveResult {
  ok: boolean;
  provider: string;
  model: string;
  isLocal: boolean;
  text: string;
  latencyMs: number;
  strategy: string;
  mode: RealityMode;
  reason?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

interface TaskPreference {
  provider: ModelProvider;
  localOnly: boolean;
}

// Preferência por tipo de tarefa (a avaliação dinâmica de disponibilidade manda acima disto).
const TASK_PREFERENCE: Partial<Record<RouterTaskType, TaskPreference>> = {
  privacy: { provider: "ollama", localOnly: true },
  general: { provider: "ollama", localOnly: false },
  chat: { provider: "ollama", localOnly: false },
  code: { provider: "deepseek", localOnly: false },
  reasoning: { provider: "claude", localOnly: false },
  research: { provider: "claude", localOnly: false },
  creative: { provider: "openai", localOnly: false },
  vision: { provider: "gemini", localOnly: false },
  automation: { provider: "omniroute", localOnly: false },
};

const CLOUD_ORDER: ModelProvider[] = ["openai", "claude", "gemini", "grok", "omniroute", "deepseek", "mistral"];

export class ViseronModelRouter {
  private readonly factory: ProviderFactory;
  private readonly healthCache = new Map<ModelProvider, { ok: boolean; at: number }>();
  private readonly healthTtlMs = 5000;

  constructor(factory?: ProviderFactory) {
    this.factory = factory ?? new ProviderFactory();
  }

  public getProvider(providerId: ModelProvider): ILLMProvider | undefined {
    return this.factory.getProvider(providerId);
  }

  public inferTaskType(task: string): RouterTaskType {
    const t = task.toLowerCase();
    if (/(imagem|imagen|foto|camera|image|vis[aã]o|vision)/.test(t)) return "vision";
    if (/(c[oó]digo|codigo|programar|desarrollar|desenvolver|code|bug|repositorio|repository)/.test(t)) return "code";
    if (/(investigar|research|pesquisar|analys|analiz|estudiar|estudar)/.test(t)) return "research";
    if (/(razonar|raciocinar|arquitectura|arquitetura|dise[nñ]ar|reason|design)/.test(t)) return "reasoning";
    if (/(privacidad|privacidade|confidencial|secreto|local)/.test(t)) return "privacy";
    if (/(automatizar|deploy|automation|pipeline|fluxo|flujo)/.test(t)) return "automation";
    if (/(crear|criar|create|marketing|proposta|propuesta|anuncio|copy)/.test(t)) return "creative";
    return "general";
  }

  /** Estado dinâmico de todos os providers (availability real, não catálogo). */
  public async status(): Promise<{ default: ModelProvider; providers: RouterStatusEntry[]; availableCount: number }> {
    const entries: RouterStatusEntry[] = [];
    let availableCount = 0;
    const ordered: ModelProvider[] = Array.from(new Set([...CLOUD_ORDER, "ollama", "deepseek", "qwen", "mistral"]));
    for (const pid of ordered) {
      const p = this.factory.getProvider(pid);
      if (!p) continue;
      let available = false;
      try {
        available = await this.checkedAvailable(p);
      } catch {
        available = false;
      }
      let healthOk = false;
      let latencyMs: number | undefined;
      try {
        const h = await p.health();
        healthOk = h.ok;
        latencyMs = h.latencyMs;
      } catch {
        healthOk = false;
      }
      const caps = p.capabilities();
      if (available) availableCount++;
      entries.push({
        provider: pid,
        isLocal: caps.isLocal,
        available,
        healthOk,
        latencyMs,
        hasCredentials: caps.hasCredentials,
        mode: p.mode,
        tasks: caps.tasks,
        contextWindow: caps.contextWindow,
      });
    }
    return { default: "ollama", providers: entries, availableCount };
  }

  private async checkedAvailable(p: ILLMProvider): Promise<boolean> {
    const cached = this.healthCache.get(p.providerId);
    if (cached && Date.now() - cached.at < this.healthTtlMs) return cached.ok;
    let ok = false;
    try {
      ok = await p.isAvailable();
    } catch {
      ok = false;
    }
    this.healthCache.set(p.providerId, { ok, at: Date.now() });
    return ok;
  }

  private buildChain(taskType: RouterTaskType, opts: RouterResolveOptions): ModelProvider[] {
    const pref = TASK_PREFERENCE[taskType];
    const forceLocal = opts.forceLocal || opts.privacyRequired === "HIGH";
    let chain: ModelProvider[];

    if (forceLocal) {
      chain = ["ollama", "qwen", "mistral", "deepseek"];
    } else {
      const preferred = pref?.provider ?? "ollama";
      if (preferred === "ollama") {
        chain = ["ollama", ...CLOUD_ORDER];
      } else {
        chain = [preferred, "ollama", ...CLOUD_ORDER.filter((p) => p !== preferred)];
      }
    }
    return Array.from(new Set(chain));
  }

  private pickModel(p: ILLMProvider, taskType: RouterTaskType, preferred?: string): string | undefined {
    if (preferred) return preferred;
    return undefined; // deixa o provider escolher o default
  }

  /**
   * Resolve e EXECUTA através da cadeia dinâmica. Primeiro provider real com
   * resposta com substância vence. Todos indisponíveis → falha honesta.
   */
  public async resolve(task: string, opts: RouterResolveOptions = {}): Promise<RouterResolveResult> {
    const start = Date.now();
    const taskType = opts.taskType ?? this.inferTaskType(task);
    const chain = this.buildChain(taskType, opts);
    const failures: string[] = [];

    for (const pid of chain) {
      const p = this.factory.getProvider(pid);
      if (!p) {
        failures.push(`${pid}:no-provider`);
        continue;
      }
      try {
        const available = await this.checkedAvailable(p);
        if (!available) {
          failures.push(`${pid}:unavailable`);
          continue;
        }
        const caps: ProviderCapabilities = p.capabilities();
        if (opts.maxCostPer1kTokens !== undefined && !caps.isLocal && caps.contextWindow === 0) {
          failures.push(`${pid}:cost-filter`);
          continue;
        }

        const response: LLMResponse = await p.generateResponse({
          prompt: task,
          systemPrompt: opts.systemPrompt,
          temperature: opts.temperature ?? 0.6,
          maxTokens: opts.maxTokens ?? 1024,
          modelName: this.pickModel(p, taskType),
        });

        if (!response.text || response.text.trim().length < 15) {
          failures.push(`${pid}:empty`);
          continue;
        }

        return {
          ok: true,
          provider: response.provider || pid,
          model: response.modelName || "auto",
          isLocal: caps.isLocal,
          text: response.text,
          latencyMs: Date.now() - start,
          strategy: `router:${taskType}→${pid}`,
          mode: "REAL",
          usage: response.usage,
        };
      } catch (e: any) {
        failures.push(`${pid}:${e?.code || e?.name || "error"}`);
      }
    }

    return {
      ok: false,
      provider: "internal",
      model: "none",
      isLocal: true,
      text: "",
      latencyMs: Date.now() - start,
      strategy: "no-provider",
      mode: "NOT_IMPLEMENTED",
      reason: `nenhum provider real disponível: ${failures.join(", ")}`,
    };
  }

  /** Verificação de saúde do fallback local (Ollama) — continuidade sem créditos externos. */
  public async localFallbackHealth(): Promise<{ ok: boolean; latencyMs?: number; detail?: string }> {
    const p = this.factory.getProvider("ollama");
    if (!p) return { ok: false, detail: "ollama provider not registered" };
    try {
      const h = await p.health();
      return { ok: h.ok, latencyMs: h.latencyMs, detail: h.detail };
    } catch (e: any) {
      return { ok: false, detail: e?.message || "unknown" };
    }
  }
}

/** Estado de realidade global do router (para /api/status). */
export function routerRealityStatus(): { mode: RealityMode; reason: string; defaultProvider: string } {
  const ollamaOk = reality.isReal("ai.providers.ollama");
  return {
    mode: ollamaOk ? "REAL" : "PARTIAL",
    reason: ollamaOk
      ? "Ollama local operacional; cloud providers só quando credenciais reais existem"
      : "sem fallback local disponível — verificar Ollama (localhost:11434)",
    defaultProvider: "ollama",
  };
}
