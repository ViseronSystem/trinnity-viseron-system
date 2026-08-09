# OPERATIONS — Trinnity Viseron System

> **Operação do Primary Node e rotinas do VISERON**
> Command: **Pedro Costa (Supreme Commander)** · Chief Evolution Officer: **Trinnity Hurtado**
> © 2026 Trinnity Viseron System · www.trinnityviseronsystem.io · GitHub

---

## 1. Modelo Operacional

- **GitHub** = fonte de verdade do código.
- **Servidor EPYC 7542 (32C/64T · 256 GB · Windows Server 2025)** = **Primary Node** — ambiente principal de desenvolvimento + execução.
- **Servidor antigo** = fallback temporário, até a transferência completa ser validada.
- **AIOX** = auditoria. **Graphify** = conhecimento. **Pedro + Trinnity** = comando.

## 2. Primary Node — Setup e Execução

### 2.1 Quick Start

```bash
npm install
npm run build
npm start
```

Dashboard: `http://localhost:3000` · Boot rápido: o web server (porta 32123) abre em ~2s; o core pesado arranca em background e o sistema responde durante o boot.

### 2.2 Serviço no Primary Node

| Ação | Comando |
|---|---|
| Estado geral | `npm run tvs` |
| Reinício à prova de congelamento | `npm run restart` |
| Backup diário | `npm run backup` |
| Backup agendado | `npm run backup:schedule` |
| Build | `npm run build` |
| Testes | `npm run test` |
| Lint | `npm run lint` |
| Modo dev (hot reload) | `npm run dev` |

## 3. Observabilidade

| Página/Endpoint | Descrição |
|---|---|
| `GET /api/health` | Saúde + DB + billing + contagens |
| `GET /api/metrics` | Métricas de uso |
| `/command-center` | Painel operacional (saúde, autonomia, receita, agentes, execução, conhecimento, integrações) |
| `/operate` | Pipeline de execução em tempo real (SSE) |
| `/api/omega/tasks` | Estatísticas de tasks E2E (Verified Task Completion Rate) |
| `/api/omega/events` | Stream SSE de eventos do kernel |
| `/api/revenue/readiness` | Prontidão de receita real (6/6) |

## 4. Rotinas de Operação

### 4.1 Cada Atualização
1. Commit + push ao GitHub (`npm run deploy:github`).
2. Deploy do site (Render auto-deploy no push; Vercel para a landing `trinnityviseron.com`).
3. Rebuild do APK quando há mudanças mobile (`npm run build:android`).
4. Regenerar PDFs (`npm run pdfs:all`) e relatórios de estado.

### 4.2 Auditoria Contínua (AIOX)
- O squad AIOX audita operações, código, regressões e mudanças de comportamento.
- Auditoria operacional ARKOM/AIOX: `npm run audit:arkom`.
- Tudo registado em `data/knowledge/` (jarvis-memory, viseron-supervision, call-learned).

### 4.3 Conhecimento (Graphify)
- Perguntas sobre o código: `graphify query "<pergunta>"`.
- Relações: `graphify path "<A>" "<B>"` · conceitos: `graphify explain "<conceito>"`.
- Após modificar código: `graphify update .` para manter o grafo atual.

## 5. Governança de Acesso e Segredos

- Segredos (`*KEY`, `*SECRET`, `*TOKEN`, `*AUTH`) nunca no chat nem em commits — só em ficheiros locais gitignored (`.env`, `data/Viseron_Cofre_Credenciais.pdf`).
- Carteiras cripto (VSR/TRIN): `contracts/solana-keypair.json` e seeds **nunca sobrescrever sem backup prévio**; nunca aparecer no chat.
- Integrações empresariais seguem o princípio **integração máxima dentro da permissão mínima necessária** (ex.: AviratoBridge nunca toca dados de cartão).

## 6. Promoção ao Primary Node

Código que não passa pelas verificações não é promovido:

```bash
npm test
npm run lint
npm run build
```

Validações adicionais: runtime, integrações, memória, autonomia, APIs, ferramentas, agentes, segurança, persistência e recuperação.

## 7. Fallback

O servidor antigo mantém-se operacional como fallback até que o Primary Node EPYC esteja validado (health checks, AIOX audit, Graphify verify, restore verificado). Após validação, a máquina antiga pode ser reaproveitada ou descontinuada.
