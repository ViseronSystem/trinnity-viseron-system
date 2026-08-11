# VISERON REALITY HARDENING — Plano Técnico de Correção

**Data:** 2026-08-11  
**Base:** Deep Audit `e0f0986`  
**Estado:** Plano — aguarda aprovação  
**Regra:** Não implementar ainda. Plano técnico somente.

---

## SISTEMA 1: IntelligenceLevel Real

### Problema
```typescript
// HyperLearningEngine.ts:115
this.intelligenceLevel = Math.min(this.intelligenceLevel * 1.05, 1_000_000);
```
Isto é juro composto. Começa em 1000, cresce 5% por ciclo, capped em 1M. Aos 146 ciclos (~73 horas) atinge o cap. Não mede nada real.

### Correção

**Fase 1A — Renomear a métrica atual (sem quebrar nada):**

| Antes | Depois |
|-------|--------|
| `intelligenceLevel` | `learningCycleCounter` |

A variável continua a existir, o ficheiro `cycle_N.json` continua a ser escrito. Mas o campo chama-se pelo que é: um contador de ciclos.

**Fase 1B — Adicionar métrica real ao lado:**

Nova estrutura no `cycle_N.json`:
```json
{
  "cycle": 188,
  "learningCycleCounter": 1000000,
  "realMetrics": {
    "tasksCompleted24h": 42,
    "taskSuccessRate": 0.87,
    "agentsActive": 8,
    "agentsDispatched24h": 15,
    "toolsCalled24h": 23,
    "avgTaskLatencyMs": 340,
    "memoryItemsConsolidated24h": 12,
    "knowledgeGraphGrowth24h": 5
  }
}
```

Estas métricas vêm de dados REAIS:
- `tasksCompleted24h` → `TaskQueue.getStats().completed` (delta desde última medição)
- `taskSuccessRate` → `completed / (completed + failed)` dos últimos 30 dias
- `agentsActive` → `AgentRuntime.status().active`
- `agentsDispatched24h` → contador no EventBus (eventos `kernel:dispatch`)
- `toolsCalled24h` → contador no EventBus (eventos `tool.called`)
- `avgTaskLatencyMs` → média de `latencyMs` das últimas 100 tasks
- `memoryItemsConsolidated24h` → delta de `LTM.size` desde última medição
- `knowledgeGraphGrowth24h` → delta de `KG.getStats().entities`

**Impacto:** `cycle_N.json` passa a ter métricas verificáveis. Zero código removido. O `learningCycleCounter` mantém-se para compatibilidade.

**Ficheiros alterados:** `HyperLearningEngine.ts` (+30 linhas para coleta de métricas reais)

---

## SISTEMA 2: Planner Verification

### Problema
`AutonomousPlanner` gera 7 templates de tasks que repetem em loop infinito. 497 das 500 tasks estão "COMPLETED" com texto idêntico:
```
[Architect Prime]: Diseñada estructura modular para: [TASK_TITLE]
[Dev Master]: Código TypeScript generado para: [TASK_TITLE]
[CyberSentinel]: Auditoría completada: 0 vulnerabilidades
```
Não há execução real. É um gerador de texto.

### Correção

**Fase 2A — Adicionar verificação de output:**

Cada task do planner deve produzir um artefacto verificável. O `TaskVerifier` já existe e suporta regras. Adicionar regra:

```typescript
// Nova regra no TaskVerifier
verifier.addRule("autonomy", hasResult);        // já existe
verifier.addRule("autonomy", outputNonEmpty);    // já existe
verifier.addRule("autonomy", schemaRule(["artifact"])); // NOVO: requer campo artifact
```

Tasks de autonomia que não produzirem `result.artifact` falham na verificação.

**Fase 2B — Reduzir planner a 3 tasks reais (não 7 templates):**

As 3 tasks pendentes atuais são:
1. "Auto-mejora del sistema" — deve produzir um diff de configuração aplicável
2. "Generar nuevo agente especializado" — deve produzir um AgentSpec JSON válido
3. "Explorar nuevas integraciones" — deve produzir uma lista de apps Composio disponíveis

Se não conseguir produzir o artefacto → `task:failed` (com motivo real). Atualmente "completa" sempre com template.

**Fase 2C — Adicionar contador de planner health:**

