import { Kernel } from "../kernel/Kernel";
import { Actor } from "../kernel/Permissions";
import { FactoryOrder, FactoryRunResult, FactoryStageKind, FactoryStageResult } from "./FactorySpec";
import { heartbeats } from "../selfheal";

export interface SolutionEngineAdapter {
  analyze(problem: {
    companyName: string;
    industry: string;
    description: string;
    painPoints: string[];
    goals: string[];
    budget?: string;
    timeline?: string;
  }): Promise<{
    diagnosis: string;
    proposedSolution: string;
    architecture: string;
    techStack: string[];
    implementationPlan: string;
    risks: string[];
  }>;
}

export interface ScaffolderAdapter {
  scaffold(spec: { name: string; description: string; template: string; outputDir?: string }): Promise<{
    success: boolean;
    appPath: string;
    filesCreated: number;
    template: string;
    message: string;
  }>;
}

const ACTOR: Actor = { id: "factory", name: "TVS Factory", role: "operator" };

const STAGE_TIMEOUT_MS = 20000;

const TEMPLATE_STACK: Record<string, string[]> = {
  "express-api": ["Node.js", "Express", "TypeScript"],
  "react-spa": ["React", "TypeScript", "Vite"],
  "express-react": ["Node.js", "Express", "React", "TypeScript"],
  "cli-tool": ["Node.js", "TypeScript", "Commander"],
  microservice: ["Node.js", "Express", "Docker"],
  dashboard: ["Node.js", "Express", "EJS"],
};

const DEPLOY_STEPS: Record<string, string[]> = {
  vercel: ["vercel login", "vercel --prod --yes", "vercel domains add <dominio>", "configurar DNS (A/CNAME)"],
  render: ["criar serviço web no Render", "ligar repo GitHub", "setar build/start command", "custom domain"],
  docker: ["docker build -t <app> .", "docker run -p <port>:<port> <app>", "docker push <registry>"],
  local: ["npm install", "npm run dev", "npm start"],
};

