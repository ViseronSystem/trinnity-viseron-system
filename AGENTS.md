# TRINNITY VISERON SYSTEM - AGENT RULES

Project: Trinnity Viseron System v5.0

Mission: Build an autonomous multi-agent AI superintelligence with 5000+ minds.

Copyright & Authority:
- Os direitos autorais do projeto pertencem a Pedro Costa (Comandante) e Trinnity Hurtado (Rainha).
- Pedro e Trinnity mandam em tudo: decisões finais, direção, prioridades e go-lives.
- Nenhuma decisão de arquitetura, domínio, receita ou publicidade é tomada sem a aprovação deles.
- O sistema e todos os seus artefactos devem manter e expor esta autoria (footer do site, APK, PDFs, créditos).

Rules:
1. Protect the core
2. Test before deployment
3. Document every change
4. Use local models (Ollama) when possible
5. Use cloud models for complex reasoning

Command:
- Pedro Costa - Commander
- Trinnity Hurtado - Queen

## Quick Start

```bash
npm install
npm run build
npm start
```

## Mobile App (Android APK + iOS IPA)

```bash
# Android APK
npm run build:android

# iOS IPA (macOS only)
npm run build:ios

# Both
npm run build:all

# Or via Expo:
npm run mobile:start
cd mobile && npx expo start
```

