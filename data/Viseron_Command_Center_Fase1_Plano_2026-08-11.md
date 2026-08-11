# VISERON Command Center — Plano de Implementação Fase 1

**Data:** 2026-08-11  
**Objetivo:** Transformar `command-center.html` de dashboard read-only em centro operacional vivo.  
**Regras:** Sem dados falsos · Sem animações sem dados reais · Tudo consome estado real do VISERON

---

## 1. INVENTÁRIO DE APIs QUE O COMMAND CENTER PODE CONSUMIR

### 1.1 Estado do Sistema (fontes de verdade)

| API | Método | O Que Retorna | Uso no CC |
|-----|--------|---------------|-----------|
| `/api/omega/status` | GET | Kernel, runtime, graph, autonomy, watchdog, squads, factory, enterprise, VAEC — tudo | Fonte ÚNICA de verdade. Substitui os 6 cards + tabela de agentes + autonomy + architecture |
| `/api/omega/kernel` | GET | Kernel status (runtime, tasks, events, agents, tools, memory) | Card de kernel status |
| `/api/omega/kernel/events` | GET | EventBus stats (topics, subscribers, emitted, errors, history) | Card de eventos |
| `/api/omega/tasks` | GET | TaskQueue stats (created, queued, running, verifying, completed, failed) | Card de tasks |
| `/api/omega/agents` | GET | AgentRuntime status (loaded, active, specs[]) | Tabela de agentes + cards |
| `/api/omega/memory/graph` | GET | KnowledgeGraph stats (entities, relations, byType) | Card de knowledge graph |
| `/api/health` | GET | Health + db + tenants + users + billing + email | Card de sistema |
| `/api/viseron/status` | GET | VISERON status (wakeWords, voice, supervision, governance) | Status do VISERON no header |

### 1.2 Ações Operacionais (o CC executa estas)

| API | Método | Body | O Que Faz | Uso no CC |
|-----|--------|------|-----------|-----------|
| `/api/omega/agents/:id/execute` | POST | `{ task, context? }` | Dispara um agente nuclear | Botões "Dispatch" na tabela de agentes |
| `/api/omega/tasks` | POST | `{ type, title, payload?, priority? }` | Cria uma task E2E | Terminal / input de comando |
| `/api/omega/tasks/:id/cancel` | POST | — | Cancela uma task | Botão de cancel na live activity |
| `/api/omega/autonomy/cycle` | POST | `{ kind }` | Dispara ciclo de autonomia | Botões "Planning / Evolution / Learning" |
| `/api/viseron/chat` | POST | `{ message, speaker, lang, sessionId }` | Fala com o VISERON (executa intents) | Comando de voz / texto |

### 1.3 Auditoria & Supervisão

| API | Método | O Que Retorna | Uso no CC |
|-----|--------|---------------|-----------|
| `/api/viseron/supervision` | GET | Últimas 30 operações AIOX + stats + okRate | Painel de supervisão |
| `/api/viseron/governance` | GET | 9 princípios bíblicos + 7 checks + blockedKinds | Painel de governança |
| `/api/omega/memory/search?q=` | GET | Resultados de busca na memória unificada | Terminal de busca |

---

## 2. INVENTÁRIO DE CANAIS EM TEMPO REAL

### 2.1 SSE (`GET /api/omega/events?topic=...`)

**Endpoint:** `/api/omega/events?topic=task.*,tool.*,memory.*,kernel.*,autonomy.*,vaec.*,omega:*`

**Formato SSE:**
```
event: task:completed
data: {"topic":"task:completed","source":"task-queue","ts":1723456789123,"payload":{...KernelTask}}

event: tool.called
data: {"topic":"tool.called","source":"kernel","ts":1723456789124,"payload":{...toolCall}}

event: omega:autonomy:cycle
data: {"topic":"omega:autonomy:cycle","source":"autonomy","ts":1723456789125,"payload":{...}}

: heartbeat 1723456789126
```

**Eventos disponíveis (43 tópicos):**

