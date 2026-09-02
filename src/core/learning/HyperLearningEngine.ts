import cron from "node-cron";
import { MemoryEngine } from "../memory/MemoryEngine";
import { AgentManager } from "../AgentManager";
import { AIProviderBridge, AIProviderId } from "../bridge/AIProviderBridge";
import * as fs from "fs-extra";
import * as path from "path";

const MAX_HISTORY = 200;

/**
 * HyperLearning Engine — REAL version
 * 
 * Instead of multiplying a counter by 1.05, this engine:
 * 1. Reads real system metrics (task queue, agent activity, memory, errors)
 * 2. Analyzes what's working and what's failing
 * 3. Generates actionable insights via AI
 * 4. Stores learnings that actually influence future behavior
 * 5. Tracks a REAL intelligence score based on system performance
 */
export class HyperLearningEngine {
  private memoryEngine: MemoryEngine;
  private agentManager: AgentManager;
  private bridge: AIProviderBridge;
  private cronJob: ReturnType<typeof cron.schedule> | null = null;
  private cycleCount: number = 0;
  private isRunning: boolean = false;
  private history: Array<{ cycle: number; metrics: RealMetrics; insights: string[]; timestamp: number }> = [];
  private dataDir: string;

  constructor(memoryEngine: MemoryEngine, agentManager: AgentManager, bridge: AIProviderBridge, _superMind?: any) {
    this.memoryEngine = memoryEngine;
    this.agentManager = agentManager;
    this.bridge = bridge;
    this.dataDir = path.join(process.cwd(), "data");
    this.loadState();
  }

  private loadState(): void {
    try {
      const statePath = path.join(this.dataDir, "state", "hyper-learning.json");
      if (fs.existsSync(statePath)) {
        const saved = fs.readJsonSync(statePath);
        this.cycleCount = saved.cycleCount || 0;
        this.history = saved.history || [];
      }
    } catch {}
  }

  private saveState(): void {
    try {
      const statePath = path.join(this.dataDir, "state", "hyper-learning.json");
      fs.ensureDirSync(path.dirname(statePath));
      fs.writeJsonSync(statePath, {
        cycleCount: this.cycleCount,
        history: this.history.slice(-50),
        lastUpdated: new Date().toISOString()
      });
    } catch {}
  }

  start(intervalMinutes: number = 30): void {
    if (this.cronJob) this.stop();
    this.executeCycle();
    this.cronJob = cron.schedule(`2-59/${intervalMinutes} * * * *`, () => {
      this.executeCycle();
    });
  }

  stop(): void {
    if (this.cronJob) { this.cronJob.stop(); this.cronJob = null; }
  }

  async executeCycle(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try { await this.runCycle(); } finally { this.isRunning = false; }
  }

