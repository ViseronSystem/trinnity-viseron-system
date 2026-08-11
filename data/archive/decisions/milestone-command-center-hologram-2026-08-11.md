# Milestone: VISERON Command Center Vivo — Holograma 3D

**ID:** `milestone-command-center-hologram`  
**Data:** 2026-08-11  
**Tipo:** Enhancement  
**Autoria:** © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)  
**Depende de:** `milestone-command-center-foundation`

---

## Decisão

Adicionar visualização holográfica 3D ao Command Center usando Three.js. Cada agente nuclear é uma esfera com estado visual em tempo real (IDLE, ACTIVE, BUSY, ERROR), alimentada por dados reais do OMEGA (`/api/omega/agents`) e eventos SSE (`agent.gate`, `kernel:dispatch`, `task:*`).

---

## Componentes

1. **Canvas Three.js** — sobrepõe o header, com fundo transparente integrado ao tema escuro
2. **Esferas de Agentes (10)** — posicionadas em órbita circular, cada uma mapeada a um agente real
3. **Reator Central** — esfera maior no centro representando o OMEGA Kernel
4. **Estados visuais por agente:**
   - IDLE → esfera pequena, opacidade 0.15, sem pulso
   - ACTIVE → esfera média, neon (#00f0ff), pulso suave
   - BUSY (executando) → esfera grande, âmbar (#ffb020), pulso rápido
   - ERROR → esfera vermelha (#ff2d55), flicker
5. **Partículas de Tasks** — viajam do reator ao agente em `task:started`, do agente ao reator em `task:completed`
6. **Labels** — nome do agente sob cada esfera

---

## Dados Reais Consumidos

| Fonte | Dado | Uso |
|-------|------|-----|
| `GET /api/omega/agents` | AgentRuntimeStatus (specs[]) | Posições + cores iniciais |
| SSE `agent.gate` | `{ agent, allowed }` | Mudança de estado do agente |
| SSE `kernel:dispatch` | `{ agent, task }` | Agente entra em BUSY |
| SSE `task:completed` | KernelTask (assignedAgentId) | Agente volta a ACTIVE |
| SSE `task:failed` | KernelTask (assignedAgentId) | Agente mostra ERROR |

---

## Regras

- Zero dados falsos — cada esfera existe porque o agente existe
- Zero animações sem dados — pulsos e partículas só acontecem com eventos reais
- Zero APIs novas
- Three.js carregado via CDN (já usado no projeto)
- Canvas integrado sem quebrar layout existente

---

*Milestone registado por Pedro Costa (Comandante) e Trinnity Hurtado (Rainha).*
