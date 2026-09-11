import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createTheme } from "./pdf-theme";

// TVS — COFRE TOTAL (PDF + MD)
// Gera data/Viseron_Cofre_Total_<data>.{pdf,md} com TUDO o que é confidencial:
// .env (valor real), git remotes/ident, contas, tokens Gmail, TODAS_CREDENCIAIS.json,
// wallets (Solana+EVM+ACESSOS), seeds, keypairs, senhas/askpass, encryption keys,
// inventário + conteúdo dos logs do sistema (local + remoto), manifesto de ficheiros.
// Uso: npm run cofre:total
// ATENÇÃO: CONFIDENCIAL — ficheiros gitignored. Guardar em local seguro/encriptado.
// Regra de segurança: nenhum segredo é impresso no terminal — só caminhos e tamanhos.

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data");

function stamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function readText(p: string, maxKb = 1024 * 1024 * 64): string {
  try {
    const abs = path.resolve(p);
    if (!fs.existsSync(abs)) return "";
    const stat = fs.statSync(abs);
    if (stat.size > maxKb) return `[truncado: ficheiro tem ${(stat.size / 1024 / 1024).toFixed(1)}MB — ver original em ${p}]`;
    return fs.readFileSync(abs, "utf8").replace(/\u0000/g, "").trim();
  } catch {
    return "";
  }
}

function readTail(p: string, lines = 800): string {
  try {
    const abs = path.resolve(p);
    if (!fs.existsSync(abs)) return "";
    const raw = fs.readFileSync(abs, "utf8").replace(/\u0000/g, "");
    const arr = raw.split(/\r?\n/);
    const total = arr.length;
    const tail = arr.slice(Math.max(0, total - lines));
    return `[tail ${tail.length}/${total} linhas — original: ${p}]\n` + tail.join("\n");
  } catch {
    return "";
  }
}

function readSmall(p: string): string {
  return readText(p, 4 * 1024 * 1024);
}

function gitOut(args: string): string {
  try {
    return execSync(`git ${args}`).toString().trim();
  } catch {
    return "";
  }
}

function sha(data: string): string {
  const crypto = require("crypto") as typeof import("crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
}

function listLogs(): Array<{ p: string; kb: number; lines: number }> {
  const out: Array<{ p: string; kb: number; lines: number }> = [];
  const roots = ["data"];
  for (const r of roots) {
    const base = path.join(ROOT, r);
    if (!fs.existsSync(base)) continue;
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          walk(full);
        } else if (/\.(log|jsonl|err|out)$/i.test(e.name)) {
          const st = fs.statSync(full);
          let lines = 0;
          try {
            lines = Number(execSync(`powershell -NoProfile -Command "(Get-Content -LiteralPath '${full.replace(/'/g, "''")}' | Measure-Object -Line).Lines"`, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }).trim()) || 0;
          } catch {
            lines = 0;
          }
          out.push({ p: path.relative(ROOT, full).replace(/\\/g, "/"), kb: st.size / 1024, lines });
        }
      }
    };
    walk(base);
  }
  return out.sort((a, b) => b.kb - a.kb);
}

// ─────────────────────────────────────────────────────────────
// RECOLHA DE DADOS
// ─────────────────────────────────────────────────────────────
const env = (() => {
  const out: Record<string, string> = {};
  try {
    for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim().trim('"').trim("'");
    }
  } catch {}
  return out;
})();

const data = {
  accounts: readSmall("data/accounts.json"),
  emailTokens: readSmall("data/email-tokens.json"),
  credenciais: "",
};
data.credenciais =
  readSmall(path.join("C:/Users/MySystem/Documents/TVS-Cofre-Local/docs-confidencial/TODAS_CREDENCIAIS.json")) ||
  readSmall("docs-confidencial/TODAS_CREDENCIAIS.json") ||
  readSmall("data/TODAS_CREDENCIAIS.json");

