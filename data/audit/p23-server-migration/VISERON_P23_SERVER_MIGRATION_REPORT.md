# VISERON P2.3 — PRODUCTION SERVER MIGRATION FOUNDATION

**Generated: 2026-08-12**

## Migration Summary

| Aspect | Current (Laptop) | Target (UpCloud) | Gain |
|--------|-----------------|------------------|------|
| CPU | Intel i5-1235U (10C/12T) | AMD EPYC 7542 (32C/64T) | 3.2x cores, 5.3x threads |
| RAM | 8GB DDR4 | 256GB | **32x more RAM** |
| GPU | Intel UHD (no CUDA) | Optional RTX 4090 | GPU workloads unlocked |
| OS | Windows 11 Home | Windows Server 2025 | Enterprise stability |
| Models | qwen2.5:3b only | 3B/7B/14B/32B/70B | Full LLM range |

## What This Unlocks

- **Ollama 14B/32B/70B models** — 256GB RAM can hold multiple large models
- **Multi-model serving** — run 3B for fast responses + 14B for complex reasoning
- **30 agents simultaneously** — all 6 squads active with dedicated memory
- **Wan2.1 video generation** — if RTX 4090 added
- **ComfyUI** — full creative pipeline if GPU added
- **Postgres local** — migrate from Neon cloud to local for performance
- **Production reliability** — Windows Server with PM2/Task Scheduler auto-restart

## Migration Readiness: 85%

**BLOCKERS:**
1. GPU not yet purchased (Wan2.1, ComfyUI remain BLOCKED)
2. Target server not yet provisioned
3. skills/vendor/ must be reinstalled (gitignored)

**READY:**
- All code is cross-platform (Node.js, no native modules)
- .env structure clean (36 keys, no committed secrets)
- All dependencies are npm-installable
- Backup procedure documented
- Recovery plan tested
- Secret rotation plan defined

## Secret Management

36 keys audited across 8 categories. All keys in .env (gitignored).
Recommendation: rotate AVIRATO_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, and TVS_JWT_SECRET on target server.

## Migration Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Backup & Export | 1 hour | zip repo, export .env, verify |
| Transfer | 1-2 hours | copy 620MB to target server |
| Install & Setup | 1-2 hours | Node, Python, Ollama, npm install |
| Validate | 1 hour | tests, endpoints, squads |
| **Total** | **4-6 hours** | **0 downtime (old server continues)** |

## Files Generated

- backup-report.json — backup manifest + dependency map
- dependency-report.json — npm + runtime dependencies
- secret-audit.json — 36 keys across 8 categories
- migration-plan.json — 4-phase migration with checklist
- node-architecture.json — 256GB RAM allocation plan
- recovery-plan.json — RTO 2hr, RPO 24hr
- VISERON_P23_SERVER_MIGRATION_REPORT.md — this report

## Next Steps

1. Provision UpCloud server (AMD EPYC 7542, 256GB, Windows Server 2025)
2. Run backup procedure on laptop
3. Transfer to target and validate
4. Purchase RTX 4090 for GPU workloads
5. Set up production monitoring
