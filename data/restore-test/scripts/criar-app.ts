import "dotenv/config";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { execSync } from "child_process";
import { AppScaffoldStore } from "../src/web/apps/store";
import { createApp } from "../src/web/apps/generator";

// TVS — APP FACTORY (funções reais para criar apps)
// Gera uma app com IA, materializa um projeto Expo completo em mobile/apps/<slug>/,
// roda expo prebuild + gradle assembleRelease e entrega um APK instalável em
// data/apps/<slug>.apk (descarregável via GET /api/apps/:slug/apk).
//
// Uso:
//   npm run app:create -- "Nome da App" "Descrição da app"
//   npm run app:build -- <slug>          (reconstruir APK de uma app já gerada)
//   npm run app:create -- --icon <hex> --color <hex> "Nome" "Descrição"   (ícone/cor)

const ROOT = path.resolve(process.cwd());
export const MOBILE = path.join(ROOT, "mobile");
export const APPS_ROOT = path.join(MOBILE, "apps");
export const DATA_APPS = path.join(ROOT, "data", "apps");
export const MAIN_NODE_MODULES = path.join(MOBILE, "node_modules");

// ---------- Ícone PNG gerado em código puro (sem dependências) ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function shade(rgb: [number, number, number], f: number): [number, number, number] {
  return [Math.min(255, Math.round(rgb[0] * f)), Math.min(255, Math.round(rgb[1] * f)), Math.min(255, Math.round(rgb[2] * f))];
}

