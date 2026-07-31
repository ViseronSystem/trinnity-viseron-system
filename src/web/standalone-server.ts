import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { Server } from "socket.io";
import { BlogStorage } from "./blog-storage";
import { createBlogRouter } from "./blog-routes";
import { ContentAgent } from "./content-agent";

const PORT = parseInt(process.env.PORT || "3000", 10);
const PUBLIC_DIR = path.join(__dirname, "..", "dashboard", "public");

export class ViseronWebServer {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private blog: BlogStorage;
  private contentAgent: ContentAgent;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      path: "/api/socket.io",
      cors: { origin: "*", methods: ["GET", "POST"] }
    });

    this.blog = new BlogStorage();
    this.contentAgent = new ContentAgent(this.blog);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocket();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      const host = (req.headers.host || "").toLowerCase().replace(/:\d+$/, "");
      if (host === "trinnityviseron.com") {
        return res.redirect(301, "https://www.trinnityviseron.com" + req.url);
      }
      next();
    });
    this.app.use(express.static(PUBLIC_DIR));
  }

  private setupRoutes(): void {
    this.app.get("/api/health", (_req, res) => {
      res.json({ status: "OK", timestamp: Date.now(), mode: "web-standalone", version: "5.0.0" });
    });

    this.app.get("/api/system/status", (_req, res) => {
      res.json({
        version: "5.0.0",
        name: "Viseron Web",
        mode: "standalone",
        blog: this.blog.count(),
        uptime: process.uptime(),
      });
    });

    const blogRouter = createBlogRouter(this.blog);
    this.app.use(blogRouter);

    this.app.post("/api/content/generate", async (req, res) => {
      try {
        const { title, prompt, tags } = req.body;
        if (!title || !prompt) return res.status(400).json({ error: "title and prompt required" });
        await this.contentAgent.generateCustomPost(title, prompt, tags || []);
        res.json({ ok: true });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.post("/api/content/trigger", async (_req, res) => {
      try {
        await this.contentAgent.generatePost();
        res.json({ ok: true });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.get("/api/content/schedule", (_req, res) => {
      res.json({ status: "active", intervalMinutes: 120 });
    });

    this.app.get("/dashboard", (_req, res) => {
      res.sendFile(path.join(PUBLIC_DIR, "dashboard.html"));
    });

    this.app.get("/dashboard/{*path}", (_req, res) => {
      res.sendFile(path.join(PUBLIC_DIR, "dashboard.html"));
    });

    this.app.use((req, res) => {
      if (req.method === "GET" && !req.path.startsWith("/api/")) {
        res.sendFile(path.join(PUBLIC_DIR, "index.html"));
      } else {
        res.status(404).json({ error: "Not found" });
      }
    });
  }

  private setupSocket(): void {
    this.io.on("connection", (socket) => {
      console.log(`[Web] Client connected: ${socket.id}`);
      socket.emit("system:info", { coreName: "Viseron Web", mode: "standalone", blog: this.blog.count() });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(PORT, () => {
        console.log(`\n==========================================`);
        console.log(`[Viseron Web] Servidor rodando em http://localhost:${PORT}`);
        console.log(`[Viseron Web] Blog: http://localhost:${PORT}/blog`);
        console.log(`[Viseron Web] Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`==========================================\n`);
        resolve();
      });
    });
  }

  stop(): void {
    this.contentAgent.stop();
    this.server.close();
  }

  getBlog(): BlogStorage { return this.blog; }
  getContentAgent(): ContentAgent { return this.contentAgent; }
}

if (require.main === module) {
  const webServer = new ViseronWebServer();
  webServer.start();
  webServer.getContentAgent().start(120);
}
