param(
    [switch]$Build,
    [switch]$Start,
    [switch]$Backup,
    [switch]$Full
)

$Root = "C:\Trinnity-Viseron-System"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     TRINNITY VISERON SYSTEM v5.0 - INIT SEQUENCE    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function Write-Step {
    param([string]$Message, [string]$Status = "INFO")
    $Color = @{INFO = "Cyan"; OK = "Green"; WARN = "Yellow"; ERROR = "Red"}[$Status]
    Write-Host "[$Status] $Message" -ForegroundColor $Color
}

# Step 1: Environment check
Write-Step "Verificando ambiente..." "INFO"
if (-not (Test-Path "$Root\.env")) {
    Write-Step ".env nao encontrado!" "WARN"
} else {
    Write-Step ".env encontrado" "OK"
}

if (-not (Test-Path "$Root\node_modules")) {
    Write-Step "node_modules nao encontrado. Instalando..." "WARN"
    Push-Location $Root
    npm install
    Pop-Location
} else {
    Write-Step "node_modules OK" "OK"
}

# Step 2: Build
if ($Build -or $Full) {
    Write-Step "Compilando TypeScript..." "INFO"
    Push-Location $Root
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Build concluido com sucesso!" "OK"
    } else {
        Write-Step "Falha no build!" "ERROR"
        exit 1
    }
    Pop-Location
}

# Step 3: Backup
if ($Backup -or $Full) {
    Write-Step "Executando backup diario..." "INFO"
    & "$Root\scripts\backup-system.ps1"
    Write-Step "Backup concluido!" "OK"
}

# Step 4: System Start
if ($Start -or $Full) {
    Write-Step "Verificando dist/..." "INFO"
    if (-not (Test-Path "$Root\dist\src\index.js")) {
        Write-Step "dist/ nao encontrado. Executando build primeiro..." "WARN"
        Push-Location $Root
        npm run build 2>&1 | Out-Null
        Pop-Location
    }
    
    Write-Step "Iniciando TVS Core em http://localhost:3000..." "INFO"
    Write-Step "Painel Web: http://localhost:3000" "INFO"
    Write-Step "Relatorios: http://localhost:3001" "INFO"
    
    Push-Location $Root
    node dist/src/index.js
    Pop-Location
}

# Default: show usage
if (-not ($Build -or $Start -or $Backup -or $Full)) {
    Write-Host ""
    Write-Host "USO: ./scripts/init-system.ps1 [parametros]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  -Build         Compila TypeScript" -ForegroundColor Cyan
    Write-Host "  -Start         Inicia o sistema" -ForegroundColor Cyan
    Write-Host "  -Backup        Executa backup diario" -ForegroundColor Cyan
    Write-Host "  -Full          Build + Backup + Start (ciclo completo)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Gray
    Write-Host "  ./scripts/init-system.ps1 -Full        # Ciclo completo" -ForegroundColor Gray
    Write-Host "  ./scripts/init-system.ps1 -Start       # So iniciar" -ForegroundColor Gray
    Write-Host "  ./scripts/init-system.ps1 -Backup      # So backup" -ForegroundColor Gray
}

Write-Host ""
Write-Step "Sistema Trinnity Viseron v5.0 - Pronto para operar" "OK"
Write-Host ""
