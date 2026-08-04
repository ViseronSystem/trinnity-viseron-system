# TVS OMEGA PLATFORM — Migration Plan

> Transform TVS from a functional application into an autonomous enterprise
> intelligence platform. **No features on top of the old code. Build the spine
> first.** Do not remove working functionality — refactor progressively.

## 1. Where TVS is today (audit, 2026-08-04)

| Layer | What exists | Verdict |
|-------|-------------|---------|
| Runtime container | `ViseronCore` (src/core/ViseronCore.ts) composes every engine | De-facto kernel, not a formal one |
| Agent registry | `AgentManager` (Map + role/capability indexes) | Solid, but agents are object literals |
| Agent model | `IAgent` interface + one class `SmartAgent` | No `Agent` base, no manifest/spec |
| Memory | `MemoryEngine` STM/LTM/KB + soft Qdrant vectors | **No knowledge graph**; STM/KB not persisted |
| AI routing | TWO parallel stacks: `ModelRouter` + `AIProviderBridge` | Duplicated logic, must unify |
| Events | Only `memory:event` (zero subscribers); Socket.IO in web layer | **No central event bus** |
| Tasks | `TVSOrchestrator` (3 hardcoded subtasks) + `AutonomousPlanner` | No kernel-level task queue |
| Web | Dashboard `:3000` + ViseronWeb API `:32123` + ReportServer `:3001` | No API gateway for the platform |
| UI | Landing + OS desktop (`webos.js`) | No Command Center (enterprise ops view) |
| Tests | 14 core + 66–74 web + 9 hyper + 15 aiox (custom assert runner) | Pass, not CI-integrated for hyper/aiox |
| Infra | Render auto-deploy, Vercel static (NS never switched), Docker | Domain + gateway missing |

## 2. Target architecture — TVS OMEGA PLATFORM

```
                        TVS OMEGA PLATFORM
        (Autonomous Intelligence Operating System)

  ┌──────────────────────────────────────────────────────┐
  │  COMMAND CENTER   (enterprise operations console)    │
  │  SYSTEM STATUS · ACTIVE AGENTS · AUTOMATIONS ·       │
  │  PROJECTS · PROCESSES · AI ACTIONS · LIVE METRICS    │
  └───────────────┬──────────────────────────────────────┘
                  │  /api/gateway/*
  ┌───────────────▼──────────────────────────────────────┐
  │  API GATEWAY      (unified entry: auth, rate, audit) │
  └───────────────┬──────────────────────────────────────┘
  ┌───────────────▼──────────────────────────────────────┐
  │  TVS KERNEL                                          │
  │  EventBus · TaskQueue · Permissions · Config · Bus   │
  └───────┬───────────────┬───────────────┬──────────────┘
          │               │               │
  ┌───────▼───────┐ ┌─────▼──────┐ ┌──────▼────────┐
  │ AGENT RUNTIME │ │ MEMORY     │ │  AI ROUTER    │
  │ spec-driven   │ │ ENGINE     │ │ task→model    │
  │ 10 core agents│ │ STM+LTM+   │ │ local→cloud   │
  │ + 5000 minds  │ │ KG+Vector  │ │ fallback      │
  └───────┬───────┘ └─────┬──────┘ └──────┬────────┘
          │               │               │
  ┌───────▼───────────────▼───────────────▼──────────┐
  │  AUTONOMY LAYER (planner · evolution · learning)  │
  │  FACTORY (business plan → app) · SALES · CRM ·    │
  │  MARKETING · FINANCE · LEGAL · SUPPORT            │
  └──────────────────────┬───────────────────────────┘
                         │
  ┌──────────────────────▼───────────────────────────┐
  │  INTEGRATIONS: Ollama · OmniRoute · n8n · Qdrant │
  │  OpenJarvis · ASNO · CallSystem · Twilio · GitHub│
  └──────────────────────────────────────────────────┘
```

## 3. The spine — 10 build units (in dependency order)

| # | Unit | Module | Deliverable | Status |
|---|------|--------|-------------|--------|
| 1 | **TVS Kernel** | `src/omega/kernel/` | EventBus (typed pub-sub), TaskQueue, Permissions (RBAC), Kernel facade | ✅ |
| 2 | **Agent Runtime** | `src/omega/agent-runtime/` | `AgentSpec` (zod manifest), runtime that materializes real agents, 10 core agent specs | ✅ |
| 3 | **Memory Engine** | `src/omega/memory-engine/` | Knowledge Graph (entities/relations, persisted), wired to MemoryEngine | ✅ |
| 4 | **AI Router** | `src/omega/ai-router/` | Unified task→model router + local→cloud fallback chain over existing providers | ✅ |
| 5 | **Command Center** | `src/dashboard/public/command-center.html` | Enterprise operations console fed by `/api/omega/*` | ✅ |
| 6 | **API Gateway** | `src/omega/gateway/` | `/api/omega/*` endpoints exposing kernel/runtime/memory/router/status | ✅ |
| 7 | **Autonomy Layer** | `src/omega/autonomy/` | Bridge to planner/evolution/learning (progressive) | ⏳ Phase 2 |
| 8 | **Factory** | `src/omega/factory/` | Business plan → architecture → app → deploy pipeline | ⏳ Phase 3 |
| 9 | **Enterprise modules** | `src/omega/enterprise/` | sales, crm, marketing, finance, legal, support agents | ⏳ Phase 3 |
| 10 | **Production infra** | CI/CD, Docker, domain | Formalize + wire `ForgeServer`, gateway routing | ⏳ Phase 4 |

## 4. Progressive migration rules

1. **Never delete a working module.** New layers wrap/adapt existing engines.
2. `ViseronCore` remains the composition root; the Kernel is added as the spine and exposed via `tvs.omega`.
3. Existing `AgentManager` stays the registry; the Runtime adds spec-driven materialization on top.
4. `ModelRouter` + `AIProviderBridge` are unified behind `AIRouter` (adapter, not rewrite).
5. Each unit ships with tests in `tests/omega.test.ts` and is wired into `npm test`.
6. Every change passes `npm run build` + `npm run lint` before commit.

## 5. Success criteria — what "platform" means here

- [x] A kernel with events, tasks, permissions (not just method calls).
- [x] Agents defined by a schema (id/role/permissions/memory/tools/objectives/metrics), not anonymous objects.
- [x] Memory with a knowledge graph, not just key-value stores.
- [x] One AI router that picks the model for the task and falls back local→cloud.
- [x] A Command Center that shows the platform live (real metrics).
- [ ] Marketplace architecture (Phase 2).
- [ ] SDK published (Phase 2).
- [ ] Real domain/gateway (Phase 4 — requires owner to switch NS).
