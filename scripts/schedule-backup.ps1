# Schedule daily backup using Windows Task Scheduler
$TaskName = "TVS-DailyBackup"
$ScriptPath = "$PSScriptRoot\backup-system.ps1"
$WorkingDir = "C:\Trinnity-Viseron-System"

# Check if task already exists
$Existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Existing) {
    Write-Host "Task '$TaskName' ja existe. Atualizando..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create daily trigger at 03:00
$Trigger = New-ScheduledTaskTrigger -Daily -At 03:00

# Action: run PowerShell script
$Action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""

# Run as current user
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Register the task
Register-ScheduledTask -TaskName $TaskName -Trigger $Trigger -Action $Action -Principal $Principal -Description "TVS Daily Backup - Trinnity Viseron System"

Write-Host "=== Backup diario agendado com sucesso! ===" -ForegroundColor Green
Write-Host "Task: $TaskName" -ForegroundColor Cyan
Write-Host "Horario: Diario as 03:00" -ForegroundColor Cyan
Write-Host "Script: $ScriptPath" -ForegroundColor Cyan
