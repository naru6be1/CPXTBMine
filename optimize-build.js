/**
 * Optimize Build
 * 
 * This script creates an optimized build configuration for production deployment.
 * It modifies various files as needed to improve build performance.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting build optimization...');

try {
  // Ensure production mode
  process.env.NODE_ENV = 'production';
  console.log('Set NODE_ENV to:', process.env.NODE_ENV);

  // Create optimized client/src/lib/polyfills.js with reduced imports
  const polyfillsPath = path.join(__dirname, 'client', 'src', 'lib', 'polyfills.js');
  if (fs.existsSync(polyfillsPath)) {
    console.log(`Optimizing ${polyfillsPath}`);
    const optimizedPolyfills = `// Optimized polyfills for production
console.log("Optimized polyfills loaded");

// Buffer polyfill for crypto operations
if (typeof window !== "undefined" && typeof window.Buffer === "undefined") {
  window.Buffer = require("buffer").Buffer;
}

// Make sure global is defined
if (typeof window !== "undefined" && typeof window.global === "undefined") {
  window.global = window;
}

// Process polyfill
if (typeof window !== "undefined" && typeof window.process === "undefined") {
  window.process = { env: { NODE_ENV: "production" } };
}
`;
    fs.writeFileSync(polyfillsPath, optimizedPolyfills);
    console.log('✅ Optimized polyfills.js');
  }

  // Create temporary vite configuration for production build
  const tempViteConfigPath = path.join(__dirname, 'temp-vite.config.js');
  const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
    }
  },
  root: path.resolve(__dirname),
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-label'],
          blockchain: ['viem', 'wagmi', '@web3auth/modal', '@web3auth/base']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@web3auth/modal']
  },
  server: {
    fs: {
      strict: false
    }
  }
});
`;
  fs.writeFileSync(tempViteConfigPath, viteConfig);
  console.log('✅ Created temporary Vite config for production build');

  // Create or update .env file to ensure production settings
  const envPath = path.join(__dirname, '.env');
  const envContent = `NODE_ENV=production
BASE_URL=https://cpxtbmining.com
VITE_APP_BASE_URL=https://cpxtbmining.com
`;
  fs.writeFileSync(envPath, envContent, { flag: 'a' });
  console.log('✅ Updated .env file for production');

  console.log('Build optimization completed successfully!');
} catch (error) {
  console.error('Error during build optimization:', error);
  process.exit(1);
}