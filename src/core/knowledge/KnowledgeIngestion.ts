// VISERON S9 Foundation — Knowledge Ingestion + Source Registry + Web Fetch
// Minimum hardening for autonomous knowledge acquisition
// 2026-08-11

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { chunkText, TextChunk } from "../memory/Chunker";

// ── SOURCE REGISTRY ────────────────────────────────────

export interface KnowledgeSource {
  sourceId: string;
  sourceType: "url" | "file" | "repository" | "document" | "skill" | "api";
  uri: string;
  title?: string;
  author?: string;
  retrievedAt: number;
  contentHash: string;
  contentType?: string;
  textLength: number;
  language?: string;
  status: "ingested" | "indexed" | "embedded" | "failed";
  metadata?: Record<string, any>;
}

export class SourceRegistry {
  private sources: Map<string, KnowledgeSource> = new Map();
  private indexPath: string;

  constructor(dataDir: string) {
    this.indexPath = path.join(dataDir, "knowledge", "source-registry.jsonl");
    if (!fs.existsSync(path.dirname(this.indexPath))) fs.mkdirSync(path.dirname(this.indexPath), { recursive: true });
    this.load();
  }

  register(source: KnowledgeSource): KnowledgeSource {
    // Dedup by hash
    const existing = Array.from(this.sources.values()).find(s => s.contentHash === source.contentHash);
    if (existing) return existing;

    source.sourceId = source.sourceId || `src_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
    source.retrievedAt = source.retrievedAt || Date.now();
    this.sources.set(source.sourceId, source);
    this.persist(source);
    return source;
  }

  get(sourceId: string): KnowledgeSource | undefined { return this.sources.get(sourceId); }

  list(type?: string): KnowledgeSource[] {
    const all = Array.from(this.sources.values());
    return type ? all.filter(s => s.sourceType === type) : all;
  }

  status() {
    const all = Array.from(this.sources.values());
    return {
      total: all.length,
      ingested: all.filter(s => s.status === "ingested" || s.status === "indexed" || s.status === "embedded").length,
      failed: all.filter(s => s.status === "failed").length,
      byType: Object.fromEntries(["url","file","repository","document","skill","api"].map(t => [t, all.filter(s => s.sourceType === t).length])),
    };
  }

  private persist(source: KnowledgeSource): void {
    try { fs.appendFileSync(this.indexPath, JSON.stringify(source) + "\n"); } catch {}
  }
  private load(): void {
    try {
      if (fs.existsSync(this.indexPath)) {
        const lines = fs.readFileSync(this.indexPath, "utf8").trim().split("\n").filter(Boolean);
        for (const l of lines) { try { const s = JSON.parse(l); if (s.sourceId) this.sources.set(s.sourceId, s); } catch {} }
      }
    } catch {}
  }
}

// ── WEB FETCH ──────────────────────────────────────────

export interface FetchResult {
  url: string;
  statusCode: number;
  contentType?: string;
  text: string;
  title?: string;
  textLength: number;
  contentHash: string;
  retrievedAt: number;
  error?: string;
}

export class WebFetcher {
  async fetch(url: string, options: { timeout?: number; maxSize?: number } = {}): Promise<FetchResult> {
    const timeout = options.timeout || 10000;
    const maxSize = options.maxSize || 500000;
    const start = Date.now();

    try {
      const http = url.startsWith("https") ? await import("https") : await import("http");
      const result = await new Promise<FetchResult>((resolve, reject) => {
        const req = http.get(url, { timeout, headers: { "User-Agent": "VISERON/5.0 KnowledgeIngestion" } }, (res) => {
          let data = "";
          res.on("data", (chunk: string) => { data += chunk; if (data.length > maxSize) { req.destroy(); resolve({ url, statusCode: res.statusCode || 0, text: data.slice(0, maxSize), textLength: data.length, contentHash: sha256(data), retrievedAt: Date.now(), error: "max size exceeded" }); } });
          res.on("end", () => {
            const text = data;
            const title = extractTitle(text);
            resolve({ url, statusCode: res.statusCode || 0, contentType: res.headers["content-type"], text, title, textLength: text.length, contentHash: sha256(text), retrievedAt: Date.now() });
          });
          res.on("error", (e: Error) => reject(e));
        });
        req.on("error", (e: Error) => reject(e));
        req.setTimeout(timeout, () => { req.destroy(); reject(new Error("timeout")); });
      });
      return result;
    } catch (e: any) {
      return { url, statusCode: 0, text: "", textLength: 0, contentHash: "", retrievedAt: Date.now(), error: e.message };
    }
  }
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim().slice(0, 200) : undefined;
}

// ── DOCUMENT INGESTION ─────────────────────────────────

export interface IngestResult {
  sourceId: string;
  text: string;
  chunks: TextChunk[];
  contentHash: string;
  textLength: number;
  source: KnowledgeSource;
}

export class DocumentIngestor {
  constructor(private sourceRegistry: SourceRegistry) {}

  ingestFile(filePath: string): IngestResult | null {
    if (!fs.existsSync(filePath)) return null;

    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) return null; // 10MB limit

    // Try to read as text
    let text = "";
    try {
      text = fs.readFileSync(filePath, "utf8");
    } catch { return null; }
    if (text.length < 50) return null;

    const contentHash = sha256(text);
    const ext = path.extname(filePath).toLowerCase();

    // Register source
    const source = this.sourceRegistry.register({
      sourceId: `file_${contentHash.slice(0, 12)}`,
      sourceType: ext === ".pdf" ? "document" : "file",
      uri: filePath,
      title: path.basename(filePath),
      retrievedAt: Date.now(),
      contentHash,
      contentType: ext,
      textLength: text.length,
      status: "ingested",
      metadata: { size: stat.size, ext },
    });

    // Chunk
    const chunks = chunkText(text.slice(0, 50000), { chunkSize: 512, overlap: 128, source: source.sourceId });

    // Mark as indexed
    source.status = "indexed";

    return { sourceId: source.sourceId, text: text.slice(0, 50000), chunks, contentHash, textLength: text.length, source };
  }
}

function sha256(s: string): string { return crypto.createHash("sha256").update(s).digest("hex"); }
