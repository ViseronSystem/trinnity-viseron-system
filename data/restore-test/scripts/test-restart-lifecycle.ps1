# test-restart-lifecycle.ps1 - TESTE DE CICLO DE VIDA DO RESTART (Windows)
# Prova que o restart:
#   1. termina como processo externo (devolve o controle ao pai)
#   2. exit code = 0 em sucesso; exit != 0 quando a entrada falha (teste negativo)
#   3. OmniRoute PID antes == depois (nunca morto)
#   4. TVS PID antes != depois (reiniciado)
#   5. TVS :32123 responde + dashboard :3000 responde
#   6. nenhum processo filho do restart continua vivo (exceto TVS+OmniRoute, intencionais)
#   7. sem handles/processos orfaos (stdin/stdout/stderr herdados)
# Ordem: teste NEGATIVO primeiro (mata o TVS ao falhar), depois o POSITIVO deixa o sistema a correr.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/test-restart-lifecycle.ps1 [-Timeout 60]
param([int]$Timeout = 60)
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$Restart = Join-Path $Root "scripts\restart.ps1"
$Fails = 0
$Passes = 0

function Check($cond, $name) {
  if ($cond) { $script:Passes++; Write-Host "  [PASS] $name" }
  else { $script:Fails++; Write-Host "  [FAIL] $name" }
}

function Get-OmniRoutePid {
  Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -eq 20128 } | Select-Object -ExpandProperty OwningProcess -First 1
}

function Get-TvsPid {
  $p = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^node' -and $_.CommandLine -match 'dist[\\/]src[\\/]index\.js' } |
    Select-Object -First 1
  if ($p) { return [int]$p.ProcessId }
  return 0
}

function Get-Descendants([int]$rootPid) {
  $procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue
  $map = @{}
  foreach ($p in $procs) { $map[[int]$p.ProcessId] = [int]$p.ParentProcessId }
  $found = New-Object System.Collections.Generic.HashSet[int]
  [void]$found.Add($rootPid)
  $changed = $true
  while ($changed) {
    $changed = $false
    foreach ($k in $map.Keys) {
      if ($found.Contains($map[$k]) -and -not $found.Contains($k)) {
        [void]$found.Add($k); $changed = $true
      }
    }
  }
  return $found
}

function Run-RestartExternal {
  param([string]$RestartFile, [int]$TimeoutSec)
  $p = Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File","`"$RestartFile`""
  ) -PassThru -WorkingDirectory $Root -WindowStyle Hidden
  $sw2 = [System.Diagnostics.Stopwatch]::StartNew()
  $ex = $p.WaitForExit($TimeoutSec * 1000)
  $sw2.Stop()
  if (-not $ex) { try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } catch {} }
  return @{ Proc = $p; Exited = $ex; ExitCode = if ($ex) { $p.ExitCode } else { -1 }; Elapsed = $sw2.Elapsed }
}

Write-Host "=============================================="
Write-Host "TEST RESTART LIFECYCLE (processo externo)"
Write-Host "=============================================="

# --- Estado antes ---
$omnirouteBefore = Get-OmniRoutePid
$tvsBefore = Get-TvsPid
Write-Host "ANTES:  OmniRoute PID=$omnirouteBefore  TVS PID=$tvsBefore"

$beforeTree = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^(node|powershell|cmd)' } |
  Select-Object ProcessId, ParentProcessId, Name, @{n='Cmd';e={ $_.CommandLine }}

Write-Host ""
Write-Host "--- Teste NEGATIVO: entrada invalida deve devolver exit != 0 ---"
$env:TVS_RESTART_ENTRY = "dist/src/nao-existe.js"
$neg = Run-RestartExternal -RestartFile $Restart -TimeoutSec 90
Remove-Item Env:\TVS_RESTART_ENTRY -ErrorAction SilentlyContinue
Write-Host "NEG terminou em $([math]::Round($neg.Elapsed.TotalSeconds,1))s EXIT_CODE=$($neg.ExitCode)"
if ($neg.Exited -and $neg.ExitCode -ne 0) {
  Check $true "teste negativo: entrada invalida devolve exit $($neg.ExitCode) (nao zero)"
} else {
  Check $false "teste negativo: entrada invalida devolve exit $($neg.ExitCode) (deveria ser nao zero)"
}

Write-Host ""
Write-Host "--- Teste POSITIVO: restart real deve devolver exit 0 ---"
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$pos = Run-RestartExternal -RestartFile $Restart -TimeoutSec 90
$sw.Stop()
$proc = $pos.Proc
$exited = $pos.Exited
$exitCode = $pos.ExitCode
Write-Host "POS terminou em $([math]::Round($pos.Elapsed.TotalSeconds,1))s EXIT_CODE=$exitCode"

