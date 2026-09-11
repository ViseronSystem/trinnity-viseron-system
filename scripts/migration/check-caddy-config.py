import paramiko, sys, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Check Caddy admin API config
for cmd in [
    'curl.exe -s http://localhost:2019/config/',
    'curl.exe -s http://localhost:2019/config/apps',
    'dir C:\\caddy\\Caddyfile 2>&1',
    'dir C:\\caddy\\*.json 2>&1',
    'type C:\\caddy\\config.json 2>&1',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:600]}')
    print()

c.close()
