import { Request, Response, NextFunction } from "express";

interface Window {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private windows = new Map<string, Window>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip || "unknown"}:${req.path}`;
    const now = Date.now();
    let w = this.windows.get(key);
    if (!w || w.resetAt <= now) {
      w = { count: 0, resetAt: now + this.windowMs };
      this.windows.set(key, w);
    }
    w.count++;
    res.setHeader("X-RateLimit-Limit", String(this.limit));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, this.limit - w.count)));
    if (w.count > this.limit) {
      res.status(429).json({ error: "Demasiados pedidos. Aguarde um pouco." });
      return;
    }
    next();
  };

  // keep map bounded
  prune(): void {
    const now = Date.now();
    for (const [key, w] of this.windows) {
      if (w.resetAt <= now) this.windows.delete(key);
    }
  }
}
