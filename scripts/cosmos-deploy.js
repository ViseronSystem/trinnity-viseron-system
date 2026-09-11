#!/usr/bin/env node
/**
 * VISERON COSMOS — DEPLOY TO NEW SERVER
 * Deploy para 192.62.97.30
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const NEW_SERVER = '192.62.97.30';

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function updateConfig() {
  log('Updating configuration for new server...');
  
  // Update .env
  const envPath = path.join(__dirname, '..', '.env');
  let env = fs.readFileSync(envPath, 'utf8');
  
  // Update SERVER_IP
  if (env.includes('SERVER_IP=')) {
    env = env.replace(/SERVER_IP=.*/, `SERVER_IP=${NEW_SERVER}`);
  } else {
    env += `\nSERVER_IP=${NEW_SERVER}`;
  }
  
  // Update TVS_PUBLIC_URL
  if (env.includes('TVS_PUBLIC_URL=')) {
    env = env.replace(/TVS_PUBLIC_URL=.*/, `TVS_PUBLIC_URL=http://${NEW_SERVER}:3000`);
  }
  
  fs.writeFileSync(envPath, env);
  log('Configuration updated');
}

function createDeployScript() {
  const script = `#!/bin/bash
# Deploy Viseron Cosmos to ${NEW_SERVER}

echo "Deploying to ${NEW_SERVER}..."

# Copy files
scp -r ./* root@${NEW_SERVER}:/opt/viseron/

# SSH and setup
ssh root@${NEW_SERVER} << 'EOF'
cd /opt/viseron
npm install
npm run build
pm2 restart viseron
EOF

echo "Deploy complete!"
`;
  
  fs.writeFileSync(path.join(__dirname, '..', 'deploy.sh'), script);
  log('Deploy script created');
}

function createServerSetup() {
  const setup = `#!/bin/bash
# Server setup for ${NEW_SERVER}

echo "Setting up server ${NEW_SERVER}..."

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Create app directory
mkdir -p /opt/viseron
cd /opt/viseron

# Clone repo (or copy files)
# git clone <repo-url> .

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "viseron" -- start
pm2 save

# Setup startup
pm2 startup

echo "Server setup complete!"
`;
  
  fs.writeFileSync(path.join(__dirname, '..', 'server-setup.sh'), setup);
  log('Server setup script created');
}

function printInstructions() {
  log('\n=== DEPLOY TO ' + NEW_SERVER + ' ===\n');
  
  log('MANUAL DEPLOY:');
  log('1. Copy files to server:');
  log('   scp -r ./* root@' + NEW_SERVER + ':/opt/viseron/');
  log('');
  log('2. SSH into server:');
  log('   ssh root@' + NEW_SERVER);
  log('');
  log('3. Setup server:');
  log('   cd /opt/viseron');
  log('   npm install');
  log('   npm run build');
  log('   pm2 start npm --name "viseron" -- start');
  log('');
  
  log('OR USE SCRIPTS:');
  log('   bash deploy.sh');
  log('');
  
  log('ACCESS:');
  log('   http://' + NEW_SERVER + ':3000');
  log('   http://' + NEW_SERVER + ':3000/cosmos');
  log('   http://' + NEW_SERVER + ':3000/cosmos/dashboard');
}

function run() {
  log('=== VISERON COSMOS — DEPLOY SETUP ===');
  
  updateConfig();
  createDeployScript();
  createServerSetup();
  printInstructions();
  
  log('\n=== DEPLOY READY ===');
}

if (require.main === module) {
  run();
}

module.exports = { updateConfig, createDeployScript };