| Grupo | Tópicos | O Que Significa |
|-------|---------|-----------------|
| **Tasks** | `task:created`, `task:planned`, `task:queued`, `task:started`, `task:verifying`, `task:completed`, `task:failed`, `task:cancelled`, `task:recovering` | Ciclo de vida completo de cada task |
| **Tools** | `tool.gate`, `tool.blocked`, `tool.called`, `tool.completed`, `tool.failed` | Cada tool executada pelo kernel |
| **Verification** | `verification:pass`, `verification:fail`, `verification:retry`, `verification:human` | Resultado do TaskVerifier |
| **Kernel** | `kernel:attached`, `kernel:dispatch` | Componentes ligados, agentes disparados |
| **Autonomy** | `omega:autonomy:run`, `omega:autonomy:cycle` | Ciclos de autonomia |
| **VAEC** | `vaec:stage`, `vaec:gate`, `vaec:promoted`, `vaec:rollback` | Evolução autónoma |
| **Factory** | `omega:factory:start`, `omega:factory:complete`, `omega:factory:error` | Pipeline de fábrica |
| **Enterprise** | `omega:enterprise:action`, `omega:enterprise:complete` | Módulos enterprise |
| **Memory** | `stm:added`, `ltm:set`, `kb:added`, `vector:stored`, `consolidation:run` | Memória (via EventBridge) |
| **Errors** | `eventbus.handler.error` | Erros de handlers |

### 2.2 Socket.IO (`/api/socket.io`)

**Eventos server→client:**
- `system:info` — emitido na conexão: `{ coreName, mode, blog }`
- `omega:event` — bridge do EventBus (quando OMEGA está montado): `{ topic, source, ts, payload }`
- `voice:response` — resposta do VoiceBridge: `{ text, voice, lang? }`
- `voice:error` — erro do VoiceBridge: `{ error }`

**Eventos client→server:**
- `voice:command` — envia comando de voz: `{ text, speaker, lang? }`
- `voice:transcript` — broadcast de transcrição: `{ text, speaker, lang? }`
- `messaging:join` — junta-se a sala de mensagens: `userId`

---

## 3. PLANO DE ALTERAÇÕES

### ARQUIVO ÚNICO A ALTERAR: `src/dashboard/public/command-center.html`

O ficheiro atual tem 321 linhas. O plano é expandir para ~600 linhas, mantendo TODO o HTML/CSS/JS num só ficheiro (padrão do projeto — todas as páginas são self-contained).

**Estrutura proposta do novo command-center.html:**

```
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VISERON COMMAND CENTER</title>
  <style>
    /* CSS completo — neon theme mantido + novos componentes */
  </style>
</head>
<body>
  <!-- HEADER: brand + status pill + VISERON reator -->
  
  <!-- ROW 0: COMANDO DE VOZ (STT/TTS integrado) -->
  <!--   - Botão microfone (clicar para falar)            -->
  <!--   - Wake word automático "VISERON"                  -->
  <!--   - Feedback visual "a ouvir..."                    -->
  <!--   - Resposta TTS (voz Stark)                        -->
  <!--   - Histórico de comandos (últimos 5)               -->
  
  <!-- ROW 1: KPI CARDS (6 cards — dados reais do omega/status) -->
  <!--   1. System Status (kernel online/offline)          -->
  <!--   2. Active Agents (loaded/active)                  -->
  <!--   3. Tasks (completed/running/queued/failed)        -->
  <!--   4. Events (total emitted/topics/errors)           -->
  <!--   5. Knowledge Graph (entities/relations)           -->
  <!--   6. Minds Online (total)                           -->
  
  <!-- ROW 2: AGENTES NUCLEARES (tabela interativa)        -->
  <!--   - Cada agente: ID, nome, role, squad, status, caps-->
  <!--   - Botão "Dispatch" por agente                     -->
  <!--   - Input de task inline (o que disparar)           -->
  <!--   - Última task executada (via SSE)                 -->
  
  <!-- ROW 3: TERMINAL DE COMANDOS                        -->
  <!--   - Input de texto livre                            -->
  <!--   - Comandos:                                       -->
  <!--     dispatch <agentId> "<task>"                     -->
  <!--     task "<title>" [priority]                       -->
  <!--     autonomy <planning|evolution|learning>          -->
  <!--     status                                          -->
  <!--     search "<query>"                                -->
  <!--     help                                            -->
  <!--   - Output inline (últimos 10 comandos)             -->
  
  <!-- ROW 4: AUTONOMY + GOVERNANÇA (2 painéis lado a lado)-->
  <!--   - Autonomy: planning/evolution/learning state     -->
  <!--   - Botões para disparar ciclos                     -->
  <!--   - Governança: 9 princípios visíveis               -->
  
  <!-- ROW 5: LIVE ACTIVITY (SSE feed em tempo real)       -->
  <!--   - Log de eventos em tempo real                    -->
  <!--   - Filtro por tópico (task.*, tool.*, all)         -->
  <!--   - Últimos 50 eventos                              -->
  <!--   - Cada evento: timestamp + tópico + resumo        -->
  
  <!-- ROW 6: SUPERVISION (audit trail AIOX)               -->
  <!--   - Últimas 10 operações                            -->
  <!--   - okRate + byIntent stats                         -->
  
  <script>
    // TODO o JavaScript — sem dependências externas além de:
    // - Web Speech API (nativa do browser)
    // - fetch() (nativa)
    // - EventSource (nativa)
    // - speechSynthesis (nativa)
  </script>
</body>
</html>
```

