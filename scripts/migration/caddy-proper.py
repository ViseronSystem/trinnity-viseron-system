import paramiko, sys, json, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Kill existing Caddy
c.exec_command('pm2 delete caddy 2>nul & taskkill /f /im caddy.exe 2>nul')
time.sleep(3)

# Write proper Caddyfile
caddyfile = """trinnityviseronsystem.io {
	reverse_proxy 127.0.0.1:32123
}

www.trinnityviseronsystem.io {
	reverse_proxy 127.0.0.1:32123
}
"""
sftp = c.open_sftp()
with sftp.open('C:/caddy/Caddyfile', 'w') as f:
    f.write(caddyfile)
sftp.close()

# Convert Caddyfile to JSON first
sin, sout, serr = c.exec_command('cd C:\\caddy && caddy adapt --config Caddyfile --pretty > adapted.json 2>&1')
print(f'Adapt: {sout.read().decode("utf-8", errors="replace").strip()[:200]}')
print(f'Adapt ERR: {serr.read().decode("utf-8", errors="replace").strip()[:200]}')

# Check the adapted config
sin, sout, serr = c.exec_command('type C:\\caddy\\adapted.json')
adapted = sout.read().decode('utf-8', errors='replace').strip()
print(f'Adapted config length: {len(adapted)}')
print(adapted[:800])

# Start Caddy with JSON config
sin, sout, serr = c.exec_command('cd C:\\caddy && pm2 start caddy.exe --name caddy -- run --config adapted.json')
print(f'Start: {sout.read().decode("utf-8", errors="replace").strip()[:300]}')

time.sleep(20)

# Check
for cmd in [
    'pm2 logs caddy --lines 30 --nostream --no-color',
    'curl.exe -s -k -m 5 https://localhost:443/api/health -H "Host: trinnityviseronsystem.io"',
    'curl.exe -s -m 5 http://localhost:80/api/health',
    'dir C:\\Users\\Administrator\\.local\\share\\caddy\\certificates 2>&1',
    'dir C:\\Users\\Administrator\\AppData\\Roaming\\Caddy 2>&1',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:500]}')
    if err: print(f'   ERR: {err[:200]}')
    print()

c.close()
