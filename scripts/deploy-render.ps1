param(
    [switch]$ClearCache,
    [int]$TimeoutSeconds = 300
)

$Root = "C:\Trinnity-Viseron-System"

function Write-Step {
    param([string]$Message, [string]$Status = "INFO")
    $Color = @{INFO = "Cyan"; OK = "Green"; WARN = "Yellow"; ERROR = "Red"}[$Status]
    Write-Host "[$Status] $Message" -ForegroundColor $Color
}

function Get-EnvValue {
    param([string]$Key)
    $EnvFile = Join-Path $Root ".env"
    if (-not (Test-Path $EnvFile)) { return $null }
    $Line = Get-Content $EnvFile | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if (-not $Line) { return $null }
    return ($Line -replace "^$Key=", "").Trim().Trim('"').Trim("'")
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        TRINNITY VISERON - DEPLOY RENDER (API)        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ApiKey = Get-EnvValue "RENDER_API_KEY"
$ServiceId = Get-EnvValue "RENDER_SERVICE_ID"

if (-not $ApiKey) {
    Write-Step "RENDER_API_KEY nao encontrada no .env!" "ERROR"
    exit 1
}

if (-not $ServiceId) {
    Write-Step "Buscando servico viseron-web na API do Render..." "INFO"
    $ServicesRaw = curl.exe -s "https://api.render.com/v1/services" -H "Accept: application/json" -H "Authorization: Bearer $ApiKey"
    $Services = $ServicesRaw | ConvertFrom-Json
    $Svc = $Services | Where-Object { $_.service.name -eq "viseron-web" } | Select-Object -First 1
    if (-not $Svc) {
        Write-Step "Servico viseron-web nao encontrado no Render!" "ERROR"
        Write-Step "Verifique em https://dashboard.render.com" "WARN"
        exit 1
    }
    $ServiceId = $Svc.service.id
    Write-Step "Servico encontrado: $ServiceId ($($Svc.service.url))" "OK"
}

$Headers = @{
    "Accept" = "application/json"
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

if ($ClearCache) {
    Write-Step "Re-deploy com cache limpo..." "INFO"
    $Body = '{"clearCache":"clear"}'
} else {
    Write-Step "Disparando deploy..." "INFO"
    $Body = '{}'
}

$DeployRaw = curl.exe -s -X POST "https://api.render.com/v1/services/$ServiceId/deploys" -H "Accept: application/json" -H "Authorization: Bearer $ApiKey" -H "Content-Type: application/json" --data $Body
$Deploy = $DeployRaw | ConvertFrom-Json
$DeployId = $Deploy.id
if (-not $DeployId) {
    Write-Step "Falha ao disparar deploy: $DeployRaw" "ERROR"
    exit 1
}
Write-Step "Deploy iniciado: $DeployId" "OK"

$Deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while ((Get-Date) -lt $Deadline) {
    Start-Sleep -Seconds 10
    $StatusRaw = curl.exe -s "https://api.render.com/v1/services/$ServiceId/deploys/$DeployId" -H "Accept: application/json" -H "Authorization: Bearer $ApiKey"
    $Status = $StatusRaw | ConvertFrom-Json
    $State = $Status.status
    Write-Step "Status: $State" "INFO"
    if ($State -eq "live") {
        Write-Step "Deploy no ar! URL: $($Status.service.url)" "OK"
        Write-Step "Health: $($Status.service.url)/api/health" "OK"
        exit 0
    }
    if ($State -eq "build_failed" -or $State -eq "deploy_failed" -or $State -eq "canceled") {
        Write-Step "Deploy falhou (status: $State)" "ERROR"
        Write-Step "Logs: https://dashboard.render.com/web/$ServiceId/deploys/$DeployId" "WARN"
        exit 1
    }
}

Write-Step "Tempo esgotado ($TimeoutSeconds s). Deploy ainda em andamento." "WARN"
Write-Step "Acompanhe: https://dashboard.render.com/web/$ServiceId/deploys/$DeployId" "WARN"
exit 1
