# Building a Production Multi-Agent OS: Lessons from the Trinnity Viseron System

*How we built 10 autonomous AI agents that coordinate through an event-driven kernel with persistent memory, task verification, and ethical governance — and why "agent as first-class citizen" changes everything.*

---

## The Starting Point

Most multi-agent systems today are orchestration scripts. You define a few agents, wire them together with prompt chains, and hope nothing breaks when one of them hallucinates. We wanted something different: an operating system where agents are first-class citizens with lifecycle management, isolated memory, verified task execution, and ethical guardrails that are enforced in code, not just documented.

The Trinnity Viseron System (TVS) started as a single conversational agent and grew into a full multi-agent operating system. Here's what we learned building it.

## Architecture: The Kernel Pattern

The key insight was borrowing from OS design. Instead of an orchestrator that calls agents sequentially, we built a kernel that agents communicate through asynchronously.

**EventBus** is the backbone. It's a topic-based pub/sub system with wildcard matching — `task.*` subscribes to `task.completed`, `task.failed`, and any sub-topic. Handlers are isolated: if one subscriber throws, the error is captured in `eventbus.handler.error` and every other handler keeps running. We added a ring buffer (500 events) so new subscribers get recent history automatically.

```typescript
// EventBus wildcard matching
topicMatches("task.*", "task.completed")     // true
topicMatches("task.*", "task.failed.retry")  // true
topicMatches("*", "memory:event")            // true
topicMatches("memory.*", "tool.called")      // false
```

**TaskQueue** manages the lifecycle. Nine states: CREATED → PLANNING → QUEUED → RUNNING → VERIFYING → COMPLETED (plus FAILED, RECOVERING, CANCELLED). The critical feature: the queue is **persistent**. Tasks survive restarts. When the system boots, RECOVERING tasks are automatically resumed. Without this, every restart lost in-progress work — and in a system that evolves autonomously, restarts happen.

**Permissions** enforce RBAC at the kernel level. Seven roles (root, commander, queen, admin, operator, agent, viewer) with scoped permission patterns. Every tool execution passes through the permission gate. Agents can only read their own memory. The CEO agent can't write to the DevOps agent's task queue. These aren't suggestions — they're enforced in `Kernel.executeTool()`.

## The Agent Activation Problem

The hardest part wasn't building agents — it was managing their lifecycle. Each agent needs:

1. Its own AI provider configuration
2. Isolated persistent memory
3. An autonomous cycle timer
4. Health monitoring and auto-recovery

The `AgentActivationEngine` solves this by loading agent specifications from JSON files at startup. Each spec defines the agent's role, capabilities, preferred provider, and system prompt. The engine instantiates a `SmartAgent` for each, creates a memory directory, and starts the autonomous cycle.

The auto-recovery is simple but effective: if an agent errors during its autonomous cycle, it's set back to `idle` status. The next cycle timer fires and tries again. No crash recovery needed — the agent just becomes available again.

```typescript
// Autonomous cycle with auto-recovery
startAutonomyCycle(agentId: string, intervalMs = 120_000): void {
  const timer = setInterval(async () => {
    if (ag.status !== "idle") return; // skip if busy
    try {
      const task = this.generateAutonomousTask(ag);
      const result = await ag.instance.execute(task);
      // ... record success
    } catch (err) {
      ag.status = "idle"; // auto-recover
    }
  }, intervalMs);
}
```

## Four-Layer Memory

We tried single-layer memory and it failed. Short-term context gets lost. Long-term storage is too slow for real-time. Vector search alone misses exact matches.

The solution: four layers, each doing what it does best.

- **STM**: In-memory per session, 200 items max, 30-minute TTL with LRU eviction. Fast reads, automatic cleanup.
- **LTM**: Persistent key-value store with debounced disk writes, auto-backups, and a full-text index. Survives restarts.
- **Knowledge Base**: Documents indexed by TF-IDF relevance. Good for structured knowledge.
- **Vector Store**: Qdrant-backed embeddings for semantic search. "Find me similar past decisions" works here.

