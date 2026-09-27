#!/bin/sh
# SymbiEat preview / single-process production server.
# Serves the REST API + socket.io + the built client from client/dist.
cd "$(dirname "$0")/.."
export PORT="${PORT:-3000}"
exec node server/src/index.js
