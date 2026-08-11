# Phase 3.1 — Plano Detalhado: Holograma Operacional

**Decisão:** `decision-phase3-multimodal-living-system`  
**Prioridade:** P0  
**Estado:** Planeamento — aguarda aprovação  
**Data:** 2026-08-11  
**Autoria:** © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)

---

## 1. ARQUIVOS QUE SERÃO ALTERADOS

| # | Ficheiro | Tipo de alteração | Linhas afetadas |
|---|----------|-------------------|-----------------|
| 1 | `src/dashboard/public/command-center.html` | ÚNICO ficheiro alterado | ~100 linhas novas + ~20 linhas modificadas |
| 2 | Nenhum outro ficheiro | Zero APIs novas, zero backend | — |

**Princípio:** Tudo no mesmo ficheiro vanilla HTML. Zero dependências externas.

---

## 2. COMPONENTES THREE.JS EXISTENTES (ponto de partida)

### 2.1 Estrutura atual da cena

| Componente | Linhas | Geometria | Material | Função |
|-----------|--------|-----------|----------|--------|
| **kernelSphere** | 378-381 | IcosahedronGeometry(0.55, 1) | MeshBasicMaterial wireframe, opacity 0.5, neon | Reator central |
| **ring** | 384-388 | TorusGeometry(3.8, 0.02) | MeshBasicMaterial, opacity 0.08 | Órbita de referência |
| **particles** | 391-396 | BufferGeometry (400 pontos aleatórios) | PointsMaterial, opacity 0.25 | Fundo de partículas |
| **agentSpheres** | 467-482 | IcosahedronGeometry(0.32, 0) + SphereGeometry(0.15) fill | MeshBasicMaterial wireframe + fill | 10 agentes nucleares |
| **taskParticles** | 531-534 | SphereGeometry(0.06) | MeshBasicMaterial verde, opacity 0.9 | Partículas de tasks |
| **holoGroup** | 398-399 | THREE.Group vazio | — | Agrupa agentes (rotação em bloco) |

### 2.2 Variáveis globais

```javascript
let holoScene, holoCamera, holoRenderer, holoGroup;
let agentSpheres = [];     // { id, mesh, baseColor, targetScale, pulseSpeed, state }
let kernelSphere = null;
let taskParticles = [];
let holoLabels = [];       // { el, mesh, id }
const AGENT_COLORS = {     // mapeamento role → cor hex
  CEO: 0x00f0ff, CTO: 0xbf5af2, Finance: 0x3dffa0, Security: 0xff2d55,
  Sales: 0xffb020, Research: 0x00f0ff, DevOps: 0xbf5af2, Support: 0x3dffa0, Vision: 0xffb020
};
```

### 2.3 Funções existentes

| Função | Linhas | O que faz |
|--------|--------|-----------|
| `initHologram()` | 363-446 | Cria cena, câmara, renderer, objetos, inicia loop |
| `animateHolo()` | 402-435 | Loop de animação (rotação + pulso + partículas) |
| `updateAgentSpheres(agents)` | 448-500 | Reconstrói esferas a partir de agentes da API |
| `setAgentHoloState(id, state)` | 502-523 | Muda cor/escala/opacidade de um agente |
| `spawnTaskParticle(from, to)` | 525-537 | Cria partícula que viaja entre 2 pontos |
| `updateHoloLabels()` | 539-555 | Projeta posições 3D → CSS labels |
| `holoOnSseEvent(topic, payload)` | 558-579 | Reage a eventos SSE (agent.gate, task:*) |

---

## 3. EVENTOS SSE USADOS (atuais + novos)

### 3.1 Eventos já integrados

| Tópico | Payload relevante | Ação atual no holograma |
|--------|------------------|------------------------|
| `agent.gate` | `{ agent: string, allowed, verdict, level }` | `setAgentHoloState(agent, 'BUSY')` |
| `kernel:dispatch` | `{ agent: string, task: string }` | `setAgentHoloState(agent, 'BUSY')` |
| `task:completed` | `{ assignedAgentId?, state, title }` | `setAgentHoloState(id, 'ACTIVE')` + `spawnTaskParticle(id, null)` |
| `task:failed` | `{ assignedAgentId?, error }` | `setAgentHoloState(id, 'ERROR')` → timeout 3s → ACTIVE |

### 3.2 Eventos a adicionar para o painel de agente