const wallets = {
  cosmos: readSmall("data/Viseron_Cosmos_Wallet_ACESSO.txt"),
  trading: readSmall("data/trading/WALLET_ACESSO.txt"),
  solana: readSmall("data/trading/SOLANA_ACESSO.txt"),
  todos: readSmall("data/trading/TODOS_ACESSOS.txt"),
  encKey: readSmall("data/trading/encryption_key.txt"),
  solKeypair: readSmall("contracts/solana-keypair.json"),
  solSeed: readSmall("contracts/solana-seed.txt"),
};

const creds = {
  rootPass: readSmall(path.join("C:/Users/MySystem/Documents/TVS-Cofre-Local/credenciais-temporarias/root.pass")).trim(),
  askpass: readSmall(path.join("C:/Users/MySystem/Documents/TVS-Cofre-Local/credenciais-temporarias/tvs-askpass.cmd")),
  askpassCurrent: readSmall(path.join("C:/Users/MySystem/Documents/TVS-Cofre-Local/credenciais-temporarias/tvs-askpass-current.cmd")),
  askpassTest: readSmall(path.join("C:/Users/MySystem/Documents/TVS-Cofre-Local/credenciais-temporarias/tvs-askpass-test.cmd")),
};

const logsLocal = {
  serverOut: readTail("data/server_out.log", 1000),
  serverErr: readTail("data/server_err.log", 600),
  server: readTail("data/server.log", 600),
  restart: readSmall("data/restart.log"),
  system: readSmall("data/system.log"),
  omniroute: readSmall("data/omniroute.log"),
  web: readTail("data/logs/web.log", 600),
  trading: readSmall("data/trading/bot.log") || readSmall("data/trading/real-trades.log"),
  social: readSmall("data/social/automator.log"),
  migration: readSmall("data/migration-cutover.log"),
};

const logsRemote = {
  stdout: readSmall(path.join("C:/Users/MySystem/AppData/Local/Temp/opencode/remoto-stdout-tail.txt")),
  stderr: readSmall(path.join("C:/Users/MySystem/AppData/Local/Temp/opencode/remoto-stderr-tail.txt")),
};

const gitIdentity = {
  name: gitOut("config --get user.name"),
  email: gitOut("config --get user.email"),
  remote: gitOut("remote -v"),
  branch: gitOut("branch --show-current"),
};

const logInventory = listLogs();

const today = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
const dateStamp = stamp();

// ─────────────────────────────────────────────────────────────
// MD
// ─────────────────────────────────────────────────────────────
const md: string[] = [];
md.push(`# TVS — COFRE TOTAL (CONFIDENCIAL)`);
md.push(``);
md.push(`> **CONFIDENCIAL** — Este documento contém TODAS as chaves, tokens, chaves de API, senhas, seeds de carteiras e logs do Trinnity Viseron System v7.0.`);
md.push(`> Guardar em local seguro/encriptado. **NUNCA partilhar nem commitar.**`);
md.push(`>`);
md.push(`> © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · TVS v7.0`);
md.push(`> Gerado: ${today} · SHA256: \`${sha(md.filter(() => true).join("\n"))}\``);
md.push(``);
md.push(`## Sumário`);
md.push(``);
md.push(`- Servidor remoto: \`194.62.96.99\` (VPS Windows, TVS core) · Site: \`https://www.trinnityviseronsystem.io\` (Vercel) · API: \`https://viseron-web.onrender.com\``);
md.push(`- Variáveis .env: **${Object.keys(env).length}** · Ficheiros de log: **${logInventory.length}**`);
md.push(`- Identidade git: \`${gitIdentity.name||'-'}\` <${gitIdentity.email||'-'}> · branch \`${gitIdentity.branch||'-'}\``);
md.push(``);

// 1. .env completo
md.push(`## 1 — VARIÁVEIS DE AMBIENTE (.env — TODAS, VALORES REAIS)`);
md.push(``);
md.push("```");
md.push(fs.readFileSync(path.join(ROOT, ".env"), "utf8").replace(/\r/g, "").trim());
md.push("```");
md.push(``);

