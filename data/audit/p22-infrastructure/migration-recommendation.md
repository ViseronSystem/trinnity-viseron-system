# VISERON AI Infrastructure Migration Recommendation

## Executive Summary
Current machine (Intel i5-1235U, 8GB RAM, Intel iGPU) can ONLY run Ollama qwen2.5:3b in CPU mode.
All GPU workloads (Wan2.1, ComfyUI, SDXL, Flux, larger LLMs) are BLOCKED.

## Recommendation: BUY RTX 4090 + RENT RunPod as backup

### Why RTX 4090:
- **24GB VRAM** — runs Wan2.1 14B, Ollama 14B, SDXL, Flux, ComfyUI simultaneously
- **$1,600** — cheapest 24GB VRAM GPU. RTX 5090 is $2,000 for 32GB.
- **450W power** — ~$65/mo electricity at 24/7 operation
- **Proven** — most popular AI GPU. All frameworks work. Excellent driver support.

### Why NOT other GPUs:
- A6000 ($4,600): 48GB VRAM but slower than RTX 4090. Only if you need >24GB.
- H100 ($30,000): Data center GPU. Rent via RunPod ($2.49/hr) when needed.
- Cloud only: $317/mo for 24/7 RTX 4090 on RunPod. After 5 months you have paid for the GPU.

### What to buy (priority):
1. **RTX 4090 ($1,600)** — immediate. Unlocks all AI workloads.
2. **32GB+ RAM upgrade** — allows Ollama 14B + Wan2.1 to run simultaneously.
3. **1TB+ NVMe SSD** — model storage (Wan2.1 14B = 27GB, ComfyUI models = 50-200GB).

### What to rent:
- RunPod H100 ($2.49/hr) — only when training large models.
- RunPod RTX 4090 ($0.44/hr) — overflow/burst capacity.

### Estimated total investment:
- Minimum: $1,600 (RTX 4090) + $100 (RAM) + $100 (SSD) = ~$1,800
- Recommended: $2,000 (RTX 5090) + $200 (32GB RAM) + $200 (2TB SSD) = ~$2,400
- Monthly opex: $65 electricity + $0-200 cloud burst = $65-265/mo
