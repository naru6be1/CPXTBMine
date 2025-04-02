import { useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface AdPlacementProps {
  adSlot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  responsive?: boolean;
}

export function AdPlacement({ 
  adSlot, 
  format = 'auto', 
  className = '', 
  responsive = true 
}: AdPlacementProps) {
  useEffect(() => {
    // Only run this on the client side
    if (typeof window !== 'undefined' && window.document) {
      try {
        // Wait for AdSense to be available
        if ((window as any).adsbygoogle) {
          // Push the ad to AdSense for rendering
          (window as any).adsbygoogle = (window as any).adsbygoogle || [];
          (window as any).adsbygoogle.push({});
        }
      } catch (error) {
        console.error('Error initializing AdSense:', error);
      }
    }
  }, [adSlot]);

  // Determine sizing based on format
  let adStyle: React.CSSProperties = {};
  
  switch (format) {
    case 'rectangle':
      adStyle = { display: 'block', width: '336px', height: '280px' };
      break;
    case 'horizontal':
      adStyle = { display: 'block', width: '728px', height: '90px' };
      break;
    case 'vertical':
      adStyle = { display: 'block', width: '160px', height: '600px' };
      break;
    case 'auto':
    default:
      adStyle = { display: 'block', width: '100%', height: 'auto' };
      break;
  }
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4 bg-primary/5 text-xs text-center text-muted-foreground">Advertisement</div>
      <div className="p-2">
        <ins
          className="adsbygoogle"
          style={adStyle}
          data-ad-client="ca-pub-5267025968316280"
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </Card>
  );
}

// For Home Page Top Banner (728x90)
export function HomePageTopAd() {
  return <AdPlacement adSlot="3851018642" format="horizontal" className="mb-8 mt-4" />;
}

// For Sidebar (160x600)
export function SidebarAd() {
  return <AdPlacement adSlot="7804672448" format="vertical" className="mb-6" />;
}

// For Bottom of Content Pages (336x280)
export function ContentBottomAd() {
  return <AdPlacement adSlot="5147935856" format="rectangle" className="mt-8 mb-6" />;
}

// For Game Ad - Note: For AdSense compliance, this is positioned as a standard display ad (336x280)
// rather than a true interstitial since AdSense has restrictions on interstitial formats
export function GameInterstitialAd() {
  return <AdPlacement adSlot="9673815264" format="rectangle" className="max-w-md mx-auto my-8" />;
}