---
name: rag-local
description: RAG (Retrieval-Augmented Generation) 100% local sin API keys. Qdrant/vector store en memoria + Ollama para preguntar sobre tus propios documentos (PDFs, Markdown, JSON). Inspirado en el Local RAG Agent de awesome-llm-apps.
license: Apache-2.0
source: awesome-llm-apps
steps: index, retrieve, generate
---

# Local RAG Agent

Pregunta a tus propios documentos con IA local, sin API keys.

## Pasos de ejecución

1. **Index**: carga documentos de `data/knowledge/`, `docs/` y `data/minds/` y genera embeddings (embeddings locales o hash-based si no hay modelo de embeddings).
2. **Retrieve**: para cada pregunta, busca los chunks más relevantes (búsqueda híbrida keyword + vectorial si está disponible).
3. **Generate**: el LLM local (qwen2.5:3b) responde usando solo el contexto recuperado, con citas al chunk de origen.

## Integración en TVS

- El `MemoryEngine` de TVS ya tiene el almacenamiento vectorial con fallback en memoria cuando Qdrant no está (ver `src/core/memory/MemoryEngine.ts`).
- **Comando CODE**: `create rag-local <nombre>` y luego `run <agentId> Pregunta: <tu pregunta>`.
- La base de conocimiento AIOX (50 años) está disponible como documentos iniciales.

## Verificación

- La respuesta debe citar el documento de origen.
- Si Qdrant está caído, usa el fallback en memoria (sin errores).
- Tiempo de respuesta objetivo: < 10 s con contexto local.
