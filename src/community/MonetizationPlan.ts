import { MemoryEngine } from "../core/memory/MemoryEngine";

export interface RevenueStream {
  name: string;
  type: "subscription" | "token" | "marketplace" | "service" | "advertising";
  projectedDailyRevenue: number;
  projectedMonthlyRevenue: number;
  setupCost: number;
  timeToRevenue: number;
  description: string;
  status: "active" | "pending" | "planned";
}

export interface DailyTarget {
  day: number;
  revenue: number;
  cumulative: number;
  actions: string[];
  milestone?: string;
}

export class MonetizationPlan {
  private memory: MemoryEngine;
  private revenueLog: { date: number; amount: number; source: string }[] = [];

  static readonly REVENUE_STREAMS: RevenueStream[] = [
    {
      name: "Premium Subscriptions", type: "subscription",
      projectedDailyRevenue: 1500, projectedMonthlyRevenue: 45000,
      setupCost: 500, timeToRevenue: 1,
      description: "Planes Premium ($29/mo) y VIP ($99/mo) con acceso ilimitado a todos los modelos de IA",
      status: "pending",
    },
    {
      name: "$TRIN Token Sales", type: "token",
      projectedDailyRevenue: 5000, projectedMonthlyRevenue: 150000,
      setupCost: 2000, timeToRevenue: 3,
      description: "Venta inicial de tokens $TRIN con bonus por early adopters. Precio: $0.01/TRIN",
      status: "pending",
    },
    {
      name: "AI Agent Marketplace", type: "marketplace",
      projectedDailyRevenue: 3000, projectedMonthlyRevenue: 90000,
      setupCost: 1000, timeToRevenue: 5,
      description: "Comisión 15% en cada transacción del marketplace de agentes de IA",
      status: "pending",
    },
    {
      name: "Enterprise AI Consulting", type: "service",
      projectedDailyRevenue: 2000, projectedMonthlyRevenue: 60000,
      setupCost: 0, timeToRevenue: 2,
      description: "Consultoría empresarial: implementación de IA en empresas ($5,000-50,000/proyecto)",
      status: "pending",
    },
    {
      name: "API Access - Developers", type: "subscription",
      projectedDailyRevenue: 2500, projectedMonthlyRevenue: 75000,
      setupCost: 1500, timeToRevenue: 4,
      description: "API Bridge para desarrolladores: $99/mo (50k requests) o $499/mo (ilimitado)",
      status: "pending",
    },
    {
      name: "AI Model Comparison Tool", type: "advertising",
      projectedDailyRevenue: 500, projectedMonthlyRevenue: 15000,
      setupCost: 300, timeToRevenue: 7,
      description: "Herramienta pública de comparación de modelos IA con afiliados y sponsors",
      status: "pending",
    },
    {
      name: "White Label AI Platform", type: "service",
      projectedDailyRevenue: 8000, projectedMonthlyRevenue: 240000,
      setupCost: 5000, timeToRevenue: 10,
      description: "Plataforma white-label para empresas: $10,000 setup + $2,000/mes. Meta: 10 clientes",
      status: "planned",
    },
    {
      name: "AI Training & Workshops", type: "service",
      projectedDailyRevenue: 1000, projectedMonthlyRevenue: 30000,
      setupCost: 200, timeToRevenue: 3,
      description: "Workshops online: $200/persona. Cursos corporativos: $5,000-15,000",
      status: "pending",
    },
    {
      name: "Staking & DeFi Pool", type: "token",
      projectedDailyRevenue: 2000, projectedMonthlyRevenue: 60000,
      setupCost: 3000, timeToRevenue: 7,
      description: "Staking pool con 12% APY para holders de $TRIN. Comisión de gestión 2%",
      status: "planned",
    },
    {
      name: "Sponsored AI Agents", type: "advertising",
      projectedDailyRevenue: 300, projectedMonthlyRevenue: 9000,
      setupCost: 100, timeToRevenue: 5,
      description: "Agentes de IA patrocinados por marcas en la comunidad ($500-5,000/agente/mes)",
      status: "planned",
    },
  ];

