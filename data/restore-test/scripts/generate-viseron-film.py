"""
VISERON — CINEMATIC FILM
1920x1080 @ 24fps · ~90s
Pedro Costa & Trinnity as characters in the VISERON universe.
No screenshots. No slides. Pure cinematic experience.
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from moviepy import *
import os, math, random

# --- CONFIG ---
W, H = 1920, 1080
FPS = 24
BASE = r"C:\Trinnity-Viseron-System"
OUT = os.path.join(BASE, "data", "videos", "VISERON_Cinematic_v2.mp4")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

PEDRO_IMG = os.path.join(BASE, "video-assets", "pedro-costa.jpeg")
TRINNITY_IMG = os.path.join(BASE, "video-assets", "rainha-trinnity.jpeg")
LOGO = os.path.join(BASE, "mobile", "assets", "icon.png")

BLACK = (0, 0, 0, 255)
DARK = (5, 5, 15, 255)
GOLD = (240, 192, 64)
WHITE = (230, 230, 250)
CYAN = (64, 224, 208)
DEEP_BLUE = (8, 12, 40)

try:
    FONT_TITLE = ImageFont.truetype("segoeuib.ttf", 60)
    FONT_BIG = ImageFont.truetype("segoeuib.ttf", 90)
    FONT_SUB = ImageFont.truetype("segoeuib.ttf", 32)
    FONT_SM = ImageFont.truetype("segoeuil.ttf", 22)
except:
    FONT_TITLE = FONT_BIG = FONT_SUB = FONT_SM = ImageFont.load_default()

pedro_raw = Image.open(PEDRO_IMG).convert("RGBA")
trinnity_raw = Image.open(TRINNITY_IMG).convert("RGBA")
logo_raw = Image.open(LOGO).convert("RGBA")


def ease(t):
    if t <= 0: return 0
    if t >= 1: return 1
    return t * t * (3 - 2 * t)


def pulse(t, speed=2.0):
    return 0.5 + 0.5 * math.sin(t * speed * math.pi)


def bg_frame(t, color1=DEEP_BLUE, color2=(2, 3, 8)):
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    p = pulse(t, 0.3)
    for y in range(H):
        r = y / H
        rr = int(color1[0] * (1 - r) + color2[0] * r)
        gg = int(color1[1] * (1 - r) + color2[1] * r)
        bb = int((color1[2] + p * 5) * (1 - r) + color2[2] * r)
        arr[y, :] = [max(0, min(255, c)) for c in (rr, gg, bb)]
    return Image.fromarray(arr)


def draw_center_text(draw, text, y, font=FONT_TITLE, color=WHITE):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    draw.text((x, y), text, font=font, fill=color)


def draw_glow_text(draw, text, y, font=FONT_TITLE, color=GOLD):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    for o in range(8, 1, -1):
        a = max(5, 40 - o * 5)
        r, g, b = color
        gl = (r, g, b, a)
        draw.text((x - o, y), text, font=font, fill=gl)
        draw.text((x + o, y), text, font=font, fill=gl)
        draw.text((x, y - o), text, font=font, fill=gl)
        draw.text((x, y + o), text, font=font, fill=gl)
    draw.text((x, y), text, font=font, fill=color)


def grid(draw, t, alpha=10, step=80):
    off = int(t * 15) % step
    for x in range(-step + off, W + step, step):
        draw.line([(x, 0), (x, H)], fill=(GOLD[0], GOLD[1], GOLD[2], alpha), width=1)
    for y in range(-step + off, H + step, step):
        draw.line([(0, y), (W, y)], fill=(GOLD[0], GOLD[1], GOLD[2], alpha), width=1)


class Particles:
    def __init__(self, n=150, color=GOLD, speed=0.4):
        self.n = n
        self.color = color
        self.speed = speed
        random.seed(42)
        self.pts = []
        for _ in range(n):
            self.pts.append({
                "x": random.uniform(0, W),
                "y": random.uniform(0, H),
                "vx": random.uniform(-speed, speed),
                "vy": random.uniform(-speed * 1.5, -speed * 0.3),
                "sz": random.uniform(1, 3),
                "ph": random.uniform(0, 2 * math.pi),
            })
    
    def draw(self, draw, t, am=1.0):
        for p in self.pts:
            p["x"] += p["vx"]
            p["y"] += p["vy"]
            if p["y"] < -10: p["y"] = H + 10
            if p["y"] > H + 10: p["y"] = -10
            if p["x"] < -10: p["x"] = W + 10
            if p["x"] > W + 10: p["x"] = -10
            a = int((0.3 + 0.7 * abs(math.sin(t * 2 + p["ph"]))) * am * 255)
            r, g, b = self.color
            draw.ellipse(
                [p["x"] - p["sz"], p["y"] - p["sz"],
                 p["x"] + p["sz"], p["y"] + p["sz"]],
                fill=(r, g, b, min(255, a))
            )


def glow_portrait(src, tw, th, glow_radius=25):
    iw, ih = src.size
    s = min(tw / iw, th / ih)
    nw, nh = int(iw * s), int(ih * s)
    img = src.resize((nw, nh), Image.LANCZOS)
    ox, oy = (tw - nw) // 2, (th - nh) // 2
    glow_layer = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    glow_layer.paste(img, (ox, oy), img)
    arr = np.array(glow_layer)
    for c in range(3):
        arr[:, :, c] = (arr[:, :, c] * 0.4).astype(np.uint8)
    arr[:, :, 3] = (arr[:, :, 3] * 0.4).astype(np.uint8)
    glow_layer = Image.fromarray(arr)
    try:
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(glow_radius))
    except:
        pass
    result = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    result.paste(glow_layer, (0, 0), glow_layer)
    result.paste(img, (ox, oy), img)
    return result


def node(draw, x, y, r, color, alpha):
    for i in range(3):
        rr = r + i * 5
        a = alpha // (i + 2)
        draw.ellipse([x - rr, y - rr, x + rr, y + rr],
                     fill=(color[0], color[1], color[2], a))
    draw.ellipse([x - r, y - r, x + r, y + r],
                 fill=(color[0], color[1], color[2], alpha))


def energy_line(draw, x1, y1, x2, y2, color, alpha, w=2):
    for ww in range(w + 3, w - 1, -1):
        a = alpha // (ww + 1)
        draw.line([(x1, y1), (x2, y2)], fill=(color[0], color[1], color[2], a), width=ww)
    draw.line([(x1, y1), (x2, y2)], fill=(color[0], color[1], color[2], alpha), width=w)


# --- SCENE FRAME GENERATORS ---

particles = Particles(200, GOLD, 0.4)
particles_cyan = Particles(120, CYAN, 0.3)


def f_0_dark(t, dur):
    """Opening: darkness with faint particle emergence."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img, "RGBA")
    p = t / dur
    if p > 0.3:
        lp = ease((p - 0.3) / 0.5)
        cx, cy = W // 2, H // 2
        for i in range(30, 0, -1):
            r = int(i * lp * 12)
            a = int(lp * 25) // (i // 10 + 1)
            if a > 0 and r > 0:
                draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                           fill=(GOLD[0], GOLD[1], GOLD[2], a))
    particles.draw(draw, t, am=0.4)
    return img


