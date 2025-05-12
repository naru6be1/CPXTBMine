#!/bin/bash
# Optimized production build script

echo "Starting optimized production build process..."

# Set production environment for consistent behavior
export NODE_ENV=production 

# Clear previous build files if they exist
echo "Cleaning previous build artifacts..."
rm -rf dist || true
rm -rf build || true

# First build the client side with optimization flags
echo "Building client-side with Vite (optimized)..."
npx vite build --minify --mode production

# Then build the server-side with optimized flags
echo "Building server-side with esbuild (optimized)..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --minify --outdir=dist

echo "Build completed successfully!"