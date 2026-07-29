import fs from "fs-extra";
import path from "path";
import { EventEmitter } from "events";
import { 
  ShortTermMemoryItem, 
  LongTermMemoryItem, 
  KnowledgeDocument, 
  VectorEmbedding,
  MemoryConfig,
  MemoryEvent,
  MemoryStats,
  SearchOptions,
  UnifiedSearchResult
} from "../types";
import { QdrantVectorStore } from "./QdrantVectorStore";

const DEFAULT_CONFIG: MemoryConfig = {
  stmMaxItemsPerSession: 200,
  stmTtlMs: 30 * 60 * 1000,
  ltmAutoSaveIntervalMs: 5000,
  ltmBackupEnabled: true,
  ltmMaxBackupFiles: 5,
  kbMinScoreForMatch: 0.2
};

/**
 * MemoryEngine v3.0 - Motor de Memoria Multicapa Mejorado para Trinnity Viseron System (Hyper-Brain)
 * Mejoras:
 *  - STM con TTL, límite por sesión y evicción LRU
 *  - LTM con persistencia debounced, backups automáticos y búsqueda full-text
 *  - KB con búsqueda por relevancia (TF-IDF ligero)
 *  - Búsqueda unificada en todas las capas
 *  - Consolidación automática STM→LTM
 *  - Sistema de eventos y estadísticas de salud
 */
export class MemoryEngine extends EventEmitter {
  private config: MemoryConfig;

  // Short Term Memory (In-Memory per session)
  private shortTermStore: Map<string, ShortTermMemoryItem[]> = new Map();

  // Long Term Memory (KV Map con respaldo en disco)
  private longTermStore: Map<string, LongTermMemoryItem> = new Map();

  // Full-text index for LTM
  private ltmFullTextIndex: Map<string, Set<string>> = new Map();

  // Knowledge Base
  private knowledgeStore: Map<string, KnowledgeDocument> = new Map();

  // Full-text index for KB
  private kbFullTextIndex: Map<string, Set<string>> = new Map();

  // Qdrant Vector Store
  public qdrant: QdrantVectorStore;

  private storagePath: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLTMSave: number | null = null;
  private backupCount: number = 0;
  private consolidationStats: { lastRun: number | null; totalPromoted: number } = { lastRun: null, totalPromoted: 0 };

  constructor(storageDir?: string, config?: Partial<MemoryConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storagePath = storageDir || path.join(process.cwd(), 'database', 'memory');
    fs.ensureDirSync(this.storagePath);
    this.qdrant = new QdrantVectorStore();
    this.loadLongTermMemory();
    this.loadAioxKnowledge();
  }

  private emitEvent(type: MemoryEvent['type'], data?: Record<string, any>): void {
    const event: MemoryEvent = { type, timestamp: Date.now(), data };
    this.emit('memory:event', event);
  }

  // ==========================================
  // 1. Short Term Memory (STM) Mejorada
  // ==========================================

  /**
   * Añade un ítem a STM con control de TTL y límite por sesión.
   * Si la sesión excede el límite, elimina los más viejos (LRU eviction).
   */
  public addShortTerm(sessionId: string, role: 'user' | 'agent' | 'system', content: string, metadata?: Record<string, any>): ShortTermMemoryItem {
    this.evictExpiredSTM(sessionId);

    const item: ShortTermMemoryItem = {
      id: `stm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      role,
      content,
      timestamp: Date.now(),
      metadata
    };

    if (!this.shortTermStore.has(sessionId)) {
      this.shortTermStore.set(sessionId, []);
    }

    const session = this.shortTermStore.get(sessionId)!;

    // LRU eviction: si excede el límite, eliminar los más antiguos
    if (session.length >= this.config.stmMaxItemsPerSession) {
      const removed = session.splice(0, session.length - this.config.stmMaxItemsPerSession + 1);
      this.emitEvent('stm:evicted', { sessionId, count: removed.length });
    }

    session.push(item);
    this.emitEvent('stm:added', { sessionId, itemId: item.id });
    return item;
  }

  public getShortTerm(sessionId: string, limit: number = 20): ShortTermMemoryItem[] {
    this.evictExpiredSTM(sessionId);
    const items = this.shortTermStore.get(sessionId) || [];
    return items.slice(-limit);
  }

  /**
   * Busca en STM por contenido textual.
   */
  public searchShortTerm(sessionId: string, query: string): ShortTermMemoryItem[] {
    this.evictExpiredSTM(sessionId);
    const items = this.shortTermStore.get(sessionId) || [];
    const q = query.toLowerCase();
    return items.filter(item =>
      item.content.toLowerCase().includes(q) ||
      (item.metadata && JSON.stringify(item.metadata).toLowerCase().includes(q))
    );
  }

  public clearShortTerm(sessionId: string): void {
    this.shortTermStore.delete(sessionId);
    this.emitEvent('stm:cleared', { sessionId });
  }

  /**
   * Limpia ítems expirados de una sesión STM según TTL configurado.
   */
  private evictExpiredSTM(sessionId: string): void {
    const items = this.shortTermStore.get(sessionId);
    if (!items || items.length === 0) return;

    const cutoff = Date.now() - this.config.stmTtlMs;
    const valid = items.filter(item => item.timestamp > cutoff);

    if (valid.length !== items.length) {
      this.shortTermStore.set(sessionId, valid);
    }
  }

  // ==========================================
  // 2. Long Term Memory (LTM) Mejorada
  // ==========================================

  public setLongTerm(key: string, value: any, tags: string[] = []): LongTermMemoryItem {
    const now = Date.now();
    const existing = this.longTermStore.get(key);
    
    const item: LongTermMemoryItem = {
      id: existing ? existing.id : `ltm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      key,
      value,
      tags,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };

    this.longTermStore.set(key, item);

    // Actualizar índice full-text
    this.indexLTM(item);

    this.scheduleSave();
    this.emitEvent('ltm:set', { key, tags });
    return item;
  }

