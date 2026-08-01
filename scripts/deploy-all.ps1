param(
    [switch]$GitHub,
    [switch]$Render,
    [switch]$Hostalia,
    [switch]$Vercel,
    [switch]$Full
)

$Root = "C:\Trinnity-Viseron-System"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     TRINNITY VISERON - DEPLOY ALL PLATFORMS         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function Write-Step {
    param([string]$Message, [string]$Status = "INFO")
    $Color = @{INFO = "Cyan"; OK = "Green"; WARN = "Yellow"; ERROR = "Red"}[$Status]
    Write-Host "[$Status] $Message" -ForegroundColor $Color
}

# Step 1: Build
Write-Step "Compilando TypeScript..." "INFO"
Push-Location $Root
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Step "Build OK!" "OK"
} else {
    Write-Step "Falha no build!" "ERROR"
    exit 1
}

# Step 1.5: Regenerar PDFs a cada deploy
Write-Step "Regenerando PDFs (pitch/roadmap/100/update)..." "INFO"
npx tsx scripts/gerar-pitch-startup.ts 2>&1 | ForEach-Object { Write-Host "   $_" }
npx tsx scripts/gerar-pitch-v6.ts 2>&1 | ForEach-Object { Write-Host "   $_" }
npx tsx scripts/gerar-roadmap-milionario.ts 2>&1 | ForEach-Object { Write-Host "   $_" }
npx tsx scripts/gerar-100-melhorias.ts 2>&1 | ForEach-Object { Write-Host "   $_" }
npx tsx scripts/gerar-relatorio-update.ts 2>&1 | ForEach-Object { Write-Host "   $_" }
Write-Step "PDFs OK!" "OK"
Pop-Location

# Step 2: Backup pre-deploy
Write-Step "Backup pre-deploy..." "INFO"
& "$Root\scripts\backup-system.ps1"
Write-Step "Backup concluido!" "OK"

# Step 3: GitHub
if ($GitHub -or $Full) {
    Write-Step "Enviando para GitHub..." "INFO"
    Push-Location $Root
    
    # Add all files
    git add -A
    Write-Step "Files staged" "OK"
    
    # Check if there's anything to commit
    $Status = git status --porcelain
    if ($Status) {
        $CommitMsg = "Auto-deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        git commit -m $CommitMsg
        Write-Step "Commit: $CommitMsg" "OK"
        
        git push origin main
        if ($LASTEXITCODE -eq 0) {
            Write-Step "Push GitHub OK!" "OK"
            Write-Step "Render reimplanta automaticamente (autoDeploy: true)" "INFO"
        } else {
            Write-Step "Falha no push GitHub!" "ERROR"
        }
    } else {
        Write-Step "Nada novo para commitar" "INFO"
    }
    
    Pop-Location
}

# Step 3.5: Render (deploy via API, fallback/garantia)
if ($Render -or $Full) {
    Write-Step "Disparando deploy via API do Render..." "INFO"
    & "$Root\scripts\deploy-render.ps1"
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Deploy Render OK!" "OK"
    } else {
        Write-Step "Falha no deploy Render via API!" "WARN"
    }
}

# Step 4: Hostalia (landing page via FTP)
if ($Hostalia -or $Full) {
    Write-Step "Enviando landing page para Hostalia (FTP)..." "INFO"
    & "$Root\scripts\deploy-hostalia.ps1"
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Deploy Hostalia OK!" "OK"
    } else {
        Write-Step "Falha no deploy Hostalia! Verifique credenciais FTP no .env" "WARN"
    }
}

# Step 5: Vercel
if ($Vercel) {
    Write-Step "Fazendo deploy da landing page para Vercel..." "INFO"
    
    # Check if Vercel CLI is installed
    $VercelInstalled = Get-Command "vercel" -ErrorAction SilentlyContinue
    if (-not $VercelInstalled) {
        Write-Step "Vercel CLI nao encontrado. Instalando..." "WARN"
        npm install -g vercel
    }
    
    Push-Location "$Root\trinnityviseron.com"
    vercel --prod --yes 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Deploy Vercel OK!" "OK"
    } else {
        Write-Step "Falha no deploy Vercel!" "WARN"
        Write-Step "Execute manualmente: cd trinnityviseron.com; vercel --prod" "WARN"
    }
    Pop-Location
}

Write-Step "Deploy concluido!" "OK"
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Cyan
if ($GitHub -or $Full) { Write-Host "  GitHub: https://github.com/ViseronSystem/trinnity-viseron-system" -ForegroundColor Green }
if ($Render -or $Full) { Write-Host "  Render: https://viseron-web.onrender.com" -ForegroundColor Green }
if ($Hostalia -or $Full) { Write-Host "  Hostalia: landing page + painel" -ForegroundColor Green }
if ($Vercel) { Write-Host "  Vercel: https://trinnityviseron.com" -ForegroundColor Green }
Write-Host ""
