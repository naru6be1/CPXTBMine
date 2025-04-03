// Performance optimization utilities

/**
 * Debounce function to limit how often a function is called
 * @param fn Function to debounce
 * @param delay Delay in ms
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

/**
 * Throttle function to limit how often a function is called
 * @param fn Function to throttle
 * @param limit Time limit in ms
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  
  return function(...args: Parameters<T>) {
    if (!lastRan) {
      fn(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          fn(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Lazy-loads a script and returns a promise
 * @param src Script URL
 * @param async Whether to load async
 * @param defer Whether to defer loading
 */
export function loadScript(src: string, async: boolean = true, defer: boolean = true): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if the script already exists
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.head.appendChild(script);
  });
}

/**
 * Memoize function to cache function results
 * @param fn Function to memoize
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Clear memory cache by removing unused items from browser memory
 * Useful for memory-intensive applications
 */
export function clearMemoryCache(): void {
  // Only run this if there's no actively focused input or form to avoid disrupting user input
  if (document.activeElement && 
      (document.activeElement.tagName === 'INPUT' || 
       document.activeElement.tagName === 'TEXTAREA' || 
       document.activeElement.tagName === 'SELECT')) {
    return;
  }
  
  // Create a massive array and immediately release it to trigger garbage collection
  try {
    const garbageCollection = new Array(10000000).fill('x');
    console.log('Memory cleaned, array size:', garbageCollection.length);
    // Immediately release the reference
    garbageCollection.length = 0;
  } catch (e) {
    // Ignore any out of memory errors
  }
  
  // Request garbage collection (works in some browsers)
  if (window.gc) {
    window.gc();
  }
}

/**
 * Schedule regular memory cleanup at appropriate idle times
 * @param intervalMinutes How often to clean memory (in minutes)
 */
export function scheduleMemoryCleanup(intervalMinutes: number = 5): () => void {
  const intervalTime = intervalMinutes * 60 * 1000;
  const timerId = setInterval(() => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => clearMemoryCache());
    } else {
      // Wait until user is likely idle
      setTimeout(clearMemoryCache, 100);
    }
  }, intervalTime);
  
  // Return a function to cancel the scheduled cleanup
  return () => clearInterval(timerId);
}

/**
 * Preload critical images
 * @param imageSources Array of image sources to preload
 */
export function preloadImages(imageSources: string[]): Promise<void[]> {
  return Promise.all(
    imageSources.map(src => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
      });
    })
  );
}

/**
 * Add intersection observer for lazy loading elements
 * @param elementsSelector CSS selector to target elements
 * @param loadCallback Callback function when element enters viewport
 */
export function setupIntersectionObserver(
  elementsSelector: string, 
  loadCallback: (element: Element) => void
): IntersectionObserver | null {
  // Check if IntersectionObserver is supported
  if (!('IntersectionObserver' in window)) {
    // If not supported, immediately load all elements
    document.querySelectorAll(elementsSelector).forEach(loadCallback);
    return null;
  }
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadCallback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '50px 0px', // Start loading when element is 50px from viewport
    threshold: 0.01 // Trigger when at least 1% of the item is visible
  });
  
  document.querySelectorAll(elementsSelector).forEach(element => {
    observer.observe(element);
  });
  
  return observer;
}