import * as fs from "fs";
import * as path from "path";
import { ToolExecution } from "./ToolExecutor";
import { ExecutionPlan } from "./TaskPlanner";

/**
 * LearningEngine — Motor de aprendizagem contínua que regista e analisa cada execução.
 * 
 * Capacidades:
 *   - Regista cada execução com resultado e contexto
 *   - Identifica padrões de sucesso/fracasso
 *   - Sugere melhorias para futuras execuções
 *   - Mantém memória de longo prazo por cliente
 *   - Expõe estatísticas de performance
 */

export interface LearningRecord {
  id: string;
  planId: string;
  request: string;
  category: string;
  language: string;
  steps: number;
  successfulSteps: number;
  failedSteps: number;
  totalDurationMs: number;
  toolsUsed: string[];
  clientContext?: string;
  success: boolean;
  errorSummary?: string;
  lessonsLearned: string[];
  createdAt: string;
}

export interface LearningStats {
  totalExecutions: number;
  successRate: number;
  avgDurationMs: number;
  byCategory: Record<string, { total: number; success: number; avgDuration: number }>;
  byTool: Record<string, { used: number; success: number }>;
  topErrors: { error: string; count: number }[];
  improvements: string[];
}

export interface ClientMemory {
  clientId: string;
  preferences: Record<string, any>;
  history: string[];
  successfulPatterns: string[];
  failedPatterns: string[];
  lastInteraction: string;
}

