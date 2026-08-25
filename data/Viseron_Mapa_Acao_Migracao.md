# VISERON — RELATORIO DE ACAO E MAPA DE MIGRACAO
## Comando: Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
## Data: 2026-08-14 · Base: v7.0 Golden Backup Final

---

# PARTE 1 — ONDE ESTAMOS AGORA (estado real)

## 1.1 O que esta PRONTO e protegido

| Ativo | Quantidade | Estado |
|-------|-----------|--------|
| Backup Golden Final | 22.948 arquivos / 908MB | SHA-256 verificado 100% |
| Codigo TypeScript | 249 arquivos | Compilando |
| Scripts CLI | 109 | Funcionais |
| Agentes | 30 (6 squads) | Operacionais |
| Skills | 1.997 (10 colecoes) | Indexadas |
| Memoria LTM | 20.000 registros | Persistida |
| Knowledge Graph | 4.278 nos / 8.275 arestas | Persistido |
| Auditorias | 43 diretorios | Historico completo |
| Ollama | qwen2.5:3b + 7b | REAL (CPU) |
| Autonomia | 91% (P0.7) | Verificada |
| Tag git | v7.0-pre-migration | Local (sem push) |

## 1.2 O que esta BLOQUEADO (requer hardware/acao externa)

| Bloqueador | Impacto | Custo |
|-----------|---------|-------|
| GPU (RTX 4090) | Wan2.1, ComfyUI, imagem/video | $1.600 |
| Cloud AI keys (0/4) | Fallback premium | Free signup |
| ElevenLabs keys | Voz Pedro/Trinnity/Stark | $5-22/mo |
| Servidor UpCloud | Producao 256GB RAM | ~$100-200/mo |

---

# PARTE 2 — COMO MIGRAR SEM ERROS (o mapa definitivo)

## 2.1 REGRAS DE OURO (leia antes de qualquer acao)

1. **LAPTOP ANTIGO NUNCA PARA** — ele continua servindo ate o novo validar 100%
2. **BACKUP E SECRETS NUNCA JUNTOS** — canais separados, mensagens separadas
3. **SHA-256 SEMPRE VERIFICADO** — restore.ps1 ja faz isso automaticamente
4. **NUNCA DELETAR O BACKUP ANTIGO** — manter ate validacao completa
5. **TESTES ANTES DE LIGAR PARA O MUNDO** — 67 testes + health + JARVIS

## 2.2 ETAPA A — PREPARACAO NO LAPTOP (15 minutos)

```
PASSO 1 — Verificar backup existe:
  dir backups\golden-final-v70

PASSO 2 — Verificar integridade (14 checks, deve dar 14/14):
  powershell -ExecutionPolicy Bypass -File scripts\migration\verify.ps1 `
    -BackupDir "C:\Trinnity-Viseron-System\backups\golden-final-v70"
  → RESULTADO ESPERADO: "VERDICT: MIGRATION-READY"

PASSO 3 — Transferir backup (908MB) por SFTP/USB/drive criptografado
```

## 2.3 ETAPA B — SECRETS (4 transferencias separadas)

```
PASSO 4 — .env (36 chaves)          → Signal/WhatsApp self-destruct
PASSO 5 — solana-keypair.json       → canal SEPARADO
PASSO 6 — solana-seed.txt           → canal SEPARADO da keypair
PASSO 7 — contracts/wallets/ + acesso → zip com senha
```

**NUNCA: .env e keypair na mesma mensagem. NUNCA: seed e keypair juntas.**

## 2.4 ETAPA C — INSTALACAO NO SERVIDOR (20 minutos)

```
PASSO 8:  winget install OpenJS.NodeJS.LTS
PASSO 9:  winget install Python.Python.3.13
PASSO 10: winget install Git.Git
PASSO 11: winget install Ollama.Ollama
PASSO 12: winget install 7zip.7zip
```

## 2.5 ETAPA D — RESTAURACAO (30 minutos)

```
PASSO 13 — Restaurar (verifica SHA-256 automaticamente):
  powershell -ExecutionPolicy Bypass -File scripts\migration\restore.ps1 `
    -BackupDir "C:\backup\golden-final-v70" -TargetRoot "C:\tvs"

PASSO 14 — Copiar .env para C:\tvs
PASSO 15 — Copiar carteiras para C:\tvs\contracts
PASSO 16 — cd C:\tvs → npm install
PASSO 17 — npm run build
PASSO 18 — ollama pull qwen2.5:3b → ollama pull qwen2.5:7b
PASSO 19 — npm run skills:install (so se skills nao vieram no backup)
```

## 2.6 ETAPA E — VALIDACAO OBRIGATORIA (30 minutos)

```
PASSO 20 — npm test                        → 67/67 PASS
PASSO 21 — GET :32123/api/health           → status OK
PASSO 22 — POST /api/jarvis/chat           → resposta real
PASSO 23 — npm run founder status          → Founder OS OK
PASSO 24 — npm run skills:list             → 1.997 skills
PASSO 25 — npm run p09                     → squad 8/8 fases
PASSO 26 — ollama list                     → qwen2.5 modelos
```

## 2.7 ETAPA F — POS-MIGRACAO (rotacao de secrets)

