@echo off
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
