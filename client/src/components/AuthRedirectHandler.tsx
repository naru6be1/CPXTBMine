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
      
      // Check if we have a stored payment reference
      const storedPaymentRef = sessionStorage.getItem('cpxtb_payment_ref');
      const storedRefExpiry = sessionStorage.getItem('cpxtb_payment_ref_expiry');
      const storedPaymentUrl = sessionStorage.getItem('cpxtb_payment_url');
      
      // Check if the reference is still valid (not expired)
      const isValidStoredRef = storedPaymentRef && storedRefExpiry && 
                              parseInt(storedRefExpiry) > Date.now();
      
      // Check if we just authenticated (either from loggedIn param or user state change)
      const hasLoggedInParam = window.location.search.includes('loggedIn=true');
      const hasAuthCompletedParam = window.location.search.includes('authCompleted=true');
      const justAuthenticated = hasLoggedInParam || (user && !isOnPaymentPage);
      
      console.log("🔍 AUTH REDIRECT HANDLER - Check:", {
        currentPath,
        isOnPaymentPage,
        storedPaymentRef,
        hasStoredRef: !!storedPaymentRef,
        hasLoggedInParam,
        hasAuthCompletedParam,
        justAuthenticated,
        isValidStoredRef,
        user: user ? 'authenticated' : 'none'
      });
      
      // DIRECT REDIRECT: If we're not on a payment page, just authenticated,
      // and have a valid stored reference, perform an immediate redirect
      if (!isOnPaymentPage && justAuthenticated && isValidStoredRef) {
        // Mark that we've attempted a redirect to prevent loops
        setRedirectAttempted(true);
        
        console.log("🚨 EMERGENCY PAYMENT REDIRECT: Redirecting to payment page for", storedPaymentRef);
        
        // Show toast to inform the user
        toast({
          title: "Payment Redirect",
          description: "Continuing to payment...",
          duration: 3000
        });
        
        // Construct the payment URL with all necessary parameters and cache busting
        const paymentUrl = `/pay/${storedPaymentRef}?paymentContext=true&authCompleted=true&t=${Date.now()}`;
        
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
        const loadingSpinner = document.querySelector('[data-loading-spinner]');
        
        if ((!paymentCard || loadingSpinner) && !refreshAttempted) {
          console.log("⚠️ Payment page appears to be stuck. Forcing refresh...");
          setRefreshAttempted(true);
          
          toast({
            title: "Refreshing Payment Data",
            description: "Completing payment setup...",
            duration: 3000
          });
          
          // Get the current URL and force a refresh with a new timestamp
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('t', Date.now().toString());
          
          // Force a page reload to fix any stale state
          setTimeout(() => {
            window.location.href = currentUrl.toString();
          }, 500);
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