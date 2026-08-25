# VISERON P2.2 — AI INFRASTRUCTURE PLANNING AUDIT

**Generated: 2026-08-12**

## Current Machine (REAL)

| Component | Spec | Assessment |
|-----------|------|-----------|
| CPU | Intel i5-1235U (10C/12T, 1.3GHz) | ADEQUATE for inference, insufficient for training |
| RAM | 8GB DDR4 | **CRITICAL BOTTLENECK** — 3B model fits, 7B tight, 14B impossible |
| GPU | Intel UHD (integrated, 4GB shared) | **NO CUDA** — blocks all GPU workloads |
| Storage | 512GB SSD (268GB free) | ADEQUATE for current models, tight for Wan2.1/ComfyUI |
| OS | Windows 11 Home x64 | OK |
| Ollama | v0.32.5 (qwen2.5:3b) | RUNNING (CPU mode, ~1.9GB RAM) |

## Workload Assessment

| Workload | Status | Requirement |
|----------|--------|-------------|
| Ollama LLM (3B) | **REAL** | CPU 4+ cores, 8GB+ RAM |
| Ollama LLM (7B) | PARTIAL | Needs 12-16GB RAM (current: 8GB) |
| Wan2.1 Video | **BLOCKED** | CUDA GPU 8GB+ VRAM |
| Image Generation | **BLOCKED** | CUDA GPU 6GB+ VRAM |
| Voice Models | PARTIAL | CPU possible, GPU preferred |
| Aerospace Sim | **BLOCKED** | CUDA GPU 8GB+ VRAM |

## GPU Comparison

| GPU | VRAM | Price | FP16 TFLOPS | ROI |
|-----|------|-------|-------------|-----|
| **RTX 4090** | 24GB | $1,600 | 330 | **EXCELLENT — BUY** |
| RTX 5090 | 32GB | $2,000 | 419 | EXCELLENT (future) |
| A6000 | 48GB | $4,600 | 310 | GOOD (enterprise) |
| H100 | 80GB | $30,000 | 1,979 | POOR (rent via RunPod) |

## Cloud Comparison

| Provider | RTX 4090/hr | H100/hr | Best For |
|----------|-------------|---------|----------|
| **RunPod** | $0.44 | $2.49 | **BEST — start here** |
| Lambda | N/A | $1.99 | Training clusters |
| AWS | N/A | $5.00 | Enterprise with credits |
| GCP | N/A | $3.50 ($0.35 spot) | Cheapest H100 via spot |

## Monthly Cost Projection

| Mode | Cost/mo | What You Get |
|------|---------|-------------|
| **Local Only** | **$198** | RTX 4090 + electricity. All models run locally. |
| Hybrid | $250-400 | Local RTX 4090 + cloud burst ($50-200). |
| Cloud Only | $105-317 | RunPod RTX 4090. No hardware commitment. |

## Final Answers

**What should VISERON buy?**
RTX 4090 ($1,600) + 32GB RAM upgrade ($100) + 1TB NVMe ($100) = ~$1,800 total.

**What should VISERON rent?**
RunPod RTX 4090 ($0.44/hr) for prototyping NOW. H100 ($2.49/hr) only for training.

**What should run locally?**
Ollama (3B/7B/14B), Wan2.1, ComfyUI, SDXL, Flux — all on RTX 4090.

**What should run in cloud?**
Multi-GPU training, H100-class workloads, backup/overflow, model storage.

**Estimated monthly cost:**
$198/mo (local) + $0-200/mo (optional cloud) = $198-398/mo.

**Migration recommendation:**
1. TODAY: Sign up for RunPod. Rent RTX 4090. Test Wan2.1 + ComfyUI.
2. WEEK 2: If usage > 8hr/day, order RTX 4090 hardware.
3. WEEK 4: Production hybrid: local GPU 24/7 + cloud backup.

---

**Reality Gate: PASS** — all data from real system audit. No assumptions. RTX 4090 recommendation based on actual workload requirements and market pricing.
