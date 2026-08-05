import fs from "fs";
import path from "path";

export interface AppMeta {
  slug: string;
  name: string;
  description: string;
  tagline: string;
  features: string[];
  accent: string;
  lang: "pt" | "en" | "es";
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedApp {
  meta: AppMeta;
  files: Record<string, string>;
}

export class AppScaffoldStore {
  private dir: string;
  private indexFile: string;

  constructor(dataDir: string) {
    this.dir = path.join(dataDir, "apps");
    if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
    this.indexFile = path.join(this.dir, "apps.json");
  }

  save(app: GeneratedApp): GeneratedApp {
    const all = this.list();
    const idx = all.findIndex((m) => m.slug === app.meta.slug);
    if (idx === -1) all.push(app.meta);
    else all[idx] = app.meta;
    fs.writeFileSync(this.indexFile, JSON.stringify(all, null, 2), "utf8");
    return app;
  }

  list(): AppMeta[] {
    try {
      if (!fs.existsSync(this.indexFile)) return [];
      return JSON.parse(fs.readFileSync(this.indexFile, "utf8")) as AppMeta[];
    } catch {
      return [];
    }
  }

  get(slug: string): AppMeta | null {
    return this.list().find((a) => a.slug === slug) || null;
  }

  appDir(slug: string): string {
    return path.join(this.dir, slug);
  }

  writeApp(slug: string, files: Record<string, string>): void {
    const base = path.join(this.dir, slug);
    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(base, rel);
      if (!abs.startsWith(path.join(this.dir, slug))) continue;
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }
  }

  listFiles(slug: string): string[] {
    const base = path.join(this.dir, slug);
    if (!fs.existsSync(base)) return [];
    const out: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else out.push(path.relative(base, p).replace(/\\/g, "/"));
      }
    };
    walk(base);
    return out.sort();
  }

  count(): number {
    return this.list().length;
  }
}

export function slugifyApp(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "app-" + Date.now().toString(36)).slice(0, 40);
}
