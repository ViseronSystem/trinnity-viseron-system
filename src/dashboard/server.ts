import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { ViseronCore } from "../core/ViseronCore";
import { VoiceBridge } from "../voice/VoiceBridge";

/**
 * TVSDashboardServer - Servidor Web de Monitoreo en Tiempo Real para TVS v2.0
 */
export class TVSDashboardServer {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private port: number;
  private tvsCore: ViseronCore;
  private voiceBridge: VoiceBridge;

  constructor(tvsCore: ViseronCore, port?: number) {
    this.tvsCore = tvsCore;
    this.port = port || parseInt(process.env.PORT || "3000", 10);
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      path: "/api/socket.io",
      cors: { origin: "*", methods: ["GET", "POST"] }
    });

    this.voiceBridge = new VoiceBridge(tvsCore);
    this.voiceBridge.attachSocketIO(this.io);

    this.setupRoutes();
    this.setupSocket();
  }

  private setupRoutes(): void {
    const publicPath = path.join(__dirname, "public");
    this.app.use(express.static(publicPath));
    this.app.use(express.json());

    this.app.get("/api/health", (req, res) => {
      res.json({ status: "OK", timestamp: Date.now() });
    });

    this.app.get("/api/stats", (req, res) => {
      res.json(this.tvsCore.getIntelligenceLevel());
    });

    this.app.get("/api/agents", (req, res) => {
      res.json(this.tvsCore.agentManager.list());
    });

    this.app.post("/api/synthesize", async (req, res) => {
      try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "prompt required" });
        const result = await this.tvsCore.superIntelligence.synthesize({
          prompt, strategy: "ensemble"
        });
        res.json(result);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.get("/api/status", (req, res) => {
      res.json({
        status: "ONLINE",
        core: this.tvsCore.name,
        agentsStats: this.tvsCore.agentManager.getStats(),
        squads: this.tvsCore.squadManager.getSquads().map(s => ({
          name: s.name,
          leader: s.leader.name,
          membersCount: s.members.length
        }))
      });
    });

    this.app.get("/api/battalion", (req, res) => {
      const reg = this.tvsCore.battalionRegistry;
      const sovereigns = reg.getSovereigns();
      res.json({
        standard: "TVS 1.0.0",
        totalAgents: reg.count(),
        corona: reg.getByLine("corona").length,
        hierro: reg.getByLine("hierro").length,
        areas: reg.getAreas().length,
        areaList: reg.getAreas(),
        sovereigns: sovereigns.map(s => ({ id: s.id, name: s.name, rank: s.rank, epithet: s.epithet })),
        lineageStats: {
          corona: {
            commanders: reg.getByLine("corona").filter(a => a.depth === 1).map(a => a.name),
            specialists: reg.getByLine("corona").filter(a => a.depth === 2).length,
          },
          hierro: {
            commanders: reg.getByLine("hierro").filter(a => a.depth === 1).map(a => a.name),
            specialists: reg.getByLine("hierro").filter(a => a.depth === 2).length,
          },
        },
      });
    });

    this.app.get("/api/battalion/:id", (req, res) => {
      const agent = this.tvsCore.battalionRegistry.get(req.params.id);
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      res.json(agent);
    });

    this.app.get("/api/directives", (req, res) => {
      res.json(this.tvsCore.directiveEngine.getStats());
    });

    this.app.post("/api/directive", async (req, res) => {
      try {
        const result = await this.tvsCore.directiveEngine.issueDirective(req.body);
        res.json(result);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.post("/api/voice/command", async (req, res) => {
      try {
        const { text, speaker } = req.body;
        if (!text) return res.status(400).json({ error: "text required" });
        const result = await (this.voiceBridge as any).processVoiceCommand({ text, speaker: speaker || "pedro", timestamp: Date.now() });
        res.json(result);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.get("/api/voice/history", (req, res) => {
      res.json(this.voiceBridge.getHistory());
    });

    this.app.post("/api/voice/clear", (req, res) => {
      this.voiceBridge.clearHistory();
      res.json({ ok: true });
    });

    // n8n Workflow endpoints
    this.app.get("/api/workflows", (req, res) => {
      const bridge = (global as any).__N8N_BRIDGE;
      if (bridge) {
        res.json({
          workflows: bridge.templates.map((t: any) => ({ id: t.id, name: t.name, description: t.description, triggers: t.triggers }))
        });
      } else {
        res.json({ workflows: [] });
      }
    });

    this.app.post("/api/workflows/run", async (req, res) => {
      try {
        const bridge = (global as any).__N8N_BRIDGE;
        if (!bridge) return res.status(503).json({ error: "n8n bridge not available" });
        const { workflowId, data } = req.body;
        if (!workflowId) return res.status(400).json({ error: "workflowId required" });
        const template = bridge.templates.find((t: any) => t.id === workflowId);
        if (!template) return res.status(404).json({ error: `Workflow ${workflowId} not found` });
        const result = await bridge.workflowEngine.execute(template, data || {});
        res.json(result);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Fallback index.html (compatible con Express v5)
    this.app.use((req, res) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(path.join(publicPath, "index.html"));
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    });
  }

  private setupSocket(): void {
    this.io.on("connection", (socket) => {
      console.log(`[Dashboard] Cliente conectado (ID: ${socket.id})`);
      socket.emit("system:info", {
        coreName: this.tvsCore.name,
        agents: this.tvsCore.agentManager.list()
      });

      socket.on("voice:command", async (cmd: any) => {
        try {
          const result = await (this.voiceBridge as any).processVoiceCommand(cmd);
          socket.emit("voice:response", result);
          socket.broadcast.emit("voice:response", result);
        } catch (e: any) {
          socket.emit("voice:error", { error: e.message });
        }
      });

      socket.on("voice:transcript", (data: any) => {
        socket.broadcast.emit("voice:transcript", data);
      });
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`\n==========================================`);
        console.log(`[TVS Web Dashboard] Servidor activo en http://localhost:${this.port}`);
        console.log(`==========================================\n`);
        resolve();
      });
    });
  }

  public stop(): void {
    this.server.close();
  }
}