| Tópico | Payload | Nova ação |
|--------|---------|-----------|
| `task:started` | `{ state: "RUNNING", title, ... }` | Associa task ao agente que foi disparado (via `kernel:dispatch`) |
| `task:verifying` | `{ verification: { status, reasons } }` | Mostra estado "VERIFYING" no label do agente |

### 3.3 Gap crítico: `assignedAgentId`

**Problema:** O `TaskQueue` NUNCA define `assignedAgentId` no `KernelTask`. Quando uma task é completada, o evento `task:completed` não tem como saber qual agente a executou.

**Solução (sem alterar backend):** Manter um mapa local no holograma:

```javascript
const agentTaskMap = {}; // { agentId: taskTitle }
```

Quando `kernel:dispatch` é recebido com `{ agent, task }`, guardamos:
```javascript
agentTaskMap[agent] = { title: task, since: Date.now() };
```

Quando `task:completed` é recebido, procuramos no mapa qual agente está "BUSY" há mais tempo e assumimos que foi ele. Isto é uma heurística, não uma certeza — mas é o melhor possível sem alterar o backend.

**Alternativa futura:** Modificar `TaskQueue.execute()` para aceitar `assignedAgentId` como parâmetro do executor. (Fora do scope da Phase 3.1 — requer alteração de backend.)

---

## 4. ESTADOS REAIS DOS AGENTES DISPONÍVEIS

### 4.1 Dados da API (refresh inicial)

**Endpoint:** `GET /api/omega/agents`  
**Resposta:** `AgentRuntimeStatus`

```json
{
  "loaded": 10,
  "active": 8,
  "specs": [
    { "id": "agent_ceo",       "name": "CEO Agent",     "role": "CEO & Strategic Leader",        "status": "ACTIVE" },
    { "id": "agent_cto",       "name": "CTO Agent",     "role": "Chief Technology Officer",       "status": "ACTIVE" },
    { "id": "agent_finance",   "name": "Finance Agent", "role": "Finance & Treasury",             "status": "ACTIVE" },
    { "id": "agent_sales",     "name": "Sales Agent",   "role": "Sales & Growth",                 "status": "ACTIVE" },
    { "id": "agent_research",  "name": "Research Agent","role": "Research & Analysis",            "status": "ACTIVE" },
    { "id": "agent_developer", "name": "Developer Agent","role": "Software Development",          "status": "ACTIVE" },
    { "id": "agent_devops",    "name": "DevOps Agent",  "role": "Infrastructure & Operations",    "status": "ACTIVE" },
    { "id": "agent_security",  "name": "Security Agent","role": "Cybersecurity & Defense",        "status": "ACTIVE" },
    { "id": "agent_support",   "name": "Support Agent", "role": "Customer Support",               "status": "PAUSED" },
    { "id": "agent_vision",    "name": "Vision Agent",  "role": "Strategic Vision",               "status": "ACTIVE" }
  ],
  "failures": []
}
```

**Nota:** A resposta do `status()` só inclui `{id, name, role, status}`. Para obter capabilities, memory config, tools e objectives, seria necessário chamar `GET /api/omega/agents/:id` por agente (10 chamadas). Para a Phase 3.1, **não faremos isto** — usaremos os 4 campos disponíveis + o mapa de cores existente.

### 4.2 Estados visuais (já implementados)

| Estado | Cor | Escala | Pulso | Opacidade | Transição |
|--------|-----|--------|-------|-----------|-----------|
| **IDLE** | #444466 (cinza) | 0.4 | 0.3 (lento) | 0.2 | — |
| **ACTIVE** | Role color (neon/roxo/verde/âmbar/vermelho) | 1.0 | 1.0 (normal) | 0.7 | ← inicial |
| **BUSY** | #ffb020 (âmbar) | 1.8 | 3.0 (rápido) | 0.9 | `agent.gate` ou `kernel:dispatch` |
| **ERROR** | #ff2d55 (vermelho) | 1.5 | 5.0 (flicker) | 1.0 | `task:failed` → 3s timeout → ACTIVE |

### 4.3 Novo estado: SELECTED

| Estado | Cor | Escala | Efeito | Quando |
|--------|-----|--------|--------|--------|
| **SELECTED** | Role color (mantém) | 2.2 | Anel exterior pulsante (TorusGeometry) | Clique no agente |

---

## 5. ESTRUTURA DO PAINEL DE AGENTE (NOVO)

