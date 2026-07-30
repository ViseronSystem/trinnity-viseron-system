
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

  mainWindow.loadURL(`http://localhost:${TVS_PORT}`);
  mainWindow.setTitle("TVS Viseron - Multi Agent AI Operating System");

  mainWindow.on("closed", () => { mainWindow = null; });
}

function createTray() {
  try {
    tray = new Tray(nativeImage.createEmpty());
    const contextMenu = Menu.buildFromTemplate([
      { label: "Abrir TVS", click: () => mainWindow?.show() },
      { label: "Dashboard", click: () => mainWindow?.loadURL(`http://localhost:${TVS_PORT}`) },
      { label: "OmniRoute", click: () => mainWindow?.loadURL(`http://localhost:${OMNIROUTE_PORT}`) },
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
