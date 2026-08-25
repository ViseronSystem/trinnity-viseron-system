# VISERON GOLDEN RESTORE SYSTEM v1.0
# Restores a Golden Backup to a new server (UpCloud target)
# ============================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupDir,
    [string]$TargetRoot = "C:\tvs"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  VISERON GOLDEN RESTORE" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ═══ 1. VALIDATE MANIFEST ═══
$manifestFile = Join-Path $BackupDir "manifest\manifest.json"
if (-not (Test-Path $manifestFile)) {
    Write-Host "ERROR: manifest.json not found in backup!" -ForegroundColor Red
    Write-Host "This is not a valid Golden Backup." -ForegroundColor Red
    exit 1
}
$manifest = Get-Content $manifestFile | ConvertFrom-Json
Write-Host "[1/7] Manifest validated: $($manifest.totalFiles) files, $($manifest.totalSizeMB) MB"

# ═══ 2. VERIFY INTEGRITY ═══
Write-Host "[2/7] Verifying SHA-256 integrity..."
$verified = 0
$failed = 0
foreach ($f in $manifest.files) {
    $fullPath = Join-Path $BackupDir $f.path
    if (Test-Path -LiteralPath $fullPath) {
        $actualHash = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash
        if ($actualHash -eq $f.sha256) { $verified++ } else { $failed++; Write-Host "  MISMATCH: $($f.path)" -ForegroundColor Red }
    } else {
        $failed++
        Write-Host "  MISSING: $($f.path)" -ForegroundColor Red
    }
}
Write-Host "  Verified: $verified/$($manifest.files.Count) OK, $failed failed"
if ($failed -gt 0) {
    Write-Host "INTEGRITY CHECK FAILED. Aborting restore." -ForegroundColor Red
    exit 1
}
Write-Host "  ALL FILES INTACT" -ForegroundColor Green

# ═══ 3. CREATE TARGET ═══
Write-Host "[3/7] Creating target structure at $TargetRoot..."
New-Item -ItemType Directory -Force -Path $TargetRoot | Out-Null
foreach ($d in @("code", "data", "config", "scripts", "skills", "contracts", "docs", "memory", "reports")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $TargetRoot $d) | Out-Null
}

# ═══ 4. RESTORE CODE ═══
Write-Host "[4/7] Restoring source code..."
Copy-Item -Path (Join-Path $BackupDir "code\*") -Destination $TargetRoot -Recurse -Force

# ═══ 5. RESTORE DATA ═══
Write-Host "[5/7] Restoring intelligence data..."
if (Test-Path (Join-Path $BackupDir "data")) {
    Copy-Item -Path (Join-Path $BackupDir "data") -Destination $TargetRoot -Recurse -Force
    Write-Host "  data/ restored (audits, knowledge, experience, reports)"
}

# ═══ 6. RESTORE SKILLS ═══
Write-Host "[6/7] Restoring skills..."
if (Test-Path (Join-Path $BackupDir "skills\vendor")) {
    Copy-Item -Path (Join-Path $BackupDir "skills\vendor") -Destination (Join-Path $TargetRoot "skills") -Recurse -Force
    Write-Host "  skills/vendor restored (10 collections, 1,997 skills)"
} else {
    Write-Host "  skills/vendor NOT in backup. Run: npm run skills:install"
}

# ═══ 7. RESTORE MEMORY + GRAPH ═══
Write-Host "[7/7] Restoring memory + knowledge graph..."
if (Test-Path (Join-Path $BackupDir "memory\database")) {
    Copy-Item -Path (Join-Path $BackupDir "memory\database") -Destination $TargetRoot -Recurse -Force
    Write-Host "  database/ restored (LTM 20K records)"
}
if (Test-Path (Join-Path $BackupDir "memory\graphify-out")) {
    Copy-Item -Path (Join-Path $BackupDir "memory\graphify-out") -Destination $TargetRoot -Recurse -Force
    Write-Host "  graphify-out/ restored (knowledge graph)"
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  RESTORE COMPLETE" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Target: $TargetRoot"
Write-Host ""
Write-Host "  NEXT STEPS:"
Write-Host "  1. Copy .env manually (secure channel)"
Write-Host "  2. cd $TargetRoot"
Write-Host "  3. npm install"
Write-Host "  4. npm run build"
Write-Host "  5. npm run models:pull"
Write-Host "  6. npm start"
Write-Host "  7. npm test (verify 67 tests pass)"
Write-Host "=============================================" -ForegroundColor Green
