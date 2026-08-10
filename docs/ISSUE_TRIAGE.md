# TVS ISSUE TRIAGE

Estado real dos problemas conhecidos do Trinnity Viseron System, resultado da
**VISERON REALITY HARDENING PHASE 1** (REAL > MOCK > CLAIM). Este ficheiro é a
lista honesta: cada issue tem gravidade, estado e a correção aplicada.

## Corrigidas na Phase 1

| # | Issue | Gravidade | Estado |
|---|-------|-----------|--------|
| 1 | Providers cloud sem credenciais devolviam texto mock com `success: true` | Alta | CORRIGIDO — `CloudProviderBase` lança `ProviderUnavailableError`; sem chave → falha honesta |
| 2 | OllamaProvider tinha detecção de formato `llama.cpp` e mock interno | Alta | CORRIGIDO — falha real `ProviderExecutionError`; `mode: REAL` |
| 3 | Dois routers de modelo concorrentes (`ModelRouter` + `AIRouter` omega) | Média | CORRIGIDO — `ViseronModelRouter` é a abstração única; `AIRouter` é camada fina |
| 4 | `vaec-stage.json` ficava eternamente em `IDLE` (progresso não persistia) | Média | CORRIGIDO — transições persistidas (`IMPLEMENT→…→COMPLETED/FAILED/VERIFIED`) |
| 5 | Kernel executava tools/agents sem gate de autonomia | Alta | CORRIGIDO — `setAutonomyGate` + `assessAutonomy` no Kernel; bloqueio real em `executeTool`/`dispatchAgent` |
| 6 | `src/agents/registry/agents.json` reclamava `total: 200` com 3 agentes | Alta | CORRIGIDO — `total: 3` real + contagens separadas (`mindsLoaded 5014`, `omegaSpecs 10`, `squadManifests 6`) |
| 7 | `src/agents/generated/agents.json` tinha 200 placeholders fictícios `TVS-Agent-N` | Alta | CORRIGIDO — substituído por `NOT_IMPLEMENTED` com 0 agentes |
| 8 | `src/launch/market.ts` reclamava `total: 5360, battalion: 114, historical: 5000` | Alta | CORRIGIDO — contagens reais (`runtime 3, minds 5014, archetypes 246, core 10`) |
| 9 | `LocalWorkflowEngine` (n8n) simulava passos com aspeto de sucesso (`[AI] Processed`, `notified: true`) | Média | CORRIGIDO — passos mock têm `mode: MOCK` explícito + registry `n8n.engine: MOCK` |
| 10 | `/api/status` reclamava `autonomy: { omegaL0toL5: true }` hardcoded | Média | CORRIGIDO — consulta `omega.status()` real (kernel/runtime/autonomy/vaec) |
| 11 | Logs reclamavam "5.4k mentes nunca ficam paradas" | Baixa | CORRIGIDO — log com contagem real de agentes do runtime |
| 12 | `vaec-stage.json` órfão `FAILED` sem registo no journal | Baixa | CORRIGIDO — reset honesto para `IDLE` |
| 13 | Skills (1.997) sem classificação de estado nem pipeline | Média | CORRIGIDO — `SkillPipeline`: INDEXED + VALIDATION + PERMISSION (governança) + EXECUTION (não implementada) |

## Em aberto (conscientemente não resolvidas — marketing/claims fora do runtime)

| # | Issue | Gravidade | Decisão |
|---|-------|-----------|---------|
| 14 | Copy de marketing/personas ainda diz "5000+ mentes" (VISERON/JARVIS/RCS/PDFs) | Baixa | Fora do runtime — texto de marca. Manter (posição comercial dos comandantes), NÃO como claim técnico de agentes executáveis |
| 15 | `ComprehensivePDFReport` descreve "5,000+ independent minds" como operacional | Baixa | Docs/PDFs de marketing. Marcado como narrativa, não facto técnico |
| 16 | Mentes (`data/minds/minds.json` 5.014) são arquetipos de conhecimento, não processos independentes | Média | Documentado no OMEGA Master Plan: "arquitetura de agentes, não 5.396 processos independentes" |
| 17 | Produção (`viseron-web.onrender.com`) ainda devolve `autonomy: { omegaL0toL5: true }` hardcoded | Média | Source CORRIGIDO (consulta `omega.status()` real) mas a build live é antiga → **redeploy pendente** (Render). Após deploy, `/api/status` mostra estado real do kernel/autonomy/VAEC |

## Regras de triagem

1. Toda issue técnica nova segue o VAEC: `IMPLEMENT → TEST → SYNC → BUILD → VERIFY → LEARN → PROMOTE`.
2. Nenhum mock pode parecer sucesso — metadata `mode` obrigatória.
3. Claims de capacidade exigem verificação real (testes/live HTTP) antes de entrar em relatório.
4. Decisões de arquitetura/marketing pertencem a Pedro Costa (Comandante) e Trinnity Hurtado (Rainha).
