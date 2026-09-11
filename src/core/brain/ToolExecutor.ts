import { ComposioBridge } from "../composio/ComposioBridge";
import { ToolManager } from "../tools/ToolManager";
import { ViseronModelRouter } from "../model-router/ViseronModelRouter";
import { PlannedStep } from "./TaskPlanner";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/**
 * ToolExecutor — Executor genérico de ferramentas que unifica Composio, código, arquivos, shell e IA.
 * 
 * Cada step do TaskPlanner é executado através deste executor, que:
 *   - Encontra a ferramenta correta
 *   - Constrói argumentos a partir do contexto
 *   - Executa com timeout e retry
 *   - Regista resultado para aprendizagem
 */

export type ToolType = "composio" | "code" | "file" | "shell" | "ai" | "web" | "memory";

export interface ToolExecution {
  stepId: string;
  toolType: ToolType;
  toolName: string;
  input: Record<string, any>;
  output: any;
  success: boolean;
  error?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface ToolExecutionContext {
  step: PlannedStep;
  request: string;
  previousResults: Record<string, any>;
  dataDir: string;
  sessionId?: string;
  clientContext?: string;
}

export class ToolExecutor {
  private composio: ComposioBridge;
  private toolManager: ToolManager;
  private router: ViseronModelRouter;
  private executions: ToolExecution[] = [];

  constructor(
    composio: ComposioBridge,
    toolManager: ToolManager,
    router: ViseronModelRouter
  ) {
    this.composio = composio;
    this.toolManager = toolManager;
    this.router = router;
  }

  async executeStep(ctx: ToolExecutionContext): Promise<ToolExecution> {
    const { step, request, previousResults, dataDir } = ctx;
    const startedAt = new Date().toISOString();
    const start = Date.now();

    const primaryTool = step.toolsNeeded[0] || "ai";
    const toolType = this.resolveToolType(primaryTool);

    let output: any = null;
    let success = false;
    let error: string | undefined;

    try {
      switch (toolType) {
        case "composio":
          output = await this.executeComposio(step, request, previousResults);
          success = true;
          break;
        case "code":
          output = await this.executeCode(step, request, previousResults, dataDir);
          success = true;
          break;
        case "file":
          output = await this.executeFile(step, request, previousResults, dataDir);
          success = true;
          break;
        case "shell":
          output = await this.executeShell(step, request, dataDir);
          success = true;
          break;
        case "ai":
        default:
          output = await this.executeAI(step, request, previousResults);
          success = true;
          break;
      }
    } catch (e: any) {
      error = e.message || String(e);
      success = false;
      output = { error };
    }

    const execution: ToolExecution = {
      stepId: step.id,
      toolType,
      toolName: primaryTool,
      input: { description: step.description, toolsNeeded: step.toolsNeeded },
      output,
      success,
      error,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };

    this.executions.push(execution);
    return execution;
  }

  private resolveToolType(toolHint: string): ToolType {
    if (toolHint.startsWith("composio_")) return "composio";
    if (toolHint === "code" || toolHint === "typescript" || toolHint === "javascript") return "code";
    if (toolHint === "file" || toolHint === "write" || toolHint === "read") return "file";
    if (toolHint === "shell" || toolHint === "bash" || toolHint === "command") return "shell";
    if (toolHint === "web" || toolHint === "search" || toolHint === "fetch") return "web";
    if (toolHint === "memory") return "memory";
    return "ai";
  }

