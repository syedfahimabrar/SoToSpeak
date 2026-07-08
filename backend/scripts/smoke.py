"""Smoke test: prove OmniVoice + UTMOS work on this machine before any API code.

Run from the backend/ directory:
    uv run python scripts/smoke.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config, engine, scoring  # noqa: E402

OUT = config.DATA_DIR / "smoke"
OUT.mkdir(parents=True, exist_ok=True)

TEXT = "The weather is really lovely today, isn't it?"


def run(name: str, **kwargs) -> None:
    t0 = time.time()
    audio = engine.synthesize(TEXT, **kwargs)
    dt = time.time() - t0
    dur = len(audio) / config.SAMPLE_RATE
    mos = scoring.score(audio)
    path = OUT / f"{name}.wav"
    sf.write(path, audio, config.SAMPLE_RATE)
    rtf = dt / dur if dur else float("nan")
    print(f"[{name}] {dt:.1f}s  dur={dur:.2f}s  rtf={rtf:.3f}  mos={mos:.2f}  -> {path}")


def main() -> None:
    print(f"device={config.DEVICE}  model={config.OMNIVOICE_MODEL}")
    print("Loading model (first run downloads ~3.3 GB)...")
    engine.get_model()
    scoring.get_predictor()
    print("Loaded. Generating samples...\n")

    run("auto")
    run("design_low", instruct="female, british accent, very low pitch")
    run("design_high", instruct="female, british accent, very high pitch")
    run("fast", instruct="male, young adult", speed=1.2)
    run("slow_hi_guidance", speed=0.85, sampler={"guidance_scale": 3.0, "num_step": 24})

    print("\nSmoke test complete.")


if __name__ == "__main__":
    main()
