# VISERON GOLDEN VERIFY SYSTEM v1.0
# Verifies backup integrity AND migration readiness
# ============================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupDir
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  VISERON MIGRATION VERIFICATION" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$results = @()

function Check {
    param([string]$Name, [bool]$Ok, [string]$Detail = "")
    $script:results += @{ name = $Name; ok = $Ok; detail = $Detail }
    $icon = "OK  "
    $color = "Green"
    if (-not $Ok) { $icon = "FAIL"; $color = "Red" }
    Write-Host ("  [{0}] {1} {2}" -f $icon, $Name, $Detail) -ForegroundColor $color
}

# ═══ 1. MANIFEST EXISTENCE ═══
$manifestFile = Join-Path $BackupDir "manifest\manifest.json"
$manifestExists = Test-Path $manifestFile
Check -Name "Manifest exists" -Ok $manifestExists

if (-not $manifestExists) {
    Write-Host ""
    Write-Host "NO MANIFEST - cannot verify backup." -ForegroundColor Red
    exit 1
}

$manifest = Get-Content $manifestFile -Raw | ConvertFrom-Json

# ═══ 2. INTEGRITY ═══
$fileCount = $manifest.totalFiles
Check -Name "Total files in manifest" -Ok ($fileCount -gt 0) -Detail ("(" + $fileCount + " files)")

$verified = 0
$failed = 0
foreach ($f in $manifest.files) {
    $fullPath = Join-Path $BackupDir $f.path
    if (Test-Path -LiteralPath $fullPath) {
        $actualHash = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash
        if ($actualHash -eq $f.sha256) { $verified++ } else { $failed++ }
    } else { $failed++ }
}
Check -Name "SHA-256 integrity" -Ok ($failed -eq 0) -Detail ("(" + $verified + " verified, " + $failed + " failed)")

# ═══ 3. INTELLIGENCE COMPLETENESS ═══
Check -Name "Source code present" -Ok (Test-Path (Join-Path $BackupDir "code\src"))
Check -Name "Agent specs present" -Ok ((Get-ChildItem (Join-Path $BackupDir "code\src\omega\agent-runtime\specs") -File -Filter "*.json" -ErrorAction SilentlyContinue).Count -ge 10)
Check -Name "Squad manifests present" -Ok ((Get-ChildItem (Join-Path $BackupDir "code\src\omega\squads\manifests") -File -Filter "*.json" -ErrorAction SilentlyContinue).Count -ge 12)
Check -Name "Scripts present" -Ok ((Get-ChildItem (Join-Path $BackupDir "scripts") -File -Filter "*.ts" -ErrorAction SilentlyContinue).Count -ge 100)
Check -Name "Skills vendor present" -Ok (Test-Path (Join-Path $BackupDir "skills\vendor"))
Check -Name "Data audits present" -Ok ((Get-ChildItem (Join-Path $BackupDir "data\audit") -Directory -ErrorAction SilentlyContinue).Count -ge 40)
Check -Name "Memory database present" -Ok (Test-Path (Join-Path $BackupDir "memory\database"))
Check -Name "Knowledge graph present" -Ok (Test-Path (Join-Path $BackupDir "memory\graphify-out"))
Check -Name "package.json present" -Ok (Test-Path (Join-Path $BackupDir "code\package.json"))

# ═══ 4. MIGRATION READINESS ═══
Check -Name "Backup size reasonable" -Ok ($manifest.totalSizeMB -gt 100) -Detail ("(" + $manifest.totalSizeMB + " MB)")
Check -Name "Timestamp recent" -Ok (([DateTime]::Parse($manifest.timestamp)) -gt (Get-Date).AddDays(-30))

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION SUMMARY" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_.ok }).Count
$total = $results.Count
Write-Host ("  Passed: {0}/{1}" -f $passed, $total) -ForegroundColor Yellow
Write-Host ""

if ($passed -eq $total) {
    Write-Host "  VERDICT: MIGRATION-READY" -ForegroundColor Green
    Write-Host "  This backup is complete and verified. Safe to migrate."
} else {
    Write-Host "  VERDICT: INCOMPLETE BACKUP" -ForegroundColor Red
    Write-Host "  Fix the failed checks before migration."
}
Write-Host "=============================================" -ForegroundColor Cyan
