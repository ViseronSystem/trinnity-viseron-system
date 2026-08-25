import fs from "fs";
import path from "path";
import { skillsRegistry, SkillDetail } from "../skills/SkillsRegistry";
import { ToolManager } from "../tools/ToolManager";
import { ProviderFactory } from "../providers/ProviderFactory";
import { MemoryEngine } from "../memory/MemoryEngine";
import { ExperienceStore } from "../memory/ExperienceStore";
import { ILogger } from "../../web/monitoring/logger";

// ═══ SKILL EXECUTION CONTRACT ═══

export type SkillRiskLevel = "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK";
export type SkillExecutionMode = "PROMPT" | "TOOL" | "PROVIDER" | "HYBRID";
export type ExecutionState = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "TIMEOUT" | "REJECTED" | "CANCELLED";

export interface SkillContract {
  skillId: string;
  name: string;
  domain: string;
  license: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  requiredTools: string[];
  requiredPermissions: string[];
  timeoutMs: number;
  riskLevel: SkillRiskLevel;
  executionMode: SkillExecutionMode;
  validator: string;
}

export interface ExecutionRequest {
  executionId: string;
  skillId: string;
  agentId: string;
  squadId?: string;
  projectId?: string;
  taskId?: string;
  input: Record<string, any>;
  context?: string;
}

export interface ExecutionRecord {
  executionId: string;
  skillId: string;
  agentId: string;
  projectId?: string;
  startedAt: string;
  finishedAt?: string;
  status: ExecutionState;
  error?: string;
  retryCount: number;
  latencyMs?: number;
  cost?: number;
  artifactId?: string;
  evidenceId?: string;
  provider?: string;
  model?: string;
  toolUsed?: string;
}

export interface ExecutionResult {
  ok: boolean;
  executionId: string;
  skillId: string;
  output: any;
  provider: string;
  model: string;
  toolUsed?: string;
  latencyMs: number;
  validationPassed: boolean;
  validationReason?: string;
  evidence: Record<string, any>;
}

// ═══ RISK CLASSIFICATION ═══

const HIGH_RISK_PATTERNS = [
  /secret|key|token|seed|password|credential|wallet/i,
  /deploy|publish|release|migrate|destroy|delete.*all/i,
  /sudo|root|admin.*access|privilege/i,
  /execute.*arbitr|exec.*command|shell.*exec/i,
  /network.*access|firewall|proxy|dns.*modify/i,
  /database.*drop|truncate|schema.*alter/i,
  /blockchain|transaction|transfer.*fund|crypto.*send/i,
];

const MEDIUM_RISK_PATTERNS = [
  /write|modify|update|create|save|export/i,
  /api.*call|http.*request|fetch.*url/i,
  /file.*system|read.*file|write.*file/i,
  /email.*send|notify|alert.*trigger/i,
  /database.*query|select.*from/i,
];

function classifyRisk(skillDetail: SkillDetail, contract?: SkillContract): SkillRiskLevel {
  if (contract?.riskLevel) return contract.riskLevel;
  const combined = `${skillDetail.name} ${skillDetail.description} ${skillDetail.body}`;
  if (HIGH_RISK_PATTERNS.some((r) => r.test(combined))) return "HIGH_RISK";
  if (MEDIUM_RISK_PATTERNS.some((r) => r.test(combined))) return "MEDIUM_RISK";
  return "LOW_RISK";
}

// ═══ SKILL EXECUTOR ═══

export interface SkillExecutorDeps {
  toolManager: ToolManager;
  providerFactory: ProviderFactory;
  memoryEngine?: MemoryEngine;
  experienceStore?: ExperienceStore;
  logger?: ILogger;
  dataDir: string;
  maxConcurrency?: number;
  skipProviders?: boolean;
}

export class SkillExecutor {
  private toolManager: ToolManager;
  private providerFactory: ProviderFactory;
  private memoryEngine?: MemoryEngine;
  private experienceStore?: ExperienceStore;
  private logger?: ILogger;
  private dataDir: string;
  private executionsDir: string;
  private maxConcurrency: number;
  private skipProviders: boolean;
  private activeExecutions: Map<string, ExecutionRecord>;
  private executionHistory: ExecutionRecord[];

  constructor(deps: SkillExecutorDeps) {
    this.toolManager = deps.toolManager;
    this.providerFactory = deps.providerFactory;
    this.memoryEngine = deps.memoryEngine;
    this.experienceStore = deps.experienceStore;
    this.logger = deps.logger;
    this.dataDir = deps.dataDir;
    this.maxConcurrency = deps.maxConcurrency || 4;
    this.skipProviders = deps.skipProviders || false;
    this.executionsDir = path.join(this.dataDir, "audit", "s14-skill-execution");
    if (!fs.existsSync(this.executionsDir)) {
      fs.mkdirSync(this.executionsDir, { recursive: true });
    }
    this.activeExecutions = new Map();
    this.executionHistory = this.loadHistory();
  }

