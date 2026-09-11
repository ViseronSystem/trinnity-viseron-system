#!/usr/bin/env python3
"""
VISERON COSMOS — FULL MIGRATION
Old (194.62.96.26) → New (194.62.97.30)
"""
import paramiko
import os
import sys
import time
import zipfile
import io
from datetime import datetime

OLD_SERVER = '194.62.96.26'
OLD_USER = 'root'
NEW_SERVER = '194.62.97.30'
NEW_USER = 'Administrator'
NEW_PASS = 'nh8NAD77qcjXrKFY'
PROJECT_DIR = 'C:\\Trinnity-Viseron-System'

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f'[{ts}] {msg}', flush=True)

def connect(host, user, password=None, key_file=None):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    kwargs = {'hostname': host, 'username': user, 'timeout': 15}
    if password: kwargs['password'] = password
    if key_file: kwargs['key_filename'] = key_file
    client.connect(**kwargs)
    return client

def remote_exec(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    return out, err

def upload_dir_sftp(client, local_dir, remote_dir, exclude=None):
    if exclude is None:
        exclude = {'node_modules', '.git', 'dist', 'deploy', '__pycache__'}
    sftp = client.open_sftp()
    uploaded = 0
    for root, dirs, files in os.walk(local_dir):
        dirs[:] = [d for d in dirs if d not in exclude]
        rel = os.path.relpath(root, local_dir).replace('\\', '/')
        remote_path = remote_dir + '/' + rel if rel != '.' else remote_dir
        try:
            sftp.mkdir(remote_path)
        except:
            pass
        for f in files:
            if f.endswith('.zip') or f.endswith('.log'):
                continue
            local_file = os.path.join(root, f)
            remote_file = remote_path + '/' + f
            try:
                sftp.put(local_file, remote_file)
                uploaded += 1
                if uploaded % 100 == 0:
                    log(f'  Uploaded {uploaded} files...')
            except Exception as e:
                pass
    sftp.close()
    return uploaded

def upload_zip(client, local_dir, remote_dest):
    log('Creating ZIP archive...')
    zip_path = os.path.join(os.environ.get('TEMP', 'C:\\tmp'), 'tvs-migrate.zip')
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        exclude = {'node_modules', '.git', 'dist', 'deploy', '__pycache__', '.opencode'}
        count = 0
        for root, dirs, files in os.walk(local_dir):
            dirs[:] = [d for d in dirs if d not in exclude]
            for f in files:
                if f.endswith(('.zip', '.log')):
                    continue
                fp = os.path.join(root, f)
                arcname = os.path.relpath(fp, local_dir).replace('\\', '/')
                zf.write(fp, arcname)
                count += 1
                if count % 500 == 0:
                    log(f'  Archiving: {count} files...')
    zip_size = os.path.getsize(zip_path) / (1024*1024)
    log(f'ZIP created: {zip_size:.1f} MB ({count} files)')
    
    log('Uploading ZIP to new server...')
    sftp = client.open_sftp()
    sftp.put(zip_path, remote_dest + '/tvs-migrate.zip')
    sftp.close()
    log('ZIP uploaded!')
    
    os.remove(zip_path)
    return True

def main():
    log('=' * 60)
    log('  VISERON COSMOS — FULL MIGRATION')
    log(f'  Old: {OLD_SERVER} -> New: {NEW_SERVER}')
    log('=' * 60)
    
    # Step 1: Backup from old server
    log('\n[1/5] Backing up from old server...')
    try:
        old_client = connect(OLD_SERVER, OLD_USER)
        log('Connected to old server!')
        
        out, err = remote_exec(old_client, 'cd / && tar czf /tmp/tvs-backup.tar.gz opt/viseron 2>/dev/null; ls -la /tmp/tvs-backup.tar.gz')
        log(f'Backup: {out.strip()}')
        
        log('Downloading backup...')
        sftp = old_client.open_sftp()
        backup_path = os.path.join(os.environ.get('TEMP', 'C:\\tmp'), 'tvs-backup.tar.gz')
        sftp.get('/tmp/tvs-backup.tar.gz', backup_path)
        sftp.close()
        old_client.close()
        log(f'Backup downloaded: {os.path.getsize(backup_path)} bytes')
        has_backup = True
    except Exception as e:
        log(f'Old server backup failed: {e}')
        log('Will use local files instead')
        has_backup = False
    
    # Step 2: Connect to new server
    log('\n[2/5] Connecting to new server...')
    new_client = connect(NEW_SERVER, NEW_USER, password=NEW_PASS)
    log('Connected to new server!')
    
    # Step 3: Upload files
    log('\n[3/5] Uploading project files...')
    upload_zip(new_client, PROJECT_DIR, 'C:\\tmp')
    
    # Step 4: Extract and setup
    log('\n[4/5] Setting up new server...')
    
    # Also upload the backup from old server
    if has_backup:
        log('Uploading old server backup...')
        sftp = new_client.open_sftp()
        backup_path = os.path.join(os.environ.get('TEMP', 'C:\\tmp'), 'tvs-backup.tar.gz')
        sftp.put(backup_path, 'C:\\tmp\\tvs-backup.tar.gz')
        sftp.close()
    
    setup_cmds = [
        'powershell -Command "Expand-Archive -Path C:\\tmp\\tvs-migrate.zip -DestinationPath C:\\tvs -Force"',
        'if (Test-Path C:\\tmp\\tvs-backup.tar.gz) { cd C:\\tvs; tar xzf C:\\tmp\\tvs-backup.tar.gz --strip-components=2 2>$null }',
        'if (!(Test-Path C:\\tvs\\.env)) { Copy-Item C:\\tvs\\deploy\\.env C:\\tvs\\.env -Force }',
        'cd C:\\tvs; if (Test-Path package.json) { npm install --production 2>$null }',
    ]
    
    for cmd in setup_cmds:
        log(f'  Running: {cmd[:60]}...')
        out, err = remote_exec(new_client, f'powershell -Command "{cmd}"', timeout=600)
        if out.strip(): log(f'    {out.strip()[:200]}')
        if err.strip() and 'error' in err.lower():
            log(f'    WARN: {err.strip()[:200]}')
    
    # Step 5: Build and start
    log('\n[5/5] Building and starting services...')
    
    start_cmds = [
        'cd C:\\tvs; npm install -g pm2 2>$null',
        'cd C:\\tvs; npm run build 2>$null',
        'cd C:\\tvs; pm2 delete viseron 2>$null; pm2 start "npm run start" --name viseron --cwd C:\\tvs',
        'pm2 save',
    ]
    
    for cmd in start_cmds:
        log(f'  Running: {cmd[:60]}...')
        out, err = remote_exec(new_client, cmd, timeout=300)
        if out.strip(): log(f'    {out.strip()[:200]}')
    
    # Verify
    log('\nVerifying deployment...')
    out, err = remote_exec(new_client, 'powershell -Command "Invoke-WebRequest -Uri http://localhost:3000 -TimeoutSec 5 | Select-Object StatusCode"')
    log(f'Local HTTP status: {out.strip()}')
    
    out, err = remote_exec(new_client, 'pm2 list')
    log(f'PM2 status:\n{out}')
    
    new_client.close()
    
    log('\n' + '=' * 60)
    log('  MIGRATION COMPLETE!')
    log(f'  New server: http://{NEW_SERVER}:3000')
    log('=' * 60)

if __name__ == '__main__':
    main()
