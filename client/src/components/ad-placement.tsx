// Ad-free version - all ad components are empty

// Empty interface to maintain type compatibility with existing code
interface AdPlacementProps {
  adSlot?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  responsive?: boolean;
}

// Empty components that replace all ad placeholders
export function AdPlacement(_props: AdPlacementProps) {
  return null;
}

// For Home Page Top Banner
export function HomePageTopAd() {
  return null;
}

// For Sidebar
export function SidebarAd() {
  return null;
}

// For Bottom of Content Pages
export function ContentBottomAd() {
  return null;
}

// For Game Interstitial
export function GameInterstitialAd() {
  return null;
}