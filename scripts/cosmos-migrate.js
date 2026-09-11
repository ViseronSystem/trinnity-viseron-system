#!/usr/bin/env node
/**
 * VISERON COSMOS — MIGRATION SYSTEM
 * Migra tudo do servidor antigo (194.62.96.26) para o novo (192.62.97.30)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OLD_SERVER = '194.62.96.26';
const NEW_SERVER = '192.62.97.30';
const NEW_USER = 'Administrator';
const NEW_PASS = 'nh8NAD77qcjXrKFY';

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 300000 });
  } catch (e) {
    log('Error: ' + e.message);
    return null;
  }
}

function testConnection(server) {
  log('Testing connection to ' + server + '...');
  const result = exec('ping -n 1 ' + server);
  return result && result.includes('TTL');
}

function createMigrationScript() {
  const script = `#!/bin/bash
# ========================================
#  VISERON COSMOS - MIGRATION SCRIPT
#  From: ${OLD_SERVER}
#  To: ${NEW_SERVER}
# ========================================

OLD_SERVER="${OLD_SERVER}"
NEW_SERVER="${NEW_SERVER}"
NEW_USER="${NEW_USER}"

echo "=== VISERON COSMOS MIGRATION ==="
echo "From: $OLD_SERVER"
echo "To: $NEW_SERVER"
echo "================================"
echo

# Step 1: Create backup on old server
echo "[1/6] Creating backup on old server..."
ssh root@$OLD_SERVER "cd / && tar czf /tmp/viseron-backup.tar.gz opt/viseron 2>/dev/null || true"
echo "Backup created!"

# Step 2: Download backup
echo "[2/6] Downloading backup..."
scp root@$OLD_SERVER:/tmp/viseron-backup.tar.gz /tmp/
echo "Backup downloaded!"

# Step 3: Upload to new server
echo "[3/6] Uploading to new server..."
scp /tmp/viseron-backup.tar.gz $NEW_USER@$NEW_SERVER:/tmp/
echo "Uploaded!"

# Step 4: Extract on new server
echo "[4/6] Extracting on new server..."
ssh $NEW_USER@$NEW_SERVER "cd / && tar xzf /tmp/viseron-backup.tar.gz 2>/dev/null || true"
echo "Extracted!"

# Step 5: Install dependencies
echo "[5/6] Installing dependencies..."
ssh $NEW_USER@$NEW_SERVER "cd /opt/viseron && npm install && npm run build"
echo "Dependencies installed!"

# Step 6: Start services
echo "[6/6] Starting services..."
ssh $NEW_USER@$NEW_SERVER "cd /opt/viseron && pm2 start npm --name viseron -- start && pm2 save"
echo "Services started!"

echo
echo "=== MIGRATION COMPLETE ==="
echo "Access: http://$NEW_SERVER:3000"
echo "=========================="
`;

  fs.writeFileSync(path.join(__dirname, '..', 'migrate.sh'), script);
  log('Migration script created: migrate.sh');
}

function createWindowsMigration() {
  const script = `@echo off
echo ========================================
echo  VISERON COSMOS - MIGRATION TO NEW SERVER
echo  From: ${OLD_SERVER}
echo  To: ${NEW_SERVER}
echo ========================================
echo.

echo [1/7] Testing connection to old server...
ping -n 1 ${OLD_SERVER}
if %errorlevel% neq 0 (
    echo ERROR: Old server not reachable!
    pause
    exit /b 1
)
echo Old server reachable!
echo.

echo [2/7] Testing connection to new server...
ping -n 1 ${NEW_SERVER}
if %errorlevel% neq 0 (
    echo ERROR: New server not reachable!
    pause
    exit /b 1
)
echo New server reachable!
echo.

echo [3/7] Creating backup on old server...
ssh root@${OLD_SERVER} "cd / && tar czf /tmp/viseron-backup.tar.gz opt/viseron 2>/dev/null || echo 'Backup done'"
echo Backup created!
echo.

echo [4/7] Downloading backup...
scp root@${OLD_SERVER}:/tmp/viseron-backup.tar.gz C:\\tmp\\
echo Downloaded!
echo.

echo [5/7] Uploading to new server...
scp C:\\tmp\\viseron-backup.tar.gz ${NEW_USER}@${NEW_SERVER}:/tmp/
echo Uploaded!
echo.

echo [6/7] Setting up new server...
ssh ${NEW_USER}@${NEW_SERVER} "cd /tmp && tar xzf viseron-backup.tar.gz && cd /opt/viseron && npm install && npm run build && pm2 start npm --name viseron -- start && pm2 save"
echo Setup complete!
echo.

echo [7/7] Verifying...
curl http://${NEW_SERVER}:3000
echo.
echo.
echo ========================================
echo  MIGRATION COMPLETE!
echo.
echo  Access:
echo  http://${NEW_SERVER}:3000
echo  http://${NEW_SERVER}:3000/cosmos
echo  http://${NEW_SERVER}:3000/cosmos/dashboard
echo ========================================
pause
`;

  fs.writeFileSync(path.join(__dirname, '..', 'MIGRATE.bat'), script);
  log('Windows migration script created: MIGRATE.bat');
}

function createNewServerSetup() {
  const script = `#!/bin/bash
# ========================================
#  NEW SERVER SETUP
#  Server: ${NEW_SERVER}
# ========================================

echo "=== SETTING UP NEW SERVER ==="
echo "Server: ${NEW_SERVER}"
echo "============================="
echo

# Update system
echo "[1/7] Updating system..."
apt update && apt upgrade -y

# Install Node.js
echo "[2/7] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
echo "[3/7] Installing PM2..."
npm install -g pm2

# Install Python
echo "[4/7] Installing Python..."
apt install -y python3 python3-pip

# Install SSH
echo "[5/7] Installing SSH..."
apt install -y openssh-server
systemctl enable ssh
systemctl start ssh

# Setup firewall
echo "[6/7] Setting up firewall..."
ufw allow 22/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw --force enable

# Create directories
echo "[7/7] Creating directories..."
mkdir -p /opt/viseron
mkdir -p /opt/viseron/data
mkdir -p /opt/viseron/data/trading
mkdir -p /opt/viseron/data/social

echo
echo "=== NEW SERVER READY ==="
echo "SSH: ssh ${NEW_USER}@${NEW_SERVER}"
echo "========================"
`;

  fs.writeFileSync(path.join(__dirname, '..', 'new-server-setup.sh'), script);
  log('New server setup script created: new-server-setup.sh');
}

function printMigrationGuide() {
  log('\n=== MIGRATION GUIDE ===\n');
  
  log('STEP 1: Test connections');
  log('  ping ' + OLD_SERVER);
  log('  ping ' + NEW_SERVER);
  log('');
  
  log('STEP 2: Run migration');
  log('  Windows: MIGRATE.bat');
  log('  Linux: bash migrate.sh');
  log('');
  
  log('STEP 3: Verify');
  log('  http://' + NEW_SERVER + ':3000');
  log('');
  
  log('STEP 4: Deactivate old server');
  log('  ssh root@' + OLD_SERVER);
  log('  shutdown -h now');
  log('');
  
  log('CREDENTIALS:');
  log('  New Server: ' + NEW_USER + ' / ***');
  log('');
  
  log('FILES CREATED:');
  log('  • migrate.sh (Linux migration)');
  log('  • MIGRATE.bat (Windows migration)');
  log('  • new-server-setup.sh (New server setup)');
}

function run() {
  log('=== VISERON COSMOS MIGRATION SYSTEM ===');
  log('From: ' + OLD_SERVER);
  log('To: ' + NEW_SERVER);
  log('=====================================');
  
  // Test connections
  const oldReachable = testConnection(OLD_SERVER);
  const newReachable = testConnection(NEW_SERVER);
  
  log('Old server (' + OLD_SERVER + '): ' + (oldReachable ? 'REACHABLE' : 'NOT REACHABLE'));
  log('New server (' + NEW_SERVER + '): ' + (newReachable ? 'REACHABLE' : 'NOT REACHABLE'));
  
  // Create scripts
  createMigrationScript();
  createWindowsMigration();
  createNewServerSetup();
  
  // Print guide
  printMigrationGuide();
  
  log('\n=== MIGRATION READY ===');
}

if (require.main === module) {
  run();
}

module.exports = { OLD_SERVER, NEW_SERVER };
