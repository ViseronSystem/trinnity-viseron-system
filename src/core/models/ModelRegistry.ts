import fs from "fs";
import path from "path";
import crypto from "crypto";
import axios from "axios";

// ModelRegistry — gestão real de modelos IA (estilo Ollama).
// Ollama (localhost:11434) como provider primário; OpenAI/Anthropic/Gemini como fallback.
// Registo persistente em data/models/registry.json + usage em data/models/usage.jsonl.
// Fila de inferência com queueing quando o modelo está a carregar.

export interface ModelInfo {
  id: string;
  name: string;
  provider: "ollama" | "openai" | "anthropic" | "gemini";
  size: string;
  parameterCount: string;
  capabilities: string[];
  status: "available" | "pulling" | "ready" | "error";
  pulledAt?: string;
  lastUsed?: string;
  useCount: number;
}

export interface InferenceRequest {
  id: string;
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  timestamp: string;
}

export interface InferenceResponse {
  id: string;
  requestId: string;
  model: string;
  response: string;
  tokens: { prompt: number; completion: number; total: number };
  latencyMs: number;
  timestamp: string;
}

export interface ModelTemplate {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  useCase: string;
}

export interface QueueItem {
  request: InferenceRequest;
  resolve: (resp: InferenceResponse) => void;
  reject: (err: Error) => void;
  enqueuedAt: number;
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  configured: boolean;
  modelsCount: number;
  latencyMs?: number;
  error?: string;
}

export interface RegistryData {
  models: ModelInfo[];
  templates: ModelTemplate[];
  lastSynced: string;
}

const DEFAULT_TEMPLATES: ModelTemplate[] = [
  {
    id: "chat-general",
    name: "General Chat",
    description: "Conversa geral e perguntas quotidianas",
    model: "qwen2.5:3b",
    systemPrompt: "Responde de forma clara e concisa. Se o utilizador falar em português, responde em português. Se falar em espanhol, responde em espanhol. Se falar em inglês, responde em inglês.",
    temperature: 0.7,
    maxTokens: 2048,
    useCase: "chat",
  },
  {
    id: "code-assistant",
    name: "Code Assistant",
    description: "Assistência de código — TypeScript, Python, Solidity",
    model: "qwen2.5:3b",
    systemPrompt: "És um programador expert. Escreve código limpo, sem comentários desnecessários, seguindo boas práticas. Explica brevemente a solução.",
    temperature: 0.3,
    maxTokens: 4096,
    useCase: "code",
  },
  {
    id: "reasoning-deep",
    name: "Deep Reasoning",
    description: "Raciocínio profundo e análise complexa",
    model: "qwen2.5:3b",
    systemPrompt: "Pensa passo a passo antes de responder. Analisa o problema por todos os ângulos. Dá uma resposta fundamentada.",
    temperature: 0.2,
    maxTokens: 4096,
    useCase: "reasoning",
  },
  {
    id: "creative-writer",
    name: "Creative Writer",
    description: "Escrita criativa — posts, emails, conteúdo",
    model: "qwen2.5:3b",
    systemPrompt: "És um escritor criativo profissional. Escreve conteúdo envolvente, bem estruturado e adaptado ao tom do público-alvo.",
    temperature: 0.8,
    maxTokens: 3072,
    useCase: "creative",
  },
  {
    id: "translation",
    name: "Translator",
    description: "Tradução entre ES/PT/EN",
    model: "qwen2.5:3b",
    systemPrompt: "Traduz o texto mantendo o significado e tom originais. Não adiciones explicações — apenas a tradução. Se o idioma de destino não for指定, usa português.",
    temperature: 0.3,
    maxTokens: 4096,
    useCase: "translation",
  },
  {
    id: "agent-response",
    name: "Agent Response",
    description: "Respostas de agentes autónomos do TVS",
    model: "qwen2.5:3b",
    systemPrompt: "És um agente autónomo do Trinnity Viseron System. Responde de forma profissional, técnica e orientada a ação. Inclui sempre o resultado da operação executada.",
    temperature: 0.5,
    maxTokens: 2048,
    useCase: "automation",
  },
  {
    id: "data-analysis",
    name: "Data Analysis",
    description: "Análise de dados e métricas",
    model: "qwen2.5:3b",
    systemPrompt: "Analisa os dados fornecidos. Identifica padrões, anomalias e tendências. Apresenta conclusões quantificadas com fonte dos dados.",
    temperature: 0.2,
    maxTokens: 3072,
    useCase: "analysis",
  },
  {
    id: "tutor-language",
    name: "Language Tutor",
    description: "Tutor de idiomas — inglês, español, português",
    model: "qwen2.5:3b",
    systemPrompt: "És um professor de idiomas paciente eencourajador. Corrige erros gentilmente, explica regras simplesmente e dá exemplos práticos. Fala na língua nativa do estudante para explicar conceitos.",
    temperature: 0.6,
    maxTokens: 2048,
    useCase: "education",
  },
];