---

## 4. DETALHE DAS ALTERAÇÕES (secção por secção)

### 4.1 HEADER (mantido + expandido)

**Estado atual:** Brand + status pill com dot pulsante.  
**Novo:** Adicionar:
- Reator VISERON (círculo pulsante que muda de cor com estado: verde=online, âmbar=degradado, vermelho=offline)
- Indicador SSE (conectado/desconectado)
- Indicador de voz (microfone ativo/inativo)

**Dados reais:** `GET /api/omega/status` → `kernel.status` → online/offline. `GET /api/viseron/status` → `name, version`.

### 4.2 COMANDO DE VOZ (NOVO)

**O que não existe hoje no command-center:** Zero voz.  
**O que existe no projeto:** `voice-widget.js:104` (STT), `voice-widget.js:82` (TTS), `viseron.html:228` (STT + wake word), `atlas.html:214` (STT).

**Implementação:**

```javascript
// STT: Web Speech API (SpeechRecognition)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

function startListening() {
  recognition = new SR();
  recognition.lang = currentLang; // 'pt-BR', 'es-ES', 'en-US'
  recognition.continuous = false;
  recognition.interimResults = true;
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    // Se tem wake word "VISERON", processa
    if (wakeDetected(transcript)) {
      const command = transcript.replace(/viseron|hey viseron|jarvis|companheiro|superinteligencia/gi, '').trim();
      sendVoiceCommand(command);
    }
  };
  
  recognition.onerror = (e) => { /* mostrar erro */ };
  recognition.onend = () => { /* loop mode: re-ouvir após 500ms */ };
  
  recognition.start();
}

// TTS: SpeechSynthesis
function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = currentLang;
  u.rate = 0.92;  // voz Stark
  u.pitch = 0.72;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

// Envia comando para o VISERON (API real)
async function sendVoiceCommand(message, speaker = 'pedro') {
  const res = await fetch('/api/viseron/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, speaker, sessionId })
  });
  const data = await res.json();
  if (data.ok) {
    addToVoiceHistory(message, data.text);
    speak(data.text); // TTS da resposta
    refreshCards();   // atualiza métricas após ação
  }
}
```

**Wake words detectadas:** `viseron`, `hey viseron`, `jarvis`, `companheiro`, `superinteligencia` (mesmas do `viseron.html:250`).

**Intents que o VISERON executa via `/api/viseron/chat`:**
- "status" → system_status
- "dispatch agent <id>" → kernel:dispatch
- "cria task de <desc>" → cria task
- "autonomia planning" → autonomy cycle
- E todos os 21 intents do JARVIS (agency, composio, rcs, email, etc.)

### 4.3 KPI CARDS (existente — melhorado)

**Estado atual:** 6 cards com polling 15s.  
**Novo:** Atualização em tempo real via SSE (cada evento que altera estado → refresh do card relevante).

| Card | Valor | Fonte | Atualiza com evento SSE |
|------|-------|-------|--------------------------|
| System Status | "ONLINE" / "DEGRADED" | `/api/omega/status` → `kernel.status` | `kernel:*` |
| Active Agents | "8 / 10" | `/api/omega/status` → `runtime.active` + `runtime.loaded` | `agent.gate`, `kernel:dispatch` |
| Tasks | "42 completed · 3 running · 5 queued" | `/api/omega/tasks` | `task:*` |
| Events | "1423 emitted · 15 topics · 0 errors" | `/api/omega/kernel/events` | `eventbus.*` |
| Knowledge Graph | "896 entities · 893 relations" | `/api/omega/memory/graph` | `task:completed`, `memory:*` |
| Minds Online | "5396" | `/api/omega/status` → `kernel.agents.total` | — |

**Implementação:** Cada evento SSE → verifica tópico → atualiza só o card relevante (não faz refresh total).

### 4.4 AGENTES NUCLEARES (existente — expandido)

**Estado atual:** Tabela com ID, nome, role, squad, estado, capacidades. Botões "Dispatch: DevOps" e "Dispatch: Finance" fixos.  
**Novo:**

