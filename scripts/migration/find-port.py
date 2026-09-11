import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Check what ports TVS PID 10040 is listening on
sin, sout, serr = c.exec_command('netstat -ano | findstr 10040')
print('Ports for TVS PID 10040:')
print(sout.read().decode('utf-8', errors='replace'))

# Check all listening ports
sin, sout, serr = c.exec_command('netstat -ano | findstr LISTEN')
lines = sout.read().decode('utf-8', errors='replace')
print('\nAll listening:')
for line in lines.split('\n'):
    l = line.strip()
    if l and 'LISTEN' in l:
        print(f'  {l}')

# Check .env for PORT
sin, sout, serr = c.exec_command('findstr PORT C:\\tvs\\.env')
print('\nPORT config:')
print(sout.read().decode('utf-8', errors='replace'))

# Try different ports
for port in [3000, 32123, 3001]:
    sin, sout, serr = c.exec_command(f'curl.exe -s -m 3 http://localhost:{port}/api/health')
    result = sout.read().decode('utf-8', errors='replace').strip()
    print(f'Port {port}: {result[:150]}')

c.close()
