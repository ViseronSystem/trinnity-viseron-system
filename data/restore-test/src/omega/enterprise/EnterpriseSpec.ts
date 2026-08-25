import { z } from "zod";

export const enterpriseModuleSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  domain: z.enum(["sales", "crm", "marketing", "finance", "legal", "support"]),
  description: z.string().min(5),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  objectives: z.array(z.object({ id: z.string(), description: z.string(), metric: z.string(), target: z.number().optional() })).default([]),
  kpis: z.array(z.string()).default([]),
  workflows: z.array(z.object({ id: z.string(), name: z.string(), steps: z.array(z.string()).min(2) })).default([]),
  tools: z.array(z.object({ id: z.string(), name: z.string(), description: z.string() })).default([]),
  agents: z.array(z.string()).default([]),
  reportIntervalMinutes: z.number().default(60),
});

export type EnterpriseModuleSpec = z.infer<typeof enterpriseModuleSchema>;

export interface EnterpriseActionInput {
  moduleId: string;
  workflowId?: string;
  task: string;
  context?: Record<string, any>;
}

export interface EnterpriseActionResult {
  moduleId: string;
  moduleName: string;
  domain: string;
  workflow?: string;
  results: { agentId: string; name?: string; role?: string; success?: boolean; output?: string; error?: string }[];
  failed: number;
  succeeded: number;
  executionTimeMs: number;
}

export interface EnterpriseHubStatus {
  loaded: number;
  active: number;
  modules: { id: string; name: string; domain: string; status: string; agents: number; kpis: string[] }[];
  failures: string[];
}
