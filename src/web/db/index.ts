import fs from "fs";
import path from "path";
import { Pool } from "pg";

export interface TVSDatabase {
  enabled: boolean;
  pool: Pool | null;
  runMigrations(): Promise<number>;
  recordUsage(tenantId: string | null, event: string, meta?: Record<string, unknown>): Promise<void>;
}

class PostgresDatabase implements TVSDatabase {
  enabled: boolean;
  pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 10 });
    this.enabled = true;
  }

  async runMigrations(): Promise<number> {
    const dir = path.resolve(process.cwd(), "migrations");
    if (!fs.existsSync(dir)) return 0;
    const files = fs
      .readdirSync(dir)
      .filter((f) => /^\d+_.*\.sql$/.test(f))
      .sort();
    let applied = 0;
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      await this.pool.query(sql);
      applied++;
    }
    return applied;
  }

  async recordUsage(tenantId: string | null, event: string, meta?: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      "INSERT INTO usage_events (tenant_id, event, meta) VALUES ($1, $2, $3)",
      [tenantId, event, meta ? JSON.stringify(meta) : null]
    );
  }
}

class JsonFallbackDatabase implements TVSDatabase {
  enabled = false;
  pool: Pool | null = null;

  async runMigrations(): Promise<number> {
    return 0;
  }

  async recordUsage(tenantId: string | null, event: string, meta?: Record<string, unknown>): Promise<void> {
    const dir = path.resolve(process.cwd(), "data", "usage");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "usage.jsonl");
    fs.appendFileSync(file, JSON.stringify({ tenantId, event, meta, at: new Date().toISOString() }) + "\n", "utf8");
  }
}

let singleton: TVSDatabase | null = null;

export function getDatabase(): TVSDatabase {
  if (singleton) return singleton;
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    try {
      singleton = new PostgresDatabase(connectionString);
      return singleton;
    } catch (e) {
      console.error(`[DB] Falha ao ligar Postgres: ${(e as Error).message}. Usando fallback JSON.`);
    }
  }
  singleton = new JsonFallbackDatabase();
  return singleton;
}
