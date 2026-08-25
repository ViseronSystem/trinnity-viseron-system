import { TVSStandard, TVSDirective, TVSReturn, TVSLineage, OnFailurePolicy } from "./types";

export interface DirectiveResult {
  directive: TVSDirective;
  approved: boolean;
  rejectReason?: string;
}

export interface MissionResult {
  agentId: string;
  agentName: string;
  success: boolean;
  output: string;
  confidence: number;
  executionTimeMs: number;
}

export class DirectiveEngine {
  private directiveLog: TVSDirective[] = [];
  private returnLog: TVSReturn[] = [];
  private squads: Map<string, string[]> = new Map();
  private activeMissions: Map<string, boolean> = new Map();

  createSquad(id: string, agents: string[]): void {
    this.squads.set(id, agents);
  }

  async issueDirective(params: {
    id: string;
    objective: string;
    ratifiedBy: string;
    commandedBy: string;
    squad: string[];
  }): Promise<DirectiveResult> {
    const directive = TVSStandard.createDirective(params);

    if (!this.validateDualSignature(directive)) {
      return { directive, approved: false, rejectReason: "Ambas firmas requeridas: Reina ratifica, Capitán comanda" };
    }

    this.directiveLog.push(directive);
    this.activeMissions.set(directive["@id"], true);
    return { directive, approved: true };
  }

  completeMission(directiveId: string, agentId: string, lineage: TVSLineage, confidence: number, evidence: string, executionTimeMs: number): TVSReturn {
    const ret = TVSStandard.createReturn({
      directive: directiveId,
      agent: agentId,
      lineage,
      confidence,
      evidence,
      executionTimeMs,
    });
    this.returnLog.push(ret);
    this.activeMissions.set(directiveId, false);
    return ret;
  }

  private validateDualSignature(d: TVSDirective): boolean {
    const hasRatify = d.ratifiedBy.agent.length > 0;
    const hasCommand = d.commandedBy.agent.length > 0;
    return hasRatify && hasCommand;
  }

  getActiveDirectives(): TVSDirective[] {
    return this.directiveLog.filter(d => this.activeMissions.get(d["@id"]) !== false);
  }

  getCompletedReturns(): TVSReturn[] {
    return this.returnLog;
  }

  getStats(): { totalDirectives: number; completed: number; active: number } {
    const total = this.directiveLog.length;
    const completed = this.returnLog.length;
    const active = this.getActiveDirectives().length;
    return { totalDirectives: total, completed, active };
  }
}
