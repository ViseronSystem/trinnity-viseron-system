import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const TOOL_DIR = path.resolve(__dirname, "..", "tools", "CUDACyclone");
const BINARY = path.join(TOOL_DIR, "CUDACyclone");

function shell(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 600000, encoding: "utf-8", shell: "powershell" }).trim();
  } catch (e: any) {
    return `[ERRO] ${e.message}`;
  }
}

function env() {
  const hasNvidia = shell("nvidia-smi --query-gpu=name --format=csv,noheader 2>&1");
  const hasNvcc = shell("nvcc --version 2>&1");
  const isLinux = process.platform !== "win32";
  return {
    gpu: hasNvidia.includes("NVIDIA") ? hasNvidia.split("\n")[0].trim() : null,
    nvcc: hasNvcc.includes("release") ? hasNvcc.match(/release (\d+)/)?.[1] || "?" : null,
    binary: fs.existsSync(BINARY),
    linux: isLinux || (shell("wsl --status 2>&1").toLowerCase().includes("default version")),
  };
}

function printStatus(): void {
  const e = env();
  console.log("\n============= TVS · CUDACyclone =============");
  console.log(`  Origem      : tools/CUDACyclone (GPL — VanitySearch/Bitcrack, vendido com créditos)`);
  console.log(`  GPU NVIDIA  : ${e.gpu ? e.gpu : "NÃO DETECTADA"}`);
  console.log(`  CUDA toolkit: ${e.nvcc ? `v${e.nvcc}` : "NÃO DETECTADO"}`);
  console.log(`  Binário     : ${e.binary ? "compilado ✓" : "não compilado (corre: npm run cudacyclone -- build)"}`);
  console.log(`  Plataforma  : ${e.linux ? "Linux/WSL2 ok" : "Windows puro — precisa GPU + CUDA (Linux/WSL2)"}`);
  console.log("==============================================\n");
}

function build(): void {
  const e = env();
  if (!e.gpu || !e.nvcc) {
    console.log("\n[TVS] Não é possível compilar: esta máquina não tem GPU NVIDIA + CUDA toolkit.");
    console.log("      Compila numa máquina Linux/WSL2 com GPU:  make  (dentro de tools/CUDACyclone)");
    console.log("      Ou arranja GPU: Vast.ai / RunPod / GPU própria.\n");
    return;
  }
  console.log("[TVS] Compilando tools/CUDACyclone (make)...");
  const out = shell(`cd "${TOOL_DIR}" && make 2>&1`);
  console.log(out.slice(0, 800));
  console.log(fs.existsSync(BINARY) ? "\n[TVS] Binário criado ✓\n" : "\n[TVS] Falha na compilação (revisar logs).\n");
}

function run(): void {
  const e = env();
  const range = process.env.CUDA_RANGE || "";
  const address = process.env.CUDA_ADDRESS || process.env.CUDA_HASH160 || "";
  const grid = process.env.CUDA_GRID || "512,256";
  const slices = process.env.CUDA_SLICES || "";

  if (!range || !address) {
    console.log("\n[TVS] Uso:  npm run cudacyclone -- run --range=INICIO:FIM --address=ENDEREÇO [--grid=512,256] [--slices=N]");
    console.log("      Ex:  npm run cudacyclone -- run --range=2000000000:3FFFFFFFFF --address=1HBtApAFA9B2YZw3G2YKSMCtb3dVnjuNe2\n");
    return;
  }
  if (!e.binary) {
    console.log("\n[TVS] Binário não compilado. Corre primeiro:  npm run cudacyclone -- build\n");
    return;
  }
  const target = address.startsWith("1") ? `--address ${address}` : `--target-hash160 ${address}`;
  const slicesArg = slices ? ` --slices ${slices}` : "";
  const cmd = `${BINARY} --range ${range} ${target} --grid ${grid}${slicesArg} 2>&1`;
  console.log(`[TVS] ${cmd}`);
  console.log(shell(cmd).slice(0, 2000));
}

function benchmark(): void {
  console.log("\n============= BENCHMARK (comunidade) =============");
  console.log("  RTX 4060          : 1238 Mkeys/s  (--grid 512,512)");
  console.log("  RTX 4090          : 6214 Mkeys/s  (--grid 128,1024)");
  console.log("  RTX 5090          : 8408 Mkeys/s  (--grid 128,256)");
  console.log("  RTX 3070 mobile   : 1150 Mkeys/s  (--grid 256,256)");
  console.log("  Tune RTX 4090     : --grid 128,128 --slices 16");
  console.log("====================================================\n");
}

const arg = process.argv.slice(2)[0] || "status";
switch (arg) {
  case "status": printStatus(); break;
  case "build": build(); break;
  case "run": run(); break;
  case "benchmark": benchmark(); break;
  default: printStatus();
}
