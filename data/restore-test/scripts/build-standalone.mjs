#!/usr/bin/env node
import { execSync } from "child_process";
import { resolve, join } from "path";
import { argv, platform } from "process";
import { fileURLToPath } from "url";
import fse from "fs-extra";

const { existsSync, ensureDirSync, writeFileSync, copySync, readFileSync } = fse;

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = join(ROOT, "dist");
const BUILD = join(ROOT, ".build");

const targets = {
  win: "node18-win-x64",
  mac: "node18-macos-x64",
  linux: "node18-linux-x64",
};

function log(msg) {
  console.log(`[BUILD-EXE] ${msg}`);
}

function checkDeps() {
  log("Checking dependencies...");

  if (!existsSync(join(ROOT, "node_modules"))) {
    log("Installing dependencies...");
    execSync("npm install", { cwd: ROOT, stdio: "inherit" });
  }

  try {
    execSync("npx pkg --version", { cwd: ROOT, stdio: "pipe" });
    log("pkg available");
  } catch {
    log("Installing pkg...");
    execSync("npm install -D pkg", { cwd: ROOT, stdio: "inherit" });
  }

  try {
    execSync("npx omniroute --version", { cwd: ROOT, stdio: "pipe" });
    log("omniroute available");
  } catch {
    log("Installing omniroute...");
    execSync("npm install omniroute", { cwd: ROOT, stdio: "inherit" });
  }
}

function buildTS() {
  log("Building TypeScript...");
  execSync("npx tsc", { cwd: ROOT, stdio: "inherit" });
  log("TypeScript build complete");
}

function copyAssets() {
  log("Copying assets...");
  const assetsDir = join(BUILD, "tvs-standalone", "assets");
  ensureDirSync(assetsDir);

  const assetPaths = [
    "data",
    "config",
    ".env.example",
    "agents",
    "skills",
  ];
  for (const p of assetPaths) {
    const src = join(ROOT, p);
    const dest = join(assetsDir, p);
    if (existsSync(src)) {
      copySync(src, dest, { overwrite: true });
      log(`  Copied ${p} -> assets/${p}`);
    }
  }
}

function createStandaloneEntry() {
  log("Creating standalone entry point...");
  const entryPath = join(BUILD, "standalone.js");
  const entrySource = join(ROOT, "scripts", "standalone-entry.js");
  if (existsSync(entrySource)) {
    copySync(entrySource, entryPath, { overwrite: true });
  } else {
    // Fallback inline entry
    const entry = `...`; // fallback if needed
    writeFileSync(entryPath, entry);
  }
  log("Standalone entry created");
}

function buildExe(targetPlatform) {
  log(`Building standalone executable for ${targetPlatform}...`);

  const target = targets[targetPlatform];
  if (!target) {
    console.error(`Unknown target: ${targetPlatform}. Available: ${Object.keys(targets).join(", ")}`);
    process.exit(1);
  }

  const outPath = join(BUILD, "tvs-standalone");
  ensureDirSync(outPath);

  const cmd = [
    `npx pkg`,
    `"${join(BUILD, "standalone.js")}"`,
    `--targets ${target}`,
    `--output "${join(outPath, `tvs-viseron-${targetPlatform}${targetPlatform === "win" ? ".exe" : ""}`)}"`,
    `--compress GZip`,
    `--scripts "${join(ROOT, "dist/src/**/*.js")}"`,
    `--assets "${join(ROOT, "node_modules/**/*")}"`,
    `--assets "${join(ROOT, "data/**/*")}"`,
    `--assets "${join(ROOT, "config/**/*")}"`,
    `--assets "${join(ROOT, "agents/**/*")}"`,
    `--assets "${join(ROOT, "skills/**/*")}"`,
    `--assets "${join(ROOT, ".env.example")}"`,
  ].join(" ");

  log(`Running: ${cmd}`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: "inherit", timeout: 300000 });
    log(`Executable built at: ${join(outPath, `tvs-viseron-${targetPlatform}${targetPlatform === "win" ? ".exe" : ""}`)}`);
  } catch (err) {
    log(`Build failed: ${err.message}`);
    log("Trying alternative build without compression...");
    const fallbackCmd = [
      `npx pkg`,
      `"${join(BUILD, "standalone.js")}"`,
      `--targets ${target}`,
      `--output "${join(outPath, `tvs-viseron-${targetPlatform}${targetPlatform === "win" ? ".exe" : ""}`)}"`,
      `--scripts "${join(ROOT, "dist/src/**/*.js")}"`,
      `--assets "${join(ROOT, "node_modules/**/*")}"`,
      `--assets "${join(ROOT, "data/**/*")}"`,
      `--assets "${join(ROOT, "config/**/*")}"`,
      `--assets "${join(ROOT, "agents/**/*")}"`,
      `--assets "${join(ROOT, "skills/**/*")}"`,
      `--assets "${join(ROOT, ".env.example")}"`,
    ].join(" ");
    execSync(fallbackCmd, { cwd: ROOT, stdio: "inherit", timeout: 300000 });
  }
}

