import express from "express";
import http from "http";
import fs from "fs-extra";
import path from "path";
import PDFDocument from "pdfkit";
import { AgentManager } from "../AgentManager";
import { MemoryEngine } from "../memory/MemoryEngine";
import { SuperIntelligenceEngine } from "../superintelligence/SuperIntelligenceEngine";
import { AIProviderBridge } from "../bridge/AIProviderBridge";
import { SuperMind } from "../supermind/SuperMind";
import { BattalionRegistry } from "../standard/battalion";
import { DirectiveEngine } from "../standard/directive";
import { LineageTracker } from "../standard/lineage";
import { ComprehensivePDFReport } from "./ComprehensivePDFReport";

export class ReportServer {
  private app: express.Application;
  private server: http.Server;
  private agentManager: AgentManager;
  private memoryEngine: MemoryEngine;
  private superIntelligence: SuperIntelligenceEngine;
  private bridge: AIProviderBridge;
  private superMind: SuperMind;
  private port: number;
  private comprehensivePDF: ComprehensivePDFReport;

  constructor(
    agentManager: AgentManager,
    memoryEngine: MemoryEngine,
    superIntelligence: SuperIntelligenceEngine,
    bridge: AIProviderBridge,
    superMind: SuperMind,
    battalion: BattalionRegistry,
    directives: DirectiveEngine,
    lineage: LineageTracker,
    port: number = 3001
  ) {
    this.agentManager = agentManager;
    this.memoryEngine = memoryEngine;
    this.superIntelligence = superIntelligence;
    this.bridge = bridge;
    this.superMind = superMind;
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.comprehensivePDF = new ComprehensivePDFReport(agentManager, battalion, directives, lineage, superIntelligence, bridge);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get("/", (req, res) => {
      res.json({
        name: "Trinnity Viseron Report Server",
        version: "5.0",
        endpoints: [
          "/stats - System statistics",
          "/agents - List all agents",
          "/agents/:id - Agent details",
          "/report - Full system report (JSON)",
          "/report/pdf - Full system report (PDF)",
          "/superintelligence - SuperIntelligence status",
          "/supermind - SuperMind knowledge domains"
        ]
      });
    });

    this.app.get("/stats", (req, res) => {
      const agents = this.agentManager.list();
      res.json({
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === "ACTIVE").length,
        roles: [...new Set(agents.map(a => a.role))].slice(0, 20),
        capabilities: [...new Set(agents.flatMap(a => a.capabilities))].length,
        superIntelligence: this.superIntelligence.getStats(),
        superMindLevel: this.superMind.getKnowledgeLevel(),
        timestamp: Date.now()
      });
    });

