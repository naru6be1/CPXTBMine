import { useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

/**
 * AuthCheck - Component to handle authentication redirects and status
 * 
 * This component detects Google OAuth redirects and ensures proper navigation
 * after authentication, especially for the /au path in production
 */
export function AuthCheck() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [isLoginPage] = useRoute('/login');
  const [isAuLoginPage] = useRoute('/au/login');

  useEffect(() => {
    // Function to check for auth_verified cookie (set after successful Google login)
    const hasAuthVerifiedCookie = () => {
      return document.cookie.split(';').some((item) => item.trim().startsWith('auth_verified='));
    };

    // Only run auth check when we're confident the auth state has loaded
    if (!isLoading) {
      console.log('Auth state loaded. User:', user ? 'Authenticated' : 'Not authenticated');
      console.log('Current location:', location);
      console.log('Auth verified cookie:', hasAuthVerifiedCookie() ? 'Present' : 'Not present');
      
      // Case 1: User is authenticated but on login page (redirect to merchant dashboard)
      if (user && (isLoginPage || isAuLoginPage)) {
        console.log('Redirecting authenticated user from login page to merchant dashboard');
        // Determine if we need to keep the /au prefix
        const prefix = location.startsWith('/au/') ? '/au' : '';
        setLocation(`${prefix}/merchant`);
      }
      
      // Case 2: User just completed Google OAuth (detected by auth_verified cookie)
      else if (hasAuthVerifiedCookie() && !user && (isLoginPage || isAuLoginPage)) {
        console.log('Auth verified cookie detected, but user not loaded yet. Refreshing auth state.');
        
        // Force page reload to refresh auth state (safer than just refetching query)
        window.location.reload();
      }
      
      // Case 3: Not authenticated and accessing protected route 
      else if (!user && !isLoading && !isLoginPage && !isAuLoginPage && 
               location !== '/' && location !== '/au/' && 
               !location.includes('/pay/')) {
        console.log('Unauthenticated user accessing protected route. Redirecting to login.');
        
        // Determine if we need to keep the /au prefix
        const prefix = location.startsWith('/au/') ? '/au' : '';
        setLocation(`${prefix}/login`);
      }
    }
  }, [user, isLoading, location, isLoginPage, isAuLoginPage, setLocation]);

  // This component doesn't render anything, it just performs checks
  return null;
}

export default AuthCheck;