param(
    [switch]$GitHub,
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
        } else {
            Write-Step "Falha no push GitHub!" "ERROR"
        }
    } else {
        Write-Step "Nada novo para commitar" "INFO"
    }
    
    Pop-Location
}

# Step 4: Vercel
if ($Vercel -or $Full) {
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
if ($GitHub -or $Full) { Write-Host "  GitHub: https://github.com/Trinnity/Viseron-System" -ForegroundColor Green }
if ($Vercel -or $Full) { Write-Host "  Vercel: https://trinnityviseron.com" -ForegroundColor Green }
Write-Host ""
