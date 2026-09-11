import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

for cmd in [
    'pm2 list --no-color',
    'netstat -ano | findstr LISTEN | findstr ":32123"',
    'curl.exe -s -m 5 http://localhost:32123/api/health',
    'curl.exe -s -m 5 http://localhost:80/api/health',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:400]}')
    print()

c.close()
