# restart.ps1 - Reinício do TVS v4 - lifecycle determinístico (Windows)
# O OmniRoute (porta 20128, AI gateway) NUNCA é morto: é um serviço persistente.
# O restart mata SÓ o processo do servidor TVS (identificado pelo comando
# dist/src/index.js) - NUNCA por porta (evita matar workers/OpenCode/n8n).
# Contracto de saída: SUCCESS=0 - FAILURE=1 - TIMEOUT=2.
param([int]$Timeout = 60)
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$Version = try { (Get-Content (Join-Path $Root "package.json") -Raw | ConvertFrom-Json).version } catch { "7.0.0" }
$LogFile = Join-Path $Root "data\restart.log"
$Standalone = Join-Path $PSScriptRoot "omniroute-standalone.cjs"
$ServiceFile = Join-Path $Root "data\state\tvs-service.json"
$Sw = [System.Diagnostics.Stopwatch]::StartNew()

function Log($msg) {
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
  try { [Console]::Out.WriteLine($line); [Console]::Out.Flush() } catch { Write-Output $line }
  try { Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8 } catch {}
}

function Save-ServiceRecord($service, $instance, $tvsPid, $port, $health) {
  try {
    $rec = @{
      service = $service
      instance = $instance
      pid = $tvsPid
      port = $port
      startedAt = (Get-Date).ToString("o")
      health = $health
      version = $Version
    } | ConvertTo-Json
    $dir = Split-Path -Parent $ServiceFile
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($ServiceFile, $rec, (New-Object System.Text.UTF8Encoding($false)))
  } catch {}
}

function Get-TvsProcess {
  # Identifica o processo do TVS pelo comando, não pela porta.
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match '^node' -and $_.CommandLine -match 'dist[\\/]src[\\/]index\.js'
  }
}

function Test-ProcessAlive($processId) {
  try { $p = Get-Process -Id $processId -ErrorAction Stop; return $p -ne $null } catch { return $false }
}

function Test-OmniRoute {
  # Health check puro - SEM executar launcher nem criar processos filho.
  try {
    $h = Invoke-RestMethod -Uri "http://localhost:20128/api/health" -TimeoutSec 3
    if ($h.status) { return $true }
  } catch {
    try {
      $m = Invoke-RestMethod -Uri "http://localhost:20128/v1/models" -TimeoutSec 3
      if ($m) { return $true }
    } catch {}
  }
  return $false
}

function Ensure-OmniRoute {
  Log "   a verificar OmniRoute (porta 20128)..."
  $before = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 20128 } | Select-Object -ExpandProperty OwningProcess -First 1

  $live = Test-OmniRoute
  if ($live) {
    Log "   OmniRoute JA no ar - health check apenas, sem launcher (sem processo filho)"
  } else {
    # Offline: executa o launcher standalone (spawn detached + unref, termina sozinho).
    Log "   OmniRoute em baixo - a executar launcher standalone..."
    & node $Standalone
    Start-Sleep -Seconds 2
    $live = Test-OmniRoute
    if ($live) {
      Log "   OmniRoute arrancado em background"
    } else {
      Log "   OmniRoute ainda a arrancar em background (a bridge reutiliza/reinicia sozinha)"
    }
  }

  $after = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 20128 } | Select-Object -ExpandProperty OwningProcess -First 1
  if ($before -and $after -and $before -eq $after) {
    Log "   OmniRoute PID inalterado: $after (sobreviveu ao restart)"
  }
  return $live
}

