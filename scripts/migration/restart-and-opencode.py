import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

print('=== REINICIANDO SERVICIOS ===')

# Restart TVS
sin, sout, serr = c.exec_command('cd C:\\tvs && pm2 start npm --name tvs -- run start', timeout=30)
print('TVS: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

time.sleep(3)

# Restart Caddy
sin, sout, serr = c.exec_command('cd C:\\caddy && pm2 start caddy.exe --name caddy -- run --config adapted.json', timeout=30)
print('CADDY: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

time.sleep(5)

sin, sout, serr = c.exec_command('pm2 save')
print('SAVE: ' + sout.read().decode('utf-8', errors='replace').strip()[:100])

# Verify
sin, sout, serr = c.exec_command('pm2 list --no-color')
print('\nPM2:')
print(sout.read().decode('utf-8', errors='replace'))

sin, sout, serr = c.exec_command('curl.exe -s -m 5 http://localhost:32123/api/health')
print('TVS: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

sin, sout, serr = c.exec_command('curl.exe -s -m 5 http://localhost:80/api/health')
print('HTTP: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

print('\n=== INSTALANDO OPENCODE ===')

# Check if opencode is installed
sin, sout, serr = c.exec_command('where opencode 2>&1')
out = sout.read().decode('utf-8', errors='replace').strip()
print('opencode location: ' + out)

if 'not found' in out.lower() or 'Could not find' in out:
    sin, sout, serr = c.exec_command('npm install -g opencode@latest 2>&1', timeout=120)
    print('Install: ' + sout.read().decode('utf-8', errors='replace').strip()[:300])

sin, sout, serr = c.exec_command('opencode --version 2>&1')
print('Version: ' + sout.read().decode('utf-8', errors='replace').strip()[:100])

# Create opencode config for the project
opencode_config = r'''{
  "$schema": "https://opencode.ai/schema.json",
  "provider": "ollama",
  "model": "qwen2.5:3b",
  "theme": "dark"
}'''

sftp = c.open_sftp()
with sftp.open('C:/tvs/opencode.json', 'w') as f:
    f.write(opencode_config)
sftp.close()
print('opencode.json created')

c.close()
