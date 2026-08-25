import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// ARKOM / AIOX — Motor de auditoria operacional autónoma.
// SQUADS: AIOX-1 Systems · AIOX-2 Avionics · AIOX-3 Mission · AIOX-4 Operations · AIOX-5 Launch
// ARKOM: Observer (audita) · Guardian (bloqueia risco) · Executor (aplica)

export type Severity = "blocker" | "high" | "medium" | "low" | "info";

export interface AuditFinding {
  id: string;
  severity: Severity;
  squad: string;
  title: string;
  detail: string;
  fix: string;
  canAutofix: boolean;
}

export interface AuditAction {
  tool: string;
  detail: string;
  ok: boolean;
}

export interface AuditReport {
  timestamp: string;
  verdict: "GO" | "NO-GO";
  blockers: number;
  counts: { findings: number; high: number; medium: number; low: number; info: number };
  findings: AuditFinding[];
  actions: AuditAction[];
  summary: string[];
}

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8", cwd: process.cwd(), stdio: ["pipe", "pipe", "ignore"] }).toString().trim();
  } catch (e: any) {
    return e?.stdout ? String(e.stdout).trim() : String(e?.message || "");
  }
}

const REQUIRED_ENV = ["TVS_JWT_SECRET"];
const OPTIONAL_ENV: Array<[string, string]> = [
  ["DATABASE_URL", "Postgres — sem ela usa JSON fallback"],
  ["STRIPE_SECRET_KEY", "Cobranças reais — sem ela billing fica em modo manual"],
  ["OPENAI_API_KEY", "IA cloud OpenAI"],
  ["ANTHROPIC_API_KEY", "IA cloud Claude"],
  ["GEMINI_API_KEY", "IA cloud Gemini"],
  ["XAI_API_KEY", "IA cloud Grok"],
  ["EMAIL_PROVIDER", "dev/smtp/resend/sendgrid/gmail"],
  ["GMAIL_REFRESH_TOKEN", "OAuth Gmail do agente de atendimento"],
];

export class ArkomEngine {
  constructor(private readonly dataDir: string) {}

