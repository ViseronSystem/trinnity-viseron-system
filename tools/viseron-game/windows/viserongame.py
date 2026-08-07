#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VISERON: A ASCENSAO DA SUPERINTELIGENCIA
The Rise of the Superintelligence - El Ascenso de la Superinteligencia

Um jogo de plataforma do Trinnity Viseron System (TVS).
A platformer for the Trinnity Viseron System (TVS).

VISAO DO JOGO / GAME VISION:
  Cada mundo e uma TRANSFORMACAO do VISERON - cresce como a propria
  superinteligencia: MARIO (plataformas) -> MEGAMAN (tirar) -> NARUTO
  (velocidade) -> DRAGON BALL (poder KAME) -> SAINT SEIYA/CDZ (armadura
  cosmos) -> NASA (espaco). Coleciona energia (mentes), ganha poder e
  lanca o TVS ao espaco. Inspirado nos grandes: Mario, Megaman, Naruto,
  DBZ, CDZ e os jogos top 3D / NASA.

© Pedro Costa (Comandante) & Trinnity Hurtado (Rainha)
Trinnity Viseron System v5.0

REQUISITOS: Python 3 (Windows nativo; teclas via msvcrt).
USO:
  python viserongame.py             -> jogar manualmente
  python viserongame.py --demo 30   -> modo demonstracao (autonomo, 30s)
