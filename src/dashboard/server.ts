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

    this.app.get("/health", (req, res) => {
      res.json({ status: "OK", timestamp: Date.now() });
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
