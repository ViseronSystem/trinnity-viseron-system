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
}

const TOPIC_PATTERN = /^[a-z0-9.:_-]+$/i;

export class EventBus {
  private subscribers = new Map<string, Set<{ handler: KernelEventHandler; once: boolean }>>();
  private emitted = 0;

  public subscribe<T = any>(topic: string, handler: KernelEventHandler<T>): () => void {
    this.assertTopic(topic);
    if (!this.subscribers.has(topic)) this.subscribers.set(topic, new Set());
    const set = this.subscribers.get(topic)!;
    const entry = { handler: handler as KernelEventHandler, once: false };
    set.add(entry);
    return () => set.delete(entry);
  }

  public once<T = any>(topic: string, handler: KernelEventHandler<T>): () => void {
    this.assertTopic(topic);
    if (!this.subscribers.has(topic)) this.subscribers.set(topic, new Set());
    const set = this.subscribers.get(topic)!;
    const entry = { handler: handler as KernelEventHandler, once: true };
    set.add(entry);
    return () => set.delete(entry);
  }

  public async publish<T = any>(topic: string, payload: T, source?: string): Promise<void> {
    this.assertTopic(topic);
    const set = this.subscribers.get(topic);
    if (!set || set.size === 0) return;
    this.emitted++;
    const meta: KernelEventMeta = {
      eventId: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      topic,
      source: source || "kernel",
      timestamp: Date.now(),
    };
    const handlers = Array.from(set);
    for (const entry of handlers) {
      if (entry.once) set.delete(entry);
      await entry.handler(payload, meta);
    }
  }

  public on = this.subscribe.bind(this);
  public emit = this.publish.bind(this);

  public getStats(): EventBusStats {
    let total = 0;
    for (const set of this.subscribers.values()) total += set.size;
    return { topics: this.subscribers.size, totalSubscribers: total, totalEmitted: this.emitted };
  }

  public clear(): void {
    this.subscribers.clear();
  }

  private assertTopic(topic: string): void {
    if (!topic || !TOPIC_PATTERN.test(topic)) {
      throw new Error(`[EventBus] Invalid topic: "${topic}"`);
    }
  }
}
