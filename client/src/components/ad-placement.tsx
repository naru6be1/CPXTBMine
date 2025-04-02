import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useInView } from '@/hooks/use-in-view';

interface AdPlacementProps {
  adSlot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  responsive?: boolean;
  priority?: boolean;
}

// Global flag to track if AdSense has been initialized
let adSenseInitialized = false;

// Lazily load the AdSense script only when first ad is in view
function loadAdSenseScript() {
  if (typeof window === 'undefined' || adSenseInitialized) return;
  
  adSenseInitialized = true;
  
  // Create script element
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-REPLACE-WITH-YOUR-ADSENSE-ID';
  script.crossOrigin = 'anonymous';
  
  // Add error handling
  script.onerror = () => {
    console.log('AdSense script failed to load');
    adSenseInitialized = false; // Allow retry
  };
  
  // Append to head
  document.head.appendChild(script);
}

export function AdPlacement({ 
  adSlot, 
  format = 'auto', 
  className = '', 
  responsive = true,
  priority = false
}: AdPlacementProps) {
  const [loaded, setLoaded] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(adRef, { 
    once: true, 
    rootMargin: '200px 0px' // Load ads 200px before they come into view
  });
  
  // Only initialize AdSense for priority ads initially, or when in view for others
  useEffect(() => {
    if (priority || isInView) {
      loadAdSenseScript();
    }
  }, [priority, isInView]);
  
  // Initialize ad once script is loaded and ad is in view
  useEffect(() => {
    // Skip if not in view or already loaded
    if (!isInView || loaded) return;
    
    // Initialize with delay to reduce impact on page load
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.document) {
        try {
          // Check if adsbygoogle is available
          if ((window as any).adsbygoogle) {
            // Push the ad to AdSense for rendering
            (window as any).adsbygoogle = (window as any).adsbygoogle || [];
            (window as any).adsbygoogle.push({});
            setLoaded(true);
          }
        } catch (error) {
          // Silent fail - don't log errors for ads
        }
      }
    }, priority ? 1000 : 2500); // Shorter delay for priority ads
    
    return () => clearTimeout(timer);
  }, [adSlot, isInView, loaded, priority]);

  // Determine sizing based on format
  let adStyle: React.CSSProperties = {};
  let minHeight = '0px';
  
  switch (format) {
    case 'rectangle':
      adStyle = { display: 'block', width: '336px', height: '280px', margin: '0 auto' };
      minHeight = '280px';
      break;
    case 'horizontal':
      adStyle = { display: 'block', width: '100%', maxWidth: '728px', height: '90px', margin: '0 auto' };
      minHeight = '90px';
      break;
    case 'vertical':
      adStyle = { display: 'block', width: '160px', height: '600px', margin: '0 auto' };
      minHeight = '160px';
      break;
    case 'auto':
    default:
      adStyle = { display: 'block', width: '100%', height: 'auto', minHeight: '100px' };
      minHeight = '100px';
      break;
  }
  
  return (
    <Card 
      className={`overflow-hidden ${className}`} 
      ref={adRef}
      style={{ minHeight }}
    >
      <div className="p-3 bg-primary/5 text-xs text-center text-muted-foreground">Advertisement</div>
      <div className="p-2">
        <ins
          className="adsbygoogle"
          style={adStyle}
          data-ad-client="ca-pub-REPLACE-WITH-YOUR-ADSENSE-ID"
          data-ad-slot={adSlot}
          data-ad-format={format === 'auto' ? 'auto' : 'rectangle'}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </Card>
  );
}

// For Home Page Top Banner - low priority to improve initial page load
export function HomePageTopAd() {
  return <AdPlacement adSlot="1234567890" format="horizontal" className="mb-8 mt-4" priority={false} />;
}

// For Sidebar - lower priority
export function SidebarAd() {
  return <AdPlacement adSlot="2345678901" format="vertical" className="mb-6" priority={false} />;
}

// For Bottom of Content Pages - lowest priority
export function ContentBottomAd() {
  return <AdPlacement adSlot="3456789012" format="rectangle" className="mt-8 mb-6" priority={false} />;
}

// For Game Interstitial - higher priority since this is shown during gameplay transitions
export function GameInterstitialAd() {
  return <AdPlacement adSlot="4567890123" format="rectangle" className="max-w-md mx-auto my-8" priority={true} />;
}