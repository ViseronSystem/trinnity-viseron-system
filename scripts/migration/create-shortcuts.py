import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Check PM2 status
sin, sout, serr = c.exec_command('pm2 list --no-color')
print('PM2 STATUS:')
print(sout.read().decode('utf-8', errors='replace'))

# Check all ports
sin, sout, serr = c.exec_command('netstat -ano | findstr LISTEN')
lines = sout.read().decode('utf-8', errors='replace')
print('PORTS LISTENING:')
for line in lines.split('\n'):
    l = line.strip()
    if any(p in l for p in [':80 ', ':443 ', ':3001 ', ':32123 ', ':20128 ', ':22 ']):
        print(f'  {l}')

# Create desktop shortcuts
print('\nCREATING DESKTOP SHORTCUTS...')

# 1. Start TVS shortcut
shortcut_ps1 = r'''
$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [System.Environment]::GetFolderPath("Desktop")

# START TVS
$Shortcut = $WshShell.CreateShortcut("$Desktop\START TVS System.lnk")
$Shortcut.TargetPath = "C:\Windows\System32\cmd.exe"
$Shortcut.Arguments = "/c cd /d C:\tvs && pm2 resurrect && timeout /t 3 && start http://localhost:32123 && cmd"
$Shortcut.WorkingDirectory = "C:\tvs"
$Shortcut.Description = "Start VISERON System"
$Shortcut.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
$Shortcut.Save()

# STOP TVS
$Shortcut2 = $WshShell.CreateShortcut("$Desktop\STOP TVS System.lnk")
$Shortcut2.TargetPath = "C:\Windows\System32\cmd.exe"
$Shortcut2.Arguments = "/c pm2 stop all && echo TVS stopped && pause"
$Shortcut2.WorkingDirectory = "C:\tvs"
$Shortcut2.Description = "Stop VISERON System"
$Shortcut2.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
$Shortcut2.Save()

# TVS Dashboard (browser)
$Shortcut3 = $WshShell.CreateShortcut("$Desktop\VISERON Dashboard.lnk")
$Shortcut3.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$Shortcut3.Arguments = "http://localhost:32123"
$Shortcut3.WorkingDirectory = "C:\tvs"
$Shortcut3.Description = "Open VISERON Dashboard"
$Shortcut3.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
$Shortcut3.Save()

# PM2 Monitor
$Shortcut4 = $WshShell.CreateShortcut("$Desktop\PM2 Monitor.lnk")
$Shortcut4.TargetPath = "C:\Windows\System32\cmd.exe"
$Shortcut4.Arguments = "/c pm2 monit"
$Shortcut4.WorkingDirectory = "C:\tvs"
$Shortcut4.Description = "PM2 Process Monitor"
$Shortcut4.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
$Shortcut4.Save()

# Server Info
$Shortcut5 = $WshShell.CreateShortcut("$Desktop\SERVER INFO.lnk")
$Shortcut5.TargetPath = "C:\Windows\System32\cmd.exe"
$Shortcut5.Arguments = "/c echo === VISERON SERVER === && echo IP: 194.62.97.30 && echo URL: https://www.trinnityviseronsystem.io && echo Local: http://localhost:32123 && echo. && echo === SERVICES === && pm2 list && echo. && pause"
$Shortcut5.WorkingDirectory = "C:\tvs"
$Shortcut5.Description = "Server Information"
$Shortcut5.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
$Shortcut5.Save()

Write-Output "All shortcuts created!"
'''

sftp = c.open_sftp()
with sftp.open('C:/tmp/create-shortcuts.ps1', 'w') as f:
    f.write(shortcut_ps1)
sftp.close()

sin, sout, serr = c.exec_command('powershell -ExecutionPolicy Bypass -File C:\\tmp\\create-shortcuts.ps1')
print(sout.read().decode('utf-8', errors='replace').strip())

# Verify shortcuts
sin, sout, serr = c.exec_command('dir "C:\\Users\\Administrator\\Desktop\\*.lnk"')
print('\nDesktop shortcuts:')
print(sout.read().decode('utf-8', errors='replace').strip())

# Create a bat file for easy start
bat_content = r'''@echo off
echo ============================================
echo   VISERON SYSTEM - Server Manager
echo   IP: 194.62.97.30
echo   URL: https://www.trinnityviseronsystem.io
echo ============================================
echo.
echo Starting services...
cd /d C:\tvs
pm2 resurrect
echo.
echo Services started!
echo.
echo Opening dashboard...
start http://localhost:32123
echo.
echo ============================================
echo   Commands:
echo   pm2 list      - See all services
echo   pm2 logs tvs  - See TVS logs
echo   pm2 restart tvs - Restart TVS
echo   pm2 stop tvs  - Stop TVS
echo ============================================
pause
'''

sftp = c.open_sftp()
with sftp.open('C:/tvs/START.bat', 'w') as f:
    f.write(bat_content)
sftp.close()
print('\nSTART.bat created in C:\\tvs')

# Also create STOP.bat
stop_bat = r'''@echo off
echo Stopping all services...
pm2 stop all
echo All services stopped!
pause
'''
sftp = c.open_sftp()
with sftp.open('C:/tvs/STOP.bat', 'w') as f:
    f.write(stop_bat)
sftp.close()
print('STOP.bat created in C:\\tvs')

# Make sure PM2 auto-starts on boot
sin, sout, serr = c.exec_command('pm2 save')
print('\npm2 save: ' + sout.read().decode('utf-8', errors='replace').strip())

sin, sout, serr = c.exec_command('pm2 startup 2>&1')
print('pm2 startup: ' + sout.read().decode('utf-8', errors='replace').strip()[:300])

# Final verification
sin, sout, serr = c.exec_command('curl.exe -s -m 5 https://www.trinnityviseronsystem.io/api/health')
print('\nDomain test: ' + sout.read().decode('utf-8', errors='replace').strip())

c.close()
