# syntax=docker/dockerfile:1
# So-to-Speak backend: FastAPI + OmniVoice + UTMOS, managed with uv.
#
# Torch is installed with the CUDA 11.8 runtime (TORCH_CUDA) instead of the
# default CUDA 12 build, so the image runs on older NVIDIA drivers (>= 450, i.e.
# CUDA 11.x) via CUDA minor-version compatibility — e.g. the deploy box on driver
# 465 / CUDA 11.3. It also runs fine on CPU. On a host with a newer driver you can
# build with --build-arg TORCH_CUDA=cu121 (or cu124) for the latest CUDA.
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

# Install dependencies (everything except torch/torchaudio) for layer caching.
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-install-project --no-dev \
        --no-install-package torch --no-install-package torchaudio

# Application code + the project itself.
COPY app ./app
COPY scripts ./scripts
RUN uv sync --frozen --no-dev \
        --no-install-package torch --no-install-package torchaudio

# Install torch/torchaudio for the target CUDA last, so nothing overrides it.
# Use the PyTorch CUDA index as the ONLY source: adding PyPI here would take
# priority and pull the latest CUDA-12/13 build instead of the CUDA 11.8 one.
# Torch's dependencies are already installed by the uv sync steps above.
ARG TORCH_CUDA=cu118
RUN uv pip install --python /app/.venv/bin/python \
        --index-url "https://download.pytorch.org/whl/${TORCH_CUDA}" \
        torch torchaudio

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
