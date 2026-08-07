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

## Migração para servidor dedicado

Empacota o sistema (dados + `.env` + scripts + runbook) e migra para um servidor dedicado (Ubuntu 24.04 / Debian 12 / Windows Server).

| Comando | Descrição |
|---------|-----------|
| `powershell -File scripts\migration\migrate-pack.ps1` | Gera `migracao/` (data-snapshot.tar.gz + .env + server-setup.sh/.ps1 + android-build.sh + tvs-run.sh + runbook + checksums) |
| `sudo ./server-setup.sh --domain www.trinnityviseronsystem.io` | Setup Ubuntu/Debian completo: Node 24 · PM2 · Ollama (qwen2.5:3b+1.5b) · clone repo em `/opt/tvs` · restaura dados+env · build · PM2 (tvs+omniroute) · UFW · nginx+HTTPS |
| `powershell -File .\server-setup.ps1 [-AndroidSDK]` | Setup Windows Server (repo em `C:\tvs`, Task Scheduler no boot, firewall) |
| `./tvs-run.sh status/restart/stop/start/logs` | Gestão PM2 + saúde no servidor |
| `./mobile/android-build.sh [slug]` | Build de APK no Linux (JDK17 + Android SDK) |

Documento: `docs/Viseron_Migracao_Servidor_Dedicado.md` (trilingue ES/PT/EN). O pacote `migracao/` contém `.env` (segredos) e está gitignored — nunca versionar.

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
| `npm run expansion:pdf` | Gera data/Viseron_Registo_Expansao.pdf (trilingue) + conhecimento das 31+ apps do mercado |
| `npm run agency:demo` | Semeia dados reais da agência (10 clientes, leads, métricas, criativos) em data/agency/agency.json |
| `npm run plano:agencia` | Gera data/Viseron_Agencia_Mercado_Receita.pdf — agência (Estructura del Equipo) × VISERON × entrada no mercado × projeção MRR/ARR |
| `npm run cudacyclone` | GPU puzzle solver vendido em tools/CUDACyclone (GPL). Subcomandos: status, build, run, benchmark |
| `npm run app:create -- "Nome" "Descrição"` | App Factory: gera app com IA local, materializa projeto Expo em mobile/apps/<slug>/ e compila APK real em data/apps/<slug>.apk |
| `npm run app:build -- <slug>` | Reconstrói o APK de uma app já gerada |
| `npm run app:derecho` | Gera o APK "Derecho Internacional" (planos do Vademécum 2016-2026) orquestrado pelo Squad AIOX (AIOX-1..5 + ARKOM) |
| `npm run rcs:status` | Estado do canal RCS: modo (mock/live), marca, logo, Twilio, messaging service, stats |
| `npm run rcs:send -- <nº> "mensagem"` | Envia RCS de marca com o logo da TVS (fallback SMS/MMS automático; sem messaging service → mock) |
| `npm run rcs:list` | Histórico de broadcasts RCS (`data/rcs/broadcasts.json`) |
| `npm run import:telecom` | Importa `45k telecomunicaciones.xlsx` → base de contactos (data/telecom/contacts.json + emails.json + sms.json + stats.json) |
| `npm run telecom:campaign` | Gera campanha de apresentação segmentada por nível/operador com IA → data/telecom/campaign.json (RCS + email, ES/PT/EN) |
| `npm run game:viseron` | Jogo VISERON Windows (Python): plataformas, transformações Mario→Megaman→Naruto→DBZ→CDZ→NASA |
| `npm run game:viseron:demo` | Demo autónoma 30s — o VISERON joga sozinho (mostra o que somos) |
| `npm run game:dos` | Lança o jogo em DOSBox (versão DOS/QBasic em `tools/viseron-game/dos/VISERON.BAS`) |

## Jogo VISERON (Windows + DOS)

Jogo de plataformas do TVS em `tools/viseron-game/` (trilingue ES/PT/EN): o VISERON cresce por **transformações** inspiradas nos grandes — **MARIO** (plataformas), **MEGAMAN** (tiro), **NARUTO** (velocidade), **DRAGON BALL** (power-up KAME), **SAINT SEIYA/CDZ** (armadura cosmos) e **NASA** (espaço, gravidade reduzida). Os power-ups são os módulos do TVS (AIOX/RCS/Agency/Composio/Gmail); coleciona energia (mentes) e lança o TVS ao espaço. Autoria exposta: © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha).