// 2. Git
md.push(`## 2 — GIT (identidade + remotes)`);
md.push(``);
md.push("```");
md.push(`user.name:  ${gitIdentity.name}`);
md.push(`user.email: ${gitIdentity.email}`);
md.push(`branch:     ${gitIdentity.branch}`);
md.push(gitIdentity.remote);
md.push("```");
md.push(``);

// 3. Contas e tokens de email
md.push(`## 3 — CONTAS REGISTADAS + TOKENS EMAIL`);
md.push(``);
md.push(`\`data/accounts.json\`:`);
md.push("```json");
md.push(data.accounts || "(vazio)");
md.push("```");
md.push(`\`data/email-tokens.json\` (Gmail OAuth refresh tokens armazenados):`);
md.push("```json");
md.push(data.emailTokens || "(vazio)");
md.push("```");
md.push(``);

// 4. Credenciais estruturadas
md.push(`## 4 — TODAS AS CREDENCIAIS (estruturado — chaves privadas, seeds, API keys)`);
md.push(``);
md.push("```json");
md.push(data.credenciais || "(não encontrado)");
md.push("```");
md.push(``);

// 5. Wallets
md.push(`## 5 — WALLETS CRIPTO (Solana + EVM)`);
md.push(``);
md.push(`**Cosmos (Solana mainnet) — Viseron_Cosmos_Wallet_ACESSO.txt**`);
md.push("```");
md.push(wallets.cosmos || "(não encontrado)");
md.push("```");
md.push("");
md.push(`**Trading — WALLET_ACESSO.txt**`);
md.push("```");
md.push(wallets.trading || "(não encontrado)");
md.push("```");
md.push("");
md.push(`**Trading — SOLANA_ACESSO.txt**`);
md.push("```");
md.push(wallets.solana || "(não encontrado)");
md.push("```");
md.push("");
md.push(`**Trading — TODOS_ACESSOS.txt**`);
md.push("```");
md.push(wallets.todos || "(não encontrado)");
md.push("```");
md.push("");
md.push(`**Encryption key (trading) — encryption_key.txt**`);
md.push("```");
md.push(wallets.encKey || "(não encontrado)");
md.push("```");
md.push("");
md.push(`**Keypair Solana deploy — contracts/solana-keypair.json**`);
md.push("```json");
md.push(wallets.solKeypair || "(não encontrado)");
md.push("```");
md.push("");
md.push(`**Seed Solana deploy — contracts/solana-seed.txt**`);
md.push("```");
md.push(wallets.solSeed || "(não encontrado)");
md.push("```");
md.push(``);

// 6. Senhas / askpass
md.push(`## 6 — SENHAS / ACESSO SSH (VPS 194.62.96.99)`);
md.push(``);
md.push("```");
md.push(`utilizador remoto: Administrator`);
md.push(`host:             194.62.96.99`);
md.push(`password:         ${creds.rootPass || "(sem root.pass)"}`);
md.push(`askpass (cmd):    ${creds.askpass || "(não encontrado)"}`);
md.push(`askpass-current:  ${creds.askpassCurrent || "(não encontrado)"}`);
md.push(`askpass-test:     ${creds.askpassTest || "(não encontrado)"}`);
md.push("```");
md.push(``);

// 7. Logs locais
md.push(`## 7 — LOGS DO SISTEMA (conteúdo)`);
md.push(``);
const logBlocks: Array<[string, string]> = [
  ["data/server_out.log", logsLocal.serverOut],
  ["data/server_err.log", logsLocal.serverErr],
  ["data/server.log", logsLocal.server],
  ["data/restart.log", logsLocal.restart],
  ["data/system.log", logsLocal.system],
  ["data/omniroute.log", logsLocal.omniroute],
  ["data/logs/web.log", logsLocal.web],
  ["data/trading/bot.log / real-trades.log", logsLocal.trading],
  ["data/social/automator.log", logsLocal.social],
  ["data/migration-cutover.log", logsLocal.migration],
];
for (const [name, content] of logBlocks) {
  md.push(`### ${name}`);
  md.push("");
  md.push("```");
  md.push(content || "(vazio)");
  md.push("```");
  md.push("");
}
md.push(`## 7b — LOGS REMOTOS (194.62.96.99 — tails dos últimos 60)`);
md.push("");
md.push(`**C:\\tvs-server.stdout.log (tail)**`);
md.push("```");
md.push(logsRemote.stdout || "(sem acesso)");
md.push("```");
md.push("");
md.push(`**C:\\tvs-server.stderr.log (tail)**`);
md.push("```");
md.push(logsRemote.stderr || "(sem acesso)");
md.push("```");
md.push(``);

