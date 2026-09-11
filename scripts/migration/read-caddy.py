import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

for cmd in [
    'type C:\\caddy\\Caddyfile',
    'curl.exe -s http://localhost:2019/config/',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(out[:1000])
    print()

c.close()