### 5.1 Trigger

Clique na esfera do agente (via `raycaster`) → abre painel overlay.

### 5.2 Posição

Overlay posicionado à direita do holograma ou modal centrado (mobile: fullscreen).

### 5.3 Conteúdo do painel

```
┌─────────────────────────────────┐
│  CEO Agent                      │
│  agent_ceo · CEO & Strategic    │
│  Status: ACTIVE                 │
│                                 │
│  ── CAPABILITIES ──             │
│  strategy · vision · delegation │
│  business_planning · kpi        │
│  governance                     │
│                                 │
│  ── LAST TASK ──                │
│  "Analisa o estado atual..."    │
│  dispatched 12s ago             │
│                                 │
│  ── ACTIONS ──                  │
│  [▶ Dispatch]                   │
│  input: _________________       │
│                                 │
│  ── MEMORY ──                   │
│  STM ✓ · LTM ✓ · KB ✓          │
│  Graph ✓ · Vector ✓            │
│                                 │
│  [✕ Close]                      │
└─────────────────────────────────┘
```

### 5.4 Origem dos dados do painel

| Campo | Fonte | Disponível no status()? |
|-------|-------|------------------------|
| id, name, role, status | `GET /api/omega/agents` (specs[]) | ✅ Sim |
| capabilities | `GET /api/omega/agents/:id` (AgentSpec completo) | ❌ Não — precisa de chamada extra |
| memory config | `GET /api/omega/agents/:id` | ❌ Não |
| tools | `GET /api/omega/agents/:id` | ❌ Não |
| last task | `agentTaskMap` local (heurística) | N/A |

**Decisão de design:** Para a Phase 3.1, o painel mostra:
- Dados básicos (id, name, role, status) — do `status()` inicial
- Última task — do `agentTaskMap` local
- Botão de dispatch — mesmo que a tabela de agentes abaixo
- **NÃO** mostra capabilities/memory/tools (requer 10 chamadas extra — será adicionado na Phase 3.2 com endpoint batch)

---

## 6. IMPLEMENTAÇÃO DETALHADA

### 6.1 Mouse Rotation (interação 1/5)

**O que faz:** Mover o rato sobre o holograma roda o grupo de agentes.

**Código a adicionar** (em `initHologram`, após criar `holoGroup`):

```javascript
let mouseX = 0, mouseY = 0;
let targetRotX = 0, targetRotY = 0;

container.addEventListener('mousemove', function(e) {
  const rect = container.getBoundingClientRect();
  mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
  mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
});

// No animateHolo(), antes de holoRenderer.render():
if (holoGroup) {
  targetRotY = mouseX * 0.5;
  targetRotX = mouseY * 0.3;
  holoGroup.rotation.y += (targetRotY - holoGroup.rotation.y) * 0.05;
  holoGroup.rotation.x += (targetRotX - holoGroup.rotation.x) * 0.05;
}
```

**Linhas afetadas:** +15 no `initHologram()`, +7 no `animateHolo()`.

### 6.2 Click-to-Dispatch (interação 2/5)

**O que faz:** Clicar num agente abre o painel de dispatch.

**Código a adicionar** (em `initHologram`, após a criação do renderer):

```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedAgentId = null;

container.addEventListener('click', function(e) {
  if (!holoCamera || agentSpheres.length === 0) return;
  const rect = container.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, holoCamera);
  const targets = agentSpheres.map(function(as) { return as.mesh; });
  const intersects = raycaster.intersectObjects(targets, true); // true = check children
  
  if (intersects.length > 0) {
    // Walk up to find the root agent mesh
    let obj = intersects[0].object;
    while (obj && !agentSpheres.find(function(s) { return s.mesh === obj; })) {
      obj = obj.parent;
    }
    const as = agentSpheres.find(function(s) { return s.mesh === obj; });
    if (as) {
      selectedAgentId = as.id;
      setAgentHoloState(as.id, 'SELECTED'); // não existe ainda — ver abaixo
      openAgentPanel(as.id);
    }
  } else {
    if (selectedAgentId) {
      setAgentHoloState(selectedAgentId, 'ACTIVE');
      selectedAgentId = null;
      closeAgentPanel();
    }
  }
});
```

**Para fazer isto funcionar:** O `raycaster` precisa que os `mesh` dos agentes estejam num array plano OU usamos `intersectObjects(agentSpheres.map(s => s.mesh), true)` com `true` para verificar filhos (a esfera interior). A abordagem de "walk up" para encontrar o parent correto resolve o problema.

