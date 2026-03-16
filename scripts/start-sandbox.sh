#!/usr/bin/env bash
# ─── Sawa-X: Start local Canton sandbox + JSON API + UI ──────────────────────
# Prerequisites:
#   - daml SDK 2.10.3  (https://docs.daml.com/getting-started/installation.html)
#   - Node 20+
#   - Java 17+  (for Canton / JSON API)
#
# Usage:  bash scripts/start-sandbox.sh

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║          Sawa-X Canton Local Sandbox                 ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Build DAR ─────────────────────────────────────────────────────────
echo "▶  Building Daml DAR..."
daml build
echo "   DAR built → .daml/dist/sawa-x-1.0.0.dar"
mkdir -p target
cp .daml/dist/sawa-x-1.0.0.dar target/

# ── Step 2: Start Canton sandbox (background) ─────────────────────────────────
echo ""
echo "▶  Starting Canton sandbox (ledger-api :6865, admin-api :6866)..."
daml sandbox \
  --port 6865 \
  --dar target/sawa-x-1.0.0.dar &
SANDBOX_PID=$!
echo "   Canton PID: $SANDBOX_PID"

# Wait for sandbox
sleep 6

# ── Step 3: Start JSON API (background) ───────────────────────────────────────
echo ""
echo "▶  Starting Daml JSON API (:7575)..."
daml json-api \
  --ledger-host localhost \
  --ledger-port 6865 \
  --http-port 7575 \
  --allow-insecure-tokens &
JSON_PID=$!
echo "   JSON API PID: $JSON_PID"

sleep 3

# ── Step 4: Allocate parties ──────────────────────────────────────────────────
echo ""
echo "▶  Allocating sandbox parties..."
daml script \
  --dar target/sawa-x-1.0.0.dar \
  --script-name Test.Scenarios:setup \
  --ledger-host localhost \
  --ledger-port 6865 \
  --wall-clock-time && echo "   Parties allocated & scenario run ✓" || echo "   (script already ran or failed – continuing)"

# ── Step 5: Start UI ──────────────────────────────────────────────────────────
echo ""
echo "▶  Installing UI dependencies and starting dev server (:3000)..."
cd ui
npm install --silent
npm run dev &
UI_PID=$!
cd ..

echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✅  Sandbox running:"
echo "       Ledger API  : grpc://localhost:6865"
echo "       JSON API    : http://localhost:7575"
echo "       UI          : http://localhost:3000"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "══════════════════════════════════════════════════════"
echo ""

# Trap Ctrl+C → kill all background processes
trap "echo ''; echo 'Stopping...'; kill $SANDBOX_PID $JSON_PID $UI_PID 2>/dev/null; exit 0" INT TERM

wait
