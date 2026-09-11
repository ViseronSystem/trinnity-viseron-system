import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)

# Check if .opencode exists on server
sin, sout, serr = c.exec_command('dir C:\\tvs\\.opencode 2>&1')
print('.opencode: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

# Check if there's an opencode.json
sin, sout, serr = c.exec_command('type C:\\tvs\\opencode.json 2>&1')
print('opencode.json: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

# Check AGENTS.md exists
sin, sout, serr = c.exec_command('dir C:\\tvs\\AGENTS.md 2>&1')
print('AGENTS.md: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

# Check skills
sin, sout, serr = c.exec_command('dir C:\\tvs\\.opencode\\skills 2>&1')
print('Skills: ' + sout.read().decode('utf-8', errors='replace').strip()[:200])

# Check .env for API keys
sin, sout, serr = c.exec_command('findstr /i "OPENAI ANTHROPIC GEMINI XAI OLLAMA" C:\\tvs\\.env')
env_keys = sout.read().decode('utf-8', errors='replace').strip()
print('\nAI Keys in .env:')
for line in env_keys.split('\n'):
    if line.strip():
        key = line.split('=')[0] if '=' in line else line
        val = line.split('=')[1][:10] + '...' if '=' in line and len(line.split('=')[1]) > 10 else '***'
        print(f'  {key}={val}')

# Create proper opencode.json
opencode_config = r'''{
  "$schema": "https://opencode.ai/schema.json",
  "provider": {
    "name": "ollama",
    "model": "qwen2.5:3b",
    "apiKey": ""
  },
  "theme": "dark",
  "cwd": "C:\\tvs"
}'''

sftp = c.open_sftp()
with sftp.open('C:/tvs/opencode.json', 'w') as f:
    f.write(opencode_config)
sftp.close()
print('\nopencode.json updated')

# Create desktop shortcut for opencode
shortcut_ps1 = r'''
$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [System.Environment]::GetFolderPath("Desktop")

$Shortcut = $WshShell.CreateShortcut("$Desktop\OPENCODE AI.lnk")
$Shortcut.TargetPath = "C:\Windows\System32\cmd.exe"
$Shortcut.Arguments = "/k cd /d C:\tvs && C:\opencode\opencode.exe"
$Shortcut.WorkingDirectory = "C:\tvs"
$Shortcut.Description = "Open opencode AI in VISERON project"
$Shortcut.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
$Shortcut.Save()

Write-Output "OPENCODE shortcut created!"
'''
sftp = c.open_sftp()
with sftp.open('C:/tmp/oc-shortcut.ps1', 'w') as f:
    f.write(shortcut_ps1)
sftp.close()

sin, sout, serr = c.exec_command('powershell -ExecutionPolicy Bypass -File C:\\tmp\\oc-shortcut.ps1')
print(sout.read().decode('utf-8', errors='replace').strip())

# List all desktop shortcuts
sin, sout, serr = c.exec_command('dir "C:\\Users\\Administrator\\Desktop\\*.lnk"')
print('\nDesktop shortcuts:')
print(sout.read().decode('utf-8', errors='replace'))

c.close()
