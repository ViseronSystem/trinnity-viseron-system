import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Stop all PM2 processes
c.exec_command('pm2 delete all 2>nul')
time.sleep(2)

# Start TVS correctly - use node directly with the built JS file
sin, sout, serr = c.exec_command('cd C:\\tvs && pm2 start dist\\src\\index.js --name tvs --max-restarts 5', timeout=30)
print('TVS start:')
print(sout.read().decode('utf-8', errors='replace').strip()[:300])
err = serr.read().decode('utf-8', errors='replace').strip()
if err: print('ERR: ' + err[:200])

time.sleep(5)

# Start Caddy
sin, sout, serr = c.exec_command('cd C:\\caddy && pm2 start caddy.exe --name caddy -- run --config adapted.json', timeout=30)
print('CADDY start:')
print(sout.read().decode('utf-8', errors='replace').strip()[:200])

time.sleep(5)

# Save
sin, sout, serr = c.exec_command('pm2 save')
print(sout.read().decode('utf-8', errors='replace').strip()[:100])

# Status
sin, sout, serr = c.exec_command('pm2 list --no-color')
print('\nPM2:')
print(sout.read().decode('utf-8', errors='replace'))

# Test
sin, sout, serr = c.exec_command('curl.exe -s -m 5 http://localhost:32123/api/health')
print('TVS health: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

sin, sout, serr = c.exec_command('curl.exe -s -m 5 http://localhost:80/api/health')
print('HTTP health: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

sin, sout, serr = c.exec_command('curl.exe -s -m 10 https://www.trinnityviseronsystem.io/api/health')
print('DOMAIN: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

c.close()
