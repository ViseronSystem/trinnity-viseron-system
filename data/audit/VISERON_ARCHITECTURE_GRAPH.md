# VISERON Architecture Graph — Dependências e Fluxo de Dados

**Data:** 2026-08-11  
**Fonte:** Graphify (4,278 nós / 8,275 arestas / 282 comunidades) + auditoria manual

---

## 1. GRAFO DE MÓDULOS PRINCIPAIS

```
                        ┌─────────────────┐
                        │  standalone-     │
                        │  server.ts (604) │
                        └────────┬────────┘
                                 │ mounts
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
     ┌────────────┐    ┌────────────┐    ┌────────────────┐
     │ OMEGA       │    │ Web Layer  │    │ Dashboard      │
     │ Gateway     │    │ Routers    │    │ Public (HTML)  │
     │ (50 routes) │    │ (~134)     │    │ (13 pages)     │
     └──────┬──────┘    └──────┬─────┘    └───────┬────────┘
            │                  │                   │
            ▼                  ▼                   ▼
     ┌──────────────────────────────────────────────────┐
     │              OMEGA PLATFORM (594)                 │
     │                                                   │
     │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
     │  │  Kernel  │  │Agent     │  │  Autonomy     │  │
     │  │  (275)   │  │Runtime   │  │  Layer (198)  │  │
     │  │          │  │(112)     │  │               │  │
     │  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
     │       │             │                │           │
     │  ┌────┴─────┐  ┌────┴─────┐  ┌───────┴───────┐  │
     │  │TaskQueue │  │SmartAgent│  │ AutonomyOS    │  │
     │  │(392)     │  │(207)     │  │ (248)         │  │
     │  └────┬─────┘  └────┬─────┘  └───────────────┘  │
     │       │             │                            │
     │  ┌────┴─────┐  ┌────┴──────────────────────┐    │
     │  │EventBus  │  │   ProviderFactory +       │    │
     │  │(215)     │  │   ModelRouter             │    │
     │  └────┬─────┘  └────────┬──────────────────┘    │
     │       │                 │                        │
     └───────┼─────────────────┼────────────────────────┘
             │                 │
    ┌────────┴────────┐   ┌───┴──────────────────┐
    │  EventBridge    │   │  MemoryEngine (781)  │
    │  (113)          │   │  STM → LTM → KB → V  │
    │                 │   │  + QdrantVectorStore │
    │  Socket.IO ◄────┤   │  + KnowledgeGraph    │
    │  SSE ◄──────────┤   │  + KnowledgeArchive  │
    └─────────────────┘   └──────────────────────┘
```

## 2. FLUXO DE DADOS (Task E2E)

```
POST /api/omega/tasks
        │
        ▼
  OmegaGateway (376)
        │
        ▼
  Kernel.runTask() ──► TaskQueue.enqueue()
        │                    │
        │              CREATED ──► task:created
        │                    │
        │              PLANNING ──► task:planned
        │                    │
        │              QUEUED ──► task:queued
        │                    │
        │              RUNNING ──► task:started
        │                    │
        ▼                    ▼
  AgentRegistry ──► SmartAgent.execute()
        │
        ▼
  ProviderFactory ──► Ollama / OpenAI / Claude / Gemini
        │
        ▼
  ToolManager ──► tool.called ──► tool.completed
        │
        ▼
  TaskVerifier ──► VERIFYING ──► verification:PASS/FAIL/RETRY/HUMAN
        │
        ▼
  COMPLETED ──► task:completed
        │
        ▼
  KnowledgeGraph ◄── entity + relation
  KnowledgeArchive ◄── SHA-256 record
  MemoryEngine.LTM ◄── memory:updated
```

## 3. DEPENDÊNCIAS ENTRE MÓDULOS

| Módulo | Depende de | É dependido por |
|--------|-----------|----------------|
| **Kernel** | EventBus, TaskQueue, Permissions | OmegaPlatform, Gateway |
| **TaskQueue** | EventBus, Verifier (opcional) | Kernel |
| **EventBus** | — (zero dependências) | TaskQueue, Kernel, EventBridge, AutonomyLayer, OmegaPlatform |
| **EventBridge** | EventBus | Gateway (SSE), standalone-server (Socket.IO) |
| **AgentRuntime** | SmartAgent, ProviderFactory | OmegaPlatform |
| **AutonomyLayer** | Kernel, EventBus | OmegaPlatform |
| **AutonomyOS** | — (zero dependências) | Kernel (via gate adapter) |
| **MemoryEngine** | QdrantVectorStore | OmegaPlatform, AutoLearningEngine |
| **KnowledgeGraph** | — | OmegaPlatform, MemoryEngine |
| **KnowledgeArchive** | EventBus, KnowledgeGraph | OmegaPlatform |
| **JarvisAgent** | ViseronModelRouter, MemoryEngine, ComposioBridge, RcsEngine | standalone-server, ViseronAgent |
| **ViseronAgent** | JarvisAgent, BibleGovernance | standalone-server |
| **Command Center** | OMEGA APIs, VISERON APIs, SSE, Web Speech API | — (cliente browser) |

## 4. MÓDULOS ÓRFÃOS (sem consumidores ativos)

| Módulo | Porquê órfão |
|--------|-------------|
| `src/agents/legacy/*` (CEOAgent, OpenCodeAgent, AgentFactory legacy) | Stubs nunca registados — código morto |
| `src/command-center/` (3 ficheiros) | Pasta legacy — CC real está em `src/dashboard/public/command-center.html` |
| `tools/viseron-game/` (7 ficheiros Python/DOS) | Jogo legacy — ativo está em `game/index.html` (Canvas 2D) |
| `core/` (2 ficheiros wrapper) | Wrappers que não são importados por ninguém |
| `packages/aiox-core/` | Pacote npm não publicado, sem consumidores |

## 5. DUPLICAÇÕES

| Componente | Localização 1 | Localização 2 | Qual é o real? |
|-----------|--------------|--------------|----------------|
| **AgentFactory** | `src/agents/factory/AgentFactory.ts` (28L, stub) | `src/core/agents/AgentFactory.ts` (179L, real) | Core |
| **CEOAgent** | `src/agents/CEOAgent.ts` (18L, stub) | `src/omega/agent-runtime/specs/ceo.agent.json` (spec) | Spec→SmartAgent |
| **AgentManager** referências | `src/core/AgentManager.ts` (212L) | `src/core/agents/AgentManager.ts` (duplicado?) | Verificar — possível duplicação |
| **dashboard/server.ts** vs **web/standalone-server.ts** | 2 servidores Express diferentes | Ambos servem as mesmas páginas | standalone-server.ts é o principal |

---

*Grafo de arquitetura gerado por auditoria — 2026-08-11.*
