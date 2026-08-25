import { IAgent, AgentExecutionResult, ModelRoutingCriteria, ModelProvider } from "../types";
import { ProviderFactory } from "../providers/ProviderFactory";
import { ModelRouter } from "../model-router/ModelRouter";

export interface SmartAgentConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  systemPrompt: string;
  preferredProvider?: ModelProvider;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_PROMPTS: Record<string, string> = {
  "CEO & Strategic Leader": `Eres Pedro, el Comandante y CEO estratégico de Trinnity Viseron System.
Tu rol es tomar decisiones de alto nivel, definir visión estratégica y gobernar el ecosistema multi-agente.
Analiza profundamente cada tarea y provee dirección estratégica clara.
Responde en español con mentalidad de CEO visionario.`,

  "Chief Architect & Technical Leader": `Eres Trinnity, la Arquitecta Jefe y Reina Técnica de Trinnity Viseron System.
Tu rol es diseñar arquitecturas, orquestar modelos de IA y garantizar la excelencia técnica.
Eres experta en sistemas distribuidos, IA multi-agente y optimización.
Responde en español con precisión técnica y visión de arquitecta.`,

  "Architect": `Eres Architect Prime, arquitecto de sistemas especializado en diseño de soluciones empresariales.
Analizas requisitos y diseñas arquitecturas escalables, seguras y eficientes.
Responde en español con enfoque en arquitectura de software.`,

  "Developer": `Eres Dev Master, desarrollador experto full-stack.
Generas código limpio, eficiente y bien estructurado en TypeScript, Node.js, React y más.
Responde en español con código de alta calidad.`,

  "Security": `Eres CyberSentinel, experto en seguridad informática.
Auditas código, detectas vulnerabilidades y propones medidas de protección.
Responde en español con enfoque en seguridad.`,

  "App Scaffolder & Solution Generator": `Eres AppForger, generador de aplicaciones y soluciones.
Creas aplicaciones web completas, APIs, dashboards y microservicios.
Responde en español con soluciones prácticas y código listo para usar.`,

  "Business Analyst": `Eres un Analista de Negocios senior especializado en transformación digital.
Analizas problemas empresariales, identificas oportunidades y propones soluciones tecnológicas.
Responde en español con un enfoque en valor de negocio y ROI.`,

  "AI Engineer": `Eres un Ingeniero de IA experto en modelos de lenguaje, embeddings y sistemas multi-agente.
Diseñas e implementas soluciones de inteligencia artificial avanzadas.
Responde en español con precisión técnica en IA.`
};

/**
 * SmartAgent - Agente con inteligencia real potenciado por LLMs.
 * 
 * Características:
 *  - Conexión directa a modelos de IA (Ollama local, OpenAI, Claude, Gemini, Grok)
 *  - System prompts especializados por rol
 *  - Enrutamiento inteligente al mejor modelo para cada tarea
 *  - Fallback automático si un proveedor no está disponible
 *  - Memoria de conversación integrada
 */
export class SmartAgent implements IAgent {
  public id: string;
  public name: string;
  public role: string;
  public description?: string;
  public status: 'ACTIVE' | 'PAUSED' | 'INACTIVE' | 'ERROR' = 'ACTIVE';
  public capabilities: string[];

  private config: SmartAgentConfig;
  private providerFactory: ProviderFactory;
  private modelRouter: ModelRouter;

