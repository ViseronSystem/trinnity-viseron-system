# Trinnity Viseron System — All Things Agentic Hackathon Submission

**Track:** The Fortified Enterprise Fleet

## What It Is

Trinnity Viseron System (TVS) is a production multi-agent operating system built in TypeScript/Node.js. It coordinates 10+ autonomous AI agents through a custom kernel with an event bus, persistent memory across four layers, task verification pipelines, ethical governance, and a natural-language interface. It runs today on a Windows server, handles real API traffic (billing, email, RCS messaging, CRM), and can be containerized for Cloud Run deployment.

This is not a prototype. It is 7,000+ lines of tested production code (374 passing tests across 8 test suites) that has been running continuously since August 2026.

## The Problem

Enterprise agent frameworks today force a choice: either deploy individual agents with no shared infrastructure, or build custom orchestration from scratch. Neither option gives you a registry with lifecycle management, cross-agent communication with wildcard routing, persistent memory that survives restarts, end-to-end task verification, or ethical guardrails baked into the execution path.

TVS solves this by treating agents as first-class citizens of an operating system — not scripts scheduled by cron.

## What We Built

### OMEGA Kernel (`src/omega/kernel/`)

The core runtime that coordinates everything:

- **EventBus** (`EventBus.ts`): Topic-based pub/sub with wildcard matching (`task.*` matches `task.completed`), source filtering, retry policies, ring-buffer history (500 events), and isolated error handling (one failing handler never breaks others). 215 lines, zero external dependencies.
- **TaskQueue** (`TaskQueue.ts`): 9-state pipeline (CREATED → PLANNING → QUEUED → RUNNING → VERIFYING → COMPLETED + FAILED/RECOVERING/CANCELLED). Persistent to disk — pending tasks survive restarts and resume via RECOVERING. Priority levels (critical/high/normal/low). 397 lines.
- **Permissions** (`Permissions.ts`): RBAC with 7 roles (root, commander, queen, admin, operator, agent, viewer, autonomy). Each role has scoped permission patterns (`agents.*`, `tasks.create`, `memory.read`). Every tool execution passes through the permission gate. 94 lines.
- **Kernel** (`Kernel.ts`): Ties everything together. Accepts adapters for agent registry, memory, tools, AI routing, and an autonomy gate. Every tool call goes through: autonomy assessment → permission check → execution → verification → memory write → event emission. 275 lines.

### Agent Activation Engine (`src/omega/activation/AgentActivationEngine.ts`)

Loads agent specifications from JSON files, instantiates SmartAgent instances with their own AI provider, memory directory, and autonomous cycle timer. Each agent runs independently — if one errors, it auto-recovers to idle for the next cycle. The engine exposes `chat()`, `executeTask()`, and `startAutonomyCycle()` APIs.

10 agents are defined with distinct roles: CEO (strategic decisions), CTO (architecture), Developer (code generation), Finance (financial analysis), Research (knowledge gathering), Sales (lead qualification), Security (vulnerability scanning), Support (customer service), Vision (computer vision tasks), DevOps (deployment and monitoring).

### Persistent Memory System (`src/core/memory/`)

Four-layer memory that survives restarts:

- **Short-Term Memory (STM)**: Per-session, in-memory, 200 items max, 30-minute TTL with LRU eviction.
- **Long-Term Memory (LTM)**: Key-value store with debounced disk persistence, auto-backups (5 files), and full-text index for search.
- **Knowledge Base**: Documents with TF-IDF relevance scoring.
- **Vector Store** (`QdrantVectorStore.ts`): Embeddings via configurable provider, with retrieval and reranking.

Plus `MemoryConsolidation.ts` for automatic STM→LTM promotion, `GraphRAG.ts` for graph-based retrieval, and `ExperienceStore.ts` for learning from execution outcomes. 792 lines in MemoryEngine alone.

### Governance Layer (`src/core/governance/bible.ts`)

Nine ethical principles (Wisdom, Truth, Stewardship, Justice, Service, Diligence, Humility, Generosity, Faithfulness) enforced programmatically. The `assessOperation()` function blocks operations that match fraud patterns, hidden fees, data leaks, or exploitation — returning a verdict with the specific principle violated.

This is not decorative. Every operation in the VISERON agent passes through governance checks before execution. The system explicitly cannot lie, inflate numbers, hide fees, or leak secrets — the regex patterns in `assessOperation()` are the hard guardrails.

### Evolution Pipeline (`src/omega/evolution/VaecOrchestrator.ts`)

VAEC (VISERON Autonomous Evolution & Continuity) enforces a 7-stage promotion gate: IMPLEMENT → TEST → SYNC → BUILD → VERIFY → LEARN → PROMOTE. If any gate fails, the system automatically rolls back to the last known-good state. Every cycle is journalized to `data/state/vaec-journal.jsonl` and events are published to the EventBus.

The production runners execute real commands: `npm run test` (374 tests), `git pull --ff-only`, `npm run build` (TypeScript compilation), system health checks. No mock gates.

### Task Verification (`src/omega/verifier/TaskVerifier.ts`)

