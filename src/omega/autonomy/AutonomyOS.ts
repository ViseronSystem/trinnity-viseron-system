export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type AutonomyBehavior =
  | "observe"
  | "recommend"
  | "execute_approved"
  | "execute_limited"
  | "execute_supervised"
  | "execute_operational";

export interface AutonomyLevelDef {
  level: AutonomyLevel;
  name: string;
  label: string;
  description: string;
  behavior: AutonomyBehavior;
}

export type AutonomyDomain =
  | "finance"
  | "deploy"
  | "data"
  | "messaging"
  | "agents"
  | "research"
  | "system";

export interface DomainPolicy {
  domain: AutonomyDomain;
  level: AutonomyLevel;
  autoBelow?: number;
  approvalFrom?: number;
  denyAbove?: number;
  requireApprovalFor?: string[];
  denyFor?: string[];
}

export interface AutonomyRequest {
  domain: AutonomyDomain;
  op: string;
  value?: number;
  actor?: string;
  permission?: string;
}

export type AutonomyVerdict = "deny" | "approval" | "auto" | "supervised";

export interface AutonomyDecision {
  domain: AutonomyDomain;
  op: string;
  value?: number;
  actor?: string;
  permission?: string;
  level: AutonomyLevel;
  verdict: AutonomyVerdict;
  reason: string;
  at: number;
}

export const AUTONOMY_LEVELS: AutonomyLevelDef[] = [
  { level: 0, name: "observed", label: "Operação observada", description: "A IA observa e reporta; o humano executa tudo.", behavior: "observe" },
  { level: 1, name: "assisted", label: "Gestão assistida", description: "A IA recomenda; o humano decide e aprova cada operação.", behavior: "recommend" },
  { level: 2, name: "approved", label: "Execução aprovada", description: "A IA executa apenas com aprovação humana a cada ação.", behavior: "execute_approved" },
  { level: 3, name: "limited", label: "Execução limitada", description: "A IA executa ações de baixo risco; o humano aprova as de maior risco.", behavior: "execute_limited" },
  { level: 4, name: "supervised", label: "Execução supervisionada", description: "A IA executa tudo com supervisão e auditoria contínua.", behavior: "execute_supervised" },
  { level: 5, name: "operational", label: "Operação autónoma", description: "A IA opera autonomamente; o humano intervém apenas em emergência.", behavior: "execute_operational" },
];

export const DEFAULT_DOMAIN_POLICIES: DomainPolicy[] = [
  {
    domain: "finance",
    level: 4,
    autoBelow: 50,
    approvalFrom: 500,
    denyAbove: 50000,
    requireApprovalFor: ["refund", "invoice_override", "plan_downgrade"],
    denyFor: ["card_data_access", "refund_full"],
  },
  {
    domain: "deploy",
    level: 2,
    requireApprovalFor: ["prod_deploy", "domain_change", "dns_change"],
    denyFor: ["prod_down"],
  },
  {
    domain: "data",
    level: 3,
    requireApprovalFor: ["migration", "bulk_delete", "export_all"],
    denyFor: ["drop_database", "delete_all_users", "seed_exposure", "secret_access"],
  },
  {
    domain: "messaging",
    level: 3,
    autoBelow: 10,
    approvalFrom: 100,
    requireApprovalFor: ["broadcast", "rcs_bulk"],
    denyFor: ["spam_all", "impersonate_user"],
  },
  {
    domain: "agents",
    level: 2,
    requireApprovalFor: ["create_agent", "uninstall_agent", "grant_privilege"],
    denyFor: ["uninstall_core"],
  },
  {
    domain: "research",
    level: 5,
    denyFor: ["illegal_activity", "exploit_exploration"],
  },
  {
    domain: "system",
    level: 1,
    requireApprovalFor: ["restart_prod", "shutdown", "kill_process"],
    denyFor: ["rm_root", "purge_state"],
  },
];

export class AutonomyOS {
  private policies = new Map<AutonomyDomain, DomainPolicy>();
  private audit: AutonomyDecision[] = [];

