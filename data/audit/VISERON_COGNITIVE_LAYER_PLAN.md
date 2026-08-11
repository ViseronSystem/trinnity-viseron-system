# VISERON COGNITIVE OPERATING LAYER — Plano Técnico

**Data:** 2026-08-11 · **Decisão:** `decision-cognitive-operating-layer`  
**Estado:** Plano — aguarda aprovação  
**Sistemas:** 0 (Telemetry) + 1-8 (Cognitive) = 9 sistemas

---

## SISTEMA 0: Cognitive Telemetry Layer

### Estado: PLANEJADO (hoje: PARCIAL — Agent Evidence existe mas isolado)

**Evidência do estado atual:**
- `agent-activity.jsonl`: regista task_started/completed/failed por agente
- `viseron-supervision.jsonl`: regista operações VISERON (speaker, intent, ok)
- `jarvis-memory.jsonl`: regista operações JARVIS (tool, detail, ok)
- `EventBus`: emite eventos mas sem tracing estruturado
- **Falta:** rastreabilidade ponta-a-ponta, trace_id, métricas de embeddings/retrieval

### Objetivo

Registar **TODA** atividade cognitiva com rastreabilidade completa. Cada operação que usa embeddings, RAG, GraphRAG, memory consolidation, ou voice deixa um rasto auditável.

### Plano

| Passo | Descrição | Esforço |
|-------|-----------|---------|
| 0.1 | Criar `src/omega/telemetry/CognitiveTrace.ts` — estrutura de dados imutável | 1h |
| 0.2 | Criar `src/omega/telemetry/TelemetryEngine.ts` — captura, persistence, query | 2h |
| 0.3 | Integrar com EventBus — subscribe a `cognitive:*` events | 30min |
| 0.4 | Integrar com KnowledgeArchive — cada trace gera registro SHA-256 | 1h |
| 0.5 | Integrar com Agent Evidence — link trace → agent activity | 30min |
| 0.6 | Criar API `GET /api/omega/telemetry/trace/:id` + `GET /api/omega/telemetry/search` | 1h |
| 0.7 | Dashboard no Command Center — Cognitive Trace Explorer | 2h |

### Estrutura do CognitiveTrace

```typescript
interface CognitiveTrace {
  traceId: string;              // "cog_<timestamp36>_<random8>"
  parentTraceId?: string;       // para operações aninhadas (RAG dentro de chat)
  timestamp: number;
  
  // Origem
  source: "voice" | "chat" | "rag" | "graphrag" | "consolidation" | "evolution" | "atlas";
  agentId?: string;
  sessionId?: string;
  
  // Input cognitivo
  input: {
    text?: string;              // query/pergunta/comando
    audioFile?: string;         // se voice input
    lang?: string;              // es/pt/en
    embeddingsModel?: string;   // "text-embedding-3-small" | "all-MiniLM-L6-v2"
  };
  
  // Processamento
  processing: {
    embeddingMs?: number;       // latência do embedding
    retrievalMs?: number;       // latência da busca
    retrievedChunks?: number;   // quantos chunks foram recuperados
    topScore?: number;          // score do chunk mais relevante
    rerankMs?: number;          // latência do rerank
    graphNodesVisited?: number; // nós percorridos no GraphRAG
    consolidationType?: string; // "semantic_dedup" | "summarize" | "insight"
  };
  
  // Resultado
  result: {
    success: boolean;
    output?: string;            // resposta gerada
    sources?: string[];         // fontes (documentos, chunks)
    modelUsed?: string;         // LLM usado para gerar resposta
    latencyMs: number;          // latência total
    tokensUsed?: number;        // tokens consumidos (input + output)
  };
  
  // Validação
  validation?: {
    status: "PASS" | "FAIL" | "RETRY" | "HUMAN";
    verifiedBy?: string;        // "TaskVerifier" | "human" | "auto"
    reasons: string[];
    evidence?: any;
  };
  
  // Aprendizado
  learning?: {
    newKnowledgeGenerated: boolean;
    knowledgeArchiveRef?: string;  // hash do registro no Archive
    performanceScoreDelta?: number; // mudança no score após esta operação
    insightsGenerated?: string[];
  };
}
```

