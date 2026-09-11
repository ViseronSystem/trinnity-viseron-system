import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

for cmd in [
    'dir C:\\caddy\\certificates 2>&1',
    'dir C:\\caddy\\data 2>&1',
    'curl.exe -s -k -m 5 https://localhost:443 2>&1',
    'curl.exe -s -m 5 https://localhost:443/api/health -H "Host: trinnityviseronsystem.io" 2>&1',
    'curl.exe -s -m 5 http://localhost:80/api/health -H "Host: trinnityviseronsystem.io" 2>&1',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:400]}')
    if err: print(f'   ERR: {err[:200]}')
    print()

c.close()
