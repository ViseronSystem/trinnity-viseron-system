# Decisão Arquitetural: VISERON Phase 3 — Sistema Multimodal Vivo

**ID:** `decision-phase3-multimodal-living-system`  
**Data:** 2026-08-11  
**Tipo:** Architectural Decision  
**Estado:** Proposta — aguarda aprovação  
**Autoria:** © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)  
**Depende de:** Phase 0 completa (5 milestones: KnowledgeArchive, Command Center Foundation, Hologram 3D, Audit Baseline, README v6.0)

---

## 1. Contexto

O VISERON completou a **Phase 0 — Foundation** com 5 milestones num único dia (2026-08-11). O sistema passou de dashboard informativo para centro operacional vivo:

- **Command Center v2:** holograma 3D com 10 agentes em órbita, voz STT/TTS, terminal de 7 comandos, SSE 43 tópicos, agentes vivos, governança bíblica, supervisão AIOX
- **Agentes:** JARVIS (916L), VISERON (246L), OMEGA (594L), ATLAS (236L), Agency OS (4), 10 nucleares, 246+ AIOX squads
- **Memória:** MemoryEngine 4 camadas (STM/LTM/KB/Vector), KnowledgeGraph (896/893), KnowledgeArchive (4 milestones), EventBus (43 tópicos)
- **APIs:** ~188 endpoints REST + 43 tópicos SSE + 5 canais Socket.IO
- **Infraestrutura:** Scripts de migração prontos Linux/Windows, Docker, Postgres Neon cloud, 2 domínios live

O Command Center funciona, mas a interação humano↔máquina ainda tem limitações que impedem a experiência "viva" que o nome VISERON promete.

---

## 2. Objetivo da Phase 3

**Evoluir o VISERON de Command Center operacional para sistema multimodal vivo.**

O que muda na experiência:

| Dimensão | Antes (Phase 0) | Depois (Phase 3) |
|----------|-----------------|-------------------|
| **Voz** | Browser speechSynthesis (robótica) | ElevenLabs neural TTS (voz natural) |
| **Audição** | Browser Web Speech API (Chrome only) | Whisper server-side (qualquer browser) |
| **Visão 3D** | Holograma estático (sem interação) | Holograma interativo (mouse, clique, zoom, edges) |
| **Busca** | TF-IDF + sin/cos vectors | Embeddings reais + RAG pipeline |
| **Prova** | Testes unitários internos | OMEGA Benchmark (100 tarefas públicas) |
| **Segurança** | `.env` gitignored | Vault de segredos dedicado |
| **Evolução** | Direto no primary node | Sandbox isolado |
| **Resiliência** | Backups manuais | Disaster recovery runbook |

---

## 3. Prioridades

### 3.1 P0 — Voz Multimodal (crítico para experiência "viva")

**Problema:** O VISERON fala com voz robótica (speechSynthesis) e só ouve no Chrome (Web Speech API).

**Solução:**

| Componente | Tecnologia | Onde |
|-----------|-----------|------|
| **TTS Neural** | ElevenLabs API (já configurada no `.env`, comentada) | Servidor → streaming de áudio para o browser |
| **STT Server-side** | Whisper (OpenAI) via endpoint dedicado | `POST /api/voice/transcribe` (upload de áudio) |
| **Integração CC** | Substituir speechSynthesis por `<audio>` com stream | `command-center.html` + `viseron.html` + `atlas.html` |

**Critério de sucesso:**
- Voz do VISERON indistinguível de voz humana
- STT funciona em Firefox, Safari, mobile
- Latência TTS < 2s, STT < 3s

**Impacto:** A experiência de falar com o VISERON passa de "comando de voz" para "conversa natural".

### 3.2 P0 — Holograma Interativo (crítico para visualização operacional)

**Problema:** O holograma 3D mostra agentes mas não responde ao utilizador (sem mouse, sem clique, sem zoom).

**Solução:**

| Funcionalidade | Implementação |
|---------------|---------------|
| **Rotação com mouse** | `mousemove` → `group.rotation` (padrão do `index.html`) |
| **Clique no agente** | `raycaster` → detetar interseção com esfera → abrir modal de dispatch |
| **Zoom** | `wheel` event → `camera.position.z` |
| **Knowledge edges** | Linhas entre agentes baseadas em relações do `GET /api/omega/memory/graph` |
| **Fullscreen** | Botão para expandir canvas a tela cheia |

**Critério de sucesso:**
- Todos os 5 modos de interação funcionais
- Clique no agente abre dispatch em < 500ms
- Zoom suave entre 0.5x e 3x

**Impacto:** O holograma deixa de ser decorativo e passa a ser a interface principal de orquestração.

### 3.3 P1 — Embeddings Reais + RAG Pipeline

**Problema:** A busca semântica usa vetores 128-dim gerados deterministicamente (sin/cos), sem modelo de embedding real. Não há pipeline de retrieval-augmented generation.

**Solução:**

