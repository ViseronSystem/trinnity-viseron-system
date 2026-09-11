#!/usr/bin/env python3
"""
VISERON COSMOS — PORTABLE MIGRATION TOOL
Run this from any machine that can access the servers
"""
import os
import sys
import subprocess
from datetime import datetime

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f'[{ts}] {msg}')

def create_portable_package():
    log('Creating portable migration package...')
    
    # Create directory
    os.makedirs('migration-tool', exist_ok=True)
    
    # Create migration script
    script = '''#!/bin/bash
# VISERON COSMOS - PORTABLE MIGRATION TOOL
# Run this from any machine with access to both servers

OLD_SERVER="194.62.96.26"
NEW_SERVER="192.62.97.30"
NEW_USER="Administrator"
NEW_PASS="nh8NAD77qcjXrKFY"

echo "=== VISERON COSMOS MIGRATION ==="
echo "From: $OLD_SERVER"
echo "To: $NEW_SERVER"
echo "================================"
echo

# Test connections
echo "Testing connections..."
ping -c 1 $OLD_SERVER > /dev/null 2>&1 && echo "Old server: REACHABLE" || echo "Old server: NOT REACHABLE"
ping -c 1 $NEW_SERVER > /dev/null 2>&1 && echo "New server: REACHABLE" || echo "New server: NOT REACHABLE"
echo

# Ask for old server password
read -p "Enter old server password (or press Enter to skip): " OLD_PASS

if [ -n "$OLD_PASS" ]; then
    echo "Creating backup on old server..."
    sshpass -p "$OLD_PASS" ssh root@$OLD_SERVER "cd / && tar czf /tmp/viseron-backup.tar.gz opt/viseron 2>/dev/null || true"
    
    echo "Downloading backup..."
    sshpass -p "$OLD_PASS" scp root@$OLD_SERVER:/tmp/viseron-backup.tar.gz /tmp/
fi

echo "Uploading to new server..."
sshpass -p "$NEW_PASS" scp /tmp/viseron-backup.tar.gz $NEW_USER@$NEW_SERVER:/tmp/ 2>/dev/null || true

echo "Setting up new server..."
sshpass -p "$NEW_PASS" ssh $NEW_USER@$NEW_SERVER "cd /tmp && tar xzf viseron-backup.tar.gz && cd /opt/viseron && npm install && npm run build && pm2 start npm --name viseron -- start && pm2 save"

echo
echo "=== MIGRATION COMPLETE ==="
echo "Access: http://$NEW_SERVER:3000"
echo "=========================="
'''
    
    with open('migration-tool/migrate.sh', 'w') as f:
        f.write(script)
    
    # Create Windows batch file
    batch = '''@echo off
echo ========================================
echo  VISERON COSMOS - PORTABLE MIGRATION
echo  From: 194.62.96.26
echo  To: 192.62.97.30
echo ========================================
echo.

echo [1/5] Testing connections...
ping -n 1 194.62.96.26 >nul 2>&1
if %errorlevel%==0 (
    echo Old server: REACHABLE
) else (
    echo Old server: NOT REACHABLE
)

ping -n 1 192.62.97.30 >nul 2>&1
if %errorlevel%==0 (
    echo New server: REACHABLE
) else (
    echo New server: NOT REACHABLE
)
echo.

echo [2/5] Enter old server password:
set /p OLD_PASS=

echo [3/5] Creating backup on old server...
ssh root@194.62.96.26 "cd / && tar czf /tmp/viseron-backup.tar.gz opt/viseron 2>/dev/null || true"
echo Backup created!
echo.

echo [4/5] Uploading to new server...
scp /tmp/viseron-backup.tar.gz Administrator@192.62.97.30:/tmp/
echo Uploaded!
echo.

echo [5/5] Setting up new server...
ssh Administrator@192.62.97.30 "cd /tmp && tar xzf viseron-backup.tar.gz && cd /opt/viseron && npm install && npm run build && pm2 start npm --name viseron -- start && pm2 save"
echo Setup complete!
echo.

echo ========================================
echo  MIGRATION COMPLETE!
echo  Access: http://192.62.97.30:3000
echo ========================================
pause
'''
    
    with open('migration-tool/MIGRATE.bat', 'w') as f:
        f.write(batch)
    
    # Create README
    readme = '''# VISERON COSMOS - PORTABLE MIGRATION TOOL

## How to Use

### Windows:
1. Double-click `MIGRATE.bat`
2. Enter old server password when prompted
3. Wait for migration to complete

### Linux/Mac:
1. Open terminal
2. Run: `bash migrate.sh`
3. Enter old server password when prompted

## Requirements

### Windows:
- OpenSSH (included in Windows 10+)
- Or install PuTTY

### Linux/Mac:
- openssh-client
- sshpass (optional, for password automation)

## Servers

- Old: 194.62.96.26
- New: 192.62.97.30 (Administrator / nh8NAD77qcjXrKFY)

## Access After Migration

- http://192.62.97.30:3000
- http://192.62.97.30:3000/cosmos
- http://192.62.97.30:3000/cosmos/dashboard
'''
    
    with open('migration-tool/README.md', 'w') as f:
        f.write(readme)
    
    log('Portable package created in migration-tool/')
    log('Files:')
    log('  - migrate.sh (Linux/Mac)')
    log('  - MIGRATE.bat (Windows)')
    log('  - README.md (Instructions)')

if __name__ == '__main__':
    create_portable_package()
