"""Automatic quality scoring with UTMOS.

Replaces the original project's fine-tuned wav2vec MOS predictor. UTMOS takes a
16 kHz waveform and returns a predicted mean-opinion-score (~1..5) which the
frontend maps to a green->red cell colour.
"""
from __future__ import annotations

import threading
from typing import Any

import numpy as np

from . import config

_predictor: Any = None
_lock = threading.Lock()


def get_predictor() -> Any:
    global _predictor
    if _predictor is None:
        with _lock:
            if _predictor is None:
                import torch

                model = torch.hub.load(
                    "tarepan/SpeechMOS", "utmos22_strong", trust_repo=True
                )
                _predictor = model.to(config.effective_device()).eval()
    return _predictor


def score(audio: np.ndarray, sample_rate: int = config.SAMPLE_RATE) -> float:
    """Return the predicted MOS for a single waveform."""
    import torch
    import torchaudio.functional as AF

    predictor = get_predictor()
    wav = torch.as_tensor(np.asarray(audio, dtype=np.float32))
    if wav.ndim == 1:
        wav = wav.unsqueeze(0)
    wav = wav.to(config.effective_device())

    if sample_rate != config.UTMOS_SAMPLE_RATE:
        wav = AF.resample(wav, sample_rate, config.UTMOS_SAMPLE_RATE)

    with torch.no_grad():
        out = predictor(wav, config.UTMOS_SAMPLE_RATE)

    return float(np.asarray(out.detach().cpu()).reshape(-1)[0])
