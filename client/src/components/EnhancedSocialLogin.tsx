import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useSocialLogin } from '@/providers/SocialLoginProvider';

/**
 * An enhanced social login component that uses real Google OAuth authentication
 * 
 * This component requires proper Google OAuth credentials to be set in the environment
 */
interface EnhancedSocialLoginProps {
  onSuccess?: (data: {
    name: string;
    email: string;
    provider: string;
    walletAddress: string;
    balance: string;
  }) => void;
  onError?: (error: Error) => void;
  showCard?: boolean;
  className?: string;
}

export function EnhancedSocialLogin({ 
  onSuccess, 
  onError, 
  showCard = true,
  className = ''
}: EnhancedSocialLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useSocialLogin();
  
  // Enhanced function to check for and restore payment references from multiple sources
  const checkForRestorablePaymentReference = (): string | null => {
    // Priority 1: Check URL path for direct payment reference
    const pathSegments = window.location.pathname.split('/');
    if (pathSegments.length > 2 && pathSegments[1] === 'pay') {
      const pathRef = pathSegments[2];
      console.log("📋 Found payment reference in URL path:", pathRef);
      return pathRef;
    }
    
    // Priority 2: Check URL parameters for payment reference
    const urlParams = new URLSearchParams(window.location.search);
    const paramRef = urlParams.get('paymentRef');
    if (paramRef) {
      console.log("📋 Found payment reference in URL parameters:", paramRef);
      return paramRef;
    }
    
    // Priority 3: Check session storage for saved reference
    const sessionRef = sessionStorage.getItem('cpxtb_payment_ref');
    const sessionRefExpiry = sessionStorage.getItem('cpxtb_payment_ref_expiry');
    
    if (sessionRef && sessionRefExpiry) {
      const expiryTime = parseInt(sessionRefExpiry);
      if (expiryTime > Date.now()) {
        console.log("📋 Found valid payment reference in session storage:", sessionRef);
        return sessionRef;
      } else {
        console.log("⚠️ Found expired payment reference in session storage:", sessionRef);
        // Clean up expired reference
        sessionStorage.removeItem('cpxtb_payment_ref');
        sessionStorage.removeItem('cpxtb_payment_ref_expiry');
      }
    }
    
    // Priority 4: Check local storage as fallback (more persistent across browser sessions)
    const localRef = localStorage.getItem('cpxtb_payment_ref');
    const localRefExpiry = localStorage.getItem('cpxtb_payment_ref_expiry');
    
    if (localRef && localRefExpiry) {
      const expiryTime = parseInt(localRefExpiry);
      if (expiryTime > Date.now()) {
        console.log("📋 Found valid payment reference in local storage:", localRef);
        return localRef;
      } else {
        console.log("⚠️ Found expired payment reference in local storage:", localRef);
        // Clean up expired reference
        localStorage.removeItem('cpxtb_payment_ref');
        localStorage.removeItem('cpxtb_payment_ref_expiry');
      }
    }
    
    return null;
  };
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      // Directly redirect to Google OAuth endpoint
      console.log("Initiating Google authentication...");
      
      // Get the current URL for redirection
      let currentUrl = window.location.href;
      
      // Always ensure we have paymentContext=true in payment pages
      if (window.location.pathname.includes('/pay/') && !window.location.search.includes('paymentContext=true')) {
        // Add paymentContext parameter if it's missing
        const separator = window.location.search ? '&' : '?';
        currentUrl = `${currentUrl}${separator}paymentContext=true`;
        console.log("Enhanced URL with payment context:", currentUrl);
      }
      
      const redirectUrl = encodeURIComponent(currentUrl);
      
      // Determine payment and context flags with enhanced reference detection
      const isPaymentPage = window.location.pathname.includes('/pay/');
      const hasPaymentContext = window.location.search.includes('paymentContext=true');
      
      // Use our new enhanced reference detection function to find the payment reference
      // across multiple possible storage locations
      const detectedPaymentRef = checkForRestorablePaymentReference();
      const paymentRef = detectedPaymentRef;
      
      console.log("ENHANCED SOCIAL LOGIN - AUTH REQUEST:", {
        isPaymentPage,
        hasPaymentContext,
        currentUrl,
        paymentRef,
        path: window.location.pathname,
        search: window.location.search
      });
      
      // ENHANCED FIX: Store payment reference in session storage for reliable redirect
      // This is read by AuthRedirectHandler to redirect back to the correct payment page
      // after authentication if needed
      if (paymentRef) {
        console.log("📝 CRITICAL - Storing payment reference for auth redirect:", paymentRef);
        
        // Store in both sessionStorage and localStorage for maximum persistence
        // This ensures we have multiple recovery paths if one storage method fails
        sessionStorage.setItem('cpxtb_payment_ref', paymentRef);
        localStorage.setItem('cpxtb_payment_ref', paymentRef);
        
        // Set an expiration time - 10 minutes from now
        const expiry = Date.now() + (10 * 60 * 1000);
        sessionStorage.setItem('cpxtb_payment_ref_expiry', expiry.toString());
        localStorage.setItem('cpxtb_payment_ref_expiry', expiry.toString());
        
        // Store more context information for recovery
        localStorage.setItem('cpxtb_auth_intent', 'true');
        localStorage.setItem('cpxtb_auth_intent_timestamp', Date.now().toString());
        
        // Compute and store the full URL - this handles cases where we recovered the reference
        // from session storage or URL parameters but aren't currently on the payment page
        let paymentUrl = currentUrl;
        
        // If we're not already on a payment page, construct the payment URL
        if (!isPaymentPage) {
          // Base path to the payment
          const basePath = `/pay/${paymentRef}`;
          
          // Add essential parameters
          const params = new URLSearchParams();
          params.set('paymentContext', 'true');
          params.set('t', Date.now().toString());
          
          paymentUrl = `${basePath}?${params.toString()}`;
          console.log("📝 Constructed payment URL for post-auth redirect:", paymentUrl);
        }
        
        // Store the payment URL for backup navigation in both storage methods
        sessionStorage.setItem('cpxtb_payment_url', paymentUrl);
        localStorage.setItem('cpxtb_payment_url', paymentUrl);
        
        // Also store the URL with explicit login/payment context flags
        const enhancedUrl = new URL(paymentUrl, window.location.origin);
        enhancedUrl.searchParams.set('paymentContext', 'true');
        enhancedUrl.searchParams.set('loggedIn', 'true');
        enhancedUrl.searchParams.set('t', Date.now().toString());
        localStorage.setItem('cpxtb_enhanced_payment_url', enhancedUrl.toString());
      }
      
      // DOMAIN PROTECTION - Ensure we're using relative URLs for OAuth redirects
      // This prevents issues with misconfigured production domains
      const sanitizeUrl = (url: string): string => {
        try {
          // Parse the URL to get only the path + query components
          const parsedUrl = new URL(url);
          return `${parsedUrl.pathname}${parsedUrl.search}`;
        } catch (err) {
          console.error("Error sanitizing URL:", url, err);
          return url; // Return original if parsing fails
        }
      };
      
      // If redirectUrl has a full domain, strip it to just the path
      // This prevents issues with domain mismatches
      const safeRedirectUrl = redirectUrl.includes('http')
        ? encodeURIComponent(sanitizeUrl(decodeURIComponent(redirectUrl)))
        : redirectUrl;
      
      // Build authentication URL with improved context detection and domain protection
      let authUrl = `/api/social-auth/google?redirectUrl=${safeRedirectUrl}`;
      
      // Always include context=payment for payment pages
      if (isPaymentPage || hasPaymentContext) {
        authUrl += '&context=payment';
        
        // Also include the payment reference directly for more reliable tracking
        if (paymentRef) {
          authUrl += `&paymentRef=${paymentRef}`;
        }
      }
      
      // Add timestamp to prevent caching issues
      authUrl += `&t=${Date.now()}`;
      
      // Explicitly force real authentication
      authUrl += '&enableRealLogin=true';
      
      console.log("REDIRECTING TO AUTH URL:", authUrl);
      
      // Show a toast notification to let the user know what's happening
      toast({
        title: "Google Authentication",
        description: "Redirecting to Google for login...",
      });
      
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Social login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Could not complete login process",
        variant: "destructive",
      });
      
      if (onError) {
        onError(error);
      }
      setIsLoading(false);
    }
  };
  
  const loginContent = (
    <div className={`space-y-4 ${className}`}>
      <Button
        variant="default"
        disabled={isLoading}
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          aria-hidden="true"
          style={{ fill: 'white' }}
        >
          <path
            fillRule="evenodd"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.84 14.28c-.25.37-.56.7-.93.96-.36.26-.77.47-1.23.62-.46.15-.96.22-1.52.22-.63 0-1.22-.11-1.76-.33-.54-.22-1.01-.54-1.4-.94-.39-.4-.7-.9-.91-1.47a5.3 5.3 0 01-.34-1.92c0-.68.11-1.31.34-1.89.23-.58.54-1.07.95-1.49.41-.42.9-.75 1.46-.98.56-.23 1.17-.35 1.83-.35.58 0 1.12.09 1.62.28.5.19.94.47 1.31.84.37.37.66.83.86 1.37.2.54.3 1.16.3 1.85 0 .2-.01.4-.04.58H11.5v-.05c0-.29.05-.56.14-.81.09-.25.22-.47.38-.66.16-.19.35-.34.57-.45.22-.11.46-.16.73-.16.31 0 .59.07.83.22.24.15.43.35.56.61h2.12c-.09-.34-.23-.64-.42-.9-.19-.26-.42-.48-.67-.66-.25-.18-.54-.32-.84-.42-.31-.1-.62-.15-.95-.15-.41 0-.79.07-1.16.21-.37.14-.69.35-.97.62-.28.27-.5.6-.67.99a4.5 4.5 0 00-.24 1.52c0 .54.08 1.03.24 1.48.16.45.39.83.68 1.15.29.32.64.57 1.03.74.4.17.84.26 1.31.26.29 0 .58-.04.86-.13.28-.09.54-.22.78-.38.24-.16.44-.36.59-.59s.26-.5.33-.79h-2.17c-.12.28-.32.49-.58.63-.26.14-.55.21-.87.21-.36 0-.67-.08-.93-.24-.26-.16-.47-.38-.63-.66s-.27-.61-.33-.99a7.99 7.99 0 01-.09-1.25h5.13c.05-.36.07-.7.07-1.02 0-.64-.09-1.23-.28-1.76-.19-.53-.45-.99-.8-1.37-.35-.38-.77-.67-1.27-.87-.5-.2-1.05-.3-1.65-.3-.66 0-1.27.12-1.84.36-.57.24-1.06.58-1.49 1.01-.43.43-.76.95-1 1.56-.24.61-.36 1.28-.36 2.01 0 .7.12 1.34.36 1.93.24.59.59 1.1 1.03 1.53.44.43.97.76 1.59.99.62.23 1.31.35 2.07.35.71 0 1.36-.13 1.95-.38.59-.25 1.1-.66 1.52-1.21h-1.95z"
            clipRule="evenodd"
          />
        </svg>
        Sign in with Google
      </Button>
      
      <div className="text-xs text-center text-muted-foreground mt-2">
        <p>Sign in with your Google account to proceed</p>
      </div>
    </div>
  );
  
  if (!showCard) {
    return loginContent;
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login to Make Payment</CardTitle>
        <CardDescription>
          Login with your account to complete this payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loginContent}
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-gray-500">
        <p>Your data is securely handled through the payment process</p>
      </CardFooter>
    </Card>
  );
}

export default EnhancedSocialLogin;