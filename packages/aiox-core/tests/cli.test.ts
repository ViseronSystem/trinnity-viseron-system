import path from "path";
import fs from "fs-extra";
import { runInit } from "../src/commands/init";
import { runStatus } from "../src/commands/status";
import { runInstall } from "../src/commands/install";
import { AIOX_MODULES } from "../src/templates/modules";

async function runTests(): Promise<void> {
  console.log("==========================================");
  console.log("PRUEBAS DEL CLI AIOX-CORE v1.0");
  console.log("==========================================\n");

  let passed = 0, total = 0;

  function assert(cond: boolean, name: string) {
    total++;
    if (cond) { console.log(`✅ [PASS] ${name}`); passed++; }
    else console.error(`❌ [FAIL] ${name}`);
  }

  const tmpDir = path.join(process.cwd(), ".tmp_aiox_test");
  fs.removeSync(tmpDir);
  fs.ensureDirSync(tmpDir);

  // Test 1: Módulos disponibles en el catálogo
  assert(Object.keys(AIOX_MODULES).length >= 7, "Catálogo de módulos: 7+ módulos disponibles");

  // Test 2: aiox-core init (crear nuevo proyecto)
  const projectPath = path.join(tmpDir, "test-project");
  process.chdir(tmpDir);
  await runInit("test-project", { docker: true });

  assert(fs.existsSync(path.join(projectPath, "package.json")), "init: package.json generado");
  assert(fs.existsSync(path.join(projectPath, "src/core/ViseronCore.ts")), "init: ViseronCore.ts generado");
  assert(fs.existsSync(path.join(projectPath, "src/core/orchestrator/Orchestrator.ts")), "init: Orchestrator.ts generado");
  assert(fs.existsSync(path.join(projectPath, "src/core/squads/SquadManager.ts")), "init: SquadManager.ts (Pedro & Trinnity) generado");
  assert(fs.existsSync(path.join(projectPath, "src/core/learning/AutoLearningEngine.ts")), "init: AutoLearningEngine.ts (15 min) generado");
  assert(fs.existsSync(path.join(projectPath, "docker-compose.yml")), "init: docker-compose.yml generado");
  assert(fs.existsSync(path.join(projectPath, "Dockerfile")), "init: Dockerfile generado");
  assert(fs.existsSync(path.join(projectPath, ".env.example")), "init: .env.example generado");
  assert(fs.existsSync(path.join(projectPath, "README.md")), "init: README.md generado");

  // Test 3: aiox-core install en proyecto existente
  const existingDir = path.join(tmpDir, "existing-project");
  fs.ensureDirSync(existingDir);
  fs.writeJsonSync(path.join(existingDir, "package.json"), { name: "existing", version: "1.0.0" });
  process.chdir(existingDir);
  await runInstall({ all: true });

  assert(fs.existsSync(path.join(existingDir, "src/core/AgentManager.ts")), "install: AgentManager.ts instalado");
  assert(fs.existsSync(path.join(existingDir, "src/core/memory/MemoryEngine.ts")), "install: MemoryEngine.ts instalado");
  assert(fs.existsSync(path.join(existingDir, ".env.example")), "install: .env.example generado");

  // Test 4: Verificar contenido del ViseronCore generado
  const vcContent = fs.readFileSync(path.join(projectPath, "src/core/ViseronCore.ts"), "utf-8");
  assert(vcContent.includes("SquadManager"), "init: ViseronCore integra SquadManager (Pedro & Trinnity)");
  assert(vcContent.includes("AutoLearningEngine"), "init: ViseronCore integra AutoLearningEngine (15 min)");

  // Cleanup
  process.chdir(path.join(tmpDir, ".."));
  fs.removeSync(tmpDir);

  console.log(`\n==========================================`);
  console.log(`CLI TESTS: ${passed}/${total} PRUEBAS PASADAS.`);
  console.log("==========================================\n");
  if (passed !== total) process.exit(1);
}

runTests().catch(err => {
  console.error("Error en pruebas CLI:", err);
  process.exit(1);
});
