# Scanner 24/7 — modo loteria continua (16 hilos, prioridad baja, log persistente)
# Deja 4 cores libres para el TVS. Parar con: stop24.ps1
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir
try {
  (Get-Process -Id $PID).PriorityClass = 'BelowNormal'
} catch {}
$i = 0
while ($true) {
  $i++
  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  "=== ciclo $i @ $ts ===" | Add-Content "$dir\scan.log"
  & "$dir\target\release\puzzle-scanner.exe" 20000000 16 *>> "$dir\scan.log"
  Start-Sleep -Seconds 1
}
