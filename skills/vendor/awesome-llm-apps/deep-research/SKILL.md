---
name: deep-research
description: Agente de investigacion profunda. Recopila, analiza y sintetiza informacion web sobre un tema y genera un reporte final estructurado con fuentes. Inspirado en el AI Deep Research Agent de awesome-llm-apps.
license: Apache-2.0
source: awesome-llm-apps
steps: plan, collect, analyze, report
---

# Deep Research Agent

Investigación profunda y autonoma sobre cualquier tema.

## Pasos de ejecución

1. **Plan**: define el alcance y sub-preguntas de la investigación.
2. **Collect**: usa el agente de búsqueda (websearch o scraping) para recopilar fuentes sobre cada sub-pregunta.
3. **Analyze**: sintetiza la información eliminando contradicciones y priorizando fuentes fiables.
4. **Report**: genera un reporte final en Markdown con secciones, conclusiones y citas de fuentes.

## Integración en TVS

- **Comando CODE**: `create deep-research <tema>` y después `run <agentId> Investiga <tema> y genera reporte con fuentes`.
- **Provider**: usa Ollama local (qwen2.5:3b) para el análisis y cloud (OpenAI/Claude) para síntesis de alto nivel.
- **Output**: reporte en `data/research/<slug>.md` si se pide persistencia.

## Verificación

- El reporte debe tener al menos 3 fuentes citadas.
- Debe responder a las sub-preguntas del plan.
- Tiempo objetivo: < 3 min por tema.
