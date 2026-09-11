import paramiko, sys, json, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Kill existing Caddy
c.exec_command('pm2 delete caddy 2>nul & taskkill /f /im caddy.exe 2>nul')
time.sleep(2)

# Create JSON config
config = json.dumps({
    "apps": {
        "http": {
            "servers": {
                "srv0": {
                    "listen": [":80", ":443"],
                    "routes": [
                        {
                            "match": [{"host": ["www.trinnityviseronsystem.io", "trinnityviseronsystem.io"]}],
                            "handle": [{"handler": "reverse_proxy", "upstreams": [{"dial": "127.0.0.1:32123"}]}],
                            "terminal": True
                        },
                        {
                            "match": [{"path": ["/*"]}],
                            "handle": [{"handler": "reverse_proxy", "upstreams": [{"dial": "127.0.0.1:32123"}]}],
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

# Start Caddy with JSON config
cmds = [
    'cd C:\\caddy && pm2 start caddy.exe --name caddy -- run --config config.json',
    'pm2 save',
]
for cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:300]}')

time.sleep(5)

# Check
for cmd in [
    'tasklist /fi "imagename eq caddy.exe" /fo csv /nh',
    'curl.exe -s -m 5 http://localhost:80/api/health',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=10)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:300]}')
    print()

c.close()