  private async runCycle(): Promise<void> {
    this.cycleCount++;
    const start = Date.now();
    const insights: string[] = [];

    try {
      // 1. Collect REAL system metrics
      const metrics = this.collectRealMetrics();

      // 2. Analyze trends from history
      const trends = this.analyzeTrends(metrics);
      insights.push(...trends);

      // 3. Generate AI insights based on real data
      try {
        const aiInsights = await this.bridge.chat({
          prompt: `System Health Report (Cycle #${this.cycleCount}):\n` +
            `- Active agents: ${metrics.activeAgents}\n` +
            `- Tasks completed (24h): ${metrics.tasksCompleted24h}\n` +
            `- Task success rate: ${metrics.taskSuccessRate}%\n` +
            `- Memory items: ${metrics.memoryItems}\n` +
            `- Knowledge docs: ${metrics.knowledgeDocs}\n` +
            `- Errors (24h): ${metrics.errors24h}\n` +
            `- Uptime: ${metrics.uptimeHours}h\n` +
            (trends.length > 0 ? `\nTrends:\n${trends.join("\n")}` : "") +
            `\nGenerate 3 actionable insights to improve system performance.`,
          systemPrompt: "You are a system performance analyst. Be concise and actionable.",
          providerId: "ollama" as AIProviderId,
          maxTokens: 1024,
          taskType: "reasoning"
        });
        if (aiInsights.success && aiInsights.text) {
          const aiLines = aiInsights.text.split("\n").filter(l => l.trim().length > 10).slice(0, 3);
          insights.push(...aiLines.map(l => `[AI] ${l.trim()}`));
        }
      } catch {}

      // 4. Calculate REAL intelligence score (not cosmetic)
      const intelligenceScore = this.calculateRealIntelligence(metrics);

      // 5. Store learnings
      this.memoryEngine.addKnowledge(
        `HyperLearning Cycle #${this.cycleCount}`,
        "HYPER_LEARNING",
        JSON.stringify({ metrics, intelligenceScore, insightsCount: insights.length }),
        ["hyperlearning", `cycle_${this.cycleCount}`, "system_health"]
      );

      // 6. Persist state
      this.history.push({ cycle: this.cycleCount, metrics, insights: insights.slice(0, 10), timestamp: Date.now() });
      if (this.history.length > MAX_HISTORY) this.history = this.history.slice(-MAX_HISTORY);
      this.saveState();

      // 7. Write cycle report
      const reportDir = path.join(this.dataDir, "reports");
      fs.ensureDirSync(reportDir);
      fs.writeJsonSync(path.join(reportDir, `cycle_${this.cycleCount}.json`), {
        cycle: this.cycleCount,
        timestamp: new Date().toISOString(),
        metrics,
        intelligenceScore,
        insights,
        executionTimeMs: Date.now() - start
      }, { spaces: 2 });

      console.log(`[HyperLearning] Cycle #${this.cycleCount} | Score: ${intelligenceScore}/100 | Tasks: ${metrics.tasksCompleted24h} | Success: ${metrics.taskSuccessRate}% | ${insights.length} insights | ${Date.now() - start}ms`);
    } catch (err) {
      console.error(`[HyperLearning] Error in cycle #${this.cycleCount}:`, err);
    }
  }

  /**
   * Collect REAL metrics from the actual system state
   */
  private collectRealMetrics(): RealMetrics {
    const metrics: RealMetrics = {
      activeAgents: 0,
      tasksCompleted24h: 0,
      tasksFailed24h: 0,
      taskSuccessRate: 0,
      memoryItems: 0,
      knowledgeDocs: 0,
      errors24h: 0,
      uptimeHours: Math.round(process.uptime() / 3600 * 10) / 10,
      avgResponseTimeMs: 0,
      toolsExecuted24h: 0,
      memoryConsolidations: 0,
      eventBusEvents: 0,
      timestamp: Date.now()
    };

    try {
      // Active agents
      metrics.activeAgents = this.agentManager.list("ACTIVE").length;

      // Task queue metrics
      const taskQueuePath = path.join(this.dataDir, "state", "task-queue.json");
      if (fs.existsSync(taskQueuePath)) {
        try {
          const tq = fs.readJsonSync(taskQueuePath);
          const tasks = Array.isArray(tq) ? tq : (tq.tasks || []);
          const now = Date.now();
          const dayAgo = now - 86400000;
          const recent = tasks.filter((t: any) => {
            const ts = new Date(t.createdAt || t.updatedAt || 0).getTime();
            return ts > dayAgo;
          });
          metrics.tasksCompleted24h = recent.filter((t: any) => t.status === "completed" || t.status === "COMPLETED").length;
          metrics.tasksFailed24h = recent.filter((t: any) => t.status === "failed" || t.status === "FAILED").length;
          const total = metrics.tasksCompleted24h + metrics.tasksFailed24h;
          metrics.taskSuccessRate = total > 0 ? Math.round(metrics.tasksCompleted24h / total * 100) : 0;
        } catch {}
      }

      // Memory metrics
      try {
        const memStats = (this.memoryEngine as any).getStats?.() || {};
        metrics.memoryItems = memStats?.longTerm?.totalItems || 0;
        metrics.knowledgeDocs = memStats?.knowledge?.totalDocuments || 0;
      } catch {}

      // Error log count
      const errorLogPath = path.join(this.dataDir, "..", "server-error.log");
      if (fs.existsSync(errorLogPath)) {
        try {
          const stat = fs.statSync(errorLogPath);
          metrics.errors24h = Math.floor(stat.size / 500); // rough estimate
        } catch {}
      }

      // Agent activity
      const activityPath = path.join(this.dataDir, "knowledge", "agent-activity.jsonl");
      if (fs.existsSync(activityPath)) {
        try {
          const content = fs.readFileSync(activityPath, "utf8");
          const lines = content.trim().split("\n").filter(Boolean);
          const dayAgo = Date.now() - 86400000;
          const recent = lines.filter(l => {
            try { const e = JSON.parse(l); return new Date(e.timestamp || 0).getTime() > dayAgo; } catch { return false; }
          });
          metrics.toolsExecuted24h = recent.filter(l => l.includes("tool")).length;
        } catch {}
      }

    } catch {}

    return metrics;
  }

