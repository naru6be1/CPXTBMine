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
