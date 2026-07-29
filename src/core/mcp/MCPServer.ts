import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { ToolManager } from "../tools/ToolManager";
import { AgentManager } from "../AgentManager";
import { MemoryEngine } from "../memory/MemoryEngine";

export class TVSMCPServer {
  private mcpServer: McpServer;
  private toolManager: ToolManager;
  private agentManager: AgentManager;
  private memoryEngine: MemoryEngine;

  constructor(toolManager: ToolManager, agentManager: AgentManager, memoryEngine: MemoryEngine) {
    this.toolManager = toolManager;
    this.agentManager = agentManager;
    this.memoryEngine = memoryEngine;

    this.mcpServer = new McpServer({
      name: "trinnity-viseron-system",
      version: "4.0.0"
    }, {
      capabilities: { tools: {}, resources: {} }
    });

    this.registerCoreTools();
  }

  private registerCoreTools(): void {
    this.mcpServer.registerTool(
      "mcp_tools_list",
      { description: "Lista todas las herramientas MCP disponibles en TVS" },
      async () => {
        const tools = this.toolManager.listTools();
        return {
          content: [{ type: "text", text: JSON.stringify(tools.map(t => ({ name: t.name, description: t.description, type: t.type }))) }]
        };
      }
    );

    this.mcpServer.registerTool(
      "mcp_tool_execute",
      {
        description: "Ejecuta una herramienta registrada en TVS",
        inputSchema: z.object({ toolId: z.string(), input: z.any().optional() })
      } as any,
      async (args: any) => {
        const result = await this.toolManager.executeTool(args.toolId, args.input || {});
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
    );

    this.mcpServer.registerTool(
      "mcp_agents_list",
      { description: "Lista todos los agentes registrados en TVS" },
      async () => {
        const agents = this.agentManager.list();
        return {
          content: [{ type: "text", text: JSON.stringify(agents.map(a => ({ id: a.id, name: a.name, role: a.role, status: a.status, capabilities: a.capabilities }))) }]
        };
      }
    );

    this.mcpServer.registerTool(
      "mcp_agent_execute",
      {
        description: "Ejecuta una tarea en un agente específico",
        inputSchema: z.object({ agentId: z.string(), task: z.string() })
      } as any,
      async (args: any) => {
        const agents = this.agentManager.list();
        const agent = agents.find(a => a.id === args.agentId);
        if (!agent) {
          return { content: [{ type: "text", text: `Agente ${args.agentId} no encontrado` }] };
        }
        const result = await agent.execute(args.task);
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
    );

    this.mcpServer.registerTool(
      "mcp_memory_search",
      {
        description: "Busca en la memoria del sistema",
        inputSchema: z.object({ query: z.string(), maxResults: z.number().optional() })
      } as any,
      async (args: any) => {
        const results = this.memoryEngine.unifiedSearch(args.query, { maxResults: args.maxResults || 5 });
        return { content: [{ type: "text", text: JSON.stringify(results) }] };
      }
    );

    this.mcpServer.registerTool(
      "mcp_system_status",
      { description: "Obtiene el estado completo del sistema TVS" },
      async () => {
        const stats = this.memoryEngine.getStats();
        return {
          content: [{ type: "text", text: JSON.stringify({
            status: "ACTIVE",
            agents: this.agentManager.list().length,
            tools: this.toolManager.listTools().length,
            memory: stats,
            timestamp: Date.now()
          })}]
        };
      }
    );
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    console.error("[TVS MCP] Servidor MCP iniciado (stdio)");
  }

  getMcpServer(): McpServer {
    return this.mcpServer;
  }
}
