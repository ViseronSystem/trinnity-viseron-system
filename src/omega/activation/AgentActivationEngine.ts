// AgentActivationEngine.ts — Motor que transforma specs de agentes em agentes vivos.
// Cada agente recebe: provider IA próprio, memória isolada, ciclo autónomo, e API de interação.
// © Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)

import * as path from "path";
import * as fs from "fs";
import { SmartAgent, SmartAgentConfig } from "../../core/agents/SmartAgent";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ModelRouter } from "../../core/model-router/ModelRouter";
import { AgentSpec, specToSmartAgentConfig } from "../agent-runtime/AgentSpec";

export interface ActiveAgent {
  agentId: string;
  name: string;
  role: string;
  domain: string;
  capabilities: string[];
  status: "active" | "idle" | "thinking" | "error";
  provider: string;
  memoryRecords: number;
  tasksCompleted: number;
  lastActivity: number | null;
  instance: SmartAgent;
  memDir: string;
}

export interface AgentActivationStats {
  total: number;
  active: number;
  byRole: Record<string, number>;
  totalTasks: number;
  totalMemory: number;
}

export class AgentActivationEngine {
  public agents: Map<string, ActiveAgent> = new Map();
  private factory: ProviderFactory;
  private specsDir: string;
  private dataRoot: string;
  private cycleTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(specsDir: string, dataRoot: string) {
    this.factory = new ProviderFactory();
    this.specsDir = specsDir;
    this.dataRoot = dataRoot;
  }

