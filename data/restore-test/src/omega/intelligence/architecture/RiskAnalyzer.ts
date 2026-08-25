import { GraphifyAdapter } from "./GraphifyAdapter";
import { ImpactResult } from "./types";

export interface RiskItem {
  kind: "high-coupling" | "hub-dependency" | "large-impact" | "no-source";
  subject: string;
  severity: "low" | "medium" | "high";
  detail: string;
}

export interface RiskReport {
  items: RiskItem[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export class RiskAnalyzer {
  constructor(private readonly adapter: GraphifyAdapter) {}

  public analyze(subject?: string): RiskReport {
    const items: RiskItem[] = [];
    const stats = this.adapter.stats();

    for (const hub of stats.topHubs) {
      if (hub.degree >= 60) {
        items.push({
          kind: "hub-dependency",
          subject: hub.id,
          severity: hub.degree >= 100 ? "high" : "medium",
          detail: `hub with degree ${hub.degree} — many dependents, high blast radius`,
        });
      }
    }

    for (const c of stats.topCoupling) {
      if (c.crossFileLinks >= 30) {
        items.push({
          kind: "high-coupling",
          subject: c.file,
          severity: c.crossFileLinks >= 45 ? "high" : "medium",
          detail: `${c.crossFileLinks} cross-file links — change ripple risk`,
        });
      }
    }

    if (subject) {
      const impact = this.adapter.impact(subject, 2) as ImpactResult;
      if (impact.affectedNodes.length >= 25) {
        items.push({
          kind: "large-impact",
          subject: impact.subject,
          severity: impact.affectedNodes.length >= 50 ? "high" : "medium",
          detail: `${impact.affectedNodes.length} nodes affected within 2 hops`,
        });
      }
      if (impact.affectedNodes.length === 0 && impact.immediateDependencies.length === 0) {
        items.push({ kind: "no-source", subject, severity: "low", detail: "no nodes found for subject" });
      }
    }

    return {
      items,
      highCount: items.filter((i) => i.severity === "high").length,
      mediumCount: items.filter((i) => i.severity === "medium").length,
      lowCount: items.filter((i) => i.severity === "low").length,
    };
  }
}
