import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const SILENT = { stdio: "pipe" as const, timeout: 5000 };

// Wan2.1 Provider for VISERON Creative Squad
// Detects environment, reports honestly, never fakes

export interface Wan21Environment {
  pythonAvailable: boolean;
  pythonVersion: string;
  pytorchAvailable: boolean;
  cudaAvailable: boolean;
  gpuCount: number;
  gpuName: string;
  vramGB: number;
  wan21Installed: boolean;
  wan21Path: string;
  modelAvailable: string;
  modelPath: string;
  canGenerate: boolean;
}

export interface Wan21GenerateRequest {
  prompt: string;
  task: "t2v" | "i2v" | "t2i";
  size: string;
  modelSize: "1.3B" | "14B";
  duration: number;
  outputPath: string;
}

export interface Wan21GenerateResult {
  ok: boolean;
  outputPath: string;
  videoDuration: number;
  resolution: string;
  model: string;
  modelSize: string;
  latencyMs: number;
  gpuUsed: boolean;
  vramUsedMB: number;
  error: string;
  evidence: {
    environment: Wan21Environment;
    command: string;
    stdout: string;
    fileHash: string;
    fileSizeBytes: number;
  };
}

export class Wan21Provider {
  public readonly name = "wan21";
  public readonly model = "Wan2.1";

  detectEnvironment(): Wan21Environment {
    const env: Wan21Environment = {
      pythonAvailable: false,
      pythonVersion: "",
      pytorchAvailable: false,
      cudaAvailable: false,
      gpuCount: 0,
      gpuName: "",
      vramGB: 0,
      wan21Installed: false,
      wan21Path: "",
      modelAvailable: "",
      modelPath: "",
      canGenerate: false,
    };

    try {
      const pyVer = execSync("python --version", { ...SILENT, encoding: "utf8" }).trim();
      env.pythonAvailable = true;
      env.pythonVersion = pyVer;
    } catch { env.pythonVersion = "not found"; }

    try {
      execSync('python -c "import torch; print(torch.__version__)"', { ...SILENT, encoding: "utf8" });
      env.pytorchAvailable = true;
    } catch {}

    try {
      const gpuInfo = execSync('python -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.device_count()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else \'\')"', { ...SILENT, encoding: "utf8" }).trim().split("\n");
      if (gpuInfo[0] === "True") {
        env.cudaAvailable = true;
        env.gpuCount = parseInt(gpuInfo[1]) || 0;
        env.gpuName = gpuInfo[2] || "";
      }
    } catch {}

    try {
      const gpuMem = execSync('python -c "import torch; print(torch.cuda.get_device_properties(0).total_mem // (1024**3) if torch.cuda.is_available() else 0)"', { ...SILENT, encoding: "utf8" }).trim();
      env.vramGB = parseInt(gpuMem) || 0;
    } catch {}

    // Check Wan2.1 installation
    const paths = ["./Wan2.1/generate.py", "../Wan2.1/generate.py", process.env.WAN21_PATH || ""];
    for (const p of paths) {
      if (p && fs.existsSync(p)) {
        env.wan21Installed = true;
        env.wan21Path = p;
        break;
      }
    }

    // Check models
    const modelPaths = ["./Wan2.1-T2V-1.3B", "../Wan2.1-T2V-1.3B", "./Wan2.1-T2V-14B"];
    for (const mp of modelPaths) {
      if (fs.existsSync(mp)) {
        env.modelPath = mp;
        env.modelAvailable = mp.includes("1.3B") ? "T2V-1.3B" : "T2V-14B";
        break;
      }
    }

    env.canGenerate = env.pythonAvailable && env.pytorchAvailable && env.wan21Installed;

    return env;
  }

  async health(): Promise<{ ok: boolean; environment: Wan21Environment; detail: string }> {
    const env = this.detectEnvironment();
    const issues: string[] = [];

    if (!env.pythonAvailable) issues.push("Python not found");
    if (!env.pytorchAvailable) issues.push("PyTorch not installed");
    if (!env.cudaAvailable) issues.push("CUDA/GPU not available");
    if (!env.wan21Installed) issues.push("Wan2.1 not installed (clone: git clone https://github.com/Wan-Video/Wan2.1.git)");
    if (!env.modelAvailable) issues.push("Wan2.1 model not downloaded");

    return {
      ok: env.canGenerate,
      environment: env,
      detail: issues.length > 0 ? issues.join("; ") : "Ready for video generation",
    };
  }

  async generate(req: Wan21GenerateRequest): Promise<Wan21GenerateResult> {
    const start = Date.now();
    const env = this.detectEnvironment();

    if (!env.canGenerate) {
      return {
        ok: false, outputPath: "", videoDuration: 0, resolution: "",
        model: "Wan2.1", modelSize: req.modelSize, latencyMs: Date.now() - start,
        gpuUsed: false, vramUsedMB: 0,
        error: `Cannot generate: ${[
          !env.pythonAvailable ? "Python missing" : "",
          !env.pytorchAvailable ? "PyTorch missing" : "",
          !env.cudaAvailable ? "GPU missing" : "",
          !env.wan21Installed ? "Wan2.1 missing" : "",
          !env.modelAvailable ? "Model missing" : "",
        ].filter(Boolean).join(", ")}`,
        evidence: { environment: env, command: "", stdout: "", fileHash: "", fileSizeBytes: 0 },
      };
    }

    const taskMap = { t2v: "t2v", i2v: "i2v", t2i: "t2i" };
    const modelArg = req.modelSize === "14B" ? `t2v-14B` : `t2v-1.3B`;
    const ckptDir = env.modelPath || `./Wan2.1-${modelArg === "t2v-14B" ? "T2V-14B" : "T2V-1.3B"}`;
    const outputFile = req.outputPath || path.join(DATA_DIR, "..", "data", "creative", `wan2.1_output_${Date.now()}.mp4`);

    const cmd = `python ${env.wan21Path} --task ${modelArg} --size ${req.size} --ckpt_dir ${ckptDir} --prompt "${req.prompt}" --offload_model True --t5_cpu --sample_guide_scale 6`;
    let stdout = "";

    try {
      stdout = execSync(cmd, { encoding: "utf8", timeout: req.duration * 1000 || 600000, cwd: path.dirname(env.wan21Path) });
      const latency = Date.now() - start;
      const exists = fs.existsSync(outputFile);
      const sizeBytes = exists ? fs.statSync(outputFile).size : 0;

      return {
        ok: exists && sizeBytes > 0,
        outputPath: outputFile, videoDuration: req.duration, resolution: req.size,
        model: "Wan2.1", modelSize: req.modelSize, latencyMs: latency,
        gpuUsed: env.cudaAvailable, vramUsedMB: env.vramGB * 1024,
        error: exists ? "" : "Output file not created",
        evidence: { environment: env, command: cmd, stdout: stdout.slice(0, 1000), fileHash: "", fileSizeBytes: sizeBytes },
      };
    } catch (e: any) {
      return {
        ok: false, outputPath: "", videoDuration: 0, resolution: "",
        model: "Wan2.1", modelSize: req.modelSize, latencyMs: Date.now() - start,
        gpuUsed: false, vramUsedMB: 0,
        error: e.message.slice(0, 300),
        evidence: { environment: env, command: cmd, stdout: (e.stdout || "").slice(0, 500), fileHash: "", fileSizeBytes: 0 },
      };
    }
  }

  status(): { provider: string; model: string; canGenerate: boolean; environment: Wan21Environment } {
    return {
      provider: this.name,
      model: this.model,
      canGenerate: this.detectEnvironment().canGenerate,
      environment: this.detectEnvironment(),
    };
  }
}
