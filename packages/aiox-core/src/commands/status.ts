import fs from "fs-extra";
import path from "path";
import { AIOX_MODULES } from "../templates/modules";

const green  = "\x1b[92m";
const cyan   = "\x1b[96m";
const yellow = "\x1b[93m";
const reset  = "\x1b[0m";
const dim    = "\x1b[2m";
const bold   = "\x1b[1m";

export function runStatus(): void {
  const targetDir = process.cwd();

  console.log(`\n${bold}${cyan}🔍 AIOX-Core — Estado del Proyecto${reset}\n`);
  console.log(`  Directorio: ${dim}${targetDir}${reset}`);

  // Verificar package.json
  const pkgPath = path.join(targetDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = fs.readJsonSync(pkgPath);
    console.log(`  ${green}✓${reset} package.json — ${pkg.name} v${pkg.version}`);
  } else {
    console.log(`  ${yellow}⚠ package.json no encontrado${reset}`);
  }

  // Verificar módulos del CORE
  console.log(`\n${bold}Módulos AIOX:${reset}`);
  const moduleChecks: Record<string, string> = {
    types:         "src/core/types/index.ts",
    agentmanager:  "src/core/AgentManager.ts",
    orchestrator:  "src/core/orchestrator/Orchestrator.ts",
    modelrouter:   "src/core/model-router/ModelRouter.ts",
    memory:        "src/core/memory/MemoryEngine.ts",
    tools:         "src/core/tools/ToolManager.ts",
    squads:        "src/core/squads/SquadManager.ts",
    learning:      "src/core/learning/AutoLearningEngine.ts",
    mcp:           "src/core/mcp/MCPServer.ts",
    viseroncore:   "src/core/ViseronCore.ts"
  };

  let installedCount = 0;
  for (const [key, filePath] of Object.entries(moduleChecks)) {
    const exists = fs.existsSync(path.join(targetDir, filePath));
    const modName = AIOX_MODULES[key]?.name || key;
    if (exists) {
      console.log(`  ${green}✓${reset} ${modName} ${dim}(${filePath})${reset}`);
      installedCount++;
    } else {
      console.log(`  ${yellow}○${reset} ${modName} ${dim}— No instalado${reset}`);
    }
  }

  // Verificar infraestructura
  console.log(`\n${bold}Infraestructura:${reset}`);
  const infra: Record<string, string> = {
    "Docker Compose":  "docker-compose.yml",
    "Dockerfile":      "Dockerfile",
    ".env.example":    ".env.example",
    ".env (activo)":   ".env"
  };
  for (const [name, file] of Object.entries(infra)) {
    const exists = fs.existsSync(path.join(targetDir, file));
    console.log(`  ${exists ? green + '✓' : yellow + '○'}${reset} ${name}`);
  }

  console.log(`\n${bold}Resumen: ${installedCount}/${Object.keys(moduleChecks).length} módulos instalados.${reset}`);
  if (installedCount < Object.keys(moduleChecks).length) {
    console.log(`\n${dim}Ejecuta ${cyan}npx aiox-core install --all${reset}${dim} para instalar los módulos faltantes.${reset}`);
  }
  console.log("");
}
