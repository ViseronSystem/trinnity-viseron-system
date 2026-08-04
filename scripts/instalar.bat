@echo off
chcp 65001 >nul
echo ============================================
echo   TRINNITY VISERON SYSTEM - APK Android v5.0.0
echo ============================================
echo.
echo  O ficheiro TrinnityViseron.apk esta nesta pasta:
echo    %~dp0
echo.
echo  COMO INSTALAR NO TELEMOVEL:
echo   1) Envia o ficheiro .apk para o telemovel (USB, email, Drive...)
echo   2) No Android, abre o ficheiro .apk e toca em "Instalar"
echo   3) Se pedir "Fontes desconhecidas", ativa e continua
echo   4) Abre a app TVS e liga-a ao servidor (ecra Definicoes)
echo.
echo  A abrir a pasta...
start "" "%~dp0"
timeout /t 4 >nul
