import paramiko, sys, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

config = json.dumps({
    "apps": {
        "http": {
            "servers": {
                "srv0": {
                    "listen": [":80"],
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
        }
    }
})

# Write config to file on server
sftp = c.open_sftp()
with sftp.open('C:/tmp/caddy-new.json', 'w') as f:
    f.write(config)
sftp.close()

# Load via API
sin, sout, serr = c.exec_command('curl.exe -s -X POST http://localhost:2019/load -H "Content-Type: application/json" -d @"C:\\tmp\\caddy-new.json"')
out = sout.read().decode('utf-8', errors='replace').strip()
err = serr.read().decode('utf-8', errors='replace').strip()
print(f'Load response: {out[:500]}')
if err: print(f'Load error: {err[:300]}')

# Verify
sin, sout, serr = c.exec_command('curl.exe -s http://localhost:2019/config/')
out = sout.read().decode('utf-8', errors='replace').strip()
print(f'Config: {out[:500]}')

# Test HTTP
sin, sout, serr = c.exec_command('curl.exe -s -m 5 http://localhost:80/api/health')
out = sout.read().decode('utf-8', errors='replace').strip()
print(f'HTTP 80 health: {out[:300]}')

c.close()
