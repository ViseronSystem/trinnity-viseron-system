import { IAgent, AgentExecutionResult } from "../types";
import { AgentManager } from "../AgentManager";
import { ProviderFactory } from "../providers/ProviderFactory";

export interface CollaborationSession {
  id: string;
  task: string;
  participants: string[];
  messages: CollaborationMessage[];
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt: number;
  completedAt?: number;
  summary?: string;
}

export interface CollaborationMessage {
  from: string;
  to: string;
  content: string;
  timestamp: number;
  type: 'proposal' | 'review' | 'approval' | 'revision' | 'completion';
}

/**
 * AgentCollaborator - Sistema de Colaboración Multi-Agente
 * 
 * Permite que los agentes se comuniquen entre sí, deleguen tareas,
 * revisen el trabajo de otros y colaboren en soluciones complejas.
 * 
 * Flujo típico:
 * 1. Un agente líder (Pedro/Trinnity) define el plan
 * 2. Delega a agentes especializados
 * 3. Los agentes ejecutan y reportan
 * 4. El líder revisa, aprueba o solicita revisiones
 * 5. Se genera un resumen final de la colaboración
 */
export class AgentCollaborator {
  private agentManager: AgentManager;
  private providerFactory: ProviderFactory;
  private sessions: Map<string, CollaborationSession> = new Map();

  constructor(agentManager: AgentManager, providerFactory: ProviderFactory) {
    this.agentManager = agentManager;
    this.providerFactory = providerFactory;
  }

  /**
   * Inicia una sesión de colaboración multi-agente para una tarea.
   */
  public async startCollaboration(
    task: string,
    leaderId: string,
    participantRoles: string[],
    context?: Record<string, any>
  ): Promise<CollaborationSession> {
    const sessionId = `collab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const session: CollaborationSession = {
      id: sessionId,
      task,
      participants: [leaderId],
      messages: [],
      status: 'IN_PROGRESS',
      startedAt: Date.now()
    };

    this.sessions.set(sessionId, session);

    console.log(`\n[AgentCollaborator] Sesión de colaboración iniciada (ID: ${sessionId})`);
    console.log(`[AgentCollaborator] Tarea: "${task.substring(0, 100)}..."`);
    console.log(`[AgentCollaborator] Líder: ${leaderId}`);

    // Fase 1: El líder analiza y descompone la tarea
    const leader = this.agentManager.getAgent(leaderId);
    if (!leader) {
      session.status = 'FAILED';
      return session;
    }

    const planResult = await leader.execute(
      `[PLANIFICACIÓN] Como líder de equipo, descompón esta tarea en pasos y asigna roles: "${task}". 
       Define qué agentes especializados deben participar basado en: ${participantRoles.join(', ')}.
       Proporciona un plan detallado de ejecución.`,
      { ...context, sessionId, role: 'leader' }
    );

    session.messages.push({
      from: leaderId,
      to: 'all',
      content: planResult.output,
      timestamp: Date.now(),
      type: 'proposal'
    });

    // Fase 2: Agentes especializados ejecutan subtareas
    for (const role of participantRoles) {
      const agents = this.agentManager.getAgentsByRole(role);
      const agent = agents.find(a => a.status === 'ACTIVE' && a.id !== leaderId);

      if (agent) {
        session.participants.push(agent.id);

        const agentResult = await agent.execute(
          `[EJECUCIÓN] Como especialista en ${role}, ejecuta tu parte del plan para: "${task}".
           Contexto del líder: ${planResult.output.substring(0, 500)}.
           Proporciona tu análisis completo, código, diseño o recomendaciones.`,
          { ...context, sessionId, leaderPlan: planResult.output }
        );

        session.messages.push({
          from: agent.id,
          to: leaderId,
          content: agentResult.output,
          timestamp: Date.now(),
          type: 'proposal'
        });
      }
    }

    // Fase 3: El líder sintetiza y cierra
    const allOutputs = session.messages
      .filter(m => m.type === 'proposal' && m.from !== leaderId)
      .map(m => `[${m.from}]: ${m.content.substring(0, 300)}`)
      .join('\n\n');

    const summaryResult = await leader.execute(
      `[SÍNTESIS] Como líder del equipo, sintetiza todos los aportes de los especialistas 
       y genera un resumen ejecutivo completo de la solución para: "${task}".
       
       Aportes de los especialistas:
       ${allOutputs || "No hubo aportes de especialistas adicionales."}
       
       Tu plan inicial era:
       ${planResult.output.substring(0, 300)}
       
       Genera un informe final con: resumen ejecutivo, decisiones tomadas, 
       componentes creados y próximos pasos.`,
      { ...context, sessionId }
    );

    session.messages.push({
      from: leaderId,
      to: 'all',
      content: summaryResult.output,
      timestamp: Date.now(),
      type: 'completion'
    });

    session.status = 'COMPLETED';
    session.completedAt = Date.now();
    session.summary = summaryResult.output;

    const duration = ((session.completedAt - session.startedAt) / 1000).toFixed(1);
    console.log(`\n[AgentCollaborator] Colaboración COMPLETADA en ${duration}s`);
    console.log(`[AgentCollaborator] Participantes: ${session.participants.length} agentes`);
    console.log(`[AgentCollaborator] Mensajes intercambiados: ${session.messages.length}`);

    return session;
  }

  /**
   * Obtiene una sesión de colaboración por ID.
   */
  public getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Lista todas las sesiones de colaboración.
   */
  public getSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }
}