Start-Sleep -Seconds 3
$omnirouteAfter = Get-OmniRoutePid
$tvsAfter = Get-TvsPid
Write-Host "DEPOIS: OmniRoute PID=$omnirouteAfter  TVS PID=$tvsAfter"

Write-Host ""
Write-Host "--- Assertions ---"
Check ($exited -eq $true) "processo do restart sai em tempo util (< 90 s)"
Check ($exitCode -eq 0) "restart termina com exit code 0 (devolve controle ao pai)"
Check ($omnirouteBefore -eq $omnirouteAfter -and $omnirouteAfter -gt 0) "OmniRoute PID preservado ($omnirouteBefore para $omnirouteAfter)"
Check ($tvsAfter -gt 0 -and $tvsAfter -ne $tvsBefore) "TVS PID novo (diferente de antes)"
try {
  $h = Invoke-RestMethod -Uri "http://localhost:32123/api/health" -TimeoutSec 8
  Check ($h.status -eq "OK") "TVS :32123 responde (health=$($h.status))"
} catch { Check $false "TVS :32123 responde" }
try {
  $d = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 8
  Check ($d.status -eq "OK") "dashboard :3000 responde"
} catch { Check $false "dashboard :3000 responde" }

# --- Verificacao de orfaos/handles herdados ---
# Nenhum descendente do restart pode continuar vivo EXCETO os sobreviventes intencionais:
# o novo TVS e TODA a sua subarvore (ex. conhost do node hidden) e o OmniRoute (nunca morto).
$orphanCount = 0
$orphanDetails = @()
$orphans = Get-Descendants $proc.Id
$intentional = New-Object System.Collections.Generic.HashSet[int]
[void]$intentional.Add($tvsAfter)
[void]$intentional.Add($omnirouteAfter)
$tvsSubtree = Get-Descendants $tvsAfter
foreach ($s in $tvsSubtree) { [void]$intentional.Add($s) }
foreach ($p in $orphans) {
  if ($p -eq $proc.Id) { continue }
  if ($intentional.Contains($p)) { continue }
  $alive = Get-Process -Id $p -ErrorAction SilentlyContinue
  if ($alive) {
    $orphanCount++
    $aliveProcs = Get-CimInstance Win32_Process -Filter "ProcessId=$p" -ErrorAction SilentlyContinue
    $cmd = ""
    if ($aliveProcs) { $cmd = [string]$aliveProcs.CommandLine }
    $orphanDetails += "  orfao pid=$p ppid=$($aliveProcs.ParentProcessId) name=$($aliveProcs.Name) cmd=$cmd"
  }
}
Check ($orphanCount -eq 0) "nenhum processo filho do restart continua vivo (orfaos=$orphanCount, exclui subarvore TVS+OmniRoute)"
if ($orphanDetails.Count -gt 0) { $orphanDetails | ForEach-Object { Write-Host $_ } }

$afterTree = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^(node|powershell|cmd)' } |
  Select-Object ProcessId, ParentProcessId, Name, @{n='Cmd';e={ $_.CommandLine }}
$suspicious = @()
$tvsSubtree2 = Get-Descendants $tvsAfter
foreach ($p in $afterTree) {
  if ($p.ProcessId -eq $omnirouteAfter -or $tvsSubtree2.Contains([int]$p.ProcessId)) { continue }
  $wasBefore = $beforeTree | Where-Object { $_.ProcessId -eq $p.ProcessId }
  $cmd = [string]$p.Cmd
  if (-not $wasBefore -and $cmd -match 'omniroute|restart|dist[\\/]src[\\/]index|npx') {
    $suspicious += "  novo pid=$($p.ProcessId) ppid=$($p.ParentProcessId) name=$($p.Name)"
  }
}
if ($suspicious.Count -eq 0) {
  Check $true "sem processos suspeitos novos (handles/npx orfaos)"
} else {
  Check $false "sem processos suspeitos novos"
  $suspicious | ForEach-Object { Write-Host $_ }
}

Write-Host ""
Write-Host "--- Registo final ---"
Write-Host "  Neg exit:       $($neg.ExitCode)"
Write-Host "  OmniRoute PID:  $omnirouteBefore para $omnirouteAfter"
Write-Host "  TVS PID:        $tvsBefore para $tvsAfter"
Write-Host "  Pos exit code:  $exitCode"
Write-Host "  Tempo positivo: $([math]::Round($pos.Elapsed.TotalSeconds,1))s"

Write-Host ""
Write-Host "RESULTADO: $Passes passaram, $Fails falharam"
if ($Fails -gt 0) { exit 1 }
exit 0
