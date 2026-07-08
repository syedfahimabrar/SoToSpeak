"""Audio endpoints: upload a reference clip for cloning, serve generated wavs."""
from __future__ import annotations

import uuid

import soundfile as sf
from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse

from .. import config

router = APIRouter(prefix="/api", tags=["audio"])


@router.post("/reference-audio")
async def upload_reference(file: UploadFile) -> dict[str, str]:
    """Store an uploaded reference clip, normalized to 24 kHz mono wav."""
    ref_id = uuid.uuid4().hex[:12]
    raw_path = config.REF_DIR / f"{ref_id}_raw"
    with raw_path.open("wb") as f:
        f.write(await file.read())

    try:
        audio, sr = sf.read(str(raw_path), dtype="float32")
    except Exception as exc:
        raw_path.unlink(missing_ok=True)
        raise HTTPException(400, f"could not read audio: {exc}") from exc

    if audio.ndim > 1:  # downmix to mono
        audio = audio.mean(axis=1)

    wav_path = config.REF_DIR / f"{ref_id}.wav"
    sf.write(str(wav_path), audio, sr)
    raw_path.unlink(missing_ok=True)
    return {"ref_id": ref_id}


@router.get("/audio/{job_id}/{name}")
async def get_audio(job_id: str, name: str) -> FileResponse:
    path = config.AUDIO_DIR / job_id / name
    if not path.is_file() or ".." in job_id or ".." in name:
        raise HTTPException(404, "audio not found")
    return FileResponse(str(path), media_type="audio/wav")
