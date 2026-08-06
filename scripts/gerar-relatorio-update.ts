import path from "path";
import { createTheme } from "./pdf-theme";

// TVS — GERADOR DE RELATÓRIO DE UPDATE
// Roda a cada atualização: produz data/Viseron_Update_Report_<data>.pdf

interface Commit {
  hash: string;
  date: string;
  message: string;
}

function exec(cmd: string): string {
  const { execSync } = require("child_process");
  try {
    return execSync(cmd, { encoding: "utf8", cwd: process.cwd(), stdio: ["pipe", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

function getCommits(since: string | null, n = 15): Commit[] {
  const range = since ? `${since}..HEAD` : `HEAD`;
  const raw = exec(`git log ${range} --format=%h%x09%ad%x09%s --date=short -n ${n}`);
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, date, ...rest] = line.split("\t");
      return { hash, date, message: rest.join("\t") };
    });
}

function run(name: string, fn: () => string): { name: string; ok: boolean; out: string } {
  try {
    const out = fn();
    return { name, ok: out !== "" && !out.toLowerCase().includes("fail"), out };
  } catch (e: any) {
    return { name, ok: false, out: String(e?.message || "erro") };
  }
}

async function main() {
  const outFile = path.resolve("data", `Viseron_Update_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  const today = new Date().toLocaleString("pt-PT");

  const t = createTheme({
    title: "Trinnity Viseron System — Relatório de Update",
    subject: "Atualização automática do sistema",
  });

  // Capa
  t.cover({
    title: "UPDATE AUTOMÁTICO",
    subtitle: `${today} — atualização do Trinnity Viseron System`,
    badges: ["TVS v5.0", "GitHub + Vercel", "PDF automático"],
    date: new Date().toISOString().slice(0, 10),
    version: "5.0",
    url: "www.trinnityviseronsystem.io",
  });

  // Seção 1: Versão e estado
  t.section("1", "Versão e estado");
  const version = exec("node -p \"require('./package.json').version\"") || "5.0.0";
  const lastTag = exec("git describe --tags --abbrev=0") || "sem-tags";
  t.kv("Versão:", version);
  t.kv("Última tag:", lastTag);
  t.kv("Branch:", exec("git branch --show-current") || "main");
  t.kv("Data do build:", new Date().toISOString());

  // Seção 2: Testes
  t.section("2", "Estado dos testes");
  const tCore = run("core", () => exec("npx tsx tests/core.test.ts 2>&1"));
  const tWeb = run("web", () => exec("npx tsx tests/web.test.ts 2>&1"));
  const coreLine = tCore.out.split("\n").find((l) => l.includes("PASADAS")) || "n/a";
  const webLine = tWeb.out.split("\n").find((l) => l.includes("PASSED")) || "n/a";
  t.kv("Core:", `${tCore.ok ? "PASS" : "FALHOU"} — ${coreLine.trim()}`);
  t.kv("Web:", `${tWeb.ok ? "PASS" : "FALHOU"} — ${webLine.trim()}`);

  // Seção 3: Commits recentes
  t.section("3", "Commits deste ciclo");
  const commits = getCommits(null);
  for (const c of commits) {
    t.bullet("▸", `${c.date}  ${c.hash}  ${c.message}`);
  }

  // Seção 4: Ficheiros alterados
  t.section("4", "Ficheiros alterados");
  const changed = exec("git diff --stat HEAD~1 2>&1").split("\n").filter(Boolean).slice(0, 25);
  for (const line of changed) {
    t.bullet("▸", line.length > 110 ? line.slice(0, 110) + "…" : line);
  }

  t.finish(outFile);
  console.log(`✅ Relatório de update gerado: ${outFile}`);
}

main().catch((e) => {
  console.error("Falha ao gerar relatório:", e.message);
  process.exit(1);
});
