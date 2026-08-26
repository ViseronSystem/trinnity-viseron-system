export interface StrixScanConfig {
  targets: StrixTarget[];
  scanMode: "quick" | "standard" | "deep";
  instruction?: string;
  instructionFile?: string;
  maxBudgetUsd?: number;
  maxTurns?: number;
  model?: string;
  skills?: string[];
  scanName?: string;
}

export interface StrixTarget {
  value: string;
  type: "local_code" | "url" | "github" | "api_spec";
  original: string;
}

export interface StrixScanResult {
  scanId: string;
  scanName: string;
  status: "running" | "completed" | "failed" | "stopped" | "interrupted";
  target: string;
  targets: StrixTarget[];
  scanMode: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  vulnerabilities: StrixVulnerability[];
  totalVulnerabilities: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  costUsd: number;
  model: string;
  agentCount: number;
  reportPath?: string;
  runDir?: string;
  governanceApproved: boolean;
  authorizedBy?: string;
}

export interface StrixVulnerability {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  cvss?: number;
  cwe?: string;
  owasp?: string;
  description: string;
  reproduction: string;
  remediation?: string;
  file?: string;
  line?: number;
  validated: boolean;
  hasPoC: boolean;
}

export interface StrixStatus {
  installed: boolean;
  pythonAvailable: boolean;
  pythonVersion?: string;
  dockerAvailable: boolean;
  dockerVersion?: string;
  strixVersion?: string;
  configured: boolean;
  modelConfigured: boolean;
  apiKeyPresent: boolean;
  totalScans: number;
  runningScans: number;
  lastScanTime?: string;
  lastScanResult?: "clean" | "vulnerabilities_found" | "error";
}

export interface StrixAgent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "running" | "completed" | "failed";
  currentTask?: string;
  findingsCount: number;
}

export interface StrixRunHistory {
  scanId: string;
  scanName: string;
  target: string;
  status: string;
  startTime: string;
  endTime?: string;
  vulnerabilities: number;
  costUsd: number;
  model: string;
}
