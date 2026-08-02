# TRINNITY VISERON SYSTEM - AGENT RULES

Project: Trinnity Viseron System v5.0

Mission: Build an autonomous multi-agent AI superintelligence with 5000+ minds.

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
| `npm run build` | Compile TypeScript to dist/ |
| `npm run start` | Run compiled system |
| `npm run build:android` | Build APK for Google Play |
| `npm run build:ios` | Build IPA for Apple Store |
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
| `npm run deploy:domain` | Configura domínio novo (www.trinnityviseronsystem.io) no .env |
| `npm run deploy:domain:check` | Valida DNS/HTTPS do domínio novo |
| `npm run update:auto` | Self-update: pull + install + PDFs + build + testes + deploy |
| `npm run docs:100` | Gera data/Viseron_100_Melhorias_Integracao.pdf |
| `npm run report:update` | Gera data/Viseron_Update_Report_<data>.pdf |
| `npm run report:state` | Gera data/Viseron_Relatorio_Estado.pdf (o que podes fazer + estado real do sistema) |
| `npm run docs:revenue` | Gera data/Viseron_Pipeline_Receita.pdf (passo a passo Stripe/Gmail/domínio + modelo de receita) |
| `npm run audit:arkom` | Auditoria operacional ARKOM/AIOX (scan/diagnóstico/fix/verdicto → data/Viseron_Audit_ARKOM.pdf) |
| `npm run demo:jarvis` | Demo do JARVIS (conversa + autonomia real sobre o sistema) |
| `npm run pdfs:all` | Regenera TODOS os PDFs (manuais + pitches + roadmap + 100 melhorias + relatórios) — correr a cada atualização/comando novo |
| `npm run gmail:setup` | Setup Gmail API (OAuth consent → refresh token) para o agente de atendimento |
| `npm run demo:email` | Demo dos fluxos de email (verify/reset/invoice/agent) |
| `npm run demo:messaging` | Demo de mensageria E2E (contactos/conversas/grupos/leitura) |
| `npm run cudacyclone` | GPU puzzle solver vendido em tools/CUDACyclone (GPL). Subcomandos: status, build, run, benchmark |

## Domínio novo

Sítio: **www.trinnityviseronsystem.io** (registo em Cloudflare/Namecheap/GoDaddy).
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
| `POST /api/billing/checkout` | Criar sessão de checkout (Stripe ou manual) |
| `POST /api/billing/webhook` | Webhook de pagamento → upgrade do plano |
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
| `GET /api/health` | Health + db + billing + contagens |
| `GET /api/metrics` | Métricas de uso |

Variáveis de ambiente: `DATABASE_URL` (Postgres opcional), `STRIPE_SECRET_KEY`, `TVS_JWT_SECRET`.

## AI Providers

Default: **Ollama** (local, no API key needed)

To enable cloud AI, set in `.env`:
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- XAI_API_KEY

