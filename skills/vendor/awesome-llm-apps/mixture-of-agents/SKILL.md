---
name: mixture-of-agents
description: Varios modelos LLM responden a la misma tarea y un agregador elige/mezcla la mejor respuesta. Usa Ollama local + cloud en fallback. Inspirado en el Mixture of Agents de awesome-llm-apps.
license: Apache-2.0
source: awesome-llm-apps
steps: generate, aggregate, select
---

# Mixture of Agents

Responde con la sabiduría combinada de varios modelos.

## Pasos de ejecución

1. **Generate**: lanza la misma tarea en 2-3 modelos (ej. qwen2.5:3b local, OpenAI, Claude según disponibilidad).
2. **Aggregate**: recoge todas las respuestas en paralelo.
3. **Select**: un LLM agregador (preferentemente cloud) compara las respuestas, detecta la más completa y precisa, o combina lo mejor de cada una.

## Integración en TVS

- El `ModelRouter` de TVS ya hace routing entre providers con fallback en cadena.
- **Comando CODE**: `create mixture-of-agents <nombre>` y luego `run <agentId> <tarea>`.
- Ideal para decisiones de arquitectura, revisión de código y análisis crítico.

## Verificación

- Debe devolver 2+ respuestas candidatas.
- La respuesta final debe ser la mejor valorada (no la primera).
- Si solo hay un modelo disponible, degrada a respuesta única sin error.
