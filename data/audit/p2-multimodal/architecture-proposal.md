# VISERON P2 — Multimodal Architecture Proposal

## Current State
VISERON is TypeScript/Node.js with Ollama qwen2.5:3b for LLM. No GPU-intensive multimodal capabilities exist yet. The Creative Squad (5 agents) is defined but has no content generation runtime.

## Proposed Architecture

```
VISERON TypeScript Runtime (Node.js)
├── Creative Squad (agent_video, agent_3d, agent_design, agent_branding, agent_simulation)
│   └── SkillExecutor → Ollama (text prompts)
│       │
│       ├── Wan2.1 Subprocess Bridge (Python)
│       │   ├── Tool: tvs:wan-text-to-video
│       │   ├── Tool: tvs:wan-image-to-video  
│       │   ├── Tool: tvs:wan-video-edit
│       │   └── Tool: tvs:wan-text-to-image
│       │
│       └── ComfyUI REST Bridge (pending license review)
│           ├── Provider: comfyui (HTTP localhost:8188)
│           ├── Tool: tvs:comfy-generate (workflow JSON → output)
│           └── Tool: tvs:comfy-queue (async job management)
│
└── AV Integrations (future)
    ├── XTTS-v2 / ElevenLabs (TTS)
    ├── Whisper / Ollama (STT — already available)
    └── MuseTalk / SadTalker (avatar animation)
```

## Integration Priority
1. Wan2.1 subprocess bridge (P0 — Apache 2.0, no license issues)
2. ElevenLabs TTS API bridge (P1 — commercial, API key required)
3. ComfyUI REST bridge (P2 — requires GPL-3.0 legal review)

## Infrastructure Requirements
- GPU server (RTX 4090 or better) running alongside VISERON
- Python 3.10+ environment with PyTorch CUDA
- Model storage: 50-100GB for Wan2.1 + ComfyUI models
- Network: localhost only (no external calls for inference)
