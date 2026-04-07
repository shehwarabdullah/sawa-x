#!/bin/bash
# Sawa-X — Start all services
# For WSL: run each step manually if this times out

cd "$(dirname "$0")/.."
echo "=== Sawa-X Startup ==="

# Kill old processes
fuser -k 6865/tcp 2>/dev/null
fuser -k 6868/tcp 2>/dev/null
fuser -k 7575/tcp 2>/dev/null
sleep 2

echo "[1/5] Starting Canton sandbox..."
daml sandbox --port 6865 &
SANDBOX_PID=$!
echo "  Waiting 30s for sandbox to start (PID: $SANDBOX_PID)..."
sleep 30

echo "[2/5] Starting JSON API..."
daml json-api --ledger-host localhost --ledger-port 6865 --http-port 7575 --allow-insecure-tokens &
JSON_PID=$!
sleep 5

echo "[3/5] Uploading DAR..."
daml ledger upload-dar .daml/dist/sawa-x-demo-0.0.1.dar --host localhost --port 6865
sleep 2

echo "[4/5] Running bootstrap script..."
daml script --dar .daml/dist/sawa-x-demo-0.0.1.dar --ledger-host localhost --ledger-port 6865 --script-name Test.Bootstrap:setup

echo "[5/5] Starting backend..."
cd backend && npm install --silent && node server.js &
cd ..

echo ""
echo "=== All services started ==="
echo "  Sandbox:   PID $SANDBOX_PID (port 6865)"
echo "  JSON API:  PID $JSON_PID (port 7575)"
echo "  Backend:   port 3001"
echo ""
echo "  Now run in another terminal:"
echo "    cd ui && npm install && npm run dev"
echo ""
echo "  Open: http://localhost:3000"
wait