  /**
   * Executa uma ferramenta Composio (Gmail, Slack, GitHub, etc.)
   */
  private async executeComposio(
    step: PlannedStep,
    request: string,
    prevResults: Record<string, any>
  ): Promise<any> {
    if (!this.composio.configured) {
      return { message: "Composio não configurado — falta COMPOSIO_API_KEY", fallback: true };
    }
    await this.composio.connect();

    const appHint = step.toolsNeeded.find(t => t.startsWith("composio_")) || "";
    const appName = appHint.replace("composio_", "");

    // Search for the right tool
    const searchResult = await this.composio.callTool("COMPOSIO_SEARCH_TOOLS", {
      queries: [{ use_case: `${step.description} for ${appName || "any app"}` }],
    });
    const searchParsed = JSON.parse(searchResult.output);
    const slug = searchParsed?.data?.results?.[0]?.primary_tool_slugs?.[0];

    if (!slug) {
      return { message: `No Composio tool found for: ${step.description}`, fallback: true };
    }

    // Get schema
    const schemasResult = await this.composio.callTool("COMPOSIO_GET_TOOL_SCHEMAS", {
      tool_slugs: [slug],
    });
    const schemasParsed = JSON.parse(schemasResult.output);
    const schema = schemasParsed?.data?.tool_schemas?.[slug]?.input_schema;

    if (!schema) {
      return { message: `Tool ${slug} found but no schema available`, fallback: true };
    }

    // Build args from context
    const args = this.buildComposioArgs(schema, step.description, prevResults);

    // Execute
    const execResult = await this.composio.callTool("COMPOSIO_MULTI_EXECUTE_TOOL", {
      tools: [{ tool_slug: slug, input_params: args }],
      thought: `Execute ${slug} for: ${step.description.slice(0, 100)}`,
    });
    const execParsed = JSON.parse(execResult.output);
    const res = execParsed?.data?.results?.[0]?.response;

    return {
      tool: slug,
      success: res?.successful !== false,
      data: res?.data,
      raw: execParsed?.data,
    };
  }

  private buildComposioArgs(
    schema: any,
    description: string,
    prevResults: Record<string, any>
  ): Record<string, any> {
    const props = schema.properties || {};
    const args: Record<string, any> = {};

    // Try to match description to text fields
    const textFields = ["content", "text", "body", "message", "status", "description", "title", "name", "query", "search"];
    for (const field of textFields) {
      if (props[field]) {
        args[field] = description.slice(0, 500);
        break;
      }
    }

    // Fill required fields with context
    const required = schema.required || [];
    for (const field of required) {
      if (args[field]) continue;
      const prop = props[field];
      if (prop?.type === "string") {
        args[field] = description.slice(0, 200);
      } else if (prop?.type === "integer" || prop?.type === "number") {
        args[field] = 10;
      } else if (prop?.type === "boolean") {
        args[field] = true;
      }
    }

    return args;
  }