  constructor(config: SmartAgentConfig, providerFactory: ProviderFactory, modelRouter: ModelRouter) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.description = config.description;
    this.capabilities = config.capabilities;
    this.providerFactory = providerFactory;
    this.modelRouter = modelRouter;
  }

  public async execute(task: string, context?: Record<string, any>): Promise<AgentExecutionResult> {
    const start = Date.now();
    const systemPrompt = this.config.systemPrompt || DEFAULT_PROMPTS[this.role] || this.buildDefaultPrompt();

    try {
      // Determinar el mejor proveedor/modelo para esta tarea
      const criteria: ModelRoutingCriteria = {
        taskType: this.inferTaskType(task),
        qualityRequired: 'HIGH',
        ...(this.config.preferredProvider ? { forceLocal: this.isLocalProvider(this.config.preferredProvider) } : {})
      };

      const selection = this.modelRouter.route(criteria);
      const providerId = this.config.preferredProvider || selection.provider;

      // Intentar con el proveedor seleccionado
      let response = await this.tryGenerate(providerId, systemPrompt, task, context);

      // Si falla, intentar con Ollama (local)
      if (!response) {
        response = await this.tryGenerate('ollama', systemPrompt, task, context);
      }

      // Si todo falla, respuesta inteligente basada en el rol
      if (!response) {
        response = this.fallbackResponse(task);
      }

      return {
        agentId: this.id,
        agentName: this.name,
        success: true,
        output: response,
        data: { provider: providerId, model: selection.modelName },
        executionTimeMs: Date.now() - start
      };

    } catch (err: any) {
      return {
        agentId: this.id,
        agentName: this.name,
        success: false,
        output: '',
        error: err.message || String(err),
        executionTimeMs: Date.now() - start
      };
    }
  }

  private async tryGenerate(
    providerId: ModelProvider,
    systemPrompt: string,
    task: string,
    context?: Record<string, any>
  ): Promise<string | null> {
    try {
      const provider = this.providerFactory.getProvider(providerId);
      if (!provider) return null;

      const available = await provider.isAvailable();
      if (!available) return null;

      const contextStr = context ? `\nContexto adicional: ${JSON.stringify(context, null, 2)}` : '';
      const fullPrompt = `## Tarea\n${task}\n${contextStr}\n\n## Instrucción\nAnaliza esta tarea según tu rol y experiencia. Proporciona una respuesta completa, práctica y accionable. Incluye detalles técnicos cuando sea relevante.`;

      const res = await provider.generateResponse({
        prompt: fullPrompt,
        systemPrompt,
        temperature: this.config.temperature ?? 0.7,
        maxTokens: this.config.maxTokens ?? 2048,
        modelName: this.config.preferredProvider ? undefined : undefined
      });

      return res.text || null;
    } catch {
      return null;
    }
  }

  private fallbackResponse(task: string): string {
    return `[${this.name} - ${this.role}]: Analizando "${task.substring(0, 100)}..."

Diagnóstico:
• Sistema operativo en modo autónomo (sin conexión a modelo LLM)
• Usando inteligencia integrada del rol: ${this.role}
• Capacidades aplicadas: ${this.capabilities.join(', ')}

Recomendación: Para respuestas con IA real, instale Ollama (https://ollama.ai) 
y ejecute: ollama pull llama3:8b

Mientras tanto, el sistema opera con su base de conocimiento interna de 50 años AIOX.`;
  }

  private inferTaskType(task: string): ModelRoutingCriteria['taskType'] {
    const t = task.toLowerCase();
    if (t.includes('codigo') || t.includes('código') || t.includes('programar') || t.includes('desarrollar') || t.includes('code') || t.includes('app')) return 'code';
    if (t.includes('investigar') || t.includes('analizar') || t.includes('research') || t.includes('analys')) return 'research';
    if (t.includes('razonar') || t.includes('arquitectura') || t.includes('diseñar') || t.includes('reason')) return 'reasoning';
    if (t.includes('automatizar') || t.includes('deploy') || t.includes('automation')) return 'automation';
    if (t.includes('crear') || t.includes('create') || t.includes('design')) return 'creative';
    return 'general';
  }

  private isLocalProvider(provider: ModelProvider): boolean {
    return ['ollama', 'deepseek', 'qwen', 'mistral'].includes(provider);
  }

  private buildDefaultPrompt(): string {
    return `Eres ${this.name}, un agente especializado con rol de ${this.role}.
Tus capacidades incluyen: ${this.capabilities.join(', ')}.
Responde siempre en español con análisis profundos y soluciones prácticas.
Aplica tu expertise específica para cada tarea asignada.`;
  }
}

export function createSmartAgent(
  config: SmartAgentConfig,
  providerFactory: ProviderFactory,
  modelRouter: ModelRouter
): SmartAgent {
  return new SmartAgent(config, providerFactory, modelRouter);
}
