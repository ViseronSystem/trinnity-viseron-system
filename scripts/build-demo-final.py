import asyncio
import edge_tts
import subprocess
import os
import json

FFMPEG = r"C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
FFPROBE = FFMPEG.replace("ffmpeg.exe", "ffprobe.exe")
BASE = r"C:\Users\Administrator\trinnity-viseron-system\data\hackathon"
AUDIO_DIR = os.path.join(BASE, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Narration: (start_seconds, text)
SCRIPT = [
    (0,  "Welcome to the Trinnity Viseron System. A multi-agent AI operating system. Built for the All Things Agentic Hackathon."),
    (4,  "Enterprise agent frameworks today force a difficult choice. Deploy individual agents with no shared infrastructure. Or build custom orchestration from scratch. Neither option works at scale."),
    (9,  "TVS solves this with the OMEGA Kernel. A custom runtime with event bus, task queue, permissions, and verification. Ten autonomous agents coordinate through wildcard topic routing."),
    (14, "Ten agents, each with distinct roles and isolated memory. CEO for strategy. CTO for architecture. Developer for code. Finance for analysis. Sales for leads. Security for cyber defense. Research for knowledge. Support for customers. Vision for media. And DevOps for operations."),
    (20, "Tasks flow through a nine-state pipeline. Created. Planning. Queued. Running. Verifying. Completed. Every result is verified before promotion. The EventBus fires real-time events across all agents."),
    (25, "Four-layer memory that survives restarts. Short-term for sessions. Long-term with persistent storage. Knowledge base with full-text search. And vector embeddings for semantic retrieval across all 5000 agents."),
    (30, "Nine ethical principles enforced as code. Wisdom, truth, stewardship, justice, service, diligence, humility, generosity, and faithfulness. The system cannot lie, leak secrets, or commit fraud."),
    (34, "The VAEC evolution pipeline ensures safe promotion. Implement. Test. Sync. Build. Verify. Promote. Any failure triggers automatic rollback. Every gate is auditable."),
    (38, "Trinnity Viseron System. AI Operating System for Autonomous Organizations. Built by Pedro Costa and Trinnity Hurtado. Let us build the future of autonomous AI."),
]

async def generate_segments():
    """Generate each TTS segment."""
    segments = []
    for i, (start, text) in enumerate(SCRIPT):
        out = os.path.join(AUDIO_DIR, f"seg_{i:02d}.mp3")
        print(f"  Generating segment {i+1}/{len(SCRIPT)}: {text[:50]}...")
        comm = edge_tts.Communicate(text, voice="en-US-GuyNeural", rate="-5%", pitch="+0Hz")
        await comm.save(out)
        segments.append((start, out))
    return segments

def get_duration(filepath):
    """Get audio duration in seconds."""
    result = subprocess.run(
        [FFPROBE, "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", filepath],
        capture_output=True, text=True
    )
    return float(result.stdout.strip())

def build_audio(segments):
    """Build final narration with proper timing."""
    print("\nBuilding audio timeline...")
    
    # Get durations
    seg_durations = []
    for start, filepath in segments:
        dur = get_duration(filepath)
        seg_durations.append((start, filepath, dur))
        print(f"  Segment: start={start}s, duration={dur:.1f}s")
    
    # Build ffmpeg filter to place each segment at its start time
    # Strategy: create silence for total duration, then overlay each segment
    total_duration = 42  # seconds
    
    inputs = []
    filter_parts = []
    
    # First input: silence bed
    inputs.extend(["-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono:d={total_duration}"])
    filter_parts.append(f"[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono[silence]")
    
    # Add each segment as input
    for i, (start, filepath, dur) in enumerate(seg_durations):
        inputs.extend(["-i", filepath])
        filter_parts.append(f"[{i+1}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono,adelay={int(start*1000)}|{int(start*1000)}[seg{i}]")
    
    # Mix all segments onto silence
    mix_inputs = "[silence]" + "".join(f"[seg{i}]" for i in range(len(seg_durations)))
    filter_parts.append(f"{mix_inputs}amix=inputs={len(seg_durations)+1}:duration=first:dropout_transition=0,volume={len(seg_durations)+1}[out]")
    
    filter_complex = ";".join(filter_parts)
    
    output = os.path.join(BASE, "narration.mp3")
    
    cmd = [FFMPEG, "-y"] + inputs + [
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "192k",
        output
    ]
    
    print(f"\nRunning ffmpeg...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"FFmpeg error: {result.stderr[-500:]}")
        return None
    
    dur = get_duration(output)
    print(f"Narration created: {output} ({dur:.1f}s)")
    return output

def combine_video_audio(video_path, audio_path):
    """Combine demo video with narration audio."""
    output = os.path.join(BASE, "tvs-hackathon-demo-final.mp4")
    
    cmd = [
        FFMPEG, "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        output
    ]
    
    print(f"\nCombining video + audio...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr[-500:]}")
        return None
    
    dur = get_duration(output)
    size = os.path.getsize(output)
    print(f"\nFinal video: {output}")
    print(f"Duration: {dur:.1f}s | Size: {size/1024/1024:.1f}MB")
    return output

async def main():
    print("=" * 60)
    print("TVM HACKATHON DEMO - Audio + Video Builder")
    print("=" * 60)
    
    # Step 1: Generate TTS segments
    print("\n[1/3] Generating TTS narration...")
    segments = await generate_segments()
    
    # Step 2: Build timeline audio
    print("\n[2/3] Building narration timeline...")
    narration = build_audio(segments)
    if not narration:
        print("Failed to build narration")
        return
    
    # Step 3: Combine with existing video
    video_path = os.path.join(BASE, "tvs-hackathon-demo.mp4")
    if os.path.exists(video_path):
        print("\n[3/3] Combining with video...")
        combine_video_audio(video_path, narration)
    else:
        print(f"\nVideo not found at {video_path}")
        print("Only narration audio was generated.")
    
    print("\n" + "=" * 60)
    print("DONE")

asyncio.run(main())
