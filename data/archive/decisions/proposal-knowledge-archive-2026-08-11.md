# VISERON Knowledge Archive — Proposta Técnica

**Versão:** 1.0  
**Autor:** © 2026 Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)  
**Estado:** PROPOSTA (aguarda aprovação para implementar)

---

## 1. Objetivo

Criar uma **memória histórica permanente** do VISERON. Cada marco importante (E2E, decisão de arquitetura, audit, release) é arquivado automaticamente em 3 formatos (JSON, Markdown, PDF) e ligado ao knowledge graph do Omega para consulta por agentes e pelo JARVIS.

---

## 2. Arquitetura

```
                   OmegaPlatform
                         │
              ┌──────────┼──────────┐
              │          │          │
         KnowledgeGraph  │   ArchitectureIntelligence
              │          │          │
              ▼          ▼          ▼
         KnowledgeArchive (NOVO)
              │
    ┌─────────┼─────────┐
    │         │         │
  audits  executions  decisions   graph/
  (PDF)   (JSON)      (MD)       (export)
```

**Regra:** KnowledgeArchive **lê** do Omega (graph, decisions, events). **Não altera** o pipeline Agent → Tool → Verify. É uma camada de saída/persistência.

---

## 3. Estrutura de ficheiros

```
data/archive/
├── audits/
│   ├── ai-router-e2e-2026-08-11.json       ← snapshot do status real
│   ├── ai-router-e2e-2026-08-11.md         ← resumo legível
│   ├── ai-router-e2e-2026-08-11.pdf        ← PDF trilingue (ES/PT/EN)
│   └── index.json                          ← índice cronológico
│
├── executions/
│   ├── task_<id>.json                      ← dump completo da execução
│   └── index.json                          ← índice de execuções
│
├── decisions/
│   ├── milestone-e2e-vertical-slice.md      ← decisão de arquitetura
│   ├── architecture-log.md                 ← log cumulativo
│   └── index.json                          ← índice de decisões
│
├── graph/
│   ├── knowledge-export.json               ← export do KnowledgeGraph
│   ├── graph-snapshot-<date>.json          ← snapshot com timestamp
│   └── index.json                          ← índice de snapshots
│
└── archive-state.json                      ← estado global do archive
```

---

## 4. Formatos

### 4.1 JSON — máquina
- Schema tipado (TypeScript interfaces exportadas)
- Dados completos para consulta programática
- Usado pelos agentes e pelo JARVIS (`memory_recall`)

### 4.2 Markdown — humano
- Resumo legível para o Comandante e a Rainha
- Links entre documentos relacionados
- Indexado no `index.json` de cada pasta

### 4.3 PDF — apresentação
- Trilingue (ES/PT/EN)
- Gerado a partir do Markdown
- Formato de entrega para stakeholders externos

---

## 5. Integração com Omega

### 5.1 KnowledgeGraph → Archive

```ts
class KnowledgeArchive {
  constructor(private graph: KnowledgeGraph) {}

  // Snapshots automáticos do grafo a cada milestone
  snapshotGraph(reason: string): void { ... }

  // Arquiva uma execução completa a partir do kernel
  archiveExecution(taskId: string, kernel: Kernel): void { ... }

  // Regista decisão de arquitetura com proveniência
  recordDecision(title: string, body: string, tags: string[]): void { ... }
}
```

**Gatilhos de arquivo automático:**
- `omega:task:completed` → `archiveExecution()`
- `omega:decision:recorded` → `recordDecision()`
- `vaec:promoted` → `snapshotGraph()`

### 5.2 EventBridge → Archive

O `KnowledgeArchive` subscreve-se ao `EventBus` do Omega para capturar eventos `task:completed`, `tool.completed`, `vaec:promoted`, etc., sem acoplar ao pipeline.

### 5.3 API de consulta (leitura)

```
GET /api/omega/archive/status        ← estado + índices
GET /api/omega/archive/audits        ← lista de auditorias
GET /api/omega/archive/executions    ← lista de execuções
GET /api/omega/archive/decisions     ← lista de decisões
GET /api/omega/archive/graph/snapshots ← snapshots do grafo
```

---

## 6. Integração com JARVIS

```
"JARVIS, que provas tens de que o sistema funciona?"
  → memory_recall do archive
  → "Comandante, tenho o milestone do primeiro vertical slice real,
     executado em 2026-08-11: 2/2 tools, VERIFY=PASS, qwen2.5:7b local.
     O relatório completo está em data/archive/decisions/."
```

---

## 7. Plano de implementação

### Fase 1 — Core (1 ficheiro novo)

1. **`src/omega/archive/KnowledgeArchive.ts`**
   - Classe principal com os 3 métodos: `snapshotGraph`, `archiveExecution`, `recordDecision`
   - Inicialização com referências ao `KnowledgeGraph`, `Kernel` e `EventBus`
   - Geração automática de `.json` e `.md`
   - Geração de `index.json` por pasta

2. **Integrar no `OmegaPlatform`**
   - Adicionar `this.archive = new KnowledgeArchive({ graph, kernel, bus })`
   - Subscrever eventos no `EventBus` para arquivo automático
   - Expor `this.archive` no `OmegaPlatformStatus`

3. **API routes** (`src/web/standalone-server.ts` ou `src/omega/gateway.ts`)
   - 4 endpoints de leitura (status, audits, executions, decisions)

### Fase 2 — PDF (1 script)

4. **`scripts/archive-generate-pdf.ts`**
   - Lê o `.md` do archive e gera PDF trilingue
   - Reutiliza o sistema de PDFs existente (`npm run docs:100`, `npm run report:update`)

### Fase 3 — CLI

5. **Comando `npm run archive:status`**
   - Estado do archive: índices, último snapshot, total de registos
6. **Comando `npm run archive:snapshot`**
   - Força snapshot manual do grafo
7. **Comando `npm run archive:generate`**
   - Regenera todos os PDFs do archive

---

## 8. O que NÃO vai no Archive

| Item | Porquê |
|------|--------|
| Credenciais (.env, chaves, tokens) | Devem ir para um vault encriptado separado |
| Seeds de wallets | Gitignored, nunca versionadas |
| Dados pessoais de clientes | RGPD — separado do archive público |
| Logs de debug | Volume excessivo — não é memória histórica |

---

## 9. Impacto no código existente

| Ficheiro | Alteração | Risco |
|----------|-----------|-------|
| `src/omega/archive/KnowledgeArchive.ts` | NOVO | zero |
| `src/omega/index.ts` | +5 linhas (import + field) | baixo |
| `src/omega/gateway.ts` | +20 linhas (4 rotas) | baixo |
| `src/web/standalone-server.ts` | 0 linhas (gateway já montado) | zero |
| Pipeline Agent→Tool→Verify | **0 alterações** | zero |

**Total: ~200 linhas novas, ~25 linhas alteradas. Nenhuma alteração no pipeline crítico.**

---

## 10. Próximo passo

Aguardar aprovação do Comandante Pedro e da Rainha Trinnity para implementar a Fase 1.

---

© 2026 Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
