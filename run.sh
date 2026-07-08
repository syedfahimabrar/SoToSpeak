#!/usr/bin/env bash
# Start the So-to-Speak backend and frontend together.
# Ctrl-C stops both.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

BACKEND_PORT="${BACKEND_PORT:-8000}"

if [ ! -d backend/.venv ] || [ ! -d frontend/node_modules ]; then
  echo "Dependencies missing. Run ./install.sh first." >&2
  exit 1
fi

cleanup() { kill 0 2>/dev/null || true; }
trap cleanup EXIT INT TERM

echo "Starting backend on http://127.0.0.1:${BACKEND_PORT} ..."
( cd backend && uv run uvicorn app.main:app --host 127.0.0.1 --port "${BACKEND_PORT}" ) &

echo "Starting frontend on http://localhost:5173 ..."
( cd frontend && npm run dev ) &

wait
