import * as fs from "fs-extra";
import * as path from "path";
import { createHash } from "crypto";
import { EventEmitter } from "events";

// ==========================================
// Interfaces
// ==========================================

export interface MemoryEntry {
  id: string;
  type: "interaction" | "knowledge" | "fact" | "code" | "decision" | "error";
  content: string;
  embedding?: number[];
  title: string;
  category: string;
  key: string;
  value: any;
  metadata: {
    source: string;
    lang: string;
    tags: string[];
    importance: number;
    accessCount: number;
    createdAt: string;
    lastAccessedAt: string;
  };
}

export interface MemoryQuery {
  text: string;
  type?: string;
  tags?: string[];
  limit?: number;
  minImportance?: number;
  timeRange?: { from?: string; to?: string };
}

export interface MemoryResult {
  entry: MemoryEntry;
  score: number;
  layer: "stm" | "ltm" | "kb";
}

export interface MemoryStats {
  stm: number;
  ltm: number;
  kb: number;
  total: number;
  totalSizeBytes: number;
  lastConsolidation: string;
  queriesTotal: number;
  avgRecallScore: number;
}

// ==========================================
// Constants
// ==========================================

const EMBEDDING_DIM = 384;
const STM_MAX = 100;
const STM_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const LTM_ACCESS_THRESHOLD = 10;
const DEDUP_SIMILARITY = 0.95;
const CONSOLIDATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ==========================================
// MemoryEngine — RAG system with STM/LTM/KB
// ==========================================

export class MemoryEngine extends EventEmitter {
  private stm: MemoryEntry[] = [];
  private ltm: MemoryEntry[] = [];
  private kb: MemoryEntry[] = [];

  private storageDir: string;
  private consolidationTimer: ReturnType<typeof setInterval> | null = null;
  private stats = {
    queriesTotal: 0,
    totalScore: 0,
    lastConsolidation: new Date().toISOString(),
  };

  constructor(storageDir?: string) {
    super();
    this.storageDir = storageDir || path.join(process.cwd(), "data", "memory");
    fs.ensureDirSync(this.storageDir);
    this.loadFromDisk();
    this.startConsolidation();
  }

  // ==========================================
  // Embedding — deterministic hash-based 384-dim
  // ==========================================

  generateEmbedding(text: string): number[] {
    const embedding = new Array(EMBEDDING_DIM).fill(0);
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ");
    const tokens = normalized.split(/\s+/).filter((t) => t.length > 0);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const hash = createHash("sha256").update(token).digest();
      const seed = hash.readUInt32BE(0);
      const angle = ((i + 1) * seed) % EMBEDDING_DIM;
      const magnitude = 1.0 / Math.sqrt(tokens.length);

      for (let d = 0; d < EMBEDDING_DIM; d++) {
        const phase = (2 * Math.PI * d * angle) / EMBEDDING_DIM;
        embedding[d] += magnitude * Math.cos(phase);
      }

      const charHash = createHash("sha256").update(token + "_char").digest();
      for (let d = 0; d < EMBEDDING_DIM && d < 64; d++) {
        const byteVal = charHash[d % 32];
        embedding[d] += (byteVal / 255.0 - 0.5) * 0.01;
      }
    }

