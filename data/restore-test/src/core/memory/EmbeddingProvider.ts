// VISERON Embedding Provider — Sistema 1 Cognitive Operating Layer
// Substitui embeddings sin/cos placeholder por embeddings reais.
// Providers: OpenAI text-embedding-3-small · MiniLM (local fallback)
// 2026-08-11

import axios from "axios";

export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly model: string;
  readonly dimensions: number;
  isAvailable(): boolean;
  embed(text: string): Promise<EmbeddingResult>;
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
}

// ── OpenAI text-embedding-3-small ───────────────────────

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai";
  readonly model = "text-embedding-3-small";
  readonly dimensions = 1536;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY not configured");
    const start = Date.now();
    try {
      const res = await axios.post(
        "https://api.openai.com/v1/embeddings",
        { input: text, model: this.model, encoding_format: "float" },
        { headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, timeout: 30000 }
      );
      const vector = res.data?.data?.[0]?.embedding;
      if (!vector || !Array.isArray(vector)) throw new Error("Invalid embedding response");
      return {
        vector,
        dimensions: vector.length,
        model: this.model,
        latencyMs: Date.now() - start,
        tokensUsed: res.data?.usage?.total_tokens,
      };
    } catch (e: any) {
      throw new Error(`OpenAI embedding failed: ${e?.message || e}`);
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY not configured");
    const start = Date.now();
    try {
      const res = await axios.post(
        "https://api.openai.com/v1/embeddings",
        { input: texts, model: this.model, encoding_format: "float" },
        { headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, timeout: 60000 }
      );
      const data = res.data?.data;
      if (!Array.isArray(data)) throw new Error("Invalid batch embedding response");
      return data.map((d: any) => ({
        vector: d.embedding,
        dimensions: d.embedding?.length || 0,
        model: this.model,
        latencyMs: Math.round((Date.now() - start) / texts.length),
        tokensUsed: res.data?.usage?.total_tokens,
      }));
    } catch (e: any) {
      throw new Error(`OpenAI batch embedding failed: ${e?.message || e}`);
    }
  }
}

// ── MiniLM local (via HTTP wrapper) ──────────────────────

export class MiniLMEmbeddingProvider implements EmbeddingProvider {
  readonly name = "minilm";
  readonly model = "all-MiniLM-L6-v2";
  readonly dimensions = 384;
  private endpoint: string;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || process.env.MINILM_ENDPOINT || "http://localhost:8888/embed";
  }

  isAvailable(): boolean {
    // MiniLM is always "available" — we try to connect, fallback to zero-vector if unreachable
    return true;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const start = Date.now();
    try {
      const res = await axios.post(this.endpoint, { text }, { timeout: 10000 });
      const vector = res.data?.vector || res.data?.embedding;
      if (vector && Array.isArray(vector)) {
        return { vector, dimensions: vector.length, model: this.model, latencyMs: Date.now() - start };
      }
    } catch { /* fallback below */ }
    // Fallback: TF-IDF-inspired pseudo-embedding (better than sin/cos)
    return this.fallbackEmbed(text, start);
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const start = Date.now();
    try {
      const res = await axios.post(this.endpoint, { texts }, { timeout: 30000 });
      const vectors = res.data?.vectors || res.data?.embeddings;
      if (Array.isArray(vectors)) {
        return vectors.map((v: number[]) => ({
          vector: v, dimensions: v.length || this.dimensions, model: this.model,
          latencyMs: Math.round((Date.now() - start) / texts.length),
        }));
      }
    } catch { /* fallback */ }
    return texts.map((t) => this.fallbackEmbed(t, start));
  }

  // Fallback usando TF-IDF inspirado (hash + frequência de tokens)
  // Melhor que sin/cos — produz embeddings determinísticos para o mesmo texto
  private fallbackEmbed(text: string, startTime: number): EmbeddingResult {
    const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
    const vector = new Array(this.dimensions).fill(0);

    // Simple hash-based embedding: cada token contribui para várias posições
    for (const token of tokens) {
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
      }
      // Distribui o hash por várias dimensões
      for (let d = 0; d < 8; d++) {
        const idx = Math.abs((hash + d * 2654435761) % this.dimensions);
        vector[idx] += (hash % 1000) / 1000 / tokens.length;
      }
    }

    // Normalizar
    const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }

    return {
      vector,
      dimensions: this.dimensions,
      model: this.model + "-fallback",
      latencyMs: Date.now() - startTime,
    };
  }
}

// ── Provider Chain (tenta o melhor disponível) ──────────

export class EmbeddingProviderChain implements EmbeddingProvider {
  readonly name = "chain";
  readonly model: string;
  readonly dimensions: number;
  private providers: EmbeddingProvider[] = [];

  constructor(providers: EmbeddingProvider[]) {
    this.providers = providers;
    const first = providers[0];
    this.model = first?.model || "unknown";
    this.dimensions = first?.dimensions || 384;
  }

  isAvailable(): boolean {
    return this.providers.some((p) => p.isAvailable());
  }

  async embed(text: string): Promise<EmbeddingResult> {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          return await provider.embed(text);
        } catch { /* tenta o próximo */ }
      }
    }
    // Último provider como fallback (MiniLM sempre está "available")
    const last = this.providers[this.providers.length - 1];
    if (last) return last.embed(text);
    throw new Error("No embedding provider available");
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          return await provider.embedBatch(texts);
        } catch { /* tenta o próximo */ }
      }
    }
    const last = this.providers[this.providers.length - 1];
    if (last) return last.embedBatch(texts);
    throw new Error("No embedding provider available");
  }
}

export function createEmbeddingProvider(): EmbeddingProvider {
  return new EmbeddingProviderChain([
    new OpenAIEmbeddingProvider(),
    new MiniLMEmbeddingProvider(),
  ]);
}
