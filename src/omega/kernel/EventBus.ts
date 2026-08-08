export type KernelEventHandler<T = any> = (payload: T, meta: KernelEventMeta) => void | Promise<void>;

export interface KernelEventMeta {
  eventId: string;
  topic: string;
  source: string;
  timestamp: number;
}

export interface KernelEvent<T = any> {
  topic: string;
  payload: T;
  source?: string;
  meta?: KernelEventMeta;
}

export interface EventBusStats {
  topics: number;
  totalSubscribers: number;
  totalEmitted: number;
  totalErrors: number;
  historySize: number;
  maxHistory: number;
}

export interface SubscribeOptions {
  source?: string;
  retries?: number;
}

export interface EventBusRecord {
  topic: string;
  payload: any;
  source: string;
  meta: KernelEventMeta;
}

interface SubscriberEntry {
  pattern: string;
  handler: KernelEventHandler;
  once: boolean;
  source?: string;
  retries: number;
}

const TOPIC_PATTERN = /^[a-z0-9.:_*-]+$/i;
export const EVENTBUS_ERROR_TOPIC = "eventbus.handler.error";

/**
 * Casamento de padrões com wildcard: `*` corresponde a um ou mais segmentos
 * (segmento = fração separada por `.` ou `:`). Ex.: `task.*` casa com
 * `task.completed`, `task.failed`, `task.completed.details`; `*` casa com tudo.
 */
export function topicMatches(pattern: string, topic: string): boolean {
  if (pattern === "*") return true;
  const p = pattern.split(/[.:]/).filter(Boolean);
  const t = topic.split(/[.:]/).filter(Boolean);
  return matchSegments(p, t, 0, 0);
}

function matchSegments(p: string[], t: string[], pi: number, ti: number): boolean {
  if (pi === p.length) return ti === t.length;
  if (p[pi] === "*") {
    for (let k = ti; k <= t.length; k++) {
      if (matchSegments(p, t, pi + 1, k)) return true;
    }
    return false;
  }
  return ti < t.length && p[pi] === t[ti] && matchSegments(p, t, pi + 1, ti + 1);
}

/**
 * Event bus distribuído por tópicos: wildcards (`task.*`, `tool.*`), filtro por
 * fonte, retry por subscrição, isolamento de handlers (um handler que falha não
 * quebra os outros e o erro é publicado em `eventbus.handler.error`) e histórico
 * ring buffer para replay/reatividade entre módulos.
 */
export class EventBus {
  private entries: SubscriberEntry[] = [];
  private records: EventBusRecord[] = [];
  private emitted = 0;
  private totalErrors = 0;
  private readonly maxHistory: number;

  constructor(options?: { maxHistory?: number }) {
    this.maxHistory = options?.maxHistory ?? 500;
  }

  public subscribe<T = any>(topic: string, handler: KernelEventHandler<T>, options?: SubscribeOptions): () => void {
    return this.add({
      pattern: topic,
      handler: handler as KernelEventHandler,
      once: false,
      source: options?.source,
      retries: options?.retries ?? 0,
    });
  }

  public once<T = any>(topic: string, handler: KernelEventHandler<T>, options?: SubscribeOptions): () => void {
    return this.add({
      pattern: topic,
      handler: handler as KernelEventHandler,
      once: true,
      source: options?.source,
      retries: options?.retries ?? 0,
    });
  }

  public async publish<T = any>(topic: string, payload: T, source?: string): Promise<void> {
    this.assertTopic(topic);
    const meta: KernelEventMeta = {
      eventId: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      topic,
      source: source || "kernel",
      timestamp: Date.now(),
    };
    this.emitted++;
    this.record(meta, payload);
    const matching = this.entries.filter((e) => topicMatches(e.pattern, topic) && (!e.source || e.source === meta.source));
    for (const entry of matching) {
      if (entry.once) this.entries = this.entries.filter((e) => e !== entry);
      await this.runHandler(entry, payload, meta);
    }
  }

  public history(topic?: string): EventBusRecord[] {
    if (!topic) return [...this.records];
    return this.records.filter((r) => topicMatches(topic, r.topic));
  }

  public replay<T = any>(topic: string, handler: KernelEventHandler<T>): void {
    for (const record of this.history(topic)) {
      void Promise.resolve().then(() => handler(record.payload, record.meta)).catch(() => {});
    }
  }

  public on = this.subscribe.bind(this);
  public emit = this.publish.bind(this);

  public getStats(): EventBusStats {
    const topics = new Set(this.entries.map((e) => e.pattern));
    return {
      topics: topics.size,
      totalSubscribers: this.entries.length,
      totalEmitted: this.emitted,
      totalErrors: this.totalErrors,
      historySize: this.records.length,
      maxHistory: this.maxHistory,
    };
  }

  public clear(): void {
    this.entries = [];
    this.records = [];
  }

  private add(entry: SubscriberEntry): () => void {
    this.assertTopic(entry.pattern);
    this.entries.push(entry);
    return () => {
      this.entries = this.entries.filter((e) => e !== entry);
    };
  }

  private record(meta: KernelEventMeta, payload: any): void {
    this.records.push({ topic: meta.topic, payload, source: meta.source, meta });
    if (this.records.length > this.maxHistory) this.records.splice(0, this.records.length - this.maxHistory);
  }

  private async runHandler(entry: SubscriberEntry, payload: any, meta: KernelEventMeta): Promise<void> {
    let attempt = 0;
    for (;;) {
      attempt++;
      try {
        await entry.handler(payload, meta);
        return;
      } catch (err: any) {
        if (attempt <= entry.retries) continue;
        this.totalErrors++;
        this.notifyHandlerError(err, entry, payload, meta);
        return;
      }
    }
  }

  private notifyHandlerError(err: any, entry: SubscriberEntry, payload: any, meta: KernelEventMeta): void {
    const errMeta: KernelEventMeta = {
      eventId: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      topic: EVENTBUS_ERROR_TOPIC,
      source: "kernel",
      timestamp: Date.now(),
    };
    this.emitted++;
    this.record(errMeta, {
      error: err?.message || String(err),
      topic: meta.topic,
      source: meta.source,
      handlerSource: entry.source,
      payload,
    });
    for (const e of this.entries) {
      if (!topicMatches(e.pattern, EVENTBUS_ERROR_TOPIC)) continue;
      if (e.once) this.entries = this.entries.filter((x) => x !== e);
      void Promise.resolve()
        .then(() => e.handler({ error: err?.message || String(err), topic: meta.topic, source: meta.source, handlerSource: entry.source }, errMeta))
        .catch(() => {});
    }
  }

  private assertTopic(topic: string): void {
    if (!topic || !TOPIC_PATTERN.test(topic)) {
      throw new Error(`[EventBus] Invalid topic: "${topic}"`);
    }
  }
}
