# syntax=docker/dockerfile:1
# So-to-Speak backend: FastAPI + OmniVoice + UTMOS, managed with uv.
# Runs on CPU by default; on an NVIDIA host with the container toolkit it uses
# the GPU when SOTOSPEAK_DEVICE=cuda (the PyPI torch wheel already ships CUDA).
FROM python:3.12-slim

# uv (fast, reproducible installs) from the official image.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Native libs for soundfile / librosa / pydub.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libsndfile1 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    HF_HOME=/cache/huggingface \
    TORCH_HOME=/cache/torch \
    SOTOSPEAK_DATA_DIR=/data \
    PATH="/app/.venv/bin:$PATH"

# Install dependencies first for better layer caching.
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-install-project --no-dev

# Then the application code.
COPY app ./app
COPY scripts ./scripts
RUN uv sync --frozen --no-dev

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
