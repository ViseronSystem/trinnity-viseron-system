---
name: always-on-briefing
description: Agente en segundo plano que vigila fuentes (web, email, metrics, blog) y entrega un brief periódico por email. Inspirado en el Always-On HN Briefing / Release Radar de awesome-llm-apps.
license: Apache-2.0
source: awesome-llm-apps
steps: schedule, monitor, summarize, deliver
---

# Always-On Briefing Agent

Vigilancia y entrega proactiva de resúmenes.

## Pasos de ejecución

1. **Schedule**: define la frecuencia (diaria a las 08:00 por defecto, configurable).
2. **Monitor**: vigila las fuentes configuradas (web, RSS, email Gmail, métricas del sistema, blog).
3. **Summarize**: sintetiza lo relevante con el LLM local.
4. **Deliver**: entrega el brief por email (usando el servicio de email Gmail ya conectado en TVS) y lo publica en el blog.

## Integración en TVS

- TVS ya tiene email Gmail real configurado (`npm run demo:email` 9/9) y el `ContentAgent` para blog.
- **Comando CODE**: `create always-on-briefing <fuente>` y `run <agentId> Configura briefing diario`.
- El horario se guarda en `data/briefings/config.json`.

## Verificación

- Debe generar un brief con los 3 puntos más relevantes de las fuentes.
- Debe enviar por email usando Gmail (no mock).
- Debe resistir fallos de una fuente sin detener el resto.
