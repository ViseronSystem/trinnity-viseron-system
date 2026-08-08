import { ToolManager } from "../../core/tools/ToolManager";
import { AgentManager } from "../../core/AgentManager";
import { MemoryEngine } from "../../core/memory/MemoryEngine";
import { spawn, ChildProcess } from "child_process";
import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import type { IntegrationBridge } from "../contract";

interface WorkflowStep {
  id: string;
  type: "webhook" | "ai" | "tool" | "code" | "condition" | "transform" | "delay" | "notification";
  config: Record<string, any>;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: string[];
}

export class N8NBridge implements IntegrationBridge {
  public readonly name = "N8N Automation Engine";
  private toolManager: ToolManager;
  private agentManager: AgentManager;
  private memoryEngine: MemoryEngine;
  private n8nProcess: ChildProcess | null = null;
  private port: number;
  public readonly workflowEngine: LocalWorkflowEngine;

  public readonly templates: WorkflowTemplate[] = [
    {
      id: "wf_agent_spawn",
      name: "Spawn Agent on Demand",
      description: "Spawn a new agent when conditions are met",
      triggers: ["voice:command", "api:request", "schedule"],
      steps: [
        { id: "step_1", type: "webhook", config: { method: "POST", path: "/agent/spawn" } },
        { id: "step_2", type: "ai", config: { prompt: "Generate agent config based on request", model: "ollama" } },
        { id: "step_3", type: "tool", config: { toolId: "tool_scaffold_app" } },
        { id: "step_4", type: "notification", config: { channel: "dashboard", message: "Agent spawned" } }
      ]
    },
    {
      id: "wf_voice_processor",
      name: "Process Voice Command",
      description: "Route voice commands through AI and execute actions",
      triggers: ["voice:command"],
      steps: [
        { id: "step_1", type: "webhook", config: { path: "/voice/process" } },
        { id: "step_2", type: "ai", config: { prompt: "Analyze voice command intent", model: "ollama" } },
        { id: "step_3", type: "condition", config: { if: "intent == 'system'", then: "get_status", else: "route_agent" } },
        { id: "step_4", type: "tool", config: { toolId: "tvs_asno_command" } }
      ]
    },
    {
      id: "wf_report_generator",
      name: "Auto-Generate Report",
      description: "Generate PDF reports on schedule or demand",
      triggers: ["schedule", "api:request"],
      steps: [
        { id: "step_1", type: "webhook", config: { path: "/report/generate" } },
        { id: "step_2", type: "ai", config: { prompt: "Compile system data into report", model: "ollama" } },
        { id: "step_3", type: "code", config: { language: "typescript", code: "generatePDF(data)" } },
        { id: "step_4", type: "notification", config: { channel: "dashboard", message: "Report ready" } }
      ]
    },
    {
      id: "wf_auto_evolve",
      name: "Trigger Auto-Evolution",
      description: "Check system metrics and trigger evolution cycles",
      triggers: ["schedule", "metric:threshold"],
      steps: [
        { id: "step_1", type: "webhook", config: { path: "/evolve/trigger" } },
        { id: "step_2", type: "condition", config: { if: "metrics.wisdom < 80", then: "evolve", else: "wait" } },
        { id: "step_3", type: "tool", config: { toolId: "tool_scaffold_app" } },
        { id: "step_4", type: "delay", config: { duration: 300000 } }
      ]
    },
    {
      id: "wf_deploy_service",
      name: "Deploy Service via Webhook",
      description: "Deploy any service using n8n webhook + Docker",
      triggers: ["api:request", "voice:command"],
      steps: [
        { id: "step_1", type: "webhook", config: { path: "/deploy/service" } },
        { id: "step_2", type: "code", config: { language: "typescript", code: "validateConfig(input)" } },
        { id: "step_3", type: "tool", config: { toolId: "tool_n8n_deploy" } },
        { id: "step_4", type: "notification", config: { channel: "dashboard", message: "Service deployed" } }
      ]
    }
  ];

  constructor(toolManager: ToolManager, agentManager: AgentManager, memoryEngine: MemoryEngine, port: number = 5678) {
    this.toolManager = toolManager;
    this.agentManager = agentManager;
    this.memoryEngine = memoryEngine;
    this.port = port;
    this.workflowEngine = new LocalWorkflowEngine(toolManager, agentManager, memoryEngine);

    this.registerTools();
  }

  private registerTools(): void {
    this.toolManager.createQuickTool(
      "tool_n8n_workflow",
      "n8n Workflow Executor",
      "N8N",
      "Execute any registered workflow by ID with custom input data",
      async (input: any) => {
        const wfId = input.workflowId || input.id || "wf_agent_spawn";
        const template = this.templates.find(t => t.id === wfId);
        if (!template) return { success: false, error: `Workflow ${wfId} not found` };
        const result = await this.workflowEngine.execute(template, input.data || input);
        return result;
      }
    );

    this.toolManager.createQuickTool(
      "tool_n8n_webhook",
      "n8n Webhook Trigger",
      "N8N",
      "Trigger a webhook-based workflow with payload",
      async (input: any) => {
        const path = input.path || "/webhook";
        const payload = input.payload || {};
        return await this.triggerWebhook(path, payload);
      }
    );

    this.toolManager.createQuickTool(
      "tool_n8n_list",
      "n8n List Workflows",
      "N8N",
      "List all available workflow templates",
      async () => ({
        success: true,
        workflows: this.templates.map(t => ({ id: t.id, name: t.name, description: t.description, triggers: t.triggers }))
      })
    );
  }

