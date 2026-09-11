#!/usr/bin/env python3
"""Upload tar.gz to new server and extract"""
import paramiko
import os
import time
from datetime import datetime

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f'[{ts}] {msg}', flush=True)

log('Connecting to 194.62.97.30...')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('194.62.97.30', username='Administrator', password='nh8NAD77qcjXrKFY', timeout=15)
log('Connected!')

log('Ensuring remote directories exist...')
client.exec_command('mkdir C:\\tmp 2>nul; mkdir C:\\tvs 2>nul')

log('Uploading tvs.tar.gz (3.7GB)... This may take several minutes.')
sftp = client.open_sftp()
start = time.time()
sftp.put('C:\\tmp\\tvs.tar.gz', 'C:\\tmp\\tvs.tar.gz')
elapsed = time.time() - start
log(f'Upload complete in {elapsed:.0f}s')
sftp.close()

log('Extracting...')
stdin, stdout, stderr = client.exec_command('cd C:\\tvs 2>nul || mkdir C:\\tvs; cd C:\\tvs; tar xzf C:\\tmp\\tvs.tar.gz', timeout=600)
out = stdout.read().decode(errors='replace')
err = stderr.read().decode(errors='replace')
if out: log(f'Extract out: {out[:200]}')
if err: log(f'Extract err: {err[:200]}')

log('Installing npm dependencies...')
stdin, stdout, stderr = client.exec_command('cd C:\\tvs; npm install --production 2>&1', timeout=600)
out = stdout.read().decode(errors='replace')
log(f'npm install: {out[-300:]}')

log('Building TypeScript...')
stdin, stdout, stderr = client.exec_command('cd C:\\tvs; npm run build 2>&1', timeout=600)
out = stdout.read().decode(errors='replace')
log(f'Build: {out[-300:]}')

log('Installing PM2 and starting...')
stdin, stdout, stderr = client.exec_command('npm install -g pm2 2>&1; cd C:\\tvs; pm2 delete viseron 2>nul; pm2 start "npm run start" --name viseron --cwd C:\\tvs; pm2 save 2>&1', timeout=120)
out = stdout.read().decode(errors='replace')
log(f'PM2: {out[-300:]}')

log('Checking HTTP...')
time.sleep(5)
stdin, stdout, stderr = client.exec_command('powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:3000 -TimeoutSec 10; Write-Output $r.StatusCode } catch { Write-Output $_.Exception.Message }"', timeout=30)
out = stdout.read().decode(errors='replace')
log(f'HTTP status: {out.strip()}')

stdin, stdout, stderr = client.exec_command('pm2 list')
log(f'PM2 list:\n{stdout.read().decode(errors="replace")}')

client.close()
log('DONE!')
