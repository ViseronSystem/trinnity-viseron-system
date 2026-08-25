import { IAgent, AgentStatus, AgentExecutionResult } from "./types";

/**
 * AgentManager - Gestor Dinámico de Agentes para Trinnity Viseron System v1.0
 * Diseñado para gestionar eficiente y concurrentemente más de 200+ agentes.
 */
export class AgentManager {
  private agents: Map<string, IAgent> = new Map();
  private roleIndex: Map<string, Set<string>> = new Map();
  private capabilityIndex: Map<string, Set<string>> = new Map();

  /**
   * Registra o crea un nuevo agente en el sistema.
   */
  public register(agent: IAgent): void {
    if (this.agents.has(agent.id)) {
      console.warn(`[AgentManager] El agente ID ${agent.id} ya existe. Actualizando registro.`);
    }

    this.agents.set(agent.id, agent);
    this.indexAgent(agent);
    console.log(`[AgentManager] Agente registrado con éxito: ${agent.name} (ID: ${agent.id}, Rol: ${agent.role})`);
  }

  /**
   * Método de retrocompatibilidad.
   */
  public add(agent: any): void {
    const normalizedAgent: IAgent = {
      id: agent.id || agent.name || `agent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: agent.name || 'Agente Genérico',
      role: agent.role || 'General',
      status: 'ACTIVE',
      capabilities: agent.capabilities || [],
      execute: async (task: string, context?: Record<string, any>): Promise<AgentExecutionResult> => {
        const start = Date.now();
        try {
          let output = '';
          if (typeof agent.execute === 'function') {
            output = await agent.execute(task, context);
          } else if (typeof agent.command === 'function') {
            output = await agent.command(task);
          } else {
            output = `Agente ${agent.name} procesó la tarea: ${task}`;
          }
          return {
            agentId: normalizedAgent.id,
            agentName: normalizedAgent.name,
            success: true,
            output: typeof output === 'string' ? output : JSON.stringify(output),
            executionTimeMs: Date.now() - start
          };
        } catch (error: any) {
          return {
            agentId: normalizedAgent.id,
            agentName: normalizedAgent.name,
            success: false,
            output: '',
            error: error.message || String(error),
            executionTimeMs: Date.now() - start
          };
        }
      }
    };
    this.register(normalizedAgent);
  }

  /**
   * Activa un agente pausado o inactivo.
   */
  public activate(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = 'ACTIVE';
      console.log(`[AgentManager] Agente ${agent.name} (${agentId}) activado.`);
      return true;
    }
    return false;
  }

  /**
   * Pausa la ejecución de un agente.
   */
  public pause(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = 'PAUSED';
      console.log(`[AgentManager] Agente ${agent.name} (${agentId}) pausado.`);
      return true;
    }
    return false;
  }

  /**
   * Elimina un agente del registro.
   */
  public unregister(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    this.deindexAgent(agent);
    this.agents.delete(agentId);
    console.log(`[AgentManager] Agente ${agent.name} (${agentId}) eliminado del sistema.`);
    return true;
  }

  /**
   * Obtiene un agente por su ID o Nombre.
   */
  public getAgent(agentIdOrName: string): IAgent | undefined {
    if (this.agents.has(agentIdOrName)) {
      return this.agents.get(agentIdOrName);
    }
    for (const agent of this.agents.values()) {
      if (agent.name === agentIdOrName) return agent;
    }
    return undefined;
  }

  /**
   * Lista todos los agentes registrados.
   */
  public list(statusFilter?: AgentStatus): IAgent[] {
    const all = Array.from(this.agents.values());
    if (statusFilter) {
      return all.filter(a => a.status === statusFilter);
    }
    return all;
  }

  /**
   * Busca agentes por rol en tiempo O(1) gracias al indexado.
   */
  public getAgentsByRole(role: string): IAgent[] {
    const ids = this.roleIndex.get(role.toLowerCase());
    if (!ids) return [];
    return Array.from(ids).map(id => this.agents.get(id)!).filter(Boolean);
  }

  /**
   * Busca agentes por capacidad específica.
   */
  public getAgentsByCapability(capability: string): IAgent[] {
    const ids = this.capabilityIndex.get(capability.toLowerCase());
    if (!ids) return [];
    return Array.from(ids).map(id => this.agents.get(id)!).filter(Boolean);
  }

  /**
   * Ejecuta una tarea en un agente específico.
   */
  public async run(agentNameOrId: string, task: string, context?: Record<string, any>): Promise<AgentExecutionResult> {
    const agent = this.getAgent(agentNameOrId);

    if (!agent) {
      throw new Error(`[AgentManager] Error: Agente '${agentNameOrId}' no encontrado.`);
    }

    if (agent.status !== 'ACTIVE') {
      throw new Error(`[AgentManager] Error: El agente '${agent.name}' se encuentra en estado '${agent.status}'.`);
    }

    return await agent.execute(task, context);
  }

  /**
   * Retorna estadísticas del pool de agentes.
   */
  public getStats(): { total: number; active: number; paused: number; inactive: number; error: number } {
    const stats = { total: this.agents.size, active: 0, paused: 0, inactive: 0, error: 0 };
    for (const agent of this.agents.values()) {
      switch (agent.status) {
        case 'ACTIVE': stats.active++; break;
        case 'PAUSED': stats.paused++; break;
        case 'INACTIVE': stats.inactive++; break;
        case 'ERROR': stats.error++; break;
      }
    }
    return stats;
  }

  private indexAgent(agent: IAgent): void {
    // Indice de roles
    const roleKey = agent.role.toLowerCase();
    if (!this.roleIndex.has(roleKey)) {
      this.roleIndex.set(roleKey, new Set());
    }
    this.roleIndex.get(roleKey)!.add(agent.id);

    // Indice de capacidades
    for (const cap of agent.capabilities || []) {
      const capKey = cap.toLowerCase();
      if (!this.capabilityIndex.has(capKey)) {
        this.capabilityIndex.set(capKey, new Set());
      }
      this.capabilityIndex.get(capKey)!.add(agent.id);
    }
  }

  private deindexAgent(agent: IAgent): void {
    const roleKey = agent.role.toLowerCase();
    if (this.roleIndex.has(roleKey)) {
      this.roleIndex.get(roleKey)!.delete(agent.id);
    }
    for (const cap of agent.capabilities || []) {
      const capKey = cap.toLowerCase();
      if (this.capabilityIndex.has(capKey)) {
        this.capabilityIndex.get(capKey)!.delete(agent.id);
      }
    }
  }
}
