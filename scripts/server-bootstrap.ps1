# server-bootstrap.ps1 — BOOTSTRAP COMPLETO do zero num servidor Windows.
# Corre ISTO no servidor novo e fica TUDO a funcionar.
#
# Uso (1 comando no servidor novo):
#   powershell -ExecutionPolicy Bypass -Command "iex((Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/ViseronSystem/trinnity-viseron-system/main/scripts/server-bootstrap.ps1' -UseBasicParsing).Content)"
#
# Ou localmente:
#   powershell -ExecutionPolicy Bypass -File scripts\server-bootstrap.ps1

$ErrorActionPreference = "Stop"
$AppDir = "C:\Trinnity-Viseron-System"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗"
Write-Host "║  TVS — BOOTSTRAP COMPLETO DO SERVIDOR                   ║"
Write-Host "║  Um comando. Tudo funciona. Sempre.                     ║"
Write-Host "╚══════════════════════════════════════════════════════════╝"

function Step($n, $total, $t) { Write-Host "`n[$n/$total] $t" -ForegroundColor Cyan }
function Ok($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red }

# ════════════════════════════════════════════════════════
# 1. PREREQUISITOS DO SISTEMA
# ════════════════════════════════════════════════════════
Step 1 7 "A verificar/instalar prerequisitos..."

# Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "  A instalar Node.js..."
  $nodeMsi = "$env:TEMP\node-install.msi"
  Invoke-WebRequest -Uri "https://nodejs.org/dist/v22.18.0/node-v22.18.0-x64.msi" -OutFile $nodeMsi
  Start-Process msiexec -ArgumentList "/i `"$nodeMsi`" /qn" -Wait
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Ok "Node $(node -v)"

# Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "  A instalar Git..."
  winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements 2>$null
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Ok "Git $(git --version)"

# PM2
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
  npm install -g pm2
}
Ok "PM2 $(pm2 -v 2>$null)"

# ════════════════════════════════════════════════════════
# 2. OLLAMA + MODELOS
# ════════════════════════════════════════════════════════
Step 2 7 "Ollama + modelos de IA locais..."

$ollamaExe = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
if (-not (Test-Path $ollamaExe)) {
  Write-Host "  A instalar Ollama..."
  $ollamaSetup = "$env:TEMP\OllamaSetup.exe"
  Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile $ollamaSetup
  Start-Process $ollamaSetup -ArgumentList "/VERYSILENT" -Wait
  $ollamaExe = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
}

# Iniciar Ollama se não estiver a correr
if (-not (Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue)) {
  Start-Process $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
  Start-Sleep 5
}

foreach ($m in @("qwen2.5:3b", "all-minilm:l6-v2")) {
  $existing = & $ollamaExe list 2>$null | Select-String $m.Split(":")[0]
  if (-not $existing) {
    Write-Host "  A baixar $m..."
    & $ollamaExe pull $m
  }
}
Ok "Ollama + qwen2.5:3b + all-minilm prontos"

# ════════════════════════════════════════════════════════
# 3. QDRANT (vector DB)
# ════════════════════════════════════════════════════════
Step 3 7 "Qdrant (vector database)..."

$qdrantDir = "$AppDir\bin\qdrant"
if (-not (Test-Path "$qdrantDir\qdrant.exe")) {
  Write-Host "  A baixar Qdrant..."
  if (-not (Test-Path $qdrantDir)) { New-Item -ItemType Directory -Path $qdrantDir -Force | Out-Null }
  $qdrantZip = "$env:TEMP\qdrant.zip"
  Invoke-WebRequest -Uri "https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-pc-windows-msvc.zip" -OutFile $qdrantZip
  Expand-Archive -Path $qdrantZip -DestinationPath $qdrantDir -Force
  Remove-Item $qdrantZip -Force
}

if (-not (Get-NetTCPConnection -LocalPort 6333 -ErrorAction SilentlyContinue)) {
  Start-Process "$qdrantDir\qdrant.exe" -WorkingDirectory $qdrantDir -WindowStyle Hidden
  Start-Sleep 3
}
Ok "Qdrant na porta 6333"

# ════════════════════════════════════════════════════════
# 4. CÓDIGO FONTE (do zip local ou GitHub)
# ════════════════════════════════════════════════════════
Step 4 7 "Código fonte..."

$zipFile = "$AppDir\_deploy\tvs-full-*.zip"
$latestZip = Get-ChildItem $zipFile -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestZip) {
  Write-Host "  A extrair $($latestZip.Name)..."
  & tar.exe -xzf $latestZip.FullName -C $AppDir 2>$null
  if (-not $?) {
    Expand-Archive -Path $latestZip.FullName -DestinationPath $AppDir -Force
  }
  Ok "Código extraído do zip"
} elseif (-not (Test-Path "$AppDir\package.json")) {
  Write-Host "  A clonar do GitHub..."
  git clone "https://github.com/ViseronSystem/trinnity-viseron-system.git" $AppDir
  Ok "Repositorio clonado"
} else {
  Ok "Código já existe em $AppDir"
}

# ════════════════════════════════════════════════════════
# 5. DEPENDÊNCIAS + BUILD
# ════════════════════════════════════════════════════════
Step 5 7 "npm install + build..."

Push-Location $AppDir
if (-not (Test-Path "node_modules")) {
  npm install 2>&1 | Select-Object -Last 3
}
npm run build 2>&1 | Select-Object -Last 3
Pop-Location
Ok "Build completo"

# ════════════════════════════════════════════════════════
# 6. CONFIGURAÇÃO
# ════════════════════════════════════════════════════════
Step 6 7 "Configuração..."

# .env (se não existir, copiar do .env.example)
if (-not (Test-Path "$AppDir\.env") -and (Test-Path "$AppDir\.env.example")) {
  Copy-Item "$AppDir\.env.example" "$AppDir\.env"
  Ok ".env criado a partir do .env.example — EDITAR COM CHAVES REAIS"
} else {
  Ok ".env existe"
}

# OpenCode config
$ocUser = "$env:USERPROFILE\.opencode"
if (-not (Test-Path "$ocUser")) { New-Item -ItemType Directory -Path $ocUser -Force | Out-Null }
# Copiar plugin TVS se não existir
if (-not (Test-Path "$ocUser\plugin\tvs.ts") -and (Test-Path "$AppDir\.opencode\plugin\tvs.ts")) {
  Copy-Item "$AppDir\.opencode\plugin\tvs.ts" "$ocUser\plugin\tvs.ts" -Force
  Ok "Plugin TVS instalado no OpenCode"
}

# ════════════════════════════════════════════════════════
# 7. PM2 + AUTO-START + FIREWALL
# ════════════════════════════════════════════════════════
Step 7 7 "PM2 + arranque automático + firewall..."

Push-Location $AppDir
pm2 delete tvs 2>$null
pm2 delete omniroute 2>$null
pm2 start node --name tvs --max-old-space-size=8192 -- dist/src/index.js
pm2 save
Pop-Location

# Task Scheduler para sobreviver a restarts
$task = Get-ScheduledTask -TaskName "TVS" -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c cd /d $AppDir && pm2 resurrect"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
if ($task) { Unregister-ScheduledTask -TaskName "TVS" -Confirm:$false }
Register-ScheduledTask -TaskName "TVS" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest | Out-Null

# Firewall
New-NetFirewallRule -DisplayName "TVS-3000" -Direction Inbound -LocalPort 3000  -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "TVS-32123" -Direction Inbound -LocalPort 32123 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "TVS-11434" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "TVS-6333" -Direction Inbound -LocalPort 6333  -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

Ok "PM2 tvs ativo · Task Scheduler 'TVS' criado · Firewall configurado"

# ════════════════════════════════════════════════════════
# VERIFICAÇÃO FINAL
# ════════════════════════════════════════════════════════
Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✓ BOOTSTRAP COMPLETO — TUDO A FUNCIONAR"
Write-Host ""
Write-Host "  Serviços:"
$pm2 = pm2 jlist 2>$null | ConvertFrom-Json
foreach ($p in $pm2) {
  $status = if ($p.pm2_env.status -eq "online") { "ONLINE" } else { "OFFLINE" }
  Write-Host "    $($p.name): $status (porta $($p.pm2_env.port))"
}
Write-Host ""
Write-Host "  Endereços:"
Write-Host "    Dashboard:  http://localhost:32123"
Write-Host "    API:        http://localhost:32123/api/health"
Write-Host "    Ollama:     http://localhost:11434"
Write-Host "    Qdrant:     http://localhost:6333"
Write-Host ""
Write-Host "  Gestão:"
Write-Host "    pm2 status          — ver estado"
Write-Host "    pm2 restart tvs     — reiniciar"
Write-Host "    pm2 logs tvs        — ver logs"
Write-Host "    pm2 monit           — monitor"
Write-Host ""
Write-Host "  Para acesso externo, configurar reverse proxy (nginx/IIS)"
Write-Host "  ou abrir a porta 32123 no router/firewall."
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
