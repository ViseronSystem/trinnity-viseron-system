import * as fs from "fs";
import * as path from "path";
import { Permissions, PermissionRole } from "../omega/kernel/Permissions";

export interface AuditEntry {
  id: number;
  ts: number;
  actor: string;
  action: string;
  result: "granted" | "denied";
  detail?: string;
}

export interface SecurityCenterOptions {
  permissions?: Permissions;
  auditFile?: string;
  maxAudit?: number;
}

export class SecurityCenter {
  private readonly permissions?: Permissions;
  private readonly auditFile: string;
  private readonly maxAudit: number;
  private audit: AuditEntry[] = [];
  private nextAuditId = 1;

  constructor(options: SecurityCenterOptions = {}) {
    this.permissions = options.permissions;
    this.auditFile = options.auditFile ?? path.join(process.cwd(), "data", "tvs-os", "audit.json");
    this.maxAudit = options.maxAudit ?? 500;
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.auditFile)) {
        const raw = JSON.parse(fs.readFileSync(this.auditFile, "utf-8"));
        if (Array.isArray(raw)) {
          this.audit = raw;
          this.nextAuditId = raw.reduce((m, e) => Math.max(m, (e.id ?? 0) + 1), 1);
        }
      }
    } catch { /* audit corrompido — começa vazio */ }
  }

  private persist(): void {
    fs.mkdirSync(path.dirname(this.auditFile), { recursive: true });
    fs.writeFileSync(this.auditFile, JSON.stringify(this.audit, null, 2), "utf-8");
  }

  public logAudit(actor: string, action: string, result: "granted" | "denied" = "granted", detail?: string): AuditEntry {
    const entry: AuditEntry = { id: this.nextAuditId++, ts: Date.now(), actor, action, result, detail };
    this.audit.push(entry);
    if (this.audit.length > this.maxAudit) this.audit = this.audit.slice(-this.maxAudit);
    this.persist();
    return entry;
  }

  public authorize(actor: { id: string; name: string; role: PermissionRole }, permission: string): boolean {
    if (!this.permissions) {
      this.logAudit(actor.id, permission, "granted", "sem Permissions — acesso permitido por omissão");
      return true;
    }
    const allowed = this.permissions.can(actor.role, permission);
    this.logAudit(actor.id, permission, allowed ? "granted" : "denied", `role=${actor.role}`);
    return allowed;
  }

  public roles(): string[] {
    return this.permissions?.listRoles() ?? [];
  }

  public can(role: PermissionRole, permission: string): boolean {
    return this.permissions?.can(role, permission) ?? true;
  }

  public auditLog(limit = 100): AuditEntry[] {
    return this.audit.slice(-limit).reverse();
  }

  public status(): {
    roles: string[];
    auditCount: number;
    recent: AuditEntry[];
    lastEvent: number;
  } {
    return {
      roles: this.roles(),
      auditCount: this.audit.length,
      recent: this.auditLog(25),
      lastEvent: this.audit.length ? this.audit[this.audit.length - 1].ts : 0,
    };
  }
}
