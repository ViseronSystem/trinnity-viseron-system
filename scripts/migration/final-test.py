import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

sin, sout, serr = c.exec_command('netstat -ano | findstr LISTEN')
lines = sout.read().decode('utf-8', errors='replace')
for line in lines.split('\n'):
    if ':443' in line or ':80' in line:
        print(line.strip())

print()
sin, sout, serr = c.exec_command('curl.exe -s -m 5 http://localhost:80/api/health')
print('HTTP 80: ' + sout.read().decode('utf-8', errors='replace').strip())

sin, sout, serr = c.exec_command('curl.exe -s -k -m 5 https://127.0.0.1:443/api/health')
print('HTTPS 443: ' + sout.read().decode('utf-8', errors='replace').strip())

sin, sout, serr = c.exec_command('curl.exe -s -m 15 -L https://trinnityviseronsystem.io/api/health')
print('DOMAIN: ' + sout.read().decode('utf-8', errors='replace').strip())

c.close()
