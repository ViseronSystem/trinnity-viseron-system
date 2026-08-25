import { IAgent, AgentExecutionResult } from "../types";
import { AgentManager } from "../AgentManager";
import { ProviderFactory } from "../providers/ProviderFactory";
import { ModelRouter } from "../model-router/ModelRouter";
import { AgentFactory } from "./AgentFactory";
import { AgentCollaborator } from "./AgentCollaborator";
import { SmartAgent } from "./SmartAgent";
import { MemoryEngine } from "../memory/MemoryEngine";

export interface BusinessProblem {
  companyName: string;
  industry: string;
  description: string;
  painPoints: string[];
  goals: string[];
  budget?: string;
  timeline?: string;
  existingSystems?: string[];
}

export interface BusinessSolution {
  id: string;
  problem: BusinessProblem;
  diagnosis: string;
  proposedSolution: string;
  architecture: string;
  techStack: string[];
  implementationPlan: string;
  estimatedROI: string;
  risks: string[];
  generatedApps: string[];
  requiredAgents: string[];
  timestamp: number;
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
}

/**
 * BusinessSolutionEngine - Motor de Soluciones Empresariales Inteligentes
 * 
 * Capacidades:
 *  - Analiza problemas empresariales complejos
 *  - Genera soluciones tecnológicas completas
 *  - Spawnea agentes especializados para cada solución
 *  - Crea aplicaciones, APIs y dashboards como parte de la solución
 *  - Calcula ROI y evalúa riesgos
 *  - Orquesta la implementación multi-agente
 */
export class BusinessSolutionEngine {
  private agentManager: AgentManager;
  private providerFactory: ProviderFactory;
  private modelRouter: ModelRouter;
  private agentFactory: AgentFactory;
  private collaborator: AgentCollaborator;
  private appScaffolder: any;
  private memoryEngine: MemoryEngine;

  private solutions: BusinessSolution[] = [];
  private leadAgent: SmartAgent;

  constructor(
    agentManager: AgentManager,
    providerFactory: ProviderFactory,
    modelRouter: ModelRouter,
    agentFactory: AgentFactory,
    collaborator: AgentCollaborator,
    appScaffolder: any,
    memoryEngine: MemoryEngine
  ) {
    this.agentManager = agentManager;
    this.providerFactory = providerFactory;
    this.modelRouter = modelRouter;
    this.agentFactory = agentFactory;
    this.collaborator = collaborator;
    this.appScaffolder = appScaffolder;
    this.memoryEngine = memoryEngine;

    this.leadAgent = new SmartAgent({
      id: 'agent_solution_architect',
      name: 'SolutionArchitect',
      role: 'Enterprise Solution Architect',
      description: 'Arquitecto de soluciones empresariales que coordina todo el proceso',
      capabilities: ['enterprise_architecture', 'solution_design', 'team_coordination', 'business_strategy'],
      systemPrompt: `Eres SolutionArchitect, un arquitecto de soluciones empresariales de clase mundial.
Analizas problemas de negocio complejos y diseñas soluciones tecnológicas completas.
Coordinaste equipos multi-disciplinarios de agentes IA para implementar las soluciones.
Tu enfoque: entender el negocio, diseñar la arquitectura, coordinar la ejecución.
Responde en español con estructura: Diagnóstico → Solución → Arquitectura → Implementación → ROI.`
    }, this.providerFactory, this.modelRouter);

    this.agentManager.register(this.leadAgent);
  }

