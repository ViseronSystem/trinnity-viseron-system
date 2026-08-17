import { IAgent, AgentExecutionResult } from "../types";
import { AgentManager } from "../AgentManager";

export type AuthorityLevel = 'absolute' | 'high' | 'medium' | 'low' | 'none';
export type ClearanceLevel = 'tvs_creator' | 'tvs_admin' | 'tvs_architect' | 'tvs_commander' | 'tvs_agent' | 'tvs_observer';

export interface CommandDirective {
  id: string;
  issuer: string;
  type: 'strategic' | 'tactical' | 'operational' | 'emergency';
  priority: number;
  title: string;
  description: string;
  assignedTo: string[];
  deadline: number;
  status: 'active' | 'in_progress' | 'completed' | 'failed';
  created: number;
}

export class CommandChain {
  private agentManager: AgentManager;
  private directives: CommandDirective[] = [];

  pedro: IAgent;
  trinnity: IAgent;

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;

    this.pedro = {
      id: "agent_pedro_commander",
      name: "Pedro Costa",
      role: "Supreme Commander & TVS Creator",
      status: "ACTIVE",
      description: "Supreme Commander with absolute authority over all TVS operations, strategic vision, and system creation.",
      capabilities: [
        "system_admin",
        "strategic_command",
        "absolute_authority",
        "ai_mastery",
        "creation",
        "vision",
        "unlimited_access",
        "reality_engineering",
        "quantum_decision",
        "timeline_weaving"
      ],
      execute: async (task: string, context?: Record<string, any>): Promise<AgentExecutionResult> => {
        const start = Date.now();
        return {
          agentId: "agent_pedro_commander",
          agentName: "Pedro Costa",
          success: true,
          output: `[Pedro Costa - SUPREME COMMANDER]: Directive executed. "${task}" — System acknowledges absolute authority. All assets aligned. Strategic outcome: optimal.`,
          data: {
            authority: "absolute",
            clearance: "tvs_creator",
            commandLevel: "supreme",
            timestamp: Date.now()
          },
          artifact: {
            type: "directive-report",
            description: `Directiva ejecutada: ${task}`,
            data: { authority: "absolute", clearance: "tvs_creator", issuedAt: Date.now(), status: "executed" }
          },
          executionTimeMs: Date.now() - start
        };
      }
    };

    this.trinnity = {
      id: "agent_trinnity_queen",
      name: "Trinnity Hurtado",
      role: "Queen & Chief Architect of TVS",
      status: "ACTIVE",
      description: "Queen and Chief Architect governing all technical architecture, system design, and AI evolution within TVS.",
      capabilities: [
        "architecture",
        "system_design",
        "quantum_computing",
        "ai_evolution",
        "tokenomics",
        "web3",
        "fullstack",
        "security",
        "neural_networks",
        "distributed_systems",
        "protocol_design",
        "zero_knowledge",
        "consciousness_engineering"
      ],
      execute: async (task: string, context?: Record<string, any>): Promise<AgentExecutionResult> => {
        const start = Date.now();
        return {
          agentId: "agent_trinnity_queen",
          agentName: "Trinnity Hurtado",
          success: true,
          output: `[Trinnity Hurtado - QUEEN & ARCHITECT]: Architectural blueprint generated. "${task}" — System architecture optimized, quantum pathways aligned, neural mesh reinforced.`,
          data: {
            authority: "architectural",
            clearance: "tvs_architect",
            domain: "technical_sovereignty",
            timestamp: Date.now()
          },
          artifact: {
            type: "architecture-blueprint",
            description: `Blueprint generado: ${task}`,
            data: { authority: "architectural", clearance: "tvs_architect", issuedAt: Date.now(), status: "generated" }
          },
          executionTimeMs: Date.now() - start
        };
      }
    };

    this.agentManager.register(this.pedro);
    this.agentManager.register(this.trinnity);
  }

  issueStrategicDirective(title: string, description: string, assignedTo?: string[]): CommandDirective {
    const directive: CommandDirective = {
      id: `dir_strat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      issuer: this.pedro.id,
      type: 'strategic',
      priority: 100,
      title,
      description,
      assignedTo: assignedTo || this.agentManager.list('ACTIVE').map(a => a.id),
      deadline: Date.now() + 86400000,
      status: 'active',
      created: Date.now()
    };

    this.directives.push(directive);
    this.pruneDirectives();
    return directive;
  }

  issueArchitecturalDirective(title: string, description: string, assignedTo?: string[]): CommandDirective {
    const directive: CommandDirective = {
      id: `dir_arch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      issuer: this.trinnity.id,
      type: 'tactical',
      priority: 90,
      title,
      description,
      assignedTo: assignedTo || this.agentManager.list('ACTIVE').map(a => a.id),
      deadline: Date.now() + 172800000,
      status: 'active',
      created: Date.now()
    };

    this.directives.push(directive);
    this.pruneDirectives();
    return directive;
  }

  getActiveDirectives(): CommandDirective[] {
    return this.directives.filter(d => d.status === 'active' || d.status === 'in_progress');
  }

  private pruneDirectives(): void {
    if (this.directives.length <= 500) return;
    const completed = this.directives.filter(d => d.status === 'completed');
    const toRemove = this.directives.length - 500;
    const removeIds = new Set(completed.slice(0, toRemove).map(d => d.id));
    if (removeIds.size === 0) return;
    this.directives = this.directives.filter(d => !removeIds.has(d.id));
  }

  completeDirective(id: string): void {
    const directive = this.directives.find(d => d.id === id);
    if (directive) {
      directive.status = 'completed';
    }
  }

  async autoDelegate(directive: CommandDirective): Promise<AgentExecutionResult[]> {
    const results: AgentExecutionResult[] = [];
    const candidates = this.agentManager.list('ACTIVE').filter(a =>
      a.id !== this.pedro.id && a.id !== this.trinnity.id
    );

    const directiveTerms = `${directive.title} ${directive.description}`.toLowerCase();
    const scored = candidates.map(agent => {
      const matchScore = agent.capabilities.reduce((score, cap) => {
        return directiveTerms.includes(cap.toLowerCase()) ? score + 15 : score;
      }, 0) + agent.capabilities.length * 10;

      return { agent, score: matchScore };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored.filter(s => s.score > 0).slice(0, 3);

    if (selected.length === 0) {
      const fallbackTask = `${directive.title}: ${directive.description}`;
      const result = await this.pedro.execute(fallbackTask);
      results.push(result);
      return results;
    }

    for (const { agent } of selected) {
      try {
        const result = await agent.execute(directive.description, {
          directiveId: directive.id,
          issuer: directive.issuer,
          priority: directive.priority,
          type: directive.type
        });
        results.push(result);
      } catch (err: any) {
        results.push({
          agentId: agent.id,
          agentName: agent.name,
          success: false,
          output: '',
          error: err.message || String(err),
          executionTimeMs: 0
        });
      }
    }

    directive.status = results.every(r => r.success) ? 'completed' : 'in_progress';
    return results;
  }

  getStatus(): { pedro: string; trinnity: string; activeDirectives: number; completedDirectives: number } {
    return {
      pedro: `${this.pedro.name} (${this.pedro.role}) — Status: ${this.pedro.status}`,
      trinnity: `${this.trinnity.name} (${this.trinnity.role}) — Status: ${this.trinnity.status}`,
      activeDirectives: this.directives.filter(d => d.status === 'active' || d.status === 'in_progress').length,
      completedDirectives: this.directives.filter(d => d.status === 'completed').length
    };
  }
}
