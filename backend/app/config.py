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


def resolve_device(requested: str) -> str:
    """Validate the requested device, falling back to CPU with a warning.

    Keeps the server usable when SOTOSPEAK_DEVICE=cuda but the container can't
    see an NVIDIA GPU (missing driver / not passed through), instead of crashing.
    """
    try:
        import torch

        if requested == "cuda" and not torch.cuda.is_available():
            print(
                "[sotospeak] SOTOSPEAK_DEVICE=cuda but no CUDA GPU is visible "
                "(driver missing or GPU not passed to the container); using CPU.",
                flush=True,
            )
            return "cpu"
        if requested == "mps" and not (
            getattr(torch.backends, "mps", None) and torch.backends.mps.is_available()
        ):
            print("[sotospeak] mps requested but unavailable; using CPU.", flush=True)
            return "cpu"
    except Exception:
        pass
    return requested


# Device for both OmniVoice and UTMOS: cuda | mps | cpu
DEVICE: str = os.environ.get("SOTOSPEAK_DEVICE", _default_device())

_effective_device: str | None = None


def effective_device() -> str:
    """The device actually used (DEVICE, or CPU if that device is unavailable)."""
    global _effective_device
    if _effective_device is None:
        _effective_device = resolve_device(DEVICE)
    return _effective_device

# Hugging Face model id (or a local path) for the OmniVoice checkpoint.
OMNIVOICE_MODEL: str = os.environ.get("SOTOSPEAK_MODEL", "k2-fsa/OmniVoice")

# Optional exact revision (commit/tag/branch) so a server pulls the same weights.
# Empty -> latest on the model's default branch.
OMNIVOICE_REVISION: str | None = os.environ.get("SOTOSPEAK_MODEL_REVISION") or None

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
