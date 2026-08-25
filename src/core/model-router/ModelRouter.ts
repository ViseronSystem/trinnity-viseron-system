import { 
  ModelProvider, 
  ModelRoutingCriteria, 
  ModelSelection, 
  PrivacyLevel 
} from "../types";

export interface ModelProfile {
  provider: ModelProvider;
  modelName: string;
  isLocal: boolean;
  costPer1kTokens: number; // en USD
  latencyMs: number;       // estimación
  qualityScore: number;    // 1-100
  supportedTasks: string[];
}

/**
 * ModelRouter - Sistema Inteligente de Selección y Enrutamiento de Modelos IA
 * Soporta modelos locales (Ollama, DeepSeek, Qwen, Mistral) y en la nube (OpenAI, Claude, Gemini, Grok)
 * evaluando tipo de tarea, coste, velocidad, privacidad y calidad.
 */
export class ModelRouter {
  private registry: Map<ModelProvider, ModelProfile> = new Map();

  constructor() {
    this.initDefaultModels();
  }

  private initDefaultModels(): void {
    // OmniRoute Gateway (290+ providers via one endpoint)
    this.registerModel({
      provider: 'omniroute',
      modelName: 'auto',
      isLocal: false,
      costPer1kTokens: 0,
      latencyMs: 300,
      qualityScore: 95,
      supportedTasks: ['code', 'reasoning', 'research', 'general', 'creative', 'automation']
    });
    this.registerModel({
      provider: 'omniroute',
      modelName: 'oc/free',
      isLocal: false,
      costPer1kTokens: 0,
      latencyMs: 500,
      qualityScore: 85,
      supportedTasks: ['general', 'creative', 'automation']
    });
    this.registerModel({
      provider: 'omniroute',
      modelName: 'kimi-k3',
      isLocal: false,
      costPer1kTokens: 0.002,
      latencyMs: 350,
      qualityScore: 96,
      supportedTasks: ['code', 'reasoning', 'research', 'creative']
    });

    // Modelos Locales
    this.registerModel({
      provider: 'ollama',
      modelName: 'llama3:8b',
      isLocal: true,
      costPer1kTokens: 0,
      latencyMs: 150,
      qualityScore: 78,
      supportedTasks: ['general', 'creative', 'automation']
    });

    this.registerModel({
      provider: 'deepseek',
      modelName: 'deepseek-r1:local',
      isLocal: true,
      costPer1kTokens: 0,
      latencyMs: 300,
      qualityScore: 92,
      supportedTasks: ['code', 'reasoning', 'research']
    });

    this.registerModel({
      provider: 'qwen',
      modelName: 'qwen2.5-coder:local',
      isLocal: true,
      costPer1kTokens: 0,
      latencyMs: 200,
      qualityScore: 88,
      supportedTasks: ['code', 'automation']
    });

    this.registerModel({
      provider: 'mistral',
      modelName: 'mistral-nemo:local',
      isLocal: true,
      costPer1kTokens: 0,
      latencyMs: 180,
      qualityScore: 82,
      supportedTasks: ['general', 'reasoning']
    });

    // Modelos Externos / Cloud
    this.registerModel({
      provider: 'claude',
      modelName: 'claude-3-7-sonnet',
      isLocal: false,
      costPer1kTokens: 0.003,
      latencyMs: 600,
      qualityScore: 98,
      supportedTasks: ['code', 'reasoning', 'creative', 'research']
    });

    this.registerModel({
      provider: 'openai',
      modelName: 'gpt-4o',
      isLocal: false,
      costPer1kTokens: 0.0025,
      latencyMs: 500,
      qualityScore: 95,
      supportedTasks: ['general', 'code', 'automation', 'reasoning']
    });

    this.registerModel({
      provider: 'gemini',
      modelName: 'gemini-3.6-flash',
      isLocal: false,
      costPer1kTokens: 0.0001,
      latencyMs: 200,
      qualityScore: 94,
      supportedTasks: ['code', 'reasoning', 'research', 'general', 'chat', 'automation']
    });

    this.registerModel({
      provider: 'grok',
      modelName: 'grok-3',
      isLocal: false,
      costPer1kTokens: 0.002,
      latencyMs: 400,
      qualityScore: 91,
      supportedTasks: ['research', 'creative', 'reasoning']
    });
  }

  public registerModel(profile: ModelProfile): void {
    this.registry.set(profile.provider, profile);
  }

  /**
   * Enrutamiento Inteligente con Criterios Estructurados
   */
  public route(criteria: ModelRoutingCriteria): ModelSelection {
    const candidates = Array.from(this.registry.values());

    // 1. Filtrar por Privacidad o Forzar Local
    let filtered = candidates;
    if (criteria.privacyRequired === 'HIGH' || criteria.forceLocal) {
      filtered = candidates.filter(m => m.isLocal);
    }

    if (filtered.length === 0) {
      filtered = candidates.filter(m => m.isLocal); // Fallback a locales por seguridad
    }

    // 2. Filtrar por Tarea si hay coincidencia
    const taskCandidates = filtered.filter(m => m.supportedTasks.includes(criteria.taskType));
    if (taskCandidates.length > 0) {
      filtered = taskCandidates;
    }

    // 3. Evaluar según preferencia de velocidad / coste / calidad
    let chosen = filtered[0];

    if (criteria.speedPreference === 'FAST') {
      chosen = filtered.sort((a, b) => a.latencyMs - b.latencyMs)[0];
    } else if (criteria.qualityRequired === 'PREMIUM') {
      chosen = filtered.sort((a, b) => b.qualityScore - a.qualityScore)[0];
    } else if (criteria.maxCostPer1kTokens !== undefined) {
      const affordable = filtered.filter(m => m.costPer1kTokens <= criteria.maxCostPer1kTokens!);
      if (affordable.length > 0) {
        chosen = affordable.sort((a, b) => b.qualityScore - a.qualityScore)[0];
      }
    } else {
      // Balanceado
      chosen = filtered.sort((a, b) => (b.qualityScore / (b.latencyMs + 100)) - (a.qualityScore / (a.latencyMs + 100)))[0];
    }

    return {
      provider: chosen.provider,
      modelName: chosen.modelName,
      isLocal: chosen.isLocal,
      estimatedLatencyMs: chosen.latencyMs,
      estimatedCostPer1kTokens: chosen.costPer1kTokens,
      reason: `Seleccionado ${chosen.provider} (${chosen.modelName}) para tipo '${criteria.taskType}' (Local: ${chosen.isLocal}, Latencia: ${chosen.latencyMs}ms)`
    };
  }

  /**
   * Método de retrocompatibilidad: Selecciona según texto de la tarea.
   */
  public select(task: string): string {
    const lowerTask = task.toLowerCase();
    let taskType: ModelRoutingCriteria['taskType'] = 'general';
    let privacyRequired: PrivacyLevel = 'LOW';

    if (lowerTask.includes('codigo') || lowerTask.includes('code') || lowerTask.includes('programar')) {
      taskType = 'code';
    } else if (lowerTask.includes('investigar') || lowerTask.includes('research') || lowerTask.includes('buscar')) {
      taskType = 'research';
    } else if (lowerTask.includes('local') || lowerTask.includes('privado') || lowerTask.includes('secreto')) {
      privacyRequired = 'HIGH';
    }

    const selection = this.route({ taskType, privacyRequired });
    return selection.provider;
  }

  /**
   * Método de retrocompatibilidad: Ejecuta y loguea selección.
   */
  public execute(task: string): string {
    const provider = this.select(task);
    console.log(`[ModelRouter] Modelo seleccionado para '${task}': ${provider}`);
    return provider;
  }
}