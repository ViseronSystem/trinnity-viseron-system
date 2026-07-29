import fs from "fs-extra";
import path from "path";
import { AIOX_MODULES, writeModuleFiles, getModuleFiles } from "../templates/modules";

const reset  = "\x1b[0m";
const cyan   = "\x1b[96m";
const green  = "\x1b[92m";
const yellow = "\x1b[93m";
const bold   = "\x1b[1m";
const dim    = "\x1b[2m";

const ALL_KEYS = Object.keys(AIOX_MODULES);

/**
 * Instala o actualiza módulos AIOX en un proyecto existente.
 */
export async function runInstall(options: Record<string, any>): Promise<void> {
  const targetDir = process.cwd();
  const pkgPath = path.join(targetDir, "package.json");

  // Verificar que es un proyecto Node.js válido
  if (!fs.existsSync(pkgPath)) {
    console.error(`\n${yellow}⚠ No se encontró package.json en el directorio actual.${reset}`);
    console.error(`  Asegúrate de estar en la raíz de tu proyecto o usa ${cyan}aiox-core init <nombre>${reset} para crear uno nuevo.\n`);
    process.exit(1);
  }

  const pkg = fs.readJsonSync(pkgPath);
  console.log(`\n${bold}${cyan}⟳ Instalando AIOX-Core en: ${pkg.name || path.basename(targetDir)}${reset}\n`);

  // Determinar qué módulos instalar
  let selectedKeys: string[];

  if (options.all || !options.modules) {
    selectedKeys = ALL_KEYS;
    console.log(`  ${dim}Instalando todos los módulos: ${ALL_KEYS.join(", ")}${reset}`);
  } else {
    selectedKeys = options.modules as string[];
    console.log(`  ${dim}Módulos seleccionados: ${selectedKeys.join(", ")}${reset}`);
  }

  // Validar que los módulos existen
  const invalidModules = selectedKeys.filter(k => !AIOX_MODULES[k]);
  if (invalidModules.length > 0) {
    console.error(`\n${yellow}⚠ Módulos no reconocidos: ${invalidModules.join(", ")}${reset}`);
    console.error(`  Módulos disponibles: ${ALL_KEYS.join(", ")}\n`);
    process.exit(1);
  }

  // Escribir los archivos de módulos (preserva lo existente)
  const files = getModuleFiles(selectedKeys);
  let written = 0;
  let skipped = 0;

  for (const file of files) {
    const fullPath = path.join(targetDir, file.dest);
    if (fs.existsSync(fullPath)) {
      // No sobreescribir código existente (regla del sistema)
      console.log(`  ${dim}⊙ Preservado (ya existe): ${file.dest}${reset}`);
      skipped++;
    } else {
      fs.ensureDirSync(path.dirname(fullPath));
      fs.writeFileSync(fullPath, file.content, "utf-8");
      console.log(`  ${green}✓${reset} Creado: ${file.dest}`);
      written++;
    }
  }

  // Verificar si ViseronCore.ts existe
  const viseronPath = path.join(targetDir, "src/core/ViseronCore.ts");
  if (!fs.existsSync(viseronPath)) {
    const viseronCore = `import { TVSOrchestrator } from "./orchestrator/Orchestrator";
import { AgentManager } from "./AgentManager";
import { ModelRouter } from "./model-router/ModelRouter";
import { MemoryEngine } from "./memory/MemoryEngine";
import { ToolManager } from "./tools/ToolManager";
import { SquadManager } from "./squads/SquadManager";
import { AutoLearningEngine } from "./learning/AutoLearningEngine";

export class ViseronCore {
  public name = "AIOX Hyper-Brain v1.0";
  public agentManager: AgentManager;
  public modelRouter: ModelRouter;
  public memoryEngine: MemoryEngine;
  public toolManager: ToolManager;
  public squadManager: SquadManager;
  public orchestrator: TVSOrchestrator;
  public autoLearningEngine: AutoLearningEngine;

  constructor() {
    this.agentManager = new AgentManager();
    this.modelRouter = new ModelRouter();
    this.memoryEngine = new MemoryEngine();
    this.toolManager = new ToolManager();
    this.squadManager = new SquadManager();
    this.agentManager.register(this.squadManager.leaderPedro);
    this.agentManager.register(this.squadManager.leaderTrinnity);
    this.orchestrator = new TVSOrchestrator(
      this.agentManager, this.modelRouter, this.memoryEngine, this.toolManager
    );
    this.autoLearningEngine = new AutoLearningEngine(this.memoryEngine, this.squadManager);
  }

  start(): void {
    console.log("==========================================");
    console.log(\`\${this.name} iniciado\`);
    console.log("Líderes: Pedro & Trinnity — Activos");
    console.log("==========================================");
    this.autoLearningEngine.startLearningCycle();
  }
}
`;
    fs.ensureDirSync(path.join(targetDir, "src/core"));
    fs.writeFileSync(viseronPath, viseronCore, "utf-8");
    console.log(`  ${green}✓${reset} Creado: src/core/ViseronCore.ts`);
    written++;
  }

  // Generar .env.example si no existe
  const envPath = path.join(targetDir, ".env.example");
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `# AIOX-Core Variables de Entorno
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
GROK_API_KEY=
OLLAMA_HOST=http://localhost:11434
QDRANT_HOST=http://localhost:6333
N8N_HOST=http://localhost:5678
NODE_ENV=development
PORT=3000
`);
    console.log(`  ${green}✓${reset} .env.example generado`);
  }

  // Generar docker-compose.yml si no existe
  const dockerPath = path.join(targetDir, "docker-compose.yml");
  if (!fs.existsSync(dockerPath)) {
    fs.writeFileSync(dockerPath, `version: '3.8'
services:
  aiox-core:
    build: .
    ports: ["3000:3000"]
    environment:
      - OLLAMA_HOST=http://ollama:11434
      - QDRANT_HOST=http://qdrant:6333
    depends_on: [ollama, qdrant, n8n]
    restart: always
  ollama:
    image: ollama/ollama:latest
    ports: ["11434:11434"]
    volumes: [ollama_data:/root/.ollama]
  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333"]
    volumes: [qdrant_data:/qdrant/storage]
  n8n:
    image: n8nio/n8n:latest
    ports: ["5678:5678"]
    volumes: [n8n_data:/home/node/.n8n]
volumes: {ollama_data: {}, qdrant_data: {}, n8n_data: {}}
`);
    console.log(`  ${green}✓${reset} docker-compose.yml generado`);
  }

  console.log(`\n${bold}${green}✅ AIOX-Core instalado con éxito.${reset}`);
  console.log(`  ${green}✓${reset} Archivos creados: ${written}`);
  console.log(`  ${dim}⊙ Preservados (sin tocar): ${skipped}${reset}`);
  console.log(`\n${dim}Siguiente paso — Instalar dependencias npm:${reset}`);
  console.log(`  ${cyan}npm install axios fs-extra node-cron tsx typescript${reset}`);
  console.log(`  ${cyan}npm start${reset}\n`);

  // Mostrar resumen de módulos instalados
  console.log(`${bold}Módulos AIOX instalados:${reset}`);
  for (const key of selectedKeys) {
    const mod = AIOX_MODULES[key];
    if (mod) console.log(`  ${green}●${reset} ${mod.name} — ${dim}${mod.description}${reset}`);
  }
  console.log("");
}
