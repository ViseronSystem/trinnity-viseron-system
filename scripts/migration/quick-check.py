import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Simple commands first
for cmd in [
    'pm2 list --no-color',
    'findstr SERVER_IP C:\\tvs\\.env',
    'findstr TVS_PUBLIC C:\\tvs\\.env',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:50]}')
    print(out[:500])
    print()

# HTTP test with timeout
print('>>> HTTP tests...')
for port in [32123, 3001]:
    sin, sout, serr = c.exec_command(f'curl -s -m 5 http://localhost:{port}/api/health', timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'  Port {port}: {out[:300]}')

c.close()