### Fluxo de telemetria

```
Operação cognitiva (RAG query, voice command, etc.)
        │
        ▼
   CognitiveTrace criado (traceId único)
        │
        ▼
   EventBus.publish("cognitive:started", trace)
        │
        ▼
   [embedding] → trace.processing.embeddingMs
        │
        ▼
   [retrieval] → trace.processing.retrievalMs, topScore
        │
        ▼
   [generation] → trace.result.output, modelUsed, tokensUsed
        │
        ▼
   [validation] → trace.validation.status
        │
        ▼
   EventBus.publish("cognitive:completed", trace)
        │
        ▼
   KnowledgeArchive: arquivar trace (SHA-256)
        │
        ▼
   Agent Evidence: link trace → agent-activity.jsonl
        │
        ▼
   Evolution Loop: atualizar Performance Score
```

### APIs

```
GET  /api/omega/telemetry/trace/:traceId
→ CognitiveTrace completo

GET  /api/omega/telemetry/search?agentId=&source=rag&since=24h&limit=50
→ { total: 42, traces: [...] }

GET  /api/omega/telemetry/stats?since=7d
→ {
    totalTraces: 1543,
    bySource: { rag: 500, chat: 800, consolidation: 100, ... },
    avgLatencyMs: 1200,
    avgEmbeddingMs: 350,
    avgRetrievalMs: 200,
    successRate: 0.92,
    topQueries: [...],
    tokensConsumed: 450000
  }

GET  /api/omega/telemetry/insights?since=30d
→ {
    latencyTrend: "improving",     // ±10% nos últimos 7 dias
    successRateTrend: "stable",     // ±2%
    topFailingSource: "rag",       // source com menor successRate
    mostExpensiveOperation: "graphrag"  // maior avgLatencyMs
  }
```

### Integrações

| Sistema | Como integra |
|---------|-------------|
| **EventBus** | Publica `cognitive:started`, `cognitive:completed`, `cognitive:failed` |
| **KnowledgeArchive** | Cada trace completado → SHA-256 → `data/archive/cognitive/` |
| **Agent Evidence** | `trace.agentId` → link no `agent-activity.jsonl` |
| **Evolution Loop** | `trace.learning.performanceScoreDelta` → feedback para AutoEvolutionEngine |
| **Command Center** | Cognitive Trace Explorer — busca, filtro, timeline |

### Critério de sucesso

- Toda operação RAG/GraphRAG/voice/consolidation gera CognitiveTrace
- Traces são recuperáveis por traceId, agentId, source, timeframe
- Stats mostram métricas reais de latência, success rate, tokens
- Archive contém registos imutáveis de operações cognitivas
- Zero operações cognitivas sem rasto

---

## SISTEMA 1: Embeddings Reais

### Estado: PLANEJADO (hoje: PLACEHOLDER sin/cos)

**Evidência do estado atual:**
```typescript
// QdrantVectorStore.ts — vetores são sin/cos noise
// AutoEvolutionEngine.ts:310-321
vector[i] = Math.sin(i + this.evolutionCycle + wisdomScore) * 0.05;
```

### Plano

| Passo | Descrição | Esforço |
|-------|-----------|---------|
| 1.1 | Adicionar `text-embedding-3-small` (OpenAI) como provider primário | 1h |
| 1.2 | Adicionar `all-MiniLM-L6-v2` (local, via transformers.js) como fallback | 2h |
| 1.3 | Substituir `metricsToVector()` sin/cos por chamada ao embedding model | 30min |
| 1.4 | Migrar Qdrant collection para 384-dim (MiniLM) ou 1536-dim (OpenAI) | 30min |
| 1.5 | Re-indexar LTM existente (20K registos) com embeddings reais | 1h (batch) |

### APIs

```
POST /api/omega/memory/embed   → { text: "..." } → { vector: [...], model: "text-embedding-3-small" }
GET  /api/omega/memory/embed/status → { provider: "openai", model: "text-embedding-3-small", dim: 1536, fallback: "all-MiniLM-L6-v2" }
```

