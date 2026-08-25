# VISERON P4 — PRODUCTION CONSOLIDATION & MIGRATION ARCHITECTURE
Generated: 2026-08-12T16:01:55.933Z

## 1. Como instalar VISERON no UpCloud?

13 passos, ~75 minutos:
1. winget install Node/Python/Git/Ollama/7-Zip (5 comandos, 17 min)
2. Restore golden backup (22,920 files, SHA-256 verified)
3. Copy .env via secure channel (36 secrets, manual)
4. npm install && npm run build
5. ollama pull qwen2.5:3b && qwen2.5:7b
6. npm run skills:install (1,997 skills)
7. npm test (67 tests)
8. npm start

## 2. Qual ordem correta de inicialização?

1. Ollama (carrega modelos na RAM)
2. VISERON web server (porta 32123)
3. Postgres (opcional — Neon cloud já funciona)
4. Qdrant (opcional — fallback in-memory já funciona)

## 3. Quanto tempo estimado de migração?

- Instalação: ~75 minutos
- Transferência backup (905MB): 10-30 min (depende da conexão)
- Validação completa: 30 min
- **TOTAL: 2-3 horas com downtime zero** (laptop continua ativo)

## 4. Quais riscos existem?

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| .env interceptado na transferência | HIGH | Canal seguro + rotação pós-migração |
| skills/vendor não restaurado | MEDIUM | Backup inclui ou reinstalar via npm |
| Firewall bloqueia Ollama | LOW | localhost-only rule, nunca expor |
| Postgres Neon inacessível do novo IP | MEDIUM | Testar conexão antes do switch DNS |

## 5. O que testar antes do primeiro uso?

1. npm test — 67 testes
2. GET /api/health — status OK
3. POST /api/jarvis/chat — resposta real
4. npm run founder status — Founder OS
5. npm run skills:list — 1,997 skills
6. npm run p09 — Engineering Squad 8/8
7. ollama list — modelos carregados
8. Backup agendado — primeiro backup no target

## 6. Como escalar para milhões de usuários?

| Fase | Usuários | Arquitetura |
|------|----------|-------------|
| 1 | 1-1K | NODE 01 solo (REAL agora) |
| 2 | 1K-10K | + NODE 02 GPU |
| 3 | 10K-100K | + NODE 03 Data |
| 4 | 100K-1M | 5 nodes + load balancer + CDN |
| 5 | 1M+ | Multi-region EU/US/APAC |

## REALITY CLASSIFICATION

| Componente | Status |
|-----------|--------|
| Production Architecture | REAL (baseado na v7.0 freeze) |
| Deployment Plan | REAL (comandos winget verificados) |
| Migration Map | REAL (9 assets mapeados) |
| Security Hardening | REAL (baseado na auditagem de secrets) |
| Scale Roadmap | PARTIAL (1 fase REAL, 4 planejadas) |
| Rollback Plan | REAL (downtime zero garantido) |

---
© Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
VISERON v7.0 Production Consolidation