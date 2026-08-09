# MIGRATION — Trinnity Viseron System

> **Portabilidade, transferência para o Primary Node e evolução da migração**
> Command: **Pedro Costa (Supreme Commander)** · Chief Evolution Officer: **Trinnity Hurtado**
> © 2026 Trinnity Viseron System · www.trinnityviseronsystem.io · GitHub

---

## 1. Princípio

> **O VISERON não pode depender da vida útil de uma máquina.**

O servidor hospeda o sistema. O servidor não define o sistema.

O objetivo da infraestrutura é permitir futuras migrações **sem reconstruir a inteligência da plataforma do zero**.

## 2. Estado Atual da Migração

**O desenvolvimento não congela.** GitHub = fonte de verdade do código. A transferência acompanha o desenvolvimento.

- **Servidor novo (Primary Node)**: AMD EPYC 7542 · 32C/64T · 256 GB RAM · Windows Server 2025 Standard.
- **Transferência do estado atual inteiro**: código, branches relevantes, configurações, banco de dados, memória, dados, agentes, skills, AIOX, Graphify, integrações, deploy config, ferramentas, testes e documentação.
- **Servidor antigo**: permanece como **fallback** temporário até a transferência completa ser validada.

## 3. Fluxo de Migração

```text
SERVER A (atual)
   ↓ SNAPSHOT
BACKUP
   ↓
NEW SERVER (EPYC — Primary Node)
   ↓ BOOTSTRAP (setup reproduzível)
RESTORE (dados + memória + estado)
   ↓
AIOX AUDIT
   ↓
GRAPHIFY VERIFY
   ↓
HEALTH CHECK
   ↓
PROMOTE
```

## 4. O que é transferido

Código e branches relevantes · configurações · banco de dados · memória persistente · dados de runtime · agentes e squads · skills · AIOX · Graphify (`graphify-out/`) · integrações e chaves (`.env`, gitignored) · configuração de deploy (Render/Vercel) · ferramentas · testes · documentação · scripts de operação.

**Segredos nunca viajam no Git**: `.env`, `contracts/solana-keypair.json`, seeds e cofres são transferidos por canal seguro e ficam gitignored.

## 5. Abordagem: aprender com cada migração

Não criamos infraestrutura de migração hipotética para os próximos 50 servidores. Construímos a transferência funcional primeiro e automatizamos progressivamente:

```text
MIGRAÇÃO 1 → aprendemos o que faltou
MIGRAÇÃO 2 → melhoramos
MIGRAÇÃO 3 → automatizamos
MIGRAÇÃO N → migração quase automática
```

## 6. Requisitos estruturais de portabilidade

O VISERON deve sobreviver à substituição do servidor através de:

- Git (fonte de verdade);
- configuração reproduzível (`server-setup.ps1` / `tvs-run.sh` / Dockerfile);
- backups (diários + agendados);
- memória persistente (independe do servidor físico);
- banco de dados;
- estado exportável;
- secrets separados (gitignored);
- scripts de bootstrap;
- health checks;
- restore;
- rollback.

## 7. Ferramentas existentes

| Comando | Descrição |
|---|---|
| `powershell -File scripts\migration\migrate-pack.ps1` | Empacota dados + `.env` + scripts + runbook → `migracao/` |
| `sudo ./server-setup.sh --domain www.trinnityviseronsystem.io` | Setup Ubuntu/Debian completo (Node 24, PM2, Ollama, nginx+HTTPS) |
| `powershell -File .\server-setup.ps1` | Setup Windows Server (repo em `C:\tvs`, Task Scheduler, firewall) |
| `./tvs-run.sh status/restart/stop/start/logs` | Gestão PM2 + saúde |
| `npm run backup` / `npm run backup:schedule` | Backup manual / agendado |
| `npm run restart` | Reinício à prova de congelamento |

Documento de referência: `docs/Viseron_Migracao_Servidor_Dedicado.md` (trilingue). O pacote `migracao/` contém `.env` e é gitignored — nunca versionar.

## 8. Critérios de Promoção (migração concluída)

1. Build + testes passam no EPYC (`npm test`, `npm run lint`, `npm run build`).
2. Dados restaurados e verificados (contagens iguais à origem).
3. Health checks verdes (`GET /api/health`).
4. AIOX audit sem bloqueios críticos.
5. Graphify verify do conhecimento restaurado.
6. Domain/receita/RCS/agency a funcionar no Primary Node.
7. Só então: `PROMOTE` e o servidor antigo passa a fallback puro.
