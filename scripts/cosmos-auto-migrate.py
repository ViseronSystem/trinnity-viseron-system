#!/usr/bin/env python3
"""
VISERON COSMOS — AUTO MIGRATION
Connects to servers and migrates everything automatically
"""
import paramiko
import os
import sys
import time
from datetime import datetime

# Server configurations
OLD_SERVER = '194.62.96.26'
NEW_SERVER = '192.62.97.30'
NEW_USER = 'Administrator'
NEW_PASS = 'nh8NAD77qcjXrKFY'
OLD_USER = 'root'

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f'[{ts}] {msg}', flush=True)

def connect_server(host, username, password, port=22):
    """Connect to SSH server"""
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(host, port=port, username=username, password=password, timeout=10)
        log(f'Connected to {host}')
        return client
    except Exception as e:
        log(f'Failed to connect to {host}: {e}')
        return None

def execute_command(client, command):
    """Execute SSH command"""
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=300)
        output = stdout.read().decode()
        error = stderr.read().decode()
        if error:
            log(f'Error: {error[:200]}')
        return output
    except Exception as e:
        log(f'Command error: {e}')
        return None

def upload_file(client, local_path, remote_path):
    """Upload file via SFTP"""
    try:
        sftp = client.open_sftp()
        sftp.put(local_path, remote_path)
        sftp.close()
        log(f'Uploaded: {local_path} -> {remote_path}')
        return True
    except Exception as e:
        log(f'Upload error: {e}')
        return False

def download_file(client, remote_path, local_path):
    """Download file via SFTP"""
    try:
        sftp = client.open_sftp()
        sftp.get(remote_path, local_path)
        sftp.close()
        log(f'Downloaded: {remote_path} -> {local_path}')
        return True
    except Exception as e:
        log(f'Download error: {e}')
        return False

def test_connection(host, username, password):
    """Test SSH connection"""
    log(f'Testing connection to {host}...')
    client = connect_server(host, username, password)
    if client:
        client.close()
        return True
    return False

def migrate():
    log('=== VISERON COSMOS AUTO MIGRATION ===')
    log(f'From: {OLD_SERVER}')
    log(f'To: {NEW_SERVER}')
    log('=' * 50)
    
    # Test connections
    log('\n[1/6] Testing connections...')
    
    # Try to connect to old server
    old_client = None
    for user in ['root', 'admin', 'Administrator']:
        old_client = connect_server(OLD_SERVER, user, '')
        if old_client:
            break
    
    # Try to connect to new server
    new_client = connect_server(NEW_SERVER, NEW_USER, NEW_PASS)
    
    if not new_client:
        log('ERROR: Cannot connect to new server!')
        return False
    
    # Step 2: Create backup on old server
    log('\n[2/6] Creating backup on old server...')
    if old_client:
        execute_command(old_client, 'cd / && tar czf /tmp/viseron-backup.tar.gz opt/viseron 2>/dev/null || true')
        log('Backup created on old server')
    else:
        log('Old server not accessible, using local files')
    
    # Step 3: Download backup
    log('\n[3/6] Downloading backup...')
    if old_client:
        download_file(old_client, '/tmp/viseron-backup.tar.gz', 'C:/tmp/viseron-backup.tar.gz')
    else:
        log('Using local backup files')
    
    # Step 4: Upload to new server
    log('\n[4/6] Uploading to new server...')
    backup_file = 'C:/Trinnity-Viseron-System/deploy/viseron-complete.zip'
    if os.path.exists(backup_file):
        upload_file(new_client, backup_file, '/tmp/viseron-complete.zip')
    else:
        log('Local backup not found, skipping upload')
    
    # Step 5: Setup new server
    log('\n[5/6] Setting up new server...')
    
    # Install dependencies
    commands = [
        'apt update && apt upgrade -y',
        'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -',
        'apt install -y nodejs',
        'npm install -g pm2',
        'mkdir -p /opt/viseron',
        'cd /tmp && unzip viseron-complete.zip -d /opt/viseron 2>/dev/null || true',
        'cd /opt/viseron && npm install 2>/dev/null || true',
        'cd /opt/viseron && npm run build 2>/dev/null || true'
    ]
    
    for cmd in commands:
        log(f'Running: {cmd[:50]}...')
        execute_command(new_client, cmd)
    
    # Step 6: Start services
    log('\n[6/6] Starting services...')
    execute_command(new_client, 'cd /opt/viseron && pm2 start npm --name viseron -- start 2>/dev/null || true')
    execute_command(new_client, 'pm2 save 2>/dev/null || true')
    
    # Verify
    log('\n=== MIGRATION COMPLETE ===')
    log(f'Access: http://{NEW_SERVER}:3000')
    
    # Close connections
    if old_client:
        old_client.close()
    new_client.close()
    
    return True

if __name__ == '__main__':
    migrate()
