import * as fs from "fs";
import * as path from "path";

export interface GraphEntity {
  id: string;
  type: string;
  name: string;
  properties?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface GraphRelation {
  id: string;
  from: string;
  to: string;
  type: string;
  weight: number;
  properties?: Record<string, any>;
  createdAt: number;
}

export interface GraphPath {
  nodes: string[];
  relations: string[];
  weight: number;
}

export interface KnowledgeGraphStats {
  entities: number;
  relations: number;
  byType: Record<string, number>;
}

export class KnowledgeGraph {
  private entities = new Map<string, GraphEntity>();
  private relations = new Map<string, GraphRelation>();
  private adjacency = new Map<string, Map<string, string[]>>();
  private readonly filePath: string | null;

  constructor(options?: { filePath?: string }) {
    this.filePath = options?.filePath ?? null;
    if (this.filePath && fs.existsSync(this.filePath)) this.load();
  }

  public upsertEntity(id: string, type: string, name: string, properties?: Record<string, any>): GraphEntity {
    const now = Date.now();
    const existing = this.entities.get(id);
    const entity: GraphEntity = {
      id,
      type,
      name,
      properties,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.entities.set(id, entity);
    if (!this.adjacency.has(id)) this.adjacency.set(id, new Map());
    return entity;
  }

  public addRelation(from: string, to: string, type: string, weight = 1, properties?: Record<string, any>): GraphRelation {
    if (!this.entities.has(from)) throw new Error(`[KnowledgeGraph] Unknown entity "${from}"`);
    if (!this.entities.has(to)) throw new Error(`[KnowledgeGraph] Unknown entity "${to}"`);
    const rel: GraphRelation = {
      id: `rel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      from,
      to,
      type,
      weight,
      properties,
      createdAt: Date.now(),
    };
    this.relations.set(rel.id, rel);
    if (!this.adjacency.has(from)) this.adjacency.set(from, new Map());
    if (!this.adjacency.get(from)!.has(to)) this.adjacency.get(from)!.set(to, []);
    this.adjacency.get(from)!.get(to)!.push(rel.id);
    return rel;
  }

  public getEntity(id: string): GraphEntity | undefined {
    return this.entities.get(id);
  }

  public searchEntities(query: string, limit = 20): GraphEntity[] {
    const q = query.toLowerCase();
    const results: { entity: GraphEntity; score: number }[] = [];
    for (const entity of this.entities.values()) {
      let score = 0;
      if (entity.name.toLowerCase().includes(q)) score += 3;
      if (entity.type.toLowerCase().includes(q)) score += 1;
      if (entity.id.toLowerCase().includes(q)) score += 1;
      if (entity.properties) {
        for (const value of Object.values(entity.properties)) {
          if (typeof value === "string" && value.toLowerCase().includes(q)) score += 1;
        }
      }
      if (score > 0) results.push({ entity, score });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit).map((r) => r.entity);
  }

  public getNeighbors(entityId: string, relationType?: string): { entity: GraphEntity; relation: GraphRelation; direction: "out" | "in" }[] {
    const out = this.adjacency.get(entityId);
    const result: { entity: GraphEntity; relation: GraphRelation; direction: "out" | "in" }[] = [];
    if (out) {
      for (const [target, relIds] of out) {
        for (const relId of relIds) {
          const rel = this.relations.get(relId);
          if (!rel) continue;
          if (relationType && rel.type !== relationType) continue;
          const entity = this.entities.get(target);
          if (entity) result.push({ entity, relation: rel, direction: "out" });
        }
      }
    }
    for (const rel of this.relations.values()) {
      if (rel.to !== entityId) continue;
      if (relationType && rel.type !== relationType) continue;
      const entity = this.entities.get(rel.from);
      if (entity) result.push({ entity, relation: rel, direction: "in" });
    }
    return result;
  }

  public shortestPath(fromId: string, toId: string): GraphPath | null {
    if (!this.entities.has(fromId) || !this.entities.has(toId)) return null;
    if (fromId === toId) return { nodes: [fromId], relations: [], weight: 0 };
    const queue: { id: string; path: { nodes: string[]; relations: string[]; weight: number } }[] = [
      { id: fromId, path: { nodes: [fromId], relations: [], weight: 0 } },
    ];
    const visited = new Set<string>([fromId]);
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.getNeighbors(current.id);
      for (const n of neighbors) {
        if (visited.has(n.entity.id)) continue;
        visited.add(n.entity.id);
        const nextPath = {
          nodes: [...current.path.nodes, n.entity.id],
          relations: [...current.path.relations, n.relation.id],
          weight: current.path.weight + n.relation.weight,
        };
        if (n.entity.id === toId) return nextPath;
        queue.push({ id: n.entity.id, path: nextPath });
      }
    }
    return null;
  }

  public getStats(): KnowledgeGraphStats {
    const byType: Record<string, number> = {};
    for (const entity of this.entities.values()) {
      byType[entity.type] = (byType[entity.type] || 0) + 1;
    }
    return { entities: this.entities.size, relations: this.relations.size, byType };
  }

  public save(): void {
    if (!this.filePath) return;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const payload = { entities: Array.from(this.entities.values()), relations: Array.from(this.relations.values()) };
    fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), "utf-8");
  }

  public load(): void {
    if (!this.filePath || !fs.existsSync(this.filePath)) return;
    try {
      const payload = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      this.entities.clear();
      this.relations.clear();
      this.adjacency.clear();
      for (const entity of payload.entities ?? []) {
        this.entities.set(entity.id, entity);
        if (!this.adjacency.has(entity.id)) this.adjacency.set(entity.id, new Map());
      }
      for (const rel of payload.relations ?? []) {
        this.relations.set(rel.id, rel);
        if (!this.adjacency.has(rel.from)) this.adjacency.set(rel.from, new Map());
        if (!this.adjacency.get(rel.from)!.has(rel.to)) this.adjacency.get(rel.from)!.set(rel.to, []);
        this.adjacency.get(rel.from)!.get(rel.to)!.push(rel.id);
      }
    } catch (err: any) {
      console.warn(`[KnowledgeGraph] Failed to load graph from ${this.filePath}: ${err.message}`);
    }
  }
}
