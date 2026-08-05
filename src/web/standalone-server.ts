import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { Server } from "socket.io";
import { BlogStorage } from "./blog-storage";
import { createBlogRouter } from "./blog-routes";
import { ContentAgent } from "./content-agent";
import { AccountStore } from "./auth/store";
import { createAuthRouter } from "./auth/routes";
import { createLogger, ILogger } from "./monitoring/logger";
import { MetricsCollector, IMetrics } from "./monitoring/metrics";
import { requestLogger } from "./monitoring/middleware";
import { BillingProvider, createBilling } from "./billing";
import { createBillingRouter } from "./billing/routes";
import { createOnboardingRouter } from "./onboarding/routes";
import { getDatabase } from "./db";
import { createEmailService, EmailService } from "./email/service";
import { createEmailRouter } from "./email/routes";
import { MessageStore } from "./messaging/store";
import { createMessagingRouter } from "./messaging/routes";
import { createJarvisRouter } from "./jarvis/routes";
import { createRevenueRouter } from "./revenue/routes";

const PUBLIC_DIR = path.join(__dirname, "..", "dashboard", "public");
const DATA_DIR = path.resolve(__dirname, "..", "..", "..", "data");

export class ViseronWebServer {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private blog: BlogStorage;
  private contentAgent: ContentAgent;
  private accounts: AccountStore;
  private logger: ILogger;
  private metrics: IMetrics;
  private billing: BillingProvider;
  private email: EmailService;
  private messaging: MessageStore;
  private db: ReturnType<typeof getDatabase>;
  private dataDir: string;
  private port: number;

