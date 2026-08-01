import fs from "fs";
import path from "path";

export type Role = "owner" | "admin" | "member";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: "free" | "core" | "pro" | "enterprise";
  createdAt: string;
  trialEndsAt: string | null;
}

export interface UserRecord {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

interface AccountFile {
  tenants: Tenant[];
  users: UserRecord[];
}

const DEFAULT_FILE: AccountFile = { tenants: [], users: [] };

export class AccountStore {
  private file: string;
  private data: AccountFile;

  constructor(filePath: string) {
    this.file = filePath;
    this.data = DEFAULT_FILE;
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.file)) {
        const raw = fs.readFileSync(this.file, "utf8");
        const parsed = JSON.parse(raw);
        this.data = {
          tenants: Array.isArray(parsed.tenants) ? parsed.tenants : [],
          users: Array.isArray(parsed.users) ? parsed.users : [],
        };
      } else {
        this.data = { tenants: [], users: [] };
        this.persist();
      }
    } catch (e) {
      console.error(`[AccountStore] Falha ao ler ${this.file}: ${(e as Error).message}`);
      this.data = { tenants: [], users: [] };
    }
  }

  private persist(): void {
    try {
      const dir = path.dirname(this.file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), "utf8");
      fs.renameSync(tmp, this.file);
    } catch (e) {
      console.error(`[AccountStore] Falha ao gravar ${this.file}: ${(e as Error).message}`);
    }
  }

  // ── Tenants ────────────────────────────────────────────────
  listTenants(): Tenant[] {
    return [...this.data.tenants];
  }

  getTenantById(id: string): Tenant | undefined {
    return this.data.tenants.find((t) => t.id === id);
  }

  getTenantBySlug(slug: string): Tenant | undefined {
    return this.data.tenants.find((t) => t.slug === slug);
  }

  createTenant(name: string, slug: string, plan: Tenant["plan"] = "free", trialDays = 14): Tenant {
    const existing = this.getTenantBySlug(slug);
    if (existing) throw new Error("Organização já existe");
    const now = new Date();
    const tenant: Tenant = {
      id: `ten_${Date.now().toString(36)}`,
      slug,
      name,
      plan,
      createdAt: now.toISOString(),
      trialEndsAt: new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
    };
    this.data.tenants.push(tenant);
    this.persist();
    return tenant;
  }

  updateTenantPlan(tenantId: string, plan: Tenant["plan"]): void {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) throw new Error("Tenant não encontrado");
    tenant.plan = plan;
    this.persist();
  }

  // ── Users ──────────────────────────────────────────────────
  listUsers(tenantId?: string): UserRecord[] {
    return tenantId ? this.data.users.filter((u) => u.tenantId === tenantId) : [...this.data.users];
  }

  getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  findUserByEmail(email: string): UserRecord | undefined {
    const normalized = email.trim().toLowerCase();
    return this.data.users.find((u) => u.email === normalized);
  }

  createUser(input: { tenantId: string; name: string; email: string; passwordHash: string; role: Role }): UserRecord {
    const normalized = input.email.trim().toLowerCase();
    if (this.findUserByEmail(normalized)) throw new Error("Email já registado");
    const user: UserRecord = {
      id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      tenantId: input.tenantId,
      name: input.name.trim(),
      email: normalized,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(user);
    this.persist();
    return user;
  }

  updateUser(id: string, patch: Partial<Pick<UserRecord, "name" | "role" | "passwordHash">>): UserRecord | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    if (patch.name !== undefined) user.name = patch.name.trim();
    if (patch.role !== undefined) user.role = patch.role;
    if (patch.passwordHash !== undefined) user.passwordHash = patch.passwordHash;
    this.persist();
    return user;
  }

  count(): { tenants: number; users: number } {
    return { tenants: this.data.tenants.length, users: this.data.users.length };
  }
}
