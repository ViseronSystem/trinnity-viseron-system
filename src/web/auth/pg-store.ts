import fs from "fs";
import os from "os";
import path from "path";
import { Pool } from "pg";
import { AccountStore, Role, Tenant, UserRecord } from "./store";

export class PostgresAccountStore extends AccountStore {
  private pool: Pool;

  constructor(pool: Pool) {
    super(pathForEmptyStore());
    this.pool = pool;
  }

  async listTenants(): Promise<Tenant[]> {
    const r = await this.pool.query(
      "SELECT id, slug, name, plan, created_at, trial_ends_at FROM tenants ORDER BY created_at ASC"
    );
    return r.rows.map(mapTenant);
  }

  async getTenantById(id: string): Promise<Tenant | undefined> {
    const r = await this.pool.query(
      "SELECT id, slug, name, plan, created_at, trial_ends_at FROM tenants WHERE id = $1",
      [id]
    );
    return r.rows[0] ? mapTenant(r.rows[0]) : undefined;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const r = await this.pool.query(
      "SELECT id, slug, name, plan, created_at, trial_ends_at FROM tenants WHERE slug = $1",
      [slug]
    );
    return r.rows[0] ? mapTenant(r.rows[0]) : undefined;
  }

  async createTenant(name: string, slug: string, plan: Tenant["plan"] = "free", trialDays = 14): Promise<Tenant> {
    const existing = await this.getTenantBySlug(slug);
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
    await this.pool.query(
      "INSERT INTO tenants (id, slug, name, plan, created_at, trial_ends_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [tenant.id, tenant.slug, tenant.name, tenant.plan, tenant.createdAt, tenant.trialEndsAt]
    );
    return tenant;
  }

  async updateTenantPlan(tenantId: string, plan: Tenant["plan"]): Promise<void> {
    const r = await this.pool.query("UPDATE tenants SET plan = $1 WHERE id = $2", [plan, tenantId]);
    if (r.rowCount === 0) throw new Error("Tenant não encontrado");
  }

  async listUsers(tenantId?: string): Promise<UserRecord[]> {
    const sql = tenantId
      ? "SELECT id, tenant_id, name, email, password_hash, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at ASC"
      : "SELECT id, tenant_id, name, email, password_hash, role, created_at FROM users ORDER BY created_at ASC";
    const params = tenantId ? [tenantId] : [];
    const r = await this.pool.query(sql, params);
    return r.rows.map(mapUser);
  }

  async getUserById(id: string): Promise<UserRecord | undefined> {
    const r = await this.pool.query(
      "SELECT id, tenant_id, name, email, password_hash, role, created_at FROM users WHERE id = $1",
      [id]
    );
    return r.rows[0] ? mapUser(r.rows[0]) : undefined;
  }

  async findUserByEmail(email: string): Promise<UserRecord | undefined> {
    const normalized = email.trim().toLowerCase();
    const r = await this.pool.query(
      "SELECT id, tenant_id, name, email, password_hash, role, created_at FROM users WHERE email = $1",
      [normalized]
    );
    return r.rows[0] ? mapUser(r.rows[0]) : undefined;
  }

  async createUser(input: { tenantId: string; name: string; email: string; passwordHash: string; role: Role }): Promise<UserRecord> {
    const normalized = input.email.trim().toLowerCase();
    if (await this.findUserByEmail(normalized)) throw new Error("Email já registado");
    const user: UserRecord = {
      id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      tenantId: input.tenantId,
      name: input.name.trim(),
      email: normalized,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: new Date().toISOString(),
    };
    await this.pool.query(
      "INSERT INTO users (id, tenant_id, name, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [user.id, user.tenantId, user.name, user.email, user.passwordHash, user.role, user.createdAt]
    );
    return user;
  }

  async updateUser(id: string, patch: Partial<Pick<UserRecord, "name" | "role" | "passwordHash">>): Promise<UserRecord | undefined> {
    const user = await this.getUserById(id);
    if (!user) return undefined;
    if (patch.name !== undefined) user.name = patch.name.trim();
    if (patch.role !== undefined) user.role = patch.role;
    if (patch.passwordHash !== undefined) user.passwordHash = patch.passwordHash;
    await this.pool.query(
      "UPDATE users SET name = $1, role = $2, password_hash = $3 WHERE id = $4",
      [user.name, user.role, user.passwordHash, id]
    );
    return user;
  }

  async count(): Promise<{ tenants: number; users: number }> {
    const t = await this.pool.query("SELECT count(*)::int AS n FROM tenants");
    const u = await this.pool.query("SELECT count(*)::int AS n FROM users");
    return { tenants: t.rows[0]?.n ?? 0, users: u.rows[0]?.n ?? 0 };
  }

  async seedFromJson(filePath: string): Promise<number> {
    const counts = await this.count();
    if (counts.tenants > 0) return 0;
    if (!fs.existsSync(filePath)) return 0;
    let n = 0;
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const tenants: any[] = Array.isArray(raw.tenants) ? raw.tenants : [];
      const users: any[] = Array.isArray(raw.users) ? raw.users : [];
      for (const t of tenants) {
        await this.pool.query(
          "INSERT INTO tenants (id, slug, name, plan, created_at, trial_ends_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING",
          [t.id, t.slug, t.name, t.plan || "free", t.createdAt || new Date().toISOString(), t.trialEndsAt || null]
        );
        n++;
      }
      for (const u of users) {
        await this.pool.query(
          "INSERT INTO users (id, tenant_id, name, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING",
          [u.id, u.tenantId, u.name, u.email, u.passwordHash, u.role || "member", u.createdAt || new Date().toISOString()]
        );
        n++;
      }
      if (n > 0) console.log(`[PostgresAccountStore] Seed: ${n} registos importados de accounts.json`);
      return n;
    } catch (e) {
      console.error(`[PostgresAccountStore] Seed JSON falhou: ${(e as Error).message}`);
      return 0;
    }
  }
}

function mapTenant(row: any): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    plan: row.plan,
    createdAt: new Date(row.created_at).toISOString(),
    trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at).toISOString() : null,
  };
}

function mapUser(row: any): UserRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function pathForEmptyStore(): string {
  return path.join(os.tmpdir(), "tvs-accounts-pg-empty.json");
}