export class ModelRegistry {
  private dataDir: string;
  private registryFile: string;
  private usageFile: string;
  private registry: RegistryData;
  private queue: QueueItem[] = [];
  private processing = false;
  private ollamaHost: string;
  private stats = { totalInferences: 0, totalErrors: 0, totalQueued: 0 };

  constructor(ctx: { dataDir: string }) {
    this.dataDir = ctx.dataDir;
    this.registryFile = path.join(this.dataDir, "models", "registry.json");
    this.usageFile = path.join(this.dataDir, "models", "usage.jsonl");
    this.ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
    this.registry = this.loadRegistry();
    this.ensureDirs();
  }

  private ensureDirs(): void {
    const modelsDir = path.join(this.dataDir, "models");
    if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
  }

  private loadRegistry(): RegistryData {
    try {
      if (fs.existsSync(this.registryFile)) {
        const raw = fs.readFileSync(this.registryFile, "utf-8");
        return JSON.parse(raw);
      }
    } catch { /* ignore corrupt file */ }
    return { models: [], templates: [...DEFAULT_TEMPLATES], lastSynced: "" };
  }

  private saveRegistry(): void {
    this.registry.lastSynced = new Date().toISOString();
    fs.writeFileSync(this.registryFile, JSON.stringify(this.registry, null, 2), "utf-8");
  }

  private logUsage(entry: Record<string, any>): void {
    fs.appendFileSync(this.usageFile, JSON.stringify(entry) + "\n", "utf-8");
  }

