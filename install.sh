#!/usr/bin/env bash
# One-click installer for So-to-Speak 2.0.
# Installs the Python backend (via uv) and the React frontend (via npm).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
die()  { printf "  \033[31m✗\033[0m %s\n" "$1" >&2; exit 1; }

bold "So-to-Speak 2.0 — install"

# --- prerequisites ---------------------------------------------------------
command -v uv  >/dev/null 2>&1 || die "uv not found. Install it: https://docs.astral.sh/uv/getting-started/installation/"
ok "uv $(uv --version | awk '{print $2}')"

command -v node >/dev/null 2>&1 || die "Node.js not found. Install Node 20.19+ (or 22.12+): https://nodejs.org"
ok "node $(node --version)"

command -v npm  >/dev/null 2>&1 || die "npm not found (ships with Node.js)."
ok "npm $(npm --version)"

# --- backend ---------------------------------------------------------------
bold "Backend (OmniVoice + UTMOS)"
( cd backend && uv sync )
ok "Python environment ready (backend/.venv)"

# --- frontend --------------------------------------------------------------
bold "Frontend (React + Vite)"
( cd frontend && npm install )
ok "Node modules installed (frontend/node_modules)"

# --- done ------------------------------------------------------------------
bold "Done."
cat <<'EOF'

Start everything with:

    ./run.sh

Or run the two servers manually:

    cd backend  && uv run uvicorn app.main:app --port 8000
    cd frontend && npm run dev            # http://localhost:5173

The first generation downloads model weights (~3.3 GB OmniVoice + ~0.4 GB UTMOS).
On Apple Silicon set the device with SOTOSPEAK_DEVICE=mps (auto-detected by default).
EOF