function heuristicAnalysis(order: FactoryOrder): {
  diagnosis: string;
  proposedSolution: string;
  architecture: string;
  techStack: string[];
  implementationPlan: string;
} {
  const pain = order.painPoints.length ? order.painPoints.join("; ") : "processos manuais sem automação";
  const goals = order.goals.length ? order.goals.join("; ") : "digitalizar e escalar a operação";
  const stack = TEMPLATE_STACK[order.template] ?? TEMPLATE_STACK["express-api"];
  return {
    diagnosis: `Análise do sector ${order.industry}: principais dores identificadas — ${pain}.`,
    proposedSolution: `Plataforma "${order.name}" que ataca diretamente as dores e permite alcançar: ${goals}.`,
    architecture: `Arquitetura ${order.template}: camada API + interface + integrações, com a TVS OMEGA a orquestrar agentes por domínio.`,
    techStack: stack,
    implementationPlan: `1) Scafold da app; 2) API core; 3) UI; 4) Testes; 5) Deploy. Prazo estimado: ${order.timeline ?? "4 semanas"}.`,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`[Factory] stage ${label} excedeu ${ms}ms (modelo de IA sem resposta)`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export interface FactoryEngineOptions {
  solutionEngine?: SolutionEngineAdapter;
  scaffolder?: ScaffolderAdapter;
  stageTimeoutMs?: number;
}

export class FactoryEngine {
  public readonly name = "TVS Factory";
  public readonly kernel: Kernel;

  private solutionEngine?: SolutionEngineAdapter;
  private scaffolder?: ScaffolderAdapter;
  private stageTimeoutMs: number;
  private runs: FactoryRunResult[] = [];

  constructor(kernel: Kernel, options: FactoryEngineOptions = {}) {
    this.kernel = kernel;
    this.solutionEngine = options.solutionEngine;
    this.scaffolder = options.scaffolder;
    this.stageTimeoutMs = options.stageTimeoutMs ?? STAGE_TIMEOUT_MS;
  }

  public attachSolutionEngine(adapter: SolutionEngineAdapter): void {
    this.solutionEngine = adapter;
  }

  public attachScaffolder(adapter: ScaffolderAdapter): void {
    this.scaffolder = adapter;
  }

  public getRun(id: string): FactoryRunResult | undefined {
    return this.runs.find((r) => r.id === id);
  }

  public listRuns(): FactoryRunResult[] {
    return [...this.runs];
  }

  private stage(stage: FactoryStageKind, artifacts: string[], notes: string[], status: FactoryStageResult["status"] = "COMPLETED"): FactoryStageResult {
    const now = Date.now();
    return { stage, status, startedAt: now, finishedAt: now, artifacts, notes };
  }

  public async runPipeline(order: FactoryOrder): Promise<FactoryRunResult> {
    heartbeats.begin("factory");
    try {
      return await this.runPipelineInner(order);
    } finally {
      heartbeats.end("factory");
    }
  }

  private async runPipelineInner(order: FactoryOrder): Promise<FactoryRunResult> {
    const id = `factory_${Date.now()}`;
    await this.kernel.events.publish("omega:factory:start", { id, name: order.name }, ACTOR.id);
    const result: FactoryRunResult = {
      id,
      order,
      diagnosis: "",
      architecture: "",
      techStack: [],
      implementationPlan: "",
      deploySteps: [],
      stages: [],
      status: "IN_PROGRESS",
      createdAt: Date.now(),
    };

    try {
      // ── STAGE 1: ANALYZE ──
      const analyzeStage: FactoryStageResult = { stage: "ANALYZE", status: "RUNNING", startedAt: Date.now(), artifacts: [], notes: [] };
      try {
        if (this.solutionEngine) {
          const analysis = await withTimeout(
            this.solutionEngine.analyze({
              companyName: order.name,
              industry: order.industry,
              description: order.description,
              painPoints: order.painPoints,
              goals: order.goals,
              budget: order.budget,
              timeline: order.timeline,
            }),
            this.stageTimeoutMs,
            "ANALYZE",
          );
          result.diagnosis = analysis.diagnosis;
          result.architecture = analysis.architecture;
          result.techStack = analysis.techStack;
          result.implementationPlan = analysis.implementationPlan;
          analyzeStage.artifacts.push("diagnosis.txt", "blueprint.json");
          analyzeStage.notes.push(`Motor de soluções reais: ${analysis.proposedSolution}`);
        } else {
          const analysis = heuristicAnalysis(order);
          result.diagnosis = analysis.diagnosis;
          result.architecture = analysis.architecture;
          result.techStack = analysis.techStack;
          result.implementationPlan = analysis.implementationPlan;
          analyzeStage.artifacts.push("diagnosis.txt", "blueprint.json");
          analyzeStage.notes.push("Sem engine externo — análise heurística interna da Factory.");
        }
        analyzeStage.status = "COMPLETED";
        analyzeStage.finishedAt = Date.now();
      } catch (e: any) {
        analyzeStage.status = "FAILED";
        analyzeStage.finishedAt = Date.now();
        analyzeStage.notes.push(`Falha no motor de análise: ${e.message}`);
        const fallback = heuristicAnalysis(order);
        result.diagnosis = fallback.diagnosis;
        result.architecture = fallback.architecture;
        result.techStack = fallback.techStack;
        result.implementationPlan = fallback.implementationPlan;
        analyzeStage.artifacts.push("diagnosis-fallback.txt", "blueprint.json");
        analyzeStage.notes.push(`Fallback heurístico aplicado (${e.message}).`);
      }
      result.stages.push(analyzeStage);

      // ── STAGE 2: DESIGN ──
      const designStage = this.stage("DESIGN", ["architecture.json", "data-model.md"], [
        `Blueprint ${order.template} desenhado a partir da análise.`,
        `Stack: ${result.techStack.join(", ")}.`,
      ]);
      result.stages.push(designStage);

      // ── STAGE 3: BUILD ──
      const buildStage: FactoryStageResult = { stage: "BUILD", status: "RUNNING", startedAt: Date.now(), artifacts: [], notes: [] };
      try {
        if (this.scaffolder) {
          const scaffolded = await withTimeout(
            this.scaffolder.scaffold({
              name: order.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
              description: order.description,
              template: order.template,
              outputDir: order.outputDir,
            }),
            this.stageTimeoutMs,
            "BUILD",
          );
          buildStage.artifacts.push(scaffolded.appPath);
          buildStage.notes.push(`${scaffolded.filesCreated} ficheiros gerados (${scaffolded.template}).`);
        } else {
          buildStage.artifacts.push("(offline) package.json", "(offline) src/index.ts", "(offline) README.md");
          buildStage.notes.push("Sem scaffolder externo — pipeline BUILD simulado offline.");
        }
        buildStage.status = "COMPLETED";
        buildStage.finishedAt = Date.now();
      } catch (e: any) {
        buildStage.status = "FAILED";
        buildStage.finishedAt = Date.now();
        buildStage.notes.push(`Falha no scaffold: ${e.message}`);
      }
      result.stages.push(buildStage);

      // ── STAGE 4: DEPLOY ──
      const deploySteps: string[] = [];
      for (const target of order.deployTo) {
        deploySteps.push(`── ${target.toUpperCase()} ──`);
        deploySteps.push(...(DEPLOY_STEPS[target] ?? []));
      }
      result.deploySteps = deploySteps;
      result.stages.push(this.stage("DEPLOY", ["deploy-plan.md"], deploySteps));

      result.status = "APPROVED";
      await this.kernel.events.publish("omega:factory:complete", { id, name: order.name, status: result.status }, ACTOR.id);
    } catch (e: any) {
      result.status = "FAILED";
      result.error = e.message;
      await this.kernel.events.publish("omega:factory:error", { id, error: e.message }, ACTOR.id);
    }

    this.runs.push(result);
    return result;
  }

  public status(): { runs: number; approved: number; failed: number; stages: string[] } {
    return {
      runs: this.runs.length,
      approved: this.runs.filter((r) => r.status === "APPROVED").length,
      failed: this.runs.filter((r) => r.status === "FAILED").length,
      stages: ["ANALYZE", "DESIGN", "BUILD", "DEPLOY"],
    };
  }
}
