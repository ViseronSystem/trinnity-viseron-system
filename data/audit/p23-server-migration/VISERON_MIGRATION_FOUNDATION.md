# VISERON MIGRATION FOUNDATION v1.0
# Migration Architect: VISERON Autonomous Council
# Date: 2026-08-12

## REALITY CLASSIFICATION

### REAL (fully mapped + backed up):
- Source code: 249 TypeScript files, 108 CLI scripts, 7 test files (88MB)
- Agent specs: 10 runtime + 100 battalion + 30 squad agents
- Squad manifests: 12 (all 6 squads + legacy squads)
- Skills: 1,997 indexed in 10 collections (gitignored — MUST back up separately)
- Memory: 20,000 LTM records + 5 rotating backups
- Knowledge graph: 4,278 nodes / 8,275 edges (4.2MB)
- Experience records: 177KB index
- Audit history: 40 directories (complete P0.x → P2.3 trail)
- Config: 36 env keys catalogued (transfer manually)
- Credentials: Solana wallet + Gmail OAuth catalogued (secure transfer)

### PARTIAL:
- Skill contracts: 4 formal + 195 auto-inferred (10% coverage)
- GPU workloads: Wan2.1/ComfyUI BLOCKED until RTX 4090 purchased
- Postgres: cloud Neon → local migration optional

### BLOCKED:
- No data movement yet (per mandate: NOT moving anything)
- No architecture changes (per mandate: NOT modifying anything)

## BACKUP SYSTEM

| Component | File | Status |
|-----------|------|--------|
| Golden Backup | scripts/migration/backup.ps1 | READY |
| Restore | scripts/migration/restore.ps1 | READY |
| Verify | scripts/migration/verify.ps1 | READY |
| Intelligence Map | data/audit/p23-server-migration/intelligence-map.json | READY |

## MIGRATION CHECKLIST

1. [ ] Run backup.ps1 → creates golden backup with SHA-256 manifest
2. [ ] Run verify.ps1 → validates all 14 integrity checks
3. [ ] Transfer .env via secure channel (NEVER in backup zip)
4. [ ] Transfer contracts/solana-keypair.json + solana-seed.txt via secure channel
5. [ ] Transfer backup to UpCloud server
6. [ ] On target: run restore.ps1
7. [ ] npm install && npm run build
8. [ ] npm run skills:install (if skills not in backup)
9. [ ] npm run models:pull (Ollama models)
10. [ ] npm test (verify 67 tests pass)
11. [ ] npm run founder status (verify Founder OS)
12. [ ] Rotate: AVIRATO_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, TVS_JWT_SECRET

## INTEGRITY VERIFICATION

SHA-256 hash for every file in manifest.
Verify script checks:
- Manifest exists
- Total file count > 0
- SHA-256 matches 100%
- Source code present
- Agent specs ≥ 10
- Squad manifests ≥ 12
- Scripts ≥ 100
- Skills vendor present
- Data audits ≥ 40
- Memory database present
- Knowledge graph present
- package.json present
- Backup size > 100MB
- Timestamp recent

## DISASTER RECOVERY PLAN

| Scenario | Recovery | Time |
|----------|----------|------|
| Full system loss | Golden Backup restore | 2 hours |
| Data corruption | data/ restore from backup | 30 min |
| Secret leak | Rotate all keys + redeploy | 4 hours |
| Target server failure | Revert DNS to old laptop | 15 min |

## WAITING FOR APPROVAL

No files moved. No files deleted. No architecture changes.
All backup, restore, and verify systems are ready.
Awaiting Commander Pedro Costa approval to execute migration.