  /**
   * Analyze trends from historical data
   */
  private analyzeTrends(current: RealMetrics): string[] {
    const trends: string[] = [];
    if (this.history.length < 2) return trends;

    const prev = this.history[this.history.length - 1]?.metrics;
    if (!prev) return trends;

    if (current.tasksCompleted24h > prev.tasksCompleted24h * 1.2) {
      trends.push(`↑ Task completion up ${Math.round((current.tasksCompleted24h / (prev.tasksCompleted24h || 1) - 1) * 100)}%`);
    }
    if (current.taskSuccessRate < prev.taskSuccessRate - 10) {
      trends.push(`↓ Success rate dropped from ${prev.taskSuccessRate}% to ${current.taskSuccessRate}%`);
    }
    if (current.errors24h > prev.errors24h * 1.5) {
      trends.push(`↑ Errors increased: ${prev.errors24h} → ${current.errors24h}`);
    }
    if (current.memoryItems > prev.memoryItems * 1.1) {
      trends.push(`↑ Memory growing: ${prev.memoryItems} → ${current.memoryItems} items`);
    }

    return trends;
  }

  /**
   * Calculate REAL intelligence score based on actual system performance
   * Score 0-100 based on: task success, learning rate, error rate, uptime
   */
  private calculateRealIntelligence(metrics: RealMetrics): number {
    let score = 0;

    // Task success (0-30 points)
    score += Math.min(30, metrics.taskSuccessRate * 0.3);

    // Activity level (0-20 points) — more real work = higher score
    score += Math.min(20, metrics.tasksCompleted24h * 2);

    // Memory/knowledge growth (0-20 points)
    score += Math.min(20, (metrics.memoryItems + metrics.knowledgeDocs) * 0.01);

    // Error penalty (0-15 points deducted)
    score -= Math.min(15, metrics.errors24h * 0.1);

    // Uptime bonus (0-15 points)
    score += Math.min(15, metrics.uptimeHours * 0.5);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getStats(): { cycleCount: number; intelligenceScore: number; lastMetrics: RealMetrics | null } {
    const lastMetrics = this.history.length > 0 ? this.history[this.history.length - 1].metrics : null;
    return {
      cycleCount: this.cycleCount,
      intelligenceScore: lastMetrics ? this.calculateRealIntelligence(lastMetrics) : 0,
      lastMetrics
    };
  }

  getIntelligenceLevel(): number {
    const lastMetrics = this.history.length > 0 ? this.history[this.history.length - 1].metrics : null;
    return lastMetrics ? this.calculateRealIntelligence(lastMetrics) : 0;
  }

  getCycleCount(): number { return this.cycleCount; }

  getHistory(): any[] { return this.history; }
}

interface RealMetrics {
  activeAgents: number;
  tasksCompleted24h: number;
  tasksFailed24h: number;
  taskSuccessRate: number;
  memoryItems: number;
  knowledgeDocs: number;
  errors24h: number;
  uptimeHours: number;
  avgResponseTimeMs: number;
  toolsExecuted24h: number;
  memoryConsolidations: number;
  eventBusEvents: number;
  timestamp: number;
}
