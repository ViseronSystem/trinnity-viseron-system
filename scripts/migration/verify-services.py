import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

cmds = [
    ('Health 32123', 'powershell -Command "(Invoke-WebRequest http://localhost:32123/api/health -TimeoutSec 10).Content.Substring(0,500)"'),
    ('Health 3001', 'powershell -Command "(Invoke-WebRequest http://localhost:3001 -TimeoutSec 10).StatusCode"'),
    ('Health 20128', 'powershell -Command "(Invoke-WebRequest http://localhost:20128 -TimeoutSec 10).StatusCode"'),
    ('PM2', 'pm2 list --no-color'),
    ('Env check', 'findstr SERVER_IP C:\\tvs\\.env'),
    ('Env public', 'findstr TVS_PUBLIC C:\\tvs\\.env'),
]
for label, cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=20)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'=== {label} ===')
    print(out[:600])
    print()

c.close()