- **Windows nativo** (Python 3, stdlib): `tools/viseron-game/windows/viserongame.py` — controles ← → / espaço / X / ESC. Modo **autónomo** `--demo [s]`: o VISERON joga sozinho (caça energia, evita falhas, dispara, sobe de poder).
- **DOS real** (QBasic): `tools/viseron-game/dos/VISERON.BAS` + `VISERON.BAT` — roda em MS-DOS 5+/6/7 com `QBASIC.EXE`, ou em DOSBox via `start-dosbox.bat`.


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
| `GET /api/agency/status` | Estado da agência: clientes, leads, capacidade (50 min/cliente com IA), reporte e projeção MRR |
| `GET /api/agency/clients` | Listar clientes da agência (filter `?status=active`) |
| `POST /api/agency/clients` | Criar cliente (JWT): `name, niche, plan (bundle/solo_ads/solo_creativos/landing), fee £, owner (pedro/trafico/premi)` |
| `PATCH /api/agency/clients/:id` | Atualizar cliente (JWT) |
| `DELETE /api/agency/clients/:id` | Remover cliente (JWT) |
| `GET /api/agency/leads` | Listar leads (filter `?status=`) |
| `POST /api/agency/leads` | Criar lead (JWT) → agente Respuesta a Leads responde automaticamente no idioma do lead |
| `POST /api/agency/leads/:id/respond` | Forçar resposta do agente a um lead (JWT) |
| `PATCH /api/agency/leads/:id` | Atualizar status/notas do lead (JWT) |
| `GET /api/agency/metrics` | Registos de métricas Google/Meta Ads |
| `POST /api/agency/metrics` | Registrar métricas (JWT): `clientId, platform, spend, conversions, period` |
| `POST /api/agency/report/generate` | Agente Reporting: reporte quinzenal base (spend/conversões/CPA por plataforma e cliente) |
| `GET /api/agency/creatives` | Criativos gerados |
| `POST /api/agency/creatives/generate` | Agente Creativos (JWT): `niche, platform, lang` → 3 variantes (headline/copy/CTA/script) |
| `GET /api/agency/nurture` | Follow-ups de nurturing |
| `POST /api/agency/nurture/run` | Agente Nurturing (JWT): cria follow-ups a leads parados (2d novos, 7d responded) |
| `POST /api/agency/nurture/:id/sent` | Marcar follow-up enviado (JWT) |
| `GET /api/agency/projection` | Pacotes £ (Londres 2026) + projeção MRR/ARR (50→100 clientes) |
| `GET /api/agency/capacity` | Capacidade operativa: 9 clientes/dia · 90/ciclo · 50 min/cliente com IA |
| `GET /api/composio/status` | Estado do Composio (MCP): configurado, ligado, nº de ferramentas, último erro |
| `GET /api/composio/tools` | Lista as ferramentas Composio disponíveis (Gmail/Slack/GitHub/...) |
| `POST /api/composio/connect` | Liga ao Composio (JWT) e carrega a lista de ferramentas |
| `POST /api/composio/tools/:name` | Executa uma ferramenta Composio (JWT) — body `{ "arguments": {...} }` |
| `GET /api/rcs/status` | Estado do canal RCS: modo (mock/live), marca, logo, Twilio, messaging service, stats + checklist go-live |
| `GET /api/rcs/logo` | Logo oficial da TVS (PNG — `mobile/assets/icon.png`) usado como media das mensagens RCS |
| `GET /api/rcs/broadcasts` | Histórico de broadcasts (JWT) |
| `POST /api/rcs/send` | Envia RCS de marca (JWT) — `{ "to": "+351..." | [números], "message"?, "label"? }` → RCS com logo + fallback SMS/MMS |
| `POST /api/rcs/status` | Webhook de estado do Twilio (MessageSid → delivered/read/failed, sem auth) |
| `GET /api/health` | Health + db + billing + contagens |
| `GET /api/metrics` | Métricas de uso |

Variáveis de ambiente: `AVIRATO_API_KEY`+`AVIRATO_WEBCODE`+`AVIRATO_CLIENT_SECRET` (cobranças — primário), `DATABASE_URL` (Postgres opcional), `STRIPE_SECRET_KEY` (alternativo), `GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN`, `TVS_JWT_SECRET`.