**Novo estado SELECTED:** Adicionar ao `AGENT_COLORS` e `setAgentHoloState`:

```javascript
SELECTED: 0xffffff,  // cor branca para highlight
// Em setAgentHoloState:
if (newState === 'SELECTED') {
  as.mesh.material.color.setHex(AGENT_COLORS.SELECTED);
  as.mesh.material.opacity = 1.0;
  as.targetScale = 2.2;
  as.pulseSpeed = 0.5;
  // Adicionar anel exterior pulsante (TorusGeometry como child)
  if (!as.ring) {
    const ringGeo = new THREE.TorusGeometry(0.55, 0.04, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    as.ring = new THREE.Mesh(ringGeo, ringMat);
    as.mesh.add(as.ring);
  }
}
```

**Linhas afetadas:** +40 no `initHologram()`, +15 no `setAgentHoloState()`.

### 6.3 Painel de Agente (HTML/CSS/JS)

**O que faz:** Overlay com info do agente + dispatch.

**HTML a adicionar** (após `#holo-container`):

```html
<div id="agent-panel" style="display:none; position:absolute; top:50%; right:16px; transform:translateY(-50%);
  width:280px; background:rgba(5,5,16,0.95); border:1px solid var(--border); border-radius:14px;
  padding:20px; z-index:10; backdrop-filter:blur(8px);">
  <div style="font-size:16px;font-weight:800;color:#fff" id="ap_name">—</div>
  <div style="font-size:11px;color:var(--neon);font-family:monospace;margin-bottom:6px" id="ap_id">—</div>
  <div style="font-size:11px;color:var(--muted);margin-bottom:14px" id="ap_role">—</div>
  
  <div style="font-size:11px;color:var(--muted);margin-bottom:10px">
    <div id="ap_last_task" style="color:var(--dim)">No recent task</div>
  </div>
  
  <div style="margin-bottom:14px">
    <input id="ap_task_input" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);
      border-radius:8px;color:#fff;padding:8px 10px;font-size:12px;font-family:inherit;outline:none"
      placeholder="Analisa e recomenda..." value="">
  </div>
  
  <div class="btn-group" style="margin-bottom:10px">
    <button class="btn sm primary" onclick="dispatchFromPanel()">▶ Dispatch</button>
    <button class="btn sm danger" onclick="closeAgentPanel()">✕ Close</button>
  </div>
</div>
```

**CSS a adicionar:**
```css
#agent-panel { transition: opacity 0.3s; }
```

**JS a adicionar:**
```javascript
function openAgentPanel(agentId) {
  const a = STATE.agentSpecs.find(function(s) { return s.id === agentId; });
  if (!a) return;
  $('ap_name').textContent = a.name;
  $('ap_id').textContent = a.id;
  $('ap_role').textContent = a.role || '';
  const lastTask = agentTaskMap[agentId];
  $('ap_last_task').textContent = lastTask ? '"' + lastTask.title + '" · ' + Math.round((Date.now()-lastTask.since)/1000) + 's ago' : 'No recent task';
  $('ap_task_input').value = 'Analisa o estado atual e recomenda 3 acoes prioritarias.';
  $('agent-panel').style.display = 'block';
}

function closeAgentPanel() {
  $('agent-panel').style.display = 'none';
  if (selectedAgentId) {
    setAgentHoloState(selectedAgentId, 'ACTIVE');
    selectedAgentId = null;
  }
}

function dispatchFromPanel() {
  if (!selectedAgentId) return;
  const task = $('ap_task_input').value.trim() || 'Analisa o estado atual.';
  dispatchAgent(selectedAgentId, task);
  closeAgentPanel();
}
```

**Linhas afetadas:** +30 HTML, +10 CSS, +25 JS.

### 6.4 Zoom (interação 3/5)

**O que faz:** Scroll wheel aproxima/afasta a câmara.

**Código a adicionar** (em `initHologram`):

```javascript
container.addEventListener('wheel', function(e) {
  e.preventDefault();
  if (!holoCamera) return;
  holoCamera.position.z += e.deltaY * 0.01;
  holoCamera.position.z = Math.max(5, Math.min(25, holoCamera.position.z));
}, { passive: false });
```

**Linhas afetadas:** +6 no `initHologram()`.