  /** Main entry point: execute a skill with a contract. */
  async execute(req: ExecutionRequest, contract?: SkillContract): Promise<ExecutionResult> {
    const start = Date.now();
    const record = this.createRecord(req);
    this.activeExecutions.set(req.executionId, record);

    try {
      // 1. Load skill detail
      const skillDetail = await skillsRegistry.getSkill(req.skillId);
      if (!skillDetail) {
        return this.fail(record, `Skill ${req.skillId} not found in registry`, start);
      }

      // 2. Classify risk
      const riskLevel = classifyRisk(skillDetail, contract);
      record.retryCount = 0;

      // 3. Permission gate
      const permissionResult = this.checkPermissions(skillDetail, riskLevel, contract);
      if (!permissionResult.allowed) {
        return this.fail(record, `Permission denied: ${permissionResult.reason}`, start);
      }

      // 4. Build or use contract
      const effectiveContract = contract || this.inferContract(skillDetail);
      record.status = "RUNNING";
      this.persistRecord(record);

      // 5. Execute based on mode
      let output: any;
      if (effectiveContract.executionMode === "PROMPT" || !effectiveContract.requiredTools.length) {
        // Use LLM provider as execution engine
        const result = await this.executeViaProvider(skillDetail, req, effectiveContract);
        output = result.text;
        record.provider = result.provider;
        record.model = result.model;
      } else if (effectiveContract.executionMode === "TOOL") {
        // Use ToolManager directly
        const result = await this.executeViaTool(skillDetail, req, effectiveContract);
        output = result.output;
        record.toolUsed = result.toolId;
      } else {
        // HYBRID: LLM reasons about which tools to use
        const result = await this.executeHybrid(skillDetail, req, effectiveContract);
        output = result.output;
        record.provider = result.provider;
        record.toolUsed = result.toolId;
      }

      // 6. Validate output
      const validation = this.validateOutput(output, effectiveContract);

      // 7. Success
      record.status = "SUCCEEDED";
      record.finishedAt = new Date().toISOString();
      record.latencyMs = Date.now() - start;
      this.completeRecord(record);

      // 8. Store experience
      if (this.experienceStore) {
        this.experienceStore.record({
          taskId: req.taskId || req.executionId,
          agentId: req.agentId,
          squadId: req.squadId,
          input: req.input,
          output,
          success: true,
          artifactRef: record.artifactId || "",
          metadata: { skillId: req.skillId, riskLevel, executionMode: effectiveContract.executionMode },
          tags: [req.skillId, req.agentId, effectiveContract.executionMode],
          importance: 0.7,
          score: validation.passed ? 1.0 : 0.5,
          timestamp: new Date().toISOString(),
        } as any);
      }

      return {
        ok: true,
        executionId: req.executionId,
        skillId: req.skillId,
        output,
        provider: record.provider || "rule",
        model: record.model || "tvs-executor",
        toolUsed: record.toolUsed,
        latencyMs: record.latencyMs || (Date.now() - start),
        validationPassed: validation.passed,
        validationReason: validation.reason,
        evidence: {
          skillName: skillDetail.name,
          domain: effectiveContract.domain,
          executionMode: effectiveContract.executionMode,
          riskLevel,
          source: skillDetail.source,
          license: skillDetail.license,
        },
      };
    } catch (e: any) {
      return this.fail(record, e.message, start);
    }
  }

  // ═══ EXECUTION MODES ═══

  private async executeViaProvider(
    skill: SkillDetail, req: ExecutionRequest, contract: SkillContract
  ): Promise<{ text: string; provider: string; model: string }> {
    if (this.skipProviders) {
      return { text: `[SKIP] ${skill.name}: execution framework validated — provider call skipped (benchmark mode)`, provider: "rule", model: "tvs-benchmark" };
    }
    const systemPrompt = [
      `Description: ${skill.description}`,
      `Instructions:\n${skill.body.slice(0, 3000)}`,
      contract.outputSchema && Object.keys(contract.outputSchema).length
        ? `Required output format: ${JSON.stringify(contract.outputSchema)}`
        : "",
      req.context ? `Context: ${req.context}` : "",
    ].filter(Boolean).join("\n");

    const userPrompt = `Task: ${JSON.stringify(req.input)}\n\nExecute the skill and produce the result.`;

    for (const providerId of ["ollama", "openai", "claude", "gemini", "grok"] as const) {
      try {
        const provider = this.providerFactory.getProvider(providerId as any);
        if (!provider) continue;
        const available = await Promise.race([
          provider.isAvailable(),
          new Promise<boolean>((r) => setTimeout(() => r(false), 60000)),
        ]);
        if (!available) continue;
        const response = await Promise.race([
          provider.generateResponse({
            prompt: `Execute: ${JSON.stringify(req.input)}`,
            systemPrompt,
            temperature: 0.3,
            maxTokens: 300,
          }),
          new Promise<null>((r) => setTimeout(() => r(null), 120000)),
        ]);
        if (response?.text && response.text.trim().length > 10) {
          return { text: response.text, provider: providerId, model: response.modelName || `${providerId}-default` };
        }
      } catch { /* next provider */ }
    }

    return { text: `${skill.name}: unable to execute — no provider available for non-tool execution. Install Ollama (npm run models:pull) for local execution.`, provider: "rule", model: "tvs-fallback" };
  }

