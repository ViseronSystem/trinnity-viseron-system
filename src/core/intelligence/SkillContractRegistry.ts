import fs from "fs";
import path from "path";
import { skillsRegistry, SkillInfo } from "../skills/SkillsRegistry";

export type SkillContractStatus = "EXECUTABLE" | "CONTEXT_ONLY" | "UNAVAILABLE" | "UNVERIFIED";

export interface SkillContract {
  skillId: string;
  name: string;
  domain: string;
  purpose: string;
  license: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  requiredPermissions: string[];
  compatibleTools: string[];
  compatibleProviders: string[];
  riskLevel: "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK";
  timeoutMs: number;
  verificationRequirements: string[];
  evidenceRequirements: string[];
  status: SkillContractStatus;
  provenance: {
    source: string;
    sourceType: string;
    url?: string;
    ingestedAt?: string;
  };
  performance?: {
    executed: number;
    succeeded: number;
    avgLatencyMs: number;
    lastExecutedAt?: string;
  };
}

// Built-in contracts for skills that have verified execution paths
const BUILT_IN_CONTRACTS: SkillContract[] = [
  {
    skillId: "claude-plugins-official:code-review",
    name: "Code Review",
    domain: "development",
    purpose: "Analyze code for quality, security, and best practices",
    license: "Apache-2.0",
    inputSchema: { code: "string", language: "string", focus: "string" },
    outputSchema: { review: "string", issues: "object", severity: "string" },
    requiredPermissions: ["tools.execute.prompt"],
    compatibleTools: [],
    compatibleProviders: ["ollama", "openai", "claude", "gemini", "grok"],
    riskLevel: "LOW_RISK",
    timeoutMs: 30000,
    verificationRequirements: ["outputNonEmpty", "outputHasStructure"],
    evidenceRequirements: ["execution_record", "validation_result"],
    status: "EXECUTABLE",
    provenance: { source: "claude-plugins-official", sourceType: "skill", url: "https://github.com/anthropics/claude-plugins-official" },
  },
  {
    skillId: "claude-plugins-official:api-design",
    name: "API Design",
    domain: "architecture",
    purpose: "Design REST API endpoints, schemas, and architecture",
    license: "Apache-2.0",
    inputSchema: { requirements: "string", constraints: "string" },
    outputSchema: { endpoints: "array", schemas: "object", documentation: "string" },
    requiredPermissions: ["tools.execute.prompt"],
    compatibleTools: [],
    compatibleProviders: ["ollama", "openai", "claude", "gemini", "grok"],
    riskLevel: "LOW_RISK",
    timeoutMs: 60000,
    verificationRequirements: ["outputNonEmpty"],
    evidenceRequirements: ["execution_record"],
    status: "EXECUTABLE",
    provenance: { source: "claude-plugins-official", sourceType: "skill" },
  },
  {
    skillId: "claude-plugins-official:security-audit",
    name: "Security Audit",
    domain: "security",
    purpose: "Analyze systems for security vulnerabilities",
    license: "Apache-2.0",
    inputSchema: { target: "string", scope: "string" },
    outputSchema: { vulnerabilities: "array", recommendations: "array", riskAssessment: "string" },
    requiredPermissions: ["tools.execute.prompt"],
    compatibleTools: [],
    compatibleProviders: ["ollama", "openai", "claude", "gemini", "grok"],
    riskLevel: "MEDIUM_RISK",
    timeoutMs: 60000,
    verificationRequirements: ["outputNonEmpty", "outputHasStructure"],
    evidenceRequirements: ["execution_record", "validation_result"],
    status: "EXECUTABLE",
    provenance: { source: "claude-plugins-official", sourceType: "skill" },
  },
  {
    skillId: "claude-plugins-official:research",
    name: "Research",
    domain: "research",
    purpose: "Research topics and synthesize findings",
    license: "Apache-2.0",
    inputSchema: { topic: "string", depth: "string" },
    outputSchema: { findings: "string", sources: "array", conclusions: "string" },
    requiredPermissions: ["tools.execute.prompt"],
    compatibleTools: [],
    compatibleProviders: ["ollama", "openai", "claude", "gemini", "grok"],
    riskLevel: "LOW_RISK",
    timeoutMs: 60000,
    verificationRequirements: ["outputNonEmpty"],
    evidenceRequirements: ["execution_record"],
    status: "EXECUTABLE",
    provenance: { source: "claude-plugins-official", sourceType: "skill" },
  },
];

export class SkillContractRegistry {
  private contracts: Map<string, SkillContract> = new Map();
  private loaded = false;

