import winston from "winston";
import path from "path";
import fs from "fs";

export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

function ensureLogDir(dir: string): string {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function createLogger(logDir = path.resolve(process.cwd(), "data", "logs")): ILogger {
  ensureLogDir(logDir);
  const format = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
      return `[${timestamp}] ${level.toUpperCase()} ${message}${metaStr}`;
    })
  );
  return winston.createLogger({
    level: process.env.TVS_LOG_LEVEL || "info",
    format,
    transports: [
      new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), format) }),
      new winston.transports.File({ filename: path.join(logDir, "web.log"), maxsize: 5 * 1024 * 1024, maxFiles: 3 }),
    ],
  });
}

export const nullLogger: ILogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};
