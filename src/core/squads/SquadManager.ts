import { IAgent, AgentExecutionResult } from "../types";

export type Permission = 'EXECUTE_TOOLS' | 'ACCESS_MEMORY' | 'ROUTE_MODELS' | 'MANAGE_AGENTS' | 'SYSTEM_ADMIN';

export interface Squad {
  id: string;
  name: string;
  leader: IAgent;
  members: IAgent[];
  permissions: Permission[];
  description: string;
}

/**
 * SquadManager - Gestión de Equipos de Agentes (Squads), Líderes y Permisos
 * Integra los Agentes Principales: Pedro (Líder Estratégico/CEO) y Trinnity (Líder Técnico/Architect).
 */
export class SquadManager {
  private squads: Map<string, Squad> = new Map();

  // Agentes Principales del Sistema
  public leaderPedro: IAgent;
  public leaderTrinnity: IAgent;

  constructor() {
    // Inicializar Agentes Principales Pedro y Trinnity
    this.leaderPedro = {
      id: "agent_pedro_leader",
      name: "Pedro",
      role: "CEO & Strategic Leader",
      status: "ACTIVE",
      description: "Agente principal de visión estratégica, gobernanza y toma de decisiones globales.",
      capabilities: ["strategic_planning", "squad_governance", "decision_making"],
      execute: async (task: string): Promise<AgentExecutionResult> => ({
        agentId: "agent_pedro_leader",
        agentName: "Pedro (CEO)",
        success: true,
        output: `[Pedro - Líder Estratégico]: Aprobada y dirigida la estrategia para: '${task}'`,
        executionTimeMs: 25
      })
    };

    this.leaderTrinnity = {
      id: "agent_trinnity_leader",
      name: "Trinnity",
      role: "Chief Architect & Technical Leader",
      status: "ACTIVE",
      description: "Agente principal de arquitectura técnica, orquestación de modelos y super-aprendizaje.",
      capabilities: ["system_architecture", "model_routing", "vector_learning"],
      execute: async (task: string): Promise<AgentExecutionResult> => ({
        agentId: "agent_trinnity_leader",
        agentName: "Trinnity (Architect)",
        success: true,
        output: `[Trinnity - Líder Técnico]: Diseñada y orquestada la ejecución técnica para: '${task}'`,
        executionTimeMs: 30
      })
    };

    this.initDefaultSquads();
  }

  private initDefaultSquads(): void {
    // Squad 1: Executive & Governance (Liderado por Pedro)
    this.createSquad({
      id: "squad_executive",
      name: "Executive & Governance Squad",
      leader: this.leaderPedro,
      members: [this.leaderPedro],
      permissions: ['EXECUTE_TOOLS', 'ACCESS_MEMORY', 'ROUTE_MODELS', 'MANAGE_AGENTS', 'SYSTEM_ADMIN'],
      description: "Squad responsable de las decisiones de alto nivel, visión estratégica y seguridad."
    });

    // Squad 2: Technical & Architecture (Liderado por Trinnity)
    this.createSquad({
      id: "squad_architecture",
      name: "Core Architecture & Engineering Squad",
      leader: this.leaderTrinnity,
      members: [this.leaderTrinnity],
      permissions: ['EXECUTE_TOOLS', 'ACCESS_MEMORY', 'ROUTE_MODELS'],
      description: "Squad encargado del desarrollo del sistema, ruteo de modelos y memoria de 50 años."
    });
  }

  public createSquad(squad: Squad): void {
    this.squads.set(squad.id, squad);
    console.log(`[SquadManager] Squad creado: '${squad.name}' (Líder: ${squad.leader.name})`);
  }

  public addMemberToSquad(squadId: string, agent: IAgent): boolean {
    const squad = this.squads.get(squadId);
    if (!squad) return false;

    if (!squad.members.some(m => m.id === agent.id)) {
      squad.members.push(agent);
      console.log(`[SquadManager] Agente '${agent.name}' añadido al Squad '${squad.name}'`);
    }
    return true;
  }

  public hasPermission(agentId: string, permission: Permission): boolean {
    for (const squad of this.squads.values()) {
      const isMember = squad.members.some(m => m.id === agentId) || squad.leader.id === agentId;
      if (isMember && squad.permissions.includes(permission)) {
        return true;
      }
    }
    return false;
  }

  public getSquads(): Squad[] {
    return Array.from(this.squads.values());
  }
}
