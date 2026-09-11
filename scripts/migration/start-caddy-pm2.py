import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Write Caddyfile
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

# Start Caddy via PM2
cmds = [
    'cd C:\\caddy && pm2 start caddy.exe --name caddy -- run --config Caddyfile --adapter caddyfile',
    'pm2 save',
]
for cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:300]}')

time.sleep(15)

# Check
for cmd in [
    'tasklist /fi "imagename eq caddy.exe" /fo csv /nh',
    'pm2 list --no-color',
    'curl.exe -s -m 5 http://localhost:80/api/health',
    'curl.exe -s -k -m 5 https://localhost:443/api/health -H "Host: trinnityviseronsystem.io"',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:400]}')
    print()

c.close()
