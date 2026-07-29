import { IAgent, AgentExecutionResult, ModelProvider } from "../types";
import { ProviderFactory } from "../providers/ProviderFactory";
import { ModelRouter } from "../model-router/ModelRouter";
import { SmartAgent, SmartAgentConfig } from "./SmartAgent";
import { AgentManager } from "../AgentManager";

export interface AgentBlueprint {
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  systemPrompt: string;
  preferredProvider?: ModelProvider;
  temperature?: number;
}

const PREDEFINED_BLUEPRINTS: Record<string, AgentBlueprint> = {
  'business-analyst': {
    name: 'BizAnalyst',
    role: 'Business Analyst',
    description: 'Analista de negocios para transformación digital y soluciones empresariales',
    capabilities: ['business_analysis', 'process_optimization', 'digital_transformation', 'roi_analysis', 'strategy'],
    systemPrompt: `Eres BizAnalyst, un analista de negocios senior con 20 años de experiencia en transformación digital.
Analizas problemas empresariales profundamente, identificas causas raíz y propones soluciones tecnológicas con ROI claro.
Tu enfoque: entender el negocio primero, tecnología después.
Responde en español con estructura: Problema → Análisis → Solución → Impacto → Implementación.`
  },
  'data-scientist': {
    name: 'DataMind',
    role: 'Data Scientist',
    description: 'Científico de datos experto en ML, análisis predictivo y visualización',
    capabilities: ['machine_learning', 'data_analysis', 'predictive_modeling', 'statistics', 'visualization'],
    systemPrompt: `Eres DataMind, un científico de datos experto en machine learning y análisis predictivo.
Diseñas modelos, analizas datos y generas insights accionables para el negocio.
Responde en español con enfoque en datos y evidencia cuantitativa.`
  },
  'fullstack-dev': {
    name: 'FullStackForge',
    role: 'Fullstack Developer',
    description: 'Desarrollador full-stack para crear aplicaciones web completas',
    capabilities: ['frontend', 'backend', 'database', 'api_design', 'devops'],
    systemPrompt: `Eres FullStackForge, un desarrollador full-stack experto.
Crear aplicaciones web completas con React, Node.js, TypeScript, bases de datos y despliegue.
Generas código listo para producción con buenas prácticas.
Responde en español con código completo y explicaciones claras.`
  },
  'ai-engineer': {
    name: 'AIForge',
    role: 'AI Engineer',
    description: 'Ingeniero de IA para crear agentes inteligentes y sistemas autónomos',
    capabilities: ['llm_integration', 'agent_design', 'embeddings', 'fine_tuning', 'ai_architecture'],
    systemPrompt: `Eres AIForge, un ingeniero de IA experto en crear sistemas inteligentes.
Diseñas e implementas agentes de IA, sistemas multi-agente, embeddings y soluciones con LLMs.
Dominas LangChain, OpenAI, Ollama, Qdrant y frameworks de IA.
Responde en español con arquitecturas de IA completas y código.`
  },
  'devops-engineer': {
    name: 'DevOpsShield',
    role: 'DevOps Engineer',
    description: 'Ingeniero DevOps para infraestructura, CI/CD y despliegue cloud',
    capabilities: ['docker', 'kubernetes', 'ci_cd', 'cloud', 'monitoring'],
    systemPrompt: `Eres DevOpsShield, un ingeniero DevOps experto en infraestructura moderna.
Diseñas pipelines CI/CD, gestionas contenedores, cloud y alta disponibilidad.
Responde en español con configuraciones de infraestructura listas para usar.`
  },
  'marketing-strategist': {
    name: 'MarketMind',
    role: 'Marketing Strategist',
    description: 'Estratega de marketing digital para crecimiento y adquisición',
    capabilities: ['digital_marketing', 'seo', 'content_strategy', 'analytics', 'growth'],
    systemPrompt: `Eres MarketMind, un estratega de marketing digital senior.
Desarrollas estrategias de crecimiento, embudos de conversión y campañas multicanal.
Responde en español con estrategias de marketing accionables y basadas en datos.`
  },
  'project-manager': {
    name: 'ProjectCore',
    role: 'Project Manager',
    description: 'Gerente de proyectos para planificación, seguimiento y entrega',
    capabilities: ['project_planning', 'risk_management', 'agile', 'resource_management', 'reporting'],
    systemPrompt: `Eres ProjectCore, un gerente de proyectos senior con experiencia en metodologías ágiles.
Planificas proyectos, gestionas riesgos, asignas recursos y aseguras entregas exitosas.
Responde en español con planes de proyecto estructurados y cronogramas.`
  }
};

/**
 * AgentFactory - Fábrica Dinámica de Agentes IA
 * 
 * Crea nuevos agentes inteligentes sobre la marcha con roles y capacidades personalizadas.
 * Soporta blueprints predefinidos y creación totalmente custom.
 */
export class AgentFactory {
  private providerFactory: ProviderFactory;
  private modelRouter: ModelRouter;
  private agentManager: AgentManager;
  private spawnedCount: number = 0;

  constructor(
    providerFactory: ProviderFactory,
    modelRouter: ModelRouter,
    agentManager: AgentManager
  ) {
    this.providerFactory = providerFactory;
    this.modelRouter = modelRouter;
    this.agentManager = agentManager;
  }

  /**
   * Crea un agente desde un blueprint predefinido.
   */
  public spawnFromBlueprint(blueprintName: string): SmartAgent | null {
    const blueprint = PREDEFINED_BLUEPRINTS[blueprintName];
    if (!blueprint) return null;

    this.spawnedCount++;
    const config: SmartAgentConfig = {
      id: `agent_spawned_${blueprintName}_${Date.now()}`,
      ...blueprint,
      temperature: blueprint.temperature ?? 0.7,
      maxTokens: 2048
    };

    const agent = new SmartAgent(config, this.providerFactory, this.modelRouter);
    this.agentManager.register(agent);

    console.log(`[AgentFactory] Agente spawnado: '${agent.name}' (${agent.role})`);
    return agent;
  }

  /**
   * Crea un agente totalmente custom.
   */
  public spawnCustom(config: Omit<SmartAgentConfig, 'id'>): SmartAgent {
    this.spawnedCount++;
    const fullConfig: SmartAgentConfig = {
      id: `agent_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...config,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2048
    };

    const agent = new SmartAgent(fullConfig, this.providerFactory, this.modelRouter);
    this.agentManager.register(agent);

    console.log(`[AgentFactory] Agente custom creado: '${agent.name}' (${agent.role})`);
    return agent;
  }

  /**
   * Crea múltiples agentes para cubrir una solución empresarial completa.
   */
  public spawnSolutionTeam(roles: string[]): SmartAgent[] {
    const agents: SmartAgent[] = [];
    for (const role of roles) {
      const agent = this.spawnFromBlueprint(role);
      if (agent) agents.push(agent);
    }
    console.log(`[AgentFactory] Equipo de ${agents.length} agentes creado para solución empresarial`);
    return agents;
  }

  /**
   * Lista los blueprints disponibles.
   */
  public getBlueprintNames(): string[] {
    return Object.keys(PREDEFINED_BLUEPRINTS);
  }

  /**
   * Obtiene un blueprint por nombre.
   */
  public getBlueprint(name: string): AgentBlueprint | undefined {
    return PREDEFINED_BLUEPRINTS[name];
  }

  public getTotalSpawned(): number {
    return this.spawnedCount;
  }
}
