/**
 * TVS Reality Policy — REAL > MOCK > CLAIM
 * Política central de classificação da realidade operacional do sistema.
 *
 * Nenhuma resposta mock pode ser confundida com uma resposta real.
 * Todo mock deve conter metadata explícita:
 *   { mode: "MOCK", provider: "anthropic", reason: "credentials_unavailable" }
 *
 * Nunca "success": true quando a operação real não ocorreu.
 */

export type RealityMode =
  | "REAL"
  | "PARTIAL"
  | "MOCK"
  | "EXPERIMENTAL"
  | "NOT_IMPLEMENTED";

export interface RealityMeta {
  mode: RealityMode;
  provider?: string;
  component?: string;
  reason: string;
  at?: number;
}

export interface RealityComponent {
  id: string;
  mode: RealityMode;
  reason: string;
  detail?: Record<string, unknown>;
  updatedAt: number;
}

const MODE_PRIORITY: Record<RealityMode, number> = {
  REAL: 0,
  PARTIAL: 1,
  EXPERIMENTAL: 2,
  MOCK: 3,
  NOT_IMPLEMENTED: 4,
};

const MODE_LABEL: Record<RealityMode, string> = {
  REAL: "real",
  PARTIAL: "parcial",
  MOCK: "mock",
  EXPERIMENTAL: "experimental",
  NOT_IMPLEMENTED: "não implementado",
};

/** Erro de realidade: um provider sem credenciais reais NUNCA devolve sucesso. */
export class ProviderUnavailableError extends Error {
  public readonly code = "PROVIDER_UNAVAILABLE";
  public readonly meta: RealityMeta;

  constructor(provider: string, reason: string) {
    super(`[${provider}] indisponível: ${reason}`);
    this.name = "ProviderUnavailableError";
    this.meta = { mode: "NOT_IMPLEMENTED", provider, reason, at: Date.now() };
  }
}

/** Erro de execução real (credenciais presentes mas a API falhou). */
export class ProviderExecutionError extends Error {
  public readonly code = "PROVIDER_EXECUTION_ERROR";
  public readonly meta: RealityMeta;

  constructor(provider: string, reason: string) {
    super(`[${provider}] falha real: ${reason}`);
    this.name = "ProviderExecutionError";
    this.meta = { mode: "PARTIAL", provider, reason, at: Date.now() };
  }
}

/** Monta metadata de mock/parcial explícita (nunca "success": true real). */
export function realityMeta(
  mode: RealityMode,
  reason: string,
  extra: Partial<Omit<RealityMeta, "mode" | "reason">> = {}
): RealityMeta {
  return { mode, reason, at: Date.now(), ...extra };
}

/** Classifica um componente; o mais grave (maior prioridade) vence se duplicado. */
export class RealityRegistry {
  private components = new Map<string, RealityComponent>();

  public set(id: string, mode: RealityMode, reason: string, detail?: Record<string, unknown>): void {
    const existing = this.components.get(id);
    const current = existing ? MODE_PRIORITY[existing.mode] : -1;
    const incoming = MODE_PRIORITY[mode];
    if (incoming >= current) {
      this.components.set(id, { id, mode, reason, detail, updatedAt: Date.now() });
    }
  }

  public get(id: string): RealityComponent | undefined {
    return this.components.get(id);
  }

  public isReal(id: string): boolean {
    return this.components.get(id)?.mode === "REAL";
  }

  public snapshot(): RealityComponent[] {
    return Array.from(this.components.values()).sort(
      (a, b) => MODE_PRIORITY[a.mode] - MODE_PRIORITY[b.mode] || a.id.localeCompare(b.id)
    );
  }

  public summary(): {
    real: string[];
    partial: string[];
    mock: string[];
    experimental: string[];
    notImplemented: string[];
    labels: Record<RealityMode, string>;
  } {
    const groups: Record<RealityMode, string[]> = {
      REAL: [],
      PARTIAL: [],
      MOCK: [],
      EXPERIMENTAL: [],
      NOT_IMPLEMENTED: [],
    };
    for (const c of this.components.values()) groups[c.mode].push(c.id);
    return {
      real: groups.REAL,
      partial: groups.PARTIAL,
      mock: groups.MOCK,
      experimental: groups.EXPERIMENTAL,
      notImplemented: groups.NOT_IMPLEMENTED,
      labels: MODE_LABEL,
    };
  }
}

/** Registry global do sistema (partilhado por todos os módulos). */
export const reality = new RealityRegistry();
