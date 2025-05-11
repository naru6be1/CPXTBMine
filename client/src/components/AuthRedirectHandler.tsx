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
      
      // Check if the reference is still valid (not expired)
      const isValidStoredRef = storedPaymentRef && storedRefExpiry && 
                              parseInt(storedRefExpiry) > Date.now();
      
      // Check if we just authenticated (either from loggedIn param or user state change)
      const hasLoggedInParam = window.location.search.includes('loggedIn=true');
      const justAuthenticated = hasLoggedInParam || (user && !isOnPaymentPage);
      
      console.log("🔍 AUTH REDIRECT HANDLER - Check:", {
        currentPath,
        isOnPaymentPage,
        storedPaymentRef,
        hasStoredRef: !!storedPaymentRef,
        hasLoggedInParam,
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
        
        // Construct the payment URL with all necessary parameters
        const paymentUrl = `/pay/${storedPaymentRef}?paymentContext=true&authCompleted=true&t=${Date.now()}`;
        
        // Use direct window.location.href for most reliable redirect
        // and add a timestamp to prevent caching issues
        console.log("⚡ PERFORMING DIRECT BROWSER REDIRECT TO:", paymentUrl);
        
        // Small delay to ensure toast is shown
        setTimeout(() => {
          // Forcefully navigate using window.location for maximum reliability
          window.location.href = paymentUrl;
          
          // Clean up the stored references
          sessionStorage.removeItem('cpxtb_payment_ref');
          sessionStorage.removeItem('cpxtb_payment_ref_expiry');
        }, 300);
      }
    };
    
    // Always check immediately when component mounts or dependencies change
    if (!isLoading) {
      checkAndPerformRedirect();
    }
    
  }, [user, isLoading, toast, redirectAttempted]);
  
  // Re-check for redirect needs if we navigate to a new page
  useEffect(() => {
    // Reset the redirect attempt flag when location changes
    setRedirectAttempted(false);
  }, [window.location.pathname]);
  
  // This is a utility component, it doesn't render anything
  return null;
}