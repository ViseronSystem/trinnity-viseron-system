import { VerificationStatus } from "../kernel/TaskQueue";
import { Verifier } from "./composite";

export interface VerificationRule {
  id: string;
  name: string;
  onFail?: Exclude<VerificationStatus, "PASS">;
  check: (result: any, task: any) => boolean | Promise<boolean>;
}

export interface VerificationResult {
  status: VerificationStatus;
  reasons: string[];
  evidence?: any;
  passed: number;
  failed: number;
  at: number;
}

const DEFAULT_ON_FAIL: Exclude<VerificationStatus, "PASS"> = "FAIL";

export class TaskVerifier implements Verifier {
  public readonly name = "TaskVerifier";
  private rules = new Map<string, VerificationRule[]>();

  constructor(rules?: Record<string, VerificationRule[]>) {
    if (rules) {
      for (const [taskType, ruleList] of Object.entries(rules)) {
        this.addRules(taskType, ruleList);
      }
    }
  }

  public addRule(taskType: string, rule: VerificationRule): void {
    if (!this.rules.has(taskType)) this.rules.set(taskType, []);
    this.rules.get(taskType)!.push(rule);
  }

  public addRules(taskType: string, rules: VerificationRule[]): void {
    for (const rule of rules) this.addRule(taskType, rule);
  }

  public rulesFor(taskType: string): VerificationRule[] {
    return [...(this.rules.get(taskType) ?? []), ...(this.rules.get("*") ?? [])];
  }

  public async verify(task: any, result: any): Promise<VerificationResult> {
    const rules = this.rulesFor(task?.type);
    if (rules.length === 0) {
      return { status: "PASS", reasons: ["no rules configured"], passed: 0, failed: 0, at: Date.now() };
    }
    const reasons: string[] = [];
    let passed = 0;
    let failed = 0;
    let onFail: Exclude<VerificationStatus, "PASS"> = DEFAULT_ON_FAIL;
    for (const rule of rules) {
      try {
        const ok = await rule.check(result, task);
        if (ok) {
          passed++;
        } else {
          failed++;
          onFail = rule.onFail ?? DEFAULT_ON_FAIL;
          reasons.push(`rule "${rule.name}" not satisfied`);
        }
      } catch (err: any) {
        failed++;
        onFail = rule.onFail ?? DEFAULT_ON_FAIL;
        reasons.push(`rule "${rule.name}" errored: ${err?.message || String(err)}`);
      }
    }
    return { status: failed === 0 ? "PASS" : onFail, reasons, passed, failed, at: Date.now() };
  }
}

export const hasResult = (): VerificationRule => ({
  id: "has-result",
  name: "result exists",
  check: (r) => r !== null && r !== undefined,
});

export const resultTruthy = (): VerificationRule => ({
  id: "result-truthy",
  name: "result truthy / success",
  check: (r) => !!r && r.success !== false,
});

export const outputNonEmpty = (): VerificationRule => ({
  id: "output-non-empty",
  name: "output non-empty",
  check: (r) => !(typeof r?.output === "string" && r.output.trim() === ""),
});

export const schemaRule = (required: string[]): VerificationRule => ({
  id: "schema",
  name: `schema [${required.join(",")}]`,
  check: (r) => required.every((key) => r?.[key] !== undefined && r?.[key] !== null),
});

export const invariantRule = (id: string, check: (result: any, task: any) => boolean, onFail?: Exclude<VerificationStatus, "PASS">): VerificationRule => ({
  id,
  name: id,
  onFail,
  check,
});
