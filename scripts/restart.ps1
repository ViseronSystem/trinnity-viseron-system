# restart.ps1 — Reinício do TVS v3 · SEM parar tudo (OmniRoute persistente)
# O OmniRoute (porta 20128, AI gateway) NUNCA é morto: é um serviço persistente.
# O restart mata SÓ o servidor principal (dist/src/index.js, portas 3000/32123)
# e órfãos n8n (5678). O OmniRoute que já está no ar é REUTILIZADO pela bridge
# (porta em uso) — por isso o arranque volta em ~8s e a IA nunca fica offline.
# Se o OmniRoute estiver em baixo, o launcher standalone sobe-o detached.
param([int]$Timeout = 60)
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$LogFile = Join-Path $Root "data\restart.log"
$Standalone = Join-Path $PSScriptRoot "omniroute-standalone.cjs"

function Log($msg) {
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
  Write-Host $line
  try { Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8 } catch {}
}

function Ensure-OmniRoute {
  Log "   a verificar OmniRoute (porta 20128)..."
  & node $Standalone
  Start-Sleep -Seconds 2
  $live = $false
  try {
    $h = Invoke-RestMethod -Uri "http://localhost:20128/api/health" -TimeoutSec 3
    $live = $true
    Log "   OmniRoute VIVO: http://localhost:20128 (health=$($h.status))"
  } catch {
    try {
      $m = Invoke-RestMethod -Uri "http://localhost:20128/v1/models" -TimeoutSec 3
      $live = $true
      Log "   OmniRoute VIVO: http://localhost:20128 (models=$($m.Count))"
    } catch {
      Log "   OmniRoute ainda a arrancar em background (a bridge reutiliza/reinicia sozinha)"
    }
  }
}

Log "=== RESTART v3 (sem parar tudo): a comecar (timeout=${Timeout}s) ==="

Log "1/5 OmniRoute (20128) NUNCA e morto. A garantir que esta no ar..."
Ensure-OmniRoute

Log "2/5 A matar SO o servidor TVS (dist/src/index.js) + orfaos n8n (NÃO 20128)..."
$pids = @()
foreach ($port in 3000, 3001, 32123, 5678) {
  $conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $port }
  foreach ($c in $conns) { $pids += [int]$c.OwningProcess }
}
$cmdPids = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
  $_.Name -match '^node' -and $_.CommandLine -match 'dist[\\/]src[\\/]index\.js|n8n'
}
foreach ($proc in $cmdPids) { $pids += [int]$proc.ProcessId }

$pids = $pids | Where-Object { $_ -gt 0 } | Select-Object -Unique
if ($pids.Count -eq 0) {
  Log "   nenhum processo do servidor para matar"
} else {
  foreach ($p in $pids) {
    try { Stop-Process -Id $p -Force -ErrorAction Stop; Log "   matou PID ${p}" } catch { Log "   falha PID ${p}: $($_.Exception.Message)" }
  }
}
Start-Sleep -Seconds 3

Log "3/5 A confirmar OmniRoute apos o kill do servidor..."
Ensure-OmniRoute

Log "4/5 A iniciar servidor (porta web 32123)..."
Start-Process -FilePath "node" -ArgumentList "--max-old-space-size=8192","dist/src/index.js" `
  -WorkingDirectory $Root `
  -RedirectStandardOutput (Join-Path $Root "data\server_out.log") `
  -RedirectStandardError (Join-Path $Root "data\server_err.log") `
  -WindowStyle Hidden

# Polling ativo: verifica a API web (32123) de 2 em 2s até responder.
# Assim que responder, o sistema é utilizável — sem espera cega.
Log "   a aguardar API 32123 (polling de 2s, timeout ${Timeout}s)..."
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$ready = $false
while ($sw.Elapsed.TotalSeconds -lt $Timeout) {
  try {
    $h = Invoke-RestMethod -Uri "http://localhost:32123/api/health" -TimeoutSec 3
    if ($h.status -eq "OK") {
      $ready = $true
      Log "   API PRONTA em $([math]::Round($sw.Elapsed.TotalSeconds,1))s -> health=$($h.status) db=$($h.db) tenants=$($h.tenants) users=$($h.users)"
      break
    }
  } catch {
    # ainda a arrancar — aguarda próximo poll
  }
  Start-Sleep -Seconds 2
}
if (-not $ready) {
  Log "   AVISO: API nao respondeu em ${Timeout}s (sistema pode ainda estar a carregar o core pesado em background)"
}

# Verificações secundárias (rápidas, não bloqueiam o restart)
Log "5/5 Verificações rápidas..."
try {
  $os = Invoke-RestMethod -Uri "http://localhost:32123/api/os/status" -TimeoutSec 5
  Log "   os=$($os.version) agents=$($os.agents.loaded) watchdog=$($os.watchdog.enabled)"
} catch { Log "   os indisponivel (ainda a carregar)" }
try {
  $rev = Invoke-RestMethod -Uri "http://localhost:32123/api/revenue/readiness" -TimeoutSec 6
  Log "   revenue ok=$($rev.ok) faltam=$($rev.missing -join ',')"
} catch { Log "   revenue indisponivel (ainda a carregar)" }
try {
  $d = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 5
  Log "   dashboard(3000) health=$($d.status)"
} catch { Log "   dashboard(3000) indisponivel" }
try {
  $ai = Invoke-RestMethod -Uri "http://localhost:32123/api/ai/status" -TimeoutSec 5
  Log "   ai providers=$($ai.providers.count) ativo=$($ai.activeProvider)"
} catch { Log "   ai/status indisponivel (ainda a carregar)" }

Log "=== RESTART v3: COMPLETO em $([math]::Round($sw.Elapsed.TotalSeconds,1))s (OmniRoute continuou vivo) ==="
