import { execSync } from "child_process";
import * as fs from "fs";
import path from "path";

// TVS — SCAN DE SEGREDOS VERSIONADOS (P4)
// Percorre os ficheiros trackados (git ls-files) e procura:
//   1) padrões de alta confiança (chaves privadas, API keys de providers, tokens);
//   2) valores reais do .env local a aparecerem em ficheiros versionados (CRITICAL).
// Saída: data/segredos-scan.json + resumo no terminal. Uso: npm run scan:segredos

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "segredos-scan.json");
const TEXT_EXT = /\.(ts|js|mjs|cjs|json|md|yml|yaml|env|sh|ps1|bat|txt|html|css|toml|cfg|ini|py|c|cpp|h|java|go|rs|vue|jsx|tsx|sql|xml)$/i;
const MAX_TEXT = 5 * 1024 * 1024;
const MAX_BIN = 25 * 1024 * 1024;
const SKIP_PREFIX = /^(node_modules|dist|graphify-out|skills\/vendor|\.git\/)/;

const HIGH_CONFIDENCE: Array<{ name: string; re: RegExp; mask: (m: string) => string }> = [
  { name: "Private Key PEM", re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/, mask: (m) => m },
  { name: "OpenAI", re: /\bsk-[A-Za-z0-9]{20,}\b/, mask: (m) => m.slice(0, 8) + "…" },
  { name: "Anthropic", re: /\bsk-ant-[A-Za-z0-9\-]{20,}\b/, mask: (m) => m.slice(0, 10) + "…" },
  { name: "Gemini", re: /\bAIza[0-9A-Za-z_\-]{30,}\b/, mask: (m) => m.slice(0, 8) + "…" },
  { name: "GitHub PAT", re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/, mask: (m) => m.slice(0, 8) + "…" },
  { name: "GitHub fine-grained", re: /\bgithub_pat_[A-Za-z0-9_]{30,}\b/, mask: (m) => m.slice(0, 12) + "…" },
  { name: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9\-]{10,}\b/, mask: (m) => m.slice(0, 8) + "…" },
  { name: "AWS Access Key", re: /\bAKIA[0-9A-Z]{16}\b/, mask: (m) => m.slice(0, 8) + "…" },
  { name: "Stripe live", re: /\b(?:sk|rk)_live_[0-9a-zA-Z]{20,}\b/, mask: (m) => m.slice(0, 10) + "…" },
  { name: "Twilio SID", re: /\bAC[0-9a-f]{32}\b/, mask: (m) => m.slice(0, 8) + "…" },
  { name: "Composio", re: /\bck_[A-Za-z0-9]{20,}\b/, mask: (m) => m.slice(0, 8) + "…" },
  { name: "Telegram bot token", re: /\b\d{8,10}:AA[A-Za-z0-9_\-]{30,}\b/, mask: (m) => m.slice(0, 8) + "…" },
  { name: "Solana/ETH base58 key (80+)", re: /\b[1-9A-HJ-NP-Za-km-z]{80,}\b/, mask: (m) => m.slice(0, 12) + "…" },
  { name: "JWT", re: /\beyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}/, mask: (m) => m.slice(0, 12) + "…" },
];

// Valores públicos por natureza (URLs/hosts/portas/emails/paths) — não são segredos
const PUBLIC_VALUE_KEYS = /^(NODE_ENV|PORT|RENDER_WEB_URL|RENDER_API_URL|TVS_PUBLIC_URL|OLLAMA_HOST|.*_HOST|.*_PATH|.*_DIR|.*_FILE|.*_MINUTES|.*_PORT|.*_URL|GMAIL_USER|SMTP_HOST|EMAIL_FROM|CONTENT_SCHEDULE_MINUTES|.*_WIDTH|.*_HEIGHT|.*_SIZE|.*_INTERVAL|.*_RETRY|.*_TIMEOUT|.*_LANG)$/;

function readEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return env;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

