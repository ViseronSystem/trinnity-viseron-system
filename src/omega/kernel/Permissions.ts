export type PermissionRole = "root" | "commander" | "queen" | "admin" | "operator" | "agent" | "viewer";

export interface PermissionGrant {
  role: PermissionRole;
  permissions: string[];
}

export interface Actor {
  id: string;
  name: string;
  role: PermissionRole;
}

const DEFAULT_GRANTS: PermissionGrant[] = [
  { role: "root", permissions: ["*"] },
  {
    role: "commander",
    permissions: [
      "agents.*", "tasks.*", "events.*", "memory.*", "ai.*", "kernel.*",
      "enterprise.*", "gateway.*", "factory.*", "deploy.*",
    ],
  },
  {
    role: "queen",
    permissions: [
      "agents.*", "tasks.*", "events.*", "memory.*", "ai.*", "kernel.*",
      "architecture.*", "gateway.*", "research.*",
    ],
  },
  {
    role: "admin",
    permissions: ["agents.read", "agents.manage", "tasks.read", "tasks.manage", "events.read", "memory.read", "kernel.read", "gateway.read"],
  },
  {
    role: "operator",
    permissions: ["agents.read", "tasks.read", "tasks.create", "events.read", "memory.read", "kernel.read", "gateway.read"],
  },
  {
    role: "agent",
    permissions: ["agents.read", "tasks.read", "memory.read", "memory.write", "ai.use", "events.read"],
  },
  {
    role: "viewer",
    permissions: ["agents.read", "tasks.read", "events.read", "kernel.read"],
  },
];

export class Permissions {
  private grants = new Map<PermissionRole, string[]>();

  constructor(grants?: PermissionGrant[]) {
    for (const g of grants ?? DEFAULT_GRANTS) this.grants.set(g.role, g.permissions);
  }

  public defineRole(role: PermissionRole, permissions: string[]): void {
    this.grants.set(role, permissions);
  }

  public can(role: PermissionRole, permission: string): boolean {
    const perms = this.grants.get(role);
    if (!perms) return false;
    if (perms.includes("*")) return true;
    const permSegments = permission.split(".");
    for (const granted of perms) {
      if (granted === "*") return true;
      const grantedSegments = granted.split(".");
      if (this.segmentsMatch(grantedSegments, permSegments)) return true;
    }
    return false;
  }

  public assert(actor: Actor, permission: string): void {
    if (!this.can(actor.role, permission)) {
      throw new Error(`[Permissions] Actor "${actor.name}" (role=${actor.role}) lacks permission "${permission}"`);
    }
  }

  public listRoles(): string[] {
    return Array.from(this.grants.keys());
  }

  private segmentsMatch(granted: string[], required: string[]): boolean {
    if (granted.length > required.length) return false;
    for (let i = 0; i < granted.length; i++) {
      if (granted[i] === "*") return true;
      if (granted[i] !== required[i]) return false;
    }
    return true;
  }
}
