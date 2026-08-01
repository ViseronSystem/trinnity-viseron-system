import { Request, Response, NextFunction } from "express";
import { ILogger } from "./logger";
import { IMetrics } from "./metrics";

export function requestLogger(logger: ILogger, metrics: IMetrics) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      metrics.inc("http_requests_total", { method: req.method, path: req.route?.path || req.path, status: String(res.statusCode) });
      metrics.timing("http_request_duration_ms", ms, { method: req.method });
      if (res.statusCode >= 500) {
        logger.error(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl} ${ms}ms`);
      } else if (res.statusCode >= 400) {
        logger.warn(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl} ${ms}ms`);
      } else {
        logger.info(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl} ${ms}ms`);
      }
    });
    next();
  };
}
