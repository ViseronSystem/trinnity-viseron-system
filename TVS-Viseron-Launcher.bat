@echo off
title TVS Viseron System v5.0
color 0A
echo ============================================
echo    TRINNITY VISERON SYSTEM v5.0
echo    Multi-Agent AI Operating System
echo ============================================
echo.
echo [TVS] Starting server on http://localhost:3000
echo [TVS] Abrindo dashboard no navegador...
echo.
start http://localhost:3000
start "TVS Viseron" cmd /c "node dist/src/index.js"
echo.
echo Pressione qualquer tecla para parar o servidor...
pause
taskkill /f /im node.exe >nul 2>&1
echo Servidor parado.
