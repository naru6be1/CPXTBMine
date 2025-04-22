import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { lazy, Suspense, useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { LiveUserCount } from "@/components/live-user-count";
import { config } from "./lib/web3";
import { WagmiConfig } from 'wagmi';
import { ProtectedRoute } from "./lib/protected-route";
import { scheduleMemoryCleanup, preloadImages } from "./lib/performance-optimizations";
import { AuthProvider } from "./hooks/use-auth";

// Lazy-loaded components for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home"));
const MiningPage = lazy(() => import("@/pages/mining"));
const ReferralsPage = lazy(() => import("@/pages/referrals"));
const RewardsPage = lazy(() => import("@/pages/rewards"));
const FeaturesPage = lazy(() => import("@/pages/features"));
const BlogPage = lazy(() => import("@/pages/blog"));
const BlogPost = lazy(() => import("@/pages/blog-post"));
const AboutPage = lazy(() => import("@/pages/about"));
const ContactPage = lazy(() => import("@/pages/contact"));
const AboutUsPage = lazy(() => import("@/pages/about-us"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const TermsOfServicePage = lazy(() => import("@/pages/terms-of-service"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const MerchantDashboard = lazy(() => import("@/pages/merchant-dashboard-new"));

// No games

// Loading component for Suspense fallback
function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
    </div>
  );
}

// Preload critical images for the home page
const criticalImages = [
  "/assets/logo.png",
  "/assets/token-logo.png",
  "/assets/mining-illustration.svg"
];

function Router() {
  const [location] = useLocation();
  
  // Preload next page resources based on current location
  useEffect(() => {
    const preloadNextPossiblePages = async () => {
      if (location === '/') {
        // Preload most common navigations from home page
        import("@/pages/mining");
        preloadImages(["/assets/mining-plan-bg.svg"]);
      }
    };
    
    // Use requestIdleCallback to not interfere with main thread
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => preloadNextPossiblePages());
    } else {
      setTimeout(preloadNextPossiblePages, 200);
    }
  }, [location]);
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/mining" component={MiningPage} />
        <Route path="/referrals" component={ReferralsPage} />
        <Route path="/rewards" component={RewardsPage} />
        <Route path="/features" component={FeaturesPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/about" component={AboutPage} />
        <Route path="/about-us" component={AboutUsPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/terms-of-service" component={TermsOfServicePage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/merchant" component={MerchantDashboard} />
        
        {/* No Games */}
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Initialize performance optimizations
  useEffect(() => {
    // Preload critical images when app starts
    preloadImages(criticalImages).catch(err => console.error("Failed to preload images:", err));
    
    // Schedule memory cleanup every 5 minutes
    const cleanupScheduler = scheduleMemoryCleanup(5);
    
    // Clean up on component unmount
    return () => {
      cleanupScheduler();
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <WagmiConfig config={config}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <HamburgerMenu />
            <div className="fixed top-4 right-4 z-50">
              <LiveUserCount />
            </div>
            <Router />
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </ErrorBoundary>
  );
}

export default App;