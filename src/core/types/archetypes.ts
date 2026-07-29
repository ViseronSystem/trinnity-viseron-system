export type AgentEra =
  | 'primordial' | 'ancient' | 'classical' | 'medieval' | 'renaissance'
  | 'industrial' | 'modern' | 'futuristic'
  | 'antichrist' | 'biblical' | 'mythological';

export interface AgentArchetype {
  id: string;
  name: string;
  era: AgentEra;
  origin: string;
  wisdom: number;
  specialties: string[];
  personality: string[];
  knowledge_areas: string[];
  symbol: string;
}

export interface AgentMind {
  archetype: AgentArchetype;
  knowledge_level: number;
  evolution_cycles: number;
  last_evolution: number;
  connections: string[];
}
