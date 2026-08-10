// TVS Agent Registry
// Registro central de agentes disponibles en el sistema
// REALITY HARDENING: o registry expõe apenas agentes de runtime reais.
// 5.014 mentes (data/minds/minds.json) e 10 specs OMEGA (src/omega/agent-runtime/specs/)
// são definições de conhecimento/arquitetura — não agentes em execução.
import * as fs from "fs";
import * as path from "path";

interface RegistryAgent {
  id: number;
  name: string;
  squad: string;
  runtimeId?: string;
}

interface AgentRegistry {
  total: number;
  mode: "REAL";
  agents: RegistryAgent[];
  mindsLoaded: number;
  omegaSpecs: number;
  squadManifests: number;
}

function resolveRegistryFile(): string | null {
  const candidates = [
    path.join(process.cwd(), "src", "agents", "registry", "agents.json"),
    path.join(__dirname, "agents.json"),
    path.join(__dirname, "..", "registry", "agents.json")
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function countJsonArray(relPath: string): number {
  const candidates = [
    path.join(process.cwd(), relPath),
    path.join(__dirname, "..", "..", "..", relPath)
  ];
  const p = candidates.find((x) => fs.existsSync(x));
  if (!p) return 0;
  if (fs.statSync(p).isDirectory()) {
    try {
      return fs.readdirSync(p).filter((f) => f.endsWith(".json")).length;
    } catch {
      return 0;
    }
  }
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf-8").replace(/^\uFEFF/, ""));
    return Array.isArray(data) ? data.length : (data.agents?.length ?? 0);
  } catch {
    return 0;
  }
}

export const registry: AgentRegistry = loadRegistry();

function loadRegistry(): AgentRegistry {
  const file = resolveRegistryFile();
  let agents: RegistryAgent[] = [];
  if (file) {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf-8").replace(/^\uFEFF/, ""));
      agents = data.agents ?? [];
    } catch {
      agents = [];
    }
  }
  return {
    total: agents.length,
    mode: "REAL",
    agents,
    mindsLoaded: countJsonArray("data/minds/minds.json"),
    omegaSpecs: countJsonArray("src/omega/agent-runtime/specs"),
    squadManifests: countJsonArray("src/omega/squads/manifests")
  };
}
