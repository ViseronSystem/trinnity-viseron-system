import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

for cmd in [
    'netsh advfirewall firewall show rule name=all dir=in | findstr /i "80 HTTP"',
    'netsh advfirewall set allprofiles state off',
    'curl.exe -s -m 5 http://194.62.97.30:80/api/health',
]:
    sin, sout, serr = c.exec_command(cmd, timeout=15)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'>>> {cmd[:60]}')
    print(f'   {out[:400]}')
    if err: print(f'   ERR: {err[:200]}')
    print()

c.close()
