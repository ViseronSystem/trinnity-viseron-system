import { ITool, ToolType, ToolExecutionResult } from "../types";

/**
 * ToolManager - Gestor de Herramientas e Integraciones para Trinnity Viseron System v1.0
 * Soporta n8n, REST APIs, MCP, Webhooks, Bases de Datos y Automatizaciones.
 */
export class ToolManager {
  private tools: Map<string, ITool> = new Map();

  /**
   * Registra una herramienta en el sistema.
   */
  public registerTool(tool: ITool): void {
    if (this.tools.has(tool.id)) {
      console.warn(`[ToolManager] Herramienta '${tool.name}' (ID: ${tool.id}) ya existe. Reemplazando.`);
    }
    this.tools.set(tool.id, tool);
    console.log(`[ToolManager] Herramienta registrada: '${tool.name}' (Tipo: ${tool.type})`);
  }

  /**
   * Obtiene una herramienta por su ID.
   */
  public getTool(toolId: string): ITool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Lista herramientas registradas, opcionalmente filtradas por tipo.
   */
  public listTools(typeFilter?: ToolType): ITool[] {
    const all = Array.from(this.tools.values());
    if (typeFilter) {
      return all.filter(t => t.type === typeFilter);
    }
    return all;
  }

  /**
   * Habilita o deshabilita una herramienta.
   */
  public setToolEnabled(toolId: string, enabled: boolean): boolean {
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Ejecuta una herramienta de manera controlada y registra métricas.
   */
  public async executeTool(toolId: string, input: Record<string, any>): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return {
        toolId,
        toolName: 'Desconocida',
        success: false,
        result: null,
        executionTimeMs: 0,
        error: `Herramienta con ID '${toolId}' no encontrada.`
      };
    }

    if (!tool.enabled) {
      return {
        toolId: tool.id,
        toolName: tool.name,
        success: false,
        result: null,
        executionTimeMs: 0,
        error: `La herramienta '${tool.name}' está desactivada.`
      };
    }

    const start = Date.now();
    try {
      console.log(`[ToolManager] Ejecutando herramienta '${tool.name}'...`);
      const result = await tool.execute(input);
      const executionTimeMs = Date.now() - start;
      return {
        toolId: tool.id,
        toolName: tool.name,
        success: true,
        result: result.result !== undefined ? result.result : result,
        executionTimeMs
      };
    } catch (err: any) {
      return {
        toolId: tool.id,
        toolName: tool.name,
        success: false,
        result: null,
        executionTimeMs: Date.now() - start,
        error: err.message || String(err)
      };
    }
  }

  /**
   * Crea un adaptador rápido para integraciones estándar.
   */
  public createQuickTool(
    id: string, 
    name: string, 
    type: ToolType, 
    description: string, 
    handler: (input: Record<string, any>) => Promise<any>
  ): ITool {
    const tool: ITool = {
      id,
      name,
      description,
      type,
      enabled: true,
      execute: async (input: Record<string, any>): Promise<ToolExecutionResult> => {
        const start = Date.now();
        const res = await handler(input);
        return {
          toolId: id,
          toolName: name,
          success: true,
          result: res,
          executionTimeMs: Date.now() - start
        };
      }
    };
    this.registerTool(tool);
    return tool;
  }
}
