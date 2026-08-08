import { TaskVerification, TaskVerifierFn } from "../kernel/TaskQueue";

export interface Verifier {
  readonly name: string;
  verify(task: any, result: any, meta?: any): Promise<TaskVerification> | TaskVerification;
}

export function toVerifierFn(verifier: Verifier): TaskVerifierFn {
  return async (task: any, result: any, meta: any) => {
    const v = await verifier.verify(task, result, meta);
    return { status: v.status, reasons: v.reasons, evidence: v.evidence };
  };
}

export class CompositeVerifier implements Verifier {
  public readonly name = "CompositeVerifier";
  private readonly verifiers: Verifier[] = [];

  constructor(verifiers: Verifier[] = []) {
    this.verifiers = [...verifiers];
  }

  public add(verifier: Verifier): this {
    this.verifiers.push(verifier);
    return this;
  }

  public get size(): number {
    return this.verifiers.length;
  }

  public async verify(task: any, result: any, meta?: any): Promise<TaskVerification> {
    const allReasons: string[] = [];
    let overall: TaskVerification["status"] = "PASS";

    for (const verifier of this.verifiers) {
      let v: TaskVerification;
      try {
        v = await verifier.verify(task, result, meta);
      } catch (err: any) {
        v = { status: "FAIL", reasons: [`${verifier.name} errored: ${err?.message || String(err)}`] };
      }
      allReasons.push(...v.reasons.map((r) => `[${verifier.name}] ${r}`));
      if (v.status !== "PASS") {
        overall = this.priorityStatus(overall, v.status);
      }
    }

    if (overall === "PASS" && allReasons.length === 0) allReasons.push("all verifiers passed");

    return { status: overall, reasons: allReasons, at: Date.now() };
  }

  private priorityStatus(a: TaskVerification["status"], b: TaskVerification["status"]): TaskVerification["status"] {
    const rank = { PASS: 0, RETRY: 1, HUMAN: 2, FAIL: 3 } as const;
    return rank[b] > rank[a] ? b : a;
  }
}