Configurable verification rules per task type. Built-in rules: `hasResult`, `resultTruthy`, `outputNonEmpty`, `schemaRule`, `invariantRule`. Each task gets a verification verdict (PASS/FAIL/RETRY/HUMAN) with evidence. The Verified Task Completion Rate (`verified / total`) is the primary metric exposed at `/api/omega/tasks`.

### Natural Language Interface

- **JARVIS** (`src/web/jarvis/agent.ts`): Conversational agent with intent classification, tool execution, and memory recall. Handles queries like "what have you done?", "check billing status", "generate a report".
- **VISERON** (`src/web/viseron/agent.ts`): Voice-enabled superintelligence layer with HUD interface, wake word detection, and continuous learning supervision.
- **ATLAS** (`src/web/tutor/agent.ts`): English tutor with personalized 7-day plans.

All three share the same AI provider chain and memory infrastructure.

### Multi-Provider AI Router (`src/core/model-router/ModelRouter.ts`)

Routes tasks to the optimal AI provider based on task type, cost, latency, quality, and privacy requirements. Providers: Ollama (local, free), Gemini, OpenAI, Claude, Grok, OmniRoute (290+ providers). Gemini is already integrated via `GeminiProvider.ts` using the Generative Language API with API key authentication.

### Web Server & API (`src/web/standalone-server.ts`)

Express-based server exposing 50+ REST endpoints across: auth (JWT + rate limiting), billing (Avirato/Stripe), messaging (E2E encrypted), email (Gmail OAuth), RCS (Twilio branded messaging), CRM, agency management, telephony, site generation, app scaffolding, and the full OMEGA API (`/api/omega/*`). Socket.IO for real-time events. 673 lines.

## How Gemini Is Used

- **GeminiProvider** (`src/core/providers/GeminiProvider.ts`): Direct integration with `generativelanguage.googleapis.com/v1beta/models` using Gemini 3.5 Flash. Registered in the provider chain and routed to for code, research, reasoning, and general tasks.
- **Model Router**: Gemini competes with other providers on quality score, cost ($0.002/1k tokens), and latency. The router selects it automatically when it wins the routing criteria.
- **All 10 agents** can use Gemini as their backend — the `SmartAgentConfig` accepts a `preferredProvider` that defaults to the best available.

## How Google Cloud Infrastructure Is Used

For hackathon deployment, TVS runs on Cloud Run:

- **Cloud Run**: Containerized Node.js server (Dockerfile based on `node:20-slim`). The standalone server listens on the port specified by `PORT` env var. Health check at `/api/health`. All 50+ endpoints become available immediately.
- **Cloud SQL (PostgreSQL)**: The auth system (`src/web/auth/pg-store.ts`) and database layer (`src/web/db/index.ts`) already support Postgres via `DATABASE_URL`. Cloud SQL provides managed persistence for user accounts, billing records, and usage events.
- **Firestore**: The knowledge base and agent memory directories (`data/agents/*/memory.jsonl`) can be backed by Firestore for cloud-native persistence without the local filesystem.

## Data Sources

- **Local filesystem**: Agent memory, task logs, billing records, knowledge documents, supervision logs.
- **PostgreSQL** (optional): User accounts, billing, usage events (10 tables migrated).
- **External APIs**: Gmail (OAuth), Twilio (RCS/SMS), Composio (MCP bridge to 31+ SaaS apps), Avirato/Stripe (payments).
- **AI providers**: Ollama (local), Gemini, OpenAI, Claude, Grok, OmniRoute.

## Findings

After building and running TVS for production use, several architectural patterns proved essential:

1. **Isolation prevents cascading failures.** The EventBus handler isolation (errors published to `eventbus.handler.error` without breaking other handlers) saved the system from multiple potential outage scenarios during autonomous cycles.

2. **Persistent task queues survive restarts.** The RECOVERING state in TaskQueue — where interrupted tasks are automatically resumed — proved critical. Without it, every restart lost in-progress work.

3. **Verification before promotion is non-negotiable.** The VAEC pipeline caught 3 regressions during development that would have reached production. The automated rollback on gate failure is the safety net that makes autonomous evolution practical.

4. **Governance as code, not documentation.** The regex-based operation blocking in `assessOperation()` is more effective than any policy document. The system literally cannot execute operations that match fraud/exploitation patterns.

5. **Local-first with cloud fallback.** Running Ollama locally for routine tasks and falling back to Gemini/cloud only for complex reasoning keeps costs near zero for 95% of operations while maintaining capability for the hard 5%.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + TypeScript |
| Web | Express + Socket.IO |
| AI | Gemini, OpenAI, Claude, Grok, Ollama, OmniRoute |
| Memory | Custom STM/LTM/KB + Qdrant vectors + Knowledge Graph |
| Database | PostgreSQL (Cloud SQL) |
| Messaging | Twilio (RCS/SMS), Gmail OAuth |
| Payments | Avirato, Stripe |
| Container | Docker → Cloud Run |
| Tests | 374 tests across 8 suites |

## Team

Built by Pedro Costa (Comandante) and Trinnity Hurtado (Rainha) — a two-person team that designed, implemented, and operates TVS as a production system serving real customers.
