import { ProviderFactory } from "../../core/providers/ProviderFactory";

// Estado da IA do sistema — qual provider/modelo está operacional de verdade.
// Útil para o site/JARVIS mostrarem "IA: <provider> <model>" em vez de "rule".

export interface AIStatus {
  ok: boolean;
  providers: Array<{ id: string; available: boolean; model: string; reason?: string }>;
  active: { id: string; model: string } | null;
  ollamaModels: string[];
  checkedAt: string;
}

let cache: { at: number; status: AIStatus } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getAIStatus(): Promise<AIStatus> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { ...cache.status, checkedAt: new Date().toISOString() };
  }

  const factory = new ProviderFactory();
  const candidates = [
    { id: "openai", key: "OPENAI_API_KEY", model: "gpt-4o-mini" },
    { id: "claude", key: "ANTHROPIC_API_KEY", model: "claude-3-5-haiku-latest" },
    { id: "gemini", key: "GEMINI_API_KEY", model: "gemini-1.5-flash" },
    { id: "grok", key: "XAI_API_KEY", model: "grok-3" },
    { id: "ollama", key: "", model: "qwen2.5:3b" },
    { id: "omniroute", key: "", model: "auto" },
  ];

  const results: AIStatus["providers"] = [];
  let active: AIStatus["active"] = null;

  for (const cand of candidates) {
    const provider = factory.getProvider(cand.id as any);
    if (!provider) {
      results.push({ id: cand.id, available: false, model: cand.model, reason: "não registado" });
      continue;
    }
    if (cand.key && !process.env[cand.key]) {
      results.push({ id: cand.id, available: false, model: cand.model, reason: `sem ${cand.key}` });
      continue;
    }
    try {
      const available = cand.id === "ollama" || cand.id === "omniroute"
        ? await provider.isAvailable()
        : true;
      results.push({ id: cand.id, available, model: cand.model, reason: available ? undefined : "indisponível agora" });
      if (available && !active) {
        active = { id: cand.id, model: cand.model };
      }
    } catch {
      results.push({ id: cand.id, available: false, model: cand.model, reason: "erro ao verificar" });
    }
  }

  let ollamaModels: string[] = [];
  if (process.env.OLLAMA_HOST) {
    try {
      const res = await fetch(`${process.env.OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json().catch(() => null);
      if (data?.models) ollamaModels = data.models.map((m: any) => m.name);
    } catch {
      ollamaModels = [];
    }
  }

  // Ollama só conta como ativo se houver pelo menos um modelo carregado.
  if (active?.id === "ollama" && ollamaModels.length === 0) {
    active = null;
    const p = results.find((r) => r.id === "ollama");
    if (p) {
      p.available = false;
      p.reason = "servidor ativo mas sem modelos (npm run models:pull)";
    }
  }

  const status: AIStatus = { ok: !!active, providers: results, active, ollamaModels, checkedAt: new Date().toISOString() };
  cache = { at: Date.now(), status };
  return status;
}
