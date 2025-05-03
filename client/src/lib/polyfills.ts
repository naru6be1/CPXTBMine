// Minimalist type definitions only
declare global {
  interface Window {
    global: typeof window;
    Buffer: any;
    process: any;
  }
}

console.log("Polyfills disabled - Using BasicSocialLogin for demo");

// Create empty exports to satisfy imports
export const Buffer = {};