# VISERON P2 — Multimodal ROI Ranking

| # | Technology | ROI | Readiness | License | GPU | Effort | Verdict |
|---|-----------|-----|-----------|---------|-----|--------|---------|
| 1 | **Wan2.1** | HIGH | PARTIAL | Apache 2.0 ✓ | Yes | 2-3d | **INTEGRATE** — subprocess bridge |
| 2 | **ElevenLabs TTS** | HIGH | NOT AUDITED | Commercial | No | 1d | **EVALUATE** — API key needed |
| 3 | **XTTS-v2** | MEDIUM | NOT AUDITED | CPML | Yes | 3d | **EVALUATE** — local TTS alternative |
| 4 | **MuseTalk** | MEDIUM | NOT AUDITED | MIT | Yes | 3d | **EVALUATE** — avatar animation |
| 5 | **ComfyUI** | VERY HIGH | BLOCKED | GPL-3.0 ✗ | Yes | 1d tech + legal | **LEGAL REVIEW** — license risk |
| 6 | **DuixAvatar** | UNKNOWN | BLOCKED | Unknown | ? | ? | **VERIFY URL** — 404 |
| 7 | **VoiceStudio** | UNKNOWN | BLOCKED | Unknown | ? | ? | **VERIFY URL** — 404 |
| 8 | **Handy** | UNKNOWN | BLOCKED | Unknown | ? | ? | **VERIFY URL** — 404 |

## Recommendations

### Immediate (this sprint)
1. Build Wan2.1 subprocess bridge for Creative Squad
2. Register Wan2.1 as Tool in ToolManager
3. Create SkillContracts for video generation skills

### Near-term (next sprint)
4. Legal review of ComfyUI GPL-3.0 license
5. Evaluate ElevenLabs API for TTS
6. Verify URLs for DuixAvatar, VoiceStudio, Handy

### Strategic
7. Deploy dedicated GPU server for multimodal workloads
8. Integrate ComfyUI REST bridge (if license resolved)
9. Build end-to-end creative production pipeline
