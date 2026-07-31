import { Command } from "commander";
import { execSync } from "child_process";
import * as fs from "fs-extra";
import * as path from "path";
import { skillsRegistry, SKILL_SOURCES, VENDOR_DIR } from "../src/core/skills";
import type { SkillSource } from "../src/core/skills";

/**
 * Viseron Skills CLI v1.0 (autoría Viseron)
 * Instalación autónoma, listado, búsqueda e inspección de las colecciones
 * de Agent Skills integradas en Trinnity Viseron System.
 */

const program = new Command();
program.name("skills").description("Gestión de las colecciones de skills de Viseron").version("1.0.0");

function cloneOrUpdate(source: SkillSource): void {
  const dest = path.join(VENDOR_DIR, source.name);
  if (!fs.existsSync(dest)) {
    console.log(`[skills] Instalando ${source.name} (${source.repoUrl}) ...`);
    execSync(`git clone --depth 1 ${source.repoUrl} "${dest}"`, { stdio: "inherit" });
  } else {
    console.log(`[skills] Actualizando ${source.name} ...`);
    execSync(`git -C "${dest}" pull --ff-only`, { stdio: "inherit" });
  }
  const licenses = fs.readdirSync(dest).filter((f) => /^licen[cs]e/i.test(f));
  if (licenses.length === 0) {
    console.warn(`[skills] ⚠ ${source.name}: no se encontró LICENSE en la raíz de la colección`);
  } else {
    console.log(`[skills] ${source.name}: licencia ${licenses[0]} preservada`);
  }
}

program
  .command("install")
  .description("Instala o actualiza las colecciones de skills de Viseron")
  .action(async () => {
    for (const src of SKILL_SOURCES) {
      cloneOrUpdate(src);
    }
    const total = await skillsRegistry.ensureLoaded();
    const stats = await skillsRegistry.stats();
    console.log(`\n[skills] Listo: ${total} skills indexadas de ${SKILL_SOURCES.length} colecciones.`);
    for (const s of stats.sources) {
      console.log(`  - ${s.name}: ${s.count} skills (${s.license})`);
    }
  });

program
  .command("list")
  .description("Lista las skills indexadas")
  .option("-s, --source <name>", "Filtrar por colección")
  .action(async (opts: { source?: string }) => {
    const skills = await skillsRegistry.listSkills();
    const filtered = opts.source ? skills.filter((s) => s.source === opts.source) : skills;
    console.log(`Total: ${filtered.length} skills`);
    for (const s of filtered) {
      console.log(`${s.id}\t${(s.description || "").slice(0, 90)}`);
    }
  });

program
  .command("search <query>")
  .description("Busca skills por texto en nombre y descripción")
  .option("-s, --source <name>", "Filtrar por colección")
  .action(async (query: string, opts: { source?: string }) => {
    const results = await skillsRegistry.searchSkills(query, opts.source);
    console.log(`Resultados para "${query}": ${results.length}`);
    for (const r of results.slice(0, 50)) {
      console.log(`${r.id}\t${(r.description || "").slice(0, 90)}`);
    }
  });

program
  .command("info <id>")
  .description("Muestra el contenido completo de una skill")
  .action(async (id: string) => {
    const detail = await skillsRegistry.getSkill(id);
    if (!detail) {
      console.error(`Skill '${id}' no encontrada.`);
      process.exit(1);
    }
    console.log(`=== ${detail.id} ===`);
    console.log(`Fuente: ${detail.source} | Licencia: ${detail.license}`);
    console.log(detail.body);
  });

program.parse(process.argv);