  static readonly EMERGENCY_SCALE_ACTIONS = [
    "Day 1-5: Lanzar token $TRIN con presale privada (meta: $50,000)",
    "Day 1-7: Activar suscripciones Premium/VIP (meta: 100 usuarios = $2,900/día)",
    "Day 3-10: Vender 3 proyectos enterprise (meta: $75,000)",
    "Day 5-15: Marketplace de agentes con 50 creadores (meta: $1,500/día en comisiones)",
    "Day 7-20: API Bridge para developers (meta: 50 suscriptores = $4,950/día)",
    "Day 10-25: White Label para 5 empresas (meta: $60,000)",
    "Day 15-30: Escalar a 1000+ suscriptores + 20 empresas (meta: $50,000+/día)",
  ];

  static readonly DAY_30_PLAN: DailyTarget[] = [];

  constructor(memory?: MemoryEngine) {
    this.memory = memory || new MemoryEngine();
    this.generateDayPlan();
  }

  private generateDayPlan(): void {
    if (MonetizationPlan.DAY_30_PLAN.length > 0) return;

    const plan: DailyTarget[] = [];
    let cumulative = 0;

    const phases = [
      { days: 3, dailyRate: 500, label: "Seed & Presale" },
      { days: 4, dailyRate: 2000, label: "Subscriptions Launch" },
      { days: 7, dailyRate: 8000, label: "Marketplace + API" },
      { days: 6, dailyRate: 20000, label: "Enterprise Deals" },
      { days: 5, dailyRate: 40000, label: "White Label Scaling" },
      { days: 5, dailyRate: 70000, label: "Mass Adoption" },
    ];

    let day = 1;
    for (const phase of phases) {
      for (let i = 0; i < phase.days && day <= 30; i++) {
        cumulative += phase.dailyRate;
        plan.push({
          day, revenue: phase.dailyRate, cumulative,
          actions: this.getActionsForDay(day, phase.label),
          milestone: [7, 14, 21, 30].includes(day) ? this.getMilestone(day, cumulative) : undefined,
        });
        day++;
      }
    }
    MonetizationPlan.DAY_30_PLAN.push(...plan);
  }

  private getActionsForDay(day: number, phase: string): string[] {
    if (day <= 3) return ["Configurar token $TRIN", "Presale privada a inversores", "Pre-vender suscripciones enterprise"];
    if (day <= 7) return ["Lanzar plataforma comunidad", "Activar pagos Stripe/PayPal", "Onboarding primeros 100 usuarios"];
    if (day <= 14) return ["Abrir marketplace agentes", "Lanzar API Bridge pública", "Campaign marketing agresiva"];
    if (day <= 20) return ["Cerrar deals enterprise", "Workshops IA empresas", "Programa referidos 20% comisión"];
    if (day <= 25) return ["White Label deployments", "Expansión internacional", "Partnerships estratégicos"];
    return ["Escalar infraestructura", "Optimizar conversión", "Meta: $1,000,000 alcanzado"];
  }

  private getMilestone(day: number, cumulative: number): string {
    if (day === 7) return `Día 7: $${cumulative.toLocaleString()} - Comunidad activa y token listo`;
    if (day === 14) return `Día 14: $${cumulative.toLocaleString()} - Marketplace + API generando ingresos`;
    if (day === 21) return `Día 21: $${cumulative.toLocaleString()} - Clientes enterprise onboarded`;
    if (day === 30) return `DÍA 30: $${cumulative.toLocaleString()} - OBJETIVO $1,000,000 ALCANZADO 🚀`;
    return "";
  }

  getRevenueStreams(): RevenueStream[] { return MonetizationPlan.REVENUE_STREAMS; }

  getTotalProjectedMonthly(): number {
    return MonetizationPlan.REVENUE_STREAMS.reduce((a, s) => a + s.projectedMonthlyRevenue, 0);
  }

  getTotalProjectedDaily(): number {
    return MonetizationPlan.REVENUE_STREAMS.reduce((a, s) => a + s.projectedDailyRevenue, 0);
  }

  getDay30Plan(): DailyTarget[] { return MonetizationPlan.DAY_30_PLAN; }

  activateStream(name: string): boolean {
    const stream = MonetizationPlan.REVENUE_STREAMS.find(s => s.name === name);
    if (!stream) return false;
    stream.status = "active";
    this.memory.addKnowledge(`Revenue stream active: ${name}`, "MONETIZATION",
      `${name} activated. Projected $${stream.projectedDailyRevenue}/day`, ["revenue", name]);
    return true;
  }

