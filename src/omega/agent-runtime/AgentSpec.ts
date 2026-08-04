import { z } from "zod";

export const AgentPermissionSchema = z.object({
  resource: z.string(),
  actions: z.array(z.string()),
});

export const AgentMemorySchema = z.object({
  stm: z.boolean().default(true),
  ltm: z.boolean().default(true),
  knowledgeBase: z.boolean().default(true),
  graph: z.boolean().default(false),
  vector: z.boolean().default(false),
  retentionDays: z.number().min(1).default(30),
});

export const AgentToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

export const AgentObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  metric: z.string(),
  target: z.number().optional(),
});

export const AgentMetricsSchema = z.object({
  kpis: z.array(z.string()).default([]),
  reportIntervalMinutes: z.number().min(1).default(60),
});

export const AgentSpecSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  squad: z.string().default("core"),
  status: z.enum(["ACTIVE", "PAUSED", "INACTIVE", "ERROR"]).default("ACTIVE"),
  capabilities: z.array(z.string()).min(1),
  systemPrompt: z.string().min(1),
  permissions: z.array(AgentPermissionSchema).default([]),
  memory: AgentMemorySchema.default({}),
  tools: z.array(AgentToolSchema).default([]),
  objectives: z.array(AgentObjectiveSchema).default([]),
  metrics: AgentMetricsSchema.default({}),
  provider: z.object({
    preferred: z.enum(["ollama", "deepseek", "qwen", "mistral", "openai", "claude", "gemini", "grok", "omniroute"]).optional(),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().int().positive().default(2048),
    forceLocal: z.boolean().default(false),
  }).default({}),
  version: z.string().default("1.0.0"),
});

export type AgentSpec = z.infer<typeof AgentSpecSchema>;

export function parseAgentSpec(raw: unknown): AgentSpec {
  return AgentSpecSchema.parse(raw);
}

export function validateAgentSpecs(raw: unknown[]): { valid: AgentSpec[]; invalid: { index: number; error: string }[] } {
  const valid: AgentSpec[] = [];
  const invalid: { index: number; error: string }[] = [];
  raw.forEach((entry, i) => {
    try {
      valid.push(parseAgentSpec(entry));
    } catch (err: any) {
      invalid.push({ index: i, error: err?.issues?.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ") || String(err) });
    }
  });
  return { valid, invalid };
}

export function specToSmartAgentConfig(spec: AgentSpec) {
  return {
    id: spec.id,
    name: spec.name,
    role: spec.role,
    description: spec.description,
    capabilities: spec.capabilities,
    systemPrompt: spec.systemPrompt,
    preferredProvider: spec.provider.preferred,
    temperature: spec.provider.temperature,
    maxTokens: spec.provider.maxTokens,
  };
}
