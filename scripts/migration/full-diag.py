import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Full diagnostics
for cmd in [
    'pm2 list --no-color',
    'pm2 logs tvs --lines 10 --nostream --no-color',
    'curl.exe -s -m 5 http://localhost:3000/api/health',
    'curl.exe -s -m 5 http://localhost:80/api/health',
    'curl.exe -s -m 10 https://www.trinnityviseronsystem.io/api/health',
    'tasklist /fi "mem gt 100000" /fo csv /nh',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'=== {cmd[:50]} ===')
    print(out[:600])
    if err and 'error' in err.lower(): print(f'ERR: {err[:200]}')
    print()

c.close()