### 6.5 Knowledge Graph Edges (interação 4/5)

**O que faz:** Linhas entre agentes que têm relações no KnowledgeGraph.

**Fonte de dados:** `GET /api/omega/memory/graph` → `{ entities, relations, byType }`. As relações contêm `{ from, to, type, weight }`.

**Mas:** As relações do KG são entre entidades do grafo (task, agent, memory), não especificamente entre agentes. Para visualizar edges entre agentes, precisamos de:
- Relações do tipo `executed_by` (task → agent)
- Relações entre agentes (se existirem no KG)

**Abordagem pragmática:** Como os edges entre agentes podem não existir no KG atual, vamos buscar TODAS as relações e desenhar linhas entre quaisquer duas esferas de agente que tenham uma relação.

**Código a adicionar:**

```javascript
let graphEdges = []; // { fromId, toId, type, weight }

async function loadGraphEdges() {
  try {
    const res = await j('/api/omega/memory/graph');
    // Não temos a lista de relações na resposta do getStats()
    // Precisamos de GET /api/omega/memory/graph/entities para ver relações
    // OU assumimos que as edges vêm de agentTaskMap
  } catch(e) {}
}

// Alternativa: desenhar edges baseadas nas tasks recentes
function drawEdge(fromAgentId, toAgentId, color) {
  const fromAs = agentSpheres.find(function(s) { return s.id === fromAgentId; });
  const toAs = agentSpheres.find(function(s) { return s.id === toAgentId; });
  if (!fromAs || !toAs) return;
  
  const points = [fromAs.mesh.position.clone(), toAs.mesh.position.clone()];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: color || 0x00f0ff, transparent: true, opacity: 0.3 });
  const line = new THREE.Line(geo, mat);
  holoScene.add(line);
  
  // Fade out after 10s
  setTimeout(function() { holoScene.remove(line); }, 10000);
}
```

**Abordagem final para a Phase 3.1:** Usar `spawnTaskParticle` como "edge temporária" — quando uma partícula viaja entre 2 agentes, deixamos um rastro (linha) que fade out. Isto é mais visual e não requer dados extra do KG.

**Linhas afetadas:** +20 para rastro de partículas.

### 6.6 Fullscreen (interação 5/5)

**O que faz:** Botão para expandir o holograma a tela cheia.

**HTML a adicionar** (dentro do `#holo-container`):

```html
<button id="holo-fs-btn" style="position:absolute;top:10px;right:10px;z-index:5;
  background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;
  color:var(--muted);font-size:16px;cursor:pointer;padding:4px 8px;line-height:1"
  onclick="toggleHoloFullscreen()" title="Fullscreen">⛶</button>
```

**JS a adicionar:**

```javascript
function toggleHoloFullscreen() {
  const c = document.getElementById('holo-container');
  if (!document.fullscreenElement) {
    c.requestFullscreen().catch(function(){});
  } else {
    document.exitFullscreen();
  }
}

// Re-ajustar renderer no fullscreen change
document.addEventListener('fullscreenchange', function() {
  setTimeout(function() {
    if (!holoRenderer || !holoCamera) return;
    const c = document.getElementById('holo-container');
    holoRenderer.setSize(c.clientWidth, c.clientHeight);
    holoCamera.aspect = c.clientWidth / c.clientHeight;
    holoCamera.updateProjectionMatrix();
  }, 100);
});
```

**Linhas afetadas:** +3 HTML, +15 JS.

---

## 7. CRITÉRIOS DE TESTE

