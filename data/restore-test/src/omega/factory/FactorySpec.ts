import { z } from "zod";

export const factoryOrderSchema = z.object({
  name: z.string().min(2),
  industry: z.string().default("tecnologia"),
  description: z.string().min(10),
  goals: z.array(z.string()).default([]),
  painPoints: z.array(z.string()).default([]),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  template: z.enum(["express-api", "react-spa", "express-react", "cli-tool", "microservice", "dashboard"]).default("express-api"),
  deployTo: z.array(z.enum(["vercel", "render", "docker", "local"])).default(["local"]),
  outputDir: z.string().optional(),
});

export type FactoryOrder = z.infer<typeof factoryOrderSchema>;

export type FactoryStageKind = "ANALYZE" | "DESIGN" | "BUILD" | "DEPLOY";

export interface FactoryStageResult {
  stage: FactoryStageKind;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  startedAt: number;
  finishedAt?: number;
  artifacts: string[];
  notes: string[];
}

export interface FactoryRunResult {
  id: string;
  order: FactoryOrder;
  diagnosis: string;
  architecture: string;
  techStack: string[];
  implementationPlan: string;
  deploySteps: string[];
  stages: FactoryStageResult[];
  status: "DRAFT" | "IN_PROGRESS" | "APPROVED" | "COMPLETED" | "FAILED";
  createdAt: number;
  error?: string;
}

export const factoryRunSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  stages: z.array(z.object({ stage: z.string(), status: z.string() })),
});

export type FactoryRunSchema = z.infer<typeof factoryRunSchema>;