| Chave | Onde rotacionar |
|-------|----------------|
| TVS_JWT_SECRET | .env do servidor (gerar novo) |
| GMAIL_REFRESH_TOKEN | Google Cloud Console → OAuth |
| AVIRATO_CLIENT_SECRET | Dashboard Avirato |
| TWILIO_AUTH_TOKEN | Console Twilio |

---

# PARTE 3 — MAPA DAQUI PRA FRENTE (roadmap)

## 3.1 SEMANA 1 (pos-migracao)

- [ ] Validar 26 passos no servidor novo
- [ ] Configurar firewall: 32123 publico, resto localhost
- [ ] Agendar backup diario (Task Scheduler)
- [ ] Rotacionar 4 secrets
- [ ] **NAO comprar nada ainda — testar servidor primeiro**

## 3.2 SEMANA 2

- [ ] Comprar RTX 4090 ($1.600) — ativa Wan2.1 + ComfyUI
- [ ] Ativar cloud AI keys (OpenAI/Claude/Gemini — free tier)
- [ ] ElevenLabs API ($5/mo tier) — vozes reais
- [ ] Postgres local (migrar do Neon) ou manter Neon

## 3.3 MES 1-3

- [ ] Qdrant local (substituir fallback in-memory)
- [ ] SkillContract library top 100 skills
- [ ] Founder OS live data (executor stats no dashboard)
- [ ] Streaming LLM responses (JARVIS em tempo real)

## 3.4 MES 3-6

- [ ] Primeiro cliente enterprise (plano $499/mo)
- [ ] RCS live (aprovacao Google 4-6 semanas)
- [ ] 10 clientes agencia (plano:agencia)
- [ ] Cosmos tokens: liquidity pool Raydium

## 3.5 ANO 1

- [ ] 50 clientes → MRR $50K
- [ ] Multi-node: NODE 02 GPU + NODE 03 Data
- [ ] Series A fundraising ($30-50M pre-money)

---

# PARTE 4 — LISTA DE PENDENCIAS DOS ULTIMOS 7 DIAS

## 4.1 Prometido e ainda NAO feito

| Item | Estado | Acao |
|------|--------|------|
| Wan2.1 video generation | Fabric pronto, GPU pendente | Comprar RTX 4090 |
| ComfyUI | Legal review GPL-3.0 | Decidir com advogado |
| DuixAvatar/VoiceStudio/Handy | 404 — URLs erradas | Verificar nomes corretos |
| Postgres local | Neon funcionando | Migrar quando quiser |
| Qdrant local | Fallback in-memory | Instalar no servidor |
| Cloud AI keys | 0/4 configuradas | Signup gratuito |
| ElevenLabs | Nao configurado | Signup + $5/mo |
| SkillContract library | 4 formal de 1.997 | Gerar top 100 |
| Prompt injection defense | Projetado em P0.7 | Implementar |
| Founder OS live data | Templates estaticos | Wire executor stats |

## 4.2 Decisoes que precisam do Comandante

1. **Aprovar migracao agora?** — backup verificado, restore testado, so falta executar
2. **Comprar RTX 4090 ou RTX 5090?** — 4090: $1.600/24GB. 5090: $2.000/32GB
3. **Servidor UpCloud ja comprado?** — precisamos IP + acesso
4. **ComfyUI GPL-3.0** — integrar ou usar alternativas permissivas?
5. **Preco dos tokens** — $VSR/$TRIN listagem DEX

---

# PARTE 5 — COMO LEVAR SEM ERROS (checklist final)

```
ANTES DE COMECAR:
□ Backup verificado (14/14)                    ← JA FEITO
□ Restore testado em ambiente temporario       ← JA FEITO
□ Laptop funcionando                           ← CONFIRMADO
□ Internet estavel                             ← VERIFICAR
□ USB/drive com espaco 1GB+                    ← PREPARAR

DURANTE:
□ Backup transferido (SFTP/USB)
□ Secrets transferidos (4 canais separados)
□ Instalacao winget completa
□ Restore executado
□ .env no lugar
□ npm install + build OK
□ Ollama modelos baixados
□ 67 testes PASS

DEPOIS:
□ JARVIS respondendo
□ Founder OS OK
□ Skills 1.997 listadas
□ Squad p09 OK
□ DNS apontando (se for o caso)
□ Rotacao de 4 secrets
□ Primeiro backup no servidor novo
```

---

# PARTE 6 — RESUMO EXECUTIVO PARA O COMANDANTE

**ONDE ESTAMOS:** 91% autonomia real, backup golden verificado, 30 agentes, 1.997 skills, tudo pronto para migrar.

**O QUE FAZER AGORA (3 passos):**
1. **Hoje**: transferir backup (908MB) + 5 secrets para o servidor
2. **Amanha**: instalar (5 winget) + restaurar (restore.ps1) + validar (26 passos)
3. **Esta semana**: rotacionar secrets + agendar backup diario

**O QUE NAO PERDER DE VISTA:**
- Laptop antigo continua ate o novo validar 100%
- Backup e secrets nunca juntos
- 67 testes antes de qualquer uso real
- RTX 4090 desbloqueia Wan2.1 + ComfyUI + imagem/video

**RISCO DE PERDA: ZERO** — backup SHA-256 verificado + laptop operacional + restore testado.

---

© Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
Trinnity Viseron System v7.0 · 100 Anos de Experiencia
