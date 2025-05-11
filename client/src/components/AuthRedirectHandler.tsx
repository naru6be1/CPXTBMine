import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import ForceLoginButton from './ForceLoginButton';

/**
 * Direct payment redirect solution component.
 * This component will detect post-authentication states and 
 * redirect users to the correct payment page if needed.
 * 
 * EMERGENCY FIX: Using direct window.location for more reliable redirects
 * AUTO-LOGIN FIX: Using force-login for development and mobile environments
 */
export default function AuthRedirectHandler() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { login } = useSocialLogin(); // Import SocialLoginProvider's login function
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const [forceLoginAttempted, setForceLoginAttempted] = useState(false);
  const [loginLoopDetected, setLoginLoopDetected] = useState(false);
  const [loginAttemptCount, setLoginAttemptCount] = useState(0);
  
  // PART 0: Attempt force login for development environments or mobile browsers
  useEffect(() => {
    // Skip if user is already authenticated or if we've already attempted force login
    if (user || isLoading || forceLoginAttempted) {
      return;
    }
    
    // Check if we're in a development environment or Replit preview
    const isDevelopmentEnv = window.location.hostname.includes('replit.dev') || 
                         window.location.hostname.includes('localhost');
    
    // Check if this is possibly a mobile browser using a simple detection
    const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check if we have URL signals that we're in an authentication flow
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams = urlParams.has('loggedIn') || 
                          urlParams.has('authCompleted') || 
                          urlParams.has('provider');
    
    // Detect if this is a payment page access
    const isPaymentPage = window.location.pathname.startsWith('/pay/');
    
    // Determine if we should attempt force login
    const shouldAttemptForceLogin = (isDevelopmentEnv || isMobileBrowser) && 
                                    (isPaymentPage || hasAuthParams);
    
    if (shouldAttemptForceLogin) {
      console.log('⚡ AUTH REDIRECT: Attempting force login for development/mobile environment');
      
      // Mark that we've attempted it to prevent loops
      setForceLoginAttempted(true);
      
      // Use the Google login which will detect development environments and use force login
      try {
        login('google');
        
        toast({
          title: 'Development Login',
          description: 'Using auto-login for development environment',
          duration: 3000
        });
      } catch (error) {
        console.error('Force login attempt failed:', error);
      }
    }
  }, [user, isLoading, forceLoginAttempted, login, toast]);

  // PART 1: Handle post-authentication redirects for payment pages
  useEffect(() => {
    // Only run this if we're not already in a redirect attempt
    if (redirectAttempted) {
      return;
    }
    
    // Function to perform the redirect with maximum reliability
    const checkAndPerformRedirect = () => {
      // Skip if already attempted to prevent loops
      if (redirectAttempted) return;
      
      // Detect if we're already on a payment page
      const currentPath = window.location.pathname || '';
      const isOnPaymentPage = currentPath.includes('/pay/');
      
      // Enhanced reference detection that uses multiple sources
      const sessionPaymentRef = sessionStorage.getItem('cpxtb_payment_ref');
      const sessionRefExpiry = sessionStorage.getItem('cpxtb_payment_ref_expiry');
      const sessionPaymentUrl = sessionStorage.getItem('cpxtb_payment_url');
      
      // Also check localStorage (more persistent across browser sessions)
      const localPaymentRef = localStorage.getItem('cpxtb_payment_ref');
      const localRefExpiry = localStorage.getItem('cpxtb_payment_ref_expiry');
      const localPaymentUrl = localStorage.getItem('cpxtb_payment_url');
      const enhancedPaymentUrl = localStorage.getItem('cpxtb_enhanced_payment_url');
      
      // Combine storage sources
      const storedPaymentRef = sessionPaymentRef || localPaymentRef;
      const storedRefExpiry = sessionRefExpiry || localRefExpiry;
      const storedPaymentUrl = sessionPaymentUrl || localPaymentUrl || enhancedPaymentUrl;
      
      // Check URL parameters for any payment reference
      const urlParams = new URLSearchParams(window.location.search);
      const urlPaymentRef = urlParams.get('paymentRef');
      
      // Merge reference sources with priority (URL parameter > stored reference)
      const effectivePaymentRef = urlPaymentRef || storedPaymentRef;
      
      // Check if the reference is still valid (not expired)
      const isValidStoredRef = effectivePaymentRef && 
                              (urlPaymentRef || (storedRefExpiry && parseInt(storedRefExpiry) > Date.now()));
      
      // Check if we just authenticated (either from loggedIn param or user state change)
      const hasLoggedInParam = window.location.search.includes('loggedIn=true');
      const hasAuthCompletedParam = window.location.search.includes('authCompleted=true');
      const justAuthenticated = hasLoggedInParam || (user && !isOnPaymentPage);
      
      console.log("🔍 AUTH REDIRECT HANDLER - Multi-Source Check:", {
        currentPath,
        isOnPaymentPage,
        sessionPaymentRef,
        localPaymentRef, 
        storedPaymentRef,
        urlPaymentRef,
        effectivePaymentRef,
        hasSessionRef: !!sessionPaymentRef,
        hasLocalRef: !!localPaymentRef,
        hasStoredRef: !!storedPaymentRef,
        hasUrlRef: !!urlPaymentRef, 
        hasLoggedInParam,
        hasAuthCompletedParam,
        justAuthenticated,
        isValidStoredRef,
        sessionPaymentUrl: sessionPaymentUrl ? 'present' : 'none',
        localPaymentUrl: localPaymentUrl ? 'present' : 'none',
        enhancedPaymentUrl: enhancedPaymentUrl ? 'present' : 'none',
        effectivePaymentUrl: storedPaymentUrl ? 'present' : 'none',
        // Check localStorage for auth intent/completion
        authIntent: localStorage.getItem('cpxtb_auth_intent') === 'true',
        authCompleted: localStorage.getItem('cpxtb_auth_completed') === 'true',
        user: user ? 'authenticated' : 'none'
      });
      
      // DIRECT REDIRECT: If we're not on a payment page, just authenticated,
      // and have a valid payment reference, perform an immediate redirect
      if (!isOnPaymentPage && justAuthenticated && isValidStoredRef) {
        // Mark that we've attempted a redirect to prevent loops
        setRedirectAttempted(true);
        
        console.log("🚨 ENHANCED PAYMENT REDIRECT: Redirecting to payment page for", effectivePaymentRef);
        
        // Show toast to inform the user
        toast({
          title: "Payment Redirect",
          description: "Continuing to payment...",
          duration: 3000
        });
        
        // Store authentication status flag in localStorage (more persistent than sessionStorage)
        localStorage.setItem('cpxtb_auth_completed', 'true');
        localStorage.setItem('cpxtb_auth_timestamp', Date.now().toString());
        
        // Try to use the stored URL if available, otherwise construct a new one
        let paymentUrl;
        
        if (storedPaymentUrl && effectivePaymentRef === storedPaymentRef) {
          // Use stored URL but ensure authCompleted flag is set
          const storedUrl = new URL(storedPaymentUrl, window.location.origin);
          storedUrl.searchParams.set('paymentContext', 'true');
          storedUrl.searchParams.set('authCompleted', 'true');
          storedUrl.searchParams.set('loggedIn', 'true'); // Add this explicitly
          storedUrl.searchParams.set('t', Date.now().toString());
          paymentUrl = storedUrl.pathname + storedUrl.search;
        } else {
          // Construct the payment URL with all necessary parameters and cache busting
          paymentUrl = `/pay/${effectivePaymentRef}?paymentContext=true&authCompleted=true&loggedIn=true&t=${Date.now()}`;
        }
        
        // Use direct window.location.href for most reliable redirect
        console.log("⚡ PERFORMING DIRECT BROWSER REDIRECT TO:", paymentUrl);
        
        // Small delay to ensure toast is shown
        setTimeout(() => {
          // Forcefully navigate using window.location for maximum reliability
          window.location.href = paymentUrl;
          
          // Don't clear the stored references yet - let the payment page handle this
          // after a successful load
        }, 300);
      }
    };
    
    // Always check immediately when component mounts or dependencies change
    if (!isLoading) {
      checkAndPerformRedirect();
    }
    
  }, [user, isLoading, toast, redirectAttempted]);
  
  // PART 2: Handle stuck payment pages by detecting loading timeouts
  useEffect(() => {
    // Only run on payment pages when the user is authenticated
    const isPaymentPage = window.location.pathname.includes('/pay/');
    const hasAuthCompleted = window.location.search.includes('authCompleted=true');
    
    if (isPaymentPage && user && hasAuthCompleted && !refreshAttempted) {
      console.log("🔄 Payment page detected with authCompleted flag. Setting up auto-refresh check");
      
      // Start a timer to detect if the page gets stuck in loading
      const timeoutId = setTimeout(() => {
        // Check for signs that the page might be stuck (no content loaded after a delay)
        const paymentCard = document.querySelector('[data-payment-card]');
        const loadingCard = document.querySelector('[data-loading-card]');
        const errorCard = document.querySelector('[data-error-card]');
        const successCard = document.querySelector('[data-success-card]');
        const loadingSpinner = document.querySelector('[data-loading-spinner]');
        
        // Only refresh if we're still seeing loading indicators or no payment card is visible
        const validCardVisible = paymentCard || errorCard || successCard;
        const isStuck = (!validCardVisible || (loadingCard && loadingSpinner)) && !refreshAttempted;
        
        console.log("🔍 Enhanced Payment Page Status Check:", {
          validCardVisible,
          paymentCardPresent: !!paymentCard,
          loadingCardPresent: !!loadingCard,
          errorCardPresent: !!errorCard,
          successCardPresent: !!successCard,
          loadingSpinnerPresent: !!loadingSpinner,
          isStuck,
          refreshAttempted,
          timestamp: new Date().toISOString(),
          hasAuthCompletedFlag: window.location.search.includes('authCompleted=true'),
          hasPaymentContextFlag: window.location.search.includes('paymentContext=true'),
          url: window.location.href
        });
        
        if (isStuck) {
          console.log("⚠️ Payment page appears to be stuck. Forcing refresh...");
          setRefreshAttempted(true);
          
          toast({
            title: "Refreshing Payment Data",
            description: "Completing payment setup...",
            duration: 3000
          });
          
          // Enhanced URL handling for more reliable refresh
          const currentUrl = new URL(window.location.href);
          
          // Ensure critical payment context flags are present
          currentUrl.searchParams.set('paymentContext', 'true');
          currentUrl.searchParams.set('authCompleted', 'true');
          
          // Add cache-busting timestamp 
          currentUrl.searchParams.set('t', Date.now().toString());
          
          // Add a special flag to indicate this is a refresh attempt
          currentUrl.searchParams.set('refreshAttempt', '1');
          
          // Log the URL we're refreshing to
          console.log("⚡ REFRESHING PAGE TO:", currentUrl.toString());
          
          // Force a page reload to fix any stale state after a small delay
          // to ensure toast is shown and logs are completed
          setTimeout(() => {
            window.location.href = currentUrl.toString();
          }, 800);
        }
      }, 5000); // Wait 5 seconds before checking
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, refreshAttempted, toast]);
  
  // PART 3: Track and detect login loops
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasLoggedInParam = urlParams.has('loggedIn');
    const hasAuthCompleteParam = urlParams.has('authCompleted');
    const isGoogleAuthFlow = urlParams.has('provider') && urlParams.get('provider') === 'google';
    
    // Check if we're in an authentication flow
    if (hasLoggedInParam || hasAuthCompleteParam || isGoogleAuthFlow) {
      // Increment login attempt count
      setLoginAttemptCount(prev => {
        const newCount = prev + 1;
        
        // Store attempt count for page refresh persistence
        localStorage.setItem('cpxtb_login_attempt_count', newCount.toString());
        
        // If we've tried more than 3 times, flag a login loop
        if (newCount >= 3) {
          setLoginLoopDetected(true);
          // Store the loop detection for persistence
          localStorage.setItem('cpxtb_login_loop_detected', 'true');
          
          toast({
            title: "Authentication Issue Detected",
            description: "Multiple login attempts detected. Try direct login instead.",
            duration: 8000,
          });
        }
        
        return newCount;
      });
    }
  }, [toast]);
  
  // Load stored login attempt data on mount
  useEffect(() => {
    const storedCount = localStorage.getItem('cpxtb_login_attempt_count');
    const storedLoopDetected = localStorage.getItem('cpxtb_login_loop_detected');
    
    if (storedCount) {
      const count = parseInt(storedCount);
      setLoginAttemptCount(count);
      
      // If count is high or loop explicitly detected, set the flag
      if (count >= 3 || storedLoopDetected === 'true') {
        setLoginLoopDetected(true);
      }
    }
  }, []);
  
  // Reset flags when navigating to a new page
  useEffect(() => {
    const resetFlagsForNewPath = () => {
      setRedirectAttempted(false);
      setRefreshAttempted(false);
    };
    
    // Add event listener for path changes
    window.addEventListener('popstate', resetFlagsForNewPath);
    
    return () => {
      window.removeEventListener('popstate', resetFlagsForNewPath);
    };
  }, []);
  
  // Function to dismiss the login loop popup and reset counters
  const dismissLoginLoopHelp = () => {
    setLoginLoopDetected(false);
    setLoginAttemptCount(0);
    localStorage.removeItem('cpxtb_login_loop_detected');
    localStorage.removeItem('cpxtb_login_attempt_count');
  };

  // This component now conditionally renders a help box if a login loop is detected
  if (loginLoopDetected) {
    return (
      <div className="fixed bottom-4 right-4 z-50 p-4 bg-blue-50 border border-blue-300 rounded-lg shadow-lg max-w-sm">
        <button 
          onClick={dismissLoginLoopHelp}
          className="absolute top-2 right-2 text-blue-400 hover:text-blue-700"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="flex flex-col">
          <h3 className="font-bold text-blue-800">Authentication Loop Detected</h3>
          <p className="text-sm text-blue-600 mb-3">
            We've detected multiple login attempts. Google authentication may be having issues with cookies.
          </p>
          <ForceLoginButton 
            className="bg-blue-100 hover:bg-blue-200 border-blue-300 w-full" 
          />
        </div>
      </div>
    );
  }
  
  // Otherwise, renders nothing
  return null;
}