### Critério de sucesso
- `queryVector()` retorna resultados semanticamente relacionados (não aleatórios)
- Teste: "task queue" → resultados com "TaskQueue", "enqueue", "executor"
- Latência < 500ms (OpenAI) ou < 200ms (MiniLM local)

---

## SISTEMA 2: RAG Pipeline

### Estado: PLANEJADO (hoje: NÃO EXISTE)

**Evidência:** Zero código de chunking, retrieval, ou generation aumentada. A busca é keyword-based (TF-IDF no KB, linear scan no LTM).

### Plano

| Passo | Descrição | Esforço |
|-------|-----------|---------|
| 2.1 | Criar `src/core/memory/Chunker.ts` — sliding window 512 tokens, overlap 128 | 1h |
| 2.2 | Criar `src/core/memory/Retriever.ts` — query → embed → Qdrant search → top-K chunks | 1h |
| 2.3 | Criar `src/core/memory/Reranker.ts` — cross-encoder ou LLM rerank dos top-K | 1h |
| 2.4 | Criar `src/core/memory/RagPipeline.ts` — orquestra chunk → embed → retrieve → rerank → generate | 2h |
| 2.5 | Adicionar endpoint `POST /api/omega/memory/rag` | 30min |

### Pipeline

```
Query: "Como optimizar o TaskQueue?"
        │
        ▼
   Embed query → vector (1536-dim)
        │
        ▼
   Qdrant.searchSimilar(vector, topK=20)
        │
        ▼
   Reranker: cross-encoder score → top 5 chunks
        │
        ▼
   Build context: "Documento 1: ... Documento 2: ..."
        │
        ▼
   LLM.generate(prompt + context) → resposta com fontes
```

### API

```
POST /api/omega/memory/rag
Body: { "query": "Como optimizar o TaskQueue?", "topK": 20, "generate": true }
Response: {
  "answer": "O TaskQueue pode ser optimizado...",
  "sources": [
    { "chunk": "...", "score": 0.92, "source": "docs/ARCHITECTURE.md" },
    ...
  ],
  "model": "gpt-4o-mini",
  "latencyMs": 1200
}
```

### Critério de sucesso
- Resposta contém fontes (chunks originais)
- Fontes são semanticamente relevantes (não keyword match)
- Latência < 3s (end-to-end)

---

## SISTEMA 3: Memory Consolidation Engine

### Estado: PARCIAL (hoje: keyword-based STM→LTM)

**Evidência do estado atual:**
```typescript
// MemoryEngine.ts:518 — consolidateSTMtoLTM()
// Promove itens que aparecem em 3+ sessões ou >200 chars
// Keyword-level deduplication, sem compreensão semântica
```

### Plano

| Passo | Descrição | Esforço |
|-------|-----------|---------|
| 3.1 | Adicionar `semanticDeduplication()` — embed STM items → cosine similarity → merge similares | 2h |
| 3.2 | Adicionar `summarizeSession()` — LLM resume STM → LTM como conhecimento estruturado | 1h |
| 3.3 | Adicionar `extractInsights()` — pattern detection em STM clusters | 2h |
| 3.4 | Persistir KB a disco (atualmente RAM-only) | 1h |
| 3.5 | Adicionar `consolidationReport` ao cycle_N.json | 30min |

### Novo fluxo de consolidação

```
STM (200 items/session, 30min TTL)
        │
        ▼
  semanticDeduplication() — embed + cosine > 0.85 → merge
        │
        ▼
  extractInsights() — cluster por tópico, detectar padrões
        │
        ▼
  summarizeSession() — LLM resume → conhecimento estruturado
        │
        ▼
  LTM (persistente, com embeddings)
        │
        ▼
  KB (persistente, com embeddings)
```

### Critério de sucesso
- Consolidação produz conhecimento semanticamente agrupado (não keyword frequency)
- KB persiste entre restarts
- `consolidationReport` mostra insights reais (não templates)

---

## SISTEMA 4: GraphRAG

