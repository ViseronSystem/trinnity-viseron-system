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
| `npm run plan:strategic` | Gera data/Viseron_Plano_Estrategico_<data>.pdf + data/Viseron_Roadmap_Tecnico_<data>.pdf (o que falta implementar + comandos para voltar a cada etapa) |
| `npm run pdfs:all` | Regenera TODOS os PDFs (manuais + pitches + roadmap + 100 melhorias + relatórios) — correr a cada atualização/comando novo |
| `npm run gmail:setup` | Setup Gmail API (OAuth consent → refresh token) para o agente de atendimento |
| `npm run demo:email` | Demo dos fluxos de email (verify/reset/invoice/agent) |
| `npm run demo:messaging` | Demo de mensageria E2E (contactos/conversas/grupos/leitura) |
| `npm run composio:status` | Estado da ligação ao Composio (consumo MCP de ferramentas externas) |
| `npm run composio:connect` | Liga ao Composio e regista as ferramentas no ToolManager |
| `npm run contas:pdf` | Gera data/Viseron_Contas_Conectadas.pdf + snapshot JSON das apps ligadas |
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
| `POST /api/business/agents` | Criar agente de atendimento para uma empresa (JWT: `name`, `description`, `greeting`, `knowledge[]`) |
| `GET /api/business/agents` | Listar agentes da minha empresa |
| `GET /api/business/agents/:id` | Detalhe do agente + histórico de mensagens |
| `POST /api/business/agents/:id/messages` | Cliente fala com o agente → resposta IA com contexto da empresa (knowledge base) |
| `DELETE /api/business/agents/:id` | Remover agente |
| `GET /api/business/status` | Total de agentes de empresas |
| `GET /api/composio/status` | Estado do Composio (MCP): configurado, ligado, nº de ferramentas, último erro |
| `GET /api/composio/tools` | Lista as ferramentas Composio disponíveis (Gmail/Slack/GitHub/...) |
| `POST /api/composio/connect` | Liga ao Composio (JWT) e carrega a lista de ferramentas |
| `POST /api/composio/tools/:name` | Executa uma ferramenta Composio (JWT) — body `{ "arguments": {...} }` |
| `GET /api/health` | Health + db + billing + contagens |
| `GET /api/metrics` | Métricas de uso |

Variáveis de ambiente: `AVIRATO_API_KEY`+`AVIRATO_WEBCODE`+`AVIRATO_CLIENT_SECRET` (cobranças — primário), `DATABASE_URL` (Postgres opcional), `STRIPE_SECRET_KEY` (alternativo), `GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN`, `TVS_JWT_SECRET`.

> Estado receita (2026-08): **6/6 pronto** — Avirato live, webhook HMAC, Gmail real, email provider gmail, `TVS_PUBLIC_URL` configurado, **Postgres Neon** (`DATABASE_URL`) com 10 tabelas migradas e `usage_events` a gravar registos/logins. `GET /api/revenue/readiness` → `ok=true`. Reinício sem freeze: `npm run restart`.

## Composio (consumo MCP)

O TVS liga-se a **https://connect.composio.dev/mcp** como cliente MCP (`@modelcontextprotocol/client`) e expõe as ferramentas externas (Gmail, Slack, GitHub, Calendário, Notion, ...) aos agentes e ao JARVIS.

- `.env`: `COMPOSIO_API_KEY=<chave>` (obrigatória; sem ela o status mostra `configured: false`). A chave é a **consumer API key** do Composio (começa por `ck_`), obtida em https://dashboard.composio.dev → sidebar **AI Clients**. O handshake MCP envia o header `x-consumer-api-key`.
- O Composio Connect expõe **7 meta-tools** (`COMPOSIO_SEARCH_TOOLS`, `COMPOSIO_GET_TOOL_SCHEMAS`, `COMPOSIO_MULTI_EXECUTE_TOOL`, `COMPOSIO_MANAGE_CONNECTIONS`, `COMPOSIO_WAIT_FOR_CONNECTIONS`, `COMPOSIO_REMOTE_WORKBENCH`, `COMPOSIO_REMOTE_BASH_TOOL`) que orquestram apps (descobrir → autorizar OAuth → executar).
- Núcleo: `src/core/composio/ComposioBridge.ts` → `ViseronCore.composioBridge`; `connectComposio()` liga e regista as ferramentas no `ToolManager` (IDs `composio_<nome>`).
- Web: `GET /api/composio/status` e `/api/composio/tools` (público); `POST /api/composio/connect` e `/api/composio/tools/:name` (JWT).
- Comandos: `npm run composio:status` e `npm run composio:connect`.
- `GET /api/jarvis/memory` (JWT): memória persistente do JARVIS — operações executadas, totais por tool, últimos 25 registos (ficheiro `data/knowledge/jarvis-memory.jsonl`).
- `npm run contas:pdf` → gera `data/Viseron_Contas_Conectadas.pdf` + snapshot `data/tvs-os/composio-accounts.json` com o estado REAL de todas as apps (ativas/pendentes/adiadas). Regenerar a cada mudança de ligações.

## Trilingue (ES · PT · EN)

Regra global: **todo o conteúdo e respostas devem existir nos 3 idiomas** — Inglês, Espanhol e Português. O JARVIS responde SEMPRE no idioma em que o utilizador escreve (deteta `es`/`pt`/`en`; por omissão **espanhol**, idioma de Pedro Costa e Trinnity Hurtado). Para os comandantes, a primeira língua é o espanhol; tudo o que for produzido tem de conter os 3 idiomas (PDFs, site, APK, respostas).

## Memória e auto-aprendizagem (nunca esquece)

- Cada operação que o JARVIS executa (intents, tools, apps Composio, emails, posts) é gravada em `data/knowledge/jarvis-memory.jsonl` com timestamp.
- O JARVIS lembra-se do que fez: pergunta "¿qué has hecho?" / "o que já fizeste?" / "what have you done?" → intent `memory_recall`.
- Esta memória é a base de auditoria contínua do **squad AIOX** (com Pedro Costa e Trinnity Hurtado) e de auto-aprendizagem (aprender com cada operação).
- Regenerar relatórios/PDFs a cada atualização e incluir sempre o que mudou.

## Deploy a cada atualização

Cada atualização feita deve: (1) commit + push ao **GitHub** (`npm run deploy:github`), (2) deploy do **site** (`npm run deploy:vercel`), (3) rebuild do **APK** (`npm run build:android`). O `npm run update:auto` faz pull + install + PDFs + build + testes + deploy automaticamente.

## AI Providers

Default: **Ollama** (local, no API key needed)

To enable cloud AI, set in `.env`:
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- XAI_API_KEY