export function makePng(size: number, rgb: [number, number, number], accent: [number, number, number]): Buffer {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let off = 0;
  for (let y = 0; y < size; y++) {
    raw[off++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const diag = x / size + y / size; // gradiente diagonal
      const r = Math.round(rgb[0] * (1 - diag * 0.55) + accent[0] * diag * 0.55);
      const g = Math.round(rgb[1] * (1 - diag * 0.55) + accent[1] * diag * 0.55);
      const b = Math.round(rgb[2] * (1 - diag * 0.55) + accent[2] * diag * 0.55);
      raw[off++] = r;
      raw[off++] = g;
      raw[off++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}

// ---------- Materialização do projeto Expo ----------
interface BuildConfig {
  accent: string;
  bg: string;
}

function appJson(slug: string, name: string, bg: string): string {
  const pkg = `com.tvs.app.${slug.replace(/[^a-zA-Z0-9]/g, "")}`;
  return JSON.stringify(
    {
      expo: {
        name,
        slug,
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "dark",
        splash: { backgroundColor: bg },
        assetBundlePatterns: ["**/*"],
        ios: { supportsTablet: true, bundleIdentifier: pkg },
        android: {
          adaptiveIcon: { backgroundColor: bg },
          package: pkg,
          versionCode: 1,
          permissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
        },
        plugins: [
          [
            "expo-build-properties",
            {
              android: {
                compileSdkVersion: 34,
                targetSdkVersion: 34,
                buildToolsVersion: "34.0.0",
                kotlinVersion: "1.9.25",
                usesCleartextTraffic: true,
                newArchEnabled: false,
              },
            },
          ],
        ],
      },
    },
    null,
    2
  );
}

function pkgJson(slug: string): string {
  return JSON.stringify(
    {
      name: slug,
      version: "1.0.0",
      main: "index.ts",
      scripts: {
        start: "expo start",
        android: "expo run:android",
        "build:apk": "expo prebuild --platform android && cd android && gradlew.bat assembleRelease",
      },
      dependencies: {
        expo: "~52.0.0",
        "expo-build-properties": "~0.13.0",
        "expo-status-bar": "~2.0.0",
        react: "18.3.1",
        "react-native": "0.76.9",
        "react-native-safe-area-context": "4.12.0",
        "react-native-screens": "~4.4.0",
      },
      devDependencies: { "@babel/core": "^7.25.0", "@types/react": "~18.3.0", typescript: "^5.3.0" },
      private: true,
    },
    null,
    2
  );
}

function tsconfigJson(): string {
  return JSON.stringify({ extends: "expo/tsconfig.base", compilerOptions: { strict: true } }, null, 2);
}

function babelConfig(): string {
  return `module.exports = function (api) {
  api.cache(true);
  return { presets: ["babel-preset-expo"] };
};
`;
}

export function materialize(slug: string, files: Record<string, string>, cfg: BuildConfig): string {
  const dir = path.join(APPS_ROOT, slug);
  fs.mkdirSync(path.join(dir, "assets"), { recursive: true });

  // Ficheiros gerados (App.tsx, index.ts) vêm do scaffold da IA.
  for (const [rel, content] of Object.entries(files)) {
    if (rel === "app.json" || rel === "package.json") continue; // substituídos abaixo
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content, "utf8");
  }

  fs.writeFileSync(path.join(dir, "app.json"), appJson(slug, files["app.json"] ? JSON.parse(files["app.json"]).expo.name : slug, cfg.bg), "utf8");
  fs.writeFileSync(path.join(dir, "package.json"), pkgJson(slug), "utf8");
  fs.writeFileSync(path.join(dir, "tsconfig.json"), tsconfigJson(), "utf8");
  fs.writeFileSync(path.join(dir, "babel.config.js"), babelConfig(), "utf8");

  // Ícones reais gerados por código.
  const rgb = hexToRgb(cfg.bg);
  const acc = hexToRgb(cfg.accent);
  fs.writeFileSync(path.join(dir, "assets", "icon.png"), makePng(512, rgb, acc));
  fs.writeFileSync(path.join(dir, "assets", "adaptive-icon.png"), makePng(1024, shade(rgb, 0.92), acc));

  // node_modules partilhado (junction) → build rápido reutilizando a cache do mobile.
  const nm = path.join(dir, "node_modules");
  if (!fs.existsSync(nm)) {
    fs.symlinkSync(MAIN_NODE_MODULES, nm, "junction");
  }

  return dir;
}

function run(cmd: string, cwd: string): void {
  console.log(`\n[APP FACTORY] $ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env, timeout: 30 * 60 * 1000 });
}

// ---------- Build do APK ----------
export function buildApk(slug: string): string {
  const appDir = path.join(APPS_ROOT, slug);
  const androidDir = path.join(appDir, "android");
  const apk = path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
  const dest = path.join(DATA_APPS, `${slug}.apk`);
  fs.mkdirSync(DATA_APPS, { recursive: true });

  if (!fs.existsSync(androidDir)) {
    console.log(`\n[APP FACTORY] Gerando projeto nativo Android (expo prebuild)...`);
    run(`npx expo prebuild --platform android --no-install`, appDir);
  }

  console.log(`\n[APP FACTORY] Compilando APK release (gradle assembleRelease)...`);
  run(path.join(androidDir, "gradlew.bat") + " --no-daemon assembleRelease", androidDir);

  if (!fs.existsSync(apk)) throw new Error(`APK não encontrado em ${apk}`);
  fs.copyFileSync(apk, dest);
  console.log(`\n[APP FACTORY] ✔ APK real criado: ${dest} (${Math.round(fs.statSync(dest).size / 1048576 * 10) / 10} MB)`);
  return dest;
}

// ---------- Main ----------
async function main() {
  const args = process.argv.slice(2);
  let rebuildOnly = false;
  let slugOnly = "";
  let name = "";
  let description = "";
  let accent = "";
  let bg = "";

  if (args[0] === "--build") {
    rebuildOnly = true;
    slugOnly = args[1] || "";
  } else {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--icon") accent = args[++i] || "";
      else if (args[i] === "--color") bg = args[++i] || "";
      else if (!name) name = args[i];
      else if (!description) description = args[i];
    }
  }

  const store = new AppScaffoldStore(path.join(ROOT, "data"));

  if (!rebuildOnly) {
    if (!name) name = "Minha App";
    if (!description) description = "App móvel gerada automaticamente pelo Trinnity Viseron System com IA local.";

    console.log(`\n[APP FACTORY] Gerando app "${name}"...`);
    const app = await createApp(store, name, description, "es");
    console.log(`[APP FACTORY] Conteúdo gerado (slug=${app.meta.slug}, tagline="${app.meta.tagline}")`);

    const finalSlug = app.meta.slug;
    const accentFromMeta = app.meta.accent || accent || "#22d3ee";
    const bgColor = bg || "#05060f";
    const dir = materialize(finalSlug, app.files, { accent: accentFromMeta, bg: bgColor });
    console.log(`[APP FACTORY] Projeto Expo materializado em ${dir}`);

    buildApk(finalSlug);
    return;
  }

  if (!slugOnly) {
    console.error("Uso: npm run app:build -- <slug>");
    process.exit(1);
  }
  const meta = store.get(slug);
  if (!meta) {
    console.error(`✖ App "${slug}" não existe. Gera primeiro com npm run app:create -- "Nome" "Descrição"`);
    process.exit(1);
  }
  console.log(`[APP FACTORY] Reconstruindo APK de "${meta.name}" (${slug})...`);
  buildApk(slug);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(`[APP FACTORY] ✖ ${e?.message || e}`);
    process.exit(1);
  });
}
