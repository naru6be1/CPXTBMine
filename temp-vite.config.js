
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
