import asyncio
import edge_tts
import subprocess
import os

FFMPEG = r"C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
FFPROBE = FFMPEG.replace("ffmpeg.exe", "ffprobe.exe")
BASE = r"C:\Users\Administrator\trinnity-viseron-system\data\hackathon"
AUDIO_DIR = os.path.join(BASE, "audio3d")
os.makedirs(AUDIO_DIR, exist_ok=True)

# NARRACIÓN EN ESPAÑOL — (start_seconds, text)
SCRIPT = [
    (0,  "Bienvenidos al Trinnity Viseron System. Sistema operativo de inteligencia artificial para organizaciones autónomas. Construido para el hackathon All Things Agentic."),
    (5,  "Los frameworks empresariales de agentes hoy obligan a elegir. Desplegar agentes individuales sin infraestructura compartida. O construir orquestación personalizada desde cero. Ninguna opción funciona a escala."),
    (11, "TVS resuelve esto con el OMEGA Kernel. Un runtime personalizado con bus de eventos, cola de tareas, permisos y verificación. Diez agentes autónomos se coordinan mediante enrutamiento por temas con comodines."),
    (17, "Diez agentes, cada uno con roles distintos y memoria aislada. CEO para estrategia. CTO para arquitectura. Developer para código. Finance para análisis. Sales para leads. Security para ciberseguridad. Research para conocimiento. Support para clientes. Vision para multimedia. Y DevOps para operaciones."),
    (23, "Las tareas fluyen a través de un pipeline de nueve estados. Creado. Planificación. Cola. Ejecución. Verificación. Completado. Cada resultado es verificado antes de la promoción. El EventBus dispara eventos en tiempo real."),
    (29, "Cuatro capas de memoria que sobreviven reinicios. Memoria a corto plazo para sesiones. Memoria a largo plazo con almacenamiento persistente. Base de conocimiento con búsqueda de texto completo. Y embeddings vectoriales para recuperación semántica."),
    (34, "Nueve principios éticos implementados como código. Sabiduría, verdad, mayordomía, justicia, servicio, diligencia, humildad, generosidad y fidelidad. El sistema no puede mentir, filtrar secretos o cometer fraude."),
    (39, "El pipeline de evolución VAEC asegura una promoción segura. Implementar. Probar. Sincronizar. Compilar. Verificar. Promocionar. Cualquier fallo activa una reversión automática. Cada puerta es auditable."),
    (44, "Trinnity Viseron System. Sistema operativo de inteligencia artificial para organizaciones autónomas. Construido por Pedro Costa y Trinnity Hurtado. Construyamos el futuro de la IA autónoma.")
]

async def main():
    print("Generando narración en español...")

    segments = []
    for i, (start, text) in enumerate(SCRIPT):
        out = os.path.join(AUDIO_DIR, f"seg_{i:02d}.mp3")
        print(f"  Segmento {i+1}/{len(SCRIPT)}: {text[:50]}...")
        comm = edge_tts.Communicate(text, voice="es-MX-DaliaNeural", rate="-5%")
        await comm.save(out)
        segments.append((start, out))

    # Get durations
    seg_info = []
    for start, filepath in segments:
        r = subprocess.run([FFPROBE, "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", filepath], capture_output=True, text=True)
        dur = float(r.stdout.strip())
        seg_info.append((start, filepath, dur))
        print(f"  Start={start}s, Dur={dur:.1f}s")

    # Build ffmpeg mix
    total = 50
    inputs = ["-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono:d={total}"]
    filters = ["[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono[silence]"]

    for i, (start, filepath, dur) in enumerate(seg_info):
        inputs.extend(["-i", filepath])
        delay_ms = int(start * 1000)
        filters.append(f"[{i+1}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono,adelay={delay_ms}|{delay_ms}[seg{i}]")

    mix = "[silence]" + "".join(f"[seg{i}]" for i in range(len(seg_info)))
    filters.append(f"{mix}amix=inputs={len(seg_info)+1}:duration=first:dropout_transition=0,volume={len(seg_info)+1}[out]")

    output = os.path.join(BASE, "narration-es.mp3")
    cmd = [FFMPEG, "-y"] + inputs + ["-filter_complex", ";".join(filters), "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", output]
    subprocess.run(cmd, capture_output=True, text=True)

    r = subprocess.run([FFPROBE, "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", output], capture_output=True, text=True)
    print(f"\nNarración: {output} ({float(r.stdout.strip()):.1f}s)")

asyncio.run(main())
