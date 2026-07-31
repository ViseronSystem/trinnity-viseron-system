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
| `npm run test` | Run core tests |
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

## AI Providers

Default: **Ollama** (local, no API key needed)

To enable cloud AI, set in `.env`:
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- XAI_API_KEY

