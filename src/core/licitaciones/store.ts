import fs from "fs";
import path from "path";

// TVS — LICITACIONES OS · Monitorização de concursos públicos (PLACSP)
// data/licitaciones/: licitaciones.json · audit.jsonl

export type LicitacionStatus =
  | "vigilancia"      // descoberta, ainda não decidida
  | "estudio"         // pliegos em análise
  | "preparacion"     // a preparar oferta
  | "presentada"      // oferta entregue
  | "adjudicada"      // ganha
  | "perdida"
  | "archivada";

export interface ChecklistItem {
  done: boolean;
  task: string;
}

export interface Licitacion {
  id: string;
  name: string;
  organ: string;
  url?: string;
  budget: number;
  deadline: string;
  status: LicitacionStatus;
  phases: string[];
  checklist: ChecklistItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function newLicitacionId(): string {
  return `lic_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export class LicitacionStore {
  private dir: string;
  private items: Licitacion[] = [];
  private audit: string[] = [];

  constructor(dataDir: string) {
    this.dir = path.join(dataDir, "licitaciones");
    fs.mkdirSync(this.dir, { recursive: true });
    try {
      const p = path.join(this.dir, "licitaciones.json");
      if (fs.existsSync(p)) this.items = JSON.parse(fs.readFileSync(p, "utf8")) as Licitacion[];
    } catch (e) {
      console.error(`[licitaciones] erro a ler:`, (e as Error).message);
    }
    try {
      const p = path.join(this.dir, "audit.jsonl");
      if (fs.existsSync(p)) this.audit = fs.readFileSync(p, "utf8").split("\n").filter(Boolean).slice(-300);
    } catch {
      this.audit = [];
    }
    this.seed();
  }

  private persist(): void {
    fs.writeFileSync(path.join(this.dir, "licitaciones.json"), JSON.stringify(this.items, null, 2));
  }

  private logAudit(event: string, meta: Record<string, unknown>): void {
    const line = JSON.stringify({ at: new Date().toISOString(), event, ...meta });
    this.audit.push(line);
    fs.appendFileSync(path.join(this.dir, "audit.jsonl"), line + "\n");
    if (this.audit.length > 300) this.audit = this.audit.slice(-300);
  }

  // Semear a licitação Vadillos (Somacyl) — primeiro alvo operativo
  private seed(): void {
    if (this.items.some((l) => l.id === "lic_vadillos_2026")) return;
    const now = new Date().toISOString();
    this.items.push({
      id: "lic_vadillos_2026",
      name: "Antiguo Cuartel de Vadillos — 48 viviendas protegidas para jóvenes",
      organ: "Somacyl (Junta de Castilla y León)",
      url: "https://contrataciondelestado.es (buscar: Somacyl · Vadillos · 48 viviendas)",
      budget: 6107038.3,
      deadline: "2026-09-14T14:00:00Z",
      status: "vigilancia",
      phases: [
        "Día 1-3 · Pliegos + PCAP + visita parcela",
        "Día 4-6 · UTE + consultas ao órgão",
        "Día 7-12 · Memória técnica (BIM, social, ambiental)",
        "Día 13-16 · Custos + baixa ótima",
        "Día 17-20 · Sobre económico + revisão jurídica",
        "Día 21-23 · Auto-auditoria anti-exclusão",
        "Día 24-25 · Apresentação antecipada",
        "Día 26 · Seguimento da mesa",
      ],
      checklist: [
        { done: false, task: "Descargar PCAP + PPT + proyecto básico (Plataforma Contratación)" },
        { done: false, task: "Extraer criterios de adjudicación + fórmula de temeridad" },
        { done: false, task: "Verificar clasificación exigida (C-2 edificaciones) / solvencia" },
        { done: false, task: "Visitar parcela (plaza de Vadillos / calle Silió 7)" },
        { done: false, task: "Enviar consultas al órgano de contratación" },
        { done: false, task: "Decidir UTE / equipo (constructora + consultora + local)" },
        { done: false, task: "Redactar oferta técnica: BIM + industrialización + ambiental + social" },
        { done: false, task: "Costear obra (€1.100-1.200/m²) + baja óptima" },
        { done: false, task: "Auto-auditoría del sobre (anti-exclusión)" },
        { done: false, task: "Presentar antes de las 14:00 del 14/09/2026" },
      ],
      notes: "Contrato mixto consultoría + obra · 23 meses (3 consultoría + 20 obra) · Demolición adjudicada a Erri-Berri · Calificación energética A exigida.",
      createdAt: now,
      updatedAt: now,
    });
    this.persist();
    this.logAudit("seed.vadillos", { id: "lic_vadillos_2026", budget: 6107038.3, deadline: "2026-09-14" });
  }

  list(): Licitacion[] {
    return this.items.sort((a, b) => a.deadline.localeCompare(b.deadline));
  }

  get(id: string): Licitacion | undefined {
    return this.items.find((l) => l.id === id);
  }

  add(input: Omit<Licitacion, "id" | "createdAt" | "updatedAt">): Licitacion {
    const now = new Date().toISOString();
    const item: Licitacion = {
      ...input,
      id: newLicitacionId(),
      checklist: input.checklist ?? [],
      phases: input.phases ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(item);
    this.persist();
    this.logAudit("licitacion.added", { id: item.id, name: item.name });
    return item;
  }

  update(id: string, patch: Partial<Licitacion>): Licitacion | undefined {
    const l = this.get(id);
    if (!l) return undefined;
    Object.assign(l, patch, { updatedAt: new Date().toISOString() });
    this.persist();
    this.logAudit("licitacion.updated", { id, patch: Object.keys(patch) });
    return l;
  }

  remove(id: string): boolean {
    const i = this.items.findIndex((l) => l.id === id);
    if (i < 0) return false;
    this.items.splice(i, 1);
    this.persist();
    this.logAudit("licitacion.removed", { id });
    return true;
  }

  toggleChecklist(id: string, index: number): Licitacion | undefined {
    const l = this.get(id);
    if (!l || !l.checklist[index]) return undefined;
    l.checklist[index].done = !l.checklist[index].done;
    this.update(id, { checklist: l.checklist });
    return l;
  }

  daysLeft(l: Licitacion): number {
    return Math.ceil((new Date(l.deadline).getTime() - Date.now()) / 86400000);
  }

  status(): { total: number; byStatus: Record<string, number>; urgent: Licitacion[]; active: number } {
    const byStatus: Record<string, number> = {};
    const urgent: Licitacion[] = [];
    for (const l of this.items) {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      const dl = this.daysLeft(l);
      if (dl >= 0 && dl <= 30 && l.status !== "adjudicada" && l.status !== "perdida" && l.status !== "archivada") urgent.push(l);
    }
    return {
      total: this.items.length,
      byStatus,
      urgent,
      active: this.items.filter((l) => ["vigilancia", "estudio", "preparacion", "presentada"].includes(l.status)).length,
    };
  }

  auditLog(): Array<Record<string, unknown>> {
    return this.audit.map((l) => {
      try { return JSON.parse(l); } catch { return { raw: l }; }
    });
  }
}