---
name: generative-ui
description: El agente genera/interactúa con interfaces interactivas (dashboards, kanban, componentes web) a partir de instrucciones en lenguaje natural. Inspirado en el AI Dashboard Canvas / Component Generator de awesome-llm-apps.
license: Apache-2.0
source: awesome-llm-apps
steps: spec, generate, render, validate
---

# Generative UI Agent

Interfaces generadas por instrucciones.

## Pasos de ejecución

1. **Spec**: recibe la descripción de la UI deseada (dashboard, kanban, tabla, formulario).
2. **Generate**: produce el HTML/CSS/JS autocontenido de la interfaz usando el LLM local.
3. **Render**: lo muestra en el navegador dentro de la ventana del dashboard (sandbox).
4. **Validate**: el usuario la evalúa; el agente itera hasta aprobar.

## Integración en TVS

- TVS ya genera apps completas con `WebAppGenerator`/`AppScaffolder`.
- **Comando CODE**: `create generative-ui <descripción>` y `run <agentId> Genera <UI>`.
- El resultado se guarda en `data/ui-gen/<slug>.html`.

## Verificación

- Debe generar HTML válido renderizable en el navegador.
- Debe respetar la paleta VISERON (neón cyan #00f0ff, violeta #bf5af2).
- El código generado no debe ejecutar nada externo (sandbox seguro).
