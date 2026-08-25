# Demo Script — Trinnity Viseron System (4:00)

**Format:** Screen recording with narration. Open terminal + browser side-by-side.

---

## 0:00–0:15 — Hook & Introduction

**[SCREEN: Terminal showing `npm run start` booting]**

> "This is the Trinnity Viseron System — a production multi-agent operating system. In the next four minutes, I'll show you ten autonomous AI agents coordinating through an event-driven kernel, with persistent memory, task verification, ethical governance, and a natural language interface. Everything you see is real, running on Gemini Flash and Ollama locally."

---

## 0:15–0:50 — System Boot & Kernel Status

**[SCREEN: Terminal — run `npm run status:system` or open `/api/omega/tasks`]**

> "When the system boots, the OMEGA Kernel initializes first. It brings up the EventBus, TaskQueue, and Permissions system. Then the AgentActivationEngine loads all ten agents from their JSON specifications — each gets its own AI provider, memory directory, and autonomous cycle."

**[SCREEN: Browser — navigate to `localhost:32123/api/omega/tasks`]**

> "Here's the kernel status: the EventBus has emitted events, the TaskQueue shows task statistics with verified completion rates, and all agents are active. The verified task completion rate — tasks that passed verification — is our primary reliability metric."

**[SCREEN: Show the API response with agent count, task stats, verification stats]**

> "We have 10 active agents, a task queue with persistent state, and a verifier that checks every result before marking it complete."

---

## 0:50–1:30 — Agent Registry & Lifecycle

**[SCREEN: Browser — navigate to `localhost:32123/api/agents` or agent list endpoint]**

> "Each agent is defined by a specification file. The AgentActivationEngine reads these at startup, instantiates SmartAgent objects, and starts autonomous cycles. Watch — I'll talk to the CEO agent directly."

**[SCREEN: Terminal or browser — POST to agent chat endpoint]**

> "I'm sending a strategic question to the CEO agent. It routes through the ModelRouter, selects the best provider — in this case Gemini Flash — generates a response, stores it in the agent's persistent memory, and emits a task.completed event on the EventBus."

**[SCREEN: Show the response + memory file update]**

> "Notice the response includes the provider used, the agent's reasoning, and the memory entry was written to disk. This survives a restart."

**[SCREEN: Terminal — show `data/agents/ceo/memory.jsonl` with the new entry]**

---

## 1:30–2:15 — Task Pipeline & Verification

**[SCREEN: Browser — POST a task via `/api/omega/tasks`]**

> "Let me submit a task to the kernel. It enters as CREATED, moves to PLANNING, gets assigned to an agent, and enters the RUNNING state."

**[SCREEN: Show task state transitions via API]**

> "The agent executes the task through the AI provider chain. When it completes, the TaskVerifier runs its rules — checking that the result is non-empty, matches the expected schema, and passes invariants. Only tasks that pass verification are counted in our completion rate."

**[SCREEN: Show verification result — PASS with evidence]**

> "PASS — the result is verified. This task is now persisted in memory and the EventBus emitted task.completed for any downstream subscribers."

**[SCREEN: Show EventBus history — `/api/omega/events/history?topic=task.*`]**

> "The EventBus recorded every state transition with timestamps, source, and payload. This is full observability without any external monitoring tools."

---

## 2:15–2:50 — Memory & Governance

**[SCREEN: Browser — query memory via API or VISERON chat]**

> "TVS has four memory layers. Short-term memory handles session context. Long-term memory persists to disk with auto-backups. The knowledge base provides TF-IDF search. And the vector store enables semantic retrieval. Memory consolidation automatically promotes important short-term items to long-term storage."

**[SCREEN: Show memory stats via API]**

> "Every interaction is searchable across all four layers with unified search."

**[SCREEN: Browser — navigate to `/api/viseron/governance`]**

> "The governance layer enforces nine ethical principles programmatically. Watch — I'll try to execute an operation that would inflate numbers."

**[SCREEN: Show `assessOperation()` blocking an inflated claim]**

> "Blocked. The system detected a truth violation and returned the specific principle — Wisdom — with a reason. This is not documentation. This is code-level enforcement. The system literally cannot lie, hide fees, or leak secrets."

---

## 2:50–3:30 — Evolution Pipeline & Natural Language

**[SCREEN: Terminal — run `npm run vaec -- status`]**

> "The VAEC pipeline manages autonomous evolution. Every code change goes through IMPLEMENT, TEST, SYNC, BUILD, VERIFY, LEARN, and PROMOTE. If any gate fails — the system automatically rolls back."

**[SCREEN: Show recent VAEC journal entries]**

> "Here's the journal — three completed cycles, zero rollbacks. Each entry has the full evidence trail."

**[SCREEN: Browser — navigate to `/viseron` — the VISERON HUD]**

> "And finally, the natural language interface. The VISERON agent responds to voice commands and text queries. It can check system status, execute tasks, recall memory, and interact with all ten agents. Let me ask it what it knows about the system."

**[SCREEN: Type a query, show the response with voice synthesis]**

> "It identified the provider, the agents, the memory state, and returned a structured response — all through natural language."

---

## 3:30–4:00 — Summary & Impact

**[SCREEN: Terminal — show test results `npm run test`]**

> "374 tests passing across 8 test suites. This is not a demo — it's a production system."

**[SCREEN: Show architecture diagram or key stats]**

> "TVS gives you: ten autonomous agents with lifecycle management, an event-driven kernel with wildcard routing, four-layer persistent memory, end-to-end task verification, ethical governance as code, and a natural language interface. It runs on Gemini Flash, deploys to Cloud Run, and handles real customer traffic today."

> "Trinnity Viseron System — fortified enterprise fleet, production-ready."

**[END]**
