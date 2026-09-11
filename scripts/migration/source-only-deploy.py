#!/usr/bin/env python3
"""Ultra-fast: upload ONLY source + config, skip everything else"""
import paramiko
import os
from datetime import datetime

PROJECT = 'C:\\Trinnity-Viseron-System'
SERVER = '194.62.97.30'
USER = 'Administrator'
PASS = 'nh8NAD77qcjXrKFY'

def log(msg):
    print(f'[{datetime.now().strftime("%H:%M:%S")}] {msg}', flush=True)

log('Connecting...')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(SERVER, username=USER, password=PASS, timeout=15)
log('Connected!')

c.exec_command('mkdir C:\\tvs 2>nul')

sftp = c.open_sftp()
count = 0

# Upload key root files
for f in ['package.json', 'tsconfig.json', '.env']:
    fp = os.path.join(PROJECT, f)
    if os.path.exists(fp):
        sftp.put(fp, f'C:/tvs/{f}')
        count += 1
        log(f'  {f}')

# Upload src/ (the core)
for root, dirs, files in os.walk(os.path.join(PROJECT, 'src')):
    dirs[:] = [d for d in dirs if d not in ['__pycache__']]
    rel = os.path.relpath(root, PROJECT).replace('\\', '/')
    try: sftp.mkdir(f'C:/tvs/{rel}')
    except: pass
    for f in files:
        if f.endswith(('.zip', '.log')):
            continue
        sftp.put(os.path.join(root, f), f'C:/tvs/{rel}/{f}')
        count += 1

# Upload contracts/sol/ (Solidity)
for root, dirs, files in os.walk(os.path.join(PROJECT, 'contracts')):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '__pycache__']]
    rel = os.path.relpath(root, PROJECT).replace('\\', '/')
    try: sftp.mkdir(f'C:/tvs/{rel}')
    except: pass
    for f in files:
        if f.endswith(('.zip', '.log', '.json')) and 'keypair' not in f and 'seed' not in f:
            continue
        sftp.put(os.path.join(root, f), f'C:/tvs/{rel}/{f}')
        count += 1

# Upload key scripts
for f in os.listdir(os.path.join(PROJECT, 'scripts')):
    fp = os.path.join(PROJECT, 'scripts', f)
    if os.path.isfile(fp) and not f.endswith(('.zip', '.log')):
        sftp.put(fp, f'C:/tvs/scripts/{f}')
        count += 1

# Upload public/ (dashboard HTML)
pub = os.path.join(PROJECT, 'public')
if os.path.exists(pub):
    for root, dirs, files in os.walk(pub):
        rel = os.path.relpath(root, PROJECT).replace('\\', '/')
        try: sftp.mkdir(f'C:/tvs/{rel}')
        except: pass
        for f in files:
            sftp.put(os.path.join(root, f), f'C:/tvs/{rel}/{f}')
            count += 1

sftp.close()
log(f'Uploaded {count} files')

# Setup
for cmd in [
    'cd C:\\tvs && npm install --production 2>&1',
    'npm install -g pm2 2>&1',
    'cd C:\\tvs && npm run build 2>&1',
    'cd C:\\tvs && pm2 delete viseron 2>nul & pm2 start "npm run start" --name viseron --cwd C:\\tvs',
    'pm2 save',
]:
    log(f'Running: {cmd[:50]}...')
    sin, sout, serr = c.exec_command(cmd, timeout=300)
    out = sout.read().decode(errors='replace')
    if out.strip(): log(f'  {out.strip()[-200:]}')

import time; time.sleep(5)
sin, sout, serr = c.exec_command('powershell -Command "try { (Invoke-WebRequest http://localhost:3000 -TimeoutSec 10).StatusCode } catch { $_.Exception.Message }"')
log(f'HTTP: {sout.read().decode(errors="replace").strip()}')

sin, sout, serr = c.exec_command('pm2 list')
log(f'PM2:\n{sout.read().decode(errors="replace")}')

c.close()
log('DONE!')
