"""
VISERON CINEMATIC VIDEO GENERATOR
Resolucao: 1920x1080 @ 24fps
Trilingue: ES/PT/EN (legendas)
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import *
import os, textwrap

# ─── CONFIG ─────────────────────────────────────────────────
W, H = 1920, 1080
FPS = 24
BASE = r"C:\Trinnity-Viseron-System"
OUT = os.path.join(BASE, "data", "videos", "VISERON_Cinematic.mp4")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# Assets
LOGO = os.path.join(BASE, "mobile", "assets", "icon.png")
DIAGRAM = os.path.join(BASE, "docs", "TVS_Diagrama_Operacao.png")
VSR = os.path.join(BASE, "src", "dashboard", "public", "cosmos", "img", "vsr.png")
TRIN = os.path.join(BASE, "src", "dashboard", "public", "cosmos", "img", "trin.png")
CYBERPUNK = os.path.join(BASE, "data", "images", "cyberpunk_1920x1080_seed514447.jpg")

# Colors
DARK = (8, 8, 22)
GOLD = (240, 192, 64)
WHITE = (220, 220, 245)
CYAN = (64, 224, 208)
DIM = (100, 100, 140)

# Fonts (Windows system)
try:
    FONT_TITLE = ImageFont.truetype("segoeuib.ttf", 64)
    FONT_SUB = ImageFont.truetype("segoeuib.ttf", 36)
    FONT_SMALL = ImageFont.truetype("segoeuil.ttf", 24)
    FONT_BIG = ImageFont.truetype("segoeuib.ttf", 80)
except:
    FONT_TITLE = ImageFont.load_default()
    FONT_SUB = ImageFont.load_default()
    FONT_SMALL = ImageFont.load_default()
    FONT_BIG = ImageFont.load_default()


def bg_image(color=DARK):
    """Create a solid background image."""
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    arr[:, :] = color
    return Image.fromarray(arr)


def gradient_bg(top_color=(8, 8, 26), bottom_color=(2, 2, 10)):
    """Vertical gradient background."""
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(H):
        t = y / H
        r = int(top_color[0] * (1 - t) + bottom_color[0] * t)
        g = int(top_color[1] * (1 - t) + bottom_color[1] * t)
        b = int(top_color[2] * (1 - t) + bottom_color[2] * t)
        arr[y, :] = [r, g, b]
    return Image.fromarray(arr)


def grid_lines(draw, step=80, alpha=30):
    """Draw subtle grid lines."""
    for x in range(0, W, step):
        draw.line([(x, 0), (x, H)], fill=(GOLD[0], GOLD[1], GOLD[2], alpha), width=1)
    for y in range(0, H, step):
        draw.line([(0, y), (W, y)], fill=(GOLD[0], GOLD[1], GOLD[2], alpha), width=1)


def draw_centered_text(draw, text, y, font=FONT_TITLE, color=WHITE):
    """Draw horizontally centered text."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    draw.text((x, y), text, font=font, fill=color)


def draw_multiline_centered(draw, lines, start_y, font=FONT_TITLE, color=WHITE, spacing=10):
    """Draw multiple lines of centered text."""
    y = start_y
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (W - tw) // 2
        draw.text((x, y), line, font=font, fill=color)
        y += th + spacing


def draw_box(draw, x, y, w, h, fill_color=(20, 20, 50), outline_color=GOLD, text="", font=FONT_SMALL, text_color=WHITE):
    """Draw a rounded box with optional text."""
    draw.rounded_rectangle([x, y, x + w, y + h], radius=10, fill=fill_color, outline=outline_color, width=2)
    if text:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = x + (w - tw) // 2
        ty = y + (h - th) // 2
        draw.text((tx, ty), text, font=font, fill=text_color)


def pil_to_clip(img, duration=3, fade_in=0.5, fade_out=0.5):
    """Convert PIL image to moviepy clip with optional fades."""
    arr = np.array(img)
    clip = ImageClip(arr, duration=duration)
    if fade_in:
        clip = clip.with_effects([vfx.FadeIn(fade_in)])
    if fade_out:
        clip = clip.with_effects([vfx.FadeOut(fade_out)])
    return clip