### Estado: PLANEJADO (hoje: NÃO EXISTE)

**Evidência:** KnowledgeGraph tem 963 entidades/960 relações, mas:
- Nós não têm embeddings
- Busca é substring match
- Sem busca híbrida graph+vector

### Plano

| Passo | Descrição | Esforço |
|-------|-----------|---------|
| 4.1 | Adicionar `entityEmbedding` a cada nó do KnowledgeGraph (title + properties → vector) | 1h |
| 4.2 | Adicionar `hybridSearch()` — combina graph traversal + vector similarity | 2h |
| 4.3 | Adicionar `subgraphRetrieve()` — a partir de uma entidade, expandir vizinhos + pontuar por relevância | 1h |
| 4.4 | Integrar com RAG pipeline: query → hybrid search → subgraph context → LLM | 1h |
| 4.5 | Adicionar endpoint `POST /api/omega/memory/graphrag` | 30min |

### Algoritmo

```
Query: "task optimization patterns"
        │
        ▼
   hybridSearch(query):
     vectorScore = cosine(queryEmbedding, entityEmbedding)
     graphScore = PageRank(entity) * relationWeight
     finalScore = 0.6 * vectorScore + 0.4 * graphScore
        │
        ▼
   subgraphRetrieve(topEntities):
     for each entity: expand neighbors (BFS depth=2)
     collect all connected entities + relations
        │
        ▼
   Build context: "Entity A relates to B via executed_by. Entity C..."
        │
        ▼
   LLM.generate(query + graphContext) → resposta com grafo
```

### API

```
POST /api/omega/memory/graphrag
Body: { "query": "task optimization", "expandDepth": 2 }
Response: {
  "answer": "...",
  "subgraph": {
    "entities": [...],
    "relations": [...]
  },
  "sources": [...]
}
```

### Critério de sucesso
- Busca retorna entidades semanticamente relacionadas (não substring match)
- Subgrafo mostra relações relevantes ao contexto da query
- Integrado com RAG para respostas com contexto de grafo

---

## SISTEMA 5: Evolution Loop (conectado ao KnowledgeArchive)

### Estado: PARCIAL (hoje: 6 engines desligadas do Archive)

**Evidência do estado atual:**
- AutoLearningEngine, HyperLearningEngine, AutoEvolutionEngine — todos COUNTER/LOGGER
- KnowledgeArchive existe mas nenhum engine o consulta
- Feedback loop não existe

### Plano

| Passo | Descrição | Esforço |
|-------|-----------|---------|
| 5.1 | `AutoLearningEngine`: antes de gerar "insight", consultar Archive por tasks similares | 1h |
| 5.2 | `HyperLearningEngine`: usar Performance Score real como métrica de "inteligência" | 30min |
| 5.3 | `AutoEvolutionEngine`: capabilities só podem ser functional (do registry) | 30min |
| 5.4 | Criar `EvolutionFeedbackLoop` — task result → agent score → capability adjustment → retry | 3h |
| 5.5 | Conectar todos os engines ao KnowledgeArchive: cada decisão é archived | 1h |

### Novo loop

```
Task executada (com agent evidence)
        │
        ▼
   Performance Score atualizado (AutoEvolutionEngine)
        │
        ▼
   KnowledgeArchive: registrar resultado
        │
        ▼
   EvolutionFeedbackLoop:
     if (score < threshold) → analisar Archive por padrão de falha
     if (padrão encontrado) → sugerir capability adjustment
     if (score > threshold) → registrar como "melhoria confirmada"
        │
        ▼
   Próximo ciclo: agente com capability ajustada (ou novo agente)
```

### Critério de sucesso
- Evolution Loop produz melhorias mensuráveis (Performance Score sobe)
- Archive é consultado ativamente (não é só depósito passivo)
- Feedback loop fecha: task → score → adjustment → nova task

---

## SISTEMA 6: Command Center 2.0

### Estado: PARCIAL (hoje: v1 — holograma parcial, 5/10 features)

