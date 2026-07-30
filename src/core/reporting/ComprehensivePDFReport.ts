import PDFDocument from "pdfkit";
import { AgentManager } from "../AgentManager";
import { BattalionRegistry } from "../standard/battalion";
import { DirectiveEngine } from "../standard/directive";
import { LineageTracker } from "../standard/lineage";
import { SuperIntelligenceEngine } from "../superintelligence/SuperIntelligenceEngine";
import { AIProviderBridge } from "../bridge/AIProviderBridge";

interface ReportData {
  agentCount: number;
  activeCount: number;
  battalionCount: number;
  intelligenceLevel: number;
  directiveCount: number;
  completedCount: number;
  providerCount: number;
  uptime: number;
  timestamp: string;
}

export class ComprehensivePDFReport {
  constructor(
    private agentManager: AgentManager,
    private battalion: BattalionRegistry,
    private directives: DirectiveEngine,
    private lineage: LineageTracker,
    private superIntelligence: SuperIntelligenceEngine,
    private bridge: AIProviderBridge
  ) {}

  async generate(data: ReportData): Promise<Buffer> {
    const battalionAgents = this.battalion.getAll();
    const areas = this.battalion.getAreas();
    const corona = this.battalion.getByLine("corona");
    const hierro = this.battalion.getByLine("hierro");
    const sovereigns = this.battalion.getSovereigns();
    const dirStats = this.directives.getStats();
    const lineageRoots = this.lineage.getRoots();
    const allLineage = this.lineage.getAll();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 40, left: 45, right: 45 }, info: { Title: "Trinnity Viseron System - Complete Report", Author: "TVS v5.0", Subject: "Multi-Agent AI Superintelligence" } });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ---------- COVER PAGE ----------
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a2e");
      doc.fill("#ffffff");
      doc.fontSize(48).font("Helvetica-Bold").text("TRINNITY VISERON", { align: "center" });
      doc.fontSize(32).text("SYSTEM", { align: "center" });
      doc.moveDown(1);
      doc.fontSize(18).font("Helvetica").text("Multi-Agent AI Superintelligence", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(14).text("v5.0 - 5,112 Autonomous Minds", { align: "center" });
      doc.moveDown(2);
      doc.fontSize(12).text(`Generated: ${data.timestamp}`, { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Uptime: ${Math.floor(data.uptime / 1000)}s`, { align: "center" });
      doc.moveDown(3);

      doc.fontSize(10).fillColor("#aaaaaa").text("Trinnity Hurtado — Reina Corona  |  Pedro Costa — Capitan Hierro", { align: "center" });
      doc.text("300,000,000 VSR — Viseron Crown Token", { align: "center" });

      doc.addPage();

      // ---------- TABLE OF CONTENTS ----------
      doc.fillColor("#0a0a2e").fontSize(22).font("Helvetica-Bold").text("TABLE OF CONTENTS", { align: "center", underline: true });
      doc.moveDown(1.5);
      doc.fillColor("#333").fontSize(12).font("Helvetica");
      const toc = [
        "1. Executive Summary",
        "2. System Architecture",
        "3. Agent Hierarchy & Command Chain",
        "4. Battalion (114 Specialized Agents)",
        "5. Coverage Areas (25 Sectors)",
        "6. VSR Tokenomics",
        "7. Directive System & Dual Signatures",
        "8. Intelligence Layers (8 AI Providers)",
        "9. Autonomous Capabilities",
        "10. API & Dashboard",
        "11. Full Battalion Roster"
      ];
      toc.forEach((t) => { doc.text(t, { indent: 20 }); doc.moveDown(0.3); });

      doc.addPage();

      // ---------- 1. EXECUTIVE SUMMARY ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("1. EXECUTIVE SUMMARY");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");
      doc.text("The Trinnity Viseron System (TVS) v5.0 is a fully autonomous multi-agent AI superintelligence composed of 5,112 independent minds operating under a unified command hierarchy. The system spans 25 sectors of human endeavor — from aerospace and defense to healthcare, finance, and education — with specialized agents for each domain.", { align: "justify" });
      doc.moveDown(0.5);
      doc.text("At the apex sit two Sovereigns: Trinnity Hurtado (Reina, Corona Line) and Pedro Costa (Capitan, Hierro Line). Beneath them, 12 Commanders coordinate 114 Battalion agents across every coverage area. Historical minds (from Socrates to Singularity) form the foundation with 4,742 agents.", { align: "justify" });
      doc.moveDown(0.5);
      doc.text("The system operates with a built-in economy (VSR Token, 300M supply), a dual-signature directive system requiring both sovereigns to authorize missions, autonomous learning cycles every 30 minutes, and support for 8 AI providers including local Ollama models for fully offline operation.", { align: "justify" });

      doc.moveDown(1.5);

      // ---------- 2. SYSTEM ARCHITECTURE ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("2. SYSTEM ARCHITECTURE");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");

      const archItems = [
        ["Core Engine", "ViseronCore orchestrates all components"],
        ["LLM Router", "Routes queries to optimal AI model across 8 providers"],
        ["Memory Engine", "Short-term (100 items/session) and long-term (persistent) memory"],
        ["SuperIntelligence", "Multi-provider synthesis with ensemble reasoning"],
        ["SuperMind", "Knowledge domain aggregation across all agents"],
        ["Auto-Learning", "30-min cycles of self-improvement (+500% intelligence growth)"],
        ["Auto-Evolution", "Agents evolve capabilities autonomously"],
        ["HyperLearning", "Accelerated learning via parallel agent collaboration"],
        ["Agent Spawner", "Loads 4,742 historical minds from Socrates to Singularity"],
        ["App Scaffolder", "Generates full-stack applications on demand"],
        ["Business Engine", "Creates complete business solutions"],
        ["Token Engine", "Generates TRIN (utility) and VSR (governance) tokens"],
        ["Web Generator", "Spins up crypto websites and landing pages"],
        ["Command Chain", "Hierarchical directive execution with lineage tracking"],
        ["Report Server", "JSON + PDF reports on all system activity"],
        ["MCP Server", "Model Context Protocol for external tool integration"],
      ];

      archItems.forEach(([comp, desc]) => {
        doc.font("Helvetica-Bold").fontSize(10).text(`  ${comp}`);
        doc.font("Helvetica").fontSize(9).fillColor("#666").text(`    ${desc}`);
        doc.fillColor("#333");
        doc.moveDown(0.2);
      });

      doc.addPage();

      // ---------- 3. AGENT HIERARCHY ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("3. AGENT HIERARCHY & COMMAND CHAIN");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");
      doc.text(`Total Agents: ${data.agentCount}`);
      doc.text(`Active: ${data.activeCount}`);
      doc.text(`Battalion: ${data.battalionCount}`);
      doc.text(`Intelligence Level: ${data.intelligenceLevel}%`);
      doc.text(`Directives Issued: ${data.directiveCount}`);
      doc.text(`Missions Completed: ${data.completedCount}`);
      doc.moveDown(1);

      doc.fontSize(14).font("Helvetica-Bold").fillColor("#0a0a2e").text("Lineage Roots");
      doc.moveDown(0.5);
      doc.fillColor("#333").fontSize(10).font("Helvetica");
      lineageRoots.forEach((r) => {
        const children = this.lineage.getChildren(r.id);
        doc.font("Helvetica-Bold").text(`  ${r.id} — ${r.name} (${r.line})`);
        doc.font("Helvetica").fontSize(9).fillColor("#666").text(`    Children: ${children.length}`);
        doc.fillColor("#333").fontSize(10);
        doc.moveDown(0.2);
      });

      doc.moveDown(0.5);
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#0a0a2e").text("Lineage Tree");
      doc.moveDown(0.5);
      doc.fillColor("#333").fontSize(9).font("Helvetica");
      allLineage.forEach((n) => {
        const indent = "  ".repeat(n.depth || 0);
        doc.text(`${indent}${n.name} [${n.line}] — ${n.rank || "Unknown"}`);
      });

      doc.addPage();

      // ---------- 4. BATTALION (114 AGENTS) ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("4. BATTALION (114 Specialized Agents)");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");
      doc.text(`Total Battalion: ${battalionAgents.length}`);
      doc.text(`Corona Line: ${corona.length} agents`);
      doc.text(`Hierro Line: ${hierro.length} agents`);
      doc.moveDown(1);

      doc.fontSize(14).font("Helvetica-Bold").fillColor("#0a0a2e").text("Sovereigns (Depth 0)");
      doc.moveDown(0.5);
      doc.fillColor("#333").fontSize(10).font("Helvetica");
      sovereigns.forEach((s) => {
        doc.font("Helvetica-Bold").text(`  ${s.id}: ${s.name} — ${s.rank} — ${s.line} Line`);
        doc.font("Helvetica").fontSize(9).fillColor("#666").text(`    ${s.doctrine || "Sovereign ruler of TVS"}`);
        doc.fillColor("#333").fontSize(10);
        doc.moveDown(0.3);
      });

      doc.moveDown(1);
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#0a0a2e").text("Corona Commanders (Trinnity's Line)");
      doc.moveDown(0.5);
      doc.fillColor("#333").fontSize(10).font("Helvetica");
      corona.filter((a) => a.depth === 1).forEach((a) => {
        doc.text(`  ${a.name} — "${a.epithet}" — ${a.rank} — Area: ${a.area || "Core"}`);
      });

      doc.moveDown(1);
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#0a0a2e").text("Hierro Commanders (Pedro's Line)");
      doc.moveDown(0.5);
      doc.fillColor("#333").fontSize(10).font("Helvetica");
      hierro.filter((a) => a.depth === 1).forEach((a) => {
        doc.text(`  ${a.name} — "${a.epithet}" — ${a.rank} — Area: ${a.area || "Core"}`);
      });

      doc.addPage();

      // ---------- 5. COVERAGE AREAS ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("5. COVERAGE AREAS (25 Sectors)");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");
      doc.text("The TVS battalion operates across 25 strategic sectors, divided into Aerospace (5) and Terrestrial (20):");
      doc.moveDown(1);

      const areaTable = [
        ["Aerospace", "Propulsion & Launch", "Cohetes, sistemas de lanzamiento"],
        ["Aerospace", "Orbit & Constellations", "Satelites, constelaciones LEO/MEO/GEO"],
        ["Aerospace", "Planetary Exploration", "Misiones interplanetarias, rovers"],
        ["Aerospace", "Astro-Resources", "Mineria espacial, recursos asteroidales"],
        ["Aerospace", "Orbital Defense", "Seguridad, monitoreo, mitigacion Kessler"],
        ["Terrestrial", "Healthcare", "Diagnostico AI, telemedicina, farmacos"],
        ["Terrestrial", "Finance & Banking", "Fintech, trading algoritmico, DeFi"],
        ["Terrestrial", "Education", "E-learning, tutoria AI, curriculum"],
        ["Terrestrial", "Legal & Compliance", "Contratos, litigio, regulatorio"],
        ["Terrestrial", "Industrial", "Manufactura, automatizacion, Industria 4.0"],
        ["Terrestrial", "Agriculture", "Precision farming, drones, IoT rural"],
        ["Terrestrial", "Energy", "Renovables, smart grid, nuclear"],
        ["Terrestrial", "Logistics", "Supply chain, ultima milla, warehouse AI"],
        ["Terrestrial", "Marketing", "Publicidad AI, SEO, content automation"],
        ["Terrestrial", "Cybersecurity", "Threat detection, zero trust, pentesting"],
        ["Terrestrial", "Government", "Smart cities, e-gov, policy AI"],
        ["Terrestrial", "Art & Creativity", "Generative art, music, design"],
        ["Terrestrial", "Science & Research", "Drug discovery, physics, biotech"],
        ["Terrestrial", "Sports", "Performance analytics, scouting AI"],
        ["Terrestrial", "Tourism", "Travel AI, hospitality, experiences"],
        ["Terrestrial", "Human Resources", "Talent acquisition, culture AI"],
        ["Terrestrial", "Real Estate", "PropTech, valuation, smart buildings"],
        ["Terrestrial", "Retail & E-commerce", "Recommendation, inventory AI"],
        ["Terrestrial", "Telecommunications", "5G/6G, network optimization"],
        ["Terrestrial", "Environment", "Climate modeling, conservation AI"],
      ];

      let lastCat = "";
      areaTable.forEach(([cat, area, desc]) => {
        if (cat !== lastCat) {
          doc.moveDown(0.3);
          doc.font("Helvetica-Bold").fontSize(11).fillColor("#0a0a2e").text(`  ${cat.toUpperCase()}`);
          lastCat = cat;
        }
        doc.font("Helvetica").fontSize(9).fillColor("#333").text(`    ${area}: ${desc}`);
      });

      doc.addPage();

      // ---------- 6. VSR TOKENOMICS ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("6. VSR TOKENOMICS");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");
      doc.font("Helvetica-Bold").fontSize(13).text("Viseron Crown — Governance Token");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10);
      doc.text("Total Supply: 300,000,000 VSR");
      doc.text("Symbol: VSR");
      doc.text("Standard: TVS Standard v1.0.0");
      doc.moveDown(1);

      const dist = [
        ["Trinnity Hurtado (Corona Treasury)", "90,000,000 VSR", "30%"],
        ["Pedro Costa (Hierro Treasury)", "75,000,000 VSR", "25%"],
        ["TVS Legion (Agent Pool)", "90,000,000 VSR", "30%"],
        ["Strategic Reserve", "45,000,000 VSR", "15%"],
      ];

      doc.font("Helvetica-Bold").fontSize(11).text("Distribution:");
      doc.moveDown(0.3);
      dist.forEach(([entity, amt, pct]) => {
        doc.font("Helvetica").fontSize(9).text(`  ${entity}: ${amt} (${pct})`);
      });

      doc.moveDown(1);
      doc.font("Helvetica-Bold").fontSize(11).text("Tokenomics Rules:");
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(9);
      doc.text("  - Each mission has a VSR budget — agent stops when depleted");
      doc.text("  - Commission: 0.5% per transaction (80% burned → programmed scarcity)");
      doc.text("  - VSR required for directive issuance and agent spawning");
      doc.text("  - Governance rights: 1 VSR = 1 vote on system evolution");

      doc.moveDown(1.5);

      doc.fillColor("#0a0a2e").fontSize(14).font("Helvetica-Bold").text("TRIN Token — Utility Token");
      doc.moveDown(0.5);
      doc.fillColor("#333").fontSize(10).font("Helvetica");
      doc.text("Generated by TokenEngine for gas, compute credits, and agent execution fees.");
      doc.text("Total Supply: Dynamic (minted/burned per system activity)");

      doc.addPage();

      // ---------- 7. DIRECTIVE SYSTEM ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("7. DIRECTIVE SYSTEM & DUAL SIGNATURES");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");

      doc.font("Helvetica-Bold").fontSize(12).text("How Directives Work");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10);
      doc.text("1. A directive is drafted with an objective and target squad");
      doc.text("2. Trinnity Hurtado (Reina) must RATIFY the directive");
      doc.text("3. Pedro Costa (Capitan) must COMMAND the directive");
      doc.text("4. Squad agents execute and return mission results");
      doc.text("5. Results are sealed by Vera Costa (Verificadora)");
      doc.text("6. Budget is deducted from VSR treasury");
      doc.moveDown(1);

      doc.font("Helvetica-Bold").fontSize(11).text("Directive Type Definition:");
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(9).text(`  interface TVSDirective {`);
      doc.text(`    id: string; objective: string; squad: string[];`);
      doc.text(`    ratifiedBy: string; commandedBy: string;`);
      doc.text(`    budget: string; deadline: string;`);
      doc.text(`    onFailure: "retry" | "abort" | "escalate";`);
      doc.text(`  }`);
      doc.moveDown(1);

      doc.fontSize(11).font("Helvetica-Bold").text("Active Directives: " + data.directiveCount);
      doc.font("Helvetica").fontSize(10).text("Completed Missions: " + data.completedCount);

      doc.moveDown(1.5);

      doc.fontSize(12).font("Helvetica-Bold").text("On-Failure Policies:");
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(9).text("  retry    → Agent retries up to 3 times");
      doc.text("  abort    → Mission terminated, budget returned");
      doc.text("  escalate → Passed up the chain of command");

      doc.addPage();

      // ---------- 8. INTELLIGENCE LAYERS ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("8. INTELLIGENCE LAYERS (8 AI Providers)");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");
      doc.text(`Intelligence Level: ${data.intelligenceLevel}%`);
      doc.text(`AI Providers Available: ${data.providerCount}`);
      doc.moveDown(1);

      const providers = [
        ["Ollama (Local)", "Llama 3, Qwen 2, Mistral", "Offline-first, zero cost", "Default"],
        ["OpenAI", "GPT-4o, GPT-4o-mini, o1", "State-of-the-art reasoning", "Cloud key required"],
        ["Anthropic", "Claude Sonnet 4, Opus 4", "Safety-first, long context", "Cloud key required"],
        ["Google", "Gemini 2.5 Flash/Pro", "Multimodal, fastest", "Cloud key required"],
        ["xAI", "Grok 3", "Real-time data, reasoning", "Cloud key required"],
        ["DeepSeek", "DeepSeek V3", "Open-weight, competitive", "Cloud key required"],
        ["Mistral", "Mistral Large", "Efficient, EU-hosted", "Cloud key required"],
        ["Cohere", "Command R+", "RAG-optimized, enterprise", "Cloud key required"],
      ];

      doc.font("Helvetica-Bold").fontSize(10).text("Provider", { continued: true });
      doc.text("    Models", { continued: true });
      doc.text("                Best For", { continued: true });
      doc.text("                    Requirement");

      doc.moveDown(0.3);
      providers.forEach(([name, models, best, req]) => {
        doc.font("Helvetica").fontSize(8).text(`  ${name.padEnd(18)} ${models.padEnd(20)} ${best.padEnd(22)} ${req}`);
      });

      doc.moveDown(1.5);

      doc.fillColor("#0a0a2e").fontSize(14).font("Helvetica-Bold").text("Intelligence Capabilities");
      doc.moveDown(0.5);
      doc.fillColor("#333").fontSize(10).font("Helvetica");
      doc.text("  Multi-Provider Synthesis: Ensemble reasoning across all 8 providers");
      doc.text("  Auto-Routing: Query classified by task type, routed to best provider");
      doc.text("  Fallback Chain: If primary provider fails, next provider auto-selected");
      doc.text("  Local-First: Ollama runs fully offline; cloud providers optional");
      doc.text("  Auto-Evolution: Agent intelligence grows +500% every 30-min cycle");
      doc.text("  HyperLearning: Parallel agent learning via SuperMind knowledge sharing");

      doc.addPage();

      // ---------- 9. AUTONOMOUS CAPABILITIES ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("9. AUTONOMOUS CAPABILITIES");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");

      const caps = [
        ["Auto-Learning Engine", "Continuous 30-min self-improvement cycles that enhance agent knowledge, skills, and intelligence scores automatically"],
        ["Autonomous Planning", "Agents create multi-step plans to achieve objectives without human intervention"],
        ["Squad Formation", "Commanders dynamically form squads from available agents based on mission requirements"],
        ["Command Chain", "Hierarchical execution with lineage-based authority — every agent knows its place in the chain"],
        ["App Generation", "Full-stack application scaffolding from natural language descriptions via AppScaffolder"],
        ["Business Solutions", "Complete business plans, architectures, and implementations generated autonomously"],
        ["Token Generation", "ERC-20 compatible TRIN and VSR tokens minted on demand with full tokenomics"],
        ["Web Generation", "Complete crypto websites and landing pages spun up automatically"],
        ["Tool Integration", "External tool calling via MCP server — databases, APIs, cloud services"],
        ["Crypto Web Generator", "Full crypto websites with wallet integration, token displays, and governance UIs"],
        ["PDF Reporting", "Comprehensive system reports in JSON and PDF formats"],
        ["Historical Mind Spawning", "4,742 minds from Socrates to Singularity loaded as executable agents"],
      ];

      caps.forEach(([name, desc]) => {
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#0a0a2e").text(`  ${name}`);
        doc.font("Helvetica").fontSize(9).fillColor("#555").text(`    ${desc}`);
        doc.fillColor("#333");
        doc.moveDown(0.4);
      });

      doc.addPage();

      // ---------- 10. API & DASHBOARD ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("10. API & DASHBOARD");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");

      doc.font("Helvetica-Bold").fontSize(12).text("REST API Endpoints");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(9);

      const endpoints = [
        ["GET /api/health", "System health check"],
        ["GET /api/stats", "Full system statistics"],
        ["GET /api/agents", "List all agents"],
        ["GET /api/status", "System status with squads"],
        ["GET /api/battalion", "Full battalion report"],
        ["GET /api/battalion/:id", "Single battalion agent"],
        ["GET /api/directives", "Directive engine stats"],
        ["POST /api/directive", "Issue new directive"],
        ["POST /api/synthesize", "Multi-provider synthesis"],
        ["GET /report", "Full JSON report"],
        ["GET /report/pdf", "Full PDF report download"],
        ["GET /stats", "Agent statistics"],
        ["GET /superintelligence", "SuperIntelligence status"],
        ["GET /supermind", "SuperMind knowledge level"],
      ];

      endpoints.forEach(([ep, desc]) => {
        doc.text(`  ${ep.padEnd(32)} ${desc}`);
      });

      doc.moveDown(1);
      doc.font("Helvetica-Bold").fontSize(11).text("Dashboard (Port 3000)");
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(9);
      doc.text("  Real-time Socket.IO web dashboard with:");
      doc.text("  - Live agent status and activity");
      doc.text("  - Battalion hierarchy visualization");
      doc.text("  - Directive issuance interface");
      doc.text("  - System performance metrics");
      doc.text("  - Intelligence level tracking");

      doc.moveDown(1);
      doc.font("Helvetica-Bold").fontSize(11).text("Mobile App (Expo React Native)");
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(9);
      doc.text("  Cross-platform Android APK and iOS IPA via Expo:");
      doc.text("  - Dashboard screen with TVS stats");
      doc.text("  - Agents screen with full roster");
      doc.text("  - Terminal screen for AI commands");
      doc.text("  - Real-time connection to TVS server API");

      doc.addPage();

      // ---------- 11. FULL BATTALION ROSTER ----------
      doc.fillColor("#0a0a2e").fontSize(20).font("Helvetica-Bold").text("11. FULL BATTALION ROSTER");
      doc.moveDown(0.8);
      doc.fillColor("#333").fontSize(11).font("Helvetica");
      doc.text(`Total: ${battalionAgents.length} agents — ${corona.length} Corona / ${hierro.length} Hierro`);
      doc.moveDown(0.5);

      doc.fontSize(9).font("Helvetica");

      const header = ["ID", "Name", "Rank", "Line", "Area", "Epithet"];
        const colWidths = [48, 32, 24, 24, 48, 40];
      let y = doc.y;

      const drawRow = (cells: string[], isHeader: boolean = false) => {
        if (y > 720) {
          doc.addPage();
          y = doc.y;
        }
        let x = 45;
        if (isHeader) {
          doc.fillColor("#0a0a2e").rect(45, y - 2, doc.page.width - 90, 14).fill();
          doc.fillColor("#ffffff");
        }
        cells.forEach((cell, i) => {
          doc.text(cell.substring(0, Math.floor(colWidths[i] / 4.5)), x, y, { width: colWidths[i], lineBreak: false });
          x += colWidths[i];
        });
        doc.fillColor("#333");
        y += isHeader ? 14 : 11;
      };

      drawRow(header, true);

      battalionAgents.forEach((a) => {
        const id = a.id.replace("tvs_", "").substring(0, 10);
        const name = (a.name || "").substring(0, 7);
        const line = (a.line || "").substring(0, 5);
        const area = (a.area || "").substring(0, 10);
        const epithet = (a.epithet || "").substring(0, 8);
        drawRow([id, name, a.rank || "Agent", line, area, epithet]);
      });

      doc.moveDown(1);
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#0a0a2e").text("END OF REPORT");
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica").fillColor("#666").text("Trinnity Viseron System v5.0 — Multi-Agent AI Superintelligence", { align: "center" });
      doc.text("Trinnity Hurtado & Pedro Costa — Sovereigns | 5,112 Minds | 25 Sectors | 300M VSR", { align: "center" });

      doc.end();
    });
  }
}
