"""So-to-Speak 2.0 FastAPI app."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config, vocab
from .routers import audio, jobs

app = FastAPI(title="So-to-Speak 2.0", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(audio.router)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "device": config.DEVICE, "model": config.OMNIVOICE_MODEL}


@app.get("/api/vocab")
async def get_vocab() -> dict[str, object]:
    """Instruct vocabulary + axis presets for the frontend."""
    return {
        "genders": vocab.GENDERS,
        "pitch_levels": vocab.PITCH_LEVELS,
        "age_levels": vocab.AGE_LEVELS,
        "accents": vocab.ACCENTS,
        "styles": vocab.STYLES,
        "instruct_axis_presets": vocab.INSTRUCT_AXIS_PRESETS,
        "params": vocab.PARAM_META,
    }
