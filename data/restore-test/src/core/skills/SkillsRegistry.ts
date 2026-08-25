import * as fs from "fs";
import * as path from "path";

/**
 * Viseron Skills Module v1.0
 * Capa de integración de autoría Viseron sobre colecciones externas de Agent Skills
 * (formato estándar SKILL.md). El contenido original de cada colección se preserva
 * íntegro bajo `skills/vendor/` con su licencia, y este registro unificado permite
 * a los agentes de TVS indexar, buscar y cargar skills bajo demanda.
 */

export interface SkillSource {
  name: string;
  repoUrl: string;
  license: string;
}

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  source: string;
  license: string;
  skillDir: string;
}

export interface SkillDetail extends SkillInfo {
  body: string;
  frontmatter: Record<string, string>;
}

export const VENDOR_DIR = path.resolve(process.cwd(), "skills", "vendor");

export const SKILL_SOURCES: SkillSource[] = [
  {
    name: "awesome-claude-skills",
    repoUrl: "https://github.com/ComposioHQ/awesome-claude-skills.git",
    license: "Apache-2.0",
  },
  {
    name: "superpowers",
    repoUrl: "https://github.com/obra/superpowers.git",
    license: "MIT",
  },
  {
    name: "claude-plugins-official",
    repoUrl: "https://github.com/anthropics/claude-plugins-official.git",
    license: "Apache-2.0",
  },
  {
    name: "marketingskills",
    repoUrl: "https://github.com/coreyhaines31/marketingskills.git",
    license: "MIT",
  },
  {
    name: "awesome-llm-apps",
    repoUrl: "https://github.com/Shubhamsaboo/awesome-llm-apps.git",
    license: "Apache-2.0",
  },
  {
    name: "ecc",
    repoUrl: "https://github.com/affaan-m/ECC.git",
    license: "MIT",
  },
  {
    name: "loop-engineering",
    repoUrl: "https://github.com/cobusgreyling/loop-engineering.git",
    license: "MIT",
  },
  {
    name: "deeptutor",
    repoUrl: "https://github.com/HKUDS/DeepTutor.git",
    license: "Apache-2.0",
  },
  {
    name: "comp-crm",
    repoUrl: "https://github.com/trycompai/crm.git",
    license: "MIT",
  },
  {
    name: "comp-ai",
    repoUrl: "https://github.com/trycompai/comp.git",
    license: "AGPL-3.0",
  },
];

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  const keyRe = /^([A-Za-z][\w-]*):\s*(.*)$/;
  const lines = match[1].split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const km = lines[i].match(keyRe);
    if (km) {
      const key = km[1];
      let value = km[2].trim();
      if (value.startsWith('"')) {
        let full = value.slice(1);
        while (!full.includes('"') && i < lines.length - 1) {
          i++;
          full += "\n" + lines[i];
        }
        const closeIdx = full.indexOf('"');
        value = closeIdx >= 0 ? full.slice(0, closeIdx) : full;
      }
      result[key] = value.trim();
      i++;
    } else {
      i++;
    }
  }
  return result;
}

function walkSkills(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSkills(p));
    } else if (entry.isFile() && entry.name.toLowerCase() === "skill.md") {
      out.push(p);
    }
  }
  return out;
}

export class SkillsRegistry {
  private skills: SkillInfo[] = [];
  private loaded = false;
  private loading: Promise<number> | null = null;

  public async ensureLoaded(): Promise<number> {
    if (this.loaded) return this.skills.length;
    if (this.loading) return this.loading;
    this.loading = this.scan();
    return this.loading;
  }

  private async scan(): Promise<number> {
    this.skills = [];
    if (!fs.existsSync(VENDOR_DIR)) {
      console.warn("[SkillsRegistry] skills/vendor no existe. Ejecuta: npm run skills:install");
      this.loaded = true;
      return 0;
    }
    const sourceDirs = fs
      .readdirSync(VENDOR_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const src of sourceDirs) {
      const srcInfo =
        SKILL_SOURCES.find((s) => s.name === src) || {
          name: src,
          repoUrl: "",
          license: "Ver LICENSE de la colección",
        };
      const srcRoot = path.join(VENDOR_DIR, src);
      for (const file of walkSkills(srcRoot)) {
        try {
          const content = fs.readFileSync(file, "utf8");
          const fm = parseFrontmatter(content);
          const name = (fm.name || path.basename(path.dirname(file))).trim();
          if (!name) continue;
          this.skills.push({
            id: `${src}:${name}`,
            name,
            description: fm.description || "",
            source: src,
            license: srcInfo.license,
            skillDir: path.dirname(file),
          });
        } catch (err: any) {
          console.warn(`[SkillsRegistry] Error leyendo skill ${file}: ${err.message}`);
        }
      }
    }
    this.loaded = true;
    console.log(`[SkillsRegistry] ${this.skills.length} skills indexadas desde ${sourceDirs.length} colecciones.`);
    return this.skills.length;
  }

  public async listSkills(): Promise<SkillInfo[]> {
    await this.ensureLoaded();
    return this.skills;
  }

  public async getSkill(id: string): Promise<SkillDetail | undefined> {
    await this.ensureLoaded();
    const skill = this.skills.find((s) => s.id === id);
    if (!skill) return undefined;
    const file = path.join(skill.skillDir, "SKILL.md");
    const body = fs.readFileSync(file, "utf8");
    return { ...skill, body, frontmatter: parseFrontmatter(body) };
  }

  public async searchSkills(query: string, source?: string): Promise<SkillInfo[]> {
    await this.ensureLoaded();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = this.skills
      .filter((s) => !source || s.source === source)
      .map((skill) => {
        const nameLow = skill.name.toLowerCase();
        const descLow = skill.description.toLowerCase();
        let score = 0;
        for (const t of terms) {
          if (nameLow.includes(t)) score += 3;
          if (nameLow.startsWith(t)) score += 2;
          if (descLow.includes(t)) score += 1;
        }
        return { skill, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map((r) => r.skill);
  }

  public async stats(): Promise<{ total: number; sources: { name: string; count: number; license: string }[] }> {
    await this.ensureLoaded();
    const bySource = new Map<string, { count: number; license: string }>();
    for (const s of this.skills) {
      const cur = bySource.get(s.source) || { count: 0, license: s.license };
      cur.count++;
      bySource.set(s.source, cur);
    }
    return {
      total: this.skills.length,
      sources: Array.from(bySource.entries()).map(([name, info]) => ({ name, ...info })),
    };
  }
}

export const skillsRegistry = new SkillsRegistry();