    let norm = 0;
    for (let d = 0; d < EMBEDDING_DIM; d++) {
      norm += embedding[d] * embedding[d];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let d = 0; d < EMBEDDING_DIM; d++) {
        embedding[d] /= norm;
      }
    }

    return embedding;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  // ==========================================
  // Write Operations
  // ==========================================

  remember(
    content: string,
    type: MemoryEntry["type"],
    metadata: Partial<MemoryEntry["metadata"]> = {}
  ): MemoryEntry {
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      content,
      title: content.slice(0, 80),
      category: type,
      key: `mem_${Date.now()}`,
      value: content,
      embedding: this.generateEmbedding(content),
      metadata: {
        source: metadata.source || "api",
        lang: metadata.lang || "es",
        tags: metadata.tags || [],
        importance: metadata.importance ?? 0.5,
        accessCount: 0,
        createdAt: now,
        lastAccessedAt: now,
      },
    };

    this.stm.push(entry);
    if (this.stm.length > STM_MAX) {
      this.stm.shift();
    }

    this.emit("memory:remembered", { id: entry.id, type, layer: "stm" });
    this.persistToDisk();
    return entry;
  }

  forget(id: string): boolean {
    const before = this.stm.length + this.ltm.length + this.kb.length;
    this.stm = this.stm.filter((e) => e.id !== id);
    this.ltm = this.ltm.filter((e) => e.id !== id);
    this.kb = this.kb.filter((e) => e.id !== id);
    const removed = before > this.stm.length + this.ltm.length + this.kb.length;
    if (removed) {
      this.emit("memory:forgotten", { id });
      this.persistToDisk();
    }
    return removed;
  }

  updateImportance(id: string, importance: number): boolean {
    const entry = this.findEntry(id);
    if (!entry) return false;
    entry.metadata.importance = Math.max(0, Math.min(1, importance));
    this.emit("memory:importance_updated", { id, importance: entry.metadata.importance });
    this.persistToDisk();
    return true;
  }

  addKnowledge(
    contentOrTitle: string,
    sourceOrCategory: string,
    contentOrTags?: string | string[],
    maybeTags?: string[]
  ): MemoryEntry {
    let content: string;
    let source: string;
    let tags: string[];

    if (Array.isArray(contentOrTags) || typeof contentOrTags === "string") {
      content = contentOrTitle;
      source = sourceOrCategory;
      tags = Array.isArray(contentOrTags) ? contentOrTags : (maybeTags || []);
    } else {
      content = contentOrTags || contentOrTitle;
      source = sourceOrCategory;
      tags = maybeTags || [];
    }

    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "knowledge",
      content,
      title: content.slice(0, 80),
      category: source,
      key: `kb_${Date.now()}`,
      value: content,
      embedding: this.generateEmbedding(content),
      metadata: {
        source,
        lang: "es",
        tags,
        importance: 0.7,
        accessCount: 0,
        createdAt: now,
        lastAccessedAt: now,
      },
    };

    this.kb.push(entry);
    this.emit("memory:knowledge_added", { id: entry.id, source });
    this.persistToDisk();
    return entry;
  }

  consolidate(): { stmToLtm: number; ltmToKb: number; deduped: number } {
    let stmToLtm = 0;
    let ltmToKb = 0;
    let deduped = 0;

    const now = Date.now();
    const cutoff = now - STM_MAX_AGE_MS;
    const toPromote: MemoryEntry[] = [];
    const remaining: MemoryEntry[] = [];

    for (const entry of this.stm) {
      const created = new Date(entry.metadata.createdAt).getTime();
      if (created < cutoff || entry.metadata.importance >= 0.8) {
        toPromote.push(entry);
      } else {
        remaining.push(entry);
      }
    }

    this.stm = remaining;

    for (const entry of toPromote) {
      entry.metadata.accessCount++;
      this.ltm.push(entry);
      stmToLtm++;
    }

    const toPromoteKb: MemoryEntry[] = [];
    const remainingLtm: MemoryEntry[] = [];

    for (const entry of this.ltm) {
      if (entry.metadata.accessCount >= LTM_ACCESS_THRESHOLD) {
        toPromoteKb.push(entry);
      } else {
        remainingLtm.push(entry);
      }
    }

    this.ltm = remainingLtm;

    for (const entry of toPromoteKb) {
      this.kb.push(entry);
      ltmToKb++;
    }

    deduped = this.deduplicateAll();

    this.stats.lastConsolidation = new Date().toISOString();
    this.emit("memory:consolidated", { stmToLtm, ltmToKb, deduped });
    this.persistToDisk();

    return { stmToLtm, ltmToKb, deduped };
  }

  private deduplicateAll(): number {
    let removed = 0;
    removed += this.deduplicateLayer(this.stm);
    removed += this.deduplicateLayer(this.ltm);
    removed += this.deduplicateLayer(this.kb);
    return removed;
  }

  private deduplicateLayer(layer: MemoryEntry[]): number {
    const toRemove = new Set<string>();
    for (let i = 0; i < layer.length; i++) {
      if (toRemove.has(layer[i].id)) continue;
      for (let j = i + 1; j < layer.length; j++) {
        if (toRemove.has(layer[j].id)) continue;
        if (layer[i].embedding && layer[j].embedding) {
          const sim = this.cosineSimilarity(layer[i].embedding!, layer[j].embedding!);
          if (sim >= DEDUP_SIMILARITY) {
            if (layer[i].metadata.importance >= layer[j].metadata.importance) {
              toRemove.add(layer[j].id);
            } else {
              toRemove.add(layer[i].id);
              break;
            }
          }
        }
      }
    }
    if (toRemove.size > 0) {
      const removeIds = Array.from(toRemove);
      for (let k = layer.length - 1; k >= 0; k--) {
        if (removeIds.indexOf(layer[k].id) !== -1) {
          layer.splice(k, 1);
        }
      }
    }
    return toRemove.size;
  }

  // ==========================================
  // Read Operations
  // ==========================================

  recall(query: MemoryQuery): MemoryResult[] {
    const queryEmbedding = this.generateEmbedding(query.text);
    const results: MemoryResult[] = [];
    const limit = query.limit || 20;

    const scoreLayer = (
      entries: MemoryEntry[],
      layer: "stm" | "ltm" | "kb"
    ) => {
      for (const entry of entries) {
        if (query.type && entry.type !== query.type) continue;
        if (
          query.tags &&
          query.tags.length > 0 &&
          !query.tags.some((t) => entry.metadata.tags.includes(t))
        )
          continue;
        if (
          query.minImportance !== undefined &&
          entry.metadata.importance < query.minImportance
        )
          continue;
        if (query.timeRange) {
          const created = new Date(entry.metadata.createdAt).getTime();
          if (query.timeRange.from && created < new Date(query.timeRange.from).getTime())
            continue;
          if (query.timeRange.to && created > new Date(query.timeRange.to).getTime())
            continue;
        }

        let score: number;
        if (entry.embedding) {
          score = this.cosineSimilarity(queryEmbedding, entry.embedding);
        } else {
          score = this.textSimilarity(query.text, entry.content);
        }

        entry.metadata.accessCount++;
        entry.metadata.lastAccessedAt = new Date().toISOString();

        results.push({ entry, score, layer });
      }
    };

    scoreLayer(this.stm, "stm");
    scoreLayer(this.ltm, "ltm");
    scoreLayer(this.kb, "kb");

    results.sort((a, b) => b.score - a.score);
    const top = results.slice(0, limit);

    this.stats.queriesTotal++;
    this.stats.totalScore += top.length > 0 ? top[0].score : 0;

    this.emit("memory:recalled", {
      query: query.text,
      resultCount: top.length,
      topScore: top.length > 0 ? top[0].score : 0,
    });

    return top;
  }

  recallByType(
    type: MemoryEntry["type"],
    limit: number = 20
  ): MemoryResult[] {
    const results: MemoryResult[] = [];
    const scoreLayer = (
      entries: MemoryEntry[],
      layer: "stm" | "ltm" | "kb"
    ) => {
      for (const entry of entries) {
        if (entry.type === type) {
          entry.metadata.accessCount++;
          entry.metadata.lastAccessedAt = new Date().toISOString();
          results.push({ entry, score: 1.0, layer });
        }
      }
    };
    scoreLayer(this.stm, "stm");
    scoreLayer(this.ltm, "ltm");
    scoreLayer(this.kb, "kb");
    return results.slice(0, limit);
  }

  recallByTags(tags: string[], limit: number = 20): MemoryResult[] {
    const results: MemoryResult[] = [];
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));
    const scoreLayer = (
      entries: MemoryEntry[],
      layer: "stm" | "ltm" | "kb"
    ) => {
      for (const entry of entries) {
        const matchCount = entry.metadata.tags.filter((t) =>
          tagSet.has(t.toLowerCase())
        ).length;
        if (matchCount > 0) {
          entry.metadata.accessCount++;
          entry.metadata.lastAccessedAt = new Date().toISOString();
          results.push({
            entry,
            score: matchCount / tags.length,
            layer,
          });
        }
      }
    };
    scoreLayer(this.stm, "stm");
    scoreLayer(this.ltm, "ltm");
    scoreLayer(this.kb, "kb");
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  getRecent(limit: number = 50): MemoryEntry[] {
    return this.stm.slice(-limit).reverse();
  }

  getStats(): any {
    const totalSize =
      this.estimateSize(this.stm) +
      this.estimateSize(this.ltm) +
      this.estimateSize(this.kb);

    const ltmTags = new Set<string>();
    for (const e of this.ltm) {
      for (const t of e.metadata.tags) ltmTags.add(t);
    }

    const kbCategories = new Set<string>();
    for (const e of this.kb) {
      kbCategories.add(e.metadata.source);
    }

    return {
      stm: this.stm.length,
      ltm: this.ltm.length,
      kb: this.kb.length,
      total: this.stm.length + this.ltm.length + this.kb.length,
      totalSizeBytes: totalSize,
      lastConsolidation: this.stats.lastConsolidation,
      queriesTotal: this.stats.queriesTotal,
      avgRecallScore:
        this.stats.queriesTotal > 0
          ? this.stats.totalScore / this.stats.queriesTotal
          : 0,
      shortTerm: {
        totalSessions: this.stmSessionStore.size,
        totalItems: this.stm.length,
        avgItemsPerSession:
          this.stmSessionStore.size > 0
            ? this.stm.length / this.stmSessionStore.size
            : 0,
        memoryUsageBytes: this.estimateSize(this.stm),
      },
      longTerm: {
        totalItems: this.ltm.length,
        totalTags: ltmTags.size,
        lastSaved: null,
        backupCount: 0,
      },
      knowledge: {
        totalDocuments: this.kb.length,
        totalCategories: kbCategories.size,
      },
      vector: {
        totalVectors: this.kb.filter((e) => e.embedding).length,
        provider: "fallback" as const,
      },
      consolidation: {
        lastRun: this.consolidationStats.lastRun,
        totalPromoted: this.consolidationStats.totalPromoted,
      },
    };
  }

  exportAll(): {
    stm: MemoryEntry[];
    ltm: MemoryEntry[];
    kb: MemoryEntry[];
    stats: MemoryStats;
  } {
    return {
      stm: [...this.stm],
      ltm: [...this.ltm],
      kb: [...this.kb],
      stats: this.getStats(),
    };
  }

  // ==========================================
  // Text similarity fallback
  // ==========================================

  private textSimilarity(a: string, b: string): number {
    const tokensA = new Set(
      a.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
    );
    const tokensB = new Set(
      b.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
    );
    if (tokensA.size === 0 || tokensB.size === 0) return 0;
    let intersection = 0;
    const tokensAArray = Array.from(tokensA);
    for (let i = 0; i < tokensAArray.length; i++) {
      if (tokensB.has(tokensAArray[i])) intersection++;
    }
    return intersection / Math.max(tokensA.size, tokensB.size);
  }

  // ==========================================
  // Persistence
  // ==========================================

  private persistToDisk(): void {
    try {
      const stmFile = path.join(this.storageDir, "stm.json");
      const ltmFile = path.join(this.storageDir, "long-term.jsonl");
      const kbFile = path.join(this.storageDir, "knowledge.json");
      const statsFile = path.join(this.storageDir, "stats.json");

      fs.writeJsonSync(stmFile, this.stm, { spaces: 2 });

      const ltmLines = this.ltm.map((e) => JSON.stringify(e)).join("\n");
      fs.writeFileSync(ltmFile, ltmLines, "utf-8");

      fs.writeJsonSync(kbFile, this.kb, { spaces: 2 });

      fs.writeJsonSync(statsFile, this.stats, { spaces: 2 });
    } catch (err) {
      console.error("[MemoryEngine] Persist error:", err);
    }
  }

  private loadFromDisk(): void {
    try {
      const stmFile = path.join(this.storageDir, "stm.json");
      if (fs.existsSync(stmFile)) {
        this.stm = fs.readJsonSync(stmFile);
        if (this.stm.length > STM_MAX) {
          this.stm = this.stm.slice(-STM_MAX);
        }
      }

      const ltmFile = path.join(this.storageDir, "long-term.jsonl");
      if (fs.existsSync(ltmFile)) {
        const content = fs.readFileSync(ltmFile, "utf-8").trim();
        if (content) {
          this.ltm = content
            .split("\n")
            .filter((l) => l.trim().length > 0)
            .map((l) => JSON.parse(l));
        }
      }

      const kbFile = path.join(this.storageDir, "knowledge.json");
      if (fs.existsSync(kbFile)) {
        this.kb = fs.readJsonSync(kbFile);
      }

      const statsFile = path.join(this.storageDir, "stats.json");
      if (fs.existsSync(statsFile)) {
        const loaded = fs.readJsonSync(statsFile);
        this.stats = { ...this.stats, ...loaded };
      }

      console.log(
        `[MemoryEngine] Loaded: STM=${this.stm.length} LTM=${this.ltm.length} KB=${this.kb.length}`
      );
    } catch (err) {
      console.error("[MemoryEngine] Load error:", err);
    }
  }

  // ==========================================
  // Consolidation timer
  // ==========================================

  private startConsolidation(): void {
    this.consolidationTimer = setInterval(() => {
      this.consolidate();
    }, CONSOLIDATION_INTERVAL_MS);
  }

  stopConsolidation(): void {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
      this.consolidationTimer = null;
    }
  }

  // ==========================================
  // Helpers
  // ==========================================

  private findEntry(id: string): MemoryEntry | undefined {
    return (
      this.stm.find((e) => e.id === id) ||
      this.ltm.find((e) => e.id === id) ||
      this.kb.find((e) => e.id === id)
    );
  }

  searchKnowledge(query: string): MemoryEntry[] {
    const q = query.toLowerCase();
    return this.kb.filter(
      (e) =>
        e.content.toLowerCase().includes(q) ||
        e.metadata.source.toLowerCase().includes(q) ||
        e.metadata.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  listKnowledge(category?: string): MemoryEntry[] {
    if (category) {
      return this.kb.filter((e) => e.metadata.source === category);
    }
    return [...this.kb];
  }

  private estimateSize(entries: MemoryEntry[]): number {
    let bytes = 0;
    for (const e of entries) {
      bytes += e.content.length * 2;
      bytes += (e.embedding?.length || 0) * 8;
      bytes += JSON.stringify(e.metadata).length * 2;
    }
    return bytes;
  }

  // ==========================================
  // Backward-compatible API (old consumers)
  // ==========================================

  private ltmKeyStore: Map<string, MemoryEntry> = new Map();
  private stmSessionStore: Map<string, MemoryEntry[]> = new Map();

  setLongTerm(key: string, value: any, tags: string[] = []): void {
    const existing = this.ltmKeyStore.get(key);
    if (existing) {
      existing.content = typeof value === "string" ? value : JSON.stringify(value);
      existing.value = value;
      existing.metadata.tags = tags;
      existing.metadata.lastAccessedAt = new Date().toISOString();
    } else {
      const now = new Date().toISOString();
      const entry: MemoryEntry = {
        id: `ltm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: "fact",
        content: typeof value === "string" ? value : JSON.stringify(value),
        key,
        value,
        title: key,
        category: "ltm",
        embedding: this.generateEmbedding(typeof value === "string" ? value : JSON.stringify(value)),
        metadata: {
          source: "legacy-ltm",
          lang: "es",
          tags,
          importance: 0.6,
          accessCount: 0,
          createdAt: now,
          lastAccessedAt: now,
        },
      };
      this.ltmKeyStore.set(key, entry);
      this.ltm.push(entry);
    }
    this.persistToDisk();
  }

  getLongTerm(key: string): any {
    const entry = this.ltmKeyStore.get(key);
    if (entry) {
      entry.metadata.accessCount++;
      entry.metadata.lastAccessedAt = new Date().toISOString();
      return entry.content;
    }
    return undefined;
  }

  listLongTermKeys(): string[] {
    return Array.from(this.ltmKeyStore.keys());
  }

  searchLongTerm(query: string): MemoryEntry[] {
    const q = query.toLowerCase();
    return this.ltm.filter(
      (e) =>
        e.content.toLowerCase().includes(q) ||
        e.metadata.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  unifiedSearch(
    query: string,
    options?: {
      maxResults?: number;
      minScore?: number;
      includeSTM?: boolean;
      includeLTM?: boolean;
      includeKB?: boolean;
    }
  ): Array<{
    source: string;
    id: string;
    title: string;
    content: string;
    score: number;
    timestamp: number;
    tags?: string[];
  }> {
    const results = this.recall({
      text: query,
      limit: options?.maxResults || 20,
    });
    return results.map((r) => ({
      source: r.layer,
      id: r.entry.id,
      title: `[${r.layer.toUpperCase()}] ${r.entry.type}`,
      content: r.entry.content.slice(0, 500),
      score: r.score,
      timestamp: new Date(r.entry.metadata.createdAt).getTime(),
      tags: r.entry.metadata.tags,
    }));
  }

  async storeVector(
    vector: number[],
    payload: Record<string, any>
  ): Promise<string> {
    const id = `vec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id,
      type: "knowledge",
      content: payload.content || payload.text || JSON.stringify(payload),
      title: payload.title || payload.content || "vector",
      category: payload.source || "vector-store",
      key: id,
      value: payload,
      embedding: vector,
      metadata: {
        source: payload.source || "vector-store",
        lang: payload.lang || "es",
        tags: payload.tags || [],
        importance: 0.5,
        accessCount: 0,
        createdAt: now,
        lastAccessedAt: now,
      },
    };
    this.kb.push(entry);
    this.persistToDisk();
    return id;
  }

  async queryVector(
    queryVector: number[],
    topK: number = 5
  ): Promise<Array<{ id: string; vector: number[]; payload: Record<string, any>; score: number }>> {
    const allWithEmbeddings = [...this.stm, ...this.ltm, ...this.kb].filter(
      (e) => e.embedding && e.embedding.length === queryVector.length
    );

    const scored = allWithEmbeddings.map((entry) => ({
      id: entry.id,
      vector: entry.embedding!,
      payload: {
        content: entry.content,
        type: entry.type,
        source: entry.metadata.source,
        tags: entry.metadata.tags,
      },
      score: this.cosineSimilarity(queryVector, entry.embedding!),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  addShortTerm(
    sessionId: string,
    role: "user" | "agent" | "system",
    content: string,
    metadata?: Record<string, any>
  ): MemoryEntry {
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: `stm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "interaction",
      content,
      title: content.slice(0, 80),
      category: `session:${sessionId}`,
      key: `stm_${Date.now()}`,
      value: content,
      embedding: this.generateEmbedding(content),
      metadata: {
        source: `session:${sessionId}`,
        lang: metadata?.lang || "es",
        tags: metadata?.tags || [role],
        importance: 0.3,
        accessCount: 0,
        createdAt: now,
        lastAccessedAt: now,
      },
    };

    if (!this.stmSessionStore.has(sessionId)) {
      this.stmSessionStore.set(sessionId, []);
    }
    const session = this.stmSessionStore.get(sessionId)!;
    session.push(entry);
    this.stm.push(entry);

    if (this.stm.length > STM_MAX) {
      this.stm.shift();
    }

    return entry;
  }

  getShortTerm(sessionId: string, limit: number = 20): MemoryEntry[] {
    const session = this.stmSessionStore.get(sessionId) || [];
    return session.slice(-limit);
  }

  searchShortTerm(sessionId: string, query: string): MemoryEntry[] {
    const session = this.stmSessionStore.get(sessionId) || [];
    const q = query.toLowerCase();
    return session.filter((e) => e.content.toLowerCase().includes(q));
  }

  consolidationStats = { lastRun: null as number | null, totalPromoted: 0 };

  consolidateSTMtoLTM(): number {
    let promoted = 0;
    const now = Date.now();
    const cutoff = now - STM_MAX_AGE_MS;
    const remaining: MemoryEntry[] = [];

    for (const entry of this.stm) {
      const created = new Date(entry.metadata.createdAt).getTime();
      if (created < cutoff || entry.metadata.importance >= 0.8) {
        this.ltm.push(entry);
        promoted++;
      } else {
        remaining.push(entry);
      }
    }

    this.stm = remaining;
    this.consolidationStats.lastRun = now;
    this.consolidationStats.totalPromoted += promoted;
    this.persistToDisk();
    return promoted;
  }

  flush(): void {
    this.persistToDisk();
  }

  destroy(): void {
    this.stopConsolidation();
    this.flush();
    this.removeAllListeners();
  }
}