function isText(buf: Buffer): boolean {
  const sample = buf.slice(0, 4096);
  if (sample.includes(0)) return false;
  return true;
}

function main() {
  const files = execSync("git ls-files", { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split(/\r?\n/)
    .filter((f) => f && !SKIP_PREFIX.test(f));

  const env = readEnv();
  const envValues: Array<{ key: string; value: string }> = [];
  for (const [k, v] of Object.entries(env)) {
    if (!v || v.length < 10) continue;
    if (/^[<"']/.test(v) || /<.*>/.test(v)) continue;
    if (PUBLIC_VALUE_KEYS.test(k)) continue;
    envValues.push({ key: k, value: v });
  }

  const findings: Array<{ file: string; line: number; type: string; snippet: string; severity: "CRITICAL" | "HIGH" | "WARNING" }> = [];
  let scanned = 0;

  for (const f of files) {
    const abs = path.join(ROOT, f);
    let stat: fs.Stats;
    try { stat = fs.statSync(abs); } catch { continue; }
    const isTextFile = TEXT_EXT.test(f);
    if (!isTextFile && stat.size > MAX_BIN) continue;
    if (isTextFile && stat.size > MAX_TEXT) continue;

    const buf = fs.readFileSync(abs);
    if (isTextFile) {
      const text = buf.toString("utf8");
      scanned++;
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const p of HIGH_CONFIDENCE) {
          if (p.name.startsWith("Solana/ETH") && /integrity|sha512|ssh:\/\/|git\+|resolved/.test(line)) continue;
          const m = line.match(p.re);
          if (m) {
            findings.push({ file: f, line: i + 1, type: p.name, snippet: p.mask(m[0]), severity: "HIGH" });
          }
        }
      }
      // cross-check .env values
      if (envValues.length > 0) {
        for (const ev of envValues) {
          const idx = text.indexOf(ev.value);
          if (idx >= 0) {
            const lineNo = text.slice(0, idx).split(/\r?\n/).length;
            findings.push({ file: f, line: lineNo, type: `.env:${ev.key}`, snippet: ev.key + "=" + ev.value.slice(0, 6) + "…", severity: "CRITICAL" });
          }
        }
      }
    } else {
      // binário: procurar valores do .env nos bytes (latin1 p/ PDFs/imagens)
      const text = buf.toString("latin1");
      scanned++;
      for (const ev of envValues) {
        const idx = text.indexOf(ev.value);
        if (idx >= 0) {
          findings.push({ file: f, line: 0, type: `.env:${ev.key}`, snippet: ev.key + "=" + ev.value.slice(0, 6) + "…", severity: "CRITICAL" });
        }
      }
    }
  }

  const critical = findings.filter((x) => x.severity === "CRITICAL");
  const high = findings.filter((x) => x.severity === "HIGH");
  const warning = findings.filter((x) => x.severity === "WARNING");

  const result = {
    schema: "tvs/secret-scan/1",
    scannedAt: new Date().toISOString(),
    filesScanned: scanned,
    envKeysChecked: envValues.map((e) => e.key),
    summary: { critical: critical.length, high: high.length, warning: warning.length, total: findings.length },
    findings: findings.slice(0, 100),
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), "utf8");

  console.log(`[scan:segredos] ${scanned} ficheiros trackados analisados`);
  console.log(`[scan:segredos] CRITICAL=${critical.length} HIGH=${high.length} WARNING=${warning.length}`);
  if (critical.length > 0) {
    console.log("[scan:segredos] ⛔ VALORES DO .env ENCONTRADOS EM FICHEIROS VERSIONADOS:");
    for (const c of critical) console.log(`   - ${c.file}:${c.line} → ${c.snippet}`);
  }
  if (high.length > 0) {
    console.log("[scan:segredos] ⚠ padrões de alta confiança:");
    for (const h of high.slice(0, 30)) console.log(`   - ${h.file}:${h.line} → ${h.type} ${h.snippet}`);
  }
  console.log(`[scan:segredos] JSON → ${OUT}`);
}

main();
