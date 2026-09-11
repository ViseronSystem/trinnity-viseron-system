import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

cmds = [
    ('Listeners', 'netstat -an | findstr LISTENING'),
    ('Logs', 'pm2 logs tvs --lines 50 --nostream --no-color'),
    ('Env PORT', 'findstr PORT C:\\tvs\\.env'),
]
for label, cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    print(f'=== {label} ===')
    print(out[:1500])
    print()

c.close()
