// Load polyfills first, before any other imports
import './lib/polyfills';

// Log that polyfills have been initialized in main
console.log('Main script running - Buffer polyfill status:', {
  windowBuffer: typeof window !== 'undefined' && !!window.Buffer,
  globalBuffer: typeof global !== 'undefined' && !!(global as any).Buffer,
});

// Use modern React 18 features for better performance
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";

// Function to start app when DOM is ready
const startApp = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }
  
  // Create root with React 18's concurrent rendering
  const root = createRoot(rootElement);
  
  // Use StrictMode for better development experience
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

// Optimize page load - use requestIdleCallback if available
if (window.requestIdleCallback) {
  window.requestIdleCallback(startApp);
} else {
  // Fallback to setTimeout for browsers without requestIdleCallback
  window.setTimeout(startApp, 1);
}