# restart.ps1 — Reinício à prova de congelamento do TVS
# Mata TUDO (servidor + órfãos OmniRoute/n8n por command line), reinicia, verifica
# e regista cada passo em data/restart.log (nunca fica "mudo" a parecer parado).
param([int]$Wait = 25)
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$LogFile = Join-Path $Root "data\restart.log"

function Log($msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Write-Host $line
  try { Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8 } catch {}
}

Log "=== RESTART: a comecar (Wait=${Wait}s) ==="

Log "A matar processos TVS/OmniRoute/n8n (servidor + orfaos)..."
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
if ($pids.Count -eq 0) {
  Log "Nenhum processo encontrado para matar."
} else {
  foreach ($p in $pids) {
    try { Stop-Process -Id $p -Force -ErrorAction Stop; Log "Matou PID ${p}" } catch { Log "Falha a matar PID ${p}: $($_.Exception.Message)" }
  }
}
Start-Sleep -Seconds 3

Log "A iniciar servidor..."
Start-Process -FilePath "node" -ArgumentList "--max-old-space-size=8192","dist/src/index.js" `
  -WorkingDirectory $Root `
  -RedirectStandardOutput (Join-Path $Root "data\server_out.log") `
  -RedirectStandardError (Join-Path $Root "data\server_err.log") `
  -WindowStyle Hidden

Log "A aguardar arranque (${Wait}s)..."
Start-Sleep -Seconds $Wait

try {
  $h = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 6
  Log "health=$($h.status)"
} catch {
  Log "health FALHOU: $($_.Exception.Message)"
}
try {
  $os = Invoke-RestMethod -Uri "http://localhost:3000/api/os/status" -TimeoutSec 6
  Log "os=$($os.version) agents=$($os.agents.loaded) watchdog=$($os.watchdog.enabled)"
} catch {
  Log "os FALHOU: $($_.Exception.Message)"
}
try {
  $rev = Invoke-RestMethod -Uri "http://localhost:32123/api/revenue/readiness" -TimeoutSec 8
  Log "revenue ok=$($rev.ok) faltam=$($rev.missing -join ',')"
} catch {
  Log "revenue FALHOU: $($_.Exception.Message)"
}

Log "=== RESTART: COMPLETO ==="
