import * as fs from "fs";
import * as path from "path";

async function runRestartTests() {
  console.log("\n==========================================");
  console.log("RESTART LIFECYCLE — determinismo Windows (v4)");
  console.log("==========================================\n");

  let passed = 0;
  let total = 0;
  const assert = (cond: boolean, name: string) => {
    total++;
    if (cond) { console.log(`✅ [PASS] ${name}`); passed++; }
    else console.error(`❌ [FAIL] ${name}`);
  };

  const root = path.resolve(__dirname, "..");
  const restartPs1 = fs.readFileSync(path.join(root, "scripts", "restart.ps1"), "utf-8");
  const standalone = fs.readFileSync(path.join(root, "scripts", "omniroute-standalone.cjs"), "utf-8");

  // ── 1. Exit codes explícitos (SUCCESS=0 / FAILURE=1 / TIMEOUT=2) ──
  assert(restartPs1.includes("exit 0"), "restart.ps1: SUCCESS -> exit 0");
  assert(restartPs1.includes("exit 1"), "restart.ps1: FAILURE -> exit 1");
  assert(restartPs1.includes("exit 2"), "restart.ps1: TIMEOUT -> exit 2");

  // ── 2. Identificação por comando, não por porta ──
  assert(restartPs1.includes("dist[\\\\/]src[\\\\/]index\\.js"), "restart.ps1: identifica TVS pelo comando (não por porta)");
  assert(!restartPs1.includes("foreach ($port in 3000, 3001, 32123, 5678)"), "restart.ps1: já não mata por lista de portas");

  // ── 3. Verificação de processo vivo após health check ──
  assert(restartPs1.includes("Test-ProcessAlive"), "restart.ps1: verifica processo vivo (Test-ProcessAlive)");
  assert(restartPs1.includes("MORREU apos responder ao health check"), "restart.ps1: HTTP 200 ≠ processo saudável");

  // ── 4. Registo service-aware ──
  assert(restartPs1.includes("tvs-service.json"), "restart.ps1: regista service record (tvs-service.json)");
  assert(restartPs1.includes("pid"), "restart.ps1: captura PID no service record");

  // ── 5. OmniRoute launcher: sem shell:true, spawn com array ──
  assert(!standalone.includes("shell: true"), "omniroute-standalone.cjs: sem shell:true");
  assert(standalone.includes('spawn(npxBin, args'), "omniroute-standalone.cjs: spawn com array de args");
  assert(!standalone.includes('${npxBin} omniroute --port'), "omniroute-standalone.cjs: sem string de comando concatenada");
  assert(standalone.includes("detached: true"), "omniroute-standalone.cjs: mantém detached (persistente)");
  assert(standalone.includes("child.unref()"), "omniroute-standalone.cjs: mantém unref");

  console.log(`\n${passed}/${total} restart lifecycle checks passed`);
  return passed === total;
}

runRestartTests().then((ok) => {
  if (!ok) process.exit(1);
});
