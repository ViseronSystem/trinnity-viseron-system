import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Check TVS error logs
sin, sout, serr = c.exec_command('pm2 logs tvs --lines 30 --nostream --no-color 2>&1')
print('TVS LOGS:')
print(sout.read().decode('utf-8', errors='replace')[-1500:])

sin, sout, serr = c.exec_command('type C:\\Users\\Administrator\\.pm2\\logs\\tvs-error.log 2>&1')
errlog = sout.read().decode('utf-8', errors='replace')
print('\nTVS ERROR LOG (last 1000 chars):')
print(errlog[-1000:])

# Check if dist exists
sin, sout, serr = c.exec_command('dir C:\\tvs\\dist\\src\\index.js 2>&1')
print('\nBuild output:')
print(sout.read().decode('utf-8', errors='replace'))

c.close()
