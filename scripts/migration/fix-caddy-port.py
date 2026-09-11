import paramiko, sys, time, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Kill Caddy
c.exec_command('pm2 delete caddy 2>nul & taskkill /f /im caddy.exe 2>nul')
time.sleep(2)

# New JSON config pointing to port 3000
config = json.dumps({
    "apps": {
        "http": {
            "servers": {
                "srv0": {
                    "listen": [":80", ":443"],
                    "routes": [
                        {
                            "match": [{"host": ["www.trinnityviseronsystem.io", "trinnityviseronsystem.io"]}],
                            "handle": [{"handler": "reverse_proxy", "upstreams": [{"dial": "127.0.0.1:3000"}]}],
                            "terminal": True
                        },
                        {
                            "match": [{"path": ["/*"]}],
                            "handle": [{"handler": "reverse_proxy", "upstreams": [{"dial": "127.0.0.1:3000"}]}],
                            "terminal": True
                        }
                    ]
                }
            }
        },
        "tls": {
            "automation": {
                "policies": [{
                    "issuers": [{
                        "module": "acme",
                        "challenges": {"http": {"disabled": True}}
                    }]
                }]
            }
        }
    }
}, indent=2)

sftp = c.open_sftp()
with sftp.open('C:/caddy/config.json', 'w') as f:
    f.write(config)
sftp.close()

# Also update the Caddyfile
caddyfile = """trinnityviseronsystem.io {
	reverse_proxy 127.0.0.1:3000
}

www.trinnityviseronsystem.io {
	reverse_proxy 127.0.0.1:3000
}

:80 {
	reverse_proxy 127.0.0.1:3000
}
"""
sftp = c.open_sftp()
with sftp.open('C:/caddy/Caddyfile', 'w') as f:
    f.write(caddyfile)
sftp.close()

# Adapt Caddyfile
sin, sout, serr = c.exec_command('cd C:\\caddy && caddy adapt --config Caddyfile --pretty > adapted.json 2>&1')
out = sout.read().decode('utf-8', errors='replace').strip()
if out: print('Adapt: ' + out[:200])

# Start Caddy
sin, sout, serr = c.exec_command('cd C:\\caddy && pm2 start caddy.exe --name caddy -- run --config adapted.json')
print('Caddy: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

time.sleep(10)

# Verify everything
for cmd in [
    'pm2 list --no-color',
    'curl.exe -s -m 5 http://localhost:80/api/health',
    'curl.exe -s -m 5 http://localhost:3000/api/health',
    'curl.exe -s -m 10 https://www.trinnityviseronsystem.io/api/health',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:50]}')
    print(f'   {out[:300]}')
    print()

sin, sout, serr = c.exec_command('pm2 save')

c.close()
