import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { ITool, ToolType } from "../types";
import { ToolManager } from "../tools/ToolManager";

/**
 * ComposioBridge - Consumidor MCP (Streamable HTTP) das ferramentas Composio
 * para Trinnity Viseron System v5.0.
 *
 * O TVS liga-se a https://connect.composio.dev/mcp como cliente MCP e
 * disponibiliza as ferramentas (Gmail, Slack, GitHub, Calendário, etc.) aos
 * agentes através do ToolManager.
 */
export interface ComposioToolInfo {
  name: string;
  description?: string;
  inputSchema?: Record<string, any>;
}

export interface ComposioStatus {
  configured: boolean;
  connected: boolean;
  endpoint: string;
  tools: number;
  lastError: string | null;
}

const DEFAULT_ENDPOINT = "https://connect.composio.dev/mcp";

export class ComposioBridge {
  private endpoint: string;
  private apiKey: string;
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private toolsCache: ComposioToolInfo[] = [];
  private lastError: string | null = null;
  private connecting: Promise<boolean> | null = null;

  constructor(options?: { endpoint?: string; apiKey?: string }) {
    this.endpoint = options?.endpoint || process.env.COMPOSIO_MCP_URL || DEFAULT_ENDPOINT;
    this.apiKey = options?.apiKey || process.env.COMPOSIO_API_KEY || "";
  }

  get configured(): boolean {
    return this.apiKey.length > 0;
  }

  get connected(): boolean {
    return this.client !== null;
  }

  get toolCount(): number {
    return this.toolsCache.length;
  }

  getStatus(): ComposioStatus {
    return {
      configured: this.configured,
      connected: this.connected,
      endpoint: this.endpoint,
      tools: this.toolCount,
      lastError: this.lastError,
    };
  }

