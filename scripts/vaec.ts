import path from "path";
import { VaecOrchestrator } from "../src/omega/evolution";

// VAEC CLI — VISERON Autonomous Evolution & Continuity
// Uso:
//   npm run vaec -- run --desc "..." [--push]
//   npm run vaec -- status
//   npm run vaec -- history
//   npm run vaec -- gate <TEST|SYNC|BUILD|VERIFY>

const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const cmd = args[0] || "status";

const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

function dump(rec: any) {
  console.log(`\nID: ${rec.id}`);
  console.log(`At: ${rec.at}`);
  console.log(`Desc: ${rec.description}`);
  console.log(`Base: ${rec.baseRef}  Head: ${rec.headRef ?? "-"}`);
  console.log(`Outcome: ${rec.outcome}${rec.promoted ? " (PUSHED)" : ""}`);
  for (const s of rec.stages) {
    console.log(`  [${s.ok ? "PASS" : "FAIL"}] ${s.stage} ${s.error ? `— ${s.error}` : ""}`);
  }
}

async function main() {
  const vaec = new VaecOrchestrator({ rootDir: ROOT });

  if (cmd === "status") {
    const s = vaec.status();
    console.log(`[VAEC] stage=${s.stage} runs=${s.historySize} last=${s.lastOutcome ?? "-"} at=${s.lastAt ?? "-"}`);
    return;
  }

  if (cmd === "history") {
    if (vaec.history.length === 0) {
      console.log("[VAEC] sem ciclos registados ainda.");
      return;
    }
    for (const rec of vaec.history.slice(-10)) dump(rec);
    return;
  }

  if (cmd === "run") {
    const description = flag("desc") || "evolução autónoma";
    const push = hasFlag("push");
    const runner = new VaecOrchestrator({ rootDir: ROOT, autoPush: push });
    console.log(`[VAEC] ciclo "${description}" (push=${push})`);
    const rec = await runner.runCycle(description);
    dump(rec);
    console.log(`\n[VAEC] Jornal: data/state/vaec-journal.jsonl`);
    process.exit(rec.outcome === "PROMOTED" ? 0 : 1);
    return;
  }

  if (cmd === "gate") {
    const which = (args[1] || "").toUpperCase() as "TEST" | "SYNC" | "BUILD" | "VERIFY";
    const gates: Record<string, () => Promise<{ stage: string; ok: boolean; evidence: string[]; error?: string }>> = {
      TEST: () => runnerGate("TEST", "npm run test"),
      SYNC: () => {
        const { spawnSync } = require("child_process") as typeof import("child_process");
        const res = spawnSync("git pull --ff-only", { cwd: ROOT, shell: true, encoding: "utf8", timeout: 180000 });
        return Promise.resolve({ stage: "SYNC", ok: res.status === 0, evidence: [(res.stdout || res.stderr).trim()] });
      },
      BUILD: () => runnerGate("BUILD", "npm run build"),
      VERIFY: () => runnerGate("VERIFY", "npm run status:system"),
    };
    const runnerGate = (stage: string, cmdline: string) => {
      const { spawnSync } = require("child_process") as typeof import("child_process");
      const res = spawnSync(cmdline, { cwd: ROOT, shell: true, encoding: "utf8", timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
      return Promise.resolve({ stage, ok: res.status === 0, evidence: (res.stdout || res.stderr).trim().split(/\r?\n/).slice(-5) });
    };
    const gate = gates[which];
    if (!gate) {
      console.log("[VAEC] gate desconhecido. Use TEST, SYNC, BUILD ou VERIFY.");
      process.exit(2);
    }
    const res = await gate();
    console.log(`[VAEC] gate ${res.stage}: ${res.ok ? "PASS" : "FAIL"}`);
    for (const e of res.evidence) console.log(`   · ${e}`);
    process.exit(res.ok ? 0 : 1);
    return;
  }

  console.log("[VAEC] comandos: run --desc \"...\" [--push] | status | history | gate <TEST|SYNC|BUILD|VERIFY>");
  process.exit(2);
}

main().catch((e) => {
  console.error("[VAEC] falha:", e?.message || e);
  process.exit(1);
});
