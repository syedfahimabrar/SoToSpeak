# So-to-Speak 2.0

An interactive explorer for a TTS model's control space. Type a sentence,
sweep two (or three) generation parameters, and get a grid of synthesized
samples — each one playable and colored by an automatic quality score. Inspired
by the Interspeech 2023 [So-to-Speak](#legacy) demo, rebuilt on
[OmniVoice](https://github.com/k2-fsa/OmniVoice) with a React + shadcn frontend.

![grid concept: rows × columns of colored, clickable audio cells]

## What it does

- **Synthesis** — OmniVoice (0.6B, zero-shot, 600+ languages). Three voice modes:
  - **Auto** — model picks a voice
  - **Design** — describe the voice with attribute tokens (gender, age, accent…)
  - **Clone** — upload a reference clip + transcript
- **Quality scoring** — every sample is rated by [UTMOS](https://github.com/tarepan/SpeechMOS); cells are colored green (better) → red (worse), preserving the original demo's signature heatmap.
- **Configurable grid** — assign any parameter to the X and Y axes (speed, guidance scale, sampling temperatures, diffusion steps, or a voice-description attribute like pitch), plus an optional third axis exposed as a slider between grids. Defaults: X = speed 0.8–1.2 (5 steps), Y = pitch levels (5 steps).

## Layout

```
backend/    FastAPI + OmniVoice + UTMOS   (uv project)
frontend/   React + Vite + TS + Tailwind + shadcn/ui
legacy/     the original Tacotron2/HiFi-GAN demo, kept for reference
```

## Prerequisites

- Python ≥ 3.10 and [uv](https://docs.astral.sh/uv/)
- Node.js ≥ 20.19 (or ≥ 22.12) — note: the frontend is pinned to Vite 5, which also runs on Node 20.12
- ~4 GB free disk for model weights (OmniVoice ≈ 3.3 GB, UTMOS ≈ 0.4 GB), downloaded on first run

## Quick start

```bash
./install.sh    # installs backend (uv) and frontend (npm) dependencies
./run.sh        # starts both servers; open http://localhost:5173
```

`run.sh` launches the backend on `:8000` and the frontend on `:5173` and stops
both on Ctrl-C. The sections below cover manual setup and configuration.

## Backend

```bash
cd backend
uv sync                       # create .venv and install deps
uv run python scripts/smoke.py   # optional: verify OmniVoice + UTMOS work
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Device

The backend auto-selects a device; override with `SOTOSPEAK_DEVICE`:

| Machine | Setting | Notes |
|---|---|---|
| Apple Silicon (this Mac) | `mps` | Works out of the box. ~10–40 s/sample — keep grids modest and `num_step` low. |
| NVIDIA GPU server | `cuda` | Much faster (RTF ~0.025). |
| No GPU | `cpu` | Slow; fine for a couple of samples. |

```bash
SOTOSPEAK_DEVICE=cuda uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Other env vars: `SOTOSPEAK_MODEL` (default `k2-fsa/OmniVoice`),
`SOTOSPEAK_DATA_DIR`, `SOTOSPEAK_CORS_ORIGINS`.

## Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` to `http://127.0.0.1:8000`, so run the backend
alongside it. To point at a remote backend instead, set `VITE_API_BASE`
(e.g. `VITE_API_BASE=http://gpu-box:8000 npm run dev`) and make sure that
origin is in `SOTOSPEAK_CORS_ORIGINS` on the backend.

## Using it

1. Enter a sentence.
2. Pick a voice mode (Auto / Design / Clone).
3. Configure the grid axes (defaults give a speed × pitch grid).
4. Click **Generate**. Progress streams live; cells fill in and are colored by score.
5. Click any cell to play it; the player shows its parameters and MOS.
6. With a third axis set, use the slider to move between grids.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | device + model info |
| GET | `/api/vocab` | instruct vocabulary + axis presets |
| POST | `/api/reference-audio` | upload a clone reference → `ref_id` |
| POST | `/api/jobs` | start a grid job → `job_id` |
| GET | `/api/jobs/{id}` | job status + results |
| GET | `/api/jobs/{id}/events` | SSE progress stream |
| GET | `/api/audio/{job}/{i}.wav` | generated audio |

## Legacy

The original So-to-Speak (Tacotron2 + HiFi-GAN + wav2vec MOS, driven from a
Jupyter notebook) lives in `legacy/` and is not used by the new app.