```json
// No autonomous-planner.json
{
  "plannerHealth": {
    "tasksCreated": 500,
    "tasksWithRealArtifact": 0,     // ← 0 de 500 produziram artefactos reais
    "tasksWithTemplateOnly": 497,   // ← honesto
    "tasksPending": 3,
    "tasksFailed": 0
  }
}
```

**Impacto:** O planner deixa de fingir que funciona. Tasks sem output real falham. O sistema reporta honestamente quantas tasks produziram artefactos.

**Ficheiros alterados:** `AutonomousPlanner` (state), `TaskVerifier` (+1 regra)

---

## SISTEMA 3: Capability Registry Real

### Problema
`AutoEvolutionEngine` gera "novas capabilities" aleatoriamente:
```typescript
const ALL_POSSIBLE_CAPABILITIES = [
  "quantum_cognition", "neural_optimization", "self_healing",
  "predictive_analysis", "consciousness_simulation", "meta_learning", ...
];
```
Estas strings são appended a `agent.capabilities` mas não desbloqueiam nenhuma funcionalidade real. Servem apenas para inflacionar `wisdom = capabilities.length * 5`.

### Correção

**Fase 3A — Separar capabilities em duas categorias:**

| Categoria | Significado | Exemplos |
|-----------|------------|----------|
| **Functional** | Desbloqueia tool/permissão real | `composio_execute`, `rcs_broadcast`, `agency_report`, `email_send` |
| **Aspirational** | Meta-capacidade (placeholder) | `quantum_cognition`, `consciousness_simulation`, `meta_learning` |

**Fase 3B — Mapear capabilities funcionais existentes:**

A partir do código real, as capabilities que REALMENTE desbloqueiam algo:

| Capability | O que desbloqueia | Evidência |
|-----------|-------------------|-----------|
| `system_status` | `JarvisAgent.toolSystemStatus()` | `jarvis/agent.ts:415` |
| `list_plans` | `JarvisAgent.toolListPlans()` | `jarvis/agent.ts:430` |
| `composio_execute` | `JarvisAgent.toolComposioExecute()` | `jarvis/agent.ts:535` |
| `agency_status` | `JarvisAgent.toolAgencyStatus()` | `jarvis/agent.ts:692` |
| `rcs_broadcast` | `JarvisAgent.toolRcsBroadcast()` | `jarvis/agent.ts:796` |
| `email_send` | `EmailService.send()` | `email/service.ts` |
| `lead_response` | `LeadResponseAgent.respond()` | `agency/agents.ts:76` |
| `creative_generation` | `CreativesAgent.generate()` | `agency/agents.ts:109` |
| `nurturing` | `NurturingAgent.run()` | `agency/agents.ts:153` |
| `report_generation` | `ReportingAgent.generate()` | `agency/agents.ts:28` |
| `site_generation` | `SiteGenerator` | `sites/generator.ts` |
| `app_generation` | `AppGenerator` | `apps/generator.ts` |
| `call_analysis` | `CallLearning` | `calls/learning.ts` |
| `content_generation` | `ContentAgent` | `content-agent.ts` |
| `english_tutoring` | `EnglishTutorAgent` | `tutor/agent.ts` |

**Fase 3C — Registry de capabilities (novo ficheiro):**

```json
// data/state/capability-registry.json
{
  "functional": [
    { "id": "system_status", "unlocks": "GET system metrics", "file": "jarvis/agent.ts:415" },
    { "id": "composio_execute", "unlocks": "MCP tool execution", "file": "jarvis/agent.ts:535" },
    ...
  ],
  "aspirational": [
    { "id": "quantum_cognition", "note": "placeholder — sem implementação" },
    { "id": "consciousness_simulation", "note": "placeholder — sem implementação" },
    ...
  ]
}
```

**Fase 3D — Corrigir AutoEvolutionEngine:**

- `generateNewCapabilities()` só pode escolher de `functional` list
- Aspirational capabilities só são adicionadas se existir código que as implemente
- `wisdom` deixa de ser `capabilities.length * 5` (ver Sistema 5)

**Impacto:** Agentes só recebem capabilities que realmente desbloqueiam funcionalidades. O registry é a fonte de verdade.

**Ficheiros alterados:** `AutoEvolutionEngine.ts` (+50 linhas), novo `data/state/capability-registry.json`

---

## SISTEMA 4: VAEC Recovery

### Problema
```json
// data/state/vaec-stage.json
{"stage":"FAILED","at":"2026-08-11T00:14:28.182Z"}
```
O pipeline de evolução autónoma está parado há horas. Não há auto-recovery.

