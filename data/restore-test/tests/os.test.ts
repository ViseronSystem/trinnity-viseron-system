import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { TVSOs } from "../src/os";
import { Kernel } from "../src/omega/kernel/Kernel";
import { AgentRuntime } from "../src/omega/agent-runtime/AgentRuntime";
import { ProcessManager } from "../src/os/ProcessManager";
import { VirtualFileSystem } from "../src/os/VirtualFileSystem";
import { AppStore } from "../src/os/AppStore";
import { PackageManager } from "../src/os/PackageManager";
import { SecurityCenter } from "../src/os/SecurityCenter";

async function runOsTests() {
  console.log("\n==========================================");
  console.log("TVS OS — PROCESS MANAGER · VFS · APP STORE · PKG · SECURITY");
  console.log("==========================================\n");

  let passed = 0;
  let total = 0;
  const assert = (cond: boolean, name: string) => {
    total++;
    if (cond) { console.log(`✅ [PASS] ${name}`); passed++; }
    else console.error(`❌ [FAIL] ${name}`);
  };

  // ── 1. Process Manager ──
  {
    const pm = new ProcessManager(undefined, { timeoutMs: 100 });
    assert(pm.stats().total === 0, "PM: começa sem processos");

    const fast = new Promise<any>((resolve) => setTimeout(() => resolve({ success: true, output: "ok" }), 20));
    const fakeRuntime: any = { getAgent: () => ({ id: "a", name: "A", role: "r" }), execute: () => fast };
    const pm2 = new ProcessManager(fakeRuntime, { timeoutMs: 500 });
    const p = pm2.spawn("a", "tarefa");
    assert(p.status === "RUNNING" && p.pid === 1, "PM: spawn cria processo RUNNING com PID 1");
    await new Promise((r) => setTimeout(r, 60));
    assert(p.status === "COMPLETED" && p.output === "ok", "PM: processo completa com output");

    const hangingRuntime: any = { getAgent: () => ({ id: "h", name: "H", role: "r" }), execute: () => new Promise(() => {}) };
    const pm3 = new ProcessManager(hangingRuntime, { timeoutMs: 80 });
    const ph = pm3.spawn("h", "x");
    await new Promise((r) => setTimeout(r, 150));
    assert(ph.status === "TIMEOUT", "PM: processo pendurado vira TIMEOUT (não bloqueia)");
    assert(pm3.kill(999) === undefined, "PM: kill de PID inexistente retorna undefined");
  }

  // ── 2. Virtual File System ──
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tvs-os-"));
    const vfs = new VirtualFileSystem({ baseDir: tmp });
    assert(vfs.ls("/").map((e) => e.name).includes("workspace"), "VFS: raiz expõe /workspace");
    vfs.write("/workspace/hello.txt", "TVS OS");
    assert(vfs.read("/workspace/hello.txt") === "TVS OS", "VFS: write + read round-trip");
    assert(vfs.ls("/workspace")[0].name === "hello.txt", "VFS: ls lista ficheiro");
    let threw = false;
    try { vfs.read("/../../etc/passwd"); } catch { threw = true; }
    assert(threw, "VFS: path traversal (..) é rejeitado");
  }

  // ── 3. TVS OS integrado (Kernel + Runtime offline + Store + Pkg + Security) ──
  {
    const kernel = new Kernel();
    const runtime = new AgentRuntime();
    const specsDir = path.join(process.cwd(), "src", "omega", "agent-runtime", "specs");
    const loaded = runtime.loadSpecsFromDir(specsDir);
    assert(loaded.valid >= 10, `OS: runtime carrega specs (${loaded.valid})`);

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tvs-os-"));
    const osLayer = new TVSOs({ kernel, runtime, baseDir: tmp });
    const boot = osLayer.boot();
    assert(boot.version === "1.0.0", "OS: boot devolve versão");

    const st = osLayer.status();
    assert((st.agents?.loaded ?? 0) >= 10, "OS: status expõe runtime");
    assert(st.store.catalog >= 10, "OS: App Store tem catálogo (agentes + squads + módulos)");
    assert(st.security.roles.includes("commander"), "OS: Security Center expõe roles do kernel");

    const spawned = osLayer.spawn(runtime.listAgents()[0].id, "tarefa rápida");
    assert(spawned.pid >= 1 && spawned.status === "RUNNING", "OS: spawn integrado via TVSOs");

    const auth = osLayer.security.authorize({ id: "t", name: "Teste", role: "viewer" }, "kernel.read");
    assert(auth === true, "OS: authorize concede permissão válida");
    const denied = osLayer.security.authorize({ id: "t", name: "Teste", role: "viewer" }, "deploy.release");
    assert(denied === false, "OS: authorize nega permissão de viewer em deploy");

    const installed = osLayer.store.install("agent_security");
    assert(installed.installed === true, "Store: instalar agente do catálogo");
    assert(osLayer.store.isInstalled("agent_security"), "Store: isInstalled reflete instalação");
    assert(osLayer.pkg.listInstalled().some((a) => a.id === "agent_security"), "Pkg: listInstalled inclui agente");
    osLayer.store.uninstall("agent_security");
    assert(!osLayer.store.isInstalled("agent_security"), "Store: uninstall remove do estado");

    const doctor = osLayer.pkg.doctor();
    assert(doctor.healthy === true, "Pkg: doctor sem problemas críticos");

    const audit = osLayer.security.status();
    assert(audit.auditCount >= 2, "Security: audit registou authorize");
  }

  // ── 4. PackageManager standalone ──
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tvs-os-"));
    const store = new AppStore({ dataFile: path.join(tmp, "apps.json") });
    const runtime = new AgentRuntime();
    runtime.loadSpecsFromDir(path.join(process.cwd(), "src", "omega", "agent-runtime", "specs"));
    const pkg = new PackageManager({ store, runtime });
    const upd = pkg.update();
    assert(upd.valid >= 10, "Pkg: update recarrega specs");
    const d = pkg.doctor();
    assert(typeof d.healthy === "boolean" && d.issues.length > 0, "Pkg: doctor devolve issues");
  }

  console.log(`\n==========================================`);
  console.log(total === passed ? `✅ TVS OS: ${passed}/${total} testes passaram` : `❌ TVS OS: ${passed}/${total} — FALHAS DETETADAS`);
  console.log(`==========================================\n`);

  if (passed !== total) process.exit(1);
}

runOsTests().catch((e) => {
  console.error("TVS OS tests crashed:", e);
  process.exit(1);
});
