const path = require("path");
const fs = require("fs");

process.env.TVS_ROOT = __dirname;
process.env.NODE_ENV = "production";
global.__TVS_ROOT = __dirname;

function findAsset(assetName) {
  const candidates = [
    path.join(__dirname, "assets", assetName),
    path.join(__dirname, assetName),
    path.join(process.cwd(), assetName),
    path.join(process.cwd(), "assets", assetName),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

try { require("dotenv").config({ path: findAsset(".env") || path.join(__dirname, "assets", ".env") }); } catch {}

// ICU polyfill for pkg
(function () {
  try {
    new TextDecoder("ascii").decode(new Uint8Array([65]));
  } catch (e) {
    const RealTD = global.TextDecoder;
    function TVSTextDecoder(encoding, options) {
      this.encoding = "utf-8";
      this._real = null;
      try {
        this._real = new RealTD(encoding || "utf-8", options);
        this.encoding = this._real.encoding;
      } catch (err) {
        this._real = null;
      }
    }
    TVSTextDecoder.prototype.decode = function (input, options) {
      if (this._real) return this._real.decode(input, options);
      const bytes = input instanceof Uint8Array ? input : new Uint8Array(input.buffer, input.byteOffset || 0, input.byteLength);
      let s = "";
      for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
      return s;
    };
    global.TextDecoder = TVSTextDecoder;
  }
})();

const errorCounts = new Map();
const MAX_ERRORS_BEFORE_FALLBACK = 10;

function safeLog(label, fn, fallback) {
  try {
    return fn();
  } catch (err) {
    const key = label.toString();
    const count = (errorCounts.get(key) || 0) + 1;
    errorCounts.set(key, count);
    if (count <= 3) console.error(`[TVS] ${label}: ${err?.message || err}`);
    if (count >= MAX_ERRORS_BEFORE_FALLBACK) {
      console.error(`[TVS] ${label} failed repeatedly, using fallback`);
    }
    return fallback;
  }
}

process.on("uncaughtException", (err) => {
  console.error("[TVS] Uncaught exception (continuing):", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[TVS] Unhandled rejection (continuing):", reason instanceof Error ? reason.message : reason);
});

async function startTVS() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║     TRINNITY VISERON SYSTEM v5.0 - STANDALONE EXECUTABLE              ║
║     Multi-Agent AI Operating System                                    ║
║     👑 Supreme Commander: Pedro Costa    👸 Queen: Trinnity Hurtado    ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  let tvs = null;
  let terminal = null;
  let dashboard = null;

  const ViseronCore = safeLog("Load ViseronCore", () => require("../dist/src/core/ViseronCore").ViseronCore, null);
  if (!ViseronCore) {
    console.error("[TVS] Failed to load core module. Running in minimal mode.");
    return startMinimalTerminal();
  }

  tvs = safeLog("Create ViseronCore", () => new ViseronCore(), null);
  if (!tvs) return startMinimalTerminal();

  safeLog("Start core", () => tvs.start(), null);

  const TVSDashboardServer = safeLog("Load Dashboard", () => require("../dist/src/dashboard/server").TVSDashboardServer, null);
  if (TVSDashboardServer) {
    dashboard = safeLog("Start Dashboard", () => {
      const d = new TVSDashboardServer(tvs);
      d.start();
      return d;
    }, null);
  }

  const TVSTerminal = safeLog("Load Terminal", () => require("../dist/src/terminal/TerminalInterface").TVSTerminal, null);
  if (TVSTerminal) {
    terminal = safeLog("Start Terminal", () => {
      const t = new TVSTerminal(tvs, dashboard);
      t.start();
      return t;
    }, null);
  }

  if (!terminal) {
    console.log("[TVS] Terminal failed to start, entering minimal mode...");
    return startMinimalTerminal();
  }

  await waitForTerminal(terminal);
}

function startMinimalTerminal() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "TVS> ",
    historySize: 100,
  });

  console.log(`
[TVS] Running in MINIMAL MODE - core modules not fully loaded
[TVS] Type 'help' for commands, 'exit' to quit
`);

  rl.prompt();
  rl.on("line", (line) => {
    const cmd = line.trim().toLowerCase();
    if (cmd === "exit" || cmd === "quit") {
      console.log("[TVS] Shutting down...");
      rl.close();
      process.exit(0);
    } else if (cmd === "help") {
      console.log(`
  Commands:
    help     - Show this help
    status   - Show system status
    exit     - Quit TVS
      `);
    } else if (cmd === "status") {
      console.log("[TVS] Minimal mode active. Full system requires proper build.");
    } else if (cmd) {
      console.log(`[TVS] Unknown command: ${cmd}. Type 'help'.`);
    }
    rl.prompt();
  });
}

function waitForTerminal(terminal) {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (!global.__TVS_TERMINAL_ACTIVE) {
        clearInterval(check);
        resolve();
      }
    }, 1000);
  });
}

process.on("SIGINT", () => {
  if (global.__TVS_TERMINAL_ACTIVE) return;
  console.log("\n[TVS] Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[TVS] Shutting down gracefully...");
  process.exit(0);
});

startTVS().catch((err) => {
  console.error("[TVS] Fatal error:", err?.message || err);
  startMinimalTerminal();
});