  async connect(): Promise<boolean> {
    if (!this.configured) {
      this.lastError = "COMPOSIO_API_KEY não definida no .env";
      return false;
    }
    if (this.client) return true;
    if (this.connecting) return this.connecting;
    this.connecting = this.doConnect();
    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  private async doConnect(): Promise<boolean> {
    try {
      const transport = new StreamableHTTPClientTransport(new URL(this.endpoint), {
        requestInit: {
          headers: {
            "x-consumer-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      });
      const client = new Client({ name: "trinnity-viseron-system", version: "5.0.0" });
      await client.connect(transport);
      const result = await client.listTools();
      this.transport = transport;
      this.client = client;
      this.toolsCache = (result.tools || []).map((t: any) => ({
        name: t.name,
        description: t.description || "",
        inputSchema: t.inputSchema || {},
      }));
      this.lastError = null;
      console.log(`[Composio] Ligado a ${this.endpoint}: ${this.toolsCache.length} ferramentas disponíveis`);
      return true;
    } catch (e: any) {
      this.lastError = e.message || String(e);
      console.error(`[Composio] Falha ao ligar: ${this.lastError}`);
      return false;
    }
  }

  async ensureConnected(): Promise<boolean> {
    if (this.client) return true;
    return this.connect();
  }

  listTools(): ComposioToolInfo[] {
    return this.toolsCache;
  }

  /**
   * Nomes das meta-tools expostas pelo Composio Connect (descoberta, conexão e execução).
   */
  static META_TOOLS = [
    "COMPOSIO_SEARCH_TOOLS",
    "COMPOSIO_GET_TOOL_SCHEMAS",
    "COMPOSIO_MULTI_EXECUTE_TOOL",
    "COMPOSIO_MANAGE_CONNECTIONS",
    "COMPOSIO_WAIT_FOR_CONNECTIONS",
    "COMPOSIO_REMOTE_WORKBENCH",
    "COMPOSIO_REMOTE_BASH_TOOL",
  ];

  /**
   * Apps principais ligadas por defeito quando se pede "ligar todas as apps".
   */
  static DEFAULT_APPS = [
    "gmail", "googlecalendar", "googledrive", "googlesheets", "googledocs",
    "slack", "github", "notion", "linear", "hubspot", "asana", "trello",
    "discord", "telegram", "whatsapp", "zoom", "calendly", "jira", "figma",
    "dropbox",
  ];

  /**
   * Gera links OAuth (redirect_url) para ligar apps. Os links expiram em 10 min.
   * Devolve os links por app; apps já ativas não geram link novo.
   */
  async connectApps(apps: string[]): Promise<{ links: { slug: string; url: string }[]; alreadyActive: string[]; output: string }> {
    await this.ensureConnected();
    const result = await this.callTool("COMPOSIO_MANAGE_CONNECTIONS", {
      toolkits: apps.map((name) => ({ name, action: "add", alias: "tvs" })),
    });
    const links: { slug: string; url: string }[] = [];
    const alreadyActive: string[] = [];
    try {
      const parsed = JSON.parse(result.output);
      const results = parsed?.data?.results || {};
      for (const [slug, info] of Object.entries<any>(results)) {
        const redirect = info?.redirect_url;
        if (redirect) links.push({ slug, url: redirect });
        else if (info?.status === "active") alreadyActive.push(slug);
      }
    } catch { /* resposta não-JSON */ }
    return { links, alreadyActive, output: result.output };
  }

  /**
   * Lista o estado das ligações das apps pedidas (sem efeitos secundários).
   */
  async listConnections(apps: string[]): Promise<{ active: string[]; pending: string[] }> {
    await this.ensureConnected();
    const result = await this.callTool("COMPOSIO_MANAGE_CONNECTIONS", {
      toolkits: apps.map((name) => ({ name, action: "list" })),
    });
    const active: string[] = [];
    const pending: string[] = [];
    try {
      const parsed = JSON.parse(result.output);
      const results = parsed?.data?.results || {};
      for (const [slug, info] of Object.entries<any>(results)) {
        if (info?.status === "active") active.push(slug);
        else pending.push(slug);
      }
    } catch { /* mantém vazio */ }
    return { active, pending };
  }

  /**
   * Invoca uma ferramenta Composio e normaliza o resultado MCP em texto.
   */
  async callTool(name: string, args: Record<string, any> = {}): Promise<{ ok: boolean; output: string }> {
    await this.ensureConnected();
    if (!this.client) {
      throw new Error("Composio não ligado");
    }
    const res = await this.client.callTool({ name, arguments: args || {} });
    const output = this.extractText(res?.content);
    if (res?.isError) {
      throw new Error(output || `Ferramenta Composio '${name}' devolveu erro`);
    }
    return { ok: true, output };
  }

  /**
   * Regista todas as ferramentas Composio no ToolManager do TVS
   * (IDs `composio_<nome>`), ficando disponíveis aos agentes/JARVIS.
   */
  registerTools(toolManager: ToolManager): number {
    for (const t of this.toolsCache) {
      const id = this.toolId(t.name);
      const tool: ITool = {
        id,
        name: t.name,
        description: t.description || `Ferramenta Composio: ${t.name}`,
        type: "MCP" as ToolType,
        enabled: true,
        execute: async (input: Record<string, any>) => {
          const start = Date.now();
          try {
            const res = await this.callTool(t.name, input);
            return {
              toolId: id,
              toolName: t.name,
              success: true,
              result: res.output,
              executionTimeMs: Date.now() - start,
            };
          } catch (err: any) {
            return {
              toolId: id,
              toolName: t.name,
              success: false,
              result: null,
              executionTimeMs: Date.now() - start,
              error: err.message || String(err),
            };
          }
        },
      };
      toolManager.registerTool(tool);
    }
    return this.toolsCache.length;
  }

  private extractText(content: any[]): string {
    if (!Array.isArray(content)) return "";
    return content
      .filter((c: any) => c && c.type === "text")
      .map((c: any) => c.text || "")
      .join("\n");
  }

  private toolId(name: string): string {
    return `composio_${name.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  }
}
