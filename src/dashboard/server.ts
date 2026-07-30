import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { ViseronCore } from "../core/ViseronCore";

/**
 * TVSDashboardServer - Servidor Web de Monitoreo en Tiempo Real para TVS v2.0
 */
export class TVSDashboardServer {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private port: number;
  private tvsCore: ViseronCore;

  constructor(tvsCore: ViseronCore, port?: number) {
    this.tvsCore = tvsCore;
    this.port = port || parseInt(process.env.PORT || "3000", 10);
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server);

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
