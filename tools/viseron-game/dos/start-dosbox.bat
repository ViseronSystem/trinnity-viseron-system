@ECHO OFF
REM =============================================================
REM  start-dosbox.bat - lanza el juego en DOSBox desde Windows
REM  Trinnity Viseron System v5.0
REM  (C) Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
REM
REM  Si DOSBox no esta en el PATH, edita la linea DOSBOX= abajo.
REM =============================================================
SETLOCAL
SET DOSBOX=dosbox
WHERE %DOSBOX% >NUL 2>NUL
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] DOSBox no encontrado.
    ECHO Instala DOSBox desde https://www.dosbox.com y vuelve a probar.
    ECHO (sin DOSBox puedes leer VISERON.BAS y probarlo en DOS real)
    GOTO END
)
ECHO Lanzando VISERON en DOSBox...
REM montamos la carpeta del juego como C: en DOSBox
%DOSBOX% -c "mount c: %~dp0" -c "c:" -c "dir" -c "VISERON.BAT"
:END
ENDLOCAL