| # | Teste | Como verificar | Esperado |
|---|-------|---------------|----------|
| 1 | **Rotação com mouse** | Mover rato sobre holograma | Grupo de agentes segue o rato com suavidade (lerp 0.05) |
| 2 | **Clique no agente** | Clicar na esfera do CEO | Painel abre com name, id, role, last task, input, botão dispatch |
| 3 | **Clique fora** | Clicar no espaço vazio | Painel fecha, agente volta a ACTIVE |
| 4 | **Dispatch do painel** | Escrever task e clicar dispatch | `POST /api/omega/agents/:id/execute` chamado, painel fecha, agente fica BUSY |
| 5 | **Zoom in** | Scroll up no holograma | Câmara aproxima (z diminui, min 5) |
| 6 | **Zoom out** | Scroll down no holograma | Câmara afasta (z aumenta, max 25) |
| 7 | **Fullscreen** | Clicar botão ⛶ | Holograma expande a tela cheia, renderer re-ajusta |
| 8 | **Exit fullscreen** | ESC ou clicar ⛶ de novo | Volta ao tamanho normal, renderer re-ajusta |
| 9 | **Rastro de partícula** | Dispatch agente → completar task | Partícula deixa linha temporária entre kernel e agente |
| 10 | **Anel de seleção** | Clicar no agente | TorusGeometry branco pulsante aparece à volta da esfera |
| 11 | **Anel desaparece** | Clicar fora ou fechar painel | Anel removido, agente volta à cor normal |
| 12 | **Estado BUSY no painel** | Dispatch → ver holograma | Esfera fica âmbar, pulso rápido, label mostra "BUSY" |
| 13 | **Estado ERROR → recovery** | Task falha | Esfera vermelha 3s → volta ACTIVE automaticamente |
| 14 | **Zoom não quebra rotação** | Zoom + mouse move | Rotações acumulam-se corretamente (group.rotation, não camera) |
| 15 | **Fullscreen responsivo** | Fullscreen em mobile | Layout adapta-se, labels continuam posicionadas |

---

## 8. IMPACTO NO COMMAND CENTER ATUAL

### 8.1 O que NÃO muda

| Componente | Preservado? |
|-----------|-------------|
| Header + status pills | ✅ Intacto |
| Voice bar (STT/TTS) | ✅ Intacto |
| KPI Cards (6) | ✅ Intacto |
| Agentes Nucleares (tabela) | ✅ Intacto |
| Terminal de Comandos | ✅ Intacto |
| Autonomy + Governança | ✅ Intacto |
| Live Activity (SSE) | ✅ Intacto |
| Supervisão AIOX | ✅ Intacto |
| CSS theme (cores, fontes) | ✅ Intacto |
| SSE connection | ✅ Intacto (só adiciona handlers) |
| Polling fallback (30s) | ✅ Intacto |

### 8.2 O que MUDA

| Área | Antes | Depois |
|------|-------|--------|
| **Holograma** | Estático (só rotação automática) | Interativo (mouse, clique, zoom) |
| **Agentes no holograma** | Só mostram estado | Clicáveis → abrem painel de dispatch |
| **Canvas** | Sem interação | Raycaster ativo para clique |
| **Câmara** | Fixa (z=12) | Zoom entre 5-25 |
| **Fullscreen** | Inexistente | Botão ⛶ no canto superior direito |
| **Partículas de tasks** | Viajam e desaparecem | Deixam rastro (linha temporária) |
| **Labels** | Só nome | Nome + indicador de estado (cor) |
| **CSS** | 204 linhas | +10 linhas (painel) |
| **JS (holograma)** | ~220 linhas | +120 linhas |
| **Total command-center.html** | 1,089 linhas | ~1,210 linhas |

### 8.3 Riscos

| Risco | Mitigação |
|-------|-----------|
| **Raycaster conflito com scroll** | Só ativa raycaster no `click`, não no `mousedown`/`mousemove` |
| **Fullscreen quebra labels** | Re-ajustar renderer + labels no evento `fullscreenchange` |
| **agentTaskMap impreciso** | Documentar como heurística; OK porque o estado visual é aspiracional |
| **Performance com edges** | Máximo 10 linhas simultâneas; fade out em 10s |
| **Mobile touch vs mouse** | Usar `pointermove`/`pointerdown` em vez de `mousemove`/`click` para suporte universal |

---

## 9. RESUMO DE ALTERAÇÕES

| Interação | Linhas novas | Complexidade | Depende de API nova? |
|-----------|-------------|-------------|----------------------|
| Mouse rotation | +22 | Baixa | Não |
| Click-to-dispatch (raycaster + painel) | +95 | Média | Não (usa APIs existentes) |
| Zoom | +6 | Baixa | Não |
| Knowledge edges (rastro) | +20 | Baixa | Não |
| Fullscreen | +18 | Baixa | Não |
| **TOTAL** | **+161** | — | **0 APIs novas** |

**Ficheiro final estimado:** 1,089 + 161 = ~1,250 linhas.  
**Tempo estimado de implementação:** 2-3 horas.  
**APIs novas:** 0.  
**Dependências externas:** 0.

---

*Plano detalhado Phase 3.1 — 2026-08-11.*  
*Aguardando aprovação do Comandante e da Rainha.*  
*© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)*
