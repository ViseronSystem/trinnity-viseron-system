// VISERON Cognitive Telemetry — tipos e estruturas de dados
// Cognitive Operating Layer · Sistema 0 · 2026-08-11

export interface CognitiveTraceInput {
  text?: string;
  audioFile?: string;
  lang?: string;
  embeddingsModel?: string;
}

export interface CognitiveTraceProcessing {
  embeddingMs?: number;
  retrievalMs?: number;
  retrievedChunks?: number;
  topScore?: number;
  rerankMs?: number;
  graphNodesVisited?: number;
  consolidationType?: string;
}

export interface CognitiveTraceResult {
  success: boolean;
  output?: string;
  sources?: string[];
  modelUsed?: string;
  latencyMs: number;
  tokensUsed?: number;
  error?: string;
}

export interface CognitiveTraceValidation {
  status: "PASS" | "FAIL" | "RETRY" | "HUMAN";
  verifiedBy?: string;
  reasons: string[];
  evidence?: any;
}

export interface CognitiveTraceLearning {
  newKnowledgeGenerated: boolean;
  knowledgeArchiveRef?: string;
  performanceScoreDelta?: number;
  insightsGenerated?: string[];
}

export interface CognitiveTrace {
  traceId: string;
  parentTraceId?: string;
  timestamp: number;

  source: "voice" | "chat" | "rag" | "graphrag" | "consolidation" | "evolution" | "atlas";
  agentId?: string;
  sessionId?: string;

  input: CognitiveTraceInput;
  processing: CognitiveTraceProcessing;
  result: CognitiveTraceResult;
  validation?: CognitiveTraceValidation;
  learning?: CognitiveTraceLearning;
}

export function createTraceId(): string {
  return "cog_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}
