@ECHO OFF
REM =============================================================
REM  start-dosbox.bat - lanza el juego en DOSBox desde Windows
REM  Trinnity Viseron System v5.0
REM  (C) Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
REM
REM  Detecta DOSBox en PATH o en la ruta estandar de instalacion.
REM  Edita la linea DOSBOX= abajo si esta en otro sitio.
REM =============================================================
SETLOCAL
SET DOSBOX=dosbox.exe
WHERE %DOSBOX% >NUL 2>NUL
IF %ERRORLEVEL% NEQ 0 (
    SET DOSBOX=C:\Program Files (x86)\DOSBox-0.74-3\dosbox.exe
    IF NOT EXIST "%DOSBOX%" (
        SET DOSBOX=C:\Program Files\DOSBox\dosbox.exe
    )
    IF NOT EXIST "%DOSBOX%" (
        ECHO [ERROR] DOSBox no encontrado. Instalalo desde https://www.dosbox.com
        GOTO END
    )
)
ECHO Lanzando VISERON en DOSBox...
"%DOSBOX%" -c "mount c: %~dp0" -c "c:" -c "VISERON.BAT"
:END
ENDLOCAL
