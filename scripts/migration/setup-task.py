import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Create scheduled task without password prompt (use SYSTEM account)
cmds = [
    'schtasks /create /tn "VISERON AutoStart" /tr "C:\\tvs\\startup.bat" /sc onstart /ru SYSTEM /f',
    'schtasks /query /tn "VISERON AutoStart" /fo LIST',
]
for cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'{cmd[:60]}')
    print(f'  {out[:400]}')

c.close()
