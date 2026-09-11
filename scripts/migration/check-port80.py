import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Check what's on port 80
cmds = [
    'netstat -ano | findstr :80 | findstr LISTEN',
    'tasklist /fi "PID eq 4" /fo csv /nh 2>&1',
    'powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 80).OwningProcess -ErrorAction SilentlyContinue | Select-Object Id, ProcessName"',
    'dir C:\\nginx* 2>&1',
    'dir C:\\inetpub 2>&1',
    'where nginx 2>&1',
]
for cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:300]}')
    print()

c.close()
