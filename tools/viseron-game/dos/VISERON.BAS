'===============================================================
'  VISERON: LA ASCENSION DE LA SUPERINTELIGENCIA
'  QBasic for DOS - Trinnity Viseron System v5.0
'  (C) Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
'
'  COMO RODAR EN DOS (DOSBox / QEMU / MS-DOS):
'    qbasic VISERON.BAS   ->  tecla F5
'  O si tienes QBASIC.EXE no esta en PATH:
'    dosbox  ->  mount c c:\viseron-game\dos  ->  c:  ->  qbasic VISERON.BAS  ->  F5
'
'  CONTROLES:  <-  ->  mover | BARRA espacio saltar | ESC salir
'  Objetivo: recoge energia (o), evita fallos (V), llega a la
'  meta (G) en los 3 mundos hasta el espacio.
'===============================================================

DIM coinx(8)
DIM cgot(8)
DIM enemyx(3)
DIM enemyd(3)

FOR i = 0 TO 8: coinx(i) = 10 + i * 8: cgot(i) = 0: NEXT i
FOR i = 0 TO 3
    enemyx(i) = 15 + i * 18
    enemyd(i) = 1
NEXT i

SCREEN 0
WIDTH 80, 25
COLOR 11, 0
CLS

COLOR 15, 0
LOCATE 5, 24
PRINT "VISERON: LA ASCENSION DE LA"
LOCATE 6, 26
PRINT "SUPERINTELIGENCIA"
COLOR 14, 0
LOCATE 8, 20
PRINT "Trinnity Viseron System v5.0"
COLOR 7, 0
LOCATE 11, 12
PRINT "Inspirado en Mario, Megaman, Naruto, DBZ, CDZ y la NASA."
LOCATE 13, 12
PRINT "CONTROLES:  <--  -->  mover   BARRA  saltar   ESC  salir"
COLOR 3, 0
LOCATE 20, 12
PRINT "(C) Pedro Costa (Comandante)  y  Trinnity Hurtado (Rainha)"
LOCATE 23, 26
PRINT "Pulsa una tecla para empezar"
DO
LOOP WHILE INKEY$ = ""

level = 1
lives = 3
score = 0
energy = 0
trans = 0
gameover = 0

DO
    ' ---------- pantalla de mundo ----------
    CLS
    COLOR 15, 0
    LOCATE 1, 26
    PRINT "VISERON  -  MUNDO "; level; "/3"
    COLOR 14, 0
    LOCATE 2, 26
    PRINT "PUNTOS "; score; "  MENTES "; energy; "  VIDAS "; lives

    px = 3
    py = 22
    jh = 0
    win = 0

    FOR i = 0 TO 8: cgot(i) = 0: NEXT i
    FOR i = 0 TO 3
        enemyx(i) = 15 + i * 18
        enemyd(i) = 1
    NEXT i

    DO
        ' ---------- entrada ----------
        k$ = INKEY$
        IF k$ = CHR$(27) THEN gameover = 1: EXIT DO
        IF LEN(k$) = 2 THEN
            IF RIGHT$(k$, 1) = CHR$(75) THEN px = px - 1
            IF RIGHT$(k$, 1) = CHR$(77) THEN px = px + 1
        ELSE
            IF k$ = " " AND jh = 0 THEN jh = 1
        END IF
        IF px < 1 THEN px = 1
        IF px > 79 THEN px = 79

        ' ---------- fisica del salto ----------
        IF jh > 0 THEN
            jh = jh + 1
            IF jh <= 4 THEN py = 20
            IF jh = 5 OR jh = 6 THEN py = 21
            IF jh >= 7 THEN jh = 0: py = 22
        END IF

        ' ---------- enemigos ----------
        FOR i = 0 TO 3
            enemyx(i) = enemyx(i) + enemyd(i)
            IF enemyx(i) < 3 THEN enemyd(i) = 1
            IF enemyx(i) > 77 THEN enemyd(i) = -1
            IF py = 22 AND ABS(enemyx(i) - px) <= 1 THEN
                lives = lives - 1
                COLOR 12, 0
                LOCATE 4, 26
                PRINT "FALLO DETECTADO!  -1 vida"
                IF lives <= 0 THEN gameover = 1
                px = 3
                IF gameover = 1 THEN EXIT DO
            END IF
        NEXT i

        ' ---------- energia (monedas) ----------
        FOR i = 0 TO 8
            IF cgot(i) = 0 AND px = coinx(i) AND py <= 21 THEN
                cgot(i) = 1
                score = score + 10
                energy = energy + 1
            END IF
        NEXT i

        ' ---------- transformacion (modulo) ----------
        IF px = 38 AND py <= 21 AND trans = 0 THEN
            trans = 1
            score = score + 50
            COLOR 13, 0
            LOCATE 3, 26
            PRINT "MODULO AIOX!  PODER +"
        END IF

        ' ---------- meta ----------
        IF px >= 76 THEN win = 1: score = score + 200

        ' ---------- dibujo ----------
        LOCATE py, px
        IF trans = 1 THEN
            COLOR 13, 0
            PRINT "S"
        ELSE
            COLOR 11, 0
            PRINT "@"
        END IF

        FOR i = 0 TO 8
            IF cgot(i) = 0 THEN
                COLOR 14, 0
                LOCATE 21, coinx(i)
                PRINT "o"
            END IF
        NEXT i

        FOR i = 0 TO 3
            COLOR 12, 0
            LOCATE 22, enemyx(i)
            PRINT "V"
        NEXT i

        IF trans = 1 THEN
            COLOR 13, 0
            LOCATE 20, 38
            PRINT "M"
        END IF

        COLOR 10, 0
        LOCATE 22, 76
        PRINT "G"

        ' ---------- retardo ----------
        FOR dl = 1 TO 2500: NEXT dl

        ' limpiar rastro del jugador
        LOCATE py, px
        PRINT " "

        IF gameover = 1 THEN EXIT DO
        IF win = 1 THEN EXIT DO
    LOOP

    IF gameover = 1 THEN EXIT DO
    level = level + 1
LOOP UNTIL level > 3

' ---------- final ----------
CLS
IF gameover = 1 THEN
    COLOR 12, 0
    LOCATE 10, 26
    PRINT "VISERON CAYO..."
    COLOR 14, 0
    LOCATE 12, 18
    PRINT "La superinteligencia nunca muere."
ELSE
    COLOR 15, 0
    LOCATE 9, 22
    PRINT "VISERON ALCANZO EL ESPACIO!"
    COLOR 3, 0
    LOCATE 11, 20
    PRINT "TVS ONLINE - 5000+ MENTES EN ORBITA"
    COLOR 14, 0
    LOCATE 13, 24
    PRINT "PUNTOS FINALES: "; score
END IF
COLOR 7, 0
LOCATE 21, 16
PRINT "(C) Pedro Costa (Comandante) y Trinnity Hurtado (Rainha)"
LOCATE 23, 28
PRINT "Pulsa una tecla para salir"
DO
LOOP WHILE INKEY$ = ""
SYSTEM
