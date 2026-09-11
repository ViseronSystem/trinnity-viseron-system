#!/usr/bin/env python3
"""
VISERON COSMOS — FAST MIGRATION (targeted upload)
"""
import paramiko
import os
import sys
import time
from datetime import datetime

NEW_SERVER = '194.62.97.30'
NEW_USER = 'Administrator'
NEW_PASS = 'nh8NAD77qcjXrKFY'
PROJECT_DIR = 'C:\\Trinnity-Viseron-System'

ESSENTIAL_DIRS = ['src', 'contracts', 'scripts', 'data', 'mobile', 'public']
ESSENTIAL_FILES = ['package.json', 'tsconfig.json', '.env', 'README.md']

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f'[{ts}] {msg}', flush=True)

def connect(host, user, password):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=host, username=user, password=password, timeout=15)
    return client

def remote_exec(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    return out, err

def upload_essential(client):
    sftp = client.open_sftp()
    uploaded = 0
    
    # Upload essential files
    for f in ESSENTIAL_FILES:
        local = os.path.join(PROJECT_DIR, f)
        if os.path.exists(local):
            try:
                sftp.put(local, f'C:/tvs/{f}')
                uploaded += 1
                log(f'  Uploaded: {f}')
            except Exception as e:
                log(f'  Failed: {f} - {e}')
    
    # Upload essential directories
    for d in ESSENTIAL_DIRS:
        local_dir = os.path.join(PROJECT_DIR, d)
        if not os.path.exists(local_dir):
            continue
        
        log(f'  Uploading {d}/...')
        for root, dirs, files in os.walk(local_dir):
            # Skip unwanted subdirs
            dirs[:] = [x for x in dirs if x not in ['node_modules', '__pycache__', '.git', 'dist', 'deploy']]
            
            rel = os.path.relpath(root, PROJECT_DIR).replace('\\', '/')
            remote_dir = f'C:/tvs/{rel}'
            
            try:
                sftp.mkdir(remote_dir)
            except:
                pass
            
            for f in files:
                if f.endswith(('.zip', '.log', '.tar.gz')):
                    continue
                local_file = os.path.join(root, f)
                remote_file = f'{remote_dir}/{f}'
                try:
                    sftp.put(local_file, remote_file)
                    uploaded += 1
                    if uploaded % 50 == 0:
                        log(f'    Uploaded {uploaded} files...')
                except:
                    pass
    
    sftp.close()
    return uploaded

def main():
    log('=' * 60)
    log('  VISERON COSMOS — FAST MIGRATION')
    log(f'  Target: {NEW_SERVER}')
    log('=' * 60)
    
    # Connect to new server
    log('\n[1/4] Connecting to new server...')
    client = connect(NEW_SERVER, NEW_USER, NEW_PASS)
    log('Connected!')
    
    # Create directory
    log('\n[2/4] Creating directories...')
    remote_exec(client, 'mkdir C:\\tvs 2>nul')
    
    # Upload files
    log('\n[3/4] Uploading essential files...')
    uploaded = upload_essential(client)
    log(f'Uploaded {uploaded} files')
    
    # Setup and start
    log('\n[4/4] Setting up and starting...')
    
    cmds = [
        'cd C:\\tvs && npm install --production 2>&1',
        'cd C:\\tvs && npm install -g pm2 2>&1',
        'cd C:\\tvs && npm run build 2>&1',
        'cd C:\\tvs && pm2 delete viseron 2>nul & pm2 start "npm run start" --name viseron --cwd C:\\tvs',
        'pm2 save',
    ]
    
    for cmd in cmds:
        log(f'  Running: {cmd[:50]}...')
        out, err = remote_exec(client, cmd, timeout=600)
        if out.strip():
            log(f'    {out.strip()[:200]}')
    
    # Verify
    log('\nVerifying...')
    out, err = remote_exec(client, 'powershell -Command "Invoke-WebRequest -Uri http://localhost:3000 -TimeoutSec 5 | Select-Object StatusCode"')
    log(f'HTTP status: {out.strip()}')
    
    out, err = remote_exec(client, 'pm2 list')
    log(f'PM2:\n{out}')
    
    client.close()
    
    log('\n' + '=' * 60)
    log('  MIGRATION COMPLETE!')
    log(f'  http://{NEW_SERVER}:3000')
    log('=' * 60)

if __name__ == '__main__':
    main()