// 8. Inventário de ficheiros de log
md.push(`## 8 — INVENTÁRIO DE FICHEIROS DE LOG / JSONL`);
md.push(``);
md.push(`| Ficheiro | KB | Linhas |`);
md.push(`|---|---:|---:|`);
for (const l of logInventory) md.push(`| ${l.p} | ${l.kb.toFixed(1)} | ${l.lines} |`);
md.push(``);

// 9. Manifesto cofre local
md.push(`## 9 — COFRE LOCAL`); 
md.push(``);
const cofreRoot = path.join("C:/Users/MySystem/Documents/TVS-Cofre-Local");
let cofreList: string[] = [];
try {
  const walkC = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walkC(full);
      else cofreList.push(`${path.relative(cofreRoot, full).replace(/\\/g, "/")}  (${(fs.statSync(full).size / 1024).toFixed(1)} KB)`);
    }
  };
  if (fs.existsSync(cofreRoot)) walkC(cofreRoot);
} catch {}
md.push("```");
md.push(cofreList.length ? cofreList.join("\n") : "(cofre local não acessível)");
md.push("```");
md.push(``);
md.push(`> **AUTORIA**: © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) — Trinnity Viseron System v7.0`);
md.push(`> Este ficheiro é CI-CICATRIZ: gitignored, confidencial, destruir de forma segura se não for necessário.`);

const mdContent = md.join("\n");

// ─────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────
const t = createTheme({
  title: "TVS — COFRE TOTAL",
  subject: "CONFIDENCIAL — todas as chaves, tokens, APIs, senhas, seeds e logs",
});

t.cover({
  title: "COFRE TOTAL\nTodas as Chaves, Tokens,\nSenhas e Logs",
  subtitle: "Tudo o que é confidencial no Trinnity Viseron System v7.0 — .env, git, wallets, seeds, API keys, acesso SSH e logs",
  badges: ["CONFIDENCIAL", "NÃO PARTILHAR", "TVS v7.0"],
  date: today,
  version: "1.0",
});
t.para("CONFIDENCIAL — não partilhar publicamente · guardar encriptado · nunca commitar. Gerado pelo Squad AIOX.", 11, "#f87171");

// 1. env
t.section("1", "VARIÁVEIS DE AMBIENTE (.env — TODAS, VALORES REAIS)");
for (const k of Object.keys(env).sort()) t.kv(k, env[k]);

// 2. git
t.section("2", "GIT (identidade + remotes)");
t.kv("user.name", gitIdentity.name);
t.kv("user.email", gitIdentity.email);
t.kv("branch", gitIdentity.branch);
for (const line of gitIdentity.remote.split("\n")) t.para(line, 8, "#64748b");

// 3. contas + tokens email
t.section("3", "CONTAS REGISTADAS + TOKENS EMAIL");
t.para("accounts.json:", 9.5, "#334155");
t.para(data.accounts || "(vazio)", 8, "#64748b");
t.para("email-tokens.json (Gmail OAuth):", 9.5, "#334155");
t.para(data.emailTokens || "(vazio)", 8, "#64748b");

// 4. credenciais
t.section("4", "TODAS AS CREDENCIAIS (chaves privadas, seeds, API keys)");
for (const line of (data.credenciais || "(não encontrado)").split("\n")) t.para(line, 7.5, "#334155");