    this.app.get("/agents", (req, res) => {
      const agents = this.agentManager.list();
      const compact = agents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        status: a.status,
        capabilities: a.capabilities.length
      }));
      res.json({
        total: compact.length,
        agents: compact
      });
    });

    this.app.get("/agents/:id", (req, res) => {
      const agent = this.agentManager.getAgent(req.params.id);
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      res.json({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description,
        status: agent.status,
        capabilities: agent.capabilities
      });
    });

    this.app.get("/report", async (req, res) => {
      const report = await this.generateReport();
      res.json(report);
    });

    this.app.get("/report/pdf", async (req, res) => {
      const report = await this.generateReport();
      const pdfBuffer = await this.generatePDF(report);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=tvs_report.pdf");
      res.send(pdfBuffer);
    });

    this.app.get("/report/comprehensive-pdf", async (req, res) => {
      const agents = this.agentManager.list();
      const data = {
        agentCount: agents.length,
        activeCount: agents.filter(a => a.status === "ACTIVE").length,
        battalionCount: this.comprehensivePDF["battalion"].count(),
        intelligenceLevel: this.superIntelligence.getStats().totalSyntheses || 0,
        directiveCount: this.comprehensivePDF["directives"].getActiveDirectives().length,
        completedCount: this.comprehensivePDF["directives"].getCompletedReturns().length,
        providerCount: this.bridge.getAvailableProviders().length,
        uptime: Date.now() - (global as any).__TVS_START_TIME || 0,
        timestamp: new Date().toISOString()
      };
      try {
        const pdfBuffer = await this.comprehensivePDF.generate(data);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=tvs_comprehensive_report.pdf");
        res.send(pdfBuffer);
      } catch (err) {
        res.status(500).json({ error: "PDF generation failed", details: String(err) });
      }
    });

    this.app.get("/superintelligence", (req, res) => {
      res.json(this.superIntelligence.getStats());
    });

    this.app.get("/supermind", (req, res) => {
      res.json({
        level: this.superMind.getKnowledgeLevel(),
        stats: {}
      });
    });
  }

  private async generateReport(): Promise<any> {
    const agents = this.agentManager.list();
    const activeAgents = agents.filter(a => a.status === "ACTIVE");
    const roles = [...new Set(agents.map(a => a.role))];
    const allCapabilities = [...new Set(agents.flatMap(a => a.capabilities))];

    return {
      reportName: "Trinnity Viseron System - Complete Report",
      generatedAt: new Date().toISOString(),
      system: {
        version: "5.0",
        name: "Trinnity Viseron System Multiversal"
      },
      agents: {
        total: agents.length,
        active: activeAgents.length,
        inactive: agents.length - activeAgents.length,
        roles: roles.length,
        uniqueCapabilities: allCapabilities.length,
        topRoles: roles.slice(0, 10)
      },
      superIntelligence: this.superIntelligence.getStats(),
      superMind: {
        knowledgeLevel: this.superMind.getKnowledgeLevel()
      },
      capabilities: allCapabilities.slice(0, 50),
      recentAgents: agents.slice(0, 20).map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        status: a.status,
        capabilities: a.capabilities.slice(0, 5)
      }))
    };
  }

  private generatePDF(report: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(24).font("Helvetica-Bold").text("TRINNITY VISERON SYSTEM", { align: "center" });
      doc.fontSize(16).font("Helvetica").text("Complete System Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${report.generatedAt}`, { align: "center" });
      doc.moveDown(2);

      doc.fontSize(14).font("Helvetica-Bold").text("1. SYSTEM OVERVIEW");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(`System: ${report.system.name}`);
      doc.text(`Version: ${report.system.version}`);
      doc.moveDown();

      doc.fontSize(14).font("Helvetica-Bold").text("2. AGENT STATISTICS");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(`Total Agents: ${report.agents.total}`);
      doc.text(`Active Agents: ${report.agents.active}`);
      doc.text(`Inactive Agents: ${report.agents.inactive}`);
      doc.text(`Unique Roles: ${report.agents.roles}`);
      doc.text(`Unique Capabilities: ${report.agents.uniqueCapabilities}`);
      doc.moveDown();

      doc.fontSize(14).font("Helvetica-Bold").text("3. INTELLIGENCE LAYER");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(`SuperIntelligence Status: Active`);
      doc.text(`SuperMind Knowledge Level: ${report.superMind.knowledgeLevel}%`);
      doc.moveDown();

      doc.fontSize(14).font("Helvetica-Bold").text("4. TOP CAPABILITIES");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      const caps = report.capabilities || [];
      caps.slice(0, 30).forEach((cap: string, i: number) => {
        doc.text(`${i + 1}. ${cap}`);
      });
      doc.moveDown();

      doc.fontSize(14).font("Helvetica-Bold").text("5. SAMPLE AGENTS");
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica");
      const recent = report.recentAgents || [];
      recent.forEach((a: any) => {
        doc.text(`${a.name} [${a.status}] - ${a.role}`);
        doc.fontSize(8).text(`   Capabilities: ${(a.capabilities || []).join(", ")}`);
        doc.fontSize(9);
      });
      doc.moveDown();

      doc.fontSize(10).font("Helvetica").text("--- End of Report ---", { align: "center" });

      doc.end();
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        resolve();
      });
    });
  }

  stop(): void {
    this.server.close();
  }

  getPort(): number {
    return this.port;
  }
}
