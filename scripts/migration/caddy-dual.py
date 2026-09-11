import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Kill Caddy
c.exec_command('pm2 delete caddy 2>nul & taskkill /f /im caddy.exe 2>nul')
time.sleep(3)

# Caddyfile with both :80 and :443
caddyfile = """:80 {
	reverse_proxy 127.0.0.1:32123
}

:443 {
	reverse_proxy 127.0.0.1:32123
}
"""
sftp = c.open_sftp()
with sftp.open('C:/caddy/Caddyfile', 'w') as f:
    f.write(caddyfile)
sftp.close()

# Adapt
sin, sout, serr = c.exec_command('cd C:\\caddy && caddy adapt --config Caddyfile --pretty > adapted.json 2>&1')
out = sout.read().decode('utf-8', errors='replace').strip()
err = serr.read().decode('utf-8', errors='replace').strip()
if out: print(f'Adapt: {out[:200]}')
if err: print(f'Adapt ERR: {err[:200]}')

# Start
sin, sout, serr = c.exec_command('cd C:\\caddy && pm2 start caddy.exe --name caddy -- run --config adapted.json')
print(f'Start: {sout.read().decode("utf-8", errors="replace").strip()[:200]}')
time.sleep(5)

# Quick check
for cmd in [
    'curl.exe -s -m 5 http://localhost:80/api/health',
    'curl.exe -s -k -m 5 https://localhost:443/api/health',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'{cmd[:50]}: {out[:200]}')

# Wait for ACME challenge
print('Waiting 30s for ACME cert provisioning...')
time.sleep(30)

for cmd in [
    'pm2 logs caddy --lines 20 --nostream --no-color',
    'dir C:\\Users\\Administrator\\AppData\\Roaming\\Caddy\\certificates /s /b 2>&1',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:50]}')
    print(f'   {out[:500]}')
    print()

c.close()
