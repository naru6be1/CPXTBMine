// Simplified but functional polyfills
import { Buffer as BufferPolyfill } from 'buffer';

declare global {
  interface Window {
    global: typeof window;
    Buffer: typeof BufferPolyfill;
    process: any;
  }
}

// Ensure polyfills are properly set
if (typeof window !== 'undefined') {
  // Set global to window for libraries that expect it
  window.global = window;
  
  // Provide Buffer polyfill
  window.Buffer = BufferPolyfill;
  
  // Create a process object that satisfies common dependencies
  if (!window.process) {
    window.process = {
      env: {},
      nextTick: (cb: Function) => setTimeout(cb, 0),
      browser: true,
      version: '',
      versions: { node: '16.0.0' }
    };
  }
  
  console.log("Polyfills loaded for Web3Auth compatibility");
}

// Export Buffer for modules that import it directly
export const Buffer = BufferPolyfill;