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
    // Carregamento NÃO-BLOQUEANTE. O grafo pode ser muito grande (300MB+),
    // e um JSON.parse síncrono aqui congela o event loop do processo no boot
    // (web server/API ficam sem responder durante minutos). O load roda em
    // background: o sistema arranca normal e isReady() devolve true quando
    // o grafo ficar disponível.
    setTimeout(() => {
      try {
        this.adapter.load();
        this.loaded = true;
        const g = this.adapter.getGraph();
        console.log(`[ArchitectureIntelligence] graph carregado em background (${g.nodes?.length || 0} nós / ${g.links?.length || 0} arestas)`);
      } catch (err: any) {
        this.loaded = false;
        console.warn(`[ArchitectureIntelligence] graph not available: ${err?.message || String(err)}`);
      }
    }, 0);
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