try {
  Log "=== RESTART v7 (determinístico): a comecar (timeout=${Timeout}s) ==="

  Log "1/5 OmniRoute (20128) NUNCA e morto. A garantir que esta no ar..."
  $null = Ensure-OmniRoute

  Log "2/5 A identificar o processo do servidor TVS (dist/src/index.js)..."
  $tvsProcs = Get-TvsProcess
  if (-not $tvsProcs) {
    Log "   nenhum processo do servidor TVS para matar"
  } else {
    foreach ($proc in $tvsProcs) {
      try { Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop; Log "   matou TVS PID $($proc.ProcessId)" } catch { Log "   falha PID $($proc.ProcessId): $($_.Exception.Message)" }
    }
  }
  Start-Sleep -Seconds 2

  # Confirmar que o TVS parou (processo morto de verdade)
  $stillRunning = Get-TvsProcess
  if ($stillRunning) {
    Log "   ERRO: processos TVS ainda vivos apos o kill"
    exit 1
  }

  Log "3/5 A iniciar servidor TVS detached (porta web 32123)..."
  # TVS_RESTART_ENTRY (opcional) permite o teste negativo apontar para uma entrada que falha.
  $entry = if ($env:TVS_RESTART_ENTRY) { $env:TVS_RESTART_ENTRY } else { "dist/src/index.js" }
  $proc = Start-Process -FilePath "node" -ArgumentList "--max-old-space-size=8192","$entry" `
    -WorkingDirectory $Root `
    -RedirectStandardOutput (Join-Path $Root "data\server_out.log") `
    -RedirectStandardError (Join-Path $Root "data\server_err.log") `
    -WindowStyle Hidden -PassThru
  $tvsPid = $proc.Id
  Log "   TVS iniciado (PID $tvsPid)"

  # Polling ativo: verifica a API web (32123) de 1 em 1s até responder.
  $lastProgress = 0
  Log "   a aguardar API 32123 (polling de 1s, timeout ${Timeout}s)..."
  $ready = $false
  while ($Sw.Elapsed.TotalSeconds -lt $Timeout) {
    try {
      $h = Invoke-RestMethod -Uri "http://localhost:32123/api/health" -TimeoutSec 2
      if ($h.status -eq "OK") {
        $ready = $true
        Log "   API PRONTA em $([math]::Round($Sw.Elapsed.TotalSeconds,1))s -> health=$($h.status) v=$($h.version) db=$($h.db)"
        break
      }
    } catch {
      # ainda a arrancar - imprime progresso a cada 5s para nao parecer congelado
      $s = [math]::Round($Sw.Elapsed.TotalSeconds)
      if ($s -ge $lastProgress + 5) {
        $lastProgress = $s
        Log "   ... ainda a arrancar (${s}s) ..."
      }
    }
    Start-Sleep -Milliseconds 1000
  }
  if (-not $ready) {
    Log "   TIMEOUT: API nao respondeu em ${Timeout}s"
    Save-ServiceRecord "tvs" "tvs-main" $tvsPid 32123 "timeout"
    Log "=== RESTART v7: TIMEOUT ==="
    exit 2
  }

  # VERIFICAÇÃO CRÍTICA: processo continua vivo APÓS o health check (HTTP 200 ≠ processo saudável)
  Start-Sleep -Seconds 1
  if (-not (Test-ProcessAlive $tvsPid)) {
    Log "   ERRO: o processo TVS (PID $tvsPid) MORREU apos responder ao health check"
    exit 1
  }
  Log "   processo TVS VIVO apos health check (PID $tvsPid)"
  Save-ServiceRecord "tvs" "tvs-main" $tvsPid 32123 "ready"

  # Verificações secundárias (rápidas, não bloqueiam o restart)
  Log "4/5 Verificações rápidas..."
  try {
    $os = Invoke-RestMethod -Uri "http://localhost:32123/api/os/status" -TimeoutSec 4
    Log "   os=$($os.version) agents=$($os.agents.loaded) watchdog=$($os.watchdog.enabled)"
  } catch { Log "   os indisponivel (ainda a carregar)" }
  try {
    $rev = Invoke-RestMethod -Uri "http://localhost:32123/api/revenue/readiness" -TimeoutSec 5
    Log "   revenue ok=$($rev.ok) faltam=$($rev.missing -join ',')"
  } catch { Log "   revenue indisponivel (ainda a carregar)" }
  try {
    $d = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 4
    Log "   dashboard(3000) health=$($d.status)"
  } catch { Log "   dashboard(3000) indisponivel" }
  try {
    $ai = Invoke-RestMethod -Uri "http://localhost:32123/api/ai/status" -TimeoutSec 4
    $aiAtivoTxt = if ($ai.ok) { "$($ai.active.id):$($ai.active.model)" } else { "nenhum (local dev)" }
    Log "   ai providers=$($ai.providers.count) ativo=$aiAtivoTxt"
  } catch { Log "   ai/status indisponivel (ainda a carregar)" }

  Log "5/5 DONE."
  Log "=== RESTART v7: COMPLETO em $([math]::Round($Sw.Elapsed.TotalSeconds,1))s (exit 0) ==="
  exit 0
} catch {
  Log "=== RESTART v7: ERRO inesperado: $($_.Exception.Message) ==="
  exit 1
}