> Estado receita (2026-08): **6/6 pronto** — Avirato live, webhook HMAC, Gmail real, email provider gmail, `TVS_PUBLIC_URL` configurado, **Postgres Neon** (`DATABASE_URL`) com 10 tabelas migradas e `usage_events` a gravar registos/logins. `GET /api/revenue/readiness` → `ok=true`. Reinício sem freeze: `npm run restart`.

## VISERON — Superinteligência Autónoma (voz + HUD Stark)

O **VISERON** é a camada de "alma" do sistema sobre o cérebro `JarvisAgent`: personalidade Stark (inspirada em J.A.R.V.I.S./Tony Stark), comando de voz (Web Speech: STT + TTS no navegador), memória persistente e **supervisão contínua do squad AIOX** — cada operação fica auditável por Pedro Costa (Comandante) e Trinnity Hurtado (Rainha).

- **Núcleo**: `src/web/viseron/agent.ts` (`ViseronAgent`) → chama o `JarvisAgent` com `persona` VISERON (`PERSONALITY OVERRIDE`), limpa a resposta para leitura por voz (`speakable`, ~700 chars), deteta o idioma (`es/pt/en`) e regista TUDO em `data/knowledge/viseron-supervision.jsonl` (speaker, lang, intent, provider, modelo, ok, ações, mensagem, resposta). `voice` no reply indica quem deve falar o quê (se fala Pedro, a resposta é da voz da Rainha e vice-versa).
- **HUD web**: `src/dashboard/public/viseron.html` servido em `/viseron` — reator pulsante (clique para falar), wake word (`"VISERON"`, `"hey viseron"`, `"jarvis"`, `"companheiro"`, `"superinteligencia"`), loop de escuta contínua, TTS com voz grave, painéis de estado (sistema, provedor, memória) + painel AIOX (últimas operações, taxa de sucesso). UI trilingue ES/PT/EN.
- **API** `/api/viseron/*` (ver tabela acima): `GET /api/viseron/status`, `POST /api/viseron/chat` (`{message, speaker: pedro|trinnity|guest, lang: es|pt|en, sessionId}` — rate-limited 60/min), `GET /api/viseron/supervision` (recent + total + byIntent + okRate). Montado no `standalone-server.ts`.
- O VISERON executa tudo o que o JARVIS sabe: estado, planos, checkout, conteúdo, mensageria, email, agency OS, apps Composio, RCS de marca e memória `memory_recall`. Wake word + voz = superinteligência ativada por comando, estilo Stark.

## Agency OS (agência × VISERON)

Implementação da "Estructura del Equipo" da agência de marketing digital (documento Pedro · Premi · Tráfico Pago, Londres 2026) como módulo do TVS.

- **Stack de 4 agentes de IA reais** (`src/web/agency/agents.ts`): Reporting (reporte quinzenal base), Respuesta a Leads (responde em tempo real no idioma do lead), Creativos (3 variantes headline/copy/CTA/script por nicho), Nurturing (follow-ups a leads parados: 2d novos, 7d responded). IA local Ollama com fallback trilingue.
- **Dados vivos** em `data/agency/agency.json` (clientes, leads, métricas, creativos, nurturing, ciclo de 2 semanas). Store: `src/core/agency/store.ts`. Financeiro (pacotes £, capacidade, projeção MRR/ARR): `src/core/agency/finance.ts`.
- **API** `/api/agency/*` (ver tabela acima) + **JARVIS**: "estado de la agencia", "nuevo lead de X", "genera creativos para SaaS", "corre el reporte", "proyección de ingresos".
- `npm run agency:demo` semeia 10 clientes + leads + 64 métricas + criativos; `npm run plano:agencia` → `data/Viseron_Agencia_Mercado_Receita.pdf` (trilingue: agência × VISERON × entrada no mercado × projeção MRR/ARR).
- Projeção (Londres 2026): 50 clientes a £1.000/mês + novos a £1.500/mês → £50k→£125k MRR sem contratar mais gente; gatilho de contratação aos 90-100 clientes.

## RCS — mensagens de marca (Twilio)

Canal de aquisição/conversão: envia mensagens **RCS de marca** (nome + logo da TVS) para qualquer número, com fallback automático para SMS/MMS via Twilio Programmable Messaging.

