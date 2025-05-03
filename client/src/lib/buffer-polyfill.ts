/**
 * Buffer polyfill for browser environments
 * This is needed for Web3Auth and other blockchain libraries
 * that depend on Node.js Buffer
 */

import { Buffer as BufferPolyfill } from 'buffer';

// Check if Buffer is already defined (via vite/webpack/etc)
if (typeof window !== 'undefined') {
  if (!window.Buffer) {
    window.Buffer = BufferPolyfill;
  }
  
  // Also set global.Buffer for libraries that check for it
  const globalAny = global as any;
  if (!globalAny.Buffer) {
    globalAny.Buffer = BufferPolyfill;
  }
}

export default BufferPolyfill;