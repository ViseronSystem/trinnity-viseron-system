import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

cmds = [
    ('Install types', 'cd C:\\tvs && npm install --save-dev @types/express @types/node 2>&1'),
    ('Build', 'cd C:\\tvs && npm run build 2>&1'),
]
for label, cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=300)
    out = sout.read().decode('ascii', errors='replace')
    err = serr.read().decode('ascii', errors='replace')
    print(f'{label}: {out.strip()[-300:]}')
    if err.strip():
        print(f'  ERR: {err.strip()[-300:]}')

sin, sout, serr = c.exec_command('pm2 list')
print('PM2:')
print(sout.read().decode('ascii', errors='replace'))

sin, sout, serr = c.exec_command('cd C:\\tvs && pm2 delete viseron 2>nul & pm2 start "npm run start" --name viseron --cwd C:\\tvs && pm2 save')
print(sout.read().decode('ascii', errors='replace'))

time.sleep(8)
sin, sout, serr = c.exec_command('powershell -Command "try { (Invoke-WebRequest http://localhost:3000 -TimeoutSec 10).StatusCode } catch { $_.Exception.Message }"')
print(f'HTTP: {sout.read().decode("ascii", errors="replace").strip()}')

sin, sout, serr = c.exec_command('pm2 logs viseron --lines 20 --nostream')
print('Logs:')
print(sout.read().decode('ascii', errors='replace'))

c.close()
