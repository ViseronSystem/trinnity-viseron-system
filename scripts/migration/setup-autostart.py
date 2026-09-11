import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Create startup batch file
startup_bat = r'''@echo off
cd /d C:\tvs
pm2 resurrect
'''
sftp = c.open_sftp()
with sftp.open('C:/tvs/startup.bat', 'w') as f:
    f.write(startup_bat)
sftp.close()

# Create scheduled task for auto-start on boot
cmds = [
    'schtasks /create /tn "VISERON AutoStart" /tr "C:\\tvs\\startup.bat" /sc onstart /ru Administrator /rp * /f',
    'schtasks /query /tn "VISERON AutoStart"',
]
for cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'{cmd[:60]}')
    print(f'  {out[:300]}')
    if err: print(f'  ERR: {err[:200]}')

c.close()
