import asyncio, edge_tts, subprocess, os

FF = r"C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
FFP = FF.replace("ffmpeg.exe","ffprobe.exe")
BASE = r"C:\Users\Administrator\trinnity-viseron-system\data\hackathon"
AD = os.path.join(BASE,"audio-real"); os.makedirs(AD, exist_ok=True)

# Each line: (start_sec, end_sec, text) — non-overlapping, filling the 53s video
LINES = [
  (0, 5, "Bienvenidos al Trinnity Viseron System. Sistema operativo de inteligencia artificial para organizaciones autónomas. Versión siete punto cero."),
  (5, 9, "Estado del sistema. Todo operacional. Base de datos Postgres conectada. Facturación Avirato activa. Sistema de mensajería listo."),
  (9, 14, "System of Truth. Cinco mil novecientas noventa y dos tareas ejecutadas. Trescientos setenta y cuatro tests pasando. TypeScript limpio, sin errores."),
  (14, 19, "VISERON activo. Superinteligencia con supervisión del squad AIOX. Gobernanza bíblica con nueve principios éticos implementados como código."),
  (19, 23, "OMEGA Kernel. Cinco mil ochocientas ochenta y cuatro tareas verificadas. Pipeline de ejecución end to end con verificación automática."),
  (23, 27, "Router de inteligencia artificial. Gemini tres punto seis flash. Ollama local. OpenAI, Claude y Grok disponibles."),
  (27, 31, "ATLAS. Tutor de inglés personalizado con voz. Plan de siete días. Corrección inmediata en español y portugués."),
  (31, 35, "RCS. Canal de mensajería de marca con Twilio. Envío de mensajes con logo de la empresa."),
  (35, 39, "Agency OS. Cuatro agentes de inteligencia artificial para marketing digital. Reporting, leads, creativos y nurturing."),
  (39, 43, "Composio. Integración con diecinueve aplicaciones externas. Gmail, Slack, GitHub, calendario y más."),
  (43, 48, "Gobernanza bíblica. Nueve principios éticos como código ejecutable. Sabiduría, verdad, mayordomía, justicia, servicio, diligencia, humildad, generosidad y fidelidad."),
  (48, 53, "Trinnity Viseron System. Construido por Pedro Costa, comandante, y Trinnity Hurtado, reina. Sistema operativo de inteligencia autónoma."),
]

async def main():
  print("Generando segments...")
  segs = []
  for i,(start,end,text) in enumerate(LINES):
    out = os.path.join(AD, f"seg_{i:02d}.mp3")
    print(f"  {i+1}/12: {text[:50]}...")
    c = edge_tts.Communicate(text, voice="es-MX-DaliaNeural", rate="-8%")
    await c.save(out)
    r = subprocess.run([FFP,"-v","quiet","-show_entries","format=duration","-of","csv=p=0",out], capture_output=True, text=True)
    dur = float(r.stdout.strip())
    segs.append((start, out, dur))
    print(f"    start={start}s, dur={dur:.1f}s, target_end={end}s")

  # Build: each segment padded to fill its time slot exactly
  print("\nBuilding timeline...")
  inputs = ["-f","lavfi","-i",f"anullsrc=r=44100:cl=mono:d=53"]
  filters = ["[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono[silence]"]

  for i,(start,fpath,dur) in enumerate(segs):
    inputs.extend(["-i",fpath])
    delay_ms = int(start*1000)
    filters.append(f"[{i+1}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono,adelay={delay_ms}|{delay_ms}[s{i}]")

  mix = "[silence]" + "".join(f"[s{i}]" for i in range(len(segs)))
  filters.append(f"{mix}amix=inputs={len(segs)+1}:duration=first:dropout_transition=0,volume={len(segs)+1}[out]")

  out = os.path.join(BASE,"narration-real.mp3")
  cmd = [FF,"-y"]+inputs+["-filter_complex",";".join(filters),"-map","[out]","-c:a","libmp3lame","-b:a","192k",out]
  subprocess.run(cmd, capture_output=True, text=True)
  r = subprocess.run([FFP,"-v","quiet","-show_entries","format=duration","-of","csv=p=0",out], capture_output=True, text=True)
  print(f"Narration: {out} ({float(r.stdout.strip()):.1f}s)")

asyncio.run(main())
