import paramiko, sys, json, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Kill Caddy
c.exec_command('pm2 delete caddy 2>nul')
time.sleep(2)

# Caddyfile with HTTPS (auto Let's Encrypt)
caddyfile = """{
	auto_https disable_redirects
}

trinnityviseronsystem.io {
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

# Start with Caddyfile adapter
cmds = [
    'cd C:\\caddy && pm2 start caddy.exe --name caddy -- run --config Caddyfile --adapter caddyfile',
]
for cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:300]}')
    if err: print(f'   ERR: {err[:200]}')

time.sleep(15)

# Check certs and status
for cmd in [
    'tasklist /fi "imagename eq caddy.exe" /fo csv /nh',
    'pm2 logs caddy --lines 20 --nostream --no-color',
    'curl.exe -s -k -m 5 https://localhost:443/api/health -H "Host: trinnityviseronsystem.io"',
    'curl.exe -s -m 5 http://localhost:80/api/health',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:500]}')
    print()

c.close()
