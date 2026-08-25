# VISERON GOLDEN BACKUP SYSTEM v1.0
# Migration Architect: VISERON Autonomous Council
# Target: UpCloud EPYC 7542, 32C/64T, 256GB RAM, Windows Server 2025
# ============================================================

param(
    [string]$OutputDir = "",
    [switch]$SkipSkills,
    [switch]$SkipData
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if ([string]::IsNullOrEmpty($OutputDir)) {
    $OutputDir = Join-Path $RepoRoot ("backups\golden-" + (Get-Date -Format "yyyyMMdd-HHmm"))
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  VISERON GOLDEN BACKUP SYSTEM" -ForegroundColor Yellow
Write-Host "  Full Intelligence Preservation" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ═══ 1. CREATE OUTPUT STRUCTURE ═══
$out = $OutputDir
$sections = @("code", "data", "config", "scripts", "skills", "contracts", "docs", "memory", "reports")
foreach ($s in $sections) {
    New-Item -ItemType Directory -Force -Path (Join-Path $out $s) | Out-Null
}
New-Item -ItemType Directory -Force -Path (Join-Path $out "manifest") | Out-Null
Write-Host "[1/8] Output structure created: $out"

# ═══ 2. CODE ═══
Write-Host "[2/8] Backing up source code..."
Copy-Item -Path (Join-Path $RepoRoot "src") -Destination (Join-Path $out "code") -Recurse -Force
Copy-Item -Path (Join-Path $RepoRoot "package.json") -Destination (Join-Path $out "code") -Force
Copy-Item -Path (Join-Path $RepoRoot "package-lock.json") -Destination (Join-Path $out "code") -Force
Copy-Item -Path (Join-Path $RepoRoot "tsconfig.json") -Destination (Join-Path $out "code") -Force
Copy-Item -Path (Join-Path $RepoRoot "AGENTS.md") -Destination (Join-Path $out "code") -Force
Write-Host "       src/ (249 TS files) + package.json + tsconfig.json + AGENTS.md"

# ═══ 3. DATA (full intelligence) ═══
if (-not $SkipData) {
    Write-Host "[3/8] Backing up data/ (intelligence, audits, knowledge)..."
    Copy-Item -Path (Join-Path $RepoRoot "data\*") -Destination (Join-Path $out "data") -Recurse -Force
    Write-Host "       data/ (300MB: 40 audit dirs, knowledge, experience, minds, reports)"
} else {
    Write-Host "[3/8] SKIPPED data/ (--SkipData flag)"
}

# ═══ 4. CONFIG + SECRETS ═══
Write-Host "[4/8] Backing up configuration..."
Copy-Item -Path (Join-Path $RepoRoot "config") -Destination (Join-Path $out "config") -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path (Join-Path $RepoRoot ".env.example") -Destination (Join-Path $out "config") -Force -ErrorAction SilentlyContinue
Write-Host "       WARNING: .env NOT included (secrets). Transfer manually via secure channel."
Write-Host "       .env.example included as template."

# ═══ 5. SCRIPTS ═══
Write-Host "[5/8] Backing up scripts/ (108 CLI tools)..."
Copy-Item -Path (Join-Path $RepoRoot "scripts\*") -Destination (Join-Path $out "scripts") -Recurse -Force

# ═══ 6. SKILLS VENDOR ═══
if (-not $SkipSkills) {
    Write-Host "[6/8] Backing up skills/vendor/ (10 collections, 1,997 skills)..."
    if (Test-Path (Join-Path $RepoRoot "skills")) {
        Copy-Item -Path (Join-Path $RepoRoot "skills\*") -Destination (Join-Path $out "skills") -Recurse -Force
        Write-Host "       skills/ included (gitignored - critical for restore)"
    } else {
        Write-Host "       skills/ NOT FOUND - will need npm run skills:install on target"
    }
} else {
    Write-Host "[6/8] SKIPPED skills/ (--SkipSkills flag)"
}

# ═══ 7. MEMORY + GRAPH ═══
Write-Host "[7/8] Backing up memory + knowledge graph..."
if (Test-Path (Join-Path $RepoRoot "database")) {
    Copy-Item -Path (Join-Path $RepoRoot "database") -Destination (Join-Path $out "memory") -Recurse -Force
    Write-Host "       database/ (LTM 20K records, backups)"
}
if (Test-Path (Join-Path $RepoRoot "graphify-out")) {
    Copy-Item -Path (Join-Path $RepoRoot "graphify-out") -Destination (Join-Path $out "memory") -Recurse -Force
    Write-Host "       graphify-out/ (4,278 nodes knowledge graph)"
}

# ═══ 8. GENERATE MANIFEST WITH SHA-256 ═══
Write-Host "[8/8] Generating integrity manifest (SHA-256)..."
$manifestFile = Join-Path $out "manifest\manifest.json"
$files = Get-ChildItem -Path $out -Recurse -File | Where-Object { $_.DirectoryName -notmatch "manifest$" }
$manifest = @{
    backupVersion = "GOLDEN-1.0"
    timestamp = (Get-Date -Format "o")
    repoRoot = $RepoRoot
    totalFiles = $files.Count
    totalSizeMB = [math]::Round(($files | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
    files = @()
}

Write-Host "       Hashing $($files.Count) files..."
$i = 0
foreach ($f in $files) {
    $hash = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash
    $relPath = $f.FullName.Substring($out.Length + 1)
    $manifest.files += @{ path = $relPath; sha256 = $hash; sizeBytes = $f.Length }
    $i++
    if ($i % 100 -eq 0) { Write-Host "       $i/$($files.Count)..." }
}
$manifest | ConvertTo-Json -Depth 5 | Out-File -FilePath $manifestFile -Encoding utf8

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  GOLDEN BACKUP COMPLETE" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Location: $out"
Write-Host "  Files:    $($manifest.totalFiles)"
Write-Host "  Size:     $($manifest.totalSizeMB) MB"
Write-Host "  Manifest: $manifestFile"
Write-Host "=============================================" -ForegroundColor Green