  logRevenue(amount: number, source: string): void {
    this.revenueLog.push({ date: Date.now(), amount, source });
    this.memory.addKnowledge(`Revenue: $${amount} from ${source}`, "REVENUE_LOG",
      `$${amount} - ${source}`, ["revenue", "log"]);
  }

  getTotalRevenue(): number {
    return this.revenueLog.reduce((a, r) => a + r.amount, 0);
  }

  getRevenueBySource(): Record<string, number> {
    const bySource: Record<string, number> = {};
    for (const r of this.revenueLog) {
      bySource[r.source] = (bySource[r.source] || 0) + r.amount;
    }
    return bySource;
  }

  generateReport(): string {
    const streams = MonetizationPlan.REVENUE_STREAMS;
    const daily = (stream: RevenueStream) => stream.status === "active" ? stream.projectedDailyRevenue : 0;
    const activeDailyTotal = streams.reduce((a, s) => a + daily(s), 0);
    const monthlyTotal = this.getTotalProjectedMonthly();

    return [
      "╔══════════════════════════════════════════════════════════════╗",
      "║     TRINNITY VISERON - PLAN $1M EN 30 DÍAS                ║",
      "╠══════════════════════════════════════════════════════════════╣",
      ...streams.map(s =>
        `║  ${s.status === "active" ? "✅" : "⏳"} ${s.name.padEnd(32)} $${s.projectedDailyRevenue.toString().padStart(6)}/día`
      ),
      "╠══════════════════════════════════════════════════════════════╣",
      `║  TOTAL PROYECTADO DÍA: $${activeDailyTotal.toLocaleString().padStart(8)}/día            ║`,
      `║  TOTAL PROYECTADO MES: $${monthlyTotal.toLocaleString().padStart(8)}/mes            ║`,
      "╠══════════════════════════════════════════════════════════════╣",
      `║  Fecha inicio: ${new Date().toLocaleDateString()}                              ║`,
      `║  Meta día 30: $1,000,000 USD                                 ║`,
      `║  Revenue actual: $${this.getTotalRevenue().toLocaleString()}                                   ║`,
      "╚══════════════════════════════════════════════════════════════╝",
    ].join("\n");
  }
}

export class MillionDollarEngine {
  private plan: MonetizationPlan;
  private memory: MemoryEngine;

  constructor(plan: MonetizationPlan, memory?: MemoryEngine) {
    this.plan = plan;
    this.memory = memory || new MemoryEngine();
  }

  getDailyActionPlan(day: number): string {
    const target = this.plan.getDay30Plan().find(d => d.day === day);
    if (!target) return `Day ${day}: Continue scaling operations`;

    return [
      `\n═══════════════════════════════════════`,
      `   DÍA ${day} - META: $${target.revenue.toLocaleString()} (Acum: $${target.cumulative.toLocaleString()})`,
      `═══════════════════════════════════════`,
      ...target.actions.map(a => `   ▶ ${a}`),
      target.milestone ? `\n   🏆 ${target.milestone}` : "",
      `\n═══════════════════════════════════════\n`,
    ].join("\n");
  }

  getRevenuePace(): { current: number; target: number; gap: number; pace: "ahead" | "behind" | "on-track" } {
    const totalTarget = 1000000;
    const daysElapsed = Math.min(30, Math.floor((Date.now() - new Date(Date.now() - 1 * 86400000).getTime()) / 86400000) + 1);
    const expectedByNow = this.plan.getDay30Plan().find(d => d.day === daysElapsed)?.cumulative || 0;
    const currentRevenue = this.plan.getTotalRevenue();
    const gap = expectedByNow - currentRevenue;
    let pace: "ahead" | "behind" | "on-track";
    if (Math.abs(gap) < totalTarget * 0.1) pace = "on-track";
    else if (gap < 0) pace = "ahead";
    else pace = "behind";

    return { current: currentRevenue, target: expectedByNow, gap, pace };
  }

  getPriorityStreams(): RevenueStream[] {
    return this.plan.getRevenueStreams()
      .filter(s => s.status !== "active")
      .sort((a, b) => a.timeToRevenue - b.timeToRevenue)
      .sort((a, b) => b.projectedDailyRevenue - a.projectedDailyRevenue);
  }
}
