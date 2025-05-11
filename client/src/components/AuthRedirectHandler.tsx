import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

/**
 * Direct payment redirect solution component.
 * This component will detect post-authentication states and 
 * redirect users to the correct payment page if needed.
 * 
 * EMERGENCY FIX: Using direct window.location for more reliable redirects
 */
export default function AuthRedirectHandler() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  
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
      const storedPaymentRef = sessionStorage.getItem('cpxtb_payment_ref');
      const storedRefExpiry = sessionStorage.getItem('cpxtb_payment_ref_expiry');
      const storedPaymentUrl = sessionStorage.getItem('cpxtb_payment_url');
      
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
      
      console.log("🔍 AUTH REDIRECT HANDLER - Enhanced Check:", {
        currentPath,
        isOnPaymentPage,
        storedPaymentRef,
        urlPaymentRef,
        effectivePaymentRef,
        hasStoredRef: !!storedPaymentRef,
        hasUrlRef: !!urlPaymentRef, 
        hasLoggedInParam,
        hasAuthCompletedParam,
        justAuthenticated,
        isValidStoredRef,
        storedPaymentUrl: storedPaymentUrl ? 'present' : 'none',
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
        
        // Try to use the stored URL if available, otherwise construct a new one
        let paymentUrl;
        
        if (storedPaymentUrl && effectivePaymentRef === storedPaymentRef) {
          // Use stored URL but ensure authCompleted flag is set
          const storedUrl = new URL(storedPaymentUrl, window.location.origin);
          storedUrl.searchParams.set('paymentContext', 'true');
          storedUrl.searchParams.set('authCompleted', 'true');
          storedUrl.searchParams.set('t', Date.now().toString());
          paymentUrl = storedUrl.pathname + storedUrl.search;
        } else {
          // Construct the payment URL with all necessary parameters and cache busting
          paymentUrl = `/pay/${effectivePaymentRef}?paymentContext=true&authCompleted=true&t=${Date.now()}`;
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
  
  // This is a utility component, it doesn't render anything
  return null;
}