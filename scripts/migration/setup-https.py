import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Update Caddyfile with HTTPS (Caddy auto-provisions Let's Encrypt)
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
print('Caddyfile written')

# Kill and restart Caddy to get new certs
cmds = [
    'taskkill /f /im caddy.exe 2>&1',
    'start /b C:\\caddy\\caddy.exe run --config C:\\caddy\\Caddyfile --adapter caddyfile',
]
for cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    if out: print(f'   {out[:200]}')
    if err: print(f'   ERR: {err[:200]}')

import time
time.sleep(10)

# Check if Caddy got certs
for cmd in [
    'tasklist /fi "imagename eq caddy.exe" /fo csv /nh',
    'dir C:\\Users\\Administrator\\AppData\\Roaming\\Caddy\\certificates 2>&1',
    'dir C:\\Users\\Administrator\\.local\\share\\caddy 2>&1',
    'curl.exe -s -m 5 https://localhost:443/api/health -H "Host: trinnityviseronsystem.io" -k',
    'curl.exe -s -m 5 http://localhost:80/api/health -H "Host: trinnityviseronsystem.io"',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:400]}')
    if err: print(f'   ERR: {err[:200]}')
    print()

c.close()
