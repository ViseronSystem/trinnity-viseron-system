# server-setup.ps1 — TVS no Windows Server (2019/2022)
# Instala e sobe o Trinnity Viseron System: Node 24 · PM2 · Ollama ·
# (opcional) toolchain APK · firewall · arranque automático (Task Scheduler).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\server-setup.ps1
#   powershell -ExecutionPolicy Bypass -File .\server-setup.ps1 -AndroidSDK   # + JDK + Android SDK
#   powershell -ExecutionPolicy Bypass -File .\server-setup.ps1 -NoOllama
param(
  [switch]$AndroidSDK,
  [switch]$NoOllama
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$PKG = Split-Path -Parent $PSScriptRoot
$AppDir = "C:\tvs"
$RepoUrl = "https://github.com/ViseronSystem/trinnity-viseron-system.git"

Write-Host ""
Write-Host "══════════════════════════════════════════════════════"
Write-Host "  TRINNITY VISERON SYSTEM - SETUP WINDOWS SERVER"
Write-Host "══════════════════════════════════════════════════════"

function Step($t) { Write-Host "`n[$t]" -ForegroundColor Cyan }

# 1) Node + git + PM2
Step "1/6 Node.js 24 + Git + PM2"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  $nodeInstaller = "$env:TEMP\node-setup.msi"
  Invoke-WebRequest -Uri "https://nodejs.org/dist/v24.18.0/node-v24.18.0-x64.msi" -OutFile $nodeInstaller
  Start-Process msiexec -ArgumentList "/i `"$nodeInstaller`" /qn" -Wait
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements }
npm install -g pm2
Write-Host "  node $(node -v) · npm $(npm -v) · pm2 $(pm2 -v)" -ForegroundColor Green

# 2) Ollama + modelos
if (-not $NoOllama) {
  Step "2/6 Ollama + modelos locais"
  if (-not (Test-Path "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe")) {
    Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile "$env:TEMP\OllamaSetup.exe"
    Start-Process "$env:TEMP\OllamaSetup.exe" -ArgumentList "/VERYSILENT" -Wait
  }
  $ollama = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
  foreach ($m in @("qwen2.5:3b", "qwen2.5:1.5b")) {
    if (-not (& $ollama list | Select-String $m.Split(":")[0])) { & $ollama pull $m }
  }
  Write-Host "  Ollama + qwen2.5:3b/1.5b prontos" -ForegroundColor Green
}

# 3) Código + dados
Step "3/6 Código fonte + dados"
if (-not (Test-Path "$AppDir\.git")) {
  git clone $RepoUrl $AppDir
} else {
  Push-Location $AppDir; git pull --ff-only origin main; Pop-Location
}
if (Test-Path "$PKG\data-snapshot.tar.gz") {
  New-Item -ItemType Directory -Path "$AppDir\data" -Force | Out-Null
  tar.exe -xzf "$PKG\data-snapshot.tar.gz" -C "$AppDir\data"
  Write-Host "  data-snapshot.tar.gz restaurado" -ForegroundColor Green
}
if (Test-Path "$PKG\.env") {
  Copy-Item "$PKG\.env" "$AppDir\.env" -Force
  Write-Host "  .env restaurado" -ForegroundColor Green
}

# 4) npm + build
Step "4/6 npm install + build (pode demorar)"
Push-Location $AppDir
npm ci 2>$null; if (-not $?) { npm install }
npm run build
Pop-Location
Write-Host "  build OK" -ForegroundColor Green

# 5) Toolchain APK (opcional)
if ($AndroidSDK) {
  Step "5/6 Toolchain APK (JDK 17 + Android cmdline-tools)"
  winget install --id EclipseAdoptium.Temurin.17.JDK -e --accept-source-agreements --accept-package-agreements
  $sdk = "$env:USERPROFILE\AppData\Local\Android\Sdk"
  New-Item -ItemType Directory -Path "$sdk\cmdline-tools" -Force | Out-Null
  if (-not (Test-Path "$sdk\cmdline-tools\latest")) {
    Invoke-WebRequest -Uri "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" -OutFile "$env:TEMP\cmdtools.zip"
    Expand-Archive -Path "$env:TEMP\cmdtools.zip" -DestinationPath "$sdk\cmdline-tools" -Force
    Rename-Item "$sdk\cmdline-tools\cmdline-tools" "$sdk\cmdline-tools\latest"
  }
  $sm = "$sdk\cmdline-tools\latest\bin\sdkmanager.bat"
  & $sm --licenses | Out-Null
  & $sm "platforms;android-35" "build-tools;35.0.0" "platform-tools"
  [Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdk, "Machine")
  [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdk, "Machine")
  Write-Host "  Android SDK: $sdk" -ForegroundColor Green
}

# 6) PM2 + arranque automático + firewall
Step "6/6 PM2 + arranque no boot + firewall"
Push-Location $AppDir
pm2 delete tvs 2>$null; pm2 delete omniroute 2>$null
pm2 start node --name tvs --max-old-space-size=8192 -- dist/src/index.js
if (Select-String -Path .env -Pattern "OMNIROUTE_ENABLED=1" -Quiet) {
  pm2 start npx --name omniroute -- --yes omniroute --port 20128 --no-open
}
pm2 save
Pop-Location
# Arranque automático ao boot (equivalente ao systemd no Linux)
$task = Get-ScheduledTask -TaskName "TVS" -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c cd /d $AppDir && pm2 resurrect"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
if ($task) { Unregister-ScheduledTask -TaskName "TVS" -Confirm:$false }
Register-ScheduledTask -TaskName "TVS" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest | Out-Null
Write-Host "  Task Scheduler 'TVS' criada (arranca o sistema ao boot)" -ForegroundColor Green

# Firewall (dashboards/API) — ajusta às tuas regras
New-NetFirewallRule -DisplayName "TVS-3000" -Direction Inbound -LocalPort 3000  -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "TVS-32123" -Direction Inbound -LocalPort 32123 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✓ SETUP COMPLETO (Windows Server)"
Write-Host "  Dashboard:  http://localhost:3000"
Write-Host "  Web API:    http://localhost:32123/api/health"
Write-Host "  Gestão:     pm2 status | pm2 restart tvs | pm2 logs tvs"
Write-Host "  Código:     $AppDir"
Write-Host "  PRÓXIMOS PASSOS:"
Write-Host "  1. Edita $AppDir\.env → TVS_PUBLIC_URL=http://localhost:32123 (ou o teu domínio)"
Write-Host "  2. pm2 restart tvs"
Write-Host "  3. (Opcional) IIS/ARR para expor 80/443 com HTTPS"
Write-Host "══════════════════════════════════════════════════════"