### Correção

**Fase 4A — Adicionar diagnóstico ao status do VAEC:**

Atualmente `vaec.status()` só retorna `{ stage, historySize, lastOutcome, persistedStage }`. Adicionar:

```typescript
// VaecOrchestrator.status()
{
  stage: "FAILED",
  failedAt: "2026-08-11T00:14:28.182Z",
  failedGate: "TEST",            // ← qual gate falhou
  failedReason: "npm test returned exit code 1",  // ← porquê
  stuckSince: "2.5 hours",       // ← há quanto tempo
  recoveryAvailable: true,       // ← pode fazer retry?
  lastSuccessfulRun: "2026-08-10T23:45:00.000Z"
}
```

**Fase 4B — Adicionar recovery automático (com limites):**

```typescript
// VaecOrchestrator — novo método
async attemptRecovery() {
  if (this.failedCount > 3) {
    // Não tentar mais de 3 recoveries seguidas — requer intervenção humana
    return { recovered: false, reason: "max_recovery_attempts_exceeded" };
  }
  // Rollback to last known good state
  await this.rollback();
  // Retry from IMPLEMENT
  return this.run({ description: "auto-recovery after FAILED gate" });
}
```

**Fase 4C — Expor recovery no gateway:**

```
POST /api/omega/vaec/recover  → tenta recovery
GET  /api/omega/vaec/status   → mostra diagnóstico completo
```

**Impacto:** VAEC passa a reportar PORQUÊ falhou e oferece recovery. Não fica parado indefinidamente sem diagnóstico.

**Ficheiros alterados:** `VaecOrchestrator.ts` (+40 linhas), `gateway.ts` (+2 rotas)

---

## SISTEMA 5: Wisdom Engine Real

### Problema
```typescript
// AutoEvolutionEngine.ts:112
const newWisdom = Math.min(100, currentWisdom + (knowledgeGained * 100 * multiplier));
// knowledgeGained = Math.random() * 0.04 + 0.01  (entre 0.01 e 0.05)
```
Wisdom = fórmula com random. Agentes com mais capabilities (mesmo que fantasiosas) ganham mais wisdom. `agent_scaffolder` tem wisdom 100 porque tem muitas capabilities, não porque fez algo útil.

### Correção

**Fase 5A — Substituir wisdom por Performance Score:**

Nova estrutura no LTM (`agent_wisdom_*` → `agent_performance_*`):

```json
{
  "key": "agent_performance_agent_ceo",
  "value": {
    "agentId": "agent_ceo",
    "performanceScore": 72.5,        // 0-100, baseado em métricas reais
    "metrics": {
      "tasksCompleted": 15,
      "taskSuccessRate": 0.87,       // completed / total
      "avgLatencyMs": 340,
      "toolsCalled": 23,
      "toolSuccessRate": 0.91,
      "verificationsPassed": 12,
      "verificationsFailed": 1,
      "lastActiveAt": "2026-08-11T01:30:00Z"
    },
    "previousScore": 68.3,           // score do ciclo anterior
    "trend": "improving",            // improving | stable | declining
    "computedAt": "2026-08-11T02:00:00Z"
  }
}
```

**Fórmula do Performance Score:**
```typescript
function computePerformanceScore(agentId: string): number {
  const tasks = getAgentTasks(agentId, { since: '30d' });
  if (tasks.length === 0) return 0;
  
  const successRate = tasks.filter(t => t.state === 'COMPLETED').length / tasks.length;
  const avgLatency = average(tasks.map(t => t.latencyMs || 0));
  const verificationRate = tasks.filter(t => t.verification?.status === 'PASS').length / tasks.length;
  const toolSuccessRate = /* média de tool.completed / tool.called */;
  
  // Pesos: success 40%, verification 30%, latency 15%, tools 15%
  return min(100,
    successRate * 40 +
    verificationRate * 30 +
    (1 - normalize(avgLatency, 0, 5000)) * 15 +
    toolSuccessRate * 15
  );
}
```

**Fase 5B — Manter wisdom antigo como "legacyWisdom" (não quebrar compatibilidade):**

O campo `wisdom` continua a existir nos ficheiros existentes, renomeado para `legacyWisdom`. O novo campo `performanceScore` é adicionado ao lado.

**Impacto:** "Sabedoria" passa a ser medida por performance real, não por `Math.random() * capabilities.length`.

