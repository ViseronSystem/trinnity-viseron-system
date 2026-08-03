import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { ViseronCore } from "../core/ViseronCore";
import { VoiceBridge } from "../voice/VoiceBridge";
import { skillsRegistry } from "../core/skills";

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

    // Viseron Skills API
    this.app.get("/api/skills/stats", async (req, res) => {
      try {
        res.json(await skillsRegistry.stats());
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.get("/api/skills", async (req, res) => {
      try {
        const { source, q } = req.query as any;
        const list = q
          ? await skillsRegistry.searchSkills(q, source)
          : await skillsRegistry.listSkills();
        res.json({ total: list.length, skills: list });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.get("/api/skills/:id", async (req, res) => {
      try {
        const skill = await skillsRegistry.getSkill(req.params.id);
        if (!skill) return res.status(404).json({ error: "Skill not found" });
        res.json(skill);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // ============ CODE Platform API (operar + criar VISERON) ============
    // Blueprints de agentes disponíveis para criação
    this.app.get("/api/code/blueprints", (_req, res) => {
      try {
        const names = this.tvsCore.agentFactory.getBlueprintNames();
        const blueprints = names.map((n) => this.tvsCore.agentFactory.getBlueprint(n))
          .filter(Boolean)
          .map((b: any) => ({
            name: b.name,
            role: b.role,
            description: b.description,
            capabilities: b.capabilities,
            blueprint: b.name !== b.role ? b.name : undefined,
          }));
        res.json({ total: blueprints.length, blueprints });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Criar um novo agente VISERON (custom ou a partir de blueprint)
    this.app.post("/api/code/create-agent", (req, res) => {
      try {
        const { blueprint, name, role, description, capabilities, systemPrompt, temperature, maxTokens } = req.body || {};
        let agent;
        if (blueprint) {
          agent = this.tvsCore.agentFactory.spawnFromBlueprint(blueprint);
          if (!agent) return res.status(404).json({ error: `Blueprint '${blueprint}' não existe` });
        } else {
          if (!name || !role) return res.status(400).json({ error: "name e role são obrigatórios" });
          const caps = Array.isArray(capabilities) ? capabilities : String(capabilities || "").split(",").map((c: string) => c.trim()).filter(Boolean);
          agent = this.tvsCore.agentFactory.spawnCustom({
            name,
            role,
            description: description || `${role} criado pela CODE Platform`,
            capabilities: caps.length ? caps : ["general"],
            systemPrompt: systemPrompt || `Eres ${name}, ${role} dentro de Trinnity Viseron System. Analiza cada tarea según tu rol y entrega respuestas prácticas y accionables.`,
            temperature: temperature ?? 0.7,
            maxTokens: maxTokens ?? 2048,
          });
        }
        res.json({
          ok: true,
          agent: {
            id: agent.id,
            name: agent.name,
            role: agent.role,
            description: agent.description,
            capabilities: agent.capabilities,
            status: agent.status,
          },
        });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Listar agentes registados
    this.app.get("/api/code/agents", (_req, res) => {
      const list = this.tvsCore.agentManager.list().map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        status: a.status,
        capabilities: a.capabilities || [],
      }));
      res.json({ total: list.length, agents: list });
    });

    // Executar um agente com uma tarefa
    this.app.post("/api/code/run-agent", async (req, res) => {
      try {
        const { agentId, task } = req.body || {};
        if (!agentId || !task) return res.status(400).json({ error: "agentId e task são obrigatórios" });
        const agent = this.tvsCore.agentManager.getAgent(agentId);
        if (!agent) return res.status(404).json({ error: `Agente '${agentId}' não encontrado` });
        if (agent.status !== "ACTIVE") return res.status(409).json({ error: `Agente está em estado '${agent.status}'` });
        const result = await agent.execute(task);
        res.json({ ok: result.success, result });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Estado consolidado da plataforma CODE
    this.app.get("/api/code/system", (_req, res) => {
      try {
        const agents = this.tvsCore.agentManager.list();
        const stats = this.tvsCore.agentManager.getStats();
        const blueprints = this.tvsCore.agentFactory.getBlueprintNames();
        const squads = this.tvsCore.squadManager.getSquads().map((s) => ({
          name: s.name,
          leader: s.leader.name,
          membersCount: s.members.length,
        }));
        res.json({
          status: "ONLINE",
          core: this.tvsCore.name,
          version: this.tvsCore.version,
          intelligence: this.tvsCore.getIntelligenceLevel(),
          agents: { total: stats.total, active: stats.active, paused: stats.paused, list: agents.slice(0, 200).map((a) => ({ id: a.id, name: a.name, role: a.role, status: a.status })) },
          squads,
          blueprintsCount: blueprints.length,
          blueprints: blueprints.slice(0, 50),
          spawned: this.tvsCore.agentFactory.getTotalSpawned(),
          battalion: (this.tvsCore.battalionRegistry as any).count ? this.tvsCore.battalionRegistry.count() : "n/a",
        });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Estado da monitorização AIOX (aprendizado + memória de Pedro/Trinnity)
    this.app.get("/api/code/aiox", (_req, res) => {
      try {
        const mem = this.tvsCore.memoryEngine.getStats();
        const pedroBrain = this.tvsCore.memoryEngine.getLongTerm("pedro_brain_state") || {};
        const trinnityBrain = this.tvsCore.memoryEngine.getLongTerm("trinnity_brain_state") || {};
        const lastLearning = (global as any).__TVS_LAST_LEARNING || 0;
        const intelligenceLevel = this.tvsCore.getIntelligenceLevel();
        res.json({
          status: "AIOX MONITORING ONLINE",
          aioxExperience: {
            knowledgeLevel: typeof intelligenceLevel === "number" ? intelligenceLevel : (mem.knowledge?.totalDocuments ? Math.min(100, 50 + mem.knowledge.totalDocuments * 0.1) : 50),
            totalDocuments: mem.knowledge?.totalDocuments ?? 0,
            stmItems: mem.shortTerm?.totalItems ?? 0,
            ltmItems: mem.longTerm?.totalItems ?? 0,
            lastLearningCycle: lastLearning ? new Date(lastLearning).toISOString() : null,
            lastLearningMsAgo: lastLearning ? Math.round((Date.now() - lastLearning) / 1000) : null,
          },
          commanders: {
            pedro: { name: "Pedro Costa", clearance: "tvs_creator", brain: pedroBrain },
            trinnity: { name: "Trinnity Hurtado", clearance: "tvs_architect", brain: trinnityBrain },
          },
          squads: this.tvsCore.squadManager.getSquads().map((s) => ({
            name: s.name,
            leader: s.leader.name,
            permissions: (s as any).permissions || [],
            membersCount: s.members.length,
          })),
          intelligenceLevel,
        });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Páginas reais (não cai no fallback)
    this.app.get("/dashboard", (_req, res) => {
      res.sendFile(path.join(publicPath, "dashboard.html"));
    });

    // PDFs de data/ via /pitch/*.pdf
    const dataPdfDir = path.resolve(process.cwd(), "data");
    this.app.get("/pitch/:file", (req, res) => {
      const file = path.basename(req.params.file);
      if (!file.endsWith(".pdf")) return res.status(404).json({ error: "Not found" });
      res.sendFile(path.join(dataPdfDir, file), (err) => {
        if (err && !res.headersSent) res.status(404).json({ error: "PDF não encontrado" });
      });
    });

    // PDFs de docs/ via /docs/*.pdf
    const docsPdfDir = path.resolve(process.cwd(), "docs");
    this.app.get("/docs/{*path}", (req, res) => {
      const segments = (req.params as any).path || [];
      const rel = (Array.isArray(segments) ? segments.join("/") : String(segments)) || "";
      if (!rel.endsWith(".pdf") || rel.includes("..")) return res.status(404).json({ error: "Not found" });
      res.sendFile(path.join(docsPdfDir, rel), (err) => {
        if (err && !res.headersSent) res.status(404).json({ error: "PDF não encontrado" });
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
