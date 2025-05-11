import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

/**
 * Direct payment redirect solution component.
 * This component will detect post-authentication states and 
 * redirect users to the correct payment page if needed.
 */
export default function AuthRedirectHandler() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Only run this if we have an authenticated user and they just logged in
    if (user && !isLoading) {
      // Check if we're already on a payment page
      const isOnPaymentPage = window.location.pathname.includes('/pay/');
      
      // Check if we have a stored payment reference from before authentication
      const storedPaymentRef = sessionStorage.getItem('cpxtb_payment_ref');
      const storedRefExpiry = sessionStorage.getItem('cpxtb_payment_ref_expiry');
      
      // Only use the stored reference if it's not expired
      const isValidStoredRef = storedPaymentRef && storedRefExpiry && 
                              parseInt(storedRefExpiry) > Date.now();
      
      console.log("🔍 Auth Redirect Handler - Post Auth Check:", {
        currentUser: user.username,
        isOnPaymentPage,
        storedPaymentRef,
        storedRefExpiry,
        isValidStoredRef
      });
      
      // If we're not on a payment page but have a valid stored reference, redirect
      if (!isOnPaymentPage && isValidStoredRef) {
        console.log("🚀 EMERGENCY PAYMENT REDIRECT: Redirecting to payment page for", storedPaymentRef);
        
        // Show toast notification
        toast({
          title: "Payment Redirect",
          description: "Continuing to payment...",
          duration: 3000
        });
        
        // Redirect to the payment page with the stored reference
        const paymentUrl = `/pay/${storedPaymentRef}?paymentContext=true&authCompleted=true`;
        
        // Delay the redirect slightly to allow the toast to show
        setTimeout(() => {
          setLocation(paymentUrl);
        }, 500);
        
        // Clear the stored reference to prevent future redirects
        sessionStorage.removeItem('cpxtb_payment_ref');
        sessionStorage.removeItem('cpxtb_payment_ref_expiry');
      }
    }
  }, [user, isLoading, setLocation, toast]);
  
  // This is a utility component, it doesn't render anything
  return null;
}