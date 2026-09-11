import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

for cmd in [
    'where caddy 2>&1',
    'dir C:\\Caddyfile 2>&1',
    'type C:\\Caddyfile 2>&1',
    'dir C:\\Users\\Administrator\\Caddyfile 2>&1',
    'type C:\\Users\\Administrator\\Caddyfile 2>&1',
    'powershell -Command "Get-Process caddy | Select-Object Path"',
    'netstat -ano | findstr 10204 | findstr LISTEN',
    'curl.exe -s -m 5 http://localhost:80 2>&1',
    'curl.exe -s -k -m 5 https://localhost:443 2>&1',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:400]}')
    if err: print(f'   ERR: {err[:200]}')
    print()

c.close()