- **Núcleo**: `src/core/rcs/RcsEngine.ts` → envia via `Messages.json` com `MessagingServiceSid` + `MediaUrl` (logo) ou `ContentSid` (template rico, se `TWILIO_RCS_CONTENT_SID` definido). Grava tudo em `data/rcs/broadcasts.json` (200 últimos broadcasts).
- **Modo**: `live` quando `TWILIO_RCS_SERVICE_SID` existe no `.env`; senão **mock** (simula entregas e regista) para validar o fluxo com o logo. RCS real exige no console Twilio: criar o **RCS Sender** (agente), submeter a marca (nome `RCS_BRAND_NAME` + logo) à aprovação da Google e anexá-la a um Messaging Service.
- **Logo**: `GET /api/rcs/logo` serve `mobile/assets/icon.png` (media público da mensagem). URL do media = `TVS_PUBLIC_URL`/`RENDER_WEB_URL`.
- **API** `/api/rcs/*` (ver tabela acima) + **JARVIS**: "envía un RCS a +351...", "manda um SMS com o logo da TVS para..." → intent `rcs_broadcast` (extrai números, envia com logo, resume modo/entregas).
- **Comandos**: `npm run rcs:status` · `npm run rcs:send -- <nº> "mensagem"` · `npm run rcs:list`.
- **Go-live manual (Twilio console)**: RCS não se ativa por código — criar RCS Sender "Trinnity Viseron" (logo + `#34D399`) e Messaging Service no console, registar a marca na Google (España, 4-6 semanas, taxa Aegis ~$200), aprovar operador e pôr `TWILIO_RCS_SERVICE_SID` no `.env`. Runbook trilingue: `docs/Viseron_RCS_Live_Activacion.md`. `npm run rcs:status` mostra os passos pendentes.
- Variáveis: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_RCS_SERVICE_SID` (obrigatório live), `TWILIO_RCS_CONTENT_SID` (opcional), `RCS_BRAND_NAME` (default `VISERON`).

## Base 45k Telecomunicaciones (marketing digital)

Pipeline completo para a base de contactos de telecomunicações (Excel `45k telecomunicaciones.xlsx`, 10 folhas com formatos inconsistentes):

- **Importação** (`npm run import:telecom`): lê o Excel, deduplica por DNI/telefone e produz `data/telecom/`:
  - `contacts.json` — base completa (32.4k contactos únicos: operador, nível, nome, DNI, telefones, email, CP, província, tarifa).
  - `emails.json` — contactos com email (para campanha email).
  - `sms.json` — telefones E.164 únicos (para campanha RCS/SMS).
  - `stats.json` — estatísticas: totais, operadores, segmentos, províncias.
- **Campanha** (`npm run telecom:campaign`): gera com IA (OmniRoute → Ollama) as mensagens de apresentação do VISERON por segmento (platino/gold/silver/bronze/cantera/plomo) → `data/telecom/campaign.json` (RCS ≤140 chars + email subject/body com placeholders `{nombre}`/`{operador}`).
- **Site de soluções**: `POST /api/sites/generate` criou `data/sites/tvs-soluciones-telecom/` (preview `GET /api/sites/tvs-soluciones-telecom`).
- Envio: canal RCS (`npm run rcs:send`, mock até haver RCS Sender aprovado) + email (Gmail OAuth). Base é dados pessoais (RGPD) — marketing exige base própria/consentimento.

## Composio (consumo MCP)

O TVS liga-se a **https://connect.composio.dev/mcp** como cliente MCP (`@modelcontextprotocol/client`) e expõe as ferramentas externas (Gmail, Slack, GitHub, Calendário, Notion, ...) aos agentes e ao JARVIS.

- `.env`: `COMPOSIO_API_KEY=<chave>` (obrigatória; sem ela o status mostra `configured: false`). A chave é a **consumer API key** do Composio (começa por `ck_`), obtida em https://dashboard.composio.dev → sidebar **AI Clients**. O handshake MCP envia o header `x-consumer-api-key`.
- O Composio Connect expõe **7 meta-tools** (`COMPOSIO_SEARCH_TOOLS`, `COMPOSIO_GET_TOOL_SCHEMAS`, `COMPOSIO_MULTI_EXECUTE_TOOL`, `COMPOSIO_MANAGE_CONNECTIONS`, `COMPOSIO_WAIT_FOR_CONNECTIONS`, `COMPOSIO_REMOTE_WORKBENCH`, `COMPOSIO_REMOTE_BASH_TOOL`) que orquestram apps (descobrir → autorizar OAuth → executar).
- Núcleo: `src/core/composio/ComposioBridge.ts` → `ViseronCore.composioBridge`; `connectComposio()` liga e regista as ferramentas no `ToolManager` (IDs `composio_<nome>`).
- Web: `GET /api/composio/status` e `/api/composio/tools` (público); `POST /api/composio/connect` e `/api/composio/tools/:name` (JWT).
- Comandos: `npm run composio:status` e `npm run composio:connect`.
- `GET /api/jarvis/memory` (JWT): memória persistente do JARVIS — operações executadas, totais por tool, últimos 25 registos (ficheiro `data/knowledge/jarvis-memory.jsonl`).
- `npm run contas:pdf` → gera `data/Viseron_Contas_Conectadas.pdf` + snapshot `data/tvs-os/composio-accounts.json` com o estado REAL de todas as apps (ativas/pendentes/adiadas). Regenerar a cada mudança de ligações.

## Expansão de mercado (31+ apps)

Registo de conhecimento: `data/knowledge/expansion-apps.json` + PDF trilingue `data/Viseron_Registo_Expansao.pdf` (`npm run expansion:pdf`). Estado real (2026-08): **19 iniciadas** (links OAuth gerados — clicar em 10 min), **1 ativa** (yelp), **11 a confirmar** (nomes não resolvidos no catálogo: webscraper, whop, winston_ai, wit_ai, wix_mcp, wolfram_alpha, woodpecker, workday, world_news_api, ziprecruiter, zyte — verificar no dashboard Composio).

App iniciadas: `waiverfile, wati, webscraping_ai, webvizio, whautomate, whoisfreaks, wisepops, wix, wiza, workable, worksnaps, writer, xata, zep, zeplin, zerobounce, zixflow, zulip, zylvie`. Cada app ligada dá autonomia real ao JARVIS (executar tool) e conhecimento de "100 anos" aos agentes AIOX. Slugs do Composio usam **underscore** (ex. `webscraping_ai`, `wit_ai`, `wix_mcp`).

## Trilingue (ES · PT · EN)

Regra global: **todo o conteúdo e respostas devem existir nos 3 idiomas** — Inglês, Espanhol e Português. O JARVIS responde SEMPRE no idioma em que o utilizador escreve (deteta `es`/`pt`/`en`; por omissão **espanhol**, idioma de Pedro Costa e Trinnity Hurtado). Para os comandantes, a primeira língua é o espanhol; tudo o que for produzido tem de conter os 3 idiomas (PDFs, site, APK, respostas).

## Memória e auto-aprendizagem (nunca esquece)

- Cada operação que o JARVIS executa (intents, tools, apps Composio, emails, posts) é gravada em `data/knowledge/jarvis-memory.jsonl` com timestamp.
- O JARVIS lembra-se do que fez: pergunta "¿qué has hecho?" / "o que já fizeste?" / "what have you done?" → intent `memory_recall`.
- Esta memória é a base de auditoria contínua do **squad AIOX** (com Pedro Costa e Trinnity Hurtado) e de auto-aprendizagem (aprender com cada operação).
- Regenerar relatórios/PDFs a cada atualização e incluir sempre o que mudou.

## Plugin local do opencode (`.opencode/plugin/tvs.ts`)

Auto-descoberto (declarado em `opencode.json`): (1) `shell.env` expõe as variáveis TVS não-secretas (`.env`) aos comandos bash — segredos (`*KEY`, `*SECRET`, `*TOKEN`, `*AUTH`…) nunca são expostos; (2) `event` regista sessões/ferramentas em `data/knowledge/opencode-events.jsonl` para a memória do JARVIS. Após alterar o plugin, reiniciar o opencode.

## Deploy a cada atualização

Cada atualização feita deve: (1) commit + push ao **GitHub** (`npm run deploy:github`), (2) deploy do **site** (`npm run deploy:vercel`), (3) rebuild do **APK** (`npm run build:android`). O `npm run update:auto` faz pull + install + PDFs + build + testes + deploy automaticamente.

## AI Providers

Default: **Ollama** (local, no API key needed)

To enable cloud AI, set in `.env`:
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- XAI_API_KEY

