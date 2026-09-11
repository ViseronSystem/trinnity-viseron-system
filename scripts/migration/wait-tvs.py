import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Wait for TVS to fully start
for i in range(6):
    time.sleep(10)
    sin, sout, serr = c.exec_command('curl.exe -s -m 5 http://localhost:32123/api/health')
    result = sout.read().decode('utf-8', errors='replace').strip()
    print(f'{(i+1)*10}s: {result[:100]}')
    if result:
        break

# Check if process is still alive
sin, sout, serr = c.exec_command('pm2 list --no-color')
print('\n' + sout.read().decode('utf-8', errors='replace'))

# Check TVS logs for startup
sin, sout, serr = c.exec_command('pm2 logs tvs --lines 20 --nostream --no-color')
logs = sout.read().decode('utf-8', errors='replace')
print('Logs:')
print(logs[-1000:])

# Domain test
sin, sout, serr = c.exec_command('curl.exe -s -m 10 https://www.trinnityviseronsystem.io/api/health')
print('DOMAIN: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

c.close()
