import fs from "fs";
import path from "path";

export interface FounderDailyInput {
  sleepQuality?: number;
  energy?: number;
  focus?: number;
  stress?: number;
  availableHours?: number;
  date?: string;
}

export interface FounderMission {
  mission: number;
  result: string;
  why: string;
  estimatedMinutes: number;
  definitionOfDone: string;
}

export interface FounderDailyPlan {
  date: string;
  dayOfWeek: string;
  weekNumber: number;
  schedule: string[];
  top3: FounderMission[];
  deepWork: { blocks: number; totalMinutes: number };
  exercise: { type: string; minutes: number };
  learning: { topic: string; language: string; minutes: number };
  personal: { protectedTime: string };
  energyBaseline: FounderDailyInput;
  delegateToViseron: string[];
  biggestRisk: string;
  biggestOpportunity: string;
  successCriteria: string;
  founderRule: string;
}

export interface WeeklyReview {
  weekStart: string;
  weekEnd: string;
  accomplished: string[];
  producedValue: string[];
  producedNoValue: string[];
  delegated: string[];
  shouldAutomate: string[];
  shouldViseronLearn: string[];
  shouldStopDoing: string[];
  shouldStartDoing: string[];
  biggestBottleneck: string;
  highestLeverageAction: string;
}

export interface MonthlyReview {
  month: string;
  year: number;
  health: string;
  energy: string;
  workHours: number;
  deepWorkHours: number;
  projectsCompleted: number;
  revenue: string;
  customers: string;
  productProgress: string;
  viseronCapabilities: string;
  learning: string;
  languages: string;
  relationships: string;
  finance: string;
  ip: string;
  risks: string;
  comparisonVsPrevious: string;
}

export interface FounderKPIs {
  life: {
    sleepConsistency: string;
    exerciseConsistency: string;
    recovery: string;
    stress: string;
    personalTime: string;
  };
  execution: {
    highValueHours: number;
    deepWorkHours: number;
    projectsCompleted: number;
    tasksDelegated: number;
    automationRatio: string;
  };
  company: {
    productProgress: string;
    customers: number;
    revenue: string;
    experiments: number;
    partnerships: string;
    ip: string;
  };
  viseron: {
    capabilitiesProven: number;
    agentsUtilized: number;
    squadsUtilized: number;
    tasksExecuted: number;
    successfulExecutions: number;
    learningRecords: number;
    reusableExperience: number;
    throughput: string;
  };
}

export interface FounderStatus {
  sleep: string;
  energy: string;
  focus: string;
  stress: string;
  availableHours: string;
  top3: string[];
  viseronObjective: string;
  businessObjective: string;
  learningTopic: string;
  languageSession: string;
  exerciseSession: string;
  personalTime: string;
  biggestRisk: string;
  biggestOpportunity: string;
  delegateToViseron: string[];
  successCriteria: string;
}

const FOUNDER_NAME = "Pedro Costa";
const FOUNDER_TITLE = "CEO & Founder, Trinnity Viseron System";

const DEEP_WORK_SLOTS = [
  { label: "DEEP WORK #1 — Engineering / Architecture", start: "09:00", end: "11:00" },
  { label: "DEEP WORK #2 — VISERON Core / AIOX", start: "11:15", end: "13:00" },
  { label: "DEEP WORK #3 — Research / Innovation", start: "15:00", end: "16:30" },
];

const WEEKLY_LEARNING_TOPICS = [
  "AI Systems & Agent Architecture",
  "Distributed Systems & Scalability",
  "Robotics & Physical Intelligence",
  "Mathematics & Algorithms",
  "Business Strategy & Fundraising",
  "Space Systems & Aerospace",
  "Leadership & Negotiation",
];

const EXERCISE_TEMPLATES = [
  "Walk + Mobility (45 min)",
  "Strength + Cardio (60 min)",
  "Walk + Stretch (30 min)",
  "HIIT + Mobility (45 min)",
  "Recovery: Light walk + stretching (30 min)",
  "Cardio + Core (50 min)",
];