def make_scene(duration, draw_func, fade_in=0.5, fade_out=0.5):
    """Create a scene clip from a drawing function."""
    img = gradient_bg()
    draw = ImageDraw.Draw(img, "RGBA")
    grid_lines(draw, step=100, alpha=10)
    draw_func(draw)
    return pil_to_clip(img, duration, fade_in, fade_out)


# ─── SCENE BUILDERS ───────────────────────────────

def scene_0_intro(draw):
    """Opening: pure dark with small logo appearing."""
    pass  # minimal - just grid


def scene_1_title(draw):
    """TRINNITY VISERON SYSTEM - main title."""
    draw_centered_text(draw, "TRINNITY", 280, FONT_BIG, GOLD)
    draw_centered_text(draw, "VISERON SYSTEM", 370, FONT_BIG, GOLD)
    draw_centered_text(draw, "v5.0", 460, FONT_SUB, DIM)
    # Subtitle
    draw_centered_text(draw, "Pedro Costa · Comandante  |  Trinnity Hurtado · Rainha", 560, FONT_SMALL, DIM)


def scene_2_tagline(draw):
    """MORE THAN AI. AN INTELLIGENCE SYSTEM."""
    draw_centered_text(draw, "MORE THAN AI.", 300, FONT_BIG, CYAN)
    draw_centered_text(draw, "AN INTELLIGENCE SYSTEM.", 400, FONT_BIG, CYAN)
    # Trilingue subtitle
    draw_centered_text(draw, "MÁS QUE IA. UN SISTEMA DE INTELIGENCIA.", 550, FONT_SMALL, DIM)
    draw_centered_text(draw, "MAIS QUE IA. UM SISTEMA DE INTELIGÊNCIA.", 590, FONT_SMALL, DIM)


def scene_3_pipeline(draw):
    """The Real User Vertical Slice pipeline."""
    title = "REAL USER VERTICAL SLICE"
    draw_centered_text(draw, title, 80, FONT_TITLE, GOLD)
    
    # Pipeline boxes
    steps = ["USER", "WORKSPACE", "PROJECT", "TASK", "ROUTER", "VISERON\nBUILDER", "EXECUTION", "VERIFY", "MEMORY", "RESULT"]
    box_w, box_h = 140, 60
    total_w = len(steps) * (box_w + 10) - 10
    start_x = (W - total_w) // 2
    y = 300
    
    colors_cycle = [
        ((15, 15, 40), CYAN),     # USER
        ((15, 15, 40), CYAN),     # WORKSPACE
        ((15, 15, 40), CYAN),     # PROJECT
        ((15, 15, 40), CYAN),     # TASK
        ((15, 15, 40), GOLD),     # ROUTER
        ((40, 20, 10), GOLD),     # BUILDER
        ((15, 40, 20), (100, 255, 100)),  # EXECUTION
        ((15, 40, 20), (100, 255, 100)),  # VERIFY
        ((30, 15, 40), (200, 120, 255)),  # MEMORY
        ((15, 40, 20), (100, 255, 100)),  # RESULT
    ]
    
    for i, step in enumerate(steps):
        x = start_x + i * (box_w + 10)
        fill_c, outline_c = colors_cycle[i]
        draw_box(draw, x, y, box_w, box_h, fill_c, outline_c, step, FONT_SMALL, WHITE)
        # Arrow between boxes
        if i < len(steps) - 1:
            ax = x + box_w + 3
            ay = y + box_h // 2
            draw.line([(ax - 2, ay - 3), (ax + 2, ay), (ax - 2, ay + 3)], fill=GOLD, width=2)
    
    # Agent → Tool → Verify highlight
    draw_centered_text(draw, "AGENT  →  TOOL  →  VERIFY", 480, FONT_SUB, CYAN)
    draw_centered_text(draw, "0 verified executions = 0 success. No hallucinations allowed.", 550, FONT_SMALL, DIM)


