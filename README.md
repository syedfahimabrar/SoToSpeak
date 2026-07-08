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

## Docker Compose

Runs the whole stack (backend + nginx-served frontend) and keeps it up.
**Requires an NVIDIA GPU** on the host with the modern `docker compose` (v2) and
the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

```bash
cp .env.example .env          # optional: set model / revision
docker compose up -d --build  # build and run in the background
docker compose logs -f        # follow logs (first run downloads model weights)
```

Open **http://localhost:8080** — the frontend serves the UI and reverse-proxies
`/api` (including the SSE progress stream) to the backend, so it's same-origin
with no CORS setup. Model weights and generated audio persist in named volumes
(`model-cache`, `audio-data`), so restarts don't re-download. Stop with
`docker compose down` (volumes are kept).

Verify the GPU is in use:
```bash
docker compose exec backend python -c "import torch; print(torch.cuda.is_available())"  # True
curl -s localhost:8080/api/health                                                        # "device":"cuda"
```

The backend image installs a **CUDA 11.8** Torch, which runs on any NVIDIA driver
≥ 450 (CUDA 11.x) via minor-version compatibility — so it works on older drivers
(e.g. driver 465 / CUDA 11.3) without a host driver update. On a newer driver you
can build for a newer CUDA with `--build-arg TORCH_CUDA=cu121` (or `cu124`):

```bash
docker compose build --build-arg TORCH_CUDA=cu121 backend
```

An 8 GB GPU is ample for the 0.6B model.

### Model version

The backend pulls **`k2-fsa/OmniVoice`** (0.6B params) pinned to revision
`SOTOSPEAK_MODEL_REVISION` so every host runs identical weights. Override the id
or revision in `.env`.

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
| NVIDIA GPU server | `cuda` | The deployment target. Fast (RTF ~0.025). |
| Apple Silicon (local dev) | `mps` | Works out of the box. ~10–40 s/sample — keep grids modest and `num_step` low. |

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
