import * as fs from "fs";
import * as path from "path";
import { ArchitectureGraphData, ArchitectureStats, ArchitectureNodeInfo, PathFindingResult, ImpactResult, GraphNode } from "./types";

export interface GraphifyAdapterOptions {
  graphPath?: string;
  maxBfs?: number;
}

const DEFAULT_GRAPH_PATH = "graphify-out/graph.json";

export class GraphifyAdapter {
  public readonly name = "GraphifyAdapter";
  private data?: ArchitectureGraphData;
  private readonly graphPath: string;
  private readonly maxBfs: number;

  constructor(options?: GraphifyAdapterOptions) {
    this.graphPath = options?.graphPath ?? DEFAULT_GRAPH_PATH;
    this.maxBfs = options?.maxBfs ?? 200;
  }

  public get loaded(): boolean {
    return !!this.data;
  }

  public load(): void {
    if (!fs.existsSync(this.graphPath)) {
      throw new Error(`[GraphifyAdapter] graph not found: ${this.graphPath}`);
    }
    const raw = fs.readFileSync(this.graphPath, "utf-8");
    this.data = JSON.parse(raw) as ArchitectureGraphData;
  }

  public getGraph(): ArchitectureGraphData {
    if (!this.data) this.load();
    return this.data!;
  }

  public stats(): ArchitectureStats {
    const g = this.getGraph();
    const degree = new Map<string, number>();
    for (const link of g.links) {
      degree.set(link.source, (degree.get(link.source) ?? 0) + 1);
      degree.set(link.target, (degree.get(link.target) ?? 0) + 1);
    }
    const topHubs = [...degree.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, d]) => ({ id, degree: d, file: this.nodeById(id)?.source_file }));
    const fileCoupling = new Map<string, number>();
    for (const link of g.links) {
      const sf = link.source_file;
      if (!sf) continue;
      const cross = this.isCrossFile(link);
      if (cross) fileCoupling.set(sf, (fileCoupling.get(sf) ?? 0) + 1);
    }
    const topCoupling = [...fileCoupling.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([file, crossFileLinks]) => ({ file, crossFileLinks }));
    const relationCounts: Record<string, number> = {};
    for (const link of g.links) relationCounts[link.relation] = (relationCounts[link.relation] ?? 0) + 1;
    return {
      nodes: g.nodes.length,
      links: g.links.length,
      directed: g.directed,
      builtAtCommit: g.built_at_commit,
      topHubs,
      topCoupling,
      relationCounts,
      communityCount: new Set(g.nodes.map((n) => n.community).filter((c) => c !== undefined)).size,
    };
  }

  public nodeById(id: string): GraphNode | undefined {
    return this.getGraph().nodes.find((n) => n.id === id);
  }

  public nodeInfo(id: string): ArchitectureNodeInfo | undefined {
    const g = this.getGraph();
    const node = this.nodeById(id);
    if (!node) return undefined;
    const neighbors = g.links
      .filter((l) => l.source === id || l.target === id)
      .map((l) => ({ id: l.source === id ? l.target : l.source, relation: l.relation }));
    return {
      id: node.id,
      label: node.label ?? node.id,
      file: node.source_file ?? node.id,
      community: node.community,
      degree: neighbors.length,
      neighbors,
    };
  }

  public search(term: string): GraphNode[] {
    const t = term.toLowerCase();
    return this.getGraph().nodes.filter(
      (n) => n.id.toLowerCase().includes(t) || (n.label?.toLowerCase().includes(t) ?? false)
    );
  }

  public pathBetween(from: string, to: string): PathFindingResult {
    const g = this.getGraph();
    if (!this.nodeById(from) || !this.nodeById(to)) return { found: false };
    if (from === to) return { found: true, path: [], hops: 0 };
    const adjacency = new Map<string, { id: string; relation: string }[]>();
    for (const link of g.links) {
      if (!adjacency.has(link.source)) adjacency.set(link.source, []);
      adjacency.get(link.source)!.push({ id: link.target, relation: link.relation });
      if (!g.directed) {
        if (!adjacency.has(link.target)) adjacency.set(link.target, []);
        adjacency.get(link.target)!.push({ id: link.source, relation: link.relation });
      }
    }
    const visited = new Set<string>([from]);
    const queue: { id: string; steps: { from: string; to: string; relation: string }[] }[] = [
      { id: from, steps: [] },
    ];
    while (queue.length > 0 && queue.length < this.maxBfs) {
      const current = queue.shift()!;
      for (const nb of adjacency.get(current.id) ?? []) {
        const nextSteps = [...current.steps, { from: current.id, to: nb.id, relation: nb.relation }];
        if (nb.id === to) return { found: true, path: nextSteps, hops: nextSteps.length };
        if (visited.has(nb.id)) continue;
        visited.add(nb.id);
        queue.push({ id: nb.id, steps: nextSteps });
      }
    }
    return { found: false };
  }

  public impact(subject: string, maxHops = 2): ImpactResult {
    const g = this.getGraph();
    const root = this.nodeById(subject) ?? this.search(subject)[0];
    if (!root) return { subject, affectedNodes: [], affectedFiles: [], immediateDependencies: [], maxHops };
    const affectedNodes: ImpactResult["affectedNodes"] = [];
    const visited = new Set<string>([root.id]);
    const queue: { id: string; hops: number }[] = [{ id: root.id, hops: 0 }];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.hops > 0 && current.hops <= maxHops) {
        const node = this.nodeById(current.id);
        if (node) affectedNodes.push({ id: current.id, label: node.label ?? current.id, via: current.hops === 1 ? "direct" : "indirect", hops: current.hops });
      }
      if (current.hops >= maxHops) continue;
      for (const link of g.links.filter((l) => l.source === current.id || l.target === current.id)) {
        const nb = link.source === current.id ? link.target : link.source;
        if (visited.has(nb)) continue;
        visited.add(nb);
        queue.push({ id: nb, hops: current.hops + 1 });
      }
    }
    const immediate = g.links
      .filter((l) => (l.source === root.id || l.target === root.id))
      .map((l) => (l.source === root.id ? l.target : l.source));
    const affectedFiles = [...new Set(affectedNodes.map((n) => this.nodeById(n.id)?.source_file).filter(Boolean))] as string[];
    return { subject: root.id, affectedNodes, affectedFiles, immediateDependencies: immediate, maxHops };
  }

  private isCrossFile(link: { source: string; target: string; source_file?: string }): boolean {
    const s = this.nodeById(link.source);
    const t = this.nodeById(link.target);
    if (!s?.source_file || !t?.source_file) return false;
    if (s.source_file === t.source_file) return false;
    if (s.source_file === link.source_file) return false;
    return true;
  }
}
