# TVS Architecture — Mermaid Diagrams

## System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        UI["Web Dashboard<br/>/viseron /atlas /game"]
        API["REST API<br/>50+ endpoints"]
        VOICE["Voice Interface<br/>Web Speech STT/TTS"]
    end

    subgraph "OMEGA Kernel"
        KERNEL["Kernel<br/>src/omega/kernel/Kernel.ts"]
        EB["EventBus<br/>Wildcard pub/sub"]
        TQ["TaskQueue<br/>9-state pipeline"]
        PERM["Permissions<br/>RBAC 7 roles"]
        VER["TaskVerifier<br/>Rule-based verification"]
    end

    subgraph "Agent Fleet"
        AE["AgentActivationEngine<br/>Lifecycle management"]
        CEO["CEO Agent"]
        CTO["CTO Agent"]
        DEV["Developer Agent"]
        FIN["Finance Agent"]
        RES["Research Agent"]
        SALES["Sales Agent"]
        SEC["Security Agent"]
        SUP["Support Agent"]
        VIS["Vision Agent"]
        OPS["DevOps Agent"]
    end

    subgraph "Memory System"
        MEM["MemoryEngine<br/>4-layer memory"]
        STM["STM<br/>Session, 30min TTL"]
        LTM["LTM<br/>Persistent KV + full-text"]
        KB["Knowledge Base<br/>TF-IDF search"]
        VEC["Vector Store<br/>Qdrant embeddings"]
        GR["GraphRAG<br/>Knowledge graph"]
    end

    subgraph "AI Providers"
        ROUTER["ModelRouter<br/>Cost/quality/latency"]
        GEMINI["Gemini Flash<br/>generativelanguage.googleapis.com"]
        OLLAMA["Ollama<br/>Local qwen2.5:3b"]
        OPENAI["OpenAI<br/>GPT-4o"]
        CLOUD["Claude / Grok / OmniRoute"]
    end

    subgraph "Governance"
        GOV["Bible Governance<br/>9 ethical principles"]
        ASSO["assessOperation()<br/>Regex-based blocking"]
    end

    subgraph "Evolution"
        VAEC["VaecOrchestrator<br/>7-stage promotion gate"]
        JOURNAL["vaec-journal.jsonl<br/>Persistent audit log"]
    end

    subgraph "Google Cloud"
        CR["Cloud Run<br/>Container deployment"]
        CSQL["Cloud SQL<br/>PostgreSQL"]
        FS["Firestore<br/>Agent memory backup"]
    end

    subgraph "External Services"
        GMAIL["Gmail API<br/>OAuth2"]
        TWILIO["Twilio<br/>RCS/SMS/Telephony"]
        COMP["Composio MCP<br/>31+ SaaS integrations"]
        STRIPE["Avirato / Stripe<br/>Payments"]
    end

    UI --> API
    VOICE --> API
    API --> KERNEL

    KERNEL --> EB
    KERNEL --> TQ
    KERNEL --> PERM
    KERNEL --> VER

    KERNEL --> AE
    AE --> CEO & CTO & DEV & FIN & RES & SALES & SEC & SUP & VIS & OPS

    AE --> MEM
    MEM --> STM & LTM & KB & VEC & GR

    AE --> ROUTER
    ROUTER --> GEMINI & OLLAMA & OPENAI & CLOUD

    KERNEL --> GOV
    GOV --> ASSO

    KERNEL --> VAEC
    VAEC --> JOURNAL

    CR --> API
    CSQL --> MEM
    FS --> MEM

    API --> GMAIL & TWILIO & COMP & STRIPE

    style KERNEL fill:#1a1a2e,stroke:#e94560,color:#fff
    style EB fill:#16213e,stroke:#0f3460,color:#fff
    style TQ fill:#16213e,stroke:#0f3460,color:#fff
    style GOV fill:#533483,stroke:#e94560,color:#fff
    style VAEC fill:#533483,stroke:#e94560,color:#fff
    style GEMINI fill:#4285f4,stroke:#34a853,color:#fff
```

## Task Execution Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Kernel
    participant Permissions
    participant Governance
    participant AgentActivation
    participant SmartAgent
    participant AIProvider
    participant Verifier
    participant Memory
    participant EventBus

    User->>API: POST /api/omega/tasks
    API->>Kernel: createTask()
    Kernel->>EventBus: emit(task.created)
    EventBus-->>Kernel: subscribers notified

    Kernel->>Kernel: TaskQueue.enqueue()
    Kernel->>Kernel: TaskQueue.assignToAgent()
    
    Kernel->>Permissions: check(actor, task.permission)
    Permissions-->>Kernel: allowed

    Kernel->>Governance: assessOperation(task)
    Governance-->>Kernel: { allowed: true }

    Kernel->>AgentActivation: executeTask(agentId, task)
    AgentActivation->>SmartAgent: execute(prompt)
    SmartAgent->>AIProvider: complete(request)
    
    alt Gemini selected
        AIProvider->>AIProvider: generativelanguage.googleapis.com
    else Ollama selected
        AIProvider->>AIProvider: localhost:11434
    end
    
    AIProvider-->>SmartAgent: response
    SmartAgent-->>AgentActivation: result
    AgentActivation-->>Kernel: output

    Kernel->>Verifier: verify(task, result)
    Verifier-->>Kernel: { status: "PASS", evidence: [...] }

    Kernel->>Memory: setLongTerm(key, result)
    Kernel->>EventBus: emit(task.completed)
    Kernel->>Kernel: TaskQueue.complete()
    API-->>User: { task, verification: "PASS" }
```