  private genId(): string {
    return `m_${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
  }

  // ── Ollama API calls ──────────────────────────────────────────────

  private async ollamaList(): Promise<Array<{ name: string; size: number; modified_at: string }>> {
    try {
      const res = await axios.get(`${this.ollamaHost}/api/tags`, { timeout: 5000 });
      return res.data?.models || [];
    } catch {
      return [];
    }
  }

  private async ollamaShow(name: string): Promise<Record<string, any> | null> {
    try {
      const res = await axios.post(`${this.ollamaHost}/api/show`, { name }, { timeout: 5000 });
      return res.data || null;
    } catch {
      return null;
    }
  }

  private async ollamaPull(name: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await axios.post(
        `${this.ollamaHost}/api/pull`,
        { name, stream: false },
        { timeout: 600000 }
      );
      return { ok: res.status === 200 };
    } catch (e: any) {
      return { ok: false, error: e?.message || "pull failed" };
    }
  }

  private async ollamaDelete(name: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await axios.delete(`${this.ollamaHost}/api/delete`, { data: { name }, timeout: 10000 });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "delete failed" };
    }
  }

  private async ollamaGenerate(
    model: string,
    prompt: string,
    system?: string,
    temperature?: number
  ): Promise<{ response: string; promptTokens: number; completionTokens: number }> {
    const body: Record<string, any> = { model, prompt, stream: false };
    if (system) body.system = system;
    if (temperature !== undefined) body.options = { temperature };
    const res = await axios.post(`${this.ollamaHost}/api/generate`, body, { timeout: 120000 });
    const data = res.data || {};
    return {
      response: data.response || "",
      promptTokens: data.prompt_eval_count || 0,
      completionTokens: data.eval_count || 0,
    };
  }

  private async ollamaChat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature?: number
  ): Promise<{ response: string; promptTokens: number; completionTokens: number }> {
    const body: Record<string, any> = { model, messages, stream: false };
    if (temperature !== undefined) body.options = { temperature };
    const res = await axios.post(`${this.ollamaHost}/api/chat`, body, { timeout: 120000 });
    const data = res.data || {};
    return {
      response: data.message?.content || "",
      promptTokens: data.prompt_eval_count || 0,
      completionTokens: data.eval_count || 0,
    };
  }

  // ── Cloud providers (fallback) ───────────────────────────────────

  private async cloudInfer(
    provider: "openai" | "anthropic" | "gemini",
    model: string,
    prompt: string,
    system?: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<{ response: string; promptTokens: number; completionTokens: number }> {
    if (provider === "openai") return this.openaiInfer(model, prompt, system, temperature, maxTokens);
    if (provider === "anthropic") return this.anthropicInfer(model, prompt, system, temperature, maxTokens);
    if (provider === "gemini") return this.geminiInfer(model, prompt, system, temperature, maxTokens);
    throw new Error(`Provider desconhecido: ${provider}`);
  }

  private async openaiInfer(
    model: string, prompt: string, system?: string, temperature?: number, maxTokens?: number
  ): Promise<{ response: string; promptTokens: number; completionTokens: number }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY não configurada");
    const messages: Array<{ role: string; content: string }> = [];
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: prompt });
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      { model, messages, temperature: temperature ?? 0.7, max_tokens: maxTokens ?? 2048 },
      { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, timeout: 60000 }
    );
    const data = res.data?.choices?.[0]?.message?.content || "";
    const usage = res.data?.usage || {};
    return { response: data, promptTokens: usage.prompt_tokens || 0, completionTokens: usage.completion_tokens || 0 };
  }

  private async anthropicInfer(
    model: string, prompt: string, system?: string, temperature?: number, maxTokens?: number
  ): Promise<{ response: string; promptTokens: number; completionTokens: number }> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");
    const body: Record<string, any> = {
      model, max_tokens: maxTokens ?? 2048, temperature: temperature ?? 0.7, messages: [{ role: "user", content: prompt }],
    };
    if (system) body.system = system;
    const res = await axios.post("https://api.anthropic.com/v1/messages", body, {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      timeout: 60000,
    });
    const data = res.data?.content?.[0]?.text || "";
    const usage = res.data?.usage || {};
    return { response: data, promptTokens: usage.input_tokens || 0, completionTokens: usage.output_tokens || 0 };
  }

  private async geminiInfer(
    model: string, prompt: string, system?: string, temperature?: number, maxTokens?: number
  ): Promise<{ response: string; promptTokens: number; completionTokens: number }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const parts: Array<{ text: string }> = [];
    if (system) parts.push({ text: `[System] ${system}\n\n${prompt}` });
    else parts.push({ text: prompt });
    const res = await axios.post(url, {
      contents: [{ parts }],
      generationConfig: { temperature: temperature ?? 0.7, maxOutputTokens: maxTokens ?? 2048 },
    }, { timeout: 60000 });
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = res.data?.usageMetadata || {};
    return { response: text, promptTokens: usage.promptTokenCount || 0, completionTokens: usage.candidatesTokenCount || 0 };
  }

  // ── Public API ────────────────────────────────────────────────────

  /** Lista todos os modelos: Ollama + registry local. */
  async listModels(): Promise<ModelInfo[]> {
    const ollamaModels = await this.ollamaList();
    const ollamaNames = new Set(ollamaModels.map((m) => m.name));

    // Sync Ollama models into registry
    for (const m of ollamaModels) {
      const existing = this.registry.models.find((r) => r.name === m.name && r.provider === "ollama");
      if (existing) {
        existing.status = "ready";
        existing.size = this.formatBytes(m.size);
        if (!existing.pulledAt) existing.pulledAt = m.modified_at;
      } else {
        const info = await this.ollamaShow(m.name);
        this.registry.models.push({
          id: this.genId(),
          name: m.name,
          provider: "ollama",
          size: this.formatBytes(m.size),
          parameterCount: this.extractParamCount(info),
          capabilities: this.inferCapabilities(m.name),
          status: "ready",
          pulledAt: m.modified_at,
          useCount: 0,
        });
      }
    }

    // Remove Ollama models no longer present locally
    this.registry.models = this.registry.models.filter(
      (r) => r.provider !== "ollama" || ollamaNames.has(r.name)
    );

    this.saveRegistry();
    return [...this.registry.models];
  }

  /** Puxa um modelo do Ollama. */
  async pullModel(name: string): Promise<{ ok: boolean; model?: ModelInfo; error?: string }> {
    const existing = this.registry.models.find((m) => m.name === name && m.provider === "ollama");
    if (existing && existing.status === "ready") {
      return { ok: true, model: existing };
    }

    // Mark as pulling
    if (existing) {
      existing.status = "pulling";
    } else {
      this.registry.models.push({
        id: this.genId(),
        name,
        provider: "ollama",
        size: "?",
        parameterCount: "?",
        capabilities: this.inferCapabilities(name),
        status: "pulling",
        useCount: 0,
      });
    }
    this.saveRegistry();

    const result = await this.ollamaPull(name);
    const model = this.registry.models.find((m) => m.name === name && m.provider === "ollama");

    if (result.ok && model) {
      model.status = "ready";
      model.pulledAt = new Date().toISOString();
      const ollamaModels = await this.ollamaList();
      const found = ollamaModels.find((m) => m.name === name);
      if (found) {
        model.size = this.formatBytes(found.size);
        const info = await this.ollamaShow(name);
        model.parameterCount = this.extractParamCount(info);
      }
    } else if (model) {
      model.status = "error";
    }

    this.saveRegistry();
    return { ok: result.ok, model, error: result.error };
  }

  /** Remove um modelo do Ollama e do registry. */
  async deleteModel(name: string): Promise<{ ok: boolean; error?: string }> {
    const result = await this.ollamaDelete(name);
    this.registry.models = this.registry.models.filter(
      (m) => !(m.name === name && m.provider === "ollama")
    );
    this.saveRegistry();
    return result;
  }

  /** Executa inferência com queue + fallback. */
  async infer(request: Omit<InferenceRequest, "id" | "timestamp">): Promise<InferenceResponse> {
    const fullRequest: InferenceRequest = {
      id: this.genId(),
      ...request,
      timestamp: new Date().toISOString(),
    };

    // If model is loading, queue
    const targetModel = this.registry.models.find(
      (m) => m.name === request.model && m.status === "pulling"
    );
    if (targetModel) {
      this.stats.totalQueued++;
      return this.enqueueRequest(fullRequest);
    }

    return this.executeInference(fullRequest);
  }

  private enqueueRequest(request: InferenceRequest): Promise<InferenceResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject, enqueuedAt: Date.now() });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const item = this.queue[0];
      const targetModel = this.registry.models.find(
        (m) => m.name === item.request.model
      );
      if (targetModel && targetModel.status === "pulling") {
        // Wait 2s and re-check
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      this.queue.shift();
      try {
        const resp = await this.executeInference(item.request);
        item.resolve(resp);
      } catch (err: any) {
        item.reject(err);
      }
    }
    this.processing = false;
  }

  private async executeInference(request: InferenceRequest): Promise<InferenceResponse> {
    const start = Date.now();
    let result: { response: string; promptTokens: number; completionTokens: number };
    let usedModel = request.model;

    // 1. Try Ollama first
    const ollamaModel = this.registry.models.find(
      (m) => m.name === request.model && m.provider === "ollama" && m.status === "ready"
    );
    if (ollamaModel) {
      try {
        const messages = [
          ...(request.system ? [{ role: "system", content: request.system }] : []),
          { role: "user", content: request.prompt },
        ];
        result = await this.ollamaChat(request.model, messages, request.temperature);
        this.updateModelUsage(request.model);
        this.stats.totalInferences++;
        const response: InferenceResponse = {
          id: this.genId(),
          requestId: request.id,
          model: usedModel,
          response: result.response,
          tokens: { prompt: result.promptTokens, completion: result.completionTokens, total: result.promptTokens + result.completionTokens },
          latencyMs: Date.now() - start,
          timestamp: new Date().toISOString(),
        };
        this.logUsage({ ...request, ...response, provider: "ollama" });
        return response;
      } catch (e: any) {
        console.warn(`[ModelRegistry] Ollama falhou para ${request.model}: ${e.message}`);
      }
    }

    // 2. Fallback: cloud providers
    const cloudProviders: Array<"openai" | "anthropic" | "gemini"> = ["openai", "anthropic", "gemini"];
    const cloudModels: Record<string, string> = {
      openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
      anthropic: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      gemini: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    };

    for (const provider of cloudProviders) {
      try {
        const model = cloudModels[provider];
        result = await this.cloudInfer(provider, model, request.prompt, request.system, request.temperature, request.maxTokens);
        usedModel = model;
        this.stats.totalInferences++;
        const response: InferenceResponse = {
          id: this.genId(),
          requestId: request.id,
          model: usedModel,
          response: result.response,
          tokens: { prompt: result.promptTokens, completion: result.completionTokens, total: result.promptTokens + result.completionTokens },
          latencyMs: Date.now() - start,
          timestamp: new Date().toISOString(),
        };
        this.logUsage({ ...request, ...response, provider });
        return response;
      } catch {
        continue;
      }
    }

    this.stats.totalErrors++;
    throw new Error(`Nenhum provider disponível para inferência (model: ${request.model})`);
  }

  private updateModelUsage(name: string): void {
    const model = this.registry.models.find((m) => m.name === name);
    if (model) {
      model.useCount++;
      model.lastUsed = new Date().toISOString();
      this.saveRegistry();
    }
  }

  /** Lista templates de tarefa. */
  getTemplates(): ModelTemplate[] {
    return [...this.registry.templates];
  }

  /** Adiciona template personalizado. */
  addTemplate(template: Omit<ModelTemplate, "id">): ModelTemplate {
    const full: ModelTemplate = { ...template, id: this.genId() };
    this.registry.templates.push(full);
    this.saveRegistry();
    return full;
  }

  /** Remove template por ID. */
  removeTemplate(id: string): boolean {
    const before = this.registry.templates.length;
    this.registry.templates = this.registry.templates.filter((t) => t.id !== id);
    if (this.registry.templates.length < before) {
      this.saveRegistry();
      return true;
    }
    return false;
  }

  /** Estatísticas de uso. */
  getUsage(): {
    totalInferences: number;
    totalErrors: number;
    totalQueued: number;
    recentInferences: InferenceResponse[];
    byModel: Record<string, number>;
    byProvider: Record<string, number>;
    avgLatencyMs: number;
  } {
    const lines = this.readUsageLog();
    const recent = lines.slice(-50).map((l) => ({
      id: l.id,
      requestId: l.requestId,
      model: l.model,
      response: l.response?.substring(0, 200) + (l.response?.length > 200 ? "..." : ""),
      tokens: l.tokens,
      latencyMs: l.latencyMs,
      timestamp: l.timestamp,
    }));

    const byModel: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    let totalLatency = 0;
    for (const l of lines) {
      byModel[l.model] = (byModel[l.model] || 0) + 1;
      byProvider[l.provider || "ollama"] = (byProvider[l.provider || "ollama"] || 0) + 1;
      totalLatency += l.latencyMs || 0;
    }

    return {
      totalInferences: this.stats.totalInferences || lines.length,
      totalErrors: this.stats.totalErrors,
      totalQueued: this.stats.totalQueued,
      recentInferences: recent,
      byModel,
      byProvider,
      avgLatencyMs: lines.length > 0 ? Math.round(totalLatency / lines.length) : 0,
    };
  }

  /** Estado de cada provider. */
  async getStatus(): Promise<{
    ollama: ProviderStatus;
    openai: ProviderStatus;
    anthropic: ProviderStatus;
    gemini: ProviderStatus;
    queueLength: number;
    registryModels: number;
    templates: number;
  }> {
    const ollamaStart = Date.now();
    let ollamaOk = false;
    let ollamaCount = 0;
    try {
      const models = await this.ollamaList();
      ollamaOk = true;
      ollamaCount = models.length;
    } catch { /* offline */ }

    const openaiOk = !!process.env.OPENAI_API_KEY;
    const anthropicOk = !!process.env.ANTHROPIC_API_KEY;
    const geminiOk = !!process.env.GEMINI_API_KEY;

    return {
      ollama: {
        name: "Ollama (local)",
        available: ollamaOk,
        configured: true,
        modelsCount: ollamaCount,
        latencyMs: Date.now() - ollamaStart,
        error: ollamaOk ? undefined : "Servidor não responde em " + this.ollamaHost,
      },
      openai: {
        name: "OpenAI",
        available: openaiOk,
        configured: openaiOk,
        modelsCount: openaiOk ? 1 : 0,
      },
      anthropic: {
        name: "Anthropic",
        available: anthropicOk,
        configured: anthropicOk,
        modelsCount: anthropicOk ? 1 : 0,
      },
      gemini: {
        name: "Google Gemini",
        available: geminiOk,
        configured: geminiOk,
        modelsCount: geminiOk ? 1 : 0,
      },
      queueLength: this.queue.length,
      registryModels: this.registry.models.length,
      templates: this.registry.templates.length,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private readUsageLog(): any[] {
    try {
      if (!fs.existsSync(this.usageFile)) return [];
      const lines = fs.readFileSync(this.usageFile, "utf-8").split("\n").filter(Boolean);
      return lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    } catch {
      return [];
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  private extractParamCount(info: Record<string, any> | null): string {
    if (!info) return "?";
    const details = info.details || {};
    const params = details.parameter_size || details["general.parameter_size"];
    if (params) return params;
    // Try to extract from model name
    const name = info.model_info?.["general.name"] || "";
    const match = name.match(/(\d+\.?\d*)[bB]/);
    if (match) return `${match[1]}B`;
    return "?";
  }

  private inferCapabilities(name: string): string[] {
    const lower = name.toLowerCase();
    const caps: string[] = [];
    if (lower.includes("code") || lower.includes("coder")) caps.push("code");
    if (lower.includes("instruct")) caps.push("instruction-following");
    if (lower.includes("chat")) caps.push("chat");
    if (lower.includes("vision") || lower.includes("llava")) caps.push("vision");
    if (lower.includes("embed")) caps.push("embeddings");
    if (lower.includes("qwen")) caps.push("multilingual");
    if (lower.includes("llama")) caps.push("general");
    caps.push("text-generation");
    return caps;
  }
}
