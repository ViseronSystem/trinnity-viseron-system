#!/usr/bin/env node
/**
 * TVS CLI — Package Manager / System Doctor
 *
 *   tvs status          → estado geral do sistema
 *   tvs list            → apps instalados
 *   tvs install <id>    → instalar app/agente/squad/módulo
 *   tvs uninstall <id>  → desinstalar
 *   tvs update          → recarregar specs/manifests
 *   tvs doctor          → diagnóstico de saúde do sistema
 *   tvs spawn <agentId> "<tarefa>"  → executar agente como processo
 *   tvs ls [path]       → listar ficheiros do TVS Virtual FS
 *
 * Exemplos:
 *   tvs install agent_security
 *   tvs install squad_operations
 *   tvs doctor
 */
import "dotenv/config";

const BASE = process.env.TVS_API_URL || "http://localhost:3000";
const API = `${BASE}/api/os`;

async function call(method: string, path: string, body?: any) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(API + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `${res.status}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);

  switch (cmd) {
    case "status": {
      const s = await call("GET", "/status");
      console.log(`\n  ${s.name} v${s.version}`);
      console.log(`  ├─ Kernel: ${s.kernel?.name} v${s.kernel?.version} (uptime ${Math.floor((s.uptimeMs ?? 0) / 60000)}m)`);
      console.log(`  ├─ Agentes runtime: ${s.agents?.loaded ?? 0} · squads/enterprise: ${s.store?.catalog ?? 0} apps no catálogo`);
      console.log(`  ├─ Processos: ${s.processes?.total ?? 0} total · ${s.processes?.running ?? 0} running`);
      console.log(`  ├─ Watchdog: ${s.watchdog?.enabled ? "ATIVO (" + s.watchdog.targets.length + " alvos, stale " + Math.round((s.watchdog?.staleMs ?? 0) / 1000) + "s)" : "OFF"}`);
      console.log(`  └─ Security: ${s.security?.roles?.length ?? 0} roles · ${s.security?.auditCount ?? 0} audit logs\n`);
      break;
    }
    case "list": {
      const d = await call("GET", "/pkg/list");
      if (!d.installed.length) { console.log("\n  Nenhum app instalado. Usa: tvs install <id>\n"); break; }
      console.log("\n  INSTALADOS:");
      for (const app of d.installed) console.log(`  ✓ ${app.id} — ${app.name} (${app.kind})`);
      console.log("");
      break;
    }
    case "install": {
      if (!arg) { console.error("  Usa: tvs install <id>\n  Ex.: tvs install agent_security"); process.exit(1); }
      const r = await call("POST", "/pkg/install", { id: arg });
      console.log(`\n  ✓ Instalado: ${r.app.id} — ${r.app.name}\n`);
      break;
    }
    case "uninstall": {
      if (!arg) { console.error("  Usa: tvs uninstall <id>"); process.exit(1); }
      const r = await call("POST", "/pkg/uninstall", { id: arg });
      console.log(`\n  ✗ Desinstalado: ${r.app.id}\n`);
      break;
    }
    case "update": {
      const r = await call("POST", "/pkg/update");
      console.log(`\n  ✓ Atualizado: ${r.reloaded.join(" · ")}\n  valid=${r.valid} failed=${r.failed}\n`);
      break;
    }
    case "doctor": {
      const d = await call("GET", "/pkg/doctor");
      console.log(`\n  TVS DOCTOR — ${d.healthy ? "SISTEMA SAUDÁVEL ✓" : "PROBLEMAS DETETADOS ✗"}`);
      for (const i of d.issues) {
        const icon = i.severity === "OK" ? "✓" : i.severity === "WARN" ? "!" : "✗";
        console.log(`  ${icon} ${i.check.padEnd(28)} ${i.severity.padEnd(4)} ${i.detail}`);
      }
      console.log("");
      break;
    }
    case "spawn": {
      const agentId = arg;
      const task = process.argv[3];
      if (!agentId || !task) { console.error("  Usa: tvs spawn <agentId> \"tarefa\""); process.exit(1); }
      const p = await call("POST", "/processes/spawn", { agentId, task });
      console.log(`\n  ▶ Processo ${p.pid}: ${p.agentName} — ${p.status}\n`);
      break;
    }
    case "ls": {
      const p = arg || "/";
      const d = await call("GET", `/fs/list?path=${encodeURIComponent(p)}`);
      console.log(`\n  /api/os/fs · ${d.path}`);
      for (const e of d.entries) console.log(`  ${e.type === "dir" ? "📁" : "  "} ${e.name}${e.type === "dir" ? "/" : ""}`);
      console.log("");
      break;
    }
    default:
      if (!cmd) {
        const s = await call("GET", "/status");
        console.log(`\n  ${s.name} v${s.version} — ${s.kernel?.name} v${s.kernel?.version}`);
        console.log(`  ├─ Agentes runtime: ${s.agents?.loaded ?? 0} · catálogo: ${s.store.catalog} apps · processos: ${s.processes?.running ?? 0} running`);
        console.log(`  ├─ Watchdog: ${s.watchdog?.enabled ? "ATIVO (" + s.watchdog.targets.length + " alvos)" : "OFF"} · uptime ${Math.floor((s.uptimeMs ?? 0) / 60000)}m`);
        console.log(`  └─ Help: tvs status | list | install <id> | uninstall <id> | update | doctor | spawn | ls\n`);
        break;
      }
      console.log(`
  TVS CLI — AI-Native Operating System

  Comandos:
    tvs status          → estado geral do sistema
    tvs list            → apps instalados
    tvs install <id>    → instalar app/agente/squad/módulo
    tvs uninstall <id>  → desinstalar
    tvs update          → recarregar specs/manifests
    tvs doctor          → diagnóstico de saúde do sistema
    tvs spawn <agentId> "<tarefa>"
    tvs ls [path]       → listar ficheiros do TVS Virtual FS

  Exemplos:
    tvs install agent_security
    tvs install squad_operations
    tvs doctor
`);
  }
}

main().catch((e) => {
  console.error(`\n  ✗ TVS CLI: ${e.message}\n  (o servidor está ligado? http://localhost:3000)\n`);
  process.exit(1);
});