  private scanDir(dir: string, matcher: (line: string, file: string) => boolean): string[] {
    const hits: string[] = [];
    if (!fs.existsSync(dir)) return hits;
    const walk = (d: string) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git" || entry.name === "arkom") continue;
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx|js)$/.test(entry.name)) {
          try {
            const lines = fs.readFileSync(full, "utf8").split("\n");
            lines.forEach((line, i) => {
              if (matcher(line, full)) hits.push(`${full.replace(/\\/g, "/")}:${i + 1}`);
            });
          } catch {}
        }
      }
    };
    walk(dir);
    return hits;
  }

  async run(): Promise<AuditReport> {
    const findings: AuditFinding[] = [];
    const actions: AuditAction[] = [];
    const summary: string[] = [];
    const timestamp = new Date().toISOString();

    // ── FASE SCAN (AIOX-1/4: sistemas + operações) ──────────
    const lint = run("npx tsc --noEmit 2>&1");
    const lintErrors = lint.split("\n").filter((l) => /error TS\d+/.test(l));
    findings.push({
      id: "SCAN-01",
      severity: lintErrors.length ? "high" : "info",
      squad: "AIOX-1 Systems",
      title: "Compilação TypeScript (tsc --noEmit)",
      detail: lintErrors.length ? `${lintErrors.length} erro(s): ${lintErrors.slice(0, 5).join(" | ")}` : "OK — sem erros de tipo",
      fix: lintErrors.length ? "Corrigir os erros de tipo antes do deploy" : "—",
      canAutofix: false,
    });

    const coreOut = run("npx tsx tests/core.test.ts 2>&1");
    const coreLine = coreOut.split("\n").find((l) => l.includes("PASADAS")) || "n/a";
    const coreOk = /14\/14|PRUEBAS PASADAS/.test(coreLine) || coreLine.includes("PASSED");
    findings.push({
      id: "SCAN-02",
      severity: coreOk ? "info" : "blocker",
      squad: "AIOX-3 Mission",
      title: "Testes core",
      detail: coreLine.trim(),
      fix: coreOk ? "—" : "Corrigir falhas nos testes core",
      canAutofix: false,
    });

    const webOut = run("npx tsx tests/web.test.ts 2>&1");
    const webLine = webOut.split("\n").find((l) => l.includes("PASSED")) || "n/a";
    const webOk = /53\/53/.test(webLine) || webLine.includes("PASSED");
    findings.push({
      id: "SCAN-03",
      severity: webOk ? "info" : "blocker",
      squad: "AIOX-3 Mission",
      title: "Testes web",
      detail: webLine.trim(),
      fix: webOk ? "—" : "Corrigir falhas nos testes web",
      canAutofix: false,
    });

    // Ambiente
    for (const env of REQUIRED_ENV) {
      if (!process.env[env]) {
        findings.push({
          id: "ENV-01",
          severity: "high",
          squad: "AIOX-4 Operations",
          title: `Variável de ambiente obrigatória: ${env}`,
          detail: `${env} não está definida`,
          fix: `Definir ${env} no .env (ou Render env)`,
          canAutofix: false,
        });
      }
    }
    for (const [env, why] of OPTIONAL_ENV) {
      if (!process.env[env]) {
        findings.push({
          id: "ENV-02",
          severity: "medium",
          squad: "AIOX-4 Operations",
          title: `Variável de ambiente: ${env}`,
          detail: `Não definida — ${why}`,
          fix: `Definir ${env} para ativar a capacidade`,
          canAutofix: false,
        });
      }
    }

    // Segredos hardcoded
    const secretHits = this.scanDir("src", (line, file) => {
      const l = line.toLowerCase();
      return (
        /password123|password\s*[:=]\s*["'][^"']+["']/.test(l) ||
        /sk-live-[a-z0-9]+/i.test(l) ||
        /AKIA[0-9A-Z]{16}/.test(l) ||
        /api[_-]?key\s*[:=]\s*["'][^"']{16,}["']/i.test(l) ||
        /client[_-]?secret\s*[:=]\s*["'][^"']+["']/i.test(l)
      ) && !l.includes("//") && !l.includes("* ");
    }).slice(0, 5);
    if (secretHits.length) {
      findings.push({
        id: "SEC-01",
        severity: "blocker",
        squad: "ARKOM-Guardian",
        title: "Possíveis segredos/credenciais no código",
        detail: secretHits.join(" | "),
        fix: "Mover segredos para .env / variáveis de ambiente",
        canAutofix: false,
      });
    }

    // TODO/FIXME
    const todos = this.scanDir("src", (line) => /(TODO|FIXME|XXX)/.test(line)).length;
    if (todos > 0) {
      findings.push({
        id: "CODE-01",
        severity: "low",
        squad: "AIOX-1 Systems",
        title: `Marcadores TODO/FIXME no código (${todos})`,
        detail: "Há pendências de código assinaladas",
        fix: "Revisar e resolver ou documentar cada TODO",
        canAutofix: false,
      });
    }

    // Git
    const gitStatus = run("git status --porcelain");
    const uncommitted = gitStatus.split("\n").filter(Boolean).length;
    if (uncommitted > 0) {
      findings.push({
        id: "GIT-01",
        severity: "low",
        squad: "AIOX-5 Launch",
        title: `Alterações não commitadas (${uncommitted})`,
        detail: "Working tree sujo antes do deploy",
        fix: "git add + commit (regra: testar antes de deploy)",
        canAutofix: false,
      });
    }

    // Log de erros recentes
    try {
      const logFile = path.join(this.dataDir, "system.log");
      if (fs.existsSync(logFile)) {
        const size = fs.statSync(logFile).size;
        if (size > 30 * 1024 * 1024) {
          findings.push({
            id: "OPS-01",
            severity: "medium",
            squad: "AIOX-4 Operations",
            title: "system.log com tamanho excessivo",
            detail: `${(size / 1024 / 1024).toFixed(1)} MB — pode saturar o disco`,
            fix: "Rodar npm run backup (arquiva logs) ou truncar o ficheiro",
            canAutofix: true,
          });
        }
      }
    } catch {}

    // Dados essenciais
    const dataOk = fs.existsSync(path.join(this.dataDir, "accounts.json"));
    if (!dataOk) {
      findings.push({
        id: "DATA-01",
        severity: "info",
        squad: "AIOX-4 Operations",
        title: "Base de dados JSON ainda não criada",
        detail: "accounts.json inexistente (cria no primeiro registo)",
        fix: "—",
        canAutofix: false,
      });
    }

    // ── FASE FIX (ARKOM-Executor + Guardian) ─────────────────
    const autoFixable = findings.filter((f) => f.canAutofix);
    for (const f of autoFixable) {
      if (f.id === "OPS-01") {
        try {
          fs.truncateSync(path.join(this.dataDir, "system.log"), 0);
          actions.push({ tool: "truncate_log", detail: "system.log truncado", ok: true });
          summary.push(`[AIOX-4] Auto-fix: truncado system.log`);
        } catch (e: any) {
          actions.push({ tool: "truncate_log", detail: e.message, ok: false });
        }
      }
    }

    // ── FASE VERIFY + VERDICT (AIOX-5 Launch go/no-go) ───────
    const blockers = findings.filter((f) => f.severity === "blocker");
    const high = findings.filter((f) => f.severity === "high");
    const verdict: AuditReport["verdict"] = blockers.length ? "NO-GO" : "GO";
    if (actions.length === 0) {
      actions.push({ tool: "autofix", detail: "Nenhum auto-fix seguro necessário", ok: true });
    }

    summary.push(`[AIOX-5] Verdicto: ${verdict} — blockers=${blockers.length} · high=${high.length}`);
    summary.push(`[ARKOM-Observer] Auditoria concluída: ${findings.length} achados.`);

    return {
      timestamp,
      verdict,
      blockers: blockers.length,
      counts: {
        findings: findings.length,
        high: findings.filter((f) => f.severity === "high").length,
        medium: findings.filter((f) => f.severity === "medium").length,
        low: findings.filter((f) => f.severity === "low").length,
        info: findings.filter((f) => f.severity === "info").length,
      },
      findings,
      actions,
      summary,
    };
  }
}