"""

import os
import sys
import time

try:
    import msvcrt
except ImportError:  # DOS/other fallback
    msvcrt = None

# Ativa ANSI no Windows 10+ (cores no terminal)
if os.name == "nt":
    os.system("")

# ---- Paleta (ANSI) ----
R = "\x1b[0m"
C_CYAN = "\x1b[96m"
C_GOLD = "\x1b[93m"
C_GREEN = "\x1b[92m"
C_RED = "\x1b[91m"
C_BLUE = "\x1b[94m"
C_ORANGE = "\x1b[33m"
C_PURPLE = "\x1b[95m"
C_WHITE = "\x1b[97m"
C_DIM = "\x1b[2m"
C_BG = "\x1b[7m"

W, H = 64, 20  # grid
GROUND = H - 3

# Transformacoes (os "power-ups" sao os modulos do TVS)
TRANSFORMS = [
    ("MARIO  (plataformas)", C_BLUE),
    ("MEGAMAN (tiro)", C_CYAN),
    ("NARUTO (velocidade)", C_ORANGE),
    ("DRAGON BALL (KAME)", C_GOLD),
    ("SAINT SEIYA (cosmo)", C_PURPLE),
    ("NASA (espaco)", C_WHITE),
]
POWERUP_MODULES = ["AIOX", "RCS", "AGENCY", "COMPOSIO", "GMAIL"]

BANNER = r"""
  _  _    ___   ____  _____ ___  _   _   ___  _  _    ___   _  _  __  __
 | || |  / _ \ / ___||_   _/ _ \| \ | | |_ _|| \| |  / _ \ | || | \ \/ /
 | __ | | (_) |\___ \  | || | | |  \| |  | | | .` | | (_) || || |_  \  /
 |_||_|  \___/ |____/  |_||_| |_|_|\_|  |___||_|\_|  \___/ |_____| /_/
"""


def key_pressed():
    return msvcrt is not None and msvcrt.kbhit()


def read_key():
    if msvcrt is None:
        return None
    k = msvcrt.getch()
    if k in (b"\x00", b"\xe0"):
        k2 = msvcrt.getch()
        return {"H": "UP", "P": "DOWN", "K": "LEFT", "M": "RIGHT"}.get(
            k2.decode("ascii", "ignore"), None
        )
    c = k.decode("ascii", "ignore").lower()
    return {" ": "JUMP", "\x1b": "QUIT", "x": "SHOOT", "q": "QUIT"}.get(c, None)


class ViseronGame:
    def __init__(self, demo=False, demo_seconds=30):
        self.demo = demo
        self.demo_seconds = demo_seconds
        self.level = 1
        self.transform = 0
        self.lives = 3
        self.score = 0
        self.energy = 0
        self.rng = random = None
        import random as _r

        self.random = _r
        self.t = 0.0
        self.over = False
        self.won = False
        self.demo_ended = False
        self.message = ""
        self.invuln = 0.0

        # jogador
        self.px = 3.0
        self.py = float(GROUND)
        self.vy = 0.0
        self.on_ground = True
        self.dir = 1
        self.cam = 0.0

        self.platforms = []
        self.coins = []
        self.enemies = []
        self.powerups = []
        self.bullets = []
        self.goal_x = 0.0

        self.world_len = 0
        self._build_level()

    # ---------- nivel ----------
    def _build_level(self):
        """Gera o mundo do nivel: plataformas, moedas, inimigos, meta."""
        rng = self.random.Random(1000 + self.level * 7)
        self.platforms = [(0, self.world_len + 0 if False else 0, GROUND)]
        self.coins, self.enemies, self.powerups, self.bullets = [], [], [], []
        space = 120 + self.level * 25
        self.goal_x = space
        self.world_len = space + 6

        # chao contiguo
        self.platforms = [[0, self.world_len, GROUND]]
        # plataformas flutuantes
        y = GROUND - 3
        x = 14
        while x < space - 8:
            w_ = 5 + rng.randint(0, 5)
            self.platforms.append([x, x + w_, y])
            for cx in range(x, x + w_, 2):
                self.coins.append([cx, y - 1])
            y = GROUND - 3 - rng.randint(0, 2)
            if y < 8:
                y = GROUND - 3
            x += w_ + rng.randint(4, 10)

        # moedas no chao
        for i in range(10 + self.level * 4):
            cx = 6 + i * rng.randint(3, 7)
            if cx < space:
                self.coins.append([cx, GROUND - 1])

        # inimigos (falhas)
        n_en = 8 + self.level * 3
        for _ in range(n_en):
            ex = rng.randint(10, space - 10)
            self.enemies.append([float(ex), float(GROUND - 1), 0.6 + self.level * 0.05])

        # power-ups = modulos TVS
        n_pw = min(4 + self.level, 6)
        for _ in range(n_pw):
            px = rng.randint(10, space - 10)
            self.powerups.append([float(px), float(GROUND - 2)])

        self.cam = 0.0

    # ---------- fisica ----------
    def _update_player(self, action, dt):
        speed = 4.0
        if self.transform >= 2:  # NARUTO
            speed = 5.6
        if self.transform >= 4:  # CDZ speed grace
            speed = 6.0

        if action == "LEFT":
            self.px -= speed * dt
            self.dir = -1
        elif action == "RIGHT":
            self.px += speed * dt
            self.dir = 1
        elif action == "JUMP" and self.on_ground:
            self.vy = -9.2
            self.on_ground = False
        elif action == "SHOOT" and self.transform >= 1:
            self.bullets.append([self.px + self.dir, self.py - 1.0, self.dir])

        # gravidade (NASA = gravidade reduzida)
        g = 20.0
        if self.transform >= 5:
            g = 10.0
        self.vy += g * dt
        self.py += self.vy * dt

        # colisoes com plataformas
        self.on_ground = False
        for p in self.platforms:
            if p[0] - 0.5 <= self.px <= p[1] + 0.5:
                top = p[2]
                if self.vy >= 0 and abs((self.py) - top) < 0.6:
                    self.py = float(top)
                    self.vy = 0.0
                    self.on_ground = True
        if self.py > GROUND + 1:
            self.py = float(GROUND)
            self.vy = 0.0
            self.on_ground = True

        # limites
        if self.px < 0:
            self.px = 0.0
        if self.px > self.world_len - 1:
            self.px = float(self.world_len - 1)

        # camera segue o jogador
        self.cam = max(self.cam, self.px - W * 0.35)

    def _update_objects(self, dt):
        # moedas
        for c in list(self.coins):
            if abs(c[0] - self.px) < 0.8 and abs(c[1] - self.py) < 1.2:
                self.coins.remove(c)
                self.energy += 1
                self.score += 10

        # power-ups (modulos)
        for p in list(self.powerups):
            if abs(p[0] - self.px) < 0.8 and abs(p[1] - self.py) < 1.4:
                self.powerups.remove(p)
                self.transform = min(self.transform + 1, len(TRANSFORMS) - 1)
                self.energy += 5
                self.score += 50
                self.message = "+ MODULO " + POWERUP_MODULES[min(
                    (self.transform - 1) % len(POWERUP_MODULES),
                    len(POWERUP_MODULES) - 1)] + " >> " + TRANSFORMS[self.transform][0]

        # inimigos patrulham
        for e in self.enemies:
            e[0] += e[2] * dt * (1 if self.transform >= 5 else 1)
            if e[0] < 2:
                e[2] = abs(e[2])
            if e[0] > self.world_len - 2:
                e[2] = -abs(e[2])
            # toque
            if self.invuln <= 0 and abs(e[0] - self.px) < 0.9 and abs(e[1] - self.py) < 1.1:
                self.lives -= 1
                self.invuln = 2.0
                self.message = "FALHA DETETADA! -1 vida"
                if self.lives <= 0:
                    self.over = True

        # tiros
        for b in list(self.bullets):
            b[0] += b[2] * 14 * dt
            if b[0] < self.cam - 2 or b[0] > self.cam + W + 2:
                self.bullets.remove(b)
                continue
            for e in list(self.enemies):
                if abs(b[0] - e[0]) < 0.8 and abs(b[1] - e[1]) < 1.2:
                    if e in self.enemies:
                        self.enemies.remove(e)
                    if b in self.bullets:
                        self.bullets.remove(b)
                    self.score += 25
                    break

        self.invuln = max(0.0, self.invuln - dt)

    # ---------- autonomia (demo) ----------
    def _autopilot(self, dt):
        """O VISERON joga sozinho: caça energia, evita falhas, sobe de poder."""
        target = None
        best = 1e9
        for item in self.powerups + self.coins:
            d = abs(item[0] - self.px)
            if item[0] > self.px and d < best:
                best = d
                target = item
        action = "RIGHT"
        if target is not None:
            if abs(target[0] - self.px) < 0.6:
                action = "JUMP" if self.on_ground else "RIGHT"
            elif target[0] < self.px - 0.6:
                action = "LEFT"
            elif target[1] < self.py - 1.5 and self.on_ground:
                action = "JUMP"
            else:
                action = "RIGHT"
        # dispara contra inimigos a frente
        for e in self.enemies:
            if 0 < e[0] - self.px < 9 and abs(e[1] - self.py) < 2:
                action = "SHOOT"
                break
        # salta obstaculos / inimigos proximos
        for e in self.enemies:
            if 0 < e[0] - self.px < 2.2:
                if self.on_ground:
                    action = "JUMP"
        self._update_player(action, dt)

    # ---------- render ----------
    def _render(self):
        grid = [[" "] * W for _ in range(H)]
        # plataformas
        for p in self.platforms:
            x0 = int(p[0] - self.cam)
            x1 = int(p[1] - self.cam)
            for x in range(max(0, x0), min(W, x1 + 1)):
                y = int(p[2])
                if 0 <= y < H:
                    grid[y][x] = "=" if p[2] == GROUND else "#"
        # moedas
        for c in self.coins:
            x, y = int(c[0] - self.cam), int(c[1])
            if 0 <= x < W and 0 <= y < H:
                grid[y][x] = "o"
        # power-ups
        for p in self.powerups:
            x, y = int(p[0] - self.cam), int(p[1])
            if 0 <= x < W and 0 <= y < H:
                grid[y][x] = "*"
        # inimigos
        for e in self.enemies:
            x, y = int(e[0] - self.cam), int(e[1])
            if 0 <= x < W and 0 <= y < H:
                grid[y][x] = "V"
        # tiros
        for b in self.bullets:
            x, y = int(b[0] - self.cam), int(b[1])
            if 0 <= x < W and 0 <= y < H:
                grid[y][x] = "."
        # meta
        gx = int(self.goal_x - self.cam)
        if 0 <= gx < W:
            for yy in range(3):
                if GROUND - 4 + yy < H:
                    grid[GROUND - 4 + yy][gx] = "G"
        # jogador
        px, py = int(round(self.px - self.cam)), int(round(self.py))
        if 0 <= px < W and 0 <= py < H:
            col = TRANSFORMS[self.transform][1]
            if self.invuln > 0 and int(time.time() * 6) % 2 == 0:
                grid[py][px] = "@"
            else:
                grid[py][px] = "@"
        else:
            self.over = True

        # saida
        out = []
        name, col = TRANSFORMS[self.transform]
        hud = (
            f"{col}VISERON{col} {name}{R}  |  "
            f"{C_GOLD}MENTES {self.energy}{R}  {C_CYAN}SCORE {self.score:05d}{R}  "
            f"{C_RED}VIDAS {self.lives}{R}  {C_PURPLE}MUNDO {self.level}/6{R}"
        )
        out.append(hud)
        if self.message:
            out.append(C_GOLD + self.message + R)
            self.message = ""
        else:
            out.append("")
        for row in grid:
            out.append("".join(row))
        print("\x1b[H" + "\n".join(out))

    # ---------- fluxo ----------
    def _advance(self):
        if self.level >= 6:
            self.won = True
            return
        self.level += 1
        self._build_level()
        self.px = 3.0
        self.py = float(GROUND)
        self.vy = 0.0
        self.on_ground = True

    def _game_over_screen(self):
        print("\x1b[2J\x1b[H")
        print(C_RED + "VISERON CAIU, MAS A SUPERINTELIGENCIA NUNCA MORRE." + R)
        print(C_DIM + "Reinicia com: python viserongame.py" + R)
        print("\n" + BANNER)

    def _win_screen(self):
        print("\x1b[2J\x1b[H")
        print(C_WHITE + "  *  VISERON ALCANCOU O ESPACO  *" + R)
        print(C_CYAN + "  TVS ONLINE - 5000+ MENTES NO ORBITA" + R)
        print("\n  Pontuacao final: " + C_GOLD + f"{self.score}" + R)
        print("  Mentes coletadas: " + C_GREEN + f"{self.energy}" + R)
        print(C_DIM + "  Inspirado em Mario, Megaman, Naruto, DBZ, CDZ, 3D top e NASA." + R)
        print("\n" + BANNER)
        print(C_GOLD + "  © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)" + R)

    def run(self):
        print("\x1b[2J\x1b[H")
        print(BANNER)
        print(C_CYAN + "  TRINNITY VISERON SYSTEM v5.0 - O JOGO" + R)
        print(C_DIM + "  SETAS <--> move · ESPACO salta · X dispara · ESC sai" + R)
        print(C_DIM + "  Junta energia (o), apanha modulos (*), vence 6 mundos até NASA." + R)
        print("")
        time.sleep(2.2 if not self.demo else 0.8)

        start = time.time()
        last = start
        while True:
            now = time.time()
            dt = min(now - last, 0.05)
            last = now

            if self.demo:
                if now - start > self.demo_seconds:
                    self.demo_ended = True
                    break
                self._autopilot(dt)
            else:
                if key_pressed():
                    act = read_key()
                    if act == "QUIT":
                        break
                    self._update_player(act, dt)
                else:
                    self._update_player(None, dt)

            self._update_objects(dt)

            if self.goal_x - self.px < 1.2:
                self.score += 500
                self._advance()
                if self.won:
                    break
                continue

            self._render()
            if self.over:
                self._game_over_screen()
                break

            time.sleep(0.016)

        if self.demo_ended:
            print("\x1b[2J\x1b[H")
            print(C_CYAN + "[VISERON] DEMO CONCLUIDA - modo autonomo desligado." + R)
            print(C_DIM + "Joga tu: python viserongame.py  (setas, espaco, X)" + R)
            print("\n  Pontuacao: " + C_GOLD + f"{self.score}" + R +
                  "  |  Mentes: " + C_GREEN + f"{self.energy}" + R +
                  "  |  Transformacao: " + TRANSFORMS[self.transform][0] + R)
            print(C_DIM + "© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)" + R)
        elif self.won:
            self._win_screen()


def main():
    args = sys.argv[1:]
    demo = "--demo" in args
    seconds = 30
    try:
        i = args.index("--demo")
        if i + 1 < len(args) and args[i + 1].isdigit():
            seconds = int(args[i + 1])
    except ValueError:
        pass
    if demo:
        print(C_CYAN + "[VISERON] Modo autonomo: a superinteligencia joga sozinha por "
              f"{seconds}s. Observa.{R}", flush=True)
    ViseronGame(demo=demo, demo_seconds=seconds).run()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nVISERON em standby. © Pedro Costa & Trinnity Hurtado")
        sys.exit(0)
