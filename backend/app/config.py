"""Runtime configuration for the So-to-Speak backend.

Everything device-related is a single knob so the same code runs on this Mac
(``mps``), a CUDA GPU server, or CPU. Override via environment variables.
"""
from __future__ import annotations

import os
from pathlib import Path


def _default_device() -> str:
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return "mps"
    except Exception:
        pass
    return "cpu"


# Device for both OmniVoice and UTMOS: cuda | mps | cpu
DEVICE: str = os.environ.get("SOTOSPEAK_DEVICE", _default_device())

# Hugging Face model id (or a local path) for the OmniVoice checkpoint.
OMNIVOICE_MODEL: str = os.environ.get("SOTOSPEAK_MODEL", "k2-fsa/OmniVoice")

# OmniVoice always outputs 24 kHz mono audio.
SAMPLE_RATE: int = 24000

# UTMOS expects 16 kHz input.
UTMOS_SAMPLE_RATE: int = 16000

# Where generated wavs and uploaded reference clips live.
DATA_DIR: Path = Path(os.environ.get("SOTOSPEAK_DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
AUDIO_DIR: Path = DATA_DIR / "audio"
REF_DIR: Path = DATA_DIR / "refs"

# Allowed CORS origins for the Vite dev server.
CORS_ORIGINS: list[str] = os.environ.get(
    "SOTOSPEAK_CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

for _d in (DATA_DIR, AUDIO_DIR, REF_DIR):
    _d.mkdir(parents=True, exist_ok=True)
