import { GraphifyAdapter } from "./GraphifyAdapter";
import { GraphNode } from "./types";

export interface ContextBundle {
  subject?: string;
  nodes: { id: string; label: string; file?: string }[];
  files: string[];
  reason: string;
  builtAtCommit?: string;
}

export const PROVENANCE = {
  origin: "VISERON",
  orchestrator: "Pedro-Trinnity",
  squad: "AIOX",
  kernel: "OMEGA",
  source: "graphify",
} as const;

export class ContextBuilder {
  constructor(private readonly adapter: GraphifyAdapter) {}

  public forSubject(term: string, maxNodes = 30): ContextBundle {
    const hits = this.adapter.search(term);
    const root = hits[0];
    if (!root) {
      return { nodes: [], files: [], reason: `no nodes matched "${term}"`, builtAtCommit: this.adapter.stats().builtAtCommit };
    }
    const impact = this.adapter.impact(root.id, 1);
    const nodes = [root, ...impact.affectedNodes.map((n) => this.adapter.nodeById(n.id)).filter((n): n is GraphNode => !!n)]
      .slice(0, maxNodes)
      .map((n) => ({ id: n.id, label: n.label ?? n.id, file: n.source_file }));
    const files = [...new Set(nodes.map((n) => n.file).filter((f): f is string => !!f))].slice(0, 20);
    return {
      subject: root.id,
      nodes,
      files,
      reason: `subgraph of ${nodes.length} nodes around "${root.id}" (1 hop)`,
      builtAtCommit: this.adapter.stats().builtAtCommit,
    };
  }

  public forFiles(filePaths: string[], maxNodes = 30): ContextBundle {
    const g = this.adapter.getGraph();
    const nodeIds = new Set<string>();
    for (const file of filePaths) {
      for (const n of g.nodes) {
        if (n.source_file === file) nodeIds.add(n.id);
      }
    }
    if (nodeIds.size === 0) {
      return { nodes: [], files: filePaths.slice(0, 20), reason: `no graph nodes for provided files`, builtAtCommit: this.adapter.stats().builtAtCommit };
    }
    const roots = [...nodeIds];
    const nodes: { id: string; label: string; file?: string }[] = [];
    const seen = new Set<string>();
    for (const root of roots) {
      const impact = this.adapter.impact(root, 1);
      const cluster = [root, ...impact.affectedNodes.map((n) => n.id)]
        .filter((id) => !seen.has(id))
        .slice(0, Math.max(4, maxNodes - nodes.length));
      for (const id of cluster) {
        seen.add(id);
        const node = this.adapter.nodeById(id);
        if (node) nodes.push({ id: node.id, label: node.label ?? node.id, file: node.source_file });
        if (nodes.length >= maxNodes) break;
      }
      if (nodes.length >= maxNodes) break;
    }
    const files = [...new Set([...filePaths, ...nodes.map((n) => n.file).filter((f): f is string => !!f)])].slice(0, 20);
    return { nodes, files, reason: `subgraph of ${nodes.length} nodes around ${roots.length} provided files`, builtAtCommit: this.adapter.stats().builtAtCommit };
  }
}
