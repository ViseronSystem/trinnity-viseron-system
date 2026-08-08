// omniroute-standalone.cjs — OmniRoute como SERVIÇO PERSISTENTE e independente do TVS.
// Verifica a porta 20128; se não estiver saudável, arranca o OmniRoute DETACHED
// (desligado do processo que o lançou) com log próprio. Assim o OmniRoute NUNCA
// morre nos restarts do TVS — o restart mata só o servidor principal e reutiliza-o.
// Uso: node scripts/omniroute-standalone.cjs

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.OMNIROUTE_PORT || "20128", 10);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const LOG_FILE = path.join(DATA_DIR, "omniroute.log");
const NPM_CACHE = process.env.NPM_CONFIG_CACHE || path.join(process.env.LOCALAPPDATA || ROOT, "npm-cache");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

function isUp() {
  return new Promise((resolve) => {
    const probes = ["/api/health", "/v1/models", "/health", "/"];
    let idx = 0;
    const tryProbe = () => {
      if (idx >= probes.length) return resolve(false);
      const probe = probes[idx++];
      const req = require("http").get(
        { host: "127.0.0.1", port: PORT, path: probe, timeout: 1500 },
        (res) => { res.resume(); resolve(true); }
      );
      req.on("error", tryProbe);
      req.on("timeout", () => { req.destroy(); tryProbe(); });
    };
    tryProbe();
  });
}

(async () => {
  if (await isUp()) {
    log(`OmniRoute já está no ar em http://localhost:${PORT} — a manter (nada a fazer)`);
    return;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const logFd = fs.openSync(LOG_FILE, "a");
  const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";

  // Sem shell:true nem string de comando — spawn direto com array de args.
  // Evita a cadeia PowerShell -> node -> shell -> npx.cmd (processos intermédios).
  const args = ["omniroute", "--port", String(PORT), "--no-open"];
  log(`OmniRoute em baixo — a arrancar DETACHED: ${npxBin} ${args.join(" ")}`);
  log(`Log: ${LOG_FILE}`);

  try {
    const child = spawn(npxBin, args, {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      windowsHide: true,
      env: {
        ...process.env,
        PORT: String(PORT),
        OMNIROUTE_DATA_DIR: DATA_DIR,
        OMNIROUTE_LOG: LOG_FILE,
      },
    });
    child.unref();
    log(`OmniRoute arrancado detached (pid=${child.pid}). Sobrevive aos restarts do TVS.`);
  } catch (err) {
    log(`Falha ao arrancar OmniRoute detached: ${err?.message || err}`);
    process.exitCode = 1;
  }
})();
