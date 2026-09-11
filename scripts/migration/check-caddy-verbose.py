import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

for cmd in [
    'tasklist /fi "imagename eq caddy.exe" /fo csv /nh',
    'powershell -Command "Get-Process caddy | Select-Object Id, ProcessName, StartTime"',
    'curl.exe -v -k -m 5 https://localhost:443/ 2>&1',
    'curl.exe -v -m 5 http://localhost:80/ 2>&1',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:600]}')
    if err: print(f'   ERR: {err[:400]}')
    print()

c.close()
