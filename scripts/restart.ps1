# restart.ps1 — Reinício à prova de congelamento do TVS
# Mata TUDO (servidor + órfãos OmniRoute/n8n por command line), reinicia e verifica.
param([int]$Wait = 25)
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "[restart] A matar processos TVS/OmniRoute/n8n (servidor + orfaos)..."
$pids = @()
foreach ($port in 3000, 3001, 32123, 20128, 5678) {
  $conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $port }
  foreach ($c in $conns) { $pids += [int]$c.OwningProcess }
}
$cmdPids = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
  $_.Name -match '^node' -and $_.CommandLine -match 'omniroute|dist[\\/]src[\\/]index\.js|n8n'
}
foreach ($proc in $cmdPids) { $pids += [int]$proc.ProcessId }

$pids = $pids | Where-Object { $_ -gt 0 } | Select-Object -Unique
foreach ($p in $pids) {
  try { Stop-Process -Id $p -Force -ErrorAction Stop; Write-Host "  matou PID $p" } catch {}
}
Start-Sleep -Seconds 3

Write-Host "[restart] A iniciar servidor..."
Start-Process -FilePath "node" -ArgumentList "--max-old-space-size=8192","dist/src/index.js" `
  -WorkingDirectory $Root `
  -RedirectStandardOutput "$Root\data\server_out.log" `
  -RedirectStandardError "$Root\data\server_err.log" `
  -WindowStyle Hidden

Write-Host "[restart] A aguardar arranque (${Wait}s)..."
Start-Sleep -Seconds $Wait

try {
  $h = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 6
  Write-Host "[restart] health=$($h.status)"
} catch {
  Write-Host "[restart] health FALHOU: $($_.Exception.Message)"
}
try {
  $os = Invoke-RestMethod -Uri "http://localhost:3000/api/os/status" -TimeoutSec 6
  Write-Host "[restart] os=$($os.version) agents=$($os.agents.loaded) watchdog=$($os.watchdog.enabled)"
} catch {
  Write-Host "[restart] os FALHOU: $($_.Exception.Message)"
}
try {
  $rev = Invoke-RestMethod -Uri "http://localhost:32123/api/revenue/readiness" -TimeoutSec 8
  Write-Host "[restart] revenue ok=$($rev.ok) faltam=$($rev.missing -join ',')"
} catch {
  Write-Host "[restart] revenue FALHOU: $($_.Exception.Message)"
}
