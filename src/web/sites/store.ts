import fs from "fs";
import path from "path";

export interface SiteMeta {
  slug: string;
  name: string;
  description: string;
  tagline: string;
  features: string[];
  cta: string;
  accent: string;
  lang: "pt" | "en" | "es";
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedSite {
  meta: SiteMeta;
  htmlPath: string;
}

export class SiteStore {
  private dir: string;
  private indexFile: string;

  constructor(dataDir: string) {
    this.dir = path.join(dataDir, "sites");
    if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
    this.indexFile = path.join(this.dir, "sites.json");
  }

  save(site: GeneratedSite): GeneratedSite {
    const all = this.list();
    const idx = all.findIndex((m) => m.slug === site.meta.slug);
    if (idx === -1) all.push(site.meta);
    else all[idx] = site.meta;
    fs.writeFileSync(this.indexFile, JSON.stringify(all, null, 2), "utf8");
    return site;
  }

  list(): SiteMeta[] {
    try {
      if (!fs.existsSync(this.indexFile)) return [];
      return JSON.parse(fs.readFileSync(this.indexFile, "utf8")) as SiteMeta[];
    } catch {
      return [];
    }
  }

  get(slug: string): GeneratedSite | null {
    const meta = this.list().find((s) => s.slug === slug);
    if (!meta) return null;
    const htmlPath = path.join(this.dir, slug, "index.html");
    return { meta, htmlPath };
  }

  htmlDir(slug: string): string {
    return path.join(this.dir, slug);
  }

  count(): number {
    return this.list().length;
  }

  writeHtml(slug: string, html: string): void {
    const dir = path.join(this.dir, slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  }
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "site-" + Date.now().toString(36)).slice(0, 40);
}