  public getLongTerm(key: string): any | undefined {
    return this.longTermStore.get(key)?.value;
  }

  public getLongTermItem(key: string): LongTermMemoryItem | undefined {
    return this.longTermStore.get(key);
  }

  public deleteLongTerm(key: string): boolean {
    const existed = this.longTermStore.has(key);
    if (existed) {
      this.deindexLTM(this.longTermStore.get(key)!);
      this.longTermStore.delete(key);
      this.scheduleSave();
      this.emitEvent('ltm:deleted', { key });
    }
    return existed;
  }

  public searchLongTermByTag(tag: string): LongTermMemoryItem[] {
    const t = tag.toLowerCase();
    return Array.from(this.longTermStore.values()).filter(item =>
      item.tags.some(tag => tag.toLowerCase() === t)
    );
  }

  /**
   * Búsqueda full-text en LTM: busca en tags, key, y contenido serializado del value.
   */
  public searchLongTerm(query: string): LongTermMemoryItem[] {
    const q = query.toLowerCase();
    const results: LongTermMemoryItem[] = [];

    // Buscar en índice invertido de términos
    const termIndex = this.ltmFullTextIndex.get(q);
    if (termIndex) {
      for (const key of termIndex) {
        const item = this.longTermStore.get(key);
        if (item) results.push(item);
      }
    }

    // Fallback: búsqueda lineal en tags y key
    for (const item of this.longTermStore.values()) {
      if (results.some(r => r.key === item.key)) continue;
      if (item.key.toLowerCase().includes(q)) {
        results.push(item);
        continue;
      }
      if (item.tags.some(t => t.toLowerCase().includes(q))) {
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Lista todas las claves LTM.
   */
  public listLongTermKeys(): string[] {
    return Array.from(this.longTermStore.keys());
  }

  /**
   * Registra un ítem en el índice full-text de LTM.
   */
  private indexLTM(item: LongTermMemoryItem): void {
    const terms = this.tokenize(`${item.key} ${item.tags.join(' ')} ${JSON.stringify(item.value)}`);
    for (const term of terms) {
      if (!this.ltmFullTextIndex.has(term)) {
        this.ltmFullTextIndex.set(term, new Set());
      }
      this.ltmFullTextIndex.get(term)!.add(item.key);
    }
  }

  private deindexLTM(item: LongTermMemoryItem): void {
    const terms = this.tokenize(`${item.key} ${item.tags.join(' ')} ${JSON.stringify(item.value)}`);
    for (const term of terms) {
      const index = this.ltmFullTextIndex.get(term);
      if (index) {
        index.delete(item.key);
        if (index.size === 0) this.ltmFullTextIndex.delete(term);
      }
    }
  }

  // ==========================================
  // 3. Knowledge Base (KB) Mejorada
  // ==========================================

  public addKnowledge(title: string, category: string, content: string, tags: string[] = []): KnowledgeDocument {
    const doc: KnowledgeDocument = {
      id: `kb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      category,
      content,
      tags
    };

    this.knowledgeStore.set(doc.id, doc);
    this.indexKB(doc);
    this.emitEvent('kb:added', { docId: doc.id, title, category });
    return doc;
  }

  public removeKnowledge(docId: string): boolean {
    const doc = this.knowledgeStore.get(docId);
    if (doc) {
      this.deindexKB(doc);
      this.knowledgeStore.delete(docId);
      return true;
    }
    return false;
  }

  /**
   * Búsqueda por relevancia en KB usando TF-IDF ligero y scoring.
   * Mejor que simple includes() porque ordena por relevancia.
   */
  public searchKnowledge(query: string): KnowledgeDocument[] {
    const q = query.toLowerCase();
    const terms = this.tokenize(q);
    if (terms.length === 0) return [];

    const scored: Array<{ doc: KnowledgeDocument; score: number }> = [];

    for (const doc of this.knowledgeStore.values()) {
      const score = this.computeRelevance(doc, terms);
      if (score >= this.config.kbMinScoreForMatch) {
        scored.push({ doc, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.doc);
  }

  /**
   * Calcula relevancia de un documento contra términos de búsqueda.
   */
  private computeRelevance(doc: KnowledgeDocument, queryTerms: string[]): number {
    const docText = `${doc.title} ${doc.content} ${doc.tags.join(' ')} ${doc.category}`.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const count = (docText.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (count > 0) {
        // TF: frecuencia del término en el documento
        const tf = count / docText.split(/\s+/).length;
        // IDF simulado: los términos raros tienen más peso
        const matchingDocs = Array.from(this.knowledgeStore.values()).filter(d =>
          `${d.title} ${d.content} ${d.tags.join(' ')}`.toLowerCase().includes(term)
        ).length;
        const idf = Math.log((this.knowledgeStore.size + 1) / (matchingDocs + 1)) + 1;
        score += tf * idf;
      }
    }

    // Bonus por coincidencia exacta en título
    const titleLower = doc.title.toLowerCase();
    if (queryTerms.some(t => titleLower.includes(t))) {
      score *= 1.5;
    }

    // Bonus por coincidencia en tags
    if (doc.tags.some(t => queryTerms.some(qt => t.toLowerCase().includes(qt)))) {
      score *= 1.3;
    }

    // Normalizar
    return score / queryTerms.length;
  }

  public listKnowledge(category?: string): KnowledgeDocument[] {
    const all = Array.from(this.knowledgeStore.values());
    if (category) {
      return all.filter(d => d.category === category);
    }
    return all;
  }

  private indexKB(doc: KnowledgeDocument): void {
    const terms = this.tokenize(`${doc.title} ${doc.content} ${doc.tags.join(' ')} ${doc.category}`);
    for (const term of terms) {
      if (!this.kbFullTextIndex.has(term)) {
        this.kbFullTextIndex.set(term, new Set());
      }
      this.kbFullTextIndex.get(term)!.add(doc.id);
    }
  }

  private deindexKB(doc: KnowledgeDocument): void {
    const terms = this.tokenize(`${doc.title} ${doc.content} ${doc.tags.join(' ')} ${doc.category}`);
    for (const term of terms) {
      const index = this.kbFullTextIndex.get(term);
      if (index) {
        index.delete(doc.id);
        if (index.size === 0) this.kbFullTextIndex.delete(term);
      }
    }
  }

  // ==========================================
  // 4. Vector Memory API (Delegado en Qdrant)
  // ==========================================

  public async storeVector(vector: number[], payload: Record<string, any>): Promise<string> {
    const id = `vec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await this.qdrant.upsertVector(id, vector, payload);
    this.emitEvent('vector:stored', { vectorId: id });
    return id;
  }

  public async queryVector(queryVector: number[], topK: number = 5): Promise<VectorEmbedding[]> {
    return await this.qdrant.searchSimilar(queryVector, topK);
  }

  // ==========================================
  // 5. Búsqueda Unificada (todas las capas)
  // ==========================================

  /**
   * Busca en todas las capas de memoria y devuelve resultados unificados y rankeados.
   */
  public unifiedSearch(query: string, options?: SearchOptions): UnifiedSearchResult[] {
    const results: UnifiedSearchResult[] = [];
    const maxResults = options?.maxResults || 20;
    const q = query.toLowerCase();
    const terms = this.tokenize(q);

    if (terms.length === 0) return [];

    // Buscar en STM (todas las sesiones)
    if (options?.includeSTM !== false) {
      for (const [sessionId, items] of this.shortTermStore.entries()) {
        for (const item of items) {
          const score = this.computeTextScore(item.content, terms);
          if (score >= (options?.minScore || 0.1)) {
            results.push({
              source: 'stm',
              id: item.id,
              title: `[STM] ${sessionId} (${item.role})`,
              content: item.content.slice(0, 500),
              score,
              timestamp: item.timestamp,
              tags: item.metadata ? Object.keys(item.metadata) : undefined
            });
          }
        }
      }
    }

    // Buscar en LTM
    if (options?.includeLTM !== false) {
      for (const item of this.longTermStore.values()) {
        const text = `${item.key} ${item.tags.join(' ')} ${JSON.stringify(item.value)}`;
        const score = this.computeTextScore(text, terms);
        if (score >= (options?.minScore || 0.1)) {
          results.push({
            source: 'ltm',
            id: item.id,
            title: `[LTM] ${item.key}`,
            content: text.slice(0, 500),
            score,
            timestamp: item.updatedAt,
            tags: item.tags
          });
        }
      }
    }

    // Buscar en KB
    if (options?.includeKB !== false) {
      for (const doc of this.knowledgeStore.values()) {
        const text = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`;
        const score = this.computeTextScore(text, terms);
        if (score >= (options?.minScore || 0.1)) {
          results.push({
            source: 'kb',
            id: doc.id,
            title: doc.title,
            content: doc.content.slice(0, 500),
            score,
            timestamp: 0,
            tags: doc.tags
          });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  // ==========================================
  // 6. Consolidación STM → LTM
  // ==========================================

  /**
   * Promueve ítems frecuentemente accedidos de STM a LTM.
   * Los ítems que aparecen en múltiples sesiones o tienen alta relevancia
   * se consolidan en memoria de largo plazo.
   */
  public consolidateSTMtoLTM(): number {
    let promoted = 0;
    const accessCount = new Map<string, { content: string; sessions: Set<string>; lastTimestamp: number }>();

    // Contar accesos por contenido normalizado
    for (const [sessionId, items] of this.shortTermStore.entries()) {
      for (const item of items) {
        const normalized = item.content.toLowerCase().trim();
        if (normalized.length < 20) continue; // Ignorar ítems muy cortos

        if (!accessCount.has(normalized)) {
          accessCount.set(normalized, { content: item.content, sessions: new Set(), lastTimestamp: 0 });
        }
        const entry = accessCount.get(normalized)!;
        entry.sessions.add(sessionId);
        if (item.timestamp > entry.lastTimestamp) entry.lastTimestamp = item.timestamp;
      }
    }

    // Promover a LTM los que aparecen en 3+ sesiones o tienen contenido significativo
    for (const [, entry] of accessCount.entries()) {
      if (entry.sessions.size >= 3 || entry.content.length > 200) {
        const key = `consolidated_stm_${Date.now()}_${promoted}`;
        this.setLongTerm(key, {
          content: entry.content,
          sessions: Array.from(entry.sessions),
          consolidatedAt: Date.now()
        }, ['consolidated', 'stm_promoted']);
        promoted++;
      }
    }

    this.consolidationStats.lastRun = Date.now();
    this.consolidationStats.totalPromoted += promoted;
    this.emitEvent('consolidation:run', { promoted, total: this.consolidationStats.totalPromoted });
    return promoted;
  }

  // ==========================================
  // 7. Estadísticas y Salud
  // ==========================================

  public getStats(): MemoryStats {
    let stmTotalItems = 0;
    for (const items of this.shortTermStore.values()) {
      stmTotalItems += items.length;
    }

    const ltmTags = new Set<string>();
    for (const item of this.longTermStore.values()) {
      for (const tag of item.tags) ltmTags.add(tag);
    }

    const kbCategories = new Set<string>();
    for (const doc of this.knowledgeStore.values()) {
      kbCategories.add(doc.category);
    }

    const vectorProvider = this.detectVectorProvider();

    return {
      shortTerm: {
        totalSessions: this.shortTermStore.size,
        totalItems: stmTotalItems,
        avgItemsPerSession: this.shortTermStore.size > 0 ? stmTotalItems / this.shortTermStore.size : 0,
        memoryUsageBytes: this.estimateMemoryUsage()
      },
      longTerm: {
        totalItems: this.longTermStore.size,
        totalTags: ltmTags.size,
        lastSaved: this.lastLTMSave,
        backupCount: this.backupCount
      },
      knowledge: {
        totalDocuments: this.knowledgeStore.size,
        totalCategories: kbCategories.size
      },
      vector: {
        totalVectors: 0,
        provider: vectorProvider
      },
      consolidation: {
        lastRun: this.consolidationStats.lastRun,
        totalPromoted: this.consolidationStats.totalPromoted
      }
    };
  }

  private detectVectorProvider(): MemoryStats['vector']['provider'] {
    const qdrantHost = process.env.QDRANT_HOST || "http://localhost:6333";
    try {
      const url = new URL(qdrantHost);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return this.qdrant['fallbackStore']?.size > 0 ? 'fallback' : 'qdrant';
      }
      return 'qdrant';
    } catch {
      return 'unavailable';
    }
  }

  private estimateMemoryUsage(): number {
    let total = 0;
    for (const [, items] of this.shortTermStore.entries()) {
      for (const item of items) {
        total += item.content.length * 2;
        if (item.metadata) total += JSON.stringify(item.metadata).length * 2;
      }
    }
    return total;
  }

  // ==========================================
  // 8. Persistencia Mejorada
  // ==========================================

  /**
   * Persistencia debounced: agrupa escrituras consecutivas
   * para evitar E/S excesiva en el disco.
   */
  private scheduleSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveLongTermMemory();
      this.saveTimer = null;
    }, this.config.ltmAutoSaveIntervalMs);
  }

  /**
   * Guarda LTM a disco con respaldo opcional.
   */
  private saveLongTermMemory(): void {
    try {
      const file = path.join(this.storagePath, 'ltm.json');
      const data = Array.from(this.longTermStore.values());

      // Backup del archivo anterior si existe
      if (this.config.ltmBackupEnabled && fs.existsSync(file)) {
        this.createBackup(file);
      }

      fs.writeJsonSync(file, data, { spaces: 2 });
      this.lastLTMSave = Date.now();
    } catch (err) {
      console.error('[MemoryEngine] Error al guardar Long Term Memory:', err);
    }
  }

  private createBackup(file: string): void {
    try {
      const backupDir = path.join(this.storagePath, 'backups');
      fs.ensureDirSync(backupDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `ltm_backup_${timestamp}.json`);
      fs.copyFileSync(file, backupFile);
      this.backupCount++;

      // Limitar número de backups
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('ltm_backup_'))
        .sort()
        .reverse();

      while (backups.length > this.config.ltmMaxBackupFiles) {
        const old = backups.pop()!;
        fs.removeSync(path.join(backupDir, old));
      }
    } catch (err) {
      console.warn('[MemoryEngine] Error al crear backup LTM:', err);
    }
  }

  private loadLongTermMemory(): void {
    try {
      const file = path.join(this.storagePath, 'ltm.json');
      if (fs.existsSync(file)) {
        const items: LongTermMemoryItem[] = fs.readJsonSync(file);
        for (const item of items) {
          this.longTermStore.set(item.key, item);
          this.indexLTM(item);
        }
        console.log(`[MemoryEngine] LTM cargada: ${items.length} registros`);
      }
    } catch (err) {
      console.error('[MemoryEngine] Error al cargar Long Term Memory:', err);
    }
  }

  /**
   * Guardado forzado inmediato.
   */
  public flush(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.saveLongTermMemory();
  }

  // ==========================================
  // 9. Conocimiento Base AIOX
  // ==========================================

  private loadAioxKnowledge(): void {
    this.addKnowledge(
      "AIOX 50-Year Collective Intelligence Base",
      "AIOX_EXPERIENCE",
      "Compendio acumulado de 50 años hipotéticos de experiencia en orquestación multiagente, auto-refuerzo, patrones de seguridad defensivos y optimización de razonamiento.",
      ["aiox", "pedro", "trinnity", "learning", "50_years"]
    );

    this.addKnowledge(
      "Squad Governance & Leadership Model",
      "AIOX_EXPERIENCE",
      "Modelo de gobernanza basado en Pedro Costa como Commander/CEO y Trinnity Hurtado como Queen/Architect. Los squads se organizan por propósito con líderes claros y permisos granulares.",
      ["aiox", "pedro", "trinnity", "governance", "squads"]
    );

    this.addKnowledge(
      "Multi-Agent Orchestration Patterns",
      "AIOX_EXPERIENCE",
      "Patrones de orquestación multi-agente: descomposición de tareas, ejecución paralela, síntesis de resultados, y asignación inteligente basada en roles y capacidades.",
      ["aiox", "orchestration", "agents", "patterns"]
    );
  }

  // ==========================================
  // 10. Utilidades Compartidas
  // ==========================================

  /**
   * Tokeniza un texto en términos normalizados para indexación.
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúüñ\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2)
      .slice(0, 100);
  }

  /**
   * Calcula un score de relevancia entre un texto y términos de búsqueda.
   */
  private computeTextScore(text: string, queryTerms: string[]): number {
    const lower = text.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const count = (lower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (count > 0) {
        const tf = count / (lower.split(/\s+/).length || 1);
        score += tf;
      }
    }

    return score / queryTerms.length;
  }
}
