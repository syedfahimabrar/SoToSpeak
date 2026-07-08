"""Thin wrapper around the OmniVoice model.

Loads the model once (lazy singleton) and exposes a single ``synthesize`` call
that turns one set of parameters into a 24 kHz waveform. All the grid / axis
expansion logic lives in ``jobs.py``; this module only knows how to make sound.
"""
from __future__ import annotations

import threading
from typing import Any, Optional

import numpy as np

from . import config

# Sampler parameters that OmniVoice reads from its generation config. Anything
# in this set is forwarded as a keyword argument to ``generate``.
SAMPLER_PARAMS = {
    "num_step",
    "guidance_scale",
    "t_shift",
    "layer_penalty_factor",
    "position_temperature",
    "class_temperature",
    "denoise",
}

# Params OmniVoice requires as ints (they drive torch.linspace step counts etc.).
# JSON/pydantic may hand these to us as floats, so coerce before forwarding.
_INT_SAMPLER_PARAMS = {"num_step"}

_model: Any = None
_lock = threading.Lock()


def get_model() -> Any:
    """Load the OmniVoice model on first use and cache it."""
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                from omnivoice import OmniVoice

                model = OmniVoice.from_pretrained(config.OMNIVOICE_MODEL)
                model = model.to(config.DEVICE).eval()
                _model = model
    return _model


def synthesize(
    text: str,
    *,
    language: Optional[str] = None,
    instruct: Optional[str] = None,
    ref_audio: Optional[str] = None,
    ref_text: Optional[str] = None,
    speed: Optional[float] = None,
    sampler: Optional[dict[str, Any]] = None,
) -> np.ndarray:
    """Generate a single utterance and return a float32 waveform at 24 kHz.

    ``sampler`` may carry any of :data:`SAMPLER_PARAMS`; unknown keys are dropped
    so callers can pass a superset without error.
    """
    model = get_model()

    kwargs: dict[str, Any] = {}
    if language:
        kwargs["language"] = language
    if instruct:
        kwargs["instruct"] = instruct
    if ref_audio:
        kwargs["ref_audio"] = ref_audio
        if ref_text:
            kwargs["ref_text"] = ref_text
    if speed is not None:
        kwargs["speed"] = float(speed)
    if sampler:
        for key, value in sampler.items():
            if key in SAMPLER_PARAMS and value is not None:
                kwargs[key] = int(round(value)) if key in _INT_SAMPLER_PARAMS else value

    import torch

    with torch.no_grad():
        outputs = model.generate(text, **kwargs)

    audio = outputs[0] if isinstance(outputs, (list, tuple)) else outputs
    return np.asarray(audio, dtype=np.float32)
