import { z } from "zod";

export const SquadObjectiveSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  metric: z.string().min(1),
  target: z.number().optional(),
});

export const SquadToolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const SquadWorkflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  steps: z.array(z.string()).default([]),
});

export const SquadMemorySchema = z.object({
  stm: z.boolean().default(true),
  ltm: z.boolean().default(true),
  sharedGraph: z.boolean().default(true),
  vector: z.boolean().default(false),
});

export const SquadPermissionSchema = z.object({
  resource: z.string().min(1),
  actions: z.array(z.string()).default([]),
});

export const SquadSpecSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  domain: z.string().default("general"),
  status: z.enum(["ACTIVE", "PAUSED", "INACTIVE"]).default("ACTIVE"),
  objectives: z.array(SquadObjectiveSchema).default([]),
  tools: z.array(SquadToolSchema).default([]),
  workflows: z.array(SquadWorkflowSchema).default([]),
  memory: SquadMemorySchema.default({}),
  permissions: z.array(SquadPermissionSchema).default([]),
  agents: z.array(z.string()).default([]),
});

export type SquadSpec = z.infer<typeof SquadSpecSchema>;

export function parseSquadSpec(raw: unknown): SquadSpec {
  return SquadSpecSchema.parse(raw);
}
