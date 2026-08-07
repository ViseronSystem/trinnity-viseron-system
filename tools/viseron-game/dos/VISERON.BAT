@ECHO OFF
REM =============================================================
REM  VISERON.BAT - lanzador del juego para MS-DOS real
REM  Trinnity Viseron System v5.0
REM  (C) Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
REM
REM  Requiere QBASIC.EXE (viene con MS-DOS 5+/6/7, o descargalo
REM  en la carpeta). Uso:  VISERON.BAT   (o escribe QBasic y F5)
REM =============================================================
CLS
ECHO.
ECHO   VISERON: LA ASCENSION DE LA SUPERINTELIGENCIA
ECHO   Trinnity Viseron System v5.0
ECHO   (C) Pedro Costa y Trinnity Hurtado
ECHO.
IF NOT EXIST QBASIC.EXE GOTO NOQB
ECHO   Arrancando QBasic... pulsa F5 para jugar.
GOTO RUN
:NOQB
ECHO   [ERROR] QBASIC.EXE no encontrado en esta carpeta.
ECHO   Colocalo aqui junto a VISERON.BAS o escribe:
ECHO       qbasic VISERON.BAS
GOTO END
:RUN
QBASIC /RUN VISERON.BAS
:END