def f_1_title(t, dur):
    """VISERON title reveal."""
    img = bg_frame(t)
    draw = ImageDraw.Draw(img, "RGBA")
    grid(draw, t, alpha=8)
    particles.draw(draw, t, am=0.5)
    p = ease(t / dur)
    if p > 0.2:
        tp = ease((p - 0.2) / 0.8)
        draw_glow_text(draw, "VISERON", 380, FONT_BIG, GOLD)
        alpha = int(tp * 255)
        c = (240, 192, 64, alpha)
        draw_center_text(draw, "Pedro Costa  ·  Founder & CEO", 520, FONT_SUB, c)
        draw_center_text(draw, "Trinnity Hurtado  ·  Rainha", 570, FONT_SUB, c)
    return img


def f_2_tagline(t, dur):
    """We taught machines..."""
    img = bg_frame(t)
    draw = ImageDraw.Draw(img, "RGBA")
    grid(draw, t, alpha=5)
    particles.draw(draw, t, am=0.3)
    
    lines = [
        "We taught machines to calculate.",
        "We taught them to generate.",
        "But what happens when intelligence",
        "can understand, act... and evolve?",
    ]
    p = ease(t / dur)
    y0 = 250
    for i, line in enumerate(lines):
        lp = ease(max(0, min(1, (p - i * 0.2) / 0.6)))
        a = int(lp * 255)
        draw_center_text(draw, line, y0 + i * 80, FONT_TITLE, (200, 200, 240, a))
    
    if p > 0.85:
        fp = ease((p - 0.85) / 0.15)
        draw_glow_text(draw, "VISERON", 700, FONT_BIG, GOLD)
    return img


