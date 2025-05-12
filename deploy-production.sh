#!/bin/bash
# Optimized Production Deployment Script

echo "Starting optimized production deployment process..."

# Set environment variables
export NODE_ENV=production

# Step 1: Run the environment check
echo "Checking environment variables..."
node production-env-check.js
if [ $? -ne 0 ]; then
  echo "❌ Environment check failed. Please fix the issues before deploying."
  exit 1
fi
echo "✅ Environment check passed"

# Step 2: Fix the build path issue
echo "Fixing build paths..."
node fix-build-path.js
if [ $? -ne 0 ]; then
  echo "❌ Build path fix failed. Please check the logs."
  exit 1
fi
echo "✅ Build path fix completed"

# Step 3: Run the build optimization script
echo "Running build optimizations..."
node optimize-build.js
if [ $? -ne 0 ]; then
  echo "❌ Build optimization failed. Please check the logs."
  exit 1
fi
echo "✅ Build optimizations completed"

# Step 4: Create additional polyfills for production
echo "Creating production polyfills..."
mkdir -p src/lib
cat > src/lib/polyfills.js << EOF
// Production polyfills to ensure compatibility
console.log("Polyfills loaded for Web3Auth compatibility");

// Buffer polyfill for crypto operations
if (typeof window !== "undefined" && typeof window.Buffer === "undefined") {
  window.Buffer = require("buffer").Buffer;
}

// Make sure global is defined
if (typeof window !== "undefined" && typeof window.global === "undefined") {
  window.global = window;
}
EOF
echo "✅ Production polyfills created"

echo "Deployment preparation complete!"
echo ""
echo "To deploy to production:"
echo "1. Click the 'Deploy' button in the Replit UI"
echo "2. Monitor the deployment logs for any issues"
echo "3. Once deployed, verify cpxtbmining.com is working correctly"