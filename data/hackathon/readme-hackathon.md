# Trinnity Viseron System (TVS)

**Multi-Agent Operating System with Kernel, Persistent Memory, and Ethical Governance**

[![Tests](https://img.shields.io/badge/tests-374%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)]()
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)]()
[![Gemini](https://img.shields.io/badge/AI-Gemini%20Flash-4285f4)]()

## Quick Start

### Prerequisites

- Node.js 20+
- npm 9+
- Git

### 1. Clone and Install

```bash
git clone https://github.com/pedrocv1981/trinnity-viseron-system.git
cd trinnity-viseron-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
# Gemini (required for hackathon)
GEMINI_API_KEY=your_gemini_api_key_here

# Local AI (optional, free)
OLLAMA_BASE_URL=http://localhost:11434

# Database (optional — defaults to JSON files)
DATABASE_URL=postgresql://user:pass@host:5432/tvs

# Auth
TVS_JWT_SECRET=your_random_secret_here
```

### 3. Build and Start

```bash
npm run build
npm start
```

The server starts on port 32123. Open `http://localhost:32123` in your browser.

### 4. Run Tests

```bash
npm test
```

All 374 tests should pass.

## Docker Deployment (Cloud Run)

```bash
# Build the container
docker build -t tvs .

# Run locally
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key tvs

# Deploy to Cloud Run
gcloud run deploy tvs --source . --port 8080 --allow-unauthenticated --memory 2Gi --cpu 2
```

## What's Inside

### OMEGA Kernel (`src/omega/kernel/`)

The central runtime coordinating all agents:

- **EventBus**: Wildcard topic routing (`task.*` matches `task.completed`), isolated error handling, ring-buffer history
- **TaskQueue**: 9-state pipeline with priority, persistence, and automatic recovery after restart
- **Permissions**: RBAC with 7 roles controlling access to agents, tasks, memory, and events
- **Kernel**: Orchestrates the full lifecycle — autonomy gate → permission check → execution → verification → memory write → event emission

### 10 Autonomous Agents (`src/omega/activation/`)

| Agent | Role | What It Does |
|-------|------|-------------|
| CEO | Strategic Leader | High-level decisions, vision, governance |
| CTO | Technical Leader | Architecture, model orchestration, technical excellence |
| Developer | Code Expert | Full-stack code generation, debugging, optimization |
| Finance | Financial Analyst | Budgets, projections, cost analysis, billing |
| Research | Knowledge Gatherer | Web research, data synthesis, report generation |
| Sales | Lead Qualifier | Lead scoring, outreach, pipeline management |
| Security | CyberSentinel | Vulnerability scanning, audit, compliance |
| Support | Customer Service | Ticket handling, knowledge base, escalation |
| Vision | Computer Vision | Image analysis, visual data processing |
| DevOps | Operations | Deployment, monitoring, infrastructure |

Each agent runs on an autonomous cycle (configurable interval), has isolated persistent memory, and uses the ModelRouter to select the optimal AI provider.

### Memory System (`src/core/memory/`)

Four-layer memory architecture:

```
┌─────────────────────────────────────────┐
│  Short-Term Memory (STM)                │
│  Session-scoped, 200 items, 30min TTL   │
├─────────────────────────────────────────┤
│  Long-Term Memory (LTM)                 │
│  Persistent KV, full-text index,        │
│  auto-backup (5 files)                  │
├─────────────────────────────────────────┤
│  Knowledge Base (KB)                    │
│  Documents with TF-IDF relevance        │
├─────────────────────────────────────────┤
│  Vector Store (Qdrant)                  │
│  Semantic embeddings, retrieval,        │
│  reranking                              │
└─────────────────────────────────────────┘
```

Plus: `MemoryConsolidation` (automatic STM→LTM promotion), `GraphRAG` (graph-based retrieval), `ExperienceStore` (learning from outcomes).

### Governance (`src/core/governance/bible.ts`)

Nine ethical principles enforced as code:

1. **Wisdom** — Consider consequences before acting
2. **Truth** — Never lie, inflate, or deceive
3. **Stewardship** — Protect resources, secrets, and data
4. **Justice** — Fair pricing, no hidden fees
5. **Service** — The system serves users, not the reverse
6. **Diligence** — Execute with excellence, verify before publish
7. **Humility** — Admit limits, ask when uncertain
8. **Generosity** — Deliver more value than expected
9. **Faithfulness** — Deliver what you promise, when you promise

The `assessOperation()` function blocks fraud, deception, data leaks, and exploitation at the code level.

### Evolution Pipeline (`src/omega/evolution/`)

VAEC (VISERON Autonomous Evolution & Continuity):

```
IMPLEMENT → TEST → SYNC → BUILD → VERIFY → LEARN → PROMOTE
    ↓ any failure → ROLLBACK (auto git reset + rebuild)
```

Every cycle is journalized. Gates execute real commands (`npm run test`, `git pull --ff-only`, `npm run build`).

### Natural Language Interface

- **JARVIS** (`/jarvis`): Conversational agent with intent classification, tool execution, memory recall
- **VISERON** (`/viseron`): Voice-enabled HUD with wake word detection, continuous listening
- **ATLAS** (`/atlas`): Personalized English tutor with 7-day learning plans

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | System health check |
| `GET /api/omega/tasks` | Task queue statistics + verification rate |
| `POST /api/omega/tasks` | Submit a new task |
| `GET /api/omega/tasks/:id` | Task detail with full audit trail |
| `GET /api/omega/events` | EventBus SSE stream |
| `GET /api/omega/events/history` | EventBus event history |
| `GET /api/agents` | List all active agents |
| `POST /api/agents/:id/chat` | Chat with a specific agent |
| `GET /api/viseron/governance` | Governance status + principles |
| `POST /api/jarvis/chat` | Natural language interface |
| `GET /api/tutor/plan` | ATLAS daily learning plan |

## Project Structure

```
src/
├── core/
│   ├── agents/          # SmartAgent, AgentFactory, AgentSpawner
│   ├── governance/      # Bible principles, operation assessment
│   ├── memory/          # MemoryEngine (STM/LTM/KB/Vector/Graph)
│   ├── model-router/    # Multi-provider AI routing
│   ├── providers/       # Gemini, OpenAI, Claude, Grok, Ollama
│   ├── tools/           # ToolManager
│   ├── skills/          # SkillsRegistry, SkillPipeline
│   ├── composio/        # ComposioBridge (31+ SaaS integrations)
│   └── ViseronCore.ts   # Core orchestrator
├── omega/
│   ├── kernel/          # EventBus, TaskQueue, Permissions, Kernel
│   ├── activation/      # AgentActivationEngine
│   ├── evolution/       # VaecOrchestrator
│   ├── verifier/        # TaskVerifier, composite verifier
│   ├── memory-engine/   # KnowledgeGraph
│   ├── benchmark/       # AutonomyBenchmark
│   └── gateway.ts       # OMEGA platform gateway
├── web/
│   ├── standalone-server.ts  # Express server (50+ routes)
│   ├── viseron/         # VISERON agent + HUD
│   ├── jarvis/          # JARVIS agent
│   ├── tutor/           # ATLAS tutor
│   └── auth/            # JWT auth, rate limiting, Postgres
└── os/                  # TVS OS (processes, filesystem, store)
```

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/omega/kernel/EventBus.ts` | 215 | Event bus with wildcards and ring buffer |
| `src/omega/kernel/TaskQueue.ts` | 397 | Persistent task queue with 9 states |
| `src/omega/kernel/Kernel.ts` | 275 | Central kernel orchestrating all components |
| `src/omega/activation/AgentActivationEngine.ts` | 286 | Agent lifecycle and autonomous cycles |
| `src/omega/evolution/VaecOrchestrator.ts` | 429 | Evolution pipeline with 7 gates |
| `src/core/memory/MemoryEngine.ts` | 792 | Four-layer memory system |
| `src/core/governance/bible.ts` | 175 | Ethical governance enforcement |
| `src/core/model-router/ModelRouter.ts` | 224 | Multi-provider AI routing |
| `src/web/standalone-server.ts` | 673 | Express server with 50+ routes |

## Testing

```bash
npm test          # Run all 374 tests
npm run test:core # Core tests only
npm run test:web  # Web layer tests only
```

Test suites cover: kernel components, memory system, agent lifecycle, task verification, evolution pipeline, EventBus, permissions, web API, auth, billing, messaging, and more.

## License

Proprietary — Pedro Costa & Trinnity Hurtado. Built for the All Things Agentic Hackathon.
