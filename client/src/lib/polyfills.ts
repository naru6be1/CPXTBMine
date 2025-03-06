// Browser polyfills for Web3 compatibility
declare global {
  interface Window {
    global: typeof window;
    Buffer: typeof Buffer;
    process: NodeJS.Process;
  }
}

if (typeof window !== 'undefined') {
  window.global = window;
  // Use the Buffer from the buffer package if needed
  window.Buffer = window.Buffer || new Uint8Array(0).buffer;
  window.process = window.process || { env: {} };
}

export {};