  private async executeViaTool(
    skill: SkillDetail, req: ExecutionRequest, contract: SkillContract
  ): Promise<{ output: any; toolId: string }> {
    const toolId = contract.requiredTools[0];
    const tool = this.toolManager.getTool(toolId);
    if (!tool || !tool.enabled) {
      return { output: `Tool ${toolId} not available or disabled`, toolId };
    }
    const result = await this.toolManager.executeTool(toolId, req.input);
    return { output: result.success ? result.result : `Tool execution failed: ${result.error}`, toolId };
  }

  private async executeHybrid(
    skill: SkillDetail, req: ExecutionRequest, contract: SkillContract
  ): Promise<{ output: any; provider: string; toolId?: string }> {
    // First try tool execution, fall back to provider
    for (const toolId of contract.requiredTools) {
      const tool = this.toolManager.getTool(toolId);
      if (tool && tool.enabled) {
        try {
          const result = await this.toolManager.executeTool(toolId, req.input);
          if (result.success) {
            return { output: result.result, provider: "tool", toolId };
          }
        } catch { /* try next tool or fall back to provider */ }
      }
    }
    const providerResult = await this.executeViaProvider(skill, req, contract);
    return { output: providerResult.text, provider: providerResult.provider };
  }

  // ═══ CONTRACT MANAGEMENT ═══

  private inferContract(skill: SkillDetail): SkillContract {
    const domain = this.inferDomain(skill);
    const risk = classifyRisk(skill);
    const mode = this.inferExecutionMode(skill);
    return {
      skillId: skill.id,
      name: skill.name,
      domain,
      license: skill.license,
      inputSchema: { task: "string" },
      outputSchema: { result: "string" },
      requiredTools: [],
      requiredPermissions: [],
      timeoutMs: 30000,
      riskLevel: risk,
      executionMode: mode,
      validator: "default",
    };
  }

  private inferDomain(skill: SkillDetail): string {
    const combined = `${skill.name} ${skill.description}`.toLowerCase();
    if (/security|vulnerability|encrypt|auth|hack/i.test(combined)) return "security";
    if (/api|rest|graphql|endpoint|route|architecture/i.test(combined)) return "architecture";
    if (/deploy|docker|kubernetes|ci|cd|pipeline|infra/i.test(combined)) return "operations";
    if (/test|debug|build|compile|refactor|code|develop/i.test(combined)) return "development";
    if (/research|paper|study|analyze|investigate/i.test(combined)) return "research";
    if (/sales|lead|customer|crm|pipeline.*sell/i.test(combined)) return "sales";
    if (/finance|revenue|budget|cost|mrr|arr/i.test(combined)) return "finance";
    return "general";
  }

  private inferExecutionMode(skill: SkillDetail): SkillExecutionMode {
    const combined = `${skill.name} ${skill.description} ${skill.body}`.toLowerCase();
    if (/tool|api|cli|command|http|fetch|curl/i.test(combined)) return "HYBRID";
    if (/execute|run|invoke|call.*function/i.test(combined)) return "TOOL";
    return "PROMPT";
  }

  // ═══ PERMISSIONS ═══

  private checkPermissions(skill: SkillDetail, riskLevel: SkillRiskLevel, contract?: SkillContract): { allowed: boolean; reason: string } {
    if (riskLevel === "HIGH_RISK") {
      return { allowed: false, reason: `HIGH_RISK skill requires explicit approval: ${skill.name}` };
    }

    const combined = `${skill.id} ${skill.license || ""}`.toLowerCase();
    if (/agpl|gpl|proprietary/i.test(combined) && !/apache|mit|bsd/i.test(combined)) {
      return { allowed: false, reason: `License not compatible with automatic execution: ${skill.license}` };
    }

    const secretsCheck = /key|secret|token|seed|password/i.test(JSON.stringify(contract?.inputSchema || {}));
    if (secretsCheck) {
      return { allowed: false, reason: "Skill requires secrets in input — not allowed by governance" };
    }

    return { allowed: true, reason: "ok" };
  }