def scene_4_omega(draw):
    """OMEGA Kernel."""
    draw_centered_text(draw, "OMEGA KERNEL", 80, FONT_TITLE, GOLD)
    
    modules = [
        ("Task Queue", "9 states: CREATED → COMPLETED\nPersistent, survives restart", 200, 380),
        ("Event Bus", "Wildcards, filters, ring buffer\nSSE + Socket.IO bridge", 680, 380),
        ("Verifier", "Schema, evidence, invariants\nPASS | FAIL | RETRY | HUMAN", 1160, 380),
    ]
    
    for title, desc, x, y in modules:
        draw_box(draw, x, y, 440, 180, (15, 15, 40), CYAN)
        draw_centered_text(draw, title, y + 20, FONT_SUB, CYAN)
        # Manually draw multiline description
        lines = desc.split("\n")
        ly = y + 80
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=FONT_SMALL)
            tw = bbox[2] - bbox[0]
            lx = x + (440 - tw) // 2
            draw.text((lx, ly), line, font=FONT_SMALL, fill=DIM)
            ly += 28
    
    # Bottom: Execution OS
    draw_centered_text(draw, "EXECUTION OS — E2E Task Execution with Real Verification", 640, FONT_SUB, CYAN)
    draw_centered_text(draw, "Tools execute. Verifier validates. Memory persists. Nothing is invented.", 700, FONT_SMALL, DIM)
    
    # VAEC line
    draw_centered_text(draw, "VAEC: IMPLEMENT → TEST → SYNC → BUILD → VERIFY → LEARN → PROMOTE", 780, FONT_SMALL, GOLD)


def scene_5_memory(draw):
    """Memory & Knowledge."""
    draw_centered_text(draw, "MEMORY & KNOWLEDGE", 80, FONT_TITLE, GOLD)
    
    items = [
        ("Knowledge Graph", "Graphify: 4.278 nos, 8.275 arestas\nGod nodes + community detection"),
        ("Vector Memory", "Embedding-based semantic search\nLong-term memory never forgets"),
        ("Audit Trail", "Every operation logged (JSONL)\njarvis-memory + viseron-supervision"),
    ]
    
    for i, (title, desc) in enumerate(items):
        x = 160 + i * 560
        y = 280
        draw_box(draw, x, y, 480, 220, (15, 15, 40), CYAN)
        draw_centered_text(draw, title, y + 20, FONT_SUB, CYAN)
        lines = desc.split("\n")
        ly = y + 80
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=FONT_SMALL)
            tw = bbox[2] - bbox[0]
            lx = x + (480 - tw) // 2
            draw.text((lx, ly), line, font=FONT_SMALL, fill=DIM)
            ly += 28
    
    draw_centered_text(draw, "The system learns from every execution. The graph grows. The memory deepens.", 620, FONT_SMALL, DIM)


def scene_6_agents(draw):
    """Agents ecosystem."""
    draw_centered_text(draw, "AGENTS ECOSYSTEM", 80, FONT_TITLE, GOLD)
    
    squads = [
        ("AIOX Squad (5)", "Autonomous supervision\nAudits every VISERON operation"),
        ("ARKOM", "Operational audit\nCompliance & security"),
        ("10 Nuclear Agents", "CEO · Planner · Researcher\nEngineer · Operator · Finance\nSales · Security · Verifier\nEvolution"),
        ("Specialized", "ATLAS (English tutor)\nAgency OS (marketing)\nBusiness agents"),
    ]
    
    for i, (title, desc) in enumerate(squads):
        x = 80 + (i % 2) * 900
        y = 240 + (i // 2) * 240
        draw_box(draw, x, y, 840, 200, (15, 15, 40), CYAN)
        bbox = draw.textbbox((0, 0), title, font=FONT_SUB)
        tw = bbox[2] - bbox[0]
        draw.text((x + 30, y + 20), title, font=FONT_SUB, fill=CYAN)
        lines = desc.split("\n")
        ly = y + 75
        for line in lines:
            draw.text((x + 30, ly), line, font=FONT_SMALL, fill=DIM)
            ly += 25
    
    draw_centered_text(draw, "5.396 mentes · 1.997 skills · 6 squads · 67 tests · 374 OMEGA tests", 760, FONT_SMALL, GOLD)


def scene_7_multiplatform(draw):
    """Multi-platform: Web + Mobile + Desktop."""
    draw_centered_text(draw, "MULTI-PLATFORM", 80, FONT_TITLE, GOLD)
    
    platforms = [
        ("WEB", "Dashboard · VISERON HUD · ATLAS\nWorkspace · Command Center\nCosmos · Metaverse · Game"),
        ("MOBILE (APK)", "Android APK real\nExpo + React Native\nVISERON Game · Derecho"),
        ("DESKTOP", "TVS OS Desktop\nElectron shell\nWindows native"),
    ]
    
    for i, (title, desc) in enumerate(platforms):
        x = 120 + i * 600
        y = 240
        draw_box(draw, x, y, 520, 300, (15, 15, 40), CYAN)
        draw_centered_text(draw, title, y + 20, FONT_SUB, CYAN)
        lines = desc.split("\n")
        ly = y + 80
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=FONT_SMALL)
            tw = bbox[2] - bbox[0]
            lx = x + (520 - tw) // 2
            draw.text((lx, ly), line, font=FONT_SMALL, fill=DIM)
            ly += 32
    
    draw_centered_text(draw, "One system. Every screen.", 640, FONT_SUB, WHITE)
    draw_centered_text(draw, "trinnityviseronsystem.io  ·  Android APK  ·  Windows Desktop", 720, FONT_SMALL, GOLD)


