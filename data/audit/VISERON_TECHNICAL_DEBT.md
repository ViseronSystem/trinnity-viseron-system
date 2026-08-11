# VISERON Technical Debt & Risks Report

**Data:** 2026-08-11

---

## BUGS

| # | Bug | Severidade | Arquivo:Linha | Correção |
|---|-----|-----------|---------------|----------|
| 1 | `assignedAgentId` nunca definido — tasks sem rastreabilidade de agente | Média | `TaskQueue.ts:49` | Definir no `execute()` ou passar como parâmetro |
| 2 | Autonomy tasks tipo "autonomy" sem executor registado — falham sempre | Alta | `AutonomyLayer.ts:154` | Registar executor default no OmegaPlatform boot |
| 3 | KB (Knowledge Base) não persiste a disco — perdida no restart | Média | `MemoryEngine.ts` | Adicionar `saveKB()` / `loadKB()` como LTM |
| 4 | AutonomyOS audit trail in-memory — perdido no restart | Média | `AutonomyOS.ts` | Persistir em JSONL (padrão viseron-supervision) |

## DÍVIDA TÉCNICA

| # | Dívida | Impacto | Prioridade | Estimativa |
|---|--------|---------|-----------|------------|
| 1 | Vectors sin/cos placeholder — sem embedding real | Busca semântica é aleatória | P0 | 2-3 dias (integrar text-embedding-3-small) |
| 2 | Gateway OMEGA sem autenticação — 50 endpoints públicos | Segurança | P0 | 1 dia (adicionar JWT middleware) |
| 3 | Node 20 Docker vs Node 24 bare-metal | Inconsistência de ambiente | P1 | 30 min (atualizar Dockerfile) |
| 4 | Sem rate limiting no gateway OMEGA | Disponibilidade | P1 | 1 dia |
| 5 | Sem paginação nos endpoints de lista | Performance | P1 | 2 dias |
| 6 | Ollama models inconsistentes (3b+1.5b vs 7b) | Confusão operacional | P2 | 30 min (alinhar .env com scripts) |
| 7 | EventBus ring buffer O(n) no splice | Performance com muitos eventos | P2 | 1 dia (circular buffer) |
| 8 | Código morto: agents/legacy (3 ficheiros stub) | Confusão de arquitetura | P2 | 1 hora (remover ou arquivar) |
| 9 | Código morto: command-center/ (3 ficheiros legacy) | Confusão | P2 | 1 hora |
| 10 | Código morto: core/ wrappers (2 ficheiros órfãos) | Confusão | P3 | 30 min |
| 11 | 2 servidores dashboard (server.ts + standalone-server.ts) | Duplicação | P3 | Investigar qual é o principal |
| 12 | 11 agentes documentados que não existem | README inflacionado | P1 | 2 horas (corrigir documentação) |

## ARQUITETURA FRACA

| # | Fraqueza | Risco | Solução |
|---|----------|-------|---------|
| 1 | Single-process — sem fila distribuída (Redis/RabbitMQ) | Sem escala horizontal | TaskQueue com backend pluggable |
| 2 | Sem sandbox — evolução é no primary node | Risco de instabilidade | Implementar sandbox mode |
| 3 | Sem dead-letter queue no EventBus | Eventos perdidos em falhas | DLQ com retry exponencial |
| 4 | Sem health checks automáticos para agentes | Agentes mortos não detectados | Heartbeat + auto-restart |
| 5 | STM não persiste — contexto perdido no restart | Experiência quebrada | Persistir STM como snapshot |

## RISCOS FUTUROS

| Risco | Probabilidade | Impacto | Mitigação |
|-------|-------------|---------|-----------|
| Servidor único — single point of failure | Alta | Crítico | Migração para servidor dedicado + backup |
| `.env` plaintext no disco | Média | Alto | Vault de segredos (SOPS ou Vault) |
| Sem disaster recovery testado | Média | Alto | Runbook + teste de restauração |
| Sin/cos vectors — falsa sensação de busca | Alta | Médio | Embeddings reais |
| Sem monitoramento externo (uptime, alertas) | Média | Médio | Integrar health checks com alertas |
| Dependência de Ollama local | Média | Médio | Fallback chain já existe |
| GitHub 0 stars / 0 forks | Baixa | Baixa (reputação) | OMEGA Benchmark público |

---

*Relatório de dívida técnica — 2026-08-11.*
