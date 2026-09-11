#!/bin/bash
# ========================================
#  VISERON COSMOS - SERVER SETUP
#  Server: 192.62.97.30
# ========================================

echo "=== VISERON COSMOS SERVER SETUP ==="
echo "Server: 192.62.97.30"
echo "===================================="
echo.

# Update system
echo "[1/8] Updating system..."
apt update && apt upgrade -y

# Install Node.js 20
echo "[2/8] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
echo "[3/8] Installing PM2..."
npm install -g pm2

# Install Python
echo "[4/8] Installing Python..."
apt install -y python3 python3-pip

# Create app directory
echo "[5/8] Creating app directory..."
mkdir -p /opt/viseron
mkdir -p /opt/viseron/data
mkdir -p /opt/viseron/data/trading
mkdir -p /opt/viseron/data/social

# Install dependencies
echo "[6/8] Installing dependencies..."
cd /opt/viseron
npm install

# Build
echo "[7/8] Building..."
npm run build

# Start with PM2
echo "[8/8] Starting services..."
pm2 start npm --name "viseron" -- start
pm2 save
pm2 startup

# Setup firewall
echo "Setting up firewall..."
ufw allow 3000/tcp
ufw allow 22/tcp
ufw --force enable

echo.
echo "=== SETUP COMPLETE ==="
echo "Access: http://192.62.97.30:3000"
echo "Cosmos: http://192.62.97.30:3000/cosmos"
echo "Dashboard: http://192.62.97.30:3000/cosmos/dashboard"
echo "======================"
