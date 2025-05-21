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
import { SocialLoginProvider } from "./providers/SocialLoginProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ThemeToggle } from "@/components/theme-toggle";
import AuthRedirectHandler from "@/components/AuthRedirectHandler";
import "./styles/pancake-theme.css";

// Lazy-loaded components for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home"));
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
// Social login test page removed
const PayPage = lazy(() => import("@/pages/pay-page"));
const ClaimTokensPage = lazy(() => import("@/pages/claim-tokens"));
const BuyCPXTBPage = lazy(() => import("@/pages/buy-cpxtb"));
const PresentationPage = lazy(() => import("@/pages/presentation"));
const CheckBalancePage = lazy(() => import("@/pages/check-balance"));
const MobileAppPage = lazy(() => import("./pages/mobile-app"));
const MobileHomePage = lazy(() => import("./pages/mobile-home"));

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
        import("@/pages/merchant-dashboard");
        import("@/pages/buy-cpxtb");
        // The image might not exist yet, so wrapped in try/catch
        try {
          preloadImages(["/assets/merchant-dashboard-bg.svg"]);
        } catch (e) {
          console.error("Failed to preload images:", e);
        }
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
        <Route path="/" component={lazy(() => import("./pages/mobile-main"))} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/about" component={AboutPage} />
        <Route path="/about-us" component={AboutUsPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/terms-of-service" component={TermsOfServicePage} />
        <Route path="/legal-documents" component={LegalPage} />
        <Route path="/auth" component={lazy(() => import("./pages/mobile-merchant-auth"))} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/merchant" component={MerchantDashboard} />
        <Route path="/payment" component={PaymentPage} />
        <Route path="/payment/:reference" component={PaymentPage} />
        <Route path="/easy-payment" component={EasyPaymentPage} />
        {/* Social login test page removed */}
        <Route path="/pay/:paymentReference" component={PayPage} />
        <Route path="/buy-cpxtb" component={BuyCPXTBPage} />
        <Route path="/reports" component={Home} /> {/* Placeholder until Reports page is created */}
        <Route path="/payments" component={Home} /> {/* Placeholder until Payments page is created */}
        <Route path="/settings" component={ProfilePage} /> {/* Placeholder until Settings page is created */}
        <Route path="/presentation" component={PresentationPage} />
        <Route path="/check-balance" component={CheckBalancePage} />
        <Route path="/mobile" component={MobileAppPage} />
        <Route path="/mobile-home" component={MobileHomePage} />
        <Route path="/mobile-profile" component={lazy(() => import("./pages/mobile-profile"))} />
        <Route path="/mobile-merchant" component={lazy(() => import("./pages/mobile-merchant"))} />
        <Route path="/mobile-auth" component={lazy(() => import("./pages/mobile-auth"))} />
        <Route path="/mobile-pay" component={lazy(() => import("./pages/mobile-pay"))} />
        <Route path="/mobile-wallet" component={lazy(() => import("./pages/mobile-wallet"))} />
        <Route path="/mobile-landing" component={lazy(() => import("./pages/mobile-landing"))} />
        
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
          <ThemeProvider defaultTheme="dark" storageKey="cpxtb-theme">
            <SocialLoginProvider>
              <AuthProvider>
                {/* Global post-auth redirect handler */}
                <AuthRedirectHandler />
                <HamburgerMenu />
                <div className="fixed top-4 right-4 z-50 flex items-center space-x-3">
                  <Link href="/mobile-home">
                    <Button variant="outline" size="sm" className="mr-2">
                      Mobile App
                    </Button>
                  </Link>
                  <ThemeToggle />
                  <LiveUserCount />
                </div>
                <Router />
                <Toaster />
              </AuthProvider>
            </SocialLoginProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </ErrorBoundary>
  );
}

// Export the App wrapped with our challenge handler for DDoS protection
export default withChallengeHandler(App);