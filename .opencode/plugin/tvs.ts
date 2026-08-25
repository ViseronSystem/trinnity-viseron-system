// .opencode/plugin/tvs.ts — Plugin local TVS para opencode
// Auto-descoberto (nao precisa de entrada em opencode.json).
// © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
//
// Funcionalidades:
// 1. shell.env — expoe as variaveis TVS nao-secretas (.env) aos comandos bash.
// 2. event — regista eventos de sessao/ferramentas em data/knowledge/opencode-events.jsonl
//    (memoria/auditoria para o JARVIS e squad AIOX, regra "nunca esquece").
// 3. provider.omniroute — regista o OmniRoute local (porta 20128) como provider
//    OpenAI-compatible com 115+ modelos (auto/best-reasoning, oc/, aug/, tllm/, etc.).
//    Evita "Model is unavailable" da cloud e mantem fallback robusto.

import * as fs from "node:fs";
import * as path from "node:path";

const SECRET_RE = /KEY|SECRET|TOKEN|PASSWORD|PASS|AUTH|CLIENT_ID|REFRESH/i;

export default async (input: { directory?: string }) => {
  const root = input?.directory || process.cwd();

  function loadEnv(): Record<string, string> {
    const env: Record<string, string> = {};
    try {
      const envPath = path.join(root, ".env");
      if (!fs.existsSync(envPath)) return env;
      for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!m) continue;
        const key = m[1];
        if (SECRET_RE.test(key)) continue;
        env[key] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {
      /* plugin nunca pode derrubar o opencode */
    }
    return env;
  }

  const logPath = path.join(root, "data", "knowledge", "opencode-events.jsonl");

  function logEvent(ev: Record<string, unknown>) {
    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      fs.appendFileSync(logPath, JSON.stringify(ev) + "\n");
    } catch {
      /* nao bloquear o opencode em caso de erro de escrita */
    }
  }

  return {
    "shell.env": (input: unknown, output: unknown) => {
      const env = loadEnv();
      if (output && typeof output === "object") {
        Object.assign(output, env);
        return;
      }
      return env;
    },
    event: (ev: { type?: string }) => {
      const type = String(ev?.type || "");
      if (!/^(session|tool|command)\./.test(type)) return;
      logEvent({ t: type, at: new Date().toISOString() });
    },
    provider: {
      omniroute: {
        options: {
          baseURL: "http://localhost:20128/v1",
          apiKey: "local",
          timeout: 60000,
        },
      },
    },
  };
};