  constructor(private dataDir?: string) {}

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    await skillsRegistry.ensureLoaded();
    for (const c of BUILT_IN_CONTRACTS) {
      this.contracts.set(c.skillId, c);
    }
    if (this.dataDir) this.loadFromDisk();
    this.loaded = true;
  }

  getContract(skillId: string): SkillContract | undefined {
    return this.contracts.get(skillId);
  }

  setContract(contract: SkillContract): void {
    if (contract.performance) {
      const existing = this.contracts.get(contract.skillId);
      if (existing?.performance) {
        contract.performance.executed = (existing.performance.executed || 0) + (contract.performance.executed || 0);
        contract.performance.succeeded = (existing.performance.succeeded || 0) + (contract.performance.succeeded || 0);
      }
    }
    this.contracts.set(contract.skillId, contract);
  }

  getExecutableSkills(): SkillContract[] {
    return Array.from(this.contracts.values()).filter((c) => c.status === "EXECUTABLE");
  }

  getByDomain(domain: string): SkillContract[] {
    return Array.from(this.contracts.values()).filter((c) => c.domain === domain);
  }

  getByRiskLevel(risk: string): SkillContract[] {
    return Array.from(this.contracts.values()).filter((c) => c.riskLevel === risk);
  }

  async inferContract(skillId: string): Promise<SkillContract | null> {
    const skill = await skillsRegistry.getSkill(skillId);
    if (!skill) return null;
    const combined = `${skill.name} ${skill.description}`.toLowerCase();
    let domain = "general";
    if (/security|vulnerability|encrypt|auth/i.test(combined)) domain = "security";
    else if (/api|rest|graphql|endpoint|architecture/i.test(combined)) domain = "architecture";
    else if (/deploy|docker|kubernetes|ci|cd|pipeline/i.test(combined)) domain = "operations";
    else if (/test|debug|build|compile|code|develop|refactor/i.test(combined)) domain = "development";
    else if (/research|paper|study|analyze|investigate/i.test(combined)) domain = "research";
    else if (/sales|lead|customer|crm/i.test(combined)) domain = "sales";
    else if (/finance|revenue|budget|cost|mrr/i.test(combined)) domain = "finance";

    let risk: SkillContract["riskLevel"] = "LOW_RISK";
    if (/secret|key|token|seed|wallet|deploy|destroy|admin|root|sudo|database.*drop|transfer.*fund/i.test(combined)) risk = "HIGH_RISK";
    else if (/write|modify|update|create|save|api.*call|http.*request|file.*system|email.*send/i.test(combined)) risk = "MEDIUM_RISK";

    return {
      skillId: skill.id,
      name: skill.name,
      domain,
      purpose: skill.description.slice(0, 200),
      license: skill.license,
      inputSchema: { input: "string" },
      outputSchema: { output: "string" },
      requiredPermissions: ["tools.execute.prompt"],
      compatibleTools: [],
      compatibleProviders: ["ollama", "openai", "claude", "gemini", "grok"],
      riskLevel: risk,
      timeoutMs: 30000,
      verificationRequirements: ["outputNonEmpty"],
      evidenceRequirements: ["execution_record"],
      status: risk === "HIGH_RISK" ? "UNAVAILABLE" : "EXECUTABLE",
      provenance: { source: skill.source, sourceType: "skill" },
    };
  }

  async classifyAll(): Promise<{ executable: number; contextOnly: number; unavailable: number; unverified: number }> {
    await this.ensureLoaded();
    const all = await skillsRegistry.listSkills();
    let executable = 0, contextOnly = 0, unavailable = 0, unverified = 0;

    for (const skill of all) {
      const contract = this.contracts.get(skill.id);
      if (!contract) {
        unverified++;
      } else if (contract.status === "EXECUTABLE") {
        executable++;
      } else if (contract.status === "CONTEXT_ONLY") {
        contextOnly++;
      } else if (contract.status === "UNAVAILABLE") {
        unavailable++;
      }
    }

    return { executable, contextOnly, unavailable, unverified };
  }

  status(): { totalContracts: number; executable: number; byDomain: Record<string, number>; byRisk: Record<string, number> } {
    const all = Array.from(this.contracts.values());
    const byDomain: Record<string, number> = {};
    const byRisk: Record<string, number> = {};
    for (const c of all) {
      byDomain[c.domain] = (byDomain[c.domain] || 0) + 1;
      byRisk[c.riskLevel] = (byRisk[c.riskLevel] || 0) + 1;
    }
    return {
      totalContracts: all.length,
      executable: all.filter((c) => c.status === "EXECUTABLE").length,
      byDomain,
      byRisk,
    };
  }

  saveToDisk(filePath?: string): void {
    if (!this.dataDir && !filePath) return;
    const fp = filePath || path.join(this.dataDir!, "audit", "p02-skill-contract", "skill-contracts.json");
    const dir = path.dirname(fp);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fp, JSON.stringify(Array.from(this.contracts.values()), null, 2), "utf8");
  }

  private loadFromDisk(): void {
    try {
      const fp = path.join(this.dataDir!, "audit", "p02-skill-contract", "skill-contracts.json");
      if (!fs.existsSync(fp)) return;
      const data = JSON.parse(fs.readFileSync(fp, "utf8"));
      if (Array.isArray(data)) {
        for (const c of data as SkillContract[]) {
          this.contracts.set(c.skillId, c);
        }
      }
    } catch { /* disk load failed, use built-in only */ }
  }
}
