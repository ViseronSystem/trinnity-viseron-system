# Para el scanner 24/7
Get-Process puzzle-scanner -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process powershell -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $PID } | ForEach-Object {
  $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
  if ($cmd -match 'run24\.ps1') { Stop-Process -Id $_.Id -Force }
}
Write-Output "Scanner parado."
