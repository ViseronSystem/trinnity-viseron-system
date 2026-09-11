import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

print('=== DESCARGANDO OPENCODE ===')

# Download opencode for Windows x64
cmds = [
    'mkdir C:\\opencode 2>nul',
    'curl.exe -L -o C:\\opencode\\opencode.zip "https://github.com/anomalyco/opencode/releases/download/v1.18.25/opencode-windows-x64.zip"',
]
for cmd in cmds:
    sin, sout, serr = c.exec_command(cmd, timeout=120)
    out = sout.read().decode('utf-8', errors='replace').strip()
    err = serr.read().decode('utf-8', errors='replace').strip()
    print(f'{cmd[:60]}')
    if out: print(f'  {out[:200]}')
    if err: print(f'  ERR: {err[:200]}')

# Extract
sin, sout, serr = c.exec_command('powershell -Command "Expand-Archive -Path C:\\opencode\\opencode.zip -DestinationPath C:\\opencode -Force"')
print('Extract: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

# Check what's inside
sin, sout, serr = c.exec_command('dir C:\\opencode')
print('Files:\n' + sout.read().decode('utf-8', errors='replace'))

# Add to PATH and test
sin, sout, serr = c.exec_command('C:\\opencode\\opencode.exe --version 2>&1')
print('Version: ' + sout.read().decode('utf-8', errors='replace').strip()[:100])

# Create a symlink in a PATH location
sin, sout, serr = c.exec_command('copy C:\\opencode\\opencode.exe C:\\Windows\\opencode.exe 2>&1')
print('Copy to PATH: ' + sout.read().decode('utf-8', errors='replace').strip()[:100])

c.close()
