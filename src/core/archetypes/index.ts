import { AgentArchetype, AgentEra } from '../types/archetypes';
import { archetypes } from './registry';

export { AgentArchetype, AgentEra } from '../types/archetypes';
export { archetypes } from './registry';

export function getArchetypesByEra(era: AgentEra): AgentArchetype[] {
  return archetypes.filter(a => a.era === era);
}

export function getArchetypeById(id: string): AgentArchetype | undefined {
  return archetypes.find(a => a.id === id);
}

export function searchArchetypes(query: string): AgentArchetype[] {
  const q = query.toLowerCase();
  return archetypes.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.id.includes(q) ||
    a.specialties.some(s => s.toLowerCase().includes(q)) ||
    a.knowledge_areas.some(k => k.toLowerCase().includes(q)) ||
    a.era.includes(q)
  );
}

export function getAllArchetypes(): AgentArchetype[] {
  return [...archetypes];
}
