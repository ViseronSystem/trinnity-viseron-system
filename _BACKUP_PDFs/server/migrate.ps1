# ============================================================
# VISERON™ Migration Script — 194.62.97.30 → Novo Servidor
# Migra TODOS os dados, configs e código para o novo servidor
# © Pedro Costa · Trinnity Hurtado — VISERON™
# ============================================================

$ErrorActionPreference = "Stop"

$OLD_SERVER = "194.62.97.30"
$NEW_SERVER = "localhost"  # Mude para o IP do novo servidor quando executar de lá
$VISERON_HOME = "C:\viseron"
$MIGRATION_DIR = "C:\viseron-migration"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VISERON™ Migration Tool" -ForegroundColor Cyan
Write-Host "  $OLD_SERVER → $NEW_SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── FASE 1: Exportar do servidor antigo ───────────────────
Write-Host "[PHASE 1] Exporting from old server..." -ForegroundColor Yellow

New-Item -ItemType Directory -Force -Path $MIGRATION_DIR | Out-Null

# 1.1 Code (rsync/scp via SSH)
Write-Host "  [1.1] Exporting source code..." -ForegroundColor Gray
try {
    # Try SCP first
    & scp -r "root@${OLD_SERVER}:/opt/tvs/*" "$MIGRATION_DIR\code\" 2>$null
    Write-Host "    Code exported via SCP" -ForegroundColor Green
} catch {
    Write-Host "    SCP failed. Use manual export:" -ForegroundColor Yellow
    Write-Host "    On OLD server: cd /opt/tvs && tar czf /tmp/tvs-code.tar.gz ." -ForegroundColor Gray
    Write-Host "    Then: scp root@${OLD_SERVER}:/tmp/tvs-code.tar.gz $MIGRATION_DIR\" -ForegroundColor Gray
}

# 1.2 Data directory
Write-Host "  [1.2] Exporting data..." -ForegroundColor Gray
try {
    & scp -r "root@${OLD_SERVER}:/opt/tvs/data/*" "$MIGRATION_DIR\data\" 2>$null
    Write-Host "    Data exported via SCP" -ForegroundColor Green
} catch {
    Write-Host "    SCP failed. Manual export:" -ForegroundColor Yellow
    Write-Host "    On OLD server: tar czf /tmp/tvs-data.tar.gz /opt/tvs/data/" -ForegroundColor Gray
    Write-Host "    Then: scp root@${OLD_SERVER}:/tmp/tvs-data.tar.gz $MIGRATION_DIR\" -ForegroundColor Gray
}

# 1.3 Environment file
Write-Host "  [1.3] Exporting .env..." -ForegroundColor Gray
try {
    & scp "root@${OLD_SERVER}:/opt/tvs/.env" "$MIGRATION_DIR\.env" 2>$null
    Write-Host "    .env exported" -ForegroundColor Green
} catch {
    Write-Host "    SCP failed. Manual: copy .env from old server" -ForegroundColor Yellow
}

# 1.4 Database dump
Write-Host "  [1.4] Exporting PostgreSQL database..." -ForegroundColor Gray
try {
    & ssh "root@${OLD_SERVER}" "pg_dump -U postgres viseron > /tmp/viseron-db.sql" 2>$null
    & scp "root@${OLD_SERVER}:/tmp/viseron-db.sql" "$MIGRATION_DIR\viseron-db.sql" 2>$null
    Write-Host "    Database exported" -ForegroundColor Green
} catch {
    Write-Host "    SSH/SCP failed. Manual export:" -ForegroundColor Yellow
    Write-Host "    On OLD server: pg_dump -U postgres viseron > /tmp/viseron-db.sql" -ForegroundColor Gray
    Write-Host "    Then: scp root@${OLD_SERVER}:/tmp/viseron-db.sql $MIGRATION_DIR\" -ForegroundColor Gray
}

# 1.5 Docker volumes
Write-Host "  [1.5] Exporting Docker volumes..." -ForegroundColor Gray
try {
    & ssh "root@${OLD_SERVER}" "docker run --rm -v ollama_data:/data -v C:/tmp:/backup alpine tar czf /backup/ollama-data.tar.gz /data" 2>$null
    & scp "root@${OLD_SERVER}:/tmp/ollama-data.tar.gz" "$MIGRATION_DIR\" 2>$null
    Write-Host "    Ollama models exported" -ForegroundColor Green
} catch {
    Write-Host "    Docker export failed. Will re-pull models on new server" -ForegroundColor Yellow
}

# 1.6 Knowledge graph
Write-Host "  [1.6] Exporting knowledge graph..." -ForegroundColor Gray
try {
    & scp "root@${OLD_SERVER}:/opt/tvs/graphify-out/*" "$MIGRATION_DIR\graphify-out\" 2>$null
    Write-Host "    Knowledge graph exported" -ForegroundColor Green
} catch {
    Write-Host "    Graph export failed. Will regenerate on new server" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[PHASE 1 COMPLETE] Exported to $MIGRATION_DIR" -ForegroundColor Green
Write-Host ""

# ── FASE 2: Importar no novo servidor ────────────────────
Write-Host "[PHASE 2] Importing to new server..." -ForegroundColor Yellow
Write-Host "  (Run this ON the new server)" -ForegroundColor Gray
Write-Host ""

Write-Host "  Steps for new server:" -ForegroundColor White
Write-Host "  1. Copy $MIGRATION_DIR to new server" -ForegroundColor Gray
Write-Host "  2. Run: powershell server\setup-server.ps1" -ForegroundColor Gray
Write-Host "  3. Run: xcopy /E /I $MIGRATION_DIR\code\ $VISERON_HOME\" -ForegroundColor Gray
Write-Host "  4. Run: xcopy /E /I $MIGRATION_DIR\data\ $VISERON_HOME\data\" -ForegroundColor Gray
Write-Host "  5. Copy .env: copy $MIGRATION_DIR\.env $VISERON_HOME\.env" -ForegroundColor Gray
Write-Host "  6. Import DB: psql -U postgres viseron < $MIGRATION_DIR\viseron-db.sql" -ForegroundColor Gray
Write-Host "  7. Run: cd $VISERON_HOME && npm install && npm run build" -ForegroundColor Gray
Write-Host "  8. Start: powershell $VISERON_HOME\start-viseron.ps1" -ForegroundColor Gray

# ── FASE 3: Validação ────────────────────────────────────
Write-Host ""
Write-Host "[PHASE 3] Validation checklist:" -ForegroundColor Yellow
Write-Host "  [ ] Ollama responding: curl http://localhost:11434/api/tags" -ForegroundColor Gray
Write-Host "  [ ] Qdrant responding: curl http://localhost:6333/healthz" -ForegroundColor Gray
Write-Host "  [ ] PostgreSQL responding: psql -U postgres -c '\l'" -ForegroundColor Gray
Write-Host "  [ ] VISERON responding: curl http://localhost:32123/api/health" -ForegroundColor Gray
Write-Host "  [ ] Dashboard accessible: http://YOUR_IP:32123" -ForegroundColor Gray
Write-Host "  [ ] All API keys in .env working" -ForegroundColor Gray
Write-Host "  [ ] Task Scheduler auto-start configured" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Migration guide complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
