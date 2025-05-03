import { Switch, Route, useLocation, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { lazy, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { LiveUserCount } from "@/components/live-user-count";
import { config } from "./lib/web3";
import { WagmiConfig } from 'wagmi';
import { ProtectedRoute } from "./lib/protected-route";
import { scheduleMemoryCleanup, preloadImages } from "./lib/performance-optimizations";
import { AuthProvider } from "./hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { ChallengeSolver } from "@/components/challenge-solver";
import { useToast } from "@/hooks/use-toast";

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
const MerchantDashboard = lazy(() => import("@/pages/merchant-dashboard"));
const PaymentPage = lazy(() => import("@/pages/payment-page"));
const LegalPage = lazy(() => import("@/pages/legal-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const EasyPaymentPage = lazy(() => import("@/pages/easy-payment-page"));
const SocialLoginTestPage = lazy(() => import("@/pages/social-login-test"));

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
        <Route path="/legal-documents" component={LegalPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/merchant" component={MerchantDashboard} />
        <Route path="/payment" component={PaymentPage} />
        <Route path="/payment/:reference" component={PaymentPage} />
        <Route path="/easy-payment" component={EasyPaymentPage} />
        <Route path="/social-login-test" component={SocialLoginTestPage} />
        
        {/* No Games */}
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// Challenge interface for typing
interface Challenge {
  token: string;
  equation: string;
  level: number;
}

// Higher order component for handling DDoS protection challenges
function withChallengeHandler(Component: React.ComponentType<any>) {
  return function ChallengeHandlerWrapper(props: any) {
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const { toast } = useToast();
    
    // Override the global fetch to handle challenge responses
    useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = async function(input, init) {
        try {
          const response = await originalFetch(input, init);
          
          // If we get a 429 with a challenge, handle it
          if (response.status === 429) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const clonedResponse = response.clone();
              const data = await clonedResponse.json();
              
              if (data.challenge) {
                setChallenge(data.challenge);
                throw new Error('Anti-DDoS challenge required');
              }
            }
          }
          
          return response;
        } catch (error: unknown) {
          if (error instanceof Error && error.message !== 'Anti-DDoS challenge required') {
            console.error('Fetch error:', error);
          }
          throw error;
        }
      };
      
      // Modify the apiRequest method to handle challenges
      const originalApiRequest = apiRequest;
      const enhancedApiRequest = async (method: string, url: string, body?: any) => {
        try {
          return await originalApiRequest(method, url, body);
        } catch (error: unknown) {
          // Type guard for error object with status property
          if (typeof error === 'object' && error !== null && 'status' in error && error.status === 429) {
            // Type guard for error object with json method
            if ('json' in error && typeof (error as any).json === 'function') {
              const data = await (error as any).json();
              if (data.challenge) {
                setChallenge(data.challenge);
                toast({
                  title: "Security Check",
                  description: "Please solve the quick math problem to continue",
                  variant: "default",
                });
                throw new Error('Challenge required');
              }
            }
          }
          throw error;
        }
      };
      
      // @ts-ignore - we're adding a custom property for our needs
      queryClient.apiRequest = enhancedApiRequest;
      
      return () => {
        window.fetch = originalFetch;
        // @ts-ignore - removing our custom property
        delete queryClient.apiRequest;
      };
    }, [toast]);
    
    const handleChallengeComplete = async () => {
      setChallenge(null);
      toast({
        title: "Success!",
        description: "Security check passed. You can continue using the platform.",
        variant: "default",
      });
    };
    
    const handleChallengeFailed = (errorMessage: string) => {
      toast({
        title: "Challenge Failed",
        description: errorMessage || "Please try again or refresh the page.",
        variant: "destructive",
      });
    };
    
    if (challenge) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Security Verification</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              To protect our platform from automated attacks, please solve this simple math problem:
            </p>
            <ChallengeSolver 
              challenge={challenge}
              onChallengeComplete={handleChallengeComplete}
              onChallengeFailed={handleChallengeFailed}
            />
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
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
            <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
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

// Export the App wrapped with our challenge handler for DDoS protection
export default withChallengeHandler(App);