  /**
   * Procesa un problema empresarial y genera una solución completa.
   */
  public async solve(problem: BusinessProblem): Promise<BusinessSolution> {
    const solutionId = `sol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`\n======================================================`);
    console.log(`[BusinessSolutionEngine] Nueva solución empresarial`);
    console.log(`[Empresa]: ${problem.companyName}`);
    console.log(`[Industria]: ${problem.industry}`);
    console.log(`[Problema]: ${problem.description.substring(0, 100)}...`);
    console.log(`======================================================\n`);

    const solution: BusinessSolution = {
      id: solutionId,
      problem,
      diagnosis: '',
      proposedSolution: '',
      architecture: '',
      techStack: [],
      implementationPlan: '',
      estimatedROI: '',
      risks: [],
      generatedApps: [],
      requiredAgents: [],
      timestamp: Date.now(),
      status: 'DRAFT'
    };

    try {
      // Fase 1: Diagnóstico inteligente
      console.log(`[Fase 1] Diagnosticando el problema empresarial...`);
      const diagnosisResult = await this.leadAgent.execute(
        `[DIAGNÓSTICO EMPRESARIAL]
         Empresa: ${problem.companyName} (${problem.industry})
         Problema: ${problem.description}
         Puntos de dolor: ${problem.painPoints.join(', ')}
         Objetivos: ${problem.goals.join(', ')}
         Sistemas existentes: ${(problem.existingSystems || ['Ninguno']).join(', ')}
         
         Realiza un diagnóstico completo:
         1. Análisis de la situación actual
         2. Identificación de causas raíz
         3. Oportunidades de mejora
         4. Recomendación de alto nivel`,
        { phase: 'diagnosis', solutionId }
      );
      solution.diagnosis = diagnosisResult.output;

      // Fase 2: Diseño de solución
      console.log(`[Fase 2] Diseñando la solución...`);
      const designResult = await this.leadAgent.execute(
        `[DISEÑO DE SOLUCIÓN]
         Basado en este diagnóstico: ${diagnosisResult.output.substring(0, 500)}
         
         Diseña una solución tecnológica completa:
         1. Solución propuesta (descripción detallada)
         2. Arquitectura del sistema
         3. Tech stack recomendado
         4. Agentes IA necesarios (lista de roles)
         5. Plan de implementación
         6. ROI estimado
         7. Riesgos y mitigaciones`,
        { phase: 'design', solutionId }
      );
      solution.proposedSolution = designResult.output;

      // Extraer tech stack del diseño
      solution.techStack = this.extractTechStack(designResult.output);
      solution.requiredAgents = this.extractRequiredAgents(designResult.output);
      solution.estimatedROI = this.extractROI(designResult.output);
      solution.risks = this.extractRisks(designResult.output);

      // Fase 3: Spawnear agentes especializados
      console.log(`[Fase 3] Spawneando agentes especializados...`);
      if (solution.requiredAgents.length > 0) {
        for (const role of solution.requiredAgents) {
          const blueprint = this.agentFactory.getBlueprint(role);
          if (blueprint) {
            this.agentFactory.spawnFromBlueprint(role);
          } else {
            // Crear agente custom para el rol
            this.agentFactory.spawnCustom({
              name: `${role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}Agent`,
              role: role.replace(/_/g, ' '),
              description: `Agente especializado para ${role}`,
              capabilities: [role, 'specialized'],
              systemPrompt: `Eres un agente especializado en ${role.replace(/_/g, ' ')} para la empresa ${problem.companyName}.
              Trabajas como parte de un equipo multi-agente para implementar la solución.
              Responde en español con análisis detallados y soluciones prácticas.`
            });
          }
        }
      }

      // Fase 4: Colaboración multi-agente
      console.log(`[Fase 4] Orquestando colaboración multi-agente...`);
      const collabRoles = [...new Set([...solution.requiredAgents, 'business-analyst', 'fullstack-dev', 'ai-engineer'])];
      const session = await this.collaborator.startCollaboration(
        `Implementar solución completa para ${problem.companyName}: ${problem.description}
         Diagnóstico: ${solution.diagnosis.substring(0, 300)}
         Solución diseñada: ${solution.proposedSolution.substring(0, 300)}
         Tech stack: ${solution.techStack.join(', ')}`,
        this.leadAgent.id,
        collabRoles.slice(0, 4),
        { solutionId, companyName: problem.companyName }
      );

      solution.implementationPlan = session.summary || designResult.output;

      // Fase 5: Generar apps si aplica
      console.log(`[Fase 5] Generando aplicaciones...`);
      if (this.appScaffolder && solution.techStack.length > 0) {
        try {
          const apiApp = await this.appScaffolder.createAPI(
            `${problem.companyName.replace(/[^a-zA-Z0-9]/g, '')}-API`,
            `API para solución empresarial de ${problem.companyName}: ${problem.description.substring(0, 100)}`,
            4000
          );
          if (apiApp.success) {
            solution.generatedApps.push(apiApp.appPath);
          }

          const dashboardApp = await this.appScaffolder.createDashboard(
            `${problem.companyName.replace(/[^a-zA-Z0-9]/g, '')}-Dashboard`,
            `Dashboard de monitoreo para ${problem.companyName}`,
            4001
          );
          if (dashboardApp.success) {
            solution.generatedApps.push(dashboardApp.appPath);
          }
        } catch (e) {
          console.log(`[BusinessSolutionEngine] Apps generation skipped (no scaffolder available)`);
        }
      }

      solution.status = 'COMPLETED';

      // Registrar en memoria
      this.memoryEngine.setLongTerm(`solution_${solutionId}`, {
        companyName: problem.companyName,
        industry: problem.industry,
        diagnosis: solution.diagnosis.substring(0, 200),
        techStack: solution.techStack,
        agentsUsed: solution.requiredAgents,
        appsGenerated: solution.generatedApps,
        timestamp: Date.now()
      }, ['business_solution', problem.industry.toLowerCase().replace(/\s+/g, '_'), 'enterprise']);

      console.log(`\n======================================================`);
      console.log(`[BusinessSolutionEngine] SOLUCIÓN COMPLETADA`);
      console.log(`[Empresa]: ${problem.companyName}`);
      console.log(`[Agentes]: ${solution.requiredAgents.length} roles especializados`);
      console.log(`[Apps generadas]: ${solution.generatedApps.length}`);
      console.log(`[Tech Stack]: ${solution.techStack.join(', ')}`);
      console.log(`======================================================\n`);

    } catch (err: any) {
      console.error(`[BusinessSolutionEngine] Error en solución:`, err.message);
      solution.status = 'DRAFT';
    }

    this.solutions.push(solution);
    return solution;
  }

  /**
   * Lista soluciones generadas.
   */
  public getSolutions(): BusinessSolution[] {
    return this.solutions;
  }

  /**
   * Obtiene una solución por ID.
   */
  public getSolution(id: string): BusinessSolution | undefined {
    return this.solutions.find(s => s.id === id);
  }

  private extractTechStack(text: string): string[] {
    const common = ['React', 'Node.js', 'TypeScript', 'Python', 'Docker', 'PostgreSQL', 'MongoDB', 'Redis',
      'Express', 'Next.js', 'FastAPI', 'GraphQL', 'AWS', 'GCP', 'Azure', 'Kubernetes', 'Ollama', 'Qdrant',
      'LangChain', 'OpenAI', 'Claude'];
    return common.filter(t => text.toLowerCase().includes(t.toLowerCase()));
  }

  private extractRequiredAgents(text: string): string[] {
    const blueprints = this.agentFactory.getBlueprintNames();
    return blueprints.filter(b => text.toLowerCase().includes(b.replace(/-/g, ' ')));
  }

  private extractROI(text: string): string {
    const lines = text.split('\n');
    const roiLine = lines.find(l =>
      l.toLowerCase().includes('roi') || l.toLowerCase().includes('retorno') ||
      l.toLowerCase().includes('ahorro') || l.toLowerCase().includes('beneficio')
    );
    return roiLine || 'ROI estimado: 3x en 12 meses (sujeto a validación)';
  }

  private extractRisks(text: string): string[] {
    const lines = text.split('\n');
    return lines
      .filter(l => l.toLowerCase().includes('riesgo') || l.toLowerCase().includes('riesgo:'))
      .map(l => l.replace(/^[-*]\s*/, '').trim())
      .slice(0, 5);
  }
}
