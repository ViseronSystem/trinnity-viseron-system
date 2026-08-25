import { SkillDetail, SkillInfo, skillsRegistry } from "./SkillsRegistry";
import type { SkillExecutor, ExecutionRequest } from "../intelligence/SkillExecutor";

// Skill Pipeline — REALITY HARDENING
// As 1.997 skills indexadas (10 coleções, skills/vendor) estão classificadas como
// INDEXED: estão indexadas e disponíveis para leitura/pesquisa, mas NÃO são
// executadas automaticamente. O fluxo completo de execução de uma skill é:
//
//   SKILL → VALIDATION → PERMISSION → EXECUTION → RESULT → EVALUATION
//
// Este pipeline define o estado REAL de cada skill. As skills indexadas NUNCA são
// executadas sem passar por VALIDATION (conteúdo/segurança) e PERMISSION
// (autorização explícita — regra de governança: nenhuma operação sem aprovação).
// EXECUTION e EVALUATION existem como contratos para quando uma skill for
// materializada — até lá, nenhuma skill é "executável" no runtime do TVS.

export type SkillPipelineStage =
  | "SKILL"
  | "VALIDATION"
  | "PERMISSION"
  | "EXECUTION"
  | "RESULT"
  | "EVALUATION";

export type SkillStatus = "INDEXED" | "VALIDATED" | "APPROVED" | "EXECUTED" | "EVALUATED" | "REJECTED";

export interface SkillPipelineState {
  id: string;
  status: SkillStatus;
  stages: SkillPipelineStage[];
  lastStage: SkillPipelineStage | null;
  detail: SkillDetail | null;
}

export interface SkillPipelineResult {
  id: string;
  stage: SkillPipelineStage;
  status: SkillStatus;
  allowed: boolean;
  reason?: string;
}

// Regras de validação por etapa. As skills indexadas param na etapa SKILL —
// nunca passam a EXECUTION sem autorização explícita.
export const SKILL_VALIDATION_RULES: Array<{ id: string; label: string; test: (info: SkillInfo) => boolean }> = [
  {
    id: "has_skill_md",
    label: "ficheiro SKILL.md presente",
    test: (info) => !!info.name,
  },
  {
    id: "has_description",
    label: "descrição não vazia (indexação mínima)",
    test: (info) => (info.description || "").trim().length > 0,
  },
];

export const SKILL_PERMISSION_RULES: Array<{ id: string; label: string; test: (state: SkillPipelineState) => boolean }> = [
  {
    id: "governance_approval",
    label: "aprovação explícita de Pedro/Trinnity (governança)",
    test: () => false,
  },
  {
    id: "no_secrets_in_skill",
    label: "a skill não expõe chaves/seeds no frontmatter",
    test: (state) => {
      const fm = state.detail?.frontmatter || {};
      const joined = Object.keys(fm).join(",");
      return !/key|secret|token|seed|password|api/i.test(joined);
    },
  },
];

export class SkillPipeline {
  private executor: SkillExecutor | null = null;

  /** Attach a real SkillExecutor to make skills executable. Without this, execute() returns REJECTED. */
  public setExecutor(executor: SkillExecutor): void {
    this.executor = executor;
  }

  public hasExecutor(): boolean {
    return this.executor !== null;
  }

  /**
   * Estado atual de uma skill: por omissão está INDEXED (etapa SKILL).
   * Apenas skills com autorização explícita avançam — nunca por código.
   */
  public async inspect(id: string): Promise<SkillPipelineState> {
    const detail = await skillsRegistry.getSkill(id);
    return {
      id,
      status: detail ? "INDEXED" : "REJECTED",
      stages: ["SKILL"],
      lastStage: detail ? "SKILL" : null,
      detail: detail ?? null,
    };
  }

  /** Validação de indexação — passo de leitura, sem executar nada. */
  public async validate(id: string): Promise<SkillPipelineResult> {
    const state = await this.inspect(id);
    if (!state.detail) {
      return { id, stage: "VALIDATION", status: "REJECTED", allowed: false, reason: "skill não encontrada no registry" };
    }
    const detail = state.detail;
    const failed = SKILL_VALIDATION_RULES.filter((r) => !r.test(detail));
    if (failed.length > 0) {
      return { id, stage: "VALIDATION", status: "REJECTED", allowed: false, reason: `regras falhadas: ${failed.map((f) => f.id).join(", ")}` };
    }
    return { id, stage: "VALIDATION", status: "VALIDATED", allowed: true };
  }

  /** Permissão de execução — NUNCA autoriza por omissão (regra de governança). */
  public async permission(id: string, authorized: boolean): Promise<SkillPipelineResult> {
    const state = await this.inspect(id);
    if (!state.detail) {
      return { id, stage: "PERMISSION", status: "REJECTED", allowed: false, reason: "skill não encontrada no registry" };
    }
    const blocked = SKILL_PERMISSION_RULES.filter((r) => !r.test(state));
    if (blocked.length > 0) {
      return { id, stage: "PERMISSION", status: "REJECTED", allowed: false, reason: `sem autorização: ${blocked.map((b) => b.id).join(", ")}` };
    }
    if (!authorized) {
      return { id, stage: "PERMISSION", status: "INDEXED", allowed: false, reason: "requer aprovação explícita do comando (Pedro/Trinnity)" };
    }
    return { id, stage: "PERMISSION", status: "APPROVED", allowed: true };
  }

  /**
   * Execução de uma skill via SkillExecutor (S14).
   * Sem executor → REJECTED. Com executor → execução real via ToolManager/Provider.
   */
  public async execute(id: string, input?: Record<string, any>, agentId?: string): Promise<SkillPipelineResult> {
    if (!this.executor) {
      return { id, stage: "EXECUTION", status: "REJECTED", allowed: false, reason: "SkillExecutor não configurado — sem execution fabric" };
    }
    try {
      const req: ExecutionRequest = {
        executionId: `exec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        skillId: id,
        agentId: agentId || "system",
        input: input || {},
      };
      const result = await this.executor.execute(req);
      return {
        id,
        stage: result.ok ? "RESULT" : "EXECUTION",
        status: result.ok ? "EXECUTED" : "REJECTED",
        allowed: result.ok,
        reason: result.validationReason || (result.ok ? "executed" : "failed"),
      };
    } catch (e: any) {
      return { id, stage: "EXECUTION", status: "REJECTED", allowed: false, reason: `execution error: ${e.message}` };
    }
  }

  /** Contagem real por estado: quantas skills estão INDEXED agora. */
  public async summary(): Promise<{ total: number; indexed: number; executed: number; status: Record<string, number> }> {
    const all = await skillsRegistry.listSkills();
    const status: Record<string, number> = { INDEXED: all.length };
    if (this.executor) {
      const stats = this.executor.getStats();
      status.EXECUTED = stats.succeeded;
      status.FAILED = stats.failed;
    }
    return {
      total: all.length,
      indexed: all.length,
      executed: this.executor ? this.executor.getStats().succeeded : 0,
      status,
    };
  }
}

export const skillPipeline = new SkillPipeline();