  constructor(options?: { dataDir?: string; port?: number }) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      path: "/api/socket.io",
      cors: { origin: "*", methods: ["GET", "POST"] }
    });

    this.dataDir = options?.dataDir || DATA_DIR;
    this.port = options?.port ?? parseInt(process.env.PORT || "3000", 10);
    this.blog = new BlogStorage();
    this.contentAgent = new ContentAgent(this.blog);
    this.accounts = new AccountStore(path.join(this.dataDir, "accounts.json"));
    this.logger = createLogger();
    this.metrics = new MetricsCollector();
    this.billing = createBilling();
    this.email = createEmailService(this.dataDir);
    this.messaging = new MessageStore(path.join(this.dataDir, "messaging.json"));
    this.db = getDatabase();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocket();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    }));
    this.app.use(requestLogger(this.logger, this.metrics));
    this.app.use((req, res, next) => {
      const host = (req.headers.host || "").toLowerCase().replace(/:\d+$/, "");
      if (host === "trinnityviseron.com") {
        return res.redirect(301, "https://www.trinnityviseron.com" + req.url);
      }
      if (host === "trinnityviseronsystem.io") {
        return res.redirect(301, "https://www.trinnityviseronsystem.io" + req.url);
      }
      next();
    });
    this.app.use(express.static(PUBLIC_DIR));
  }

  private setupRoutes(): void {
    this.app.get("/api/health", async (_req, res) => {
      let usage = 0;
      if (this.db.enabled) {
        try {
          const r = await this.db.pool!.query("SELECT count(*)::int AS n FROM usage_events");
          usage = r.rows[0]?.n ?? 0;
        } catch { usage = -1; }
      }
      res.json({
        status: "OK",
        timestamp: Date.now(),
        mode: "web-standalone",
        version: "5.0.0",
        db: this.db.enabled ? "postgres" : "json-fallback",
        usage_events: usage,
        billing: this.billing.enabled ? this.billing.name : "manual",
        email: this.email.transport.enabled ? this.email.transport.provider : "off",
        messaging: this.messaging.count(),
        tenants: this.accounts.count().tenants,
        users: this.accounts.count().users,
      });
    });

    this.app.get("/api/metrics", (_req, res) => {
      res.json(this.metrics.snapshot());
    });

    const WAITLIST_FILE = path.join(DATA_DIR, "waitlist.json");

    this.app.get("/pitch/:file", (req, res) => {
      const safe = path.basename(req.params.file).replace(/[^a-zA-Z0-9._-]/g, "");
      res.sendFile(path.join(DATA_DIR, safe), (err) => {
        if (err) res.status(404).json({ error: "PDF não encontrado" });
      });
    });

    // PDFs de docs/ via /docs/*.pdf
    this.app.get("/docs/{*path}", (req, res) => {
      const segments = (req.params as any).path || [];
      const rel = (Array.isArray(segments) ? segments.join("/") : String(segments)) || "";
      if (!rel.endsWith(".pdf") || rel.includes("..")) {
        return res.status(404).json({ error: "Not found" });
      }
      res.sendFile(path.join(path.resolve(process.cwd(), "docs"), rel), (err) => {
        if (err) res.status(404).json({ error: "PDF não encontrado" });
      });
    });

    this.app.post("/api/waitlist", (req, res) => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Email inválido" });
      }
      try {
        const list = fs.existsSync(WAITLIST_FILE) ? JSON.parse(fs.readFileSync(WAITLIST_FILE, "utf8")) : [];
        if (!Array.isArray(list)) throw new Error("corrupt");
        if (list.some((e: any) => e?.email === email)) {
          return res.status(409).json({ error: "Já registado", ok: true });
        }
        list.push({ email, createdAt: new Date().toISOString() });
        fs.writeFileSync(WAITLIST_FILE, JSON.stringify(list, null, 2));
        res.json({ ok: true, position: list.length });
      } catch (e: any) {
        res.status(500).json({ error: "Falha ao gravar. Tente novamente." });
      }
    });

    this.app.get("/api/system/status", (_req, res) => {
      res.json({
        version: "5.0.0",
        name: "Viseron Web",
        mode: "standalone",
        blog: this.blog.count(),
        uptime: process.uptime(),
        tenants: this.accounts.count().tenants,
        users: this.accounts.count().users,
      });
    });

    this.app.use("/api", createAuthRouter(this.accounts, this.logger, this.metrics, this.email));
    this.app.use("/api", createBillingRouter(this.accounts, this.billing, this.logger, this.metrics, this.email));
    this.app.use("/api", createOnboardingRouter(this.accounts, this.dataDir, this.logger, this.metrics));
    this.app.use("/api", createEmailRouter(this.accounts, this.email, this.logger, this.metrics));
    this.app.use("/api", createMessagingRouter(this.accounts, this.messaging, this.io, this.logger, this.metrics));
    this.app.use("/api", createJarvisRouter({
      dataDir: this.dataDir,
      accounts: this.accounts,
      billing: this.billing,
      email: this.email,
      messaging: this.messaging,
      blog: this.blog,
      logger: this.logger,
      metrics: this.metrics,
    }));
    this.app.use("/api", createRevenueRouter(this.metrics));

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
      socket.on("messaging:join", (userId: string) => {
        if (userId && typeof userId === "string") socket.join(`user:${userId}`);
      });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`\n==========================================`);
        console.log(`[Viseron Web] Servidor rodando em http://localhost:${this.port}`);
        console.log(`[Viseron Web] Blog: http://localhost:${this.port}/blog`);
        console.log(`[Viseron Web] Dashboard: http://localhost:${this.port}/dashboard`);
        console.log(`[Viseron Web] Auth: http://localhost:${this.port}/api/auth/*`);
        console.log(`[Viseron Web] Billing: http://localhost:${this.port}/api/billing/*`);
        console.log(`[Viseron Web] Onboarding: http://localhost:${this.port}/api/onboarding/*`);
        console.log(`[Viseron Web] Email: http://localhost:${this.port}/api/email/* (${this.email.transport.provider})`);
        console.log(`[Viseron Web] Messaging: http://localhost:${this.port}/api/messaging/* (E2E x25519+aes-256-gcm)`);
        console.log(`[Viseron Web] JARVIS: http://localhost:${this.port}/api/jarvis/chat (conversa + autonomia)`);
        console.log(`[Viseron Web] Métricas: http://localhost:${this.port}/api/metrics`);
        console.log(`==========================================\n`);
        resolve();
      });
      this.db.runMigrations()
        .then((n) => {
          if (n > 0) console.log(`[DB] ${n} migração(ões) aplicada(s)`);
        })
        .catch((e) => console.error(`[DB] Migração falhou (usando fallback JSON): ${e.message}`));
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