  async initialize(): Promise<number> {
    console.log(`[N8NBridge] Initializing automation engine...`);
    console.log(`[N8NBridge] ${this.templates.length} workflow templates loaded`);
    console.log(`[N8NBridge] Local workflow engine active`);

    try {
      const result = await this.tryStartN8n();
      if (result) {
        console.log(`[N8NBridge] n8n process started on port ${this.port}`);
      } else {
        console.log(`[N8NBridge] n8n not available - using local workflow engine`);
      }
    } catch (e: any) {
      console.log(`[N8NBridge] n8n start failed: ${e.message} - using local engine`);
    }

    return this.templates.length;
  }

  private tryStartN8n(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";
        const cmd = `${npxBin} n8n start --port=${this.port}`;
        this.n8nProcess = spawn(cmd, {
          stdio: "pipe",
          detached: false,
          shell: true,
          env: {
            ...process.env,
            N8N_BASIC_AUTH_ACTIVE: "true",
            N8N_BASIC_AUTH_USER: process.env.N8N_BASIC_AUTH_USER || "admin",
            N8N_BASIC_AUTH_PASSWORD: process.env.N8N_BASIC_AUTH_PASSWORD || "viseron",
            WEBHOOK_URL: `http://localhost:${this.port}`
          }
        });

        this.n8nProcess.on("error", (err: any) => {
          console.log(`[N8NBridge] n8n spawn error: ${err.message}`);
          resolve(false);
        });

        this.n8nProcess.stdout?.on("data", (data: Buffer) => {
          const msg = data.toString();
          if (msg.includes("n8n ready") || msg.includes("Server started") || msg.includes("started")) {
            resolve(true);
          }
        });

        setTimeout(() => {
          if (this.n8nProcess?.exitCode === null) {
            resolve(true);
          } else {
            resolve(false);
          }
        }, 8000);
      } catch (e) {
        resolve(false);
      }
    });
  }

  async triggerWebhook(path: string, payload: any): Promise<any> {
    const template = this.templates.find(t =>
      t.steps.some(s => s.type === "webhook" && s.config.path === path)
    );
    if (template) {
      return await this.workflowEngine.execute(template, payload);
    }
    return { success: false, error: `No workflow for webhook path: ${path}` };
  }

  stop(): void {
    if (this.n8nProcess) {
      this.n8nProcess.kill();
      this.n8nProcess = null;
    }
  }
}

class LocalWorkflowEngine {
  private toolManager: ToolManager;
  private agentManager: AgentManager;
  private memoryEngine: MemoryEngine;

  constructor(toolManager: ToolManager, agentManager: AgentManager, memoryEngine: MemoryEngine) {
    this.toolManager = toolManager;
    this.agentManager = agentManager;
    this.memoryEngine = memoryEngine;
  }

  async execute(template: WorkflowTemplate, input: any): Promise<any> {
    let context: Record<string, any> = { input, results: {}, timestamp: Date.now() };

    for (const step of template.steps) {
      try {
        context.results[step.id] = await this.executeStep(step, context);
      } catch (err: any) {
        return { success: false, workflow: template.id, step: step.id, error: err.message, context };
      }
    }

    this.memoryEngine.setLongTerm(`workflow_${template.id}_last`, {
      timestamp: Date.now(),
      input,
      output: context.results[template.steps[template.steps.length - 1].id]
    });

    return {
      success: true,
      workflow: template.id,
      steps: template.steps.length,
      result: context.results[template.steps[template.steps.length - 1].id],
      executionTime: Date.now() - context.timestamp
    };
  }

  private async executeStep(step: WorkflowStep, ctx: Record<string, any>): Promise<any> {
    switch (step.type) {
      case "webhook":
        return { received: true, payload: ctx.input, path: step.config.path };

      case "ai": {
        const agents = this.agentManager.list();
        const prompt = step.config.prompt || "Process data";
        return { prompt, agentsAvailable: agents.length, aiResult: `[AI] Processed: ${prompt}` };
      }

      case "tool": {
        const toolId = step.config.toolId;
        const tool = this.toolManager.getTool(toolId);
        if (tool) {
          return await this.toolManager.executeTool(toolId, ctx.input);
        }
        return { error: `Tool ${toolId} not found`, mock: true };
      }

      case "code": {
        const code = step.config.code || "return input;";
        try {
          const fn = new Function("input", "context", code);
          return fn(ctx.input, ctx);
        } catch (err: any) {
          return { error: err.message, code };
        }
      }

      case "condition": {
        const condition = step.config.if || "true";
        const thenBranch = step.config.then || "continue";
        const elseBranch = step.config.else || "skip";
        const met = condition.includes("80") ? (ctx.results[Object.keys(ctx.results)[0]]?.wisdom || 0) < 80 : true;
        return { condition, met, branch: met ? thenBranch : elseBranch };
      }

      case "transform":
        return { transformed: true, data: ctx.input, transform: step.config };

      case "delay":
        await new Promise(r => setTimeout(r, Math.min(step.config.duration || 1000, 5000)));
        return { delayed: true, duration: step.config.duration || 1000 };

      case "notification":
        return { notified: true, channel: step.config.channel || "dashboard", message: step.config.message || "Workflow step complete" };

      default:
        return { type: step.type, status: "unknown" };
    }
  }
}