  constructor(policies?: DomainPolicy[]) {
    for (const p of policies ?? DEFAULT_DOMAIN_POLICIES) this.policies.set(p.domain, p);
  }

  public configure(policy: DomainPolicy): void {
    this.policies.set(policy.domain, policy);
  }

  public assess(req: AutonomyRequest): AutonomyDecision {
    const policy = this.policies.get(req.domain);
    if (!policy) {
      return this.record({
        ...req,
        level: 1,
        verdict: "approval",
        reason: `no policy for domain "${req.domain}" — safe default: human approval`,
      });
    }

    if (policy.denyFor?.includes(req.op)) {
      return this.record({
        ...req,
        level: policy.level,
        verdict: "deny",
        reason: `deny list: operation "${req.op}" is forbidden for domain "${req.domain}"`,
      });
    }

    if (policy.requireApprovalFor?.includes(req.op)) {
      return this.record({
        ...req,
        level: policy.level,
        verdict: "approval",
        reason: `requireApprovalFor: operation "${req.op}" requires human approval for domain "${req.domain}"`,
      });
    }

    const value = req.value;
    if (typeof value === "number") {
      if (policy.denyAbove !== undefined && value > policy.denyAbove) {
        return this.record({
          ...req,
          level: policy.level,
          verdict: "deny",
          reason: `denyAbove: value ${value} exceeds ${policy.denyAbove} for "${req.op}"`,
        });
      }
      if (policy.approvalFrom !== undefined && value >= policy.approvalFrom) {
        return this.record({
          ...req,
          level: policy.level,
          verdict: "approval",
          reason: `approvalFrom: value ${value} >= ${policy.approvalFrom} for "${req.op}"`,
        });
      }
      if (policy.autoBelow !== undefined && policy.level >= 3 && value < policy.autoBelow) {
        return this.record({
          ...req,
          level: policy.level,
          verdict: "auto",
          reason: `autoBelow: value ${value} < ${policy.autoBelow} at level ${policy.level} — autonomous`,
        });
      }
    }

    const level = policy.level;
    let verdict: AutonomyVerdict = "auto";
    let reason = `domain "${req.domain}" at level ${level} — autonomous`;
    if (level === 0) {
      verdict = "deny";
      reason = `domain "${req.domain}" at level 0 — observed only, human executes`;
    } else if (level <= 2) {
      verdict = "approval";
      reason = `domain "${req.domain}" at level ${level} — execution requires human approval`;
    } else if (level === 4) {
      verdict = "supervised";
      reason = `domain "${req.domain}" at level 4 — autonomous with supervision/audit`;
    }

    return this.record({ ...req, level, verdict, reason });
  }

  public getLevels(): AutonomyLevelDef[] {
    return AUTONOMY_LEVELS;
  }

  public getPolicies(): DomainPolicy[] {
    return Array.from(this.policies.values());
  }

  public getAudit(limit = 50): AutonomyDecision[] {
    return this.audit.slice(-limit).reverse();
  }

  public clearAudit(): void {
    this.audit = [];
  }

  public summary(): {
    domains: number;
    decisions: number;
    denies: number;
    approvals: number;
    autonomous: number;
    levels: AutonomyLevelDef[];
    policies: DomainPolicy[];
  } {
    const denies = this.audit.filter((d) => d.verdict === "deny").length;
    const approvals = this.audit.filter((d) => d.verdict === "approval").length;
    const autonomous = this.audit.filter((d) => d.verdict === "auto" || d.verdict === "supervised").length;
    return {
      domains: this.policies.size,
      decisions: this.audit.length,
      denies,
      approvals,
      autonomous,
      levels: AUTONOMY_LEVELS,
      policies: this.getPolicies(),
    };
  }

  private record(decision: Omit<AutonomyDecision, "at">): AutonomyDecision {
    const full: AutonomyDecision = { ...decision, at: Date.now() };
    this.audit.push(full);
    return full;
  }
}