export class FounderAgent {
  private dataDir: string;
  private planDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.planDir = path.join(dataDir, "founder");
    if (!fs.existsSync(this.planDir)) {
      fs.mkdirSync(this.planDir, { recursive: true });
    }
  }

  generateDailyPlan(input: FounderDailyInput = {}): FounderDailyPlan {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const dayOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][now.getDay()];
    const weekNumber = this.getWeekNumber(now);

    const energy = input.energy ?? 7;
    const focus = input.focus ?? 7;
    const hours = input.availableHours ?? 10;

    const top3 = this.selectTop3Missions(energy, focus);
    const deepWorkBlocks = energy >= 6 ? 3 : energy >= 4 ? 2 : 1;
    const exerciseTemplate = this.selectExercise(energy, dayOfWeek);

    const schedule = this.buildSchedule(energy, hours, deepWorkBlocks, dayOfWeek);

    const plan: FounderDailyPlan = {
      date: dateStr,
      dayOfWeek,
      weekNumber,
      schedule,
      top3,
      deepWork: { blocks: deepWorkBlocks, totalMinutes: deepWorkBlocks * 105 },
      exercise: { type: exerciseTemplate, minutes: exerciseTemplate.includes("60") ? 60 : exerciseTemplate.includes("45") ? 45 : 30 },
      learning: {
        topic: this.pickLearningTopic(now),
        language: "Inglés (business vocabulary)",
        minutes: 30,
      },
      personal: { protectedTime: "21:00–23:00 — familia, descanso, reflexión" },
      energyBaseline: input,
      delegateToViseron: [
        "AIOX: monitoriza builds, tests e deploys automáticamente",
        "JARVIS: responde a preguntas de clientes/leads (agency + support)",
        "Content Agent: genera y publica contenido automático",
      ],
      biggestRisk: "Perder foco en productos que generan revenue",
      biggestOpportunity: "VISERON Enterprise — automatización para empresas",
      successCriteria: `3 missions completadas · ${deepWorkBlocks} bloques deep work · ejercicio hecho · aprendizaje registrado`,
      founderRule: "No confundir actividad con progreso. Medir resultados, no horas.",
    };

    this.savePlan(plan);
    return plan;
  }

  generateWeeklyReview(): WeeklyReview {
    const plans = this.loadRecentPlans(7);
    const accomplished = plans.map((p) => `[${p.date}] ${p.top3[0]?.result || "sin registro"}`);

    return {
      weekStart: plans[0]?.date || "",
      weekEnd: plans[plans.length - 1]?.date || "",
      accomplished,
      producedValue: ["Evaluar: qué generó revenue, usuarios o capacidades nuevas"],
      producedNoValue: ["Identificar: reuniones innecesarias, tareas delegables, distracciones"],
      delegated: plans.flatMap((p) => p.delegateToViseron || []),
      shouldAutomate: ["Reportes semanales", "Seguimiento de leads", "Publicación de blog"],
      shouldViseronLearn: ["Patrones de éxito/fracaso de la semana", "Nuevos comandos de usuario frecuentes"],
      shouldStopDoing: ["Tareas que VISERON/AIOX ya puede ejecutar con seguridad"],
      shouldStartDoing: ["Una capacidad nueva que desbloquee la siguiente fase"],
      biggestBottleneck: "Evaluar: tiempo, energía, conocimiento, dinero, foco, equipo, tecnología, ventas",
      highestLeverageAction: "Definir la UNICA acción de mayor impacto para la próxima semana",
    };
  }

  generateMonthlyReview(): MonthlyReview {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const now = new Date();
    return {
      month: monthNames[now.getMonth()],
      year: now.getFullYear(),
      health: "Evaluar: consistencia de ejercicio, calidad de sueño, estrés, recuperación",
      energy: "Tendencia mensual de energía (1-10)",
      workHours: 0,
      deepWorkHours: 0,
      projectsCompleted: 0,
      revenue: "",
      customers: "",
      productProgress: "",
      viseronCapabilities: "",
      learning: "",
      languages: "",
      relationships: "",
      finance: "",
      ip: "",
      risks: "",
      comparisonVsPrevious: "Comparar con el mes anterior en cada categoría",
    };
  }

  generateKPIs(): FounderKPIs {
    return {
      life: {
        sleepConsistency: "Objetivo: 7-8h, mismo horario ±30 min",
        exerciseConsistency: "Objetivo: 5-6 días/semana",
        recovery: "Al menos 1 día completo de descanso por semana",
        stress: "Monitorizar: < 5 es saludable",
        personalTime: "Mínimo 2h/día protegidas",
      },
      execution: {
        highValueHours: 0,
        deepWorkHours: 0,
        projectsCompleted: 0,
        tasksDelegated: 0,
        automationRatio: "Objetivo: >50% de tareas delegadas/automatizadas",
      },
      company: {
        productProgress: "",
        customers: 0,
        revenue: "",
        experiments: 0,
        partnerships: "",
        ip: "",
      },
      viseron: {
        capabilitiesProven: 0,
        agentsUtilized: 0,
        squadsUtilized: 0,
        tasksExecuted: 0,
        successfulExecutions: 0,
        learningRecords: 0,
        reusableExperience: 0,
        throughput: "",
      },
    };
  }

  getStatus(): FounderStatus {
    const plan = this.generateDailyPlan();
    return {
      sleep: `${plan.energyBaseline.sleepQuality ?? "—"}/10`,
      energy: `${plan.energyBaseline.energy ?? "—"}/10`,
      focus: `${plan.energyBaseline.focus ?? "—"}/10`,
      stress: `${plan.energyBaseline.stress ?? "—"}/10`,
      availableHours: `${plan.energyBaseline.availableHours ?? "—"}h`,
      top3: plan.top3.map((m) => `M${m.mission}: ${m.result}`),
      viseronObjective: plan.top3.find((m) => m.result.toLowerCase().includes("viseron") || m.result.toLowerCase().includes("ai"))?.result || "Capacidad del día",
      businessObjective: plan.top3.find((m) => m.result.toLowerCase().includes("cliente") || m.result.toLowerCase().includes("revenue"))?.result || "Objetivo del día",
      learningTopic: plan.learning.topic,
      languageSession: plan.learning.language,
      exerciseSession: plan.exercise.type,
      personalTime: plan.personal.protectedTime,
      biggestRisk: plan.biggestRisk,
      biggestOpportunity: plan.biggestOpportunity,
      delegateToViseron: plan.delegateToViseron,
      successCriteria: plan.successCriteria,
    };
  }

  private selectTop3Missions(energy: number, focus: number): FounderMission[] {
    const missions: FounderMission[] = [
      {
        mission: 1,
        result: "VISERON: Avanzar una capacidad crítica (agent execution / knowledge ingestion / enterprise feature)",
        why: "Cada capacidad nueva de VISERON desbloquea revenue y autonomía futura",
        estimatedMinutes: 120,
        definitionOfDone: "Código compilado, testeado, funcionalidad documentada",
      },
      {
        mission: 2,
        result: "BUSINESS: Avanzar un resultado de negocio (demo a cliente, contenido de marketing, propuesta, partnership)",
        why: "Sin revenue, VISERON es un proyecto; con revenue, es una empresa",
        estimatedMinutes: 90,
        definitionOfDone: "Acción completada: email enviado, propuesta entregada, demo hecha",
      },
      {
        mission: 3,
        result: "LEARNING: Estudiar un concepto de IA/engineering/space que desbloquee la siguiente fase",
        why: "El fundador que deja de aprender deja de liderar",
        estimatedMinutes: 60,
        definitionOfDone: "Notas escritas, concepto entendido, aplicable a VISERON",
      },
    ];

    if (energy < 5) {
      missions[0].estimatedMinutes = 90;
      missions[1].estimatedMinutes = 60;
    }
    if (focus < 5) {
      missions[0].result = "VISERON: Tarea técnica de baja complejidad (review, documentación, refactor menor)";
    }
    return missions;
  }

  private buildSchedule(energy: number, hours: number, deepWorkBlocks: number, dayOfWeek: string): string[] {
    const s: string[] = [];
    s.push("06:30 — WAKE UP");
    s.push("06:45 — Agua + movilidad suave (10 min)");
    s.push("07:00 — EJERCICIO (ver detalle abajo)");
    s.push("08:00 — DESAYUNO");
    s.push("08:30 — DAILY REVIEW: revisar plan, prioridades, energía del día");
    s.push("09:00 — DEEP WORK #1 (MISSION 1 — sin interrupciones)");
    s.push("11:00 — BREAK (10 min: caminar, agua, descanso visual)");
    s.push("11:15 — DEEP WORK #2 (MISSION 2 — sin interrupciones)");
    if (energy >= 5 && hours >= 9) {
      s.push("13:00 — ALMUERZO");
      s.push("14:00 — BUSINESS / COMUNICACIÓN (emails, clientes, partnerships)");
      s.push("15:00 — VISERON ENGINEERING (MISSION 3)");
      s.push("17:00 — BREAK / WALK (15 min)");
      s.push("17:30 — RESEARCH / LEARNING (30-45 min)");
      s.push("18:30 — LANGUAGE SESSION (20-30 min)");
    } else {
      s.push("13:00 — ALMUERZO");
      s.push("14:00 — Trabajo ligero / comunicación (energía baja: reducir carga)");
      s.push("16:00 — LEARNING / LANGUAGE (sesiones cortas)");
    }
    s.push("19:00 — CENA");
    s.push("20:00 — STRATEGIC REVIEW / LIGHT WORK (revisar progreso del día)");
    s.push("21:00 — PERSONAL TIME (familia, descanso, reflexión)");
    s.push("22:00 — WIND DOWN (sin pantallas, lectura, preparar mañana)");
    s.push("23:00 — SLEEP TARGET");
    return s;
  }

  private selectExercise(energy: number, dayOfWeek: string): string {
    if (dayOfWeek === "Domingo") return EXERCISE_TEMPLATES[4];
    if (energy <= 4) return EXERCISE_TEMPLATES[2];
    const idx = (new Date().getDate() % 4);
    return EXERCISE_TEMPLATES[idx];
  }

  private pickLearningTopic(date: Date): string {
    const idx = date.getDate() % WEEKLY_LEARNING_TOPICS.length;
    return WEEKLY_LEARNING_TOPICS[idx];
  }

  private getWeekNumber(d: Date): number {
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = d.getTime() - start.getTime();
    return Math.ceil(((diff / 86400000) + start.getDay() + 1) / 7);
  }

  private savePlan(plan: FounderDailyPlan): void {
    const file = path.join(this.planDir, `plan-${plan.date}.json`);
    fs.writeFileSync(file, JSON.stringify(plan, null, 2), "utf8");
    const journal = path.join(this.planDir, "journal.jsonl");
    fs.appendFileSync(journal, JSON.stringify({ ts: new Date().toISOString(), type: "daily_plan", date: plan.date, energy: plan.energyBaseline.energy, missions: plan.top3.map((m) => m.result.slice(0, 100)) }) + "\n", "utf8");
  }

  private loadRecentPlans(days: number): FounderDailyPlan[] {
    const plans: FounderDailyPlan[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const file = path.join(this.planDir, `plan-${dateStr}.json`);
      if (fs.existsSync(file)) {
        try {
          plans.push(JSON.parse(fs.readFileSync(file, "utf8")));
        } catch { /* skip corrupted files */ }
      }
    }
    return plans.reverse();
  }
}
