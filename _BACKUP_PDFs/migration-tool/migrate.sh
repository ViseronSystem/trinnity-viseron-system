#!/bin/bash
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