  async loadAll(): Promise<number> {
    if (!fs.existsSync(this.specsDir)) {
      console.warn("[Activation] Specs dir not found:", this.specsDir);
      return 0;
    }
    const files = fs.readdirSync(this.specsDir).filter(f => f.endsWith(".json"));
    let loaded = 0;
    for (const file of files) {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(this.specsDir, file), "utf8")) as AgentSpec & { provider?: { preferred?: string } };
        if (!raw.id || !raw.name || !raw.role) continue;
        const cfg = specToSmartAgentConfig(raw);
        const agent = this.instantiateAgent(cfg, raw);
        if (agent) {
          this.agents.set(cfg.id, agent);
          loaded++;
        }
      } catch (err: any) {
        console.warn(`[Activation] Failed to load ${file}: ${err.message}`);
      }
    }
    console.log(`[Activation] ${loaded} agents activated from ${files.length} specs`);
    return loaded;
  }

  private instantiateAgent(cfg: SmartAgentConfig, spec: AgentSpec): ActiveAgent | null {
    try {
      const smartAgent = new SmartAgent(cfg, new ProviderFactory(), new ModelRouter());
      const memDir = path.join(this.dataRoot, "agents", cfg.id);
      fs.mkdirSync(memDir, { recursive: true });
      // Seed memory file if absent
      const memFile = path.join(memDir, "memory.jsonl");
      if (!fs.existsSync(memFile)) {
        fs.writeFileSync(memFile, JSON.stringify({
          type: "activation", agentId: cfg.id, role: cfg.role,
          capabilities: cfg.capabilities, at: new Date().toISOString()
        }) + "\n");
      }
      const records = fs.existsSync(memFile) ? fs.readFileSync(memFile, "utf8").split("\n").filter(Boolean).length : 1;
      const tasksFile = path.join(memDir, "tasks.jsonl");
      const tasks = fs.existsSync(tasksFile) ? fs.readFileSync(tasksFile, "utf8").split("\n").filter(Boolean).length : 0;
      return {
        agentId: cfg.id, name: cfg.name, role: cfg.role,
        domain: (spec as any).domain || spec.squad || "general",
        capabilities: cfg.capabilities,
        status: "idle", provider: cfg.preferredProvider || "ollama",
        memoryRecords: records, tasksCompleted: tasks,
        lastActivity: null, instance: smartAgent, memDir,
      };
    } catch (err: any) {
      console.warn(`[Activation] Failed to instantiate ${cfg.id}: ${err.message}`);
      return null;
    }
  }

  async chat(agentId: string, message: string): Promise<{ reply: string; agentId: string; agentName: string }> {
    const ag = this.agents.get(agentId);
    if (!ag) throw new Error(`Agent ${agentId} not found`);
    ag.status = "thinking";
    ag.lastActivity = Date.now();
    try {
      const result = await ag.instance.execute(message);
      ag.status = "idle";
      const reply = result.output || "(sem resposta)";
      this.recordMemory(ag, { type: "chat", role: "user", content: message, at: new Date().toISOString() });
      this.recordMemory(ag, { type: "chat", role: "assistant", content: reply, at: new Date().toISOString() });
      return { reply, agentId, agentName: ag.name };
    } catch (err: any) {
      ag.status = "error";
      this.recordMemory(ag, { type: "error", message: err.message, at: new Date().toISOString() });
      return { reply: `Erro: ${err.message}`, agentId, agentName: ag.name };
    }
  }

  async executeTask(agentId: string, task: string): Promise<{ success: boolean; output: string; agentId: string }> {
    const ag = this.agents.get(agentId);
    if (!ag) throw new Error(`Agent ${agentId} not found`);
    ag.status = "thinking";
    ag.lastActivity = Date.now();
    try {
      const result = await ag.instance.execute(task);
      ag.status = "idle";
      ag.tasksCompleted += 1;
      this.recordMemory(ag, { type: "task", task, result: result.output, success: result.success, at: new Date().toISOString() });
      this.appendTask(ag, { task, output: result.output, success: result.success, at: new Date().toISOString() });
      return { success: result.success, output: result.output || "", agentId };
    } catch (err: any) {
      ag.status = "error";
      return { success: false, output: err.message, agentId };
    }
  }

  startAutonomyCycle(agentId: string, intervalMs = 120_000): void {
    if (this.cycleTimers.has(agentId)) return;
    const ag = this.agents.get(agentId);
    if (!ag) return;
    const timer = setInterval(async () => {
      if (ag.status !== "idle") return;
      try {
        const task = this.generateAutonomousTask(ag);
        if (!task) return;
        ag.status = "thinking";
        ag.lastActivity = Date.now();
        const result = await ag.instance.execute(task);
        ag.status = "idle";
        ag.tasksCompleted += 1;
        this.recordMemory(ag, { type: "auto_task", task, result: result.output, success: result.success, at: new Date().toISOString() });
        this.appendTask(ag, { task, output: result.output, success: result.success, at: new Date().toISOString() });
      } catch (err: any) {
        ag.status = "error";
        this.recordMemory(ag, { type: "auto_error", message: err.message, at: new Date().toISOString() });
      }
    }, intervalMs);
    this.cycleTimers.set(agentId, timer);
    // Não segurar o event loop: em produção o servidor HTTP mantém o processo vivo;
    // em testes permite ao processo terminar quando o trabalho acaba.
    timer.unref?.();
    console.log(`[Activation] Autonomy cycle started for ${agentId} (every ${intervalMs / 1000}s)`);
  }

  stopAutonomyCycle(agentId: string): void {
    const timer = this.cycleTimers.get(agentId);
    if (timer) { clearInterval(timer); this.cycleTimers.delete(agentId); }
  }

  startAllAutonomyCycles(intervalMs = 900_000): void {
    // Escalonado: um agente de cada vez (intervalo/nAgentes entre arranques).
    // Ollama processa sequencialmente — disparos simultâneos saturariam o modelo
    // e bloqueariam JARVIS/VISERON/ATLAS durante minutos.
    const ids = Array.from(this.agents.keys());
    const spacing = Math.max(15_000, Math.floor(intervalMs / Math.max(1, ids.length)));
    ids.forEach((id, i) => {
      const t = setTimeout(() => {
        clearTimeout(t);
        this.startAutonomyCycle(id, intervalMs);
      }, i * spacing);
      t.unref?.();
    });
    console.log(`[Activation] ${ids.length} ciclos autónomos agendados (escalonados a cada ${Math.round(spacing / 1000)}s, ciclo=${intervalMs / 1000}s)`);
  }

  stopAllAutonomyCycles(): void {
    for (const [id] of this.cycleTimers) this.stopAutonomyCycle(id);
  }

  listAgents(): Array<Omit<ActiveAgent, "instance">> {
    return Array.from(this.agents.values()).map(a => {
      const { instance, ...rest } = a;
      return rest;
    });
  }

  getStats(): AgentActivationStats {
    const byRole: Record<string, number> = {};
    let totalTasks = 0;
    let totalMemory = 0;
    for (const a of this.agents.values()) {
      const role = a.role || "unknown";
      byRole[role] = (byRole[role] || 0) + 1;
      totalTasks += a.tasksCompleted;
      totalMemory += a.memoryRecords;
    }
    return { total: this.agents.size, active: this.agents.size, byRole, totalTasks, totalMemory };
  }

  getMemory(agentId: string, limit = 50): Record<string, unknown>[] {
    const ag = this.agents.get(agentId);
    if (!ag) return [];
    const memFile = path.join(ag.memDir, "memory.jsonl");
    if (!fs.existsSync(memFile)) return [];
    const lines = fs.readFileSync(memFile, "utf8").split("\n").filter(Boolean);
    return lines.slice(-limit).map(l => { try { return JSON.parse(l); } catch { return { raw: l }; } });
  }

  getTasks(agentId: string, limit = 50): Record<string, unknown>[] {
    const ag = this.agents.get(agentId);
    if (!ag) return [];
    const tasksFile = path.join(ag.memDir, "tasks.jsonl");
    if (!fs.existsSync(tasksFile)) return [];
    const lines = fs.readFileSync(tasksFile, "utf8").split("\n").filter(Boolean);
    return lines.slice(-limit).map(l => { try { return JSON.parse(l); } catch { return { raw: l }; } });
  }

  private recordMemory(ag: ActiveAgent, record: Record<string, unknown>): void {
    try {
      const memFile = path.join(ag.memDir, "memory.jsonl");
      fs.appendFileSync(memFile, JSON.stringify(record) + "\n");
      ag.memoryRecords++;
    } catch {}
  }

  private appendTask(ag: ActiveAgent, record: Record<string, unknown>): void {
    try {
      const tasksFile = path.join(ag.memDir, "tasks.jsonl");
      fs.appendFileSync(tasksFile, JSON.stringify(record) + "\n");
    } catch {}
  }

  private generateAutonomousTask(ag: ActiveAgent): string | null {
    const tasks: string[] = [];
    if (ag.domain === "business" || ag.domain === "revenue") {
      tasks.push(
        `Analisa o estado atual da agência e sugere 1 melhoria de revenue`,
        `Revê as métricas dos últimos clientes e propõe 1 ação de upselling`,
        `Gera 1 lead qualificado para o pipeline de vendas`
      );
    } else if (ag.domain === "engineering" || ag.domain === "software") {
      tasks.push(
        `Audita o código do TVS e identifica 1 melhoria de performance`,
        `Revê a arquitetura de integração com OmniRoute e sugere 1 optimização`,
        `Analisa o estado dos testes e propõe 1 novo caso de teste`
      );
    } else if (ag.domain === "security") {
      tasks.push(
        `Audita as permissões dos agentes e reporta anomalias`,
        `Verifica a integridade dos ficheiros de estado (data/)`,
        `Revê as variáveis de ambiente expostas e avalia riscos`
      );
    } else if (ag.domain === "intelligence" || ag.domain === "research") {
      tasks.push(
        `Pesquisa 1 tendência de IA relevante para o TVS e resume em 3 bullet points`,
        `Analisa o knowledge graph e identifica 1 lacuna de conhecimento`,
        `Sugere 1 nova integração externa com base nas capacidades atuais`
      );
    } else if (ag.domain === "perception" || ag.domain === "vision") {
      tasks.push(
        `Analisa o estado do sistema e projeta tendências para a próxima semana`,
        `Revê os logs de evolução e identifica 1 padrão emergente`
      );
    } else {
      tasks.push(
        `Analisa o estado atual do sistema e sugere 1 melhoria`,
        `Revê a tua especialidade (${ag.role}) e propõe 1 ação concreta para hoje`
      );
    }
    return tasks[Math.floor(Math.random() * tasks.length)];
  }
}