def scene_8_commerce(draw):
    """Revenue & Commerce."""
    draw_centered_text(draw, "REVENUE READY", 80, FONT_TITLE, GOLD)
    
    items = [
        ("Billing", "Plans: Core $29 · Pro $99 · Enterprise $499\nAvirato (primary) · Stripe (alt)\nWebhook HMAC verified"),
        ("Email", "Gmail OAuth real\nVerify · Reset · Invoice\nAgent auto-reply"),
        ("Messaging", "E2E encrypted (X25519 + AES-256-GCM)\nDirect · Groups · Read status\nContacts management"),
        ("RCS Brand", "Twilio Programmable Messaging\nBrand logo + fallback SMS/MMS\n45k telecom contacts imported"),
    ]
    
    for i, (title, desc) in enumerate(items):
        x = 80 + (i % 2) * 900
        y = 240 + (i // 2) * 240
        draw_box(draw, x, y, 840, 200, (15, 15, 40), CYAN)
        bbox = draw.textbbox((0, 0), title, font=FONT_SUB)
        draw.text((x + 30, y + 20), title, font=FONT_SUB, fill=CYAN)
        lines = desc.split("\n")
        ly = y + 75
        for line in lines:
            draw.text((x + 30, ly), line, font=FONT_SMALL, fill=DIM)
            ly += 25
    
    draw_centered_text(draw, "6/6 revenue readiness · Postgres Neon live · 18 tenants", 770, FONT_SMALL, GOLD)


def scene_9_cosmos(draw):
    """Viseron Cosmos: $VSR + $TRIN."""
    draw_centered_text(draw, "VISERON COSMOS", 80, FONT_TITLE, GOLD)
    
    # $VSR
    draw_box(draw, 200, 260, 680, 350, (30, 20, 15), GOLD)
    draw_centered_text(draw, "$VSR  VISERON CROWN", 290, FONT_SUB, GOLD)
    vsr_lines = [
        "300,000,000 supply",
        "Governance token (ERC20Votes)",
        "1% burn + 1% treasury per transfer",
        "Anti-whale 3%",
        "Proof of Mandate (PoM) for AIOX agents",
        "Solana mainnet: 7oR3jd...tvGQU",
    ]
    ly = 360
    for line in vsr_lines:
        bbox = draw.textbbox((0, 0), line, font=FONT_SMALL)
        tw = bbox[2] - bbox[0]
        draw.text((620 - tw // 2, ly), line, font=FONT_SMALL, fill=WHITE)
        ly += 30
    
    # $TRIN
    draw_box(draw, 1040, 260, 680, 350, (20, 15, 30), CYAN)
    draw_centered_text(draw, "$TRIN  TRINNITY", 290, FONT_SUB, CYAN)
    trin_lines = [
        "420,690,000 supply (420.69M)",
        "Interplanetary travel currency",
        "2% burn per transfer",
        "Anti-bot 0.5%",
        "Pre-launch lock",
        "Solana mainnet: Co7Neu...zyQBx",
    ]
    ly = 360
    for line in trin_lines:
        bbox = draw.textbbox((0, 0), line, font=FONT_SMALL)
        tw = bbox[2] - bbox[0]
        draw.text((1460 - tw // 2, ly), line, font=FONT_SMALL, fill=WHITE)
        ly += 30
    
    draw_centered_text(draw, "Ethereum · BSC · Solana  |  Phantom wallet  |  Coming to DEX", 700, FONT_SUB, GOLD)
    draw_centered_text(draw, "© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)", 780, FONT_SMALL, DIM)


def scene_10_vision(draw):
    """Future Vision."""
    draw_centered_text(draw, "THE VISION", 80, FONT_TITLE, GOLD)
    
    vision_items = [
        ("AI Operating System", "for Autonomous Organizations"),
        ("Enterprise Autonomy", "Reduce 60% of admin work"),
        ("OMEGA Aerospace", "AI + Physical Infrastructure"),
        ("Robotics & Energy", "The real-world OS"),
        ("5,000+ AI Minds", "One unified intelligence"),
    ]
    
    y = 260
    for title, desc in vision_items:
        draw_centered_text(draw, title, y, FONT_SUB, CYAN)
        draw_centered_text(draw, desc, y + 45, FONT_SMALL, DIM)
        y += 110
    
    draw_centered_text(draw, "GOVERNED BY 9 BIBLICAL PRINCIPLES", 830, FONT_SUB, GOLD)
    draw_centered_text(draw, "Wisdom · Truth · Stewardship · Justice · Service · Diligence · Humility · Generosity · Faithfulness", 880, FONT_SMALL, DIM)


def scene_11_closing(draw):
    """Closing."""
    draw_centered_text(draw, "VISERON", 300, FONT_BIG, GOLD)
    draw_centered_text(draw, "Build. Think. Execute. Evolve.", 420, FONT_TITLE, CYAN)
    draw_centered_text(draw, "Construir. Pensar. Ejecutar. Evolucionar.", 510, FONT_SMALL, DIM)
    draw_centered_text(draw, "Construir. Pensar. Executar. Evoluir.", 550, FONT_SMALL, DIM)
    draw_centered_text(draw, "www.trinnityviseronsystem.io", 700, FONT_SUB, GOLD)
    draw_centered_text(draw, "GitHub: PedroCostaTrinnity/Trinnity-Viseron-System", 780, FONT_SMALL, DIM)
    draw_centered_text(draw, "© 2026 Pedro Costa & Trinnity Hurtado. All rights reserved.", 860, FONT_SMALL, DIM)


# ─── BUILD VIDEO ───────────────────────────────

def build_video():
    print("Building VISERON cinematic video...")
    print(f"Output: {OUT}")
    print(f"Resolution: {W}x{H} @ {FPS}fps")
    
    clips = []
    
    # Scene timing: [duration, fade_in, fade_out]
    scenes_config = [
        (2.5, scene_0_intro),        # 0: intro dark
        (4.0, scene_1_title),        # 1: title
        (4.0, scene_2_tagline),      # 2: tagline
        (6.0, scene_3_pipeline),     # 3: pipeline
        (6.0, scene_4_omega),        # 4: OMEGA
        (5.0, scene_5_memory),       # 5: memory
        (5.5, scene_6_agents),       # 6: agents
        (5.5, scene_7_multiplatform),# 7: multi-platform
        (5.5, scene_8_commerce),     # 8: revenue
        (6.0, scene_9_cosmos),       # 9: cosmos
        (5.5, scene_10_vision),      # 10: vision
        (5.0, scene_11_closing),     # 11: closing
    ]
    
    for i, (dur, scene_func) in enumerate(scenes_config):
        print(f"  Scene {i+1}/{len(scenes_config)} ({dur}s)...")
        clip = make_scene(dur, scene_func, fade_in=0.4, fade_out=0.4)
        clips.append(clip)
    
    # Try to add background music / ambiance (optional)
    # We'll create a silent audio track for consistency
    try:
        audio_clip = AudioClip(
            lambda t: np.sin(2 * np.pi * 80 * t) * 0.03 * np.exp(-t * 0.1),
            duration=sum(s[0] for s in scenes_config),
            fps=44100,
        ).with_volume(0.08)
    except:
        audio_clip = None
    
    # Composite all clips
    print("Compositing...")
    final = concatenate_videoclips(clips, method="compose")
    
    if audio_clip:
        final = final.with_audio(audio_clip)
    
    # Write video file
    print("Rendering video (this may take a few minutes)...")
    final.write_videofile(
        OUT,
        fps=FPS,
        codec="libx264",
        bitrate="4000k",
        audio_codec="aac" if audio_clip else None,
        preset="medium",
        threads=4,
        logger=None,
    )
    
    print(f"\nVIDEO GENERATED: {OUT}")
    print(f"Duration: {sum(s[0] for s in scenes_config):.1f}s")
    print("Done.")


if __name__ == "__main__":
    build_video()
