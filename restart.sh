#!/bin/bash
echo "Starting Canton sandbox..."
daml sandbox --port 6865 --dar target/sawa-x-1.0.0.dar &
sleep 8
echo "Running setup script..."
daml script \
  --dar target/sawa-x-1.0.0.dar \
  --script-name Test.Scenarios:setup \
  --ledger-host localhost \
  --ledger-port 6865 \
  --wall-clock-time
echo "Starting JSON API..."
daml json-api \
  --ledger-host localhost \
  --ledger-port 6865 \
  --http-port 7575 \
  --allow-insecure-tokens
