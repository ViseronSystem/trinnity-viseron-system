import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Upload new Caddyfile (HTTP only, no HTTPS redirect)
new_caddyfile = r"""www.trinnityviseronsystem.io, trinnityviseronsystem.io {
	reverse_proxy 127.0.0.1:32123
}
:80 {
	reverse_proxy 127.0.0.1:32123
}
"""

sftp = c.open_sftp()
with sftp.open('C:/caddy/Caddyfile', 'w') as f:
    f.write(new_caddyfile)
sftp.close()
print('Caddyfile updated')

# Restart Caddy via admin API
cmds = [
    'curl.exe -s -X POST http://localhost:2019/load -H "Content-Type: application/json" -d @C:\\tmp\\caddy-config.json',
    'curl.exe -s http://localhost:2019/config/',
]
for cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:500]}')
    print()

c.close()
