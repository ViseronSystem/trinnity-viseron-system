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
import { PostgresAccountStore } from "./auth/pg-store";
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
import { createViseronRouter } from "./viseron/routes";
import { createTutorRouter } from "./tutor/routes";
import { createRevenueRouter } from "./revenue/routes";
import { CallLogStore } from "./calls/store";
import { CallLearning } from "./calls/learning";
import { createCallsRouter } from "./calls/routes";
import { SiteStore } from "./sites/store";
import { createSitesRouter } from "./sites/routes";
import { AppScaffoldStore } from "./apps/store";
import { createAppsRouter } from "./apps/routes";
import { BusinessAgentStore } from "./business/store";
import { createBusinessRouter } from "./business/routes";
import { AgencyDeps, createAgencyDeps, createAgencyRouter } from "./agency/routes";
import { ComposioBridge } from "../core/composio/ComposioBridge";
import { createComposioRouter } from "./composio/routes";
import { TVSOs } from "../os";
import { createOsGateway } from "../os/gateway";
import { CryptoDeps, createCryptoDeps } from "./crypto/deps";
import { createCryptoRouter } from "./crypto/routes";
import { RcsEngine } from "../core/rcs/RcsEngine";
import { createRcsRouter } from "./rcs/routes";

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
  private calls: CallLogStore;
  private callLearning: CallLearning;
  private sites: SiteStore;
  private apps: AppScaffoldStore;
  private business: BusinessAgentStore;
  private agency: AgencyDeps;
  private composio: ComposioBridge;
  private crypto: CryptoDeps;
  private rcs: RcsEngine;
  private os: TVSOs;
  private autoMonetizeTimer?: NodeJS.Timeout;
  private db: ReturnType<typeof getDatabase>;
  private dataDir: string;
  private port: number;

  constructor(options?: { dataDir?: string; port?: number; disablePostgresAccounts?: boolean }) {
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
    this.db = getDatabase();
    const jsonAccountsPath = path.join(this.dataDir, "accounts.json");
    if (this.db.enabled && this.db.pool && !options?.disablePostgresAccounts) {
      this.accounts = new PostgresAccountStore(this.db.pool);
      (this.accounts as PostgresAccountStore).seedFromJson(jsonAccountsPath).catch(() => {});
    } else {
      this.accounts = new AccountStore(jsonAccountsPath);
    }
    this.logger = createLogger();
    this.metrics = new MetricsCollector();
    this.billing = createBilling();
    this.email = createEmailService(this.dataDir);
    this.messaging = new MessageStore(path.join(this.dataDir, "messaging.json"));
    this.calls = new CallLogStore(this.dataDir);
    this.callLearning = new CallLearning(this.dataDir);
    this.sites = new SiteStore(this.dataDir);
    this.apps = new AppScaffoldStore(this.dataDir);
    this.business = new BusinessAgentStore(this.dataDir);
    this.agency = createAgencyDeps(this.dataDir);
    this.composio = new ComposioBridge();
    this.crypto = createCryptoDeps(this.dataDir, this.accounts, this.logger);
    this.rcs = new RcsEngine({ dataDir: this.dataDir });
    this.os = new TVSOs({ baseDir: path.join(this.dataDir, "tvs-os") });
    this.os.boot();

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
    this.app.use(express.urlencoded({ extended: true }));
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
        tenants: (await this.accounts.count()).tenants,
        users: (await this.accounts.count()).users,
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

    this.app.get("/api/system/status", async (_req, res) => {
      const counts = await this.accounts.count();
      res.json({
        version: "5.0.0",
        name: "Viseron Web",
        mode: "standalone",
        blog: this.blog.count(),
        uptime: process.uptime(),
        tenants: counts.tenants,
        users: counts.users,
      });
    });

    this.app.use("/api", createAuthRouter(this.accounts, this.logger, this.metrics, this.email));
    this.app.use("/api", createBillingRouter(this.accounts, this.billing, this.logger, this.metrics, this.email, this.crypto.payments));
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
      composio: this.composio,
      agency: this.agency,
      rcs: this.rcs,
      logger: this.logger,
      metrics: this.metrics,
    }));
    this.app.use("/api", createViseronRouter({
      dataDir: this.dataDir,
      accounts: this.accounts,
      billing: this.billing,
      email: this.email,
      messaging: this.messaging,
      blog: this.blog,
      composio: this.composio,
      agency: this.agency,
      rcs: this.rcs,
      logger: this.logger,
      metrics: this.metrics,
    }));
    this.app.use("/api", createTutorRouter({
      dataDir: this.dataDir,
      logger: this.logger,
      metrics: this.metrics,
    }));
    this.app.use("/api", createRevenueRouter(this.metrics, {
      accounts: this.accounts,
      crypto: this.crypto.payments,
      getAgencyActiveClients: () => this.agency.store.listClients().filter((c) => c.status === "active").length,
    }));
    this.app.use("/api", createCallsRouter(this.calls, this.callLearning, this.logger));
    this.app.use("/api", createSitesRouter(this.sites, this.logger));
    this.app.use("/api", createAppsRouter(this.apps, this.logger));
    this.app.use("/api", createBusinessRouter(this.business, this.logger));
    this.app.use("/api", createAgencyRouter(this.agency, this.logger));
    this.app.use("/api", createComposioRouter(this.composio));
    this.app.use("/api", createCryptoRouter(this.crypto.payments));
    this.app.use("/api", createRcsRouter(this.rcs));

    // TVS OS — API (/api/os) · Process Manager · Virtual FS · App Store · Security
    this.app.use("/api/os", createOsGateway(this.os));

    // TVS Desktop — página do sistema operativo
    this.app.get("/os", (_req, res) => {
      res.sendFile(path.join(PUBLIC_DIR, "desktop.html"));
    });
    this.app.use("/sites", express.static(path.join(this.dataDir, "sites")));

    // VISERON — HUD da Superinteligência Autónoma (voz + cérebro + supervisão AIOX)
    this.app.get("/viseron", (_req, res) => {
      res.sendFile(path.join(PUBLIC_DIR, "viseron.html"));
    });

    // ATLAS — Tutor de Inglês com voz
    this.app.get("/atlas", (_req, res) => {
      res.sendFile(path.join(PUBLIC_DIR, "atlas.html"));
    });

    // JOGO VISERON — plataformas reais (Canvas 2D · iOS/APK/Windows via WebView)
    this.app.get("/game", (_req, res) => {
      res.sendFile(path.join(PUBLIC_DIR, "game", "index.html"));
    });
    this.app.use("/game", express.static(path.join(PUBLIC_DIR, "game")));

    // VISERON COSMOS — site interplanetário dos tokens $VSR/$TRIN (ES/PT/EN)
    this.app.get("/cosmos", (_req, res) => {
      res.sendFile(path.join(PUBLIC_DIR, "cosmos", "index.html"));
    });
    this.app.get("/cosmos/metaverse", (_req, res) => {
      res.sendFile(path.join(PUBLIC_DIR, "cosmos", "metaverse.html"));
    });
    this.app.use("/cosmos", express.static(path.join(PUBLIC_DIR, "cosmos")));

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
        console.log(`[Viseron Web] TVS OS: http://localhost:${this.port}/os (${this.os.name} v${this.os.version})`);
        console.log(`[Viseron Web] Auth: http://localhost:${this.port}/api/auth/*`);
        console.log(`[Viseron Web] Billing: http://localhost:${this.port}/api/billing/*`);
        console.log(`[Viseron Web] Crypto: http://localhost:${this.port}/api/crypto/* (${this.crypto.payments.status().exchange}, modo ${this.crypto.payments.status().mode})`);
        console.log(`[Viseron Web] Onboarding: http://localhost:${this.port}/api/onboarding/*`);
        console.log(`[Viseron Web] Email: http://localhost:${this.port}/api/email/* (${this.email.transport.provider})`);
        console.log(`[Viseron Web] Messaging: http://localhost:${this.port}/api/messaging/* (E2E x25519+aes-256-gcm)`);
        console.log(`[Viseron Web] JARVIS: http://localhost:${this.port}/api/jarvis/chat (conversa + autonomia)`);
        console.log(`[Viseron Web] VISERON: http://localhost:${this.port}/viseron (Superinteligência de voz · /api/viseron/chat)`);
        console.log(`[Viseron Web] ATLAS (Tutor de Inglês): http://localhost:${this.port}/atlas (voz · /api/tutor/chat)`);
        console.log(`[Viseron Web] JOGO VISERON: http://localhost:${this.port}/game (plataformas · Canvas 2D · ?demo p/ autónomo)`);
        console.log(`[Viseron Web] VISERON COSMOS: http://localhost:${this.port}/cosmos ($VSR · $TRIN · site interplanetário)`);
        console.log(`[Viseron Web] Business: http://localhost:${this.port}/api/business/* (agentes de atendimento)`);
        console.log(`[Viseron Web] Agency OS: http://localhost:${this.port}/api/agency/* (clientes, leads, report, creativos, projeção)`);
        console.log(`[Viseron Web] Métricas: http://localhost:${this.port}/api/metrics`);
        console.log(`==========================================\n`);
        resolve();
      });
      this.startAutoMonetize();
      this.db.runMigrations()
        .then((n) => {
          if (n > 0) console.log(`[DB] ${n} migração(ões) aplicada(s)`);
        })
        .catch((e) => console.error(`[DB] Migração falhou (usando fallback JSON): ${e.message}`));
    });
  }

  // Monetização automática: verifica pagamentos cripto pendentes a cada 60s.
  private startAutoMonetize(): void {
    const intervalMs = parseInt(process.env.CRYPTO_POLL_MS || "60000", 10);
    this.autoMonetizeTimer = setInterval(async () => {
      try {
        const paid = await this.crypto.payments.detect();
        const expired = this.crypto.payments.expireStale();
        if (paid.length > 0) this.logger.info(`[auto-monetize] ${paid.length} pagamento(s) cripto confirmado(s) + upgrade automático`);
        if (expired > 0) this.logger.info(`[auto-monetize] ${expired} fatura(s) expirada(s)`);
      } catch (e: any) {
        this.logger.error(`[auto-monetize] falha: ${e.message}`);
      }
    }, intervalMs);
    this.autoMonetizeTimer.unref?.();
  }

  stop(): void {
    this.contentAgent.stop();
    if (this.autoMonetizeTimer) clearInterval(this.autoMonetizeTimer);
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
