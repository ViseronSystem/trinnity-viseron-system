export const TVS_CONTEXT = "https://trinnityviseron.system/context/v1";
export const TVS_VERSION = "1.0.0";

export type TVSLineage = "corona" | "hierro";
export type TVSRank =
  | "reina" | "capitan"
  | "duquesa" | "consejera" | "canciller"
  | "teniente" | "alferez" | "brigada"
  | "sargento" | "cabo"
  | "heraldo" | "tesorera" | "vidente";
export type TVSClearance = "I" | "II" | "III" | "IV" | "V";
export type OnFailurePolicy = "halt_and_report" | "retry_backoff" | "delegate_sibling" | "escalate_crown";

export interface TVSAgentManifest {
  "@context": string;
  "@type": "TVS.Agent";
  "@id": string;
  version: string;
  name: string;
  rank: TVSRank;
  epithet: string;
  sovereign: boolean;
  lineage: TVSLineageEntry;
  doctrine: string;
  authority: string[];
  autonomy: number;
  clearance: TVSClearance;
  seal: string;
}

export interface TVSLineageEntry {
  "@type": "TVS.Lineage";
  line: TVSLineage;
  sovereign: string;
  derivesFrom: string | null;
  depth: number;
}

export interface TVSDirective {
  "@context": string;
  "@type": "TVS.Directive";
  "@id": string;
  version: string;
  objective: string;
  ratifiedBy: TVSSignature;
  commandedBy: TVSSignature;
  squad: string[];
  budget: { tokens: number; wallClockMinutes: number };
  guardrails: string[];
  onFailure: OnFailurePolicy;
}

export interface TVSSignature {
  "@type": "TVS.Signature";
  agent: string;
  seal: string;
  at: string;
}

export interface TVSReturn {
  "@context": string;
  "@type": "TVS.Return";
  directive: string;
  agent: string;
  lineage: TVSLineage;
  confidence: number;
  evidence: string;
  executionTimeMs: number;
  sealedBy: string;
  sealedAt: string;
}

export interface TVSBattalion {
  "@context": string;
  "@type": "TVS.Battalion";
  version: string;
  name: string;
  sovereigns: { name: string; rank: string }[];
  lineages: TVSLineage[];
  activeAgents: number;
}

export class TVSStandard {
  static readonly CONTEXT = TVS_CONTEXT;
  static readonly VERSION = TVS_VERSION;

  static createDirective(params: {
    id: string;
    objective: string;
    ratifiedBy: string;
    commandedBy: string;
    squad: string[];
    budgetTokens?: number;
    budgetMinutes?: number;
  }): TVSDirective {
    return {
      "@context": TVS_CONTEXT,
      "@type": "TVS.Directive",
      "@id": params.id,
      version: TVS_VERSION,
      objective: params.objective,
      ratifiedBy: { "@type": "TVS.Signature", agent: params.ratifiedBy, seal: "", at: new Date().toISOString() },
      commandedBy: { "@type": "TVS.Signature", agent: params.commandedBy, seal: "", at: new Date().toISOString() },
      squad: params.squad,
      budget: { tokens: params.budgetTokens ?? 240000, wallClockMinutes: params.budgetMinutes ?? 25 },
      guardrails: ["charter.v1", "no_unsigned_action"],
      onFailure: "halt_and_report",
    };
  }

  static createReturn(params: {
    directive: string;
    agent: string;
    lineage: TVSLineage;
    confidence: number;
    evidence: string;
    executionTimeMs: number;
  }): TVSReturn {
    return {
      "@context": TVS_CONTEXT,
      "@type": "TVS.Return",
      directive: params.directive,
      agent: params.agent,
      lineage: params.lineage,
      confidence: params.confidence,
      evidence: params.evidence,
      executionTimeMs: params.executionTimeMs,
      sealedBy: "vera-costa",
      sealedAt: new Date().toISOString(),
    };
  }
}
