# VISERON AI Infrastructure Architecture Plan

## Current State (REAL)
- Laptop: Intel i5-1235U (10C/12T), 8GB RAM, Intel UHD iGPU (NO CUDA)
- Ollama qwen2.5:3b running on CPU (1.9GB RAM)
- Wan2.1: BLOCKED (no GPU)
- ComfyUI: BLOCKED (no GPU)
- 1/5 workloads REAL, 1/5 PARTIAL, 3/5 BLOCKED

## Target Architecture (RECOMMENDED)

```
LOCAL (Daily Work)                 CLOUD (Burst/Training)
+---------------------+            +-----------------------+
| RTX 4090 24GB       |            | RunPod RTX 4090       |
| Ollama (3B/7B/14B)  |<--- VPN -->| or A6000/H100         |
| Wan2.1 (1.3B/14B)   |            | Multi-GPU training    |
| ComfyUI (all models) |            | Backup compute        |
| VISERON Server       |            | Model storage         |
+---------------------+            +-----------------------+
```

## Monthly Costs
| Mode | Cost | Description |
|------|------|-------------|
| Local Only | $198/mo | RTX 4090 + electricity. All workloads locally. |
| Hybrid | $250-400/mo | Local RTX 4090 + cloud burst ($50-200). |
| Cloud Only | $105-317/mo | RunPod RTX 4090. No hardware purchase. |

## Migration Timeline
- WEEK 1: Rent RunPod RTX 4090. Install Ollama + Wan2.1 + ComfyUI. Test workloads.
- WEEK 2: If usage > 8hr/day, order RTX 4090. Install with desktop or eGPU.
- WEEK 3: Hybrid: local GPU for daily work, cloud for burst/training.
- WEEK 4: Production: local RTX 4090 24/7. RunPod backup. VISERON orchestrates.