**Evidência do estado atual:**
- Holograma: ✅ orbit, ✅ states, ✅ particles, ✅ labels
- Holograma: ❌ mouse rotation, ❌ click-to-dispatch, ❌ zoom, ❌ edges, ❌ fullscreen
- Voz: ⚠️ browser speechSynthesis (robótica)

### Plano

| Passo | Descrição | Esforço |
|-------|-----------|---------|
| 6.1 | Holograma interativo (mouse, clique, zoom, edges, fullscreen) — plano Phase 3.1 já existe | 2-3h |
| 6.2 | GraphRAG Explorer — painel visual de busca no KnowledgeGraph | 3h |
| 6.3 | RAG Console — input de pergunta → resposta com fontes no CC | 2h |
| 6.4 | Evolution Dashboard — Performance Scores, feedback loop status, archive timeline | 2h |
| 6.5 | Voice neural integration (quando Sistema 7 estiver pronto) | 1h |

### CC 2.0 Layout

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: VISERON COMMAND CENTER · COGNITIVE LAYER ACTIVE │
├──────────────────────────────────────────────────────────┤
│  🖥️ HOLOGRAMA 3D (interativo: mouse, clique, zoom)      │
│     Linhas de KnowledgeGraph entre agentes               │
├──────────────────────────────────────────────────────────┤
│  🎤 VOZ NEURAL · ⌨️ TERMINAL                             │
├──────────────────┬───────────────────────────────────────┤
│  KPI CARDS       │  RAG CONSOLE                          │
│  (métricas       │  "Pergunta algo ao VISERON..."        │
│   cognitivas)    │  → resposta com fontes                │
├──────────────────┼───────────────────────────────────────┤
│  AGENTES         │  EVOLUTION DASHBOARD                  │
│  (com perf       │  Scores · Loop status · Timeline      │
│   scores)        │                                       │
├──────────────────┴───────────────────────────────────────┤
│  LIVE ACTIVITY (SSE) · SUPERVISION AIOX                  │
└──────────────────────────────────────────────────────────┘
```

### Critério de sucesso
- Holograma: 5/5 interações funcionais
- RAG Console: pergunta → resposta com fontes em < 5s
- Evolution Dashboard: mostra scores reais, não fórmulas

---

## SISTEMA 7: Voz Neural Multimodal

### Estado: PARCIAL (hoje: browser speechSynthesis + Web Speech API)

**Evidência do estado atual:**
- TTS: browser `speechSynthesis` (voz robótica)
- STT: browser `SpeechRecognition` (Chrome/Edge only)
- ElevenLabs API key: presente no `.env` (comentada)
- Whisper: ferramenta CLI (`tvs_whisper`), não servidor

### Plano

| Passo | Descrição | Esforço |
|-------|-----------|---------|
| 7.1 | Ativar ElevenLabs TTS — `POST /api/voice/tts` → streaming de áudio | 2h |
| 7.2 | Criar `POST /api/voice/stt` — upload de áudio → Whisper (OpenAI API) → transcrição | 1h |
| 7.3 | Integrar TTS neural no Command Center (substituir speechSynthesis) | 30min |
| 7.4 | Substituir Web Speech STT por Whisper API (Chrome-only → universal) | 1h |
| 7.5 | Adicionar `VoiceSession` — estado da conversa por voz (contexto, idioma) | 1h |

### APIs

```
POST /api/voice/tts
Body: { "text": "Sistema online, Comandante.", "voice": "pedro"|"trinnity"|"stark" }
Response: audio/mpeg stream

POST /api/voice/stt
Body: multipart/form-data (audio file)
Response: { "text": "VISERON, qual é o estado do sistema?", "lang": "pt", "confidence": 0.95 }