**Ficheiros alterados:** `AutoEvolutionEngine.ts` (+80 linhas), `MemoryEngine.ts` (nova chave `agent_performance_*`)

---

## SISTEMA 6: Agent Evidence System

### Problema
Não há registo do que cada agente realmente fez. O `assignedAgentId` no `KernelTask` nunca é definido. Quando uma task completa, não se sabe qual agente a executou.

### Correção

**Fase 6A — Preencher assignedAgentId no TaskQueue:**

```typescript
// TaskQueue.ts — modificar execute()
async execute(task: KernelTask): Promise<void> {
  // ...
  task.state = "RUNNING";
  task.startedAt = Date.now();
  
  // NOVO: se o executor retornar agentId, guardamos
  const result = await this.executor(task, {
    onAgentAssigned: (agentId: string) => {
      task.assignedAgentId = agentId;
    }
  });
  // ...
}
```

O executor passa a poder chamar `meta.onAgentAssigned(id)` para registar qual agente está a executar a task.

**Fase 6B — Agent Activity Log:**

Novo ficheiro: `data/knowledge/agent-activity.jsonl`

```jsonl
{"agentId":"agent_ceo","action":"task_started","taskId":"task_abc","ts":"2026-08-11T02:00:00Z"}
{"agentId":"agent_ceo","action":"tool_called","toolId":"composio_search","taskId":"task_abc","ts":"2026-08-11T02:00:01Z"}
{"agentId":"agent_ceo","action":"tool_completed","toolId":"composio_search","success":true,"taskId":"task_abc","ts":"2026-08-11T02:00:03Z"}
{"agentId":"agent_ceo","action":"task_completed","taskId":"task_abc","verification":"PASS","ts":"2026-08-11T02:00:05Z"}
```

Subscrever aos eventos do EventBus para gravar automaticamente:
- `task:started` + `assignedAgentId` → `agent_activity: task_started`
- `tool.called` + task context → `agent_activity: tool_called`
- `tool.completed` → `agent_activity: tool_completed`
- `task:completed` + `assignedAgentId` → `agent_activity: task_completed`

**Fase 6C — Agent Evidence API:**

```
GET /api/omega/agents/:id/evidence?since=24h
→ {
    agentId: "agent_ceo",
    tasksCompleted: 5,
    toolsCalled: 12,
    avgTaskLatencyMs: 340,
    successRate: 0.87,
    recentActivity: [...]
  }
```

**Impacto:** Pela primeira vez, é possível provar o que cada agente fez. O `assignedAgentId` deixa de ser undefined.

**Ficheiros alterados:** `TaskQueue.ts` (+15 linhas), `EventBus` subscriber (+30 linhas), `gateway.ts` (+1 rota), novo `data/knowledge/agent-activity.jsonl`

---

## 7. ORDEM DE IMPLEMENTAÇÃO

| # | Sistema | Prioridade | Esforço | Dependências |
|---|---------|-----------|---------|-------------|
| 1 | **Agent Evidence** (6) | P0 | 2-3h | Nenhuma — resolve `assignedAgentId` |
| 2 | **Planner Verification** (2) | P0 | 1-2h | Depende de #1 (precisa de `assignedAgentId`) |
| 3 | **Capability Registry** (3) | P1 | 2-3h | Nenhuma |
| 4 | **Wisdom Engine** (5) | P1 | 2-3h | Depende de #1 (precisa de métricas de agente) |
| 5 | **IntelligenceLevel** (1) | P2 | 1h | Nenhuma |
| 6 | **VAEC Recovery** (4) | P2 | 2h | Nenhuma |

**Total estimado:** 10-14 horas de implementação.

---

## 8. IMPACTO ESPERADO

| Antes | Depois |
|-------|--------|
| `intelligenceLevel = min(level * 1.05, 1M)` | `realMetrics` com tasks, success rate, latency |
| Planner: 7 templates em loop | Planner: 3 tasks com artefactos verificáveis ou FAIL |
| Capabilities: strings aleatórios | Capabilities: functional registry + aspirational declarado |
| VAEC: FAILED sem diagnóstico | VAEC: diagnóstico + auto-recovery (max 3 tentativas) |
| Wisdom: `random * caps.length` | Performance Score: success rate + verification + latency |
| Sem evidência de agente | Agent Activity Log: cada ação registada e auditável |

---

*Plano Reality Hardening — 2026-08-11.*  
*© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · TVS v5.0*