export class LearningEngine {
  private dataDir: string;
  private recordsFile: string;
  private clientsFile: string;
  private records: LearningRecord[] = [];
  private clients: Map<string, ClientMemory> = new Map();

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.recordsFile = path.join(dataDir, "knowledge", "brain-learning.jsonl");
    this.clientsFile = path.join(dataDir, "knowledge", "brain-clients.json");
    this.loadRecords();
    this.loadClients();
  }

  /**
   * Regista uma execução completa para aprendizagem
   */
  recordExecution(
    plan: ExecutionPlan,
    results: ToolExecution[],
    success: boolean,
    errorSummary?: string
  ): LearningRecord {
    const successfulSteps = results.filter(r => r.success).length;
    const failedSteps = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
    const toolsUsed = [...new Set(results.map(r => r.toolName))];
    const lessonsLearned = this.extractLessons(plan, results, success);

    const record: LearningRecord = {
      id: `lr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      planId: plan.id,
      request: plan.originalRequest.slice(0, 500),
      category: plan.category,
      language: plan.language,
      steps: plan.steps.length,
      successfulSteps,
      failedSteps,
      totalDurationMs: totalDuration,
      toolsUsed,
      clientContext: plan.clientContext,
      success,
      errorSummary,
      lessonsLearned,
      createdAt: new Date().toISOString(),
    };

    this.records.push(record);
    this.saveRecords();
    this.updateClientMemory(plan, success, lessonsLearned);

    return record;
  }

  /**
   * Obtém estatísticas de aprendizagem
   */
  getStats(): LearningStats {
    const total = this.records.length;
    if (total === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        avgDurationMs: 0,
        byCategory: {},
        byTool: {},
        topErrors: [],
        improvements: [],
      };
    }

    const successful = this.records.filter(r => r.success).length;
    const avgDuration = this.records.reduce((s, r) => s + r.totalDurationMs, 0) / total;

    // By category
    const byCategory: Record<string, { total: number; success: number; avgDuration: number }> = {};
    for (const r of this.records) {
      if (!byCategory[r.category]) {
        byCategory[r.category] = { total: 0, success: 0, avgDuration: 0 };
      }
      byCategory[r.category].total++;
      if (r.success) byCategory[r.category].success++;
      byCategory[r.category].avgDuration += r.totalDurationMs;
    }
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].avgDuration = Math.round(byCategory[cat].avgDuration / byCategory[cat].total);
    }

    // By tool
    const byTool: Record<string, { used: number; success: number }> = {};
    for (const r of this.records) {
      for (const tool of r.toolsUsed) {
        if (!byTool[tool]) byTool[tool] = { used: 0, success: 0 };
        byTool[tool].used++;
        if (r.success) byTool[tool].success++;
      }
    }

    // Top errors
    const errorMap = new Map<string, number>();
    for (const r of this.records) {
      if (r.errorSummary) {
        const key = r.errorSummary.slice(0, 100);
        errorMap.set(key, (errorMap.get(key) || 0) + 1);
      }
    }
    const topErrors = Array.from(errorMap.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Improvements from lessons
    const improvements: string[] = [];
    for (const r of this.records.slice(-20)) {
      for (const lesson of r.lessonsLearned) {
        if (!improvements.includes(lesson)) improvements.push(lesson);
      }
    }

    return {
      totalExecutions: total,
      successRate: Math.round((successful / total) * 100),
      avgDurationMs: Math.round(avgDuration),
      byCategory,
      byTool,
      topErrors,
      improvements: improvements.slice(0, 10),
    };
  }

  /**
   * Obtém memória de um cliente específico
   */
  getClientMemory(clientId: string): ClientMemory | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Sugere melhorias baseadas no histórico
   */
  suggestImprovements(category?: string): string[] {
    const relevant = category
      ? this.records.filter(r => r.category === category)
      : this.records;

    const suggestions: string[] = [];
    const recentFailed = relevant.filter(r => !r.success).slice(-10);

    for (const fail of recentFailed) {
      if (fail.errorSummary && !suggestions.includes(fail.errorSummary)) {
        suggestions.push(`Avoid: ${fail.errorSummary.slice(0, 100)}`);
      }
      for (const lesson of fail.lessonsLearned) {
        if (!suggestions.includes(lesson)) suggestions.push(lesson);
      }
    }

    const recentSuccess = relevant.filter(r => r.success).slice(-10);
    for (const success of recentSuccess) {
      for (const lesson of success.lessonsLearned) {
        if (!suggestions.includes(lesson)) suggestions.push(lesson);
      }
    }

    return suggestions.slice(0, 10);
  }

  /**
   * Obtém os últimos N registos
   */
  getRecent(limit = 20): LearningRecord[] {
    return this.records.slice(-limit);
  }

  private extractLessons(
    plan: ExecutionPlan,
    results: ToolExecution[],
    success: boolean
  ): string[] {
    const lessons: string[] = [];

    if (success) {
      const tools = [...new Set(results.map(r => r.toolName))];
      if (tools.length > 0) {
        lessons.push(`Successful tools for ${plan.category}: ${tools.join(", ")}`);
      }
    } else {
      const failed = results.filter(r => !r.success);
      for (const f of failed) {
        if (f.error) {
          lessons.push(`Failed ${f.toolName}: ${f.error.slice(0, 80)}`);
        }
      }
    }

    if (results.length > 3) {
      lessons.push(`Complex task (${results.length} steps) - consider breaking down further`);
    }

    return lessons.slice(0, 5);
  }

  private updateClientMemory(
    plan: ExecutionPlan,
    success: boolean,
    lessons: string[]
  ): void {
    if (!plan.clientContext) return;

    const clientId = plan.clientContext;
    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, {
        clientId,
        preferences: {},
        history: [],
        successfulPatterns: [],
        failedPatterns: [],
        lastInteraction: new Date().toISOString(),
      });
    }

    const mem = this.clients.get(clientId)!;
    mem.lastInteraction = new Date().toISOString();
    mem.history.push(`${plan.category}: ${plan.originalRequest.slice(0, 100)}`);
    if (mem.history.length > 50) mem.history = mem.history.slice(-50);

    if (success) {
      for (const lesson of lessons) {
        if (!mem.successfulPatterns.includes(lesson)) {
          mem.successfulPatterns.push(lesson);
        }
      }
    } else {
      for (const lesson of lessons) {
        if (!mem.failedPatterns.includes(lesson)) {
          mem.failedPatterns.push(lesson);
        }
      }
    }

    this.saveClients();
  }

  private loadRecords(): void {
    try {
      if (fs.existsSync(this.recordsFile)) {
        const lines = fs.readFileSync(this.recordsFile, "utf8").split("\n").filter(Boolean);
        this.records = lines.map(l => {
          try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);
      }
    } catch {
      this.records = [];
    }
  }

  private saveRecords(): void {
    try {
      const dir = path.dirname(this.recordsFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.recordsFile, this.records.map(r => JSON.stringify(r)).join("\n"), "utf8");
    } catch {}
  }

  private loadClients(): void {
    try {
      if (fs.existsSync(this.clientsFile)) {
        const data = JSON.parse(fs.readFileSync(this.clientsFile, "utf8"));
        if (typeof data === "object") {
          for (const [k, v] of Object.entries(data)) {
            this.clients.set(k, v as ClientMemory);
          }
        }
      }
    } catch {
      this.clients = new Map();
    }
  }

  private saveClients(): void {
    try {
      const dir = path.dirname(this.clientsFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const obj: Record<string, ClientMemory> = {};
      for (const [k, v] of this.clients) obj[k] = v;
      fs.writeFileSync(this.clientsFile, JSON.stringify(obj, null, 2), "utf8");
    } catch {}
  }
}
