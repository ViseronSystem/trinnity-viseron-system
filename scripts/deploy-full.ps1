# deploy-full.ps1 — Deploy COMPLETO do TVS para servidor remoto.
# Cria um zip TUDO (src, data, contracts, scripts, docs, public, PDFs, configs)
# exceto node_modules/.git/dist/logs temporários, e faz upload ao servidor.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\deploy-full.ps1 -Server 194.62.96.99
#   powershell -ExecutionPolicy Bypass -File scripts\deploy-full.ps1 -Server 194.62.96.99 -User Administrator -Key ~/.ssh/viseron_deploy
#
# O que faz:
#   1. Cria C:\Trinnity-Viseron-System\_deploy\ tvs-full-<data>.zip (tudo exceto lixo)
#   2. Faz upload ao servidor via SCP
#   3. Extrai no servidor
#   4. Corre npm install + build + config
#   5. Inicia VISERON com PM2

param(
  [Parameter(Mandatory=$true)]  [string]$Server,
  [string]$User = "Administrator",
  [string]$Key  = "$env:USERPROFILE\.ssh\viseron_deploy",
  [int]$SshPort = 22,
  [switch]$SkipUpload,
  [switch]$SkipSetup
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$DeployDir = Join-Path $Root "_deploy"
$Date = Get-Date -Format "yyyy-MM-dd_HHmm"
$ZipName = "tvs-full-$Date.zip"
$ZipPath = Join-Path $DeployDir $ZipName

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗"
Write-Host "║  TVS — DEPLOY COMPLETO PARA SERVIDOR REMOTO             ║"
Write-Host "║  $Server                                    ║"
Write-Host "╚══════════════════════════════════════════════════════════╝"

# ── SSH helper ──
function Invoke-SSH($cmd) {
  ssh -i $Key -p $SshPort -o ConnectTimeout=20 -o StrictHostKeyChecking=no "$User@$Server" $cmd
}
function Invoke-SCP($src, $dst) {
  scp -i $Key -P $SshPort -o ConnectTimeout=60 -o StrictHostKeyChecking=no -r $src "$User@$Server`:$dst"
}

# ── 1) Criar zip completo ──
Write-Host "`n[1/5] A criar zip completo do projeto..." -ForegroundColor Cyan

if (-not (Test-Path $DeployDir)) { New-Item -ItemType Directory -Path $DeployDir -Force | Out-Null }

# Pastas e ficheiros a EXCLUIR (temporários, regeneráveis, pesados)
$ExcludeDirs = @(
  "node_modules",
  ".git",
  "dist",
  "_deploy",
  "migracao",
  "server.log",
  "server-err.log",
  "server-error.log",
  "server-out.log",
  "server.log.*",
  "tvs_stdout.txt",
  "tvs_stderr.txt",
  "launch-output",
  "*.apk"
)

# Criar directorio temporário para staging
$Staging = Join-Path $DeployDir "_staging"
if (Test-Path $Staging) { Remove-Item -Recurse -Force $Staging }
New-Item -ItemType Directory -Path $Staging -Force | Out-Null

# Copiar tudo exceto excluídos
Write-Host "  A copiar ficheiros para staging..."
Get-ChildItem -Path $Root -Force -ErrorAction SilentlyContinue | Where-Object {
  $name = $_.Name
  $exclude = $false
  foreach ($ex in $ExcludeDirs) {
    if ($name -eq $ex -or $name -like $ex) { $exclude = $true; break }
  }
  -not $exclude
} | ForEach-Object {
  $dest = Join-Path $Staging $_.Name
  if ($_.PSIsContainer) {
    Copy-Item -LiteralPath $_.FullName -Destination $dest -Recurse -Force -ErrorAction SilentlyContinue
  } else {
    Copy-Item -LiteralPath $_.FullName -Destination $dest -Force
  }
}

# Remover sub-pastas excluídas dentro do staging
foreach ($ex in $ExcludeDirs) {
  $pattern = Join-Path $Staging $ex
  Get-Item $pattern -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
# Remover logs grandes
Get-ChildItem $Staging -Filter "*.log" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem $Staging -Filter "*.log.*" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Criar zip
Write-Host "  A compactar..."
if (Test-Path $ZipPath) { Remove-Item $ZipPath }
& tar.exe -czf $ZipPath -C $Staging . 2>$null
if (-not (Test-Path $ZipPath)) {
  # Fallback: usar Compress-Archive
  Compress-Archive -Path "$Staging\*" -DestinationPath $ZipPath -Force
}
Remove-Item -Recurse -Force $Staging

$zipMB = [math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
Write-Host "  -> $ZipPath ($zipMB MB)" -ForegroundColor Green

# ── 2) Upload ao servidor ──
if (-not $SkipUpload) {
  Write-Host "`n[2/5] A fazer upload ao servidor..." -ForegroundColor Cyan
  
  # Testar ligação
  $test = Invoke-SSH "echo CONNECTED"
  if ($test -ne "CONNECTED") {
    Write-Host "  ERRO: Não consigo ligar ao servidor $Server" -ForegroundColor Red
    exit 1
  }
  Write-Host "  Ligacao OK" -ForegroundColor Green

  # Criar directorio no servidor
  Invoke-SSH "if not exist C:\Trinnity-Viseron-System\_deploy mkdir C:\Trinnity-Viseron-System\_deploy"
  
  # Upload
  Write-Host "  A enviar $zipMB MB (pode demorar)..."
  Invoke-SCP $ZipPath "C:\Trinnity-Viseron-System\_deploy\$ZipName"
  Write-Host "  Upload completo" -ForegroundColor Green
} else {
  Write-Host "`n[2/5] Upload omitido (-SkipUpload)" -ForegroundColor Yellow
}

# ── 3) Extrair no servidor ──
if (-not $SkipSetup) {
  Write-Host "`n[3/5] A extrair no servidor..." -ForegroundColor Cyan
  Invoke-SSH "cd C:\Trinnity-Viseron-System && tar.exe -xzf _deploy\$ZipName" 2>$null
  # Fallback: PowerShell expand
  Invoke-SSH "powershell -Command ""Expand-Archive -Path 'C:\Trinnity-Viseron-System\_deploy\$ZipName' -DestinationPath 'C:\Trinnity-Viseron-System' -Force""" 2>$null
  Write-Host "  Extraido" -ForegroundColor Green

  # ── 4) Restaurar .env ──
  Write-Host "`n[4/5] A configurar..." -ForegroundColor Cyan
  $envLocal = Join-Path $Root ".env"
  if (Test-Path $envLocal) {
    Invoke-SCP $envLocal "C:\Trinnity-Viseron-System\.env"
    Write-Host "  .env restaurado" -ForegroundColor Green
  }

  # Restaurar opencode.json
  $ocLocal = Join-Path $Root "opencode.json"
  if (Test-Path $ocLocal) {
    Invoke-SCP $ocLocal "C:\Trinnity-Viseron-System\opencode.json"
    Write-Host "  opencode.json restaurado" -ForegroundColor Green
  }

  # ── 5) npm install + build + iniciar ──
  Write-Host "`n[5/5] npm install + build + start..." -ForegroundColor Cyan
  Invoke-SSH "cd C:\Trinnity-Viseron-System && npm install 2>&1 | Select-Object -Last 3"
  Invoke-SSH "cd C:\Trinnity-Viseron-System && npm run build 2>&1 | Select-Object -Last 3"
  
  # Instalar Ollama se não existir
  Invoke-SSH "if not exist %LOCALAPPDATA%\Programs\Ollama\ollama.exe (echo OLLAMA_MISSING) else (echo OLLAMA_OK)"
  
  # Instalar modelos Ollama
  Invoke-SSH "set PATH=%PATH%;%LOCALAPPDATA%\Programs\Ollama && ollama pull qwen2.5:3b 2>&1 | Select-Object -Last 2"
  
  # Iniciar com PM2
  Invoke-SSH "cd C:\Trinnity-Viseron-System && pm2 delete tvs 2>nul & pm2 start node --name tvs --max-old-space-size=8192 -- dist/src/index.js"
  Invoke-SSH "pm2 save"
  
  Write-Host "  Servidor iniciado" -ForegroundColor Green
}

# Limpar zip local
Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗"
Write-Host "║  ✓ DEPLOY COMPLETO                                     ║"
Write-Host "║  Dashboard:  http://${Server}:32123                     ║"
Write-Host "║  API:        http://${Server}:32123/api/health          ║"
Write-Host "║  Ollama:     http://${Server}:11434                    ║"
Write-Host "║  Gestão:     pm2 status | pm2 restart tvs              ║"
Write-Host "╚══════════════════════════════════════════════════════════╝"
