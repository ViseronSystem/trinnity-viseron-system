import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Try with SNI
sin, sout, serr = c.exec_command('curl.exe -s -k -m 5 --resolve trinnityviseronsystem.io:443:127.0.0.1 https://trinnityviseronsystem.io/api/health')
print('SNI test: ' + sout.read().decode('utf-8', errors='replace').strip())

# Check Caddy cert files
sin, sout, serr = c.exec_command('dir /s /b C:\\Users\\Administrator\\AppData\\Roaming\\Caddy\\certificates')
print('Cert files:\n' + sout.read().decode('utf-8', errors='replace').strip())

# Check if 525 is now resolved
sin, sout, serr = c.exec_command('curl.exe -s -m 15 https://trinnityviseronsystem.io/api/health')
result = sout.read().decode('utf-8', errors='replace').strip()
print('Domain: ' + result[:300])

# Also try www
sin, sout, serr = c.exec_command('curl.exe -s -m 15 https://www.trinnityviseronsystem.io/api/health')
result = sout.read().decode('utf-8', errors='replace').strip()
print('WWW: ' + result[:300])

c.close()
