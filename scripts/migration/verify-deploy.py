import paramiko
import time
import sys

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

cmds = [
    'cd C:\\tvs && pm2 delete viseron 2>nul',
    'cd C:\\tvs && pm2 start "npm run start" --name viseron --cwd C:\\tvs',
    'pm2 save',
]
for cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=60)
    out = sout.read().decode('utf-8', errors='replace')
    err = serr.read().decode('utf-8', errors='replace')
    print(f'>> {cmd[:60]}')
    if out.strip(): print(f'   {out.strip()[:200]}')

time.sleep(10)

sin, sout, serr = c.exec_command('pm2 list --no-color')
print('PM2 STATUS:')
print(sout.read().decode('utf-8', errors='replace'))

sin, sout, serr = c.exec_command('powershell -Command "try { (Invoke-WebRequest http://localhost:3000 -TimeoutSec 10).StatusCode } catch { $_.Exception.Message }"')
print(f'HTTP: {sout.read().decode("utf-8", errors="replace").strip()}')

sin, sout, serr = c.exec_command('powershell -Command "Invoke-RestMethod -Uri http://localhost:3000/api/health -TimeoutSec 10 | ConvertTo-Json" 2>&1')
print(f'HEALTH: {sout.read().decode("utf-8", errors="replace").strip()[:300]}')

sin, sout, serr = c.exec_command('pm2 logs viseron --lines 10 --nostream --no-color')
print('LOGS:')
print(sout.read().decode('utf-8', errors='replace'))

c.close()
