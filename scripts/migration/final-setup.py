import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Update shortcuts to use port 3000
shortcut_ps1 = r'''
$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [System.Environment]::GetFolderPath("Desktop")

# START TVS
$Shortcut = $WshShell.CreateShortcut("$Desktop\START TVS System.lnk")
$Shortcut.TargetPath = "C:\Windows\System32\cmd.exe"
$Shortcut.Arguments = "/c cd /d C:\tvs && pm2 resurrect && timeout /t 3 && start http://localhost:3000 && cmd"
$Shortcut.WorkingDirectory = "C:\tvs"
$Shortcut.Description = "Start VISERON System"
$Shortcut.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
$Shortcut.Save()

# VISERON Dashboard
$Shortcut3 = $WshShell.CreateShortcut("$Desktop\VISERON Dashboard.lnk")
$Shortcut3.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$Shortcut3.Arguments = "http://localhost:3000"
$Shortcut3.WorkingDirectory = "C:\tvs"
$Shortcut3.Description = "Open VISERON Dashboard"
$Shortcut3.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
$Shortcut3.Save()

# SERVER INFO
$Shortcut5 = $WshShell.CreateShortcut("$Desktop\SERVER INFO.lnk")
$Shortcut5.TargetPath = "C:\Windows\System32\cmd.exe"
$Shortcut5.Arguments = "/c echo === VISERON SERVER === && echo IP: 194.62.97.30 && echo URL: https://www.trinnityviseronsystem.io && echo Local: http://localhost:3000 && echo. && echo === SERVICES === && pm2 list && echo. && pause"
$Shortcut5.WorkingDirectory = "C:\tvs"
$Shortcut5.Description = "Server Information"
$Shortcut5.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
$Shortcut5.Save()

Write-Output "Shortcuts updated!"
'''

sftp = c.open_sftp()
with sftp.open('C:/tmp/update-shortcuts.ps1', 'w') as f:
    f.write(shortcut_ps1)
sftp.close()

sin, sout, serr = c.exec_command('powershell -ExecutionPolicy Bypass -File C:\\tmp\\update-shortcuts.ps1')
print('Shortcuts: ' + sout.read().decode('utf-8', errors='replace').strip())

# Update START.bat
startup_bat = r'''@echo off
echo ============================================
echo   VISERON SYSTEM - Server Manager
echo   IP: 194.62.97.30
echo   URL: https://www.trinnityviseronsystem.io
echo   Local: http://localhost:3000
echo ============================================
echo.
echo Starting services...
cd /d C:\tvs
pm2 resurrect
echo.
echo Services started!
echo Opening dashboard...
start http://localhost:3000
echo.
echo ============================================
echo   Commands:
echo   pm2 list       - See all services
echo   pm2 logs tvs   - See TVS logs
echo   pm2 restart tvs - Restart TVS
echo   pm2 stop tvs   - Stop TVS
echo ============================================
pause
'''
sftp = c.open_sftp()
with sftp.open('C:/tvs/START.bat', 'w') as f:
    f.write(startup_bat)
sftp.close()

# Update startup.bat
startup = r'''@echo off
cd /d C:\tvs
pm2 resurrect
'''
sftp = c.open_sftp()
with sftp.open('C:/tvs/startup.bat', 'w') as f:
    f.write(startup)
sftp.close()

# Install opencode
print('\n=== INSTALANDO OPENCODE ===')
sin, sout, serr = c.exec_command('npm install -g @anthropic-ai/opencode 2>&1', timeout=120)
out = sout.read().decode('utf-8', errors='replace').strip()
print('Install: ' + out[-300:])

sin, sout, serr = c.exec_command('opencode --version 2>&1')
print('Version: ' + sout.read().decode('utf-8', errors='replace').strip()[:100])

# Verify final
sin, sout, serr = c.exec_command('curl.exe -s -m 10 https://www.trinnityviseronsystem.io/api/health')
print('\nDOMAIN: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

c.close()
