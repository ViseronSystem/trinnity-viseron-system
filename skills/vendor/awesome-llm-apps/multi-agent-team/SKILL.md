---
name: multi-agent-team
description: Equipo de agentes especialistas que planifican y ejecutan un proyecto juntos (orchestrator + workers). Inspirado en AI Services Agency / CrewAI del repo awesome-llm-apps.
license: Apache-2.0
source: awesome-llm-apps
steps: plan, assign, execute, review
---

# Multi-Agent Team

Un equipo de agentes especialistas colabora para entregar un proyecto.

## Pasos de ejecución

1. **Plan**: un agente líder (orchestrator) descompone el objetivo en tareas.
2. **Assign**: cada tarea se asigna al agente con mejores capacidades (el `CommandChain.autoDelegate` de TVS ya hace esto).
3. **Execute**: los workers ejecutan en paralelo o secuencial según dependencias.
4. **Review**: el líder revisa, consolida y entrega el resultado final.

## Integración en TVS

- TVS ya tiene `SquadManager` (Pedro lidera squad_executive, Trinnity squad_architecture) y `CommandChain.autoDelegate`.
- **Comando CODE**: `create multi-agent-team <objetivo>` para materializar el equipo y luego `run <leadId> <objetivo>`.
- Compatible con los 7 blueprints de AgentFactory (BizAnalyst, DataMind, FullStackForge, etc.).

## Verificación

- El equipo debe tener mínimo 3 roles distintos.
- Cada miembro recibe tareas coherentes con su rol.
- El resultado consolida las contribuciones de todos los miembros.
