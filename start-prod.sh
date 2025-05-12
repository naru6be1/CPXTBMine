#!/bin/bash
# Optimized production start script

echo "Starting application in production mode..."

# Ensure we're in production mode
export NODE_ENV=production

# Start the optimized production build
node dist/index.js