function buildElectronExe() {
  log("Building Electron desktop executable...");

  try {
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  } catch {
    log("tsc build failed, continuing with dist if available...");
  }

  const electronDir = join(ROOT, "electron");
  ensureDirSync(electronDir);

  const mainJs = `
const { app, BrowserWindow, Menu, Tray, nativeImage, Notification } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let mainWindow;
let tvsProcess;
let tray;

const TVS_PORT = process.env.TVS_PORT || 3000;
const OMNIROUTE_PORT = process.env.OMNIROUTE_PORT || 20128;

function startTVSBackend() {
  const serverPath = path.join(__dirname, "..", "dist", "src", "index.js");
  if (require("fs").existsSync(serverPath)) {
    tvsProcess = fork(serverPath, [], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production", PORT: String(TVS_PORT) },
    });
    tvsProcess.stdout?.on("data", (d) => console.log("[TVS]", d.toString().trim()));
    tvsProcess.stderr?.on("data", (d) => console.error("[TVS]", d.toString().trim()));
    tvsProcess.on("exit", (code) => console.log("[TVS] Process exited:", code));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "TVS Viseron - Trinnity System",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(\`http://localhost:\${TVS_PORT}\`);
  mainWindow.setTitle("TVS Viseron - Multi Agent AI Operating System");

  mainWindow.on("closed", () => { mainWindow = null; });
}

function createTray() {
  try {
    tray = new Tray(nativeImage.createEmpty());
    const contextMenu = Menu.buildFromTemplate([
      { label: "Abrir TVS", click: () => mainWindow?.show() },
      { label: "Dashboard", click: () => mainWindow?.loadURL(\`http://localhost:\${TVS_PORT}\`) },
      { label: "OmniRoute", click: () => mainWindow?.loadURL(\`http://localhost:\${OMNIROUTE_PORT}\`) },
      { type: "separator" },
      { label: "Sair", click: () => { app.isQuitting = true; app.quit(); } },
    ]);
    tray.setToolTip("TVS Viseron");
    tray.setContextMenu(contextMenu);
  } catch {}
}

app.whenReady().then(() => {
  startTVSBackend();
  createWindow();
  createTray();

  app.on("activate", () => {
    if (mainWindow === null) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (tvsProcess) {
    tvsProcess.kill();
    tvsProcess = null;
  }
});
`;

  const preloadJs = `
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("tvs", {
  platform: process.platform,
  versions: { node: process.versions.node, electron: process.versions.electron },
});
`;

  writeFileSync(join(electronDir, "main.js"), mainJs);
  writeFileSync(join(electronDir, "preload.js"), preloadJs);

  const electronPkg = {
    name: "tvs-viseron",
    version: "5.0.0",
    description: "Trinnity Viseron System - Multi Agent AI Operating System",
    main: "main.js",
    scripts: {
      start: "electron .",
      "build:win": "electron-builder --win",
      "build:mac": "electron-builder --mac",
      "build:linux": "electron-builder --linux",
      "build:all": "electron-builder --win --mac --linux",
    },
    build: {
      appId: "com.trinnity.viseron",
      productName: "TVS Viseron",
      directories: { output: "dist-electron", buildResources: "assets" },
      files: [
        "main.js",
        "preload.js",
        "../dist/**/*",
        "../node_modules/**/*",
        "../data/**/*",
        "../config/**/*",
        "package.json",
      ],
      extraResources: [
        { from: "../node_modules/omniroute", to: "omniroute" },
      ],
      win: {
        target: [
          { target: "nsis", arch: ["x64"] },
          { target: "portable", arch: ["x64"] },
        ],
        icon: "assets/icon.ico",
      },
      mac: {
        target: [{ target: "dmg", arch: ["x64", "arm64"] }],
        icon: "assets/icon.icns",
        category: "public.app-category.developer-tools",
      },
      linux: {
        target: [
          { target: "AppImage", arch: ["x64"] },
          { target: "deb", arch: ["x64"] },
        ],
        icon: "assets",
        category: "Development",
      },
      nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: "TVS Viseron",
      },
      publish: { provider: "github", owner: "trinnity", repo: "viseron-system" },
    },
    devDependencies: { electron: "^33.0.0", "electron-builder": "^25.0.0" },
  };

  writeFileSync(join(electronDir, "package.json"), JSON.stringify(electronPkg, null, 2));

  const gitignore = "dist-electron/\nnode_modules/\n";
  writeFileSync(join(electronDir, ".gitignore"), gitignore);

  log("═══════════════════════════════════════════════════════════");
  log("  ELECTRON APP CREATED");
  log("═══════════════════════════════════════════════════════════");
  log(`  cd ${electronDir}`);
  log("  npm install");
  log("  npm run build:win  (Windows .exe + .msi)");
  log("  npm run build:mac  (macOS .dmg)");
  log("  npm run build:linux (Linux .AppImage + .deb)");
  log("═══════════════════════════════════════════════════════════\n");
}

async function main() {
  log("═══════════════════════════════════════════════════════════════════════════");
  log("   TVS VISERON v5.0 - BUILD SYSTEM");
  log("   Full integration: OmniRoute ~ Call System ~ OpenJarvis ~ ASNO JARVIS");
  log("═══════════════════════════════════════════════════════════════════════════\n");

  const args = argv.slice(2);
  const platformFlag = args.includes("--platform") ? args[args.indexOf("--platform") + 1] : "win";
  const buildElectron = args.includes("--electron");
  const skipTS = args.includes("--skip-ts");

  checkDeps();

  if (!skipTS) {
    buildTS();
  } else {
    log("Skipping TypeScript build (--skip-ts)");
  }

  createStandaloneEntry();
  copyAssets();

  if (platformFlag === "all") {
    for (const p of Object.keys(targets)) {
      buildExe(p);
    }
  } else {
    buildExe(platformFlag);
  }

  if (buildElectron) {
    buildElectronExe();
  }

  log("\n═══════════════════════════════════════════════════════════════════════════");
  log("   BUILD COMPLETE");
  log("═══════════════════════════════════════════════════════════════════════════");
  const exeName = `tvs-viseron-${platformFlag}${platformFlag === "win" ? ".exe" : ""}`;
  log(`   CLI executable: ${join(BUILD, "tvs-standalone", exeName)}`);
  if (buildElectron) {
    log(`   Electron app: ${join(ROOT, "electron")}`);
    log(`   Run: cd electron && npm run build:win`);
  }
  log("═══════════════════════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