`MemoryConsolidation` runs every 5 seconds and promotes important STM items to LTM based on relevance scores. This is how the system "remembers" important interactions across sessions.

## Governance as Code

We implemented nine ethical principles (Wisdom, Truth, Stewardship, Justice, Service, Diligence, Humility, Generosity, Faithfulness) — not as documentation, but as regex-based operation blocking.

```typescript
export function assessOperation(op: { kind: string; detail: string }): GovernanceVerdict {
  const d = op.detail.toLowerCase();
  
  if (/(mentir|enganar|fals[eo]|fraude|inflar|manipular)/.test(d)) {
    return { allowed: false, principle: "verdade", 
             reason: "The system never lies or manipulates data." };
  }
  if (/(taxa escondida|cobrar.*sem entregar)/.test(d)) {
    return { allowed: false, principle: "justica", 
             reason: "Pricing must be fair and transparent." };
  }
  // ... more blocks
  
  return { allowed: true, principle: "sabedoria", 
           reason: "Operation consistent with governance principles." };
}
```

This is not a safety theatre. Every operation in the VISERON agent passes through `assessOperation()` before execution. The system literally cannot execute operations that match fraud, deception, or exploitation patterns. It's the same principle as Google's Model Armor — guardrails enforced at the infrastructure level, not the prompt level.

## The Verification Gap

The biggest lesson: agents that verify their own work are unreliable. The `TaskVerifier` runs independently after execution, checking configurable rules per task type.

Built-in rules: `hasResult`, `resultTruthy`, `outputNonEmpty`, `schemaRule`, `invariantRule`. Each rule returns PASS or FAIL with evidence. The **Verified Task Completion Rate** (`verified / total`) is the metric we track — not just "did it complete" but "did the result actually work."

The VAEC (VISERON Autonomous Evolution & Continuity) pipeline takes this further. Every code change goes through 7 gates: IMPLEMENT → TEST → SYNC → BUILD → VERIFY → LEARN → PROMOTE. The gates run real commands — `npm run test` (374 tests), `git pull --ff-only`, `npm run build`. If any gate fails, the system automatically rolls back to the last known-good state. The journal at `data/state/vaec-journal.jsonl` records every cycle with full evidence.

This caught 3 regressions during development that would have reached production.

## What Gemini Changed

When we added Gemini Flash to the provider chain, two things improved immediately:

1. **Cost**: Gemini's pricing made running 10 autonomous agents economically viable. At $0.002/1k tokens, each agent's weekly autonomous cycle costs less than a cent.
2. **Speed**: Flash's latency meant agents could complete autonomous tasks in seconds, not minutes. The 120-second autonomous cycle became practical.

The `ModelRouter` selects providers automatically based on task type, cost, latency, and quality. Gemini wins for most code and research tasks. Ollama handles routine operations locally for free.

## Results

After 3 weeks of continuous operation:

- **374 tests passing** across 8 test suites
- **10 agents** running autonomous cycles with zero unhandled crashes
- **~0 false positives** in governance blocking (the regex patterns are specific enough)
- **100% task recovery** after intentional restarts (RECOVERING state works)
- **3 VAEC rollbacks** caught during development (all automated)

The system handles real traffic: billing via Avirato, Gmail integration, RCS messaging via Twilio, CRM operations, and 50+ API endpoints.

## What's Next

The TVS is production-ready for single-server deployment. The next step is horizontal scaling: multiple Cloud Run instances with a shared Cloud SQL backend, distributed EventBus across instances, and a task queue that distributes across workers.

We're also exploring the "Autonomous Company" pattern — where the 10 agents not only execute tasks but plan, verify, and report on their own work with minimal human oversight. The kernel architecture makes this possible: the EventBus provides observability, the TaskQueue provides persistence, the Verifier provides reliability, and the Governance layer provides safety.

---

*Built by Pedro Costa & Trinnity Hurtado. Full source: [github.com/pedrocv1981/trinnity-viseron-system](https://github.com/pedrocv1981/trinnity-viseron-system)*
