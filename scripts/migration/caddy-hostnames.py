import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Kill Caddy
c.exec_command('pm2 delete caddy 2>nul & taskkill /f /im caddy.exe 2>nul')
time.sleep(3)

# Caddyfile with hostnames for proper TLS
caddyfile = """trinnityviseronsystem.io {
	reverse_proxy 127.0.0.1:32123
}

www.trinnityviseronsystem.io {
	reverse_proxy 127.0.0.1:32123
}

:80 {
	reverse_proxy 127.0.0.1:32123
}
"""
sftp = c.open_sftp()
with sftp.open('C:/caddy/Caddyfile', 'w') as f:
    f.write(caddyfile)
sftp.close()

# Adapt and start
sin, sout, serr = c.exec_command('cd C:\\caddy && caddy adapt --config Caddyfile --pretty > adapted.json 2>&1')

sin, sout, serr = c.exec_command('cd C:\\caddy && pm2 start caddy.exe --name caddy -- run --config adapted.json')
print('Started: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

time.sleep(15)

# Test locally with SNI
for cmd in [
    'curl.exe -s -m 5 http://localhost:80/api/health',
    'curl.exe -s -k -m 5 --resolve trinnityviseronsystem.io:443:127.0.0.1 https://trinnityviseronsystem.io/api/health',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'{cmd[:50]}: {out[:200]}')

# Test domain
sin, sout, serr = c.exec_command('curl.exe -s -m 15 https://trinnityviseronsystem.io/api/health')
result = sout.read().decode('utf-8', errors='replace').strip()
print('DOMAIN: ' + result[:300])

sin, sout, serr = c.exec_command('curl.exe -s -m 15 https://www.trinnityviseronsystem.io/api/health')
result = sout.read().decode('utf-8', errors='replace').strip()
print('WWW: ' + result[:300])

# Check Caddy logs for errors
sin, sout, serr = c.exec_command('pm2 logs caddy --lines 15 --nostream --no-color')
print('\nLogs:\n' + sout.read().decode('utf-8', errors='replace')[-800:])

c.close()
