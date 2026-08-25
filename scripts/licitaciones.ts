import path from "path";
import { LicitacionStore } from "../src/core/licitaciones";

// TVS — LICITACIONES OS · CLI
// npm run licitacoes:status · npm run licitacoes:list · npm run licitacoes:check -- <id> <n>

const DATA_DIR = path.resolve(__dirname, "..", "data");

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "status";
  const store = new LicitacionStore(DATA_DIR);

  if (cmd === "status") {
    const s = store.status();
    console.log("=".repeat(58));
    console.log("LICITACIONES OS — VIGILÂNCIA DE CONCURSOS PÚBLICOS");
    console.log("=".repeat(58));
    console.log(`Total:        ${s.total}`);
    console.log(`Ativas:       ${s.active}`);
    console.log(`Por estado:   ${Object.entries(s.byStatus).map(([k, v]) => `${k}:${v}`).join(" · ")}`);
    console.log(`Urgentes (≤30 dias): ${s.urgent.length}`);
    for (const u of s.urgent) {
      const dl = store.daysLeft(u);
      console.log(`  ⚠ ${dl}d · ${u.name} · ${u.organ} · €${u.budget.toLocaleString("es-ES")} (${u.status})`);
    }
    console.log("\nChecklist Vadillos:");
    const vad = store.get("lic_vadillos_2026");
    if (vad) {
      const done = vad.checklist.filter((c) => c.done).length;
      console.log(`  ${done}/${vad.checklist.length} itens · prazo ${store.daysLeft(vad)} dias`);
      vad.checklist.forEach((c, i) => console.log(`  ${c.done ? "☑" : "☐"} ${i + 1}. ${c.task}`));
    }
    return;
  }

  if (cmd === "list") {
    for (const l of store.list()) {
      console.log(`${store.daysLeft(l)}d ${l.status.padEnd(11)} ${l.name} · ${l.organ} · €${l.budget.toLocaleString("es-ES")}`);
    }
    return;
  }

  if (cmd === "check") {
    const id = args[1];
    const idx = Number(args[2]);
    const l = store.toggleChecklist(id, idx - 1);
    if (!l) { console.error("Licitação ou item não encontrado"); process.exit(1); }
    const item = l.checklist[idx - 1];
    console.log(`${item.done ? "☑ MARCADO" : "☐ DESMARCADO"}: ${item.task}`);
    return;
  }

  if (cmd === "add") {
    const name = args.slice(1).join(" ").trim();
    if (!name) { console.error("Uso: npm run licitacoes:add -- \"Nome\" --deadline 2026-12-01 --budget 1000000 --organ X"); process.exit(1); }
    const dlIdx = args.indexOf("--deadline");
    const bgIdx = args.indexOf("--budget");
    const orgIdx = args.indexOf("--organ");
    const item = store.add({
      name,
      organ: orgIdx >= 0 ? args[orgIdx + 1] : "",
      url: "",
      budget: bgIdx >= 0 ? Number(args[bgIdx + 1]) : 0,
      deadline: dlIdx >= 0 ? args[dlIdx + 1] : new Date(Date.now() + 30 * 86400000).toISOString(),
      status: "vigilancia",
      phases: [],
      checklist: [],
      notes: "",
    });
    console.log(`Adicionada: ${item.id} · ${item.name}`);
    return;
  }

  console.log("Uso: status | list | check -- <id> <n> | add -- \"Nome\" [--deadline ISO] [--budget N] [--organ X]");
}

main();