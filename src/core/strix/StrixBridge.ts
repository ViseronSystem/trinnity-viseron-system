import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { EventEmitter } from "events";
import {
  StrixScanConfig,
  StrixScanResult,
  StrixStatus,
  StrixVulnerability,
  StrixRunHistory,
  StrixTarget,
} from "./types";

const STRIX_DIR = path.resolve(__dirname, "../../../strix");
const DATA_DIR = path.resolve(__dirname, "../../../data/strix");
const RUNS_DIR = path.resolve(__dirname, "../../../strix_runs");
const HISTORY_FILE = path.join(DATA_DIR, "scan-history.json");
const STATUS_FILE = path.join(DATA_DIR, "last-status.json");

export class StrixBridge extends EventEmitter {
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private static instance: StrixBridge;

  static getInstance(): StrixBridge {
    if (!StrixBridge.instance) {
      StrixBridge.instance = new StrixBridge();
    }
    return StrixBridge.instance;
  }

  private constructor() {
    super();
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [DATA_DIR, RUNS_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async getStatus(): Promise<StrixStatus> {
    const status: StrixStatus = {
      installed: false,
      pythonAvailable: false,
      dockerAvailable: false,
      configured: false,
      modelConfigured: false,
      apiKeyPresent: false,
      totalScans: 0,
      runningScans: this.runningProcesses.size,
    };

    try {
      const pythonCheck = await this.execCommand("python", ["--version"]);
      status.pythonAvailable = true;
      status.pythonVersion = pythonCheck.trim().replace("Python ", "");
    } catch {
      try {
        const python3Check = await this.execCommand("python3", ["--version"]);
        status.pythonAvailable = true;
        status.pythonVersion = python3Check.trim().replace("Python ", "");
      } catch {
        status.pythonAvailable = false;
      }
    }

    try {
      const dockerCheck = await this.execCommand("docker", ["--version"]);
      status.dockerAvailable = true;
      status.dockerVersion = dockerCheck.trim();
    } catch {
      status.dockerAvailable = false;
    }

    const strixSpecPath = path.join(STRIX_DIR, "pyproject.toml");
    status.installed = fs.existsSync(strixSpecPath);

    if (status.installed) {
      try {
        const versionMatch = fs
          .readFileSync(strixSpecPath, "utf-8")
          .match(/version\s*=\s*"([^"]+)"/);
        status.strixVersion = versionMatch?.[1] || "unknown";
      } catch {
        status.strixVersion = "unknown";
      }
    }

    status.modelConfigured = !!(
      process.env.STRIX_LLM || process.env.OPENAI_API_KEY
    );
    status.apiKeyPresent = !!(
      process.env.LLM_API_KEY || process.env.OPENAI_API_KEY
    );
    status.configured = status.modelConfigured && status.apiKeyPresent;

    const history = this.loadHistory();
    status.totalScans = history.length;

    if (history.length > 0) {
      const last = history[history.length - 1];
      status.lastScanTime = last.startTime;
      status.lastScanResult =
        last.vulnerabilities > 0 ? "vulnerabilities_found" : "clean";
    }

    return status;
  }

  async runScan(config: StrixScanConfig): Promise<StrixScanResult> {
    const scanId = `scan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const scanName = config.scanName || scanId;

    const targets = config.targets.map((t) => t.value);
    const args = ["-n", "--scan-mode", config.scanMode];

    targets.forEach((t) => {
      args.push("-t", t);
    });

    if (config.instruction) {
      args.push("--instruction", config.instruction);
    }

    if (config.maxBudgetUsd) {
      args.push("--max-budget", String(config.maxBudgetUsd));
    }

    if (config.maxTurns) {
      args.push("--max-turns", String(config.maxTurns));
    }

    const result: StrixScanResult = {
      scanId,
      scanName,
      status: "running",
      target: targets[0] || "",
      targets: config.targets,
      scanMode: config.scanMode,
      startTime: new Date().toISOString(),
      vulnerabilities: [],
      totalVulnerabilities: 0,
      severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      costUsd: 0,
      model: process.env.STRIX_LLM || "unknown",
      agentCount: 0,
      governanceApproved: false,
    };

    this.emit("scan:started", result);

    try {
      const pythonCmd = await this.findPython();
      const proc = spawn(pythonCmd, ["-m", "strix.interface.main", ...args], {
        cwd: STRIX_DIR,
        env: {
          ...process.env,
          STRIX_LLM: process.env.STRIX_LLM || "openai/gpt-5.4",
          LLM_API_KEY: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.runningProcesses.set(scanId, proc);

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
        this.emit("scan:output", { scanId, chunk });
      });

      proc.stderr?.on("data", (data: Buffer) => {
        const chunk = data.toString();
        stderr += chunk;
        this.emit("scan:error", { scanId, chunk });
      });

      return new Promise<StrixScanResult>((resolve, reject) => {
        proc.on("close", (code) => {
          this.runningProcesses.delete(scanId);

          result.endTime = new Date().toISOString();
          result.duration =
            new Date(result.endTime).getTime() -
            new Date(result.startTime).getTime();

          if (code === 0) {
            result.status = "completed";
          } else if (code === 2) {
            result.status = "completed";
            result.vulnerabilities = this.parseVulnerabilities(stdout);
          } else {
            result.status = code === null ? "interrupted" : "failed";
          }

          result.totalVulnerabilities = result.vulnerabilities.length;
          result.severityBreakdown = this.countSeverities(result.vulnerabilities);

          this.saveScanResult(result);
          this.appendToHistory(result);
          this.emit("scan:completed", result);
          resolve(result);
        });

        proc.on("error", (err) => {
          this.runningProcesses.delete(scanId);
          result.status = "failed";
          result.endTime = new Date().toISOString();
          this.saveScanResult(result);
          this.emit("scan:failed", { scanId, error: err.message });
          reject(err);
        });
      });
    } catch (err: any) {
      result.status = "failed";
      result.endTime = new Date().toISOString();
      this.emit("scan:failed", { scanId, error: err.message });
      throw err;
    }
  }

  async cancelScan(scanId: string): Promise<boolean> {
    const proc = this.runningProcesses.get(scanId);
    if (proc) {
      proc.kill("SIGTERM");
      this.runningProcesses.delete(scanId);
      this.emit("scan:cancelled", { scanId });
      return true;
    }
    return false;
  }

  getRunningScans(): string[] {
    return Array.from(this.runningProcesses.keys());
  }

  getScanResult(scanId: string): StrixScanResult | null {
    const filePath = path.join(DATA_DIR, `${scanId}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    return null;
  }

  listRunDirs(): StrixRunHistory[] {
    const history = this.loadHistory();
    return history;
  }

  getVulnerabilityDetail(
    scanId: string,
    vulnId: string
  ): StrixVulnerability | null {
    const result = this.getScanResult(scanId);
    if (!result) return null;
    return result.vulnerabilities.find((v) => v.id === vulnId) || null;
  }

  private parseVulnerabilities(output: string): StrixVulnerability[] {
    const vulns: StrixVulnerability[] = [];
    const vulnRegex =
      /\[(?:CRITICAL|HIGH|MEDIUM|LOW|INFO)\]\s*(.*?)(?:\n|$)/gi;
    let match;
    let idx = 0;

    while ((match = vulnRegex.exec(output)) !== null) {
      idx++;
      const severityMatch = match[0].match(
        /\[(CRITICAL|HIGH|MEDIUM|LOW|INFO)\]/
      );
      vulns.push({
        id: `vuln-${idx}`,
        title: match[1].trim(),
        severity: (severityMatch?.[1]?.toLowerCase() as any) || "info",
        description: match[1].trim(),
        reproduction: "",
        validated: false,
        hasPoC: false,
      });
    }

    return vulns;
  }

  private countSeverities(vulns: StrixVulnerability[]) {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    vulns.forEach((v) => {
      breakdown[v.severity] = (breakdown[v.severity] || 0) + 1;
    });
    return breakdown;
  }

  private saveScanResult(result: StrixScanResult): void {
    const filePath = path.join(DATA_DIR, `${result.scanId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
  }

  private appendToHistory(result: StrixScanResult): void {
    const history = this.loadHistory();
    history.push({
      scanId: result.scanId,
      scanName: result.scanName,
      target: result.target,
      status: result.status,
      startTime: result.startTime,
      endTime: result.endTime,
      vulnerabilities: result.totalVulnerabilities,
      costUsd: result.costUsd,
      model: result.model,
    });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  }

  private loadHistory(): StrixRunHistory[] {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    }
    return [];
  }

  private async findPython(): Promise<string> {
    try {
      await this.execCommand("python", ["--version"]);
      return "python";
    } catch {
      try {
        await this.execCommand("python3", ["--version"]);
        return "python3";
      } catch {
        throw new Error(
          "Python not found. Install Python 3.12+ to use Strix."
        );
      }
    }
  }

  private execCommand(
    cmd: string,
    args: string[]
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (d: Buffer) => (stdout += d.toString()));
      proc.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));

      proc.on("close", (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(stderr || `Command failed with code ${code}`));
      });

      proc.on("error", reject);
    });
  }
}

export const strixBridge = StrixBridge.getInstance();
