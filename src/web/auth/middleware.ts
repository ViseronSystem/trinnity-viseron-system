import { NextFunction, Request, Response } from "express";
import { verifyToken } from "./jwt";
import { Role } from "./store";

export interface AuthedRequest extends Request {
  user?: { sub: string; tenantId: string; role: Role; email: string };
}

export function authSecret(): string {
  return process.env.TVS_JWT_SECRET || process.env.JWT_SECRET || "tvs-dev-secret-change-in-production";
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Token ausente" });
    return;
  }
  const payload = verifyToken(token, authSecret());
  if (!payload) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }
  req.user = { sub: payload.sub, tenantId: payload.tenantId, role: payload.role, email: payload.email };
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Permissão insuficiente" });
      return;
    }
    next();
  };
}
