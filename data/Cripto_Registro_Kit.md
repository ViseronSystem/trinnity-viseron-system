# KIT DE REGISTRO CRIPTO — TVS (2026-08-23)

Tu parte: 5 minutos por plataforma (clic + email + verificación). Todo lo demás ya está automatizado.

## Prepara una vez
- Email dedicado: `tvs.opportunities@<tu-dominio>` (Gmail nuevo vale)
- Bio lista para copiar (pegar tal cual en cada perfil):

> Security researcher & AI systems builder. Full-stack TypeScript/Node/Rust.
> Building Trinnity Viseron System (TVS) — autonomous multi-agent OS with
> E2E verified task execution, crypto tooling and Solana SPL tokens ($VSR/$TRIN).
> Focused on web3 security research and agentic automation.

## Plataformas (en orden de prioridad)

### 1. Immunefi — bug bounties crypto ($1K–$10M)
- Registro: https://immunefi.com/ → "Sign up" (email)
- Perfil → activar 2FA → completar skills: Smart Contracts, Web/API
- Tras registro: avisarme el nombre de usuario → conecto el seguimiento de bounties al radar

### 2. Devpost — hackathones ($40K–$740K activos HOY)
- Registro: https://devpost.com/ → "Sign up"
- Ya tenemos el radar corriendo (`npm run cripto:oportunidades`)
- Primer target sugerido: "All Things Agentic Hackathon" ($180K) — encaja con el TVS

### 3. HackerOne — bug bounties tradicional
- Registro: https://www.hackerone.com/ → "For Hackers" → Sign up
- Tras registro: Settings → API Token → pasarme SOLO el token (queda en .env local, nunca en git)
- Con token: integro consultas automáticas de programas/reporte al sistema

### 4. Galxe + Zealy — airdrops legítimos por quests
- https://galxe.com/ y https://zealy.io/ → login con email o wallet
- REGLA: usar SOLO wallets quemables de la fábrica (`npm run cosmos:wallets -- 10 --prefix airdrop`), NUNCA la wallet oficial `Ak3J4h...`
- El radar filtra estafas automáticamente (patrones: pide seed / paga para reclamar)

## Reglas de oro (no negociables)
1. Seed phrase NUNCA se introduce en ninguna web/app — ni "para verificar", nunca.
2. Airdrop que exige pagar primero = estafa. El radar ya los marca FLAG.
3. Wallet oficial del TVS no participa en airdrops/dapps nuevas — solo wallets quemables.
4. Tokens raros que aparezcan solos en la wallet = trampa de aprobación. No interactuar.

## Estado del sistema cripto hoy
- Scanner puzzle #71: ACTIVO 24/7 (16 hilos, prioridad baja, log en tools/puzzle-scanner/scan.log, parar con stop24.ps1)
- Radar oportunidades: `npm run cripto:oportunidades` → data/crypto/oportunidades.json
- Faucets testnet listados para demos/dev sin coste
