/**
 * Trinnity Viseron System v1.0 - Core Types & Interfaces
 */

// ==========================================
// Agent System Interfaces
// ==========================================

export type AgentStatus = 'ACTIVE' | 'PAUSED' | 'INACTIVE' | 'ERROR';

export interface AgentCapability {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface IAgent {
  id: string;
  name: string;
  role: string;
  description?: string;
  status: AgentStatus;
  capabilities: string[];
  execute(task: string, context?: Record<string, any>): Promise<AgentExecutionResult>;
}

export interface AgentExecutionResult {
  agentId: string;
  agentName: string;
  success: boolean;
  output: string;
  data?: any;
  executionTimeMs: number;
  error?: string;
}

// ==========================================
// Model Router Interfaces
// ==========================================

export type ModelProvider = 
  // Local Models
  | 'ollama' | 'deepseek' | 'qwen' | 'mistral'
  // External / Cloud Models
  | 'openai' | 'claude' | 'gemini' | 'grok'
  // OmniRoute Gateway (290+ providers)
  | 'omniroute';

export type PrivacyLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type SpeedPreference = 'FAST' | 'BALANCED' | 'QUALITY';

export interface ModelRoutingCriteria {
  taskType: 'code' | 'research' | 'reasoning' | 'general' | 'creative' | 'automation';
  privacyRequired?: PrivacyLevel;
  speedPreference?: SpeedPreference;
  maxCostPer1kTokens?: number;
  qualityRequired?: 'STANDALONE' | 'HIGH' | 'PREMIUM';
  forceLocal?: boolean;
}

export interface ModelSelection {
  provider: ModelProvider;
  modelName: string;
  isLocal: boolean;
  estimatedLatencyMs: number;
  estimatedCostPer1kTokens: number;
  reason: string;
}

// ==========================================
// Memory Engine Interfaces
// ==========================================

export interface ShortTermMemoryItem {
  id: string;
  sessionId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface LongTermMemoryItem {
  id: string;
  key: string;
  value: any;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

export interface VectorEmbedding {
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

// ==========================================
// Tool Manager Interfaces
// ==========================================

export type ToolType = 'N8N' | 'REST_API' | 'MCP' | 'WEBHOOK' | 'DATABASE' | 'AUTOMATION';

export interface ITool {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  enabled: boolean;
  execute(input: Record<string, any>): Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  toolId: string;
  toolName: string;
  success: boolean;
  result: any;
  executionTimeMs: number;
  error?: string;
}

// ==========================================
// Memory Engine Enhanced Interfaces
// ==========================================

export interface MemoryConfig {
  stmMaxItemsPerSession: number;
  stmTtlMs: number;
  ltmAutoSaveIntervalMs: number;
  ltmBackupEnabled: boolean;
  ltmMaxBackupFiles: number;
  kbMinScoreForMatch: number;
}

export type MemoryEventType = 'stm:added' | 'stm:cleared' | 'stm:evicted' | 'ltm:set' | 'ltm:deleted' | 'kb:added' | 'vector:stored' | 'consolidation:run';

export interface MemoryEvent {
  type: MemoryEventType;
  timestamp: number;
  data?: Record<string, any>;
}

export interface MemoryStats {
  shortTerm: {
    totalSessions: number;
    totalItems: number;
    avgItemsPerSession: number;
    memoryUsageBytes: number;
  };
  longTerm: {
    totalItems: number;
    totalTags: number;
    lastSaved: number | null;
    backupCount: number;
  };
  knowledge: {
    totalDocuments: number;
    totalCategories: number;
  };
  vector: {
    totalVectors: number;
    provider: 'qdrant' | 'fallback' | 'unavailable';
  };
  consolidation: {
    lastRun: number | null;
    totalPromoted: number;
  };
}

export interface SearchOptions {
  maxResults?: number;
  minScore?: number;
  includeSTM?: boolean;
  includeLTM?: boolean;
  includeKB?: boolean;
}

export interface UnifiedSearchResult {
  source: 'stm' | 'ltm' | 'kb';
  id: string;
  title: string;
  content: string;
  score: number;
  timestamp: number;
  tags?: string[];
}

// ==========================================
// Orchestrator Interfaces
// ==========================================

export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface TVSTask {
  id: string;
  title: string;
  description: string;
  requirements?: ModelRoutingCriteria;
  status: TaskStatus;
  subtasks?: TVSTask[];
  assignedAgentId?: string;
  result?: any;
  createdAt: number;
  completedAt?: number;
}

export interface OrchestrationReport {
  taskId: string;
  status: TaskStatus;
  subtaskResults: AgentExecutionResult[];
  overallOutput: string;
  durationMs: number;
}