- **Botão "Dispatch" por agente** (cada linha tem o seu)
- **Input de task** (textarea pequeno por agente, placeholder: "Analisa o estado atual e recomenda 3 ações prioritárias")
- **Indicador de última execução** (via SSE: `agent.gate` + `kernel:dispatch` → célula "última task" atualiza)
- **Status em tempo real** (via SSE: `agent.gate` → muda badge de ACTIVE para BUSY durante execução)

**Dados reais:** `GET /api/omega/agents` → `specs[]`. Cada spec tem: `id, name, role, description, status, capabilities, squad`.

**Ação de dispatch** (já existe no código atual, linha 286-296):
```javascript
async function dispatch(agentId, task) {
  const res = await fetch(`/api/omega/agents/${agentId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, context: { origin: 'command-center' } })
  });
  const data = await res.json();
  // Feedback visual na linha do agente
}
```

### 4.5 TERMINAL DE COMANDOS (NOVO)

**O que não existe hoje:** Input de texto livre. Só botões fixos.  
**Implementação:** Input tipo terminal (estilo `webos.js:316` comando `say`).

**Comandos suportados:**

| Comando | Exemplo | API Chamada |
|---------|---------|-------------|
| `dispatch <agentId> "<task>"` | `dispatch agent_ceo "Analisa o mercado"` | `POST /api/omega/agents/:id/execute` |
| `task "<title>" [priority]` | `task "Auditar segurança" high` | `POST /api/omega/tasks` |
| `autonomy <kind>` | `autonomy planning` | `POST /api/omega/autonomy/cycle` |
| `status` | `status` | `GET /api/omega/status` (refresh) |
| `search "<query>"` | `search "TaskQueue"` | `GET /api/omega/memory/search?q=` |
| `cancel <taskId>` | `cancel task_abc123` | `POST /api/omega/tasks/:id/cancel` |
| `help` | `help` | Mostra lista de comandos |
| `clear` | `clear` | Limpa output do terminal |

**Parser do terminal:**
```javascript
function executeCommand(input) {
  const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g).map(p => p.replace(/"/g, ''));
  const cmd = parts[0].toLowerCase();
  
  switch(cmd) {
    case 'dispatch':
      if (parts.length < 3) return 'Uso: dispatch <agentId> "<task>"';
      return dispatch(parts[1], parts[2]);
    case 'task':
      if (parts.length < 2) return 'Uso: task "<title>" [priority]';
      return createTask(parts[1], parts[2] || 'normal');
    case 'autonomy':
      if (!['planning','evolution','learning'].includes(parts[1])) return 'Uso: autonomy <planning|evolution|learning>';
      return runAutonomy(parts[1]);
    case 'status':
      refresh();
      return 'Sistema atualizado.';
    case 'search':
      return searchMemory(parts.slice(1).join(' '));
    case 'cancel':
      return cancelTask(parts[1]);
    case 'help':
      return helpText;
    case 'clear':
      clearTerminal();
      return '';
    default:
      // Fallback: enviar como chat para o VISERON
      return sendVoiceCommand(input, 'pedro');
  }
}
```

### 4.6 LIVE ACTIVITY SSE (existente — CORRIGIDO)

**Estado atual:** Div `#logs` que NÃO está ligada ao SSE. Só recebe mensagens manuais de `refresh()` e `dispatch()`.  
**Bug:** O `operate.html` e `workspace.html` já usam SSE corretamente, mas o `command-center.html` NÃO.

**Correção:** Ligar `EventSource` ao SSE endpoint.

```javascript
let eventSource = null;

function connectSSE() {
  eventSource = new EventSource('/api/omega/events?topic=task.*,tool.*,memory.*,kernel.*,autonomy.*,vaec.*,omega:*');
  
  // Eventos nomeados
  const taskEvents = ['task:created','task:planned','task:queued','task:started','task:completed','task:failed','task:cancelled'];
  taskEvents.forEach(topic => {
    eventSource.addEventListener(topic, (e) => {
      const data = JSON.parse(e.data);
      log(`[${data.source}] ${topic}: ${data.payload.title || data.payload.id}`, true);
    });
  });
  
  eventSource.addEventListener('tool.called', (e) => {
    const data = JSON.parse(e.data);
    log(`[tool] ${data.payload.toolId} called`, true);
  });
  
  eventSource.addEventListener('tool.completed', (e) => {
    const data = JSON.parse(e.data);
    log(`[tool] ${data.payload.toolId} → ${data.payload.success ? 'OK' : 'FAIL'} (${data.payload.executionTimeMs}ms)`, true);
  });
  
  // Fallback genérico
  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      log(`[${data.source || 'omega'}] ${data.topic}: ${JSON.stringify(data.payload).slice(0, 120)}`);
    } catch {}
  };
  
  eventSource.onerror = () => {
    log('[sse] connection lost — retrying...');
    // Reconectar após 3s
    setTimeout(connectSSE, 3000);
  };
}
```

**Filtro de tópicos no UI:** Botões no topo da live activity: "All", "Tasks", "Tools", "Memory", "Kernel" — filtram o que aparece no log.

**Log visual:** Cada entrada mostra:
- Timestamp (HH:MM:SS)
- Source (ícone/emoji por tipo)
- Tópico (colorido por categoria)
- Resumo do payload (1 linha, truncado a 120 chars)
- Últimas 50 entradas (rolagem automática)

### 4.7 GOVERNANÇA + AUTONOMY (existente — consolidado)

**Estado atual:**
- Autonomy Layer: painel com planning/evolution/learning + botões
- Autonomy OS L0-L5: tabela de níveis
- Architecture Intelligence: stats do Graphify

**Novo:**
- **Governança Bíblica** (NOVO — dados de `/api/viseron/governance`)
  - 9 princípios em cards pequenos (ícone + nome)
  - 4 blockedKinds visíveis (fraud, hidden_fee, data_leak, seed_exposure)
  - 7 checks listados

- **Autonomy** (mantido + melhorado)
  - Estado real via SSE (`omega:autonomy:cycle`)
  - Botões com feedback visual imediato

---

## 5. FLUXO DE DADOS (Como tudo se liga)

```
┌──────────────────────────────────────────────────────────────┐
│                   command-center.html                         │
│                                                               │
│  ┌─────────────────┐     ┌─────────────────┐                 │
│  │ VOZ (STT/TTS)   │     │ TERMINAL        │                 │
│  │ Web Speech API  │     │ Input de texto  │                 │
│  └────────┬────────┘     └────────┬────────┘                 │
│           │                       │                          │
│           └───────────┬───────────┘                          │
│                       ▼                                      │
│           POST /api/viseron/chat                              │
│           POST /api/omega/agents/:id/execute                  │
│           POST /api/omega/tasks                               │
│           POST /api/omega/autonomy/cycle                      │
│                       │                                      │
│                       ▼                                      │
│           ┌───────────────────────┐                           │
│           │   SSE EventSource     │                           │
│           │   /api/omega/events   │                           │
│           └───────────┬───────────┘                           │
│                       │                                      │
│         ┌─────────────┼─────────────┐                        │
│         ▼             ▼             ▼                        │
│   KPI CARDS     LIVE LOG       AGENT TABLE                   │
│   (atualizam    (feed em       (status                        │
│    em tempo     tempo real)    em tempo                       │
│    real)                       real)                          │
│                                                               │
│                    ┌──────────────┐                           │
│                    │ SUPERVISION  │                           │
│                    │ GET /viseron │                           │
│                    │ /supervision│                           │
│                    └──────────────┘                           │
└──────────────────────────────────────────────────────────────┘

LEGENDA DE CORES:
  Verde (#3dffa0) — online, success, completed
  Neon (#00f0ff) — active, running, in-progress
  Roxo (#bf5af2) — agents, squad, secondary
  Vermelho (#ff2d55) — failed, error, blocked
  Âmbar (#ffb020) — warning, degraded, pending
```

---

## 6. IMPLEMENTAÇÃO (Ordem de Trabalho)

### Passo 1: SSE Live Activity + KPI Cards em Tempo Real
- [ ] Ligar `EventSource` ao `/api/omega/events`
- [ ] Mapear eventos SSE → atualização dos 6 KPI cards
- [ ] Feed de live activity com eventos reais (substitui logs manuais)
- [ ] Filtro de tópicos (All/Tasks/Tools/Memory/Kernel)
- **Estimativa:** ~80 linhas de JS

### Passo 2: Comando de Voz (STT/TTS)
- [ ] Adicionar botão microfone no header
- [ ] Implementar `SpeechRecognition` com wake word "VISERON"
- [ ] Implementar `SpeechSynthesis` com voz Stark
- [ ] Conectar voz ao `POST /api/viseron/chat`
- [ ] Histórico de comandos (últimos 5)
- **Estimativa:** ~100 linhas de JS

### Passo 3: Terminal de Comandos
- [ ] Input tipo terminal com parser de comandos
- [ ] 7 comandos: dispatch, task, autonomy, status, search, cancel, help
- [ ] Output inline com scroll
- [ ] Fallback para VISERON chat (comandos não reconhecidos)
- **Estimativa:** ~80 linhas de JS

### Passo 4: Tabela de Agentes Interativa
- [ ] Botão "Dispatch" por agente (não só os 2 fixos)
- [ ] Input de task por agente
- [ ] Status em tempo real via SSE (`agent.gate`, `kernel:dispatch`)
- [ ] Indicador de última execução
- **Estimativa:** ~40 linhas de JS

### Passo 5: Governança + Autonomy Consolidado
- [ ] Painel de Governança Bíblica (`GET /api/viseron/governance`)
- [ ] 9 princípios em cards
- [ ] Autonomy com feedback visual dos botões
- **Estimativa:** ~50 linhas de JS + ~30 linhas de HTML/CSS

### Passo 6: Supervisão AIOX
- [ ] Painel de supervisão (`GET /api/viseron/supervision`)
- [ ] Últimas 10 operações + okRate + byIntent
- **Estimativa:** ~40 linhas de JS + ~20 linhas de HTML/CSS

### Passo 7: Testes + Polimento
- [ ] Verificar que TODOS os dados vêm de APIs reais
- [ ] Verificar que não há dados falsos/hardcoded
- [ ] Testar com OMEGA carregado e descarregado (placeholder 503)
- [ ] Responsivo mobile
- [ ] Atalhos de teclado (Ctrl+K = terminal, Ctrl+Space = voz)

---

## 7. O QUE NÃO MUDAR (Manter)

- CSS neon theme (cyberpunk escuro) — já está excelente
- Gradient brand header — manter
- Cards com `.accent-1/2/3/4` — manter cores
- Tabela de agentes — manter estrutura, só adicionar coluna de ação
- Botões de dispatch/autonomia — manter, só adicionar feedback visual
- Polling de fallback — manter o `setInterval(refresh, 15000)` como fallback se SSE falhar

---

## 8. ZERO DEPENDÊNCIAS EXTERNAS

Tudo o que o command-center precisa já está no browser ou no servidor:

| Recurso | Fonte | Estado |
|---------|-------|--------|
| `fetch()` | Nativo (ES6+) | ✅ |
| `EventSource` | Nativo (SSE) | ✅ |
| `SpeechRecognition` | Web Speech API | ✅ (Chrome/Edge) |
| `speechSynthesis` | Web Speech API | ✅ |
| SSE endpoint | `/api/omega/events` | ✅ (EventBridge.ts:82) |
| REST APIs | `/api/omega/*`, `/api/viseron/*`, `/api/health` | ✅ (50+ endpoints) |

**NÃO precisa de:** Socket.IO client, Three.js, React, Vue, jQuery, CDN scripts.

---

## 9. MÉTRICAS DE SUCESSO DA FASE 1

| Métrica | Antes | Depois |
|---------|-------|--------|
| Tempo de atualização dos cards | 15s (polling) | <1s (SSE em tempo real) |
| Feed de live activity | Manual (só refresh/dispatch) | Tempo real (43 tópicos SSE) |
| Comando de voz | Inexistente no CC | STT + TTS + wake word "VISERON" |
| Terminal de comandos | Inexistente | 7 comandos operacionais |
| Dispatch de agentes | 2 botões fixos (DevOps, Finance) | Todos os 10 agentes com input de task |
| Governança bíblica | Inexistente no CC | 9 princípios + 7 checks visíveis |
| Supervisão AIOX | Inexistente no CC | Últimas 10 operações + stats |
| Dados falsos/hardcoded | 0 | 0 (regra mantida) |

---

## 10. PRÓXIMOS PASSOS (Fase 2+)

- **Fase 2:** Holograma 3D (Three.js com agentes como esferas pulsantes, dados reais do EventBus)
- **Fase 3:** Voz bidirecional total (WebRTC + ElevenLabs/OpenAI Realtime server-side)
- **Fase 4:** Drag & drop de tasks entre agentes
- **Fase 5:** Knowledge Graph Explorer visual
- **Fase 6:** Audit & Autonomy Console completo
- **Fase 7:** Polish & deploy

---

*Plano gerado por auditoria somente leitura — 2026-08-11.*  
*Pronto para implementação. Nenhuma API nova necessária — tudo já existe.*
