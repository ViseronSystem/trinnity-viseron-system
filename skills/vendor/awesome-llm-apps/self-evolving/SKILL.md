---
name: self-evolving
description: El agente reescribe y mejora sus propios prompts/workflows basándose en los resultados de ejecuciones anteriores. Inspirado en el AI Self-Evolving Agent (EvoAgentX) de awesome-llm-apps.
license: Apache-2.0
source: awesome-llm-apps
steps: execute, evaluate, rewrite, retest
---

# Self-Evolving Agent

El agente mejora a sí mismo con cada ejecución.

## Pasos de ejecución

1. **Execute**: el agente ejecuta una tarea con su prompt actual.
2. **Evaluate**: mide la calidad del resultado (contra criterios definidos por Pedro/Trinnity).
3. **Rewrite**: si la calidad es baja, el agente propone una nueva versión de su system prompt añadiendo lo aprendido.
4. **Retest**: vuelve a ejecutar y compara; solo acepta el cambio si mejora el resultado.

## Integración en TVS

- Se apoya en el `AutoLearningEngine` de TVS (ciclo cada 15 min) y en la memoria `AIOX_EXPERIENCE`.
- **Comando CODE**: `create self-evolving <rol>` y `run <agentId> <tarea>`; el prompt se refina entre ejecuciones.
- Documenta cada evolución en `data/minds/evolution.json`.

## Verificación

- La versión N+1 del prompt debe ser distinta de la N cuando hubo error.
- No debe degradar la calidad respecto a la versión anterior.
- El historial de evoluciones queda registrado.