  /**
   * Executa código gerado por IA (TypeScript/JavaScript)
   */
  private async executeCode(
    step: PlannedStep,
    request: string,
    prevResults: Record<string, any>,
    dataDir: string
  ): Promise<any> {
    const prompt = `Generate TypeScript/JavaScript code for this task. Return ONLY the code, no explanation.
Task: ${step.description}
Context: ${request.slice(0, 500)}
Previous results: ${JSON.stringify(prevResults).slice(0, 300)}

The code should be self-contained and executable. Use console.log() for output.`;

    const result = await this.router.resolve(prompt, {
      taskType: "code",
      temperature: 0.3,
      maxTokens: 3000,
    });

    if (!result.ok || !result.text) {
      return { message: "AI could not generate code", fallback: true };
    }

    const code = this.extractCode(result.text);
    if (!code) {
      return { generatedCode: result.text, message: "Code extracted from AI response" };
    }

    // Write code to temp file and execute
    const tmpFile = path.join(dataDir, "tmp", `code_${step.id}.ts`);
    const dir = path.dirname(tmpFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(tmpFile, code, "utf8");

    try {
      const output = execSync(`npx tsx "${tmpFile}"`, {
        timeout: 30000,
        encoding: "utf8",
        cwd: dataDir,
        env: { ...process.env, NODE_ENV: "development" },
      });
      return { code, output: output.trim(), executed: true };
    } catch (e: any) {
      return { code, output: e.stdout || e.stderr || e.message, executed: false };
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }

  /**
   * Gera e escreve arquivos (sites, apps, documentos)
   */
  private async executeFile(
    step: PlannedStep,
    request: string,
    prevResults: Record<string, any>,
    dataDir: string
  ): Promise<any> {
    const prompt = `Generate file content for this task.
Task: ${step.description}
Context: ${request.slice(0, 500)}
Previous results: ${JSON.stringify(prevResults).slice(0, 300)}

Return JSON with: { "filename": "name.html", "content": "...", "type": "html|css|js|json|md" }`;

    const result = await this.router.resolve(prompt, {
      taskType: "creative",
      temperature: 0.5,
      maxTokens: 4000,
    });

    if (!result.ok || !result.text) {
      return { message: "AI could not generate file content", fallback: true };
    }

    try {
      const cleaned = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const fileData = JSON.parse(jsonMatch[0]);
        if (fileData.filename && fileData.content) {
          const outputDir = path.join(dataDir, "generated", step.id);
          if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
          const filePath = path.join(outputDir, fileData.filename);
          fs.writeFileSync(filePath, fileData.content, "utf8");
          return { filename: fileData.filename, path: filePath, type: fileData.type, written: true };
        }
      }
    } catch {}

    return { raw: result.text, message: "File content generated (could not parse structured output)" };
  }

  /**
   * Executa comandos shell
   */
  private async executeShell(
    step: PlannedStep,
    request: string,
    dataDir: string
  ): Promise<any> {
    const prompt = `Generate a shell command for this task. Return ONLY the command, nothing else.
Task: ${step.description}
Context: ${request.slice(0, 300)}

Important: Use safe commands. Never use rm -rf, del /f, or destructive operations.`;

    const result = await this.router.resolve(prompt, {
      taskType: "code",
      temperature: 0.2,
      maxTokens: 200,
    });

    if (!result.ok || !result.text) {
      return { message: "AI could not generate command", fallback: true };
    }

    const command = result.text.replace(/```bash\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Safety check
    if (/(rm\s+-rf|del\s+\/f|format\s+c:|shutdown)/i.test(command)) {
      return { command, blocked: true, message: "Dangerous command blocked by safety policy" };
    }

    try {
      const output = execSync(command, {
        timeout: 30000,
        encoding: "utf8",
        cwd: dataDir,
        env: { ...process.env, NODE_ENV: "development" },
      });
      return { command, output: output.trim(), executed: true };
    } catch (e: any) {
      return { command, output: e.stdout || e.stderr || e.message, executed: false };
    }
  }

  /**
   * Gera resposta/composição via IA
   */
  private async executeAI(
    step: PlannedStep,
    request: string,
    prevResults: Record<string, any>
  ): Promise<any> {
    const contextStr = Object.keys(prevResults).length > 0
      ? `\nPrevious step results:\n${JSON.stringify(prevResults, null, 2).slice(0, 1000)}`
      : "";

    const prompt = `Task: ${step.description}
Original request: ${request.slice(0, 500)}${contextStr}

Execute this task thoroughly. Provide a detailed, actionable result.`;

    const result = await this.router.resolve(prompt, {
      taskType: "general",
      temperature: 0.6,
      maxTokens: 2000,
    });

    return {
      text: result.text || "(no response)",
      provider: result.provider,
      model: result.model,
      ok: result.ok,
    };
  }

  private extractCode(text: string): string | null {
    const patterns = [
      /```typescript\n([\s\S]*?)```/,
      /```javascript\n([\s\S]*?)```/,
      /```ts\n([\s\S]*?)```/,
      /```js\n([\s\S]*?)```/,
      /```\n([\s\S]*?)```/,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  }

  getExecutions(): ToolExecution[] {
    return [...this.executions];
  }

  clearExecutions(): void {
    this.executions = [];
  }
}