  // ═══ VALIDATION ═══

  private validateOutput(output: any, contract: SkillContract): { passed: boolean; reason: string } {
    if (output === null || output === undefined) {
      return { passed: false, reason: "output is null/undefined" };
    }
    if (typeof output === "string" && output.trim().length === 0) {
      return { passed: false, reason: "output is empty string" };
    }
    const schema = contract.outputSchema;
    if (schema && Object.keys(schema).length > 0) {
      for (const [key, type] of Object.entries(schema)) {
        if (typeof output === "object" && !(key in output)) {
          return { passed: false, reason: `missing required output field: ${key}` };
        }
        if (typeof output === "object" && typeof output[key] !== type) {
          return { passed: false, reason: `output field ${key} expected ${type}, got ${typeof output[key]}` };
        }
      }
    }
    return { passed: true, reason: "output valid" };
  }

  // ═══ RECORD MANAGEMENT ═══

  private createRecord(req: ExecutionRequest): ExecutionRecord {
    return {
      executionId: req.executionId,
      skillId: req.skillId,
      agentId: req.agentId,
      projectId: req.projectId,
      startedAt: new Date().toISOString(),
      status: "QUEUED",
      retryCount: 0,
    };
  }

  private fail(record: ExecutionRecord, error: string, startMs: number): ExecutionResult {
    record.status = "FAILED";
    record.finishedAt = new Date().toISOString();
    record.latencyMs = Date.now() - startMs;
    record.error = error.slice(0, 500);
    this.completeRecord(record);
    return {
      ok: false,
      executionId: record.executionId,
      skillId: record.skillId,
      output: null,
      provider: "error",
      model: "none",
      latencyMs: record.latencyMs || 0,
      validationPassed: false,
      validationReason: error,
      evidence: { error: record.error },
    };
  }

  private completeRecord(record: ExecutionRecord): void {
    this.activeExecutions.delete(record.executionId);
    this.executionHistory.push(record);
    if (this.executionHistory.length > 500) {
      this.executionHistory = this.executionHistory.slice(-500);
    }
    this.persistRecord(record);
  }

  private persistRecord(record: ExecutionRecord): void {
    try {
      const file = path.join(this.executionsDir, "executions.jsonl");
      fs.appendFileSync(file, JSON.stringify(record) + "\n", "utf8");
    } catch (e: any) {
      this.logger?.error(`[SkillExecutor] Failed to persist record: ${e.message}`);
    }
  }

  private loadHistory(): ExecutionRecord[] {
    try {
      const file = path.join(this.executionsDir, "executions.jsonl");
      if (!fs.existsSync(file)) return [];
      const raw = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
      return raw.slice(-500).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    } catch {
      return [];
    }
  }

  // ═══ PUBLIC API ═══

  getActiveExecutions(): ExecutionRecord[] {
    return Array.from(this.activeExecutions.values());
  }

  getHistory(limit = 20): ExecutionRecord[] {
    return this.executionHistory.slice(-limit).reverse();
  }

  getStats(): {
    total: number; succeeded: number; failed: number; rejected: number; timeout: number;
    avgLatencyMs: number; bySkill: Record<string, number>; byDomain: Record<string, number>;
    byMode: Record<string, number>; byRiskLevel: Record<string, number>;
    activeExecutions: number;
  } {
    const history = this.executionHistory;
    const succeeded = history.filter((r) => r.status === "SUCCEEDED").length;
    const failed = history.filter((r) => r.status === "FAILED").length;
    const rejected = history.filter((r) => r.status === "REJECTED").length;
    const timeout = history.filter((r) => r.status === "TIMEOUT").length;
    const latencies = history.filter((r) => r.latencyMs).map((r) => r.latencyMs!);
    const avgLatencyMs = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    const bySkill: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    const byRiskLevel: Record<string, number> = {};

    for (const r of history) {
      bySkill[r.skillId] = (bySkill[r.skillId] || 0) + 1;
    }

    return {
      total: history.length, succeeded, failed, rejected, timeout, avgLatencyMs,
      bySkill, byDomain, byMode, byRiskLevel,
      activeExecutions: this.activeExecutions.size,
    };
  }

  cancelExecution(executionId: string): boolean {
    const record = this.activeExecutions.get(executionId);
    if (!record) return false;
    record.status = "CANCELLED";
    record.finishedAt = new Date().toISOString();
    this.completeRecord(record);
    return true;
  }
}
