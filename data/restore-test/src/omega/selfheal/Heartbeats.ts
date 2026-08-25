export interface HeartbeatState {
  lastPulse: number;
  activeOps: number;
  healthy: boolean;
}

const TTL_MS = 30 * 60 * 1000;

export class Heartbeats {
  private states = new Map<string, HeartbeatState>();

  private ensure(id: string): HeartbeatState {
    let s = this.states.get(id);
    if (!s) {
      s = { lastPulse: 0, activeOps: 0, healthy: true };
      this.states.set(id, s);
    }
    return s;
  }

  public begin(id: string): void {
    const s = this.ensure(id);
    s.activeOps++;
    s.lastPulse = Date.now();
    s.healthy = true;
  }

  public end(id: string): void {
    const s = this.ensure(id);
    if (s.activeOps > 0) s.activeOps--;
    s.lastPulse = Date.now();
  }

  public pulse(id: string): void {
    const s = this.ensure(id);
    s.lastPulse = Date.now();
    s.healthy = true;
  }

  public reset(id: string): void {
    const s = this.ensure(id);
    s.activeOps = 0;
    s.lastPulse = Date.now();
    s.healthy = true;
  }

  public isStale(id: string, staleMs: number): boolean {
    const s = this.states.get(id);
    if (!s) return false;
    if (s.activeOps <= 0) return false;
    return Date.now() - s.lastPulse > staleMs;
  }

  public markUnhealthy(id: string): void {
    const s = this.ensure(id);
    s.healthy = false;
  }

  public snapshot(): Record<string, HeartbeatState> {
    const out: Record<string, HeartbeatState> = {};
    const now = Date.now();
    for (const [id, s] of this.states.entries()) {
      out[id] = {
        lastPulse: s.lastPulse,
        activeOps: s.activeOps,
        healthy: s.healthy,
      };
      if (s.lastPulse && now - s.lastPulse > TTL_MS) out[id].healthy = false;
    }
    return out;
  }
}

export const heartbeats = new Heartbeats();
