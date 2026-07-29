import fs from "fs-extra";
import path from "path";
import { AIOX_MODULES, writeModuleFiles, getModuleFiles } from "../templates/modules";

const reset  = "\x1b[0m";
const cyan   = "\x1b[96m";
const green  = "\x1b[92m";
const yellow = "\x1b[93m";
const dim    = "\x1b[2m";
const bold   = "\x1b[1m";

const ALL_MODULE_KEYS = Object.keys(AIOX_MODULES);

/**
 * Genera la estructura completa de un proyecto AIOX nuevo.
 */
export async function runInit(projectName: string, options: Record<string, any>): Promise<void> {
  const targetDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(`\n${yellow}⚠ El directorio '${projectName}' ya existe.${reset}`);
    process.exit(1);
  }

  console.log(`\n${bold}${cyan}⟳ Inicializando nuevo proyecto AIOX: ${projectName}...${reset}\n`);

  // 1. Estructura de directorios
  const dirs = [
    "src/core/orchestrator", "src/core/model-router", "src/core/memory",
    "src/core/tools", "src/core/squads", "src/core/learning", "src/core/mcp",
    "src/core/providers", "src/core/types", "src/agents/ceo", "src/dashboard/public",
    "database/memory", "tests", "logs", "docs"
  ];

  for (const dir of dirs) {
    fs.ensureDirSync(path.join(targetDir, dir));
  }
  console.log(`  ${green}✓${reset} Estructura de directorios creada`);

  // 2. Generar todos los módulos del CORE Hyper-Brain
  const moduleFiles = getModuleFiles(ALL_MODULE_KEYS);
  writeModuleFiles(targetDir, moduleFiles);
  console.log(`  ${green}✓${reset} Módulos AIOX CORE escritos (${moduleFiles.length} archivos)`);

  // 3. ViseronCore.ts unificado
  const viseronCore = `import { TVSOrchestrator } from "./orchestrator/Orchestrator";
import { AgentManager } from "./AgentManager";
import { ModelRouter } from "./model-router/ModelRouter";
import { MemoryEngine } from "./memory/MemoryEngine";
import { ToolManager } from "./tools/ToolManager";
import { SquadManager } from "./squads/SquadManager";
import { AutoLearningEngine } from "./learning/AutoLearningEngine";

export class ViseronCore {
  public name = "AIOX Hyper-Brain v1.0 — ${projectName}";
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
    this.orchestrator = new TVSOrchestrator(this.agentManager, this.modelRouter, this.memoryEngine, this.toolManager);
    this.autoLearningEngine = new AutoLearningEngine(this.memoryEngine, this.squadManager);
  }

  start(): void {
    console.log("==========================================");
    console.log(this.name + " iniciado correctamente");
    console.log("Líderes: Pedro (CEO) & Trinnity (Architect) — Activos");
    console.log("==========================================");
    this.autoLearningEngine.startLearningCycle();
  }
}
`;
  fs.writeFileSync(path.join(targetDir, "src/core/ViseronCore.ts"), viseronCore);
  console.log(`  ${green}✓${reset} ViseronCore.ts generado`);

  // 4. index.ts de demostración
  const indexTs = `import { ViseronCore } from "./core/ViseronCore";
import { IAgent, AgentExecutionResult } from "./core/types";

const core = new ViseronCore();
core.start();

// Agentes de demostración — personaliza según tu proyecto
const dev: IAgent = {
  id: "dev_01", name: "Dev Master", role: "Developer", status: "ACTIVE",
  capabilities: ["typescript", "nodejs"],
  execute: async (task) => ({ agentId: "dev_01", agentName: "Dev Master", success: true, output: \`[Dev] Implementando: \${task}\`, executionTimeMs: 50 })
};
core.agentManager.register(dev);

(async () => {
  const report = await core.orchestrator.orchestrate(
    "Primera Orquestación AIOX",
    "Inicializar ecosistema multiagente con Pedro y Trinnity"
  );
  console.log("Estado:", report.status);
  console.log("Resultado:\\n" + report.overallOutput);
})();
`;
  fs.writeFileSync(path.join(targetDir, "src/index.ts"), indexTs);
  console.log(`  ${green}✓${reset} src/index.ts generado`);

  // 5. package.json
  const pkgJson = {
    name: projectName.toLowerCase().replace(/\s+/g, '-'),
    version: "1.0.0",
    description: `AIOX Hyper-Brain Platform — ${projectName}`,
    main: "dist/src/index.js",
    scripts: {
      start: "tsx src/index.ts",
      dev: "nodemon --exec tsx src/index.ts",
      build: "tsc",
      test: "tsx tests/aiox.test.ts"
    },
    type: "commonjs",
    dependencies: {
      axios: "^1.7.0",
      "fs-extra": "^11.2.0",
      "node-cron": "^3.0.3",
      dotenv: "^16.4.0",
      express: "^4.19.0",
      "socket.io": "^4.7.0",
      tsx: "^4.19.0",
      typescript: "^5.4.0"
    },
    devDependencies: {
      "@types/fs-extra": "^11.0.4",
      "@types/node": "^20.11.0",
      nodemon: "^3.1.0"
    }
  };
  fs.writeJsonSync(path.join(targetDir, "package.json"), pkgJson, { spaces: 2 });
  console.log(`  ${green}✓${reset} package.json generado`);

  // 6. tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: "ES2022", module: "commonjs", moduleResolution: "node",
      outDir: "dist", rootDir: "./", strict: true, esModuleInterop: true,
      skipLibCheck: true
    },
    include: ["src/**/*", "tests/**/*"]
  };
  fs.writeJsonSync(path.join(targetDir, "tsconfig.json"), tsConfig, { spaces: 2 });
  console.log(`  ${green}✓${reset} tsconfig.json generado`);

  // 7. .env.example
  const envExample = `# AIOX-Core — Variables de Entorno
# Modelos Cloud (opcional - usar modelos locales si no tienes keys)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
GROK_API_KEY=

# Modelos Locales
OLLAMA_HOST=http://localhost:11434

# Infraestructura
QDRANT_HOST=http://localhost:6333
N8N_HOST=http://localhost:5678

# Sistema
NODE_ENV=development
PORT=3000
`;
  fs.writeFileSync(path.join(targetDir, ".env.example"), envExample);
  console.log(`  ${green}✓${reset} .env.example generado`);

  // 8. .gitignore
  fs.writeFileSync(path.join(targetDir, ".gitignore"), "node_modules/\ndist/\n.env\ndatabase/memory/\nlogs/\n");
  console.log(`  ${green}✓${reset} .gitignore generado`);

  // 9. docker-compose.yml
  const dockerCompose = `version: '3.8'
services:
  aiox-core:
    build: .
    container_name: aiox-core-${projectName}
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
      - OLLAMA_HOST=http://ollama:11434
      - QDRANT_HOST=http://qdrant:6333
    volumes: ["./database:/app/database", "./logs:/app/logs"]
    depends_on: [ollama, qdrant, n8n]
    restart: always

  ollama:
    image: ollama/ollama:latest
    ports: ["11434:11434"]
    volumes: [ollama_data:/root/.ollama]
    restart: always

  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333", "6334:6334"]
    volumes: [qdrant_data:/qdrant/storage]
    restart: always

  n8n:
    image: n8nio/n8n:latest
    ports: ["5678:5678"]
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=aiox
    volumes: [n8n_data:/home/node/.n8n]
    restart: always

volumes: {ollama_data: {}, qdrant_data: {}, n8n_data: {}}
`;
  fs.writeFileSync(path.join(targetDir, "docker-compose.yml"), dockerCompose);
  console.log(`  ${green}✓${reset} docker-compose.yml generado (TVS Core + Ollama + Qdrant + n8n)`);

  if (options.docker !== false) {
    const dockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/src/index.js"]
`;
    fs.writeFileSync(path.join(targetDir, "Dockerfile"), dockerfile);
    console.log(`  ${green}✓${reset} Dockerfile multi-stage generado`);
  }

  // 10. README.md
  const readme = `# ${projectName} — AIOX Hyper-Brain Platform

**Construido con [aiox-core](https://github.com/aiox/aiox-core) v1.0**

## 🚀 Inicio Rápido

\`\`\`bash
npm install
cp .env.example .env   # Configura tus API Keys
npm start
\`\`\`

## 🐳 Producción con Docker

\`\`\`bash
docker compose up -d
\`\`\`

## 🧠 Arquitectura AIOX Core

| Módulo | Descripción |
|--------|-------------|
| TVS Orchestrator | Motor de coordinación multiagente |
| Agent Manager | Registro dinámico 200+ agentes |
| Model Router | Ollama, DeepSeek, Qwen, Mistral, OpenAI, Claude, Gemini, Grok |
| Memory Engine | STM + LTM + Knowledge Base + Qdrant Vector |
| Tool Manager | n8n, REST API, MCP, Webhooks, DB |
| Squad Manager | Pedro (CEO) & Trinnity (Architect) — Líderes |
| Auto-Learning | Ciclo de aprendizaje cada 15 minutos |

## 📋 Comandos

\`\`\`bash
npm start       # Iniciar el sistema
npm run dev     # Modo desarrollo con hot-reload
npm test        # Ejecutar pruebas
npm run build   # Compilar TypeScript
\`\`\`
`;
  fs.writeFileSync(path.join(targetDir, "README.md"), readme);
  console.log(`  ${green}✓${reset} README.md generado`);

  console.log(`\n${bold}${green}✅ Proyecto '${projectName}' inicializado con éxito.${reset}\n`);
  console.log(`${dim}Para comenzar:${reset}`);
  console.log(`  ${cyan}cd ${projectName}${reset}`);
  console.log(`  ${cyan}npm install${reset}`);
  console.log(`  ${cyan}cp .env.example .env${reset}`);
  console.log(`  ${cyan}npm start${reset}\n`);
}