| Componente | Tecnologia | Onde |
|-----------|-----------|------|
| **Embedding model** | `text-embedding-3-small` (OpenAI) ou `all-MiniLM-L6-v2` (local) | MemoryEngine |
| **Dimensão** | 384 (local) ou 1536 (OpenAI) | Qdrant collection |
| **Chunking** | Sliding window 512 tokens, overlap 128 | Novo `src/core/memory/Chunker.ts` |
| **Rerank** | Cross-encoder ou LLM rerank | Novo `src/core/memory/Reranker.ts` |
| **RAG API** | `POST /api/omega/memory/rag` — query → chunks → embed → retrieve → rerank → generate | Novo endpoint |

**Critério de sucesso:**
- Embeddings gerados por modelo real (não sin/cos)
- RAG pipeline funcional (query → resposta com contexto)
- Latência RAG < 5s para queries típicas

**Impacto:** A memória do VISERON passa a ser semanticamente consultável, não apenas keyword-based.

### 3.4 P1 — OMEGA Benchmark

**Problema:** O VISERON não tem benchmark público que prove capacidade real. O GitHub tem 0 stars/0 forks. A métrica "5.396 mentes" é arquitetura, não execução.

**Solução:** Implementar **OMEGA Autonomous Benchmark** — 100 tarefas reais com métricas públicas:

| Categoria | Exemplos | # Tarefas |
|-----------|----------|-----------|
| Business | Criar plano de negócio, analisar mercado, gerar proposta | 20 |
| Engineering | Criar API endpoint, escrever testes, refatorar código | 20 |
| Research | Resumir paper, comparar tecnologias, analisar tendências | 20 |
| Operations | Diagnosticar erro, propor otimização, criar runbook | 20 |
| Finance | Analisar cashflow, projetar receita, calcular ROI | 20 |

**Métricas por tarefa:** Success Rate, Cost, Latency, Human Interventions, Error Rate, Recovery Rate, ROI.

**Critério de sucesso:**
- 100 tarefas definidas e executáveis
- Pelo menos 70% success rate sem intervenção humana
- Resultados públicos no GitHub (`data/benchmark/`)
- Comando: `npm run omega:bench`

**Impacto:** Prova externa de capacidade. Transforma "acredita em mim" em "vê os números".

### 3.5 P2 — Sandbox Environment

**Problema:** Mudanças experimentais são feitas no primary node. Não há ambiente isolado para testar antes de promover.

**Solução:**

| Componente | Descrição |
|-----------|-----------|
| **Sandbox mode** | Variável `SANDBOX=true` no `.env` — isola dados, memory, agents |
| **Data isolation** | `data/sandbox/` separado de `data/` |
| **Promote gate** | VAEC gate adicional `SANDBOX_VERIFY` antes de `PROMOTE` |
| **CLI** | `npm run sandbox:start` / `sandbox:stop` / `sandbox:promote` |

**Critério de sucesso:**
- Sandbox não afeta primary node
- Promoção de sandbox → primary requer aprovação explícita
- Rollback automático se promoção falhar

**Impacto:** Evolução segura — testa antes de deploy.

### 3.6 P2 — Vault de Segredos

**Problema:** `.env` é gitignored mas não encriptado. Se o disco for comprometido, todos os segredos são expostos.

**Solução:**

| Componente | Descrição |
|-----------|-----------|
| **Vault tool** | HashiCorp Vault (self-hosted) ou SOPS (Mozilla) |
| **Encriptação** | `.env` → `.env.enc` (age/pgp) |
| **Runtime** | Desencriptar em memória no arranque, nunca em disco |
| **Audit** | Log de acesso a segredos (quem, quando, qual chave) |

**Critério de sucesso:**
- `.env.enc` versionado no Git (seguro)
- `.env` nunca em disco não-encriptado
- Acesso a segredos auditável

**Impacto:** Segredos sobrevivem a compromisso de disco.

### 3.7 P2 — Disaster Recovery Runbook

**Problema:** Backups existem mas não há procedimento documentado de recuperação.

**Solução:** Documento `docs/DISASTER_RECOVERY.md` com cenários e procedimentos:

| Cenário | Procedimento | RTO |
|---------|-------------|-----|
| Falha de disco | Restaurar de backup + `npm run build` + `npm start` | 30 min |
| Falha de servidor | `server-setup.sh` em novo servidor + restaurar backup | 2 h |
| Compromisso de segurança | Rodar segredos, auditar logs, restaurar código limpo | 4 h |
| Falha de Postgres | Neon auto-recovery (cloud) | 0 min |
| Perda total | Reconstruir de GitHub + backup + `.env` externo | 4 h |

**Critério de sucesso:**
- Runbook documentado e testado
- RTO (Recovery Time Objective) ≤ 4h para pior cenário
- RPO (Recovery Point Objective) ≤ 1h (backup horário)

**Impacto:** Resiliência operacional comprovada.

### 3.8 P3 — GraphRAG

**Problema:** KnowledgeGraph tem 896 entidades/893 relações mas sem busca semântica híbrida.