## Cross-Platform Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev mode with hot reload |
| `npm run restart` | Reinício à prova de congelamento: mata servidor + órfãos (OmniRoute/n8n) e verifica health/os/revenue |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run start` | Run compiled system |
| `npm run build:android` | Build APK for Google Play |
| `npm run build:ios` | Build IPA for Apple Store |
| `npm run build:apk-installer` | Windows installer (Setup.exe) that delivers the APK + shortcuts + instructions |
| `npm run test` | Run core + web tests (67 total) |
| `npm run test:core` | Run core tests |
| `npm run test:web` | Run web layer tests (auth/billing/onboarding/email/messaging) |
| `npm run demo` | Demo operacional real (HTTP 9/9 endpoints) |
| `npm run lint` | TypeScript check |
| `npm run backup` | Run daily backup |
| `npm run backup:schedule` | Schedule auto-backup (Task Scheduler) |
| `npm run skills:install` | Install/update skill collections (autonomous) |
| `npm run skills` | Skills CLI (list, search, info) |
| `npm run init` | Build + backup + start |
| `npm run init:full` | Full system initialization |
| `npm run deploy` | Deploy to GitHub + Vercel |
| `npm run deploy:github` | Deploy to GitHub only |
| `npm run deploy:vercel` | Deploy to Vercel only |
| `npm run deploy:domain` | Configura domínio novo no .env |
| `npm run deploy:domain:check` | Valida DNS/HTTPS do domínio |
| `npm run domain:check` | Diagnóstico do domínio trinnityviseron.com (NS/DNS/HTTPS + passo único para ativar) |
| `npm run domain:novo` | Go-live do domínio novo trinnityviseronsystem.io (registo + NS + Vercel + Render) |
| `npm run domain:novo:check` | Valida estado do trinnityviseronsystem.io (registo/DNS/HTTPS) |
| `npm run update:auto` | Self-update: pull + install + PDFs + build + testes + deploy |
| `npm run docs:100` | Gera data/Viseron_100_Melhorias_Integracao.pdf |
| `npm run report:update` | Gera data/Viseron_Update_Report_<data>.pdf |
| `npm run report:state` | Gera data/Viseron_Relatorio_Estado.pdf (o que podes fazer + estado real do sistema) |
| `npm run docs:revenue` | Gera data/Viseron_Pipeline_Receita.pdf (passo a passo cobranças reais + modelo de receita) |
| `npm run audit:arkom` | Auditoria operacional ARKOM/AIOX (scan/diagnóstico/fix/verdicto → data/Viseron_Audit_ARKOM.pdf) |
| `npm run demo:jarvis` | Demo do JARVIS (conversa + autonomia real sobre o sistema) |
| `npm run models:pull` | Baixa os modelos IA locais (qwen2.5:3b + 1.5b via Ollama) para IA real sem chave |
| `npm run go-live:stripe` | Cria os 3 planos no Stripe (se preferires Stripe em vez de Avirato) |
| `npm run demo:avirato` | Testa checkout Avirato real (cria sessão de pagamento, ex: `-- core`) |
| `npm run cofre` | Gera data/Viseron_Cofre_Credenciais.pdf (todas as chaves/tokens/logins — CONFIDENCIAL, gitignored) |
| `npm run pdfs:all` | Regenera TODOS os PDFs (manuais + pitches + roadmap + 100 melhorias + relatórios) — correr a cada atualização/comando novo |
| `npm run gmail:setup` | Setup Gmail API (OAuth consent → refresh token) para o agente de atendimento |
| `npm run demo:email` | Demo dos fluxos de email (verify/reset/invoice/agent) |
| `npm run demo:messaging` | Demo de mensageria E2E (contactos/conversas/grupos/leitura) |
| `npm run cudacyclone` | GPU puzzle solver vendido em tools/CUDACyclone (GPL). Subcomandos: status, build, run, benchmark |

## TVS OS — AI-Native Operating System v1

TVS OS é a camada de sistema operativo sobre o kernel: Process Manager, Virtual FS, App Store, Package Manager, Security Center e TVS Desktop (web).

| Comando | Descrição |
|---------|-----------|
| `npm run tvs` | Estado geral do TVS OS (kernel, agentes, watchdog, processos) |
| `npm run tvs:list` | Apps instalados |
| `npm run tvs:install <id>` | Instalar app/agente/squad/módulo |
| `npm run tvs:uninstall <id>` | Desinstalar |
| `npm run tvs:update` | Recarregar specs/manifests |
| `npm run tvs:doctor` | Diagnóstico de saúde (pkg doctor) |
| `npm run test:os` | Testes do TVS OS (25) |

API TVS OS em `/api/os` (processes/spawn/kill, fs/list/read/write, store/install/uninstall, pkg/install/uninstall/update/doctor/list, security/authorize). TVS Desktop em `/os`. Código: `src/os/`. Estado persistido em `data/tvs-os/`.

## Domínio novo

Sítio: **www.trinnityviseronsystem.io** — **NO AR** (registo ativo, zona Cloudflare, site na Vercel, API no Render, HTTPS 200).
Cada deploy regenera PDFs automaticamente; cada update gera relatório PDF e faz push ao GitHub.

## API Web (Phase 0)

| Endpoint | Descrição |
|----------|-----------|
| `POST /api/auth/register` | Registo multi-tenant (org → tenant + owner + JWT) |
| `POST /api/auth/login` | Login JWT (rate-limited) |
| `GET /api/auth/me` | Perfil autenticado |
| `PATCH /api/auth/profile` | Atualizar nome/perfil |
| `GET /api/auth/users` | Listar membros (owner/admin) |
| `GET /api/billing/plans` | Planos Core $29 / Pro $99 / Enterprise $499 |
| `POST /api/billing/checkout` | Criar sessão de checkout (Avirato Payments primário, Stripe opcional, manual dev) |
| `POST /api/billing/webhook` | Webhook de pagamento → upgrade do plano (Avirato HMAC ou Stripe) |
| `GET /api/billing/subscription` | Estado da subscrição/trial |
| `GET /api/onboarding/templates` | 5 templates (conteúdo, atendimento, código, Squad AIOX, Arkom) |
| `POST /api/onboarding/apply` | Materializa agentes no workspace do tenant |
| `GET /api/messaging/status` | Estado da mensageria + crypto (x25519/aes-256-gcm) |
| `POST /api/messaging/key` | Gerar/obter chave pública X25519 do utilizador |
| `GET /api/messaging/contacts` | Listar contactos |
| `POST /api/messaging/contacts` | Adicionar contacto por email |
| `GET /api/messaging/conversations` | Listar conversas + unread |
| `POST /api/messaging/conversations` | Criar conversa direta |
| `POST /api/messaging/groups` | Criar grupo |
| `GET /api/messaging/conversations/:id/messages` | Ler mensagens (desencriptadas para o membro) |
| `POST /api/messaging/conversations/:id/messages` | Enviar mensagem E2E (cifrada por recetor) |
| `POST /api/messaging/conversations/:id/read` | Marcar conversa como lida |
| `GET /api/jarvis/status` | Estado do JARVIS (provider, capacidades, autonomia) |
| `POST /api/jarvis/chat` | Conversar com o JARVIS (sessão + execução real, rate-limited 30/min) |
| `GET /api/revenue/readiness` | Go-live de receita real: Stripe, webhook, Gmail, email provider, domínio, Postgres |
| `GET /api/ai/status` | Estado da IA real: providers disponíveis (OpenAI/Claude/Gemini/Grok/Ollama/OmniRoute) + modelo ativo |
| `POST /api/calls/twilio/inbound` | Webhook Twilio de chamada recebida → responde TwiML (Gather de voz) |
| `POST /api/calls/twilio/gather` | Webhook Twilio do resultado de voz → grava transcrição + analisa com IA local + aprende + responde TwiML (loop) |
| `POST /api/calls/twilio/status` | Webhook Twilio de estado de chamada (completar/hangup/duração) |
| `POST /api/calls/outbound` | Dispara chamada outbound via Twilio REST (`{to}`) |
| `GET /api/calls/logs` | Histórico de chamadas (`data/calls/calls.jsonl`) |
| `GET /api/calls/learned` | Conhecimento aprendido das chamadas (`data/knowledge/call-learned.jsonl`) |
| `GET /api/calls/status` | Estado: totais inbound/outbound + itens aprendidos + Twilio configurado |
| `POST /api/sites/generate` | Agente criador de sites: `{name, description}` → site HTML completo (conteúdo gerado por IA local) |
| `GET /api/sites/list` | Sites gerados (metadados) |
| `GET /api/sites/:slug` | Preview de um site gerado (HTML) |
| `GET /api/sites/status` | Total de sites gerados |
| `POST /api/apps/generate` | Agente criador de APKs: `{name, description}` → scaffold Expo completo (App.tsx + app.json + package.json, conteúdo por IA local) |
| `GET /api/apps/list` | Apps geradas (metadados) |
| `GET /api/apps/:slug` | Metadados + árvore de ficheiros de uma app |
| `GET /api/apps/:slug/source` | Conteúdo de todos os ficheiros da app (JSON) |
| `GET /api/apps/status` | Total de apps geradas |
| `GET /api/health` | Health + db + billing + contagens |
| `GET /api/metrics` | Métricas de uso |

Variáveis de ambiente: `AVIRATO_API_KEY`+`AVIRATO_WEBCODE`+`AVIRATO_CLIENT_SECRET` (cobranças — primário), `DATABASE_URL` (Postgres opcional), `STRIPE_SECRET_KEY` (alternativo), `GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN`, `TVS_JWT_SECRET`.

> Estado receita (2026-08): **6/6 pronto** — Avirato live, webhook HMAC, Gmail real, email provider gmail, `TVS_PUBLIC_URL` configurado, **Postgres Neon** (`DATABASE_URL`) com 10 tabelas migradas e `usage_events` a gravar registos/logins. `GET /api/revenue/readiness` → `ok=true`. Reinício sem freeze: `npm run restart`.

## AI Providers

Default: **Ollama** (local, no API key needed)

To enable cloud AI, set in `.env`:
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- XAI_API_KEY