// 5. wallets
t.section("5", "WALLETS CRIPTO (Solana + EVM)");
const walletBlocks: Array<[string, string]> = [
  ["Cosmos — Viseron_Cosmos_Wallet_ACESSO.txt", wallets.cosmos],
  ["Trading — WALLET_ACESSO.txt", wallets.trading],
  ["Trading — SOLANA_ACESSO.txt", wallets.solana],
  ["Trading — TODOS_ACESSOS.txt", wallets.todos],
  ["Encryption key (trading)", wallets.encKey],
  ["Keypair Solana deploy (contracts/solana-keypair.json)", wallets.solKeypair],
  ["Seed Solana deploy (contracts/solana-seed.txt)", wallets.solSeed],
];
for (const [title, content] of walletBlocks) {
  t.sub(title);
  for (const line of (content || "(não encontrado)").split("\n")) t.para(line, 8, "#334155");
}

// 6. senhas
t.section("6", "SENHAS / ACESSO SSH (VPS 194.62.96.99)");
t.kv("utilizador remoto", "Administrator");
t.kv("host", "194.62.96.99");
t.kv("password", creds.rootPass || "(sem root.pass)");
t.kv("askpass (cmd)", creds.askpass || "(não encontrado)");

// 7. logs
t.section("7", "LOGS DO SISTEMA (local + remoto)");
for (const [name, content] of logBlocks) {
  t.sub(name);
  for (const line of (content || "(vazio)").split("\n")) t.para(line, 7, "#475569");
}
t.sub("LOGS REMOTOS (194.62.96.99)");
t.para("C:\\tvs-server.stdout.log (tail)", 8.5, "#334155");
for (const line of (logsRemote.stdout || "(sem acesso)").split("\n")) t.para(line, 7, "#475569");
t.para("C:\\tvs-server.stderr.log (tail)", 8.5, "#334155");
for (const line of (logsRemote.stderr || "(sem acesso)").split("\n")) t.para(line, 7, "#475569");

// 8. inventário
t.section("8", "INVENTÁRIO DE LOGS / JSONL");
for (const l of logInventory) t.para(`${l.p} — ${l.kb.toFixed(1)} KB · ${l.lines} linhas`, 8, "#64748b");

// 9. cofre local
t.section("9", "COFRE LOCAL");
for (const line of (cofreList.length ? cofreList : ["(cofre local não acessível)"])) t.para(line, 8, "#64748b");

t.spacer(1);
t.para("© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) — Trinnity Viseron System v7.0 · CONFIDENCIAL", 9, "#7c3aed", { align: "center" });

const outPdf = path.join(OUT_DIR, `Viseron_Cofre_Total_${dateStamp}.pdf`);
const outMd = path.join(OUT_DIR, `Viseron_Cofre_Total_${dateStamp}.md`);

fs.writeFileSync(outMd, mdContent, "utf8");
const pdfDone = new Promise<void>((resolve, reject) => {
  const ws = fs.createWriteStream(outPdf);
  ws.on("close", () => resolve());
  ws.on("error", reject);
  t.doc.pipe(ws);
  t.doc.end();
});
pdfDone.then(() => {
  const pdfBytes = fs.statSync(outPdf).size;
  const mdBytes = fs.statSync(outMd).size;
  const shaPdf = sha(fs.readFileSync(outPdf));
  const shaMd = sha(mdContent);

  const cofreDocs = path.join("C:/Users/MySystem/Documents/TVS-Cofre-Local/docs-confidencial");
  try {
    fs.copyFileSync(outPdf, path.join(cofreDocs, `Viseron_Cofre_Total_${dateStamp}.pdf`));
    fs.copyFileSync(outMd, path.join(cofreDocs, `Viseron_Cofre_Total_${dateStamp}.md`));
  } catch {}

  console.log("Cofre Total gerado:");
  console.log(`  PDF: ${outPdf}  (${(pdfBytes / 1024).toFixed(1)} KB · SHA256 ${shaPdf})`);
  console.log(`  MD : ${outMd}  (${(mdBytes / 1024).toFixed(1)} KB · SHA256 ${shaMd})`);
  console.log(`  Copias no cofre local: C:\\Users\\MySystem\\Documents\\TVS-Cofre-Local\\docs-confidencial\\`);
  console.log("ATENÇÃO: ficheiros CONFIDENCIAIS. Não partilhar — guardar encriptado.");
});