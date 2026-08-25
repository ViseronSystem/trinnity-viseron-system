import { TVSLineage, TVSLineageEntry } from "./types";

export interface LineageNode {
  id: string;
  name: string;
  rank: string;
  line: TVSLineage;
  depth: number;
  parent: string | null;
  children: string[];
}

export class LineageTracker {
  private nodes: Map<string, LineageNode> = new Map();
  private roots: string[] = [];

  constructor() {
    this.addNode("trinnity-hurtado", "Trinnity Hurtado", "reina", "corona", null);
    this.addNode("pedro-costa", "Pedro Costa", "capitan", "hierro", null);
  }

  addNode(id: string, name: string, rank: string, line: TVSLineage, parent: string | null): LineageNode {
    const depth = parent ? (this.nodes.get(parent)?.depth ?? 0) + 1 : 0;
    const node: LineageNode = { id, name, rank, line, depth, parent, children: [] };
    this.nodes.set(id, node);
    if (parent) {
      this.nodes.get(parent)?.children.push(id);
    } else {
      this.roots.push(id);
    }
    return node;
  }

  getNode(id: string): LineageNode | undefined {
    return this.nodes.get(id);
  }

  getChildren(id: string): LineageNode[] {
    const node = this.nodes.get(id);
    if (!node) return [];
    return node.children.map(c => this.nodes.get(c)!).filter(Boolean);
  }

  getLineage(id: string): LineageNode[] {
    const chain: LineageNode[] = [];
    let current = this.nodes.get(id);
    while (current) {
      chain.unshift(current);
      current = current.parent ? this.nodes.get(current.parent) : undefined;
    }
    return chain;
  }

  isDescendantOf(id: string, ancestorId: string): boolean {
    const lineage = this.getLineage(id);
    return lineage.some(n => n.id === ancestorId);
  }

  getRoots(): LineageNode[] {
    return this.roots.map(r => this.nodes.get(r)!).filter(Boolean);
  }

  getAll(): LineageNode[] {
    return Array.from(this.nodes.values());
  }

  countByLine(line: TVSLineage): number {
    return Array.from(this.nodes.values()).filter(n => n.line === line).length;
  }
}
