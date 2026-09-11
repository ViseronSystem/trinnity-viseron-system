# ============================================================
# VISERON™ Deploy Package Builder
# Gera um ZIP único com TUDO para o servidor
# © Pedro Costa · Trinnity Hurtado — VISERON™
# ============================================================

$ErrorActionPreference = "Stop"
$BUILD_DIR = "C:\temp\viseron-deploy"
$OUTPUT = "C:\Trinnity-Viseron-System\viseron-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VISERON™ Deploy Package Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clean build dir
if (Test-Path $BUILD_DIR) { Remove-Item -Recurse -Force $BUILD_DIR }
New-Item -ItemType Directory -Force -Path $BUILD_DIR | Out-Null

# ── 1. Source code ───────────────────────────────────────
Write-Host "[1/6] Copying source code..." -ForegroundColor Yellow
$srcDirs = @("src", "contracts", "config", "scripts", "server", "tests")
foreach ($dir in $srcDirs) {
    $srcPath = "C:\Trinnity-Viseron-System\$dir"
    if (Test-Path $srcPath) {
        & robocopy $srcPath "$BUILD_DIR\$dir" /E /XD node_modules .git dist __pycache__ .gradle build /XF *.log *.tmp /NFL /NDL /NJH /NJS /NC /NS /NP 2>$null
    }
}

# Root files only (no large dirs)
$rootFiles = @("package.json", "tsconfig.json", "opencode.json", "AGENTS.md", "README.md", ".env.example")
foreach ($f in $rootFiles) {
    $srcPath = "C:\Trinnity-Viseron-System\$f"
    if (Test-Path $srcPath) {
        Copy-Item -Force $srcPath "$BUILD_DIR\$f"
    }
}
Write-Host "  Source code copied" -ForegroundColor Green

# ── 2. Server scripts ───────────────────────────────────
Write-Host "[2/6] Adding server scripts..." -ForegroundColor Yellow
Copy-Item -Recurse -Force "C:\Trinnity-Viseron-System\server" "$BUILD_DIR\server"
Write-Host "  Server scripts added" -ForegroundColor Green

# ── 3. Skills (vendor) ──────────────────────────────────
Write-Host "[3/6] Adding skills..." -ForegroundColor Yellow
$skillPath = "C:\Trinnity-Viseron-System\skills\vendor"
if (Test-Path $skillPath) {
    & robocopy $skillPath "$BUILD_DIR\skills\vendor" /E /XD node_modules /NFL /NDL /NJH /NJS /NC /NS /NP 2>$null
}
Write-Host "  Skills added" -ForegroundColor Green

# ── 4. OpenCode config ──────────────────────────────────
Write-Host "[4/6] Adding OpenCode config..." -ForegroundColor Yellow
if (Test-Path "C:\Trinnity-Viseron-System\.opencode") {
    & robocopy "C:\Trinnity-Viseron-System\.opencode" "$BUILD_DIR\.opencode" /E /XD node_modules /NFL /NDL /NJH /NJS /NC /NS /NP 2>$null
}
Write-Host "  OpenCode config added" -ForegroundColor Green

# ── 5. Dashboard (HTML/JS) ──────────────────────────────
Write-Host "[5/6] Adding dashboard..." -ForegroundColor Yellow
if (Test-Path "C:\Trinnity-Viseron-System\src\dashboard") {
    & robocopy "C:\Trinnity-Viseron-System\src\dashboard" "$BUILD_DIR\src\dashboard" /E /XD node_modules /NFL /NDL /NJH /NJS /NC /NS /NP 2>$null
}
Write-Host "  Dashboard added" -ForegroundColor Green

# ── 6. Package ──────────────────────────────────────────
Write-Host "[6/6] Creating ZIP package..." -ForegroundColor Yellow
Compress-Archive -Path "$BUILD_DIR\*" -DestinationPath $OUTPUT -Force
$zipSize = (Get-Item $OUTPUT).Length / 1MB

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deploy package created!" -ForegroundColor Green
Write-Host "  File: $OUTPUT" -ForegroundColor White
Write-Host "  Size: $([math]::Round($zipSize, 1)) MB" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy:" -ForegroundColor Yellow
Write-Host "  1. Copy ZIP to new server" -ForegroundColor Gray
Write-Host "  2. Extract: Expand-Archive viseron-deploy-*.zip -DestinationPath C:\viseron" -ForegroundColor Gray
Write-Host "  3. Run: powershell C:\viseron\server\setup-server.ps1" -ForegroundColor Gray
Write-Host "  4. Run: cd C:\viseron && npm install && npm run build" -ForegroundColor Gray
Write-Host "  5. Run: powershell C:\viseron\start-viseron.ps1" -ForegroundColor Gray

# Clean build dir
Remove-Item -Recurse -Force $BUILD_DIR -ErrorAction SilentlyContinue
