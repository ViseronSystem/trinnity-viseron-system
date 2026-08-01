# Trinnity Viseron System (TVS)

**Sistema Operacional Multi-Agente de IA que trabalha sozinho.**  
Autonomia · Evolução contínua · Integrações em produção.

> v5.0 → v6.0 · Command: **Pedro Costa (Supreme Commander)** · Queen: **Trinnity Hurtado (Chief Evolution Officer)**

---

## O que é

O TVS não é um chatbot nem um modelo único: é uma **plataforma de agentes de IA autônomos** com memória persistente, hierarquia de comando e auto-recuperação. Ele planeja, executa, aprende e evolui sem supervisão humana.

- **5,000+ agentes** com memória, papéis e capacidades
- **4 ciclos autônomos**: HyperLearning, AutoEvolution, AutoLearning, AutoPilot
- **Memória STM/LTM** persistente em disco (consolidação automática)
- **Model Router**: Ollama (local) + OpenAI / Anthropic / Gemini / Grok + OmniRoute (290+ provedores)
- **Auto-recuperação**: nenhum erro derruba o sistema
- **Multi-plataforma**: Web, Mobile (APK), Desktop (Electron), CLI, REST API

## Estado atual (verificado)

| Área | Estado |
|------|--------|
| Testes | ✅ 14/14 passando (`npm test`) |
| TypeScript | ✅ sem erros (`npm run lint`) |
| Build | ✅ `npm run build` |
| Deploy | ✅ GitHub, Vercel, Render, Railway, Docker |
| Receita | 🟡 Em desenvolvimento (ver roadmap) |

## Quick Start

```bash
npm install
npm run build
npm start
```

Abra http://localhost:3000 (Dashboard WebOS).

### Desenvolvimento com hot reload

```bash
npm run dev
```

## Documentação

- [Pitch para Investidores v6.0](data/Viseron_Pitch_Investidores_v6.pdf)
- [Roadmap para Projeto Milionário](data/Viseron_Roadmap_Milionario.pdf)
- [Manual do Sistema](docs/pdfs/manual-viseron.pdf)
- [Diagrama de Operação](docs/TVS_Diagrama_Operacao.svg)

## Comandos Principais

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev mode com hot reload |
| `npm run build` | Compila TypeScript para dist/ |
| `npm start` | Roda o sistema completo |
| `npm test` | Roda testes de núcleo |
| `npm run lint` | TypeScript check |
| `npm run build:android` | Build APK para Google Play |
| `npm run build:ios` | Build IPA para Apple Store (macOS) |
| `npm run build:exe` | Build executável standalone |
| `npm run build:electron` | Build app desktop |
| `npm run backup` | Backup do sistema |
| `npm run deploy` | Deploy GitHub + Vercel |
| `npm run skills:install` | Instala skills (958+) |
| `npm run pitch` | Gera pitch para investidores |

## AI Providers

Padrão: **Ollama** (local, sem API key). Para cloud, configure no `.env`:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
XAI_API_KEY=...
```

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│           PRESENTATION LAYER (WebOS)            │
│  Browser Desktop · REST API · Socket.IO · PDF   │
├─────────────────────────────────────────────────┤
│           INTEGRATION LAYER (n8n + AI)          │
│  n8n Workflows · OmniRoute · Voice · Twilio     │
├─────────────────────────────────────────────────┤
│         SUPERINTELLIGENCE LAYER (Ensemble)      │
│  Multi-Provider Synthesis · HyperLearning · Evol │
├─────────────────────────────────────────────────┤
│           CORE ENGINE (Agent System)            │
│  5000+ Agents · Squads · Memory · Tools · Chain │
└─────────────────────────────────────────────────┘
```

## Roadmap

| Fase | Objetivo | KPI |
|------|----------|-----|
| Fase 0 | Fundação de produto (auth, billing, persistência) | 50 pilotos pagantes |
| Fase 1 | Confiança e docs (API, compliance, segurança) | Ativação ≥40% |
| Fase 2 | Go-to-market (SaaS público, canais) | €9K MRR |
| Fase 3 | Escala (enterprise, stores, multi-nó) | €72K MRR |
| Fase 4 | Ecossistema + rodada A | €240K MRR |

## Licença

Open source (código) + licenças comerciais para uso empresarial. Consulte os PDFs de documentação para detalhes.

---

© 2026 Trinnity Viseron System · [www.trinnityviseron.com](https://www.trinnityviseron.com) · [GitHub](https://github.com/ViseronSystem/trinnity-viseron-system)
