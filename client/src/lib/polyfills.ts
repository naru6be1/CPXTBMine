// Browser polyfills for Web3 compatibility
import { Buffer as BufferPolyfill } from 'buffer';

declare global {
  interface Window {
    global: typeof window;
    Buffer: typeof BufferPolyfill;
    process: NodeJS.Process;
  }
}

// More aggressive polyfill approach for Web3Auth
if (typeof window !== 'undefined') {
  console.log("Setting up polyfills for Web3 compatibility...");
  
  // Set global to window for libraries that expect it
  window.global = window;
  
  // Force Buffer to be available on window - override any existing implementation
  // to ensure consistent behavior
  window.Buffer = BufferPolyfill;
  
  // Add complete process object for libraries that expect Node.js process
  window.process = { 
    env: {}, 
    version: '16.0.0', // Provide a specific version
    nextTick: (cb: Function) => setTimeout(cb, 0),
    browser: true
  } as any;
  
  // Log polyfill status
  console.log("Polyfills loaded: ", {
    buffer: !!window.Buffer,
    global: !!window.global,
    process: !!window.process
  });
}

// Ensure Buffer is available globally too for libraries that check global.Buffer
const globalAny = global as any;
globalAny.Buffer = BufferPolyfill;

// Export the Buffer for direct imports if needed
export { BufferPolyfill as Buffer };