**Solução:** Adicionar embeddings aos nós do KnowledgeGraph + busca híbrida (graph + vector).

### 3.9 P3 — WebRTC Voz Bidirecional

**Problema:** Chamadas de voz só funcionam via Twilio PSTN. Não há voz browser↔servidor em tempo real.

**Solução:** Implementar WebRTC com servidor de sinalização para voz contínua bidirecional.

---

## 4. Regras de Preservação

Estas regras aplicam-se a TODAS as alterações da Phase 3:

1. **Nenhuma API existente será removida ou quebrada**
2. **Nenhum agente existente será desativado**
3. **Nenhum dado real será apagado ou substituído**
4. **Nenhuma funcionalidade do Command Center será removida**
5. **Novos componentes serão incrementais** (adicionar, não substituir)
6. **Todas as alterações passam pelos gates VAEC** (IMPLEMENT → TEST → SYNC → BUILD → VERIFY → LEARN → PROMOTE)
7. **Cada milestone gera decisão no KnowledgeArchive + relatório + commit separado**
8. **Zero dados falsos, zero mock, zero promessas inflacionadas**

---

## 5. Critérios de Sucesso da Phase 3

| # | Critério | Como medir |
|---|----------|-----------|
| 1 | Voz natural (ElevenLabs TTS) funcional no CC, VISERON, ATLAS | Ouvir a voz — indistinguível de humana |
| 2 | STT server-side funcional em Firefox, Safari, mobile | Testar em 3 browsers |
| 3 | Holograma interativo (5 modos) | Clique, zoom, rotação, edges, fullscreen |
| 4 | Embeddings reais a alimentar Qdrant | `GET /api/omega/memory/search` com resultados semânticos |
| 5 | RAG pipeline funcional | Query → chunks → retrieve → resposta com fontes |
| 6 | OMEGA Benchmark com 70%+ success rate | 100 tarefas executadas, métricas públicas |
| 7 | Sandbox isolado funcional | Sandbox não afeta primary node |
| 8 | Segredos encriptados (`.env.enc` no Git) | `.env` nunca em disco não-encriptado |
| 9 | Disaster recovery testado | Simular falha e recuperar em ≤ 4h |
| 10 | Zero regressões nos testes existentes | Core 20/20, Web PASS, OMEGA 206/206 |

---

## 6. Impacto Esperado

### 6.1 Técnico

- **Latência de voz:** de ~3s (speechSynthesis) para < 2s (ElevenLabs streaming)
- **Cobertura STT:** de Chrome-only para universal (Whisper server-side)
- **Interação 3D:** de passiva para interativa (5 modos)
- **Busca semântica:** de keyword-based para embedding-based
- **Prova externa:** de 0 métricas públicas para 100 tarefas benchmarked
- **Segurança:** de `.env` em texto plano para encriptado
- **Resiliência:** de backups sem runbook para DR documentado e testado

### 6.2 Experiência do Utilizador

| Antes | Depois |
|-------|--------|
| "Comando de voz" (STT → texto → API → TTS robótico) | "Conversa natural" (voz → IA → voz neural) |
| "Dashboard com holograma decorativo" | "Orquestração visual interativa" |
| "Pesquisa por palavras-chave" | "Pergunta em linguagem natural" |
| "Confia em mim" | "Vê os benchmarks" |

### 6.3 Posicionamento

O VISERON passa de "plataforma multi-agente com interface web" para:

> **Sistema operacional de IA multimodal com voz neural, visualização 3D interativa, memória semântica, benchmark público e resiliência empresarial.**

---

## 7. Timeline Estimada

```
SEMANA 1-2   P0: Voz neural (ElevenLabs TTS + Whisper STT)
              P0: Holograma interativo (mouse, clique, zoom, edges, fullscreen)
              
SEMANA 3-4   P1: Embeddings reais (text-embedding-3-small)
              P1: RAG pipeline (chunker + embedder + retriever + reranker)
              
SEMANA 5-6   P1: OMEGA Benchmark (100 tarefas, métricas, dashboard)
              
SEMANA 7-8   P2: Sandbox environment
              P2: Vault de segredos (SOPS)
              
SEMANA 9-10  P2: Disaster recovery runbook + teste
              
SEMANA 11+   P3: GraphRAG + WebRTC (opcional, conforme prioridade)
```

---

## 8. Aprovação

Esta decisão arquitetural requer aprovação de:

- [ ] **Pedro Costa** — Comandante (aprovação final de arquitetura, direção, prioridades)
- [ ] **Trinnity Hurtado** — Rainha (aprovação de identidade, voz, experiência)

Após aprovação, a implementação segue a disciplina de milestones:

```
Decisão aprovada
  ↓
Milestone individual por prioridade
  ↓
Implementação
  ↓
Testes
  ↓
Relatório + PDF
  ↓
KnowledgeArchive
  ↓
Commit Git
  ↓
Push (com autorização)
```

---

*Decisão arquitetural registada no KnowledgeArchive — 2026-08-11.*  
*© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · Trinnity Viseron System v5.0*