## Memory Consolidation Cycle

```mermaid
graph LR
    subgraph "Short-Term Memory"
        S1["Session interaction"]
        S2["Recent context"]
        S3["Active task state"]
    end

    subgraph "Consolidation Engine"
        C["MemoryConsolidation<br/>Auto STM→LTM<br/>Every 5 seconds"]
    end

    subgraph "Long-Term Memory"
        L1["Key-value store<br/>Persistent to disk"]
        L2["Full-text index"]
        L3["Auto-backup (5 files)"]
    end

    subgraph "Knowledge Base"
        K1["Documents<br/>TF-IDF indexed"]
        K2["RAG Pipeline"]
    end

    subgraph "Vector Store"
        V1["Embeddings<br/>Qdrant"]
        V2["Semantic search"]
    end

    subgraph "Knowledge Graph"
        G1["GraphRAG<br/>Entity relations"]
        G2["Path queries"]
    end

    S1 & S2 & S3 -->|30min TTL / 200 items max| C
    C -->|promote| L1
    C -->|index| L2
    L1 --> L3
    L1 --> K1
    K1 --> K2
    K1 --> V1
    V1 --> V2
    K1 --> G1
    G1 --> G2
```

## VAEC Evolution Pipeline

```mermaid
stateDiagram-v2
    [*] --> IDLE

    IDLE --> IMPLEMENT: vaec run --desc "..."
    IMPLEMENT --> TEST: commit created
    TEST --> SYNC: npm run test (374/374)
    SYNC --> BUILD: git pull --ff-only
    BUILD --> VERIFY: npm run build (tsc)
    VERIFY --> LEARN: system health OK
    LEARN --> PROMOTE: best practices recorded
    PROMOTE --> COMPLETED: final audit

    TEST --> ROLLBACK: test failure
    SYNC --> ROLLBACK: sync conflict
    BUILD --> ROLLBACK: build error
    VERIFY --> ROLLBACK: health check fail
    LEARN --> HOLD: learning deferred

    ROLLBACK --> IDLE: git reset --hard + rebuild
    HOLD --> IDLE: manual resume
    COMPLETED --> IDLE: cycle done

    note right of ROLLBACK
        Automatic rollback to
        last known-good ref
        All events logged to
        vaec-journal.jsonl
    end note
```

## Deployment Architecture (Cloud Run)

```mermaid
graph TB
    subgraph "Google Cloud"
        CR["Cloud Run<br/>node:20-slim container<br/>Port $PORT"]
        CSQL["Cloud SQL<br/>PostgreSQL 15<br/>DATABASE_URL"]
        FS["Firestore<br/>Agent memory backup"]
        GG["Google Gemini API<br/>GEMINI_API_KEY"]
    end

    subgraph "TVS Container"
        EXPRESS["Express Server<br/>standalone-server.ts"]
        OMEGA["OMEGA Kernel<br/>EventBus + TaskQueue"]
        AGENTS["10 AI Agents<br/>SmartAgent instances"]
        MEM["Memory Engine<br/>STM/LTM/KB/Vector"]
        GOV["Governance<br/>9 principles"]
    end

    subgraph "External"
        GMAIL["Gmail OAuth"]
        TWILIO["Twilio API"]
        COMP["Composio MCP"]
        STRIPE["Payments"]
    end

    CR --> EXPRESS
    EXPRESS --> OMEGA
    OMEGA --> AGENTS
    AGENTS --> MEM
    MEM --> CSQL
    MEM --> FS
    AGENTS --> GG
    EXPRESS --> GMAIL & TWILIO & COMP & STRIPE

    style CR fill:#4285f4,stroke:#34a853,color:#fff
    style GG fill:#4285f4,stroke:#ea4335,color:#fff
    style CSQL fill:#4285f4,stroke:#fbbc04,color:#fff
```

## Component Dependency Map

```mermaid
graph TD
    ViseronCore --> Orchestrator
    ViseronCore --> AgentManager
    ViseronCore --> ModelRouter
    ViseronCore --> MemoryEngine
    ViseronCore --> ToolManager
    ViseronCore --> ProviderFactory
    ViseronCore --> SquadManager
    ViseronCore --> ComposioBridge
    ViseronCore --> SkillExecutor

    Orchestrator --> SmartAgent
    AgentManager --> SmartAgent
    SmartAgent --> ProviderFactory
    SmartAgent --> ModelRouter

    ModelRouter --> GeminiProvider
    ModelRouter --> OpenAIProvider
    ModelRouter --> OllamaProvider
    ModelRouter --> ClaudeProvider
    ModelRouter --> GrokProvider

    MemoryEngine --> QdrantVectorStore
    MemoryEngine --> MemoryConsolidation
    MemoryEngine --> ExperienceStore

    Kernel --> EventBus
    Kernel --> TaskQueue
    Kernel --> Permissions
    Kernel --> TaskVerifier

    AgentActivationEngine --> SmartAgent
    AgentActivationEngine --> ProviderFactory

    VaecOrchestrator --> EventBus
    VaecOrchestrator --> Kernel

    ViseronWebServer --> ViseronCore
    ViseronWebServer --> Kernel
    ViseronWebServer --> AgentActivationEngine

    style ViseronCore fill:#e94560,color:#fff
    style Kernel fill:#1a1a2e,stroke:#e94560,color:#fff
    style MemoryEngine fill:#533483,color:#fff
```
