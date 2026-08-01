export interface IMetrics {
  inc(name: string, tags?: Record<string, string>, value?: number): void;
  timing(name: string, ms: number, tags?: Record<string, string>): void;
  snapshot(): Record<string, unknown>;
}

interface Counter {
  name: string;
  tags: Record<string, string>;
  value: number;
}

export class MetricsCollector implements IMetrics {
  private counters = new Map<string, Counter>();
  private times = new Map<string, { count: number; totalMs: number; maxMs: number }>();
  private startedAt = Date.now();

  private key(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) return name;
    const tagStr = Object.keys(tags)
      .sort()
      .map((k) => `${k}=${tags[k]}`)
      .join(",");
    return `${name}{${tagStr}}`;
  }

  inc(name: string, tags?: Record<string, string>, value = 1): void {
    const k = this.key(name, tags);
    const existing = this.counters.get(k);
    if (existing) existing.value += value;
    else this.counters.set(k, { name, tags: tags || {}, value });
  }

  timing(name: string, ms: number, tags?: Record<string, string>): void {
    const k = this.key(name, tags);
    const existing = this.times.get(k);
    if (existing) {
      existing.count++;
      existing.totalMs += ms;
      existing.maxMs = Math.max(existing.maxMs, ms);
    } else {
      this.times.set(k, { count: 1, totalMs: ms, maxMs: ms });
    }
  }

  snapshot(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, c] of this.counters) out[k] = c.value;
    for (const [k, t] of this.times) {
      out[k] = {
        count: t.count,
        avgMs: t.count ? Math.round((t.totalMs / t.count) * 100) / 100 : 0,
        maxMs: Math.round(t.maxMs * 100) / 100,
      };
    }
    out.uptime_seconds = Math.round((Date.now() - this.startedAt) / 1000);
    return out;
  }
}