GET /api/voice/status
Response: { "tts": { "provider": "elevenlabs", "voices": ["pedro","trinnity","stark"] }, "stt": { "provider": "whisper", "model": "whisper-1" } }
```

### Critério de sucesso
- Voz do VISERON indistinguível de voz humana
- STT funciona em Firefox, Safari, mobile
- Latência TTS < 2s, STT < 3s

---

## SISTEMA 8: ATLAS como Agente Operacional

### Estado: REAL (hoje: tutor funcional, 236 linhas, sem memory/evidence)

**Evidência do estado atual:**
- `EnglishTutorAgent` — 7-day plan, 5 modes, provider chain, voice
- Funciona sem AI (templateReply com fonética)
- Mas: sem conexão ao Agent Evidence, sem Performance Score, sem MemoryEngine próprio

### Plano

| Passo | Descrição | Esforço |
|-------|-----------|---------|
| 8.1 | Registrar ATLAS no AgentManager com capability `english_tutoring` | 30min |
| 8.2 | Conectar ATLAS ao Agent Evidence — cada lição gera `agent-activity.jsonl` | 30min |
| 8.3 | Adicionar `ATLASPerformanceScore` — progresso do aluno, lições completadas, evolução | 1h |
| 8.4 | Conectar ATLAS ao MemoryEngine — lembrar progresso do aluno entre sessões | 1h |
| 8.5 | Adicionar `GET /api/tutor/evidence?studentId=` | 30min |

### ATLAS Agent Card (visível no CC)

```
┌─────────────────────────────────┐
│  ATLAS — English Tutor          │
│  Status: ACTIVE                 │
│  Performance Score: 87.5        │
│  Students: 1 active             │
│  Lessons completed: 3/7         │
│  Evidence: 12 entries           │
│  [▶ Start Lesson]               │
└─────────────────────────────────┘
```

### Critério de sucesso
- ATLAS aparece na tabela de agentes com Performance Score
- Cada lição gera evidência no `agent-activity.jsonl`
- Progresso do aluno persiste entre sessões
- API evidence mostra histórico de lições

---

## 9. ORDEM DE IMPLEMENTAÇÃO

| # | Sistema | Prioridade | Esforço | Dependências |
|---|---------|-----------|---------|-------------|
| **0** | **Cognitive Telemetry** | **P0** | **8h** | **Nenhuma — pré-requisito de todos** |
| 1 | Embeddings Reais | P0 | 5h | Telemetry (#0) |
| 2 | RAG Pipeline | P0 | 5.5h | Embeddings (#1) + Telemetry (#0) |
| 3 | Voz Neural | P0 | 5.5h | Telemetry (#0) |
| 4 | Memory Consolidation | P1 | 6.5h | Embeddings (#1) + Telemetry (#0) |
| 5 | GraphRAG | P1 | 5.5h | Embeddings (#1) + RAG (#2) + Telemetry (#0) |
| 6 | Evolution Loop | P1 | 5h | Embeddings (#1) + Agent Evidence + Telemetry (#0) |
| 7 | Command Center 2.0 | P1 | 10h | Voz (#3) + RAG (#2) + GraphRAG (#5) + Telemetry (#0) |
| 8 | ATLAS Operacional | P2 | 3.5h | Agent Evidence + Telemetry (#0) |

**Total estimado:** ~54 horas de implementação.

---

## 10. IMPACTO ESPERADO

| Dimensão | Antes | Depois |
|----------|-------|--------|
| **Telemetria** | 3 JSONLs isolados, sem tracing | CognitiveTrace ponta-a-ponta, SHA-256 no Archive |
| **Busca** | Keyword-based (TF-IDF, substring) | Semântica (embeddings + cosine) |
| **Perguntas** | "Não sei" (sem RAG) | Resposta com fontes e contexto |
| **Voz** | Robótica (browser TTS) | Neural (ElevenLabs, indistinguível) |
| **Memória** | Acumula registos | Consolida semanticamente, extrai insights |
| **Conhecimento** | Pesquisa por substring no KG | GraphRAG: grafo + vetores |
| **Evolução** | Fórmulas e random | Feedback loop real com Archive |
| **Interface** | CC v1 (parcial) | CC 2.0 (completo, interativo, cognitivo) |
| **ATLAS** | Tutor isolado | Agente operacional com evidência e memória |
| **Observabilidade** | Fragmentada por sistema | Unificada — cada operação deixa rasto |

---

*Plano Cognitive Operating Layer — 2026-08-11.*  
*© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · TVS v5.0*
