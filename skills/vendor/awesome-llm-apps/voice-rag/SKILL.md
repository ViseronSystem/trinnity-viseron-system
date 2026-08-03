---
name: voice-rag
description: Pregunta a tus documentos por voz. El comando de voz entra, se transcribe, pasa por RAG local y la respuesta sale por voz. Inspirado en el Voice RAG Agent de awesome-llm-apps.
license: Apache-2.0
source: awesome-llm-apps
steps: listen, transcribe, retrieve, speak
---

# Voice RAG Agent

Pregunta a tu base de conocimiento hablando.

## Pasos de ejecución

1. **Listen**: captura la voz del usuario (micrófono del navegador o app móvil).
2. **Transcribe**: convierte audio a texto (Web Speech API en navegador, o modelo whisper si está disponible).
3. **Retrieve**: busca en la base de conocimiento (RAG) la información relevante.
4. **Speak**: devuelve la respuesta de voz sintetizada (SpeechSynthesis) y por texto en el chat.

## Integración en TVS

- TVS ya tiene el `VoiceBridge` con socket.io y el comando `/api/voice/command`.
- **Comando CODE**: `create voice-rag <nombre>` y `run <agentId> Activa modo voz`.
- Los comandos de voz existentes (Pedro/Trinnity) se extienden con respuestas RAG.

## Verificación

- El comando de voz debe llegar al backend y responder en < 15 s.
- La respuesta debe usar conocimiento real de la base (no solo plantilla).
- Debe funcionar sin API keys (speech local del navegador).