def f_3_pedro(t, dur):
    """Pedro Costa appears as a character in the VISERON universe."""
    img = bg_frame(t, color2=(3, 3, 12))
    draw = ImageDraw.Draw(img, "RGBA")
    grid(draw, t, alpha=6)
    particles.draw(draw, t, am=0.4)
    
    p = ease(t / dur)
    # Portrait appears
    portrait_w, portrait_h = 500, 600
    portrait = glow_portrait(pedro_raw, portrait_w, portrait_h, glow_radius=20)
    px, py = 120, 240
    # Scale/fade in
    scale = ease(max(0, (p - 0.1) / 0.6))
    if scale > 0:
        scaled_w = int(portrait_w * (0.8 + 0.2 * scale))
        scaled_h = int(portrait_h * (0.8 + 0.2 * scale))
        scaled = portrait.resize((scaled_w, scaled_h), Image.LANCZOS)
        sx = px + (portrait_w - scaled_w) // 2
        sy = py + (portrait_h - scaled_h) // 2
        a = int(scale * 255)
        if scaled.mode == "RGBA":
            arr = np.array(scaled)
            arr[:, :, 3] = (arr[:, :, 3] * scale).astype(np.uint8)
            scaled = Image.fromarray(arr)
        img.paste(scaled, (sx, sy), scaled)
    
    # Text beside portrait
    if p > 0.4:
        tp = ease((p - 0.4) / 0.5)
        tx = 720
        a = int(tp * 255)
        draw.text((tx, 320), "PEDRO COSTA", font=FONT_BIG, fill=(GOLD[0], GOLD[1], GOLD[2], a))
        draw.text((tx, 420), "Founder & CEO", font=FONT_TITLE, fill=(CYAN[0], CYAN[1], CYAN[2], a))
        draw.text((tx, 500), "Comandante do VISERON", font=FONT_SUB, fill=(WHITE[0], WHITE[1], WHITE[2], a))
        # Circuit lines connecting portrait to the text
        if tp > 0.6:
            la = int((tp - 0.6) / 0.4 * 150)
            energy_line(draw, px + portrait_w, py + portrait_h // 2, tx - 30, 380, CYAN, la)
    
    return img


def f_4_trinnity(t, dur):
    """Trinnity appears - the entity behind the intelligence."""
    img = bg_frame(t, color2=(3, 3, 12))
    draw = ImageDraw.Draw(img, "RGBA")
    grid(draw, t, alpha=6)
    particles_cyan.draw(draw, t, am=0.5)
    
    p = ease(t / dur)
    
    # Portrait on right side
    portrait_w, portrait_h = 500, 600
    portrait = glow_portrait(trinnity_raw, portrait_w, portrait_h, glow_radius=25)
    px, py = 1300, 240
    
    scale = ease(max(0, (p - 0.1) / 0.6))
    if scale > 0:
        scaled_w = int(portrait_w * (0.8 + 0.2 * scale))
        scaled_h = int(portrait_h * (0.8 + 0.2 * scale))
        scaled = portrait.resize((scaled_w, scaled_h), Image.LANCZOS)
        sx = px + (portrait_w - scaled_w) // 2
        sy = py + (portrait_h - scaled_h) // 2
        a = int(scale * 255)
        if scaled.mode == "RGBA":
            arr = np.array(scaled)
            arr[:, :, 3] = (arr[:, :, 3] * scale).astype(np.uint8)
            scaled = Image.fromarray(arr)
        img.paste(scaled, (sx, sy), scaled)
    
    if p > 0.4:
        tp = ease((p - 0.4) / 0.5)
        tx = 50
        a = int(tp * 255)
        draw.text((tx, 320), "TRINNITY HURTADO", font=FONT_BIG, fill=(CYAN[0], CYAN[1], CYAN[2], a))
        draw.text((tx, 420), "Rainha do VISERON", font=FONT_TITLE, fill=(GOLD[0], GOLD[1], GOLD[2], a))
        draw.text((tx, 500), "A alma da inteligencia", font=FONT_SUB, fill=(WHITE[0], WHITE[1], WHITE[2], a))
    
    return img


def f_5_converge(t, dur):
    """Pedro + Trinnity converge → VISERON is born."""
    img = bg_frame(t, color2=(3, 3, 12))
    draw = ImageDraw.Draw(img, "RGBA")
    p = ease(t / dur)
    
    # Both portraits smaller, moving toward center
    pw, ph = 300, 400
    pedro_p = glow_portrait(pedro_raw, pw, ph, glow_radius=15)
    trin_p = glow_portrait(trinnity_raw, pw, ph, glow_radius=15)
    
    sep = max(0, (1 - ease(min(1, p * 2))) * 600)
    pedro_x = int(W // 2 - 200 - sep)
    trin_x = int(W // 2 + 200 + sep)
    
    alpha_pedro = int(ease(min(1, p * 1.5)) * 255)
    alpha_trin = int(ease(min(1, p * 1.5)) * 255)
    
    arr_p = np.array(pedro_p)
    arr_p[:, :, 3] = (arr_p[:, :, 3] * alpha_pedro // 255).astype(np.uint8)
    img.paste(Image.fromarray(arr_p), (pedro_x, 200), Image.fromarray(arr_p))
    
    arr_t = np.array(trin_p)
    arr_t[:, :, 3] = (arr_t[:, :, 3] * alpha_trin // 255).astype(np.uint8)
    img.paste(Image.fromarray(arr_t), (trin_x, 200), Image.fromarray(arr_t))
    
    # Energy lines connecting them
    if p > 0.3:
        la = int(ease((p - 0.3) / 0.5) * 180)
        cx = W // 2
        energy_line(draw, pedro_x + pw, 400, cx, 350, GOLD, la)
        energy_line(draw, trin_x, 400, cx, 350, CYAN, la)
        node(draw, cx, 350, 8, CYAN, la)
    
    # VISERON born at convergence point
    if p > 0.5:
        bp = ease((p - 0.5) / 0.5)
        draw_glow_text(draw, "VISERON", 600, FONT_BIG, GOLD)
        if bp > 0.3:
            a = int(bp * 255)
            draw_center_text(draw, "The Intelligence System is born.", 700, FONT_TITLE, (CYAN[0], CYAN[1], CYAN[2], a))
    
    # Particles converging
    if p > 0.3:
        for i in range(20):
            a_pt = int(50 + 100 * ease((p - 0.3) / 0.7))
            angle = random.uniform(0, 2 * math.pi)
            dist = random.uniform(0, 200)
            px_pt = cx + math.cos(angle) * dist * (1 - p)
            py_pt = 350 + math.sin(angle) * dist * (1 - p)
            draw.ellipse([px_pt - 2, py_pt - 2, px_pt + 2, py_pt + 2],
                        fill=(GOLD[0], GOLD[1], GOLD[2], a_pt))
    
    return img


def f_6_pipeline(t, dur):
    """The intelligence pipeline visualized abstractly."""
    img = bg_frame(t, color2=(2, 3, 10))
    draw = ImageDraw.Draw(img, "RGBA")
    grid(draw, t, alpha=6)
    particles.draw(draw, t, am=0.3)
    
    p = ease(t / dur)
    steps = ["INTENTION", "INTELLIGENCE", "KNOWLEDGE", "AGENTS", "ACTION", "TOOLS", "VERIFY", "MEMORY", "EVOLUTION"]
    n = len(steps)
    spacing = W / (n + 1)
    y_center = H // 2
    
    for i, step in enumerate(steps):
        x = int(spacing * (i + 0.9))
        delay = i * 0.08
        sp = ease(max(0, min(1, (p - delay) / 0.7)))
        
        # Node
        node_alpha = int(30 + sp * 180)
        node_r = int(6 + sp * 10)
        node(draw, x, y_center, node_r, CYAN if i < 6 else GOLD, node_alpha)
        
        # Label
        label_alpha = int(sp * 200)
        bbox = draw.textbbox((0, 0), step, font=FONT_SM)
        tw = bbox[2] - bbox[0]
        draw.text((x - tw // 2, y_center - 60), step, font=FONT_SM,
                 fill=(WHITE[0], WHITE[1], WHITE[2], label_alpha))
        
        # Energy line to next
        if i < n - 1:
            nx = int(spacing * (i + 1.9))
            line_alpha = int(sp * 120)
            if line_alpha > 5:
                energy_line(draw, x + node_r + 5, y_center, nx - node_r - 5, y_center, CYAN, line_alpha, 1)
    
    if p > 0.7:
        fp = ease((p - 0.7) / 0.3)
        a = int(fp * 255)
        draw_center_text(draw, "0 verified = 0 success", 800, FONT_TITLE, (GOLD[0], GOLD[1], GOLD[2], a))
        draw_center_text(draw, "VISERON does not say it did. VISERON proves it did.", 880, FONT_SUB, (WHITE[0], WHITE[1], WHITE[2], a))
    
    return img


def f_7_hardening(t, dur):
    """The hardening moment: task tries, fails, retries, succeeds."""
    img = bg_frame(t, color2=(2, 3, 10))
    draw = ImageDraw.Draw(img, "RGBA")
    grid(draw, t, alpha=5)
    particles.draw(draw, t, am=0.3)
    
    p = ease(t / dur)
    
    phases = [
        (0.0, 0.15, "TASK CREATED", CYAN, 500),
        (0.15, 0.30, "ROUTING...", CYAN, 500),
        (0.30, 0.45, "EXECUTING...", GOLD, 500),
        (0.45, 0.55, "NO TOOLS EXECUTED", (255, 80, 80), 480),
        (0.55, 0.65, "FAILED", (255, 80, 80), 520),
        (0.65, 0.80, "VERIFYING...", GOLD, 500),
        (0.80, 0.90, "VERIFY: 0/2", (255, 200, 60), 480),
        (0.90, 1.0, "SYSTEM: NO HALLUCINATION", CYAN, 420),
    ]
    
    for start_p, end_p, text, color, y in phases:
        if p >= start_p:
            phase_p = ease(min(1, (p - start_p) / (end_p - start_p)))
            a = int(phase_p * 220)
            draw_center_text(draw, text, y, FONT_TITLE, (color[0], color[1], color[2], a))
    
    # Bottom message at the end
    if p > 0.85:
        fp = ease((p - 0.85) / 0.15)
        a = int(fp * 255)
        draw_center_text(draw, "The system knows what it did and did NOT do.", 700, FONT_SUB, (WHITE[0], WHITE[1], WHITE[2], a))
        draw_center_text(draw, "That is real intelligence.", 760, FONT_SUB, (GOLD[0], GOLD[1], GOLD[2], a))
    
    return img


def f_8_omega(t, dur):
    """OMEGA Kernel visualization."""
    img = bg_frame(t, color2=(2, 3, 10))
    draw = ImageDraw.Draw(img, "RGBA")
    grid(draw, t, alpha=6)
    particles_cyan.draw(draw, t, am=0.4)
    
    p = ease(t / dur)
    if p > 0.1:
        tp = ease((p - 0.1) / 0.5)
        draw_glow_text(draw, "OMEGA KERNEL", 100, FONT_BIG, GOLD)
    
    modules = [
        ("Task Queue", "9 states · Persistent · Survives restart", 160, 300),
        ("Event Bus", "Wildcards · Ring buffer · SSE · Socket.IO", 660, 300),
        ("Verifier", "Schema · Evidence · Invariants · PASS/FAIL/RETRY", 1160, 300),
    ]
    
    for title, desc, mx, my in modules:
        box_w, box_h = 500, 200
        x = mx - box_w // 2
        y = my
        delay = modules.index((title, desc, mx, my)) * 0.15
        mp = ease(max(0, min(1, (p - 0.2 - delay) / 0.5)))
        
        # Box
        a = int(30 + mp * 80)
        draw.rounded_rectangle([x, y, x + box_w, y + box_h], radius=12,
                              fill=(10, 12, 30, a), outline=(CYAN[0], CYAN[1], CYAN[2], a), width=2)
        
        ta = int(mp * 255)
        bbox = draw.textbbox((0, 0), title, font=FONT_SUB)
        tw = bbox[2] - bbox[0]
        draw.text((mx - tw // 2, y + 20), title, font=FONT_SUB, fill=(CYAN[0], CYAN[1], CYAN[2], ta))
        bbox = draw.textbbox((0, 0), desc, font=FONT_SM)
        tw2 = bbox[2] - bbox[0]
        draw.text((mx - tw2 // 2, y + 100), desc, font=FONT_SM, fill=(WHITE[0], WHITE[1], WHITE[2], ta))
    
    if p > 0.7:
        fp = ease((p - 0.7) / 0.3)
        a = int(fp * 255)
        draw_center_text(draw, "VAEC: IMPLEMENT → TEST → SYNC → BUILD → VERIFY → LEARN → PROMOTE", 780, FONT_SM, (GOLD[0], GOLD[1], GOLD[2], a))
    
    return img


def f_9_universe(t, dur):
    """Camera pulls back to reveal the VISERON universe."""
    img = bg_frame(t, color2=(2, 3, 10))
    draw = ImageDraw.Draw(img, "RGBA")
    particles.draw(draw, t, am=0.5)
    
    p = ease(t / dur)
    
    modules_names = ["AIOX Squad", "ARKOM", "Agents", "Memory", "Knowledge", "Game", "Cosmos", "Mobile", "Desktop"]
    n = len(modules_names)
    
    # Orbiting nodes that form a universe
    cx, cy = W // 2, H // 2
    orbit_r = 150 + p * 300
    orbit_count = n
    
    for i in range(orbit_count):
        angle = (t * 0.4 + i * 2 * math.pi / orbit_count) % (2 * math.pi)
        nx = int(cx + math.cos(angle) * orbit_r)
        ny = int(cy + math.sin(angle) * orbit_r)
        
        a = int(60 + p * 160)
        node(draw, nx, ny, 10, CYAN if i % 2 == 0 else GOLD, a)
        
        if p > 0.5:
            name = modules_names[i % n]
            bbox = draw.textbbox((0, 0), name, font=FONT_SM)
            tw = bbox[2] - bbox[0]
            draw.text((nx - tw // 2, ny + 20), name, font=FONT_SM,
                     fill=(WHITE[0], WHITE[1], WHITE[2], int(p * 200)))
    
    # Central VISERON pulse
    if p > 0.3:
        pulse_r = int(30 + pulse(t, 3) * 20)
        node(draw, cx, cy, pulse_r, GOLD, int(180 + pulse(t, 3) * 75))
    
    if p > 0.6:
        fp = ease((p - 0.6) / 0.4)
        a = int(fp * 255)
        draw_center_text(draw, "5.396 mentes  ·  1.997 skills  ·  6 squads", 850, FONT_SUB, (GOLD[0], GOLD[1], GOLD[2], a))
    
    return img


def f_10_closing(t, dur):
    """Finale: VISERON logo, Pedro + Trinnity names, URL."""
    img = bg_frame(t, color2=(2, 3, 10))
    draw = ImageDraw.Draw(img, "RGBA")
    particles.draw(draw, t, am=0.6)
    particles_cyan.draw(draw, t, am=0.4)
    
    p = ease(t / dur)
    
    # Title
    if p > 0.1:
        draw_glow_text(draw, "VISERON", 250, FONT_BIG, GOLD)
    
    if p > 0.3:
        tp = ease((p - 0.3) / 0.5)
        a = int(tp * 255)
        draw_center_text(draw, "Build. Think. Execute. Evolve.", 380, FONT_TITLE, (CYAN[0], CYAN[1], CYAN[2], a))
        draw_center_text(draw, "Construir. Pensar. Ejecutar. Evolucionar.", 450, FONT_SUB, (WHITE[0], WHITE[1], WHITE[2], a))
        draw_center_text(draw, "Construir. Pensar. Executar. Evoluir.", 500, FONT_SUB, (WHITE[0], WHITE[1], WHITE[2], a))
    
    if p > 0.5:
        tp2 = ease((p - 0.5) / 0.3)
        a = int(tp2 * 255)
        draw_center_text(draw, "Pedro Costa  ·  Founder & CEO", 620, FONT_TITLE, (GOLD[0], GOLD[1], GOLD[2], a))
        draw_center_text(draw, "Trinnity Hurtado  ·  Rainha", 690, FONT_SUB, (CYAN[0], CYAN[1], CYAN[2], a))
    
    if p > 0.7:
        tp3 = ease((p - 0.7) / 0.3)
        a = int(tp3 * 255)
        draw_center_text(draw, "www.trinnityviseronsystem.io", 800, FONT_SUB, (GOLD[0], GOLD[1], GOLD[2], a))
        draw_center_text(draw, "(c) 2026 Pedro Costa & Trinnity Hurtado. All rights reserved.", 880, FONT_SM, (WHITE[0], WHITE[1], WHITE[2], a))
    
    return img


# --- BUILD ---

def make_clip(scene_func, duration):
    """Generate a clip by rendering each frame."""
    def make_frame(t):
        img = scene_func(t, duration)
        if img.mode == "RGBA":
            return np.array(img.convert("RGB"))
        return np.array(img)
    
    return VideoClip(make_frame, duration=duration)


def build():
    print("Building VISERON cinematic film v2...")
    print(f"Output: {OUT}")
    
    scenes = [
        (f_0_dark, 4.0),
        (f_1_title, 5.0),
        (f_2_tagline, 7.0),
        (f_3_pedro, 6.0),
        (f_4_trinnity, 6.0),
        (f_5_converge, 7.0),
        (f_6_pipeline, 8.0),
        (f_7_hardening, 7.0),
        (f_8_omega, 7.0),
        (f_9_universe, 8.0),
        (f_10_closing, 8.0),
    ]
    
    clips = []
    for i, (func, dur) in enumerate(scenes):
        print(f"  Scene {i+1}/{len(scenes)} ({dur}s)...")
        clip = make_clip(func, dur)
        clip = clip.with_effects([vfx.FadeIn(0.3), vfx.FadeOut(0.3)])
        clips.append(clip)
    
    print("Compositing scenes...")
    final = concatenate_videoclips(clips, method="compose")
    
    # Subtle ambient audio track
    try:
        audio = AudioClip(
            lambda t: np.sin(2 * np.pi * 60 * t) * 0.02 * np.exp(-t * 0.05),
            duration=final.duration,
            fps=44100,
        ).with_volume(0.05)
        final = final.with_audio(audio)
    except:
        pass
    
    total_dur = sum(d for _, d in scenes)
    print(f"Rendering {total_dur:.0f}s video (this will take several minutes)...")
    final.write_videofile(
        OUT,
        fps=FPS,
        codec="libx264",
        bitrate="5000k",
        preset="medium",
        threads=4,
        logger=None,
    )
    
    print(f"\nVIDEO GENERATED: {OUT}")
    print(f"Duration: {total_dur:.0f}s")
    print("Done.")


if __name__ == "__main__":
    build()
