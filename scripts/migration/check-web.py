import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

for cmd in [
    'curl.exe -s -m 5 http://localhost:80 2>&1',
    'curl.exe -s -m 5 http://localhost:443 2>&1',
    'curl.exe -s -m 5 http://localhost:32123/viseron 2>&1 | findstr /i title',
    'curl.exe -s -m 5 http://localhost:32123/cosmos 2>&1 | findstr /i title',
    'curl.exe -s -m 5 http://localhost:32123/game 2>&1 | findstr /i title',
    'curl.exe -s -m 5 http://localhost:32123/atlas 2>&1 | findstr /i title',
    'findstr PORT C:\\tvs\\.env',
    'findstr REPORT_PORT C:\\tvs\\.env',
    'netstat -an | findstr :80 | findstr LISTEN',
    'netstat -an | findstr :443 | findstr LISTEN',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:400]}')
    print()

c.close()
