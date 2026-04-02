#!/bin/bash
set -e

echo "Starting Acervo TV Web Server..."
export NODE_ENV=production
export PORT=${PORT:-3000}

echo "PORT is set to: $PORT"
echo "NODE_ENV is: $NODE_ENV"

# Start the server
node dist/index.js
