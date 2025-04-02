import { useState, useEffect, RefObject } from 'react';

type InViewOptions = {
  /** Only trigger the inView callback once */
  once?: boolean;
  /** Root margin to use with Intersection Observer */
  rootMargin?: string;
  /** Threshold to use with Intersection Observer */
  threshold?: number | number[];
  /** Only start observing after component mounts + this delay */
  delay?: number;
};

/**
 * Hook to detect when an element is visible in the viewport using IntersectionObserver
 */
export function useInView(
  elementRef: RefObject<Element>,
  {
    once = false,
    rootMargin = '0px',
    threshold = 0,
    delay = 0,
  }: InViewOptions = {}
): boolean {
  const [inView, setInView] = useState<boolean>(false);

  useEffect(() => {
    // Don't create observer on server
    if (typeof window === 'undefined') return;
    
    const element = elementRef?.current;
    if (!element) return;

    // Add delay before starting observation if needed
    const timerRef = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          const isElementVisible = entry.isIntersecting;
          setInView(isElementVisible);
          
          // Unobserve after first visible detection if once option is enabled
          if (isElementVisible && once && element) {
            observer.unobserve(element);
          }
        },
        { rootMargin, threshold }
      );
      
      observer.observe(element);
      
      return () => {
        if (element) {
          observer.unobserve(element);
        }
        observer.disconnect();
      };
    }, delay);
    
    // Clean up the timer if component unmounts during delay
    return () => clearTimeout(timerRef);
  }, [elementRef, rootMargin, threshold, once, delay]);

  return inView;
}