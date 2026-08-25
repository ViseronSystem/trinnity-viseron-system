import { GraphifyAdapter, GraphifyAdapterOptions } from "./GraphifyAdapter";
import { RiskAnalyzer } from "./RiskAnalyzer";
import { ContextBuilder, PROVENANCE } from "./ContextBuilder";

export { GraphifyAdapter, GraphifyAdapterOptions } from "./GraphifyAdapter";
export { RiskAnalyzer, RiskItem, RiskReport } from "./RiskAnalyzer";
export { ContextBuilder, ContextBundle, PROVENANCE } from "./ContextBuilder";
export * from "./types";

export interface ArchitectureIntelligenceOptions {
  graphPath?: string;
}

export class ArchitectureIntelligence {
  public readonly adapter: GraphifyAdapter;
  public readonly risks: RiskAnalyzer;
  public readonly context: ContextBuilder;
  public readonly provenance = { ...PROVENANCE };

  private loaded = false;

  constructor(options?: ArchitectureIntelligenceOptions) {
    this.adapter = new GraphifyAdapter(options);
    this.risks = new RiskAnalyzer(this.adapter);
    this.context = new ContextBuilder(this.adapter);
  }

  public initialize(): this {
    try {
      this.adapter.load();
      this.loaded = true;
    } catch (err: any) {
      this.loaded = false;
      console.warn(`[ArchitectureIntelligence] graph not available: ${err?.message || String(err)}`);
    }
    return this;
  }

  public isReady(): boolean {
    return this.loaded;
  }

  public query(term: string) {
    return this.context.forSubject(term);
  }

  public summary() {
    if (!this.loaded) return { ready: false };
    return {
      ready: true,
      stats: this.adapter.stats(),
      risk: this.risks.analyze(),
      provenance: this.provenance,
    };
  }
}
