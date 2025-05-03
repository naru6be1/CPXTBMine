// Browser polyfills for Web3 compatibility
import { Buffer as BufferPolyfill } from 'buffer';

declare global {
  interface Window {
    global: typeof window;
    Buffer: typeof BufferPolyfill;
    process: NodeJS.Process;
  }
}

if (typeof window !== 'undefined') {
  // Set global to window for libraries that expect it
  window.global = window;
  
  // Add Buffer polyfill - properly implement the Buffer class
  window.Buffer = window.Buffer || BufferPolyfill;
  
  // Add process for libraries that expect Node.js process
  window.process = window.process || { 
    env: {}, 
    version: '', 
    nextTick: (cb: Function) => setTimeout(cb, 0)
  } as any;
}

// Also make Buffer available to global scope for Node.js compatibility
const globalAny = global as any;
if (typeof globalAny.Buffer === 'undefined') {
  globalAny.Buffer = BufferPolyfill;
}

export {};