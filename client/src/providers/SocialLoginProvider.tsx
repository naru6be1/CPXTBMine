import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UserInfo {
  name: string;
  email: string;
  provider: string;
}

interface SocialLoginContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  userInfo: UserInfo | null;
  walletAddress: string | null;
  balance: string;
  error: string | null;
  login: (provider: string) => Promise<void>;
  logout: () => Promise<void>;
  copyWalletAddress: () => void;
  refreshBalance: () => Promise<string | null>;
}

const defaultContext: SocialLoginContextType = {
  isLoggedIn: false,
  isLoading: false,
  userInfo: null,
  walletAddress: null,
  balance: '0',
  error: null,
  login: async () => {},
  logout: async () => {},
  copyWalletAddress: () => {},
  refreshBalance: async () => null,
};

const SocialLoginContext = createContext<SocialLoginContextType>(defaultContext);

export const SocialLoginProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Direct authentication check with the server
  const checkAuthentication = useCallback(async () => {
    try {
      console.log("🔄 Directly checking authentication status with server...");
      
      // Create a controller to allow timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Make direct API call to check authentication
      const response = await fetch('/api/auth/user', {
        credentials: 'include', // Important: Include credentials (cookies)
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const userData = await response.json();
        console.log("✅ Authentication confirmed by server:", userData);
        
        // Save credentials to localStorage
        const userToStore = {
          userInfo: {
            name: userData.name || userData.username || "Google User",
            email: userData.email || "unknown@example.com",
            provider: userData.provider || "google"
          },
          walletAddress: userData.walletAddress,
          balance: userData.balance || "0",
          isDemoUser: false
        };
        
        localStorage.setItem('cpxtb_user', JSON.stringify(userToStore));
        console.log("💾 Saved authenticated user data to localStorage");
        
        // Update state
        setUserInfo(userToStore.userInfo);
        setWalletAddress(userToStore.walletAddress);
        setBalance(userToStore.balance);
        setIsLoggedIn(true);
        setError(null);
        
        // Set authentication marker for cross-page access
        localStorage.setItem('cpxtb_auth_completed', 'true');
        localStorage.setItem('cpxtb_auth_completion_timestamp', Date.now().toString());
        
        return true;
      } else {
        console.log("❌ Server reports not authenticated:", await response.text());
        return false;
      }
    } catch (err) {
      console.error("Error checking authentication:", err);
      return false;
    }
  }, []);
  
  // Add polling for authentication status on possible auth pages
  useEffect(() => {
    // Check URL parameters for evidence we're in an authentication flow
    const urlParams = new URLSearchParams(window.location.search);
    const hasLoggedInParam = urlParams.has('loggedIn');
    const hasPaymentContext = urlParams.has('paymentContext');
    const isGoogleAuth = urlParams.get('provider') === 'google';
    const hasAuthComplete = urlParams.has('authCompleted');
    
    // Check if we're in a payment context
    const isPaymentPage = window.location.pathname.startsWith('/pay/');
    
    // Determine if we need to poll for authentication
    const shouldPollAuth = (isPaymentPage || hasPaymentContext) && 
                          (hasLoggedInParam || isGoogleAuth || hasAuthComplete);
    
    if (shouldPollAuth && !isLoggedIn) {
      console.log("🔍 Setting up authentication polling for payment context");
      
      // Create an authentication polling interval
      const pollIntervalMs = 1000; // Poll every second
      const maxPollAttempts = 10;  // Poll up to 10 times
      let pollCount = 0;
      
      const pollAuthenticationStatus = async () => {
        pollCount++;
        console.log(`🔄 Authentication poll attempt ${pollCount}/${maxPollAttempts}`);
        
        const isAuthenticated = await checkAuthentication();
        
        if (isAuthenticated) {
          console.log("🎉 Authentication polling successful!");
          
          // Extract payment reference for quick redirect if needed
          if (isPaymentPage && hasPaymentContext) {
            const pathSegments = window.location.pathname.split('/');
            if (pathSegments.length > 2 && pathSegments[1] === 'pay') {
              const paymentRef = pathSegments[2];
              console.log(`✅ Authentication confirmed for payment ${paymentRef}`);
              
              // Store payment reference in both session and local storage
              sessionStorage.setItem('cpxtb_payment_ref', paymentRef);
              localStorage.setItem('cpxtb_payment_ref', paymentRef);
              
              // Set expiry (15 minutes)
              const expiry = Date.now() + (15 * 60 * 1000);
              sessionStorage.setItem('cpxtb_payment_ref_expiry', expiry.toString());
              localStorage.setItem('cpxtb_payment_ref_expiry', expiry.toString());
            }
          }
          
          clearInterval(intervalId);
        } else if (pollCount >= maxPollAttempts) {
          console.log("⚠️ Max authentication poll attempts reached without success");
          clearInterval(intervalId);
        }
      };
      
      // Start polling immediately
      pollAuthenticationStatus();
      const intervalId = setInterval(pollAuthenticationStatus, pollIntervalMs);
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn, checkAuthentication]);
  
  // Load user data from local storage on component mount
  useEffect(() => {
    console.log('SocialLoginProvider initializing...');
    console.log('Current URL path:', window.location.pathname);
    console.log('URL parameters:', window.location.search);
    console.log('Is QR code payment page:', window.location.pathname.startsWith('/pay/'));
    
    // EMERGENCY REDIRECT FIX: Check if we need to forcibly redirect
    const urlParams = new URLSearchParams(window.location.search);
    const hasLoggedInParam = urlParams.has('loggedIn');
    const hasPaymentContext = urlParams.has('paymentContext');
    const isGoogleAuth = urlParams.get('provider') === 'google';
    const hasAuthCompleted = urlParams.has('authCompleted');
    
    // If we detect both loggedIn and paymentContext from Google auth, but we're not on a payment page,
    // we need to forcibly redirect to the correct payment page
    if (hasLoggedInParam && hasPaymentContext && (isGoogleAuth || hasAuthCompleted) && 
        !window.location.pathname.startsWith('/pay/')) {
      console.log("🚨 EMERGENCY REDIRECT DETECTED!");
      console.log("We have returned from Google auth with payment context but aren't on a payment page.");
      
      // Check multiple storage locations for payment reference
      const sessionPaymentRef = sessionStorage.getItem('cpxtb_payment_ref');
      const localPaymentRef = localStorage.getItem('cpxtb_payment_ref');
      const savedPaymentRef = sessionPaymentRef || localPaymentRef;
      
      if (savedPaymentRef) {
        // We have a saved payment reference - redirect immediately
        console.log(`Forcibly redirecting to payment page: /pay/${savedPaymentRef}`);
        localStorage.setItem('cpxtb_auth_completed', 'true');
        localStorage.setItem('cpxtb_auth_completion_timestamp', Date.now().toString());
        window.location.href = `/pay/${savedPaymentRef}?paymentContext=true&loggedIn=true&provider=google&authCompleted=true&t=${Date.now()}`;
        return; // Skip the rest of initialization
      }
    }
    
    // Try to retrieve authentication state from localStorage
    const storedUser = localStorage.getItem('cpxtb_user');
    
    // For mobile browsers especially, check if authentication has completed
    const storedAuthCompleted = localStorage.getItem('cpxtb_auth_completed') === 'true';
    const hasJustCompleted = hasLoggedInParam || hasAuthCompleted || isGoogleAuth;
    
    if (hasJustCompleted || storedAuthCompleted) {
      console.log("🔐 Detected authentication completion flags - checking with server");
      
      // If we detect auth completion flags, directly check with server
      // This helps fix issues on mobile browsers with cookie handling
      checkAuthentication();
    }
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('Found stored user data:', userData);
        
        // Additional logging for social login with QR code scenarios
        const isQrCodePage = window.location.pathname.startsWith('/pay/');
        console.log('Social login state for QR code:', { 
          isQrCodePage, 
          hasLoggedInParam,
          userDataPresent: true 
        });
        
        // During deployment transitions, fetching real wallet balance might fail
        // If userData.balance is set to 0.0 but we know users usually have non-zero balances,
        // we'll immediately try to fetch the real balance from the blockchain
        const shouldRefreshImmediately = userData.walletAddress && 
                                         userData.balance === "0.0" && 
                                         localStorage.getItem('cpxtb_last_known_balance');
        
        if (shouldRefreshImmediately) {
          console.log('Detected potential balance reset during deployment, will try to fetch actual balance');
          // We'll use the last known non-zero balance temporarily if available
          const lastKnownBalance = localStorage.getItem('cpxtb_last_known_balance');
          if (lastKnownBalance && lastKnownBalance !== "0.0") {
            console.log(`Using last known balance: ${lastKnownBalance} while refreshing`);
            userData.balance = lastKnownBalance;
          }
        }
        
        setUserInfo(userData.userInfo);
        setWalletAddress(userData.walletAddress);
        setBalance(userData.balance || '0');
        setIsLoggedIn(true);
      } catch (err) {
        console.error('Failed to parse stored user data:', err);
        // Clear invalid data
        localStorage.removeItem('cpxtb_user');
      }
    } else {
      console.log('No stored user data found in localStorage');
      
      // Log if this is a QR code access without stored user data
      const isQrCodePage = window.location.pathname.startsWith('/pay/');
      console.log('Social login state for QR code:', { 
        isQrCodePage, 
        hasLoggedInParam,
        userDataPresent: false 
      });
    }
  }, [checkAuthentication]);
  
  // Function to refresh balance from blockchain
  const refreshBalance = useCallback(async (): Promise<string | null> => {
    if (!walletAddress) {
      console.log('No wallet address available, skipping balance refresh');
      return null;
    }
    
    try {
      console.log(`Refreshing balance for wallet: ${walletAddress}`);
      
      // Add a timeout to the fetch request to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(`/api/balance?address=${walletAddress}`, {
          signal: controller.signal
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch balance (${response.status}): ${errorText}`);
          // Don't reset the balance on failure - keep the last known good value
          return null;
        }
        
        const data = await response.json();
        console.log(`Retrieved balance: ${data.balance} CPXTB for wallet ${data.walletAddress}`);
        setBalance(data.balance);
        
        // Save the non-zero balance as the "last known good balance" for future use
        if (data.balance && parseFloat(data.balance) > 0) {
          localStorage.setItem('cpxtb_last_known_balance', data.balance);
          console.log(`Saved last known good balance: ${data.balance} CPXTB`);
        }
        
        // Update local storage with new balance
        try {
          const storedUser = localStorage.getItem('cpxtb_user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            userData.balance = data.balance;
            localStorage.setItem('cpxtb_user', JSON.stringify(userData));
            console.log('Updated wallet balance in local storage');
          }
        } catch (localStorageError) {
          console.error('Error updating local storage:', localStorageError);
          // Continue even if localStorage update fails
        }
        
        return data.balance; // Return the balance for callers who need it
      } catch (fetchError: any) {
        // Clear the timeout if the fetch threw an error
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.warn('Balance refresh timed out after 5 seconds');
        } else {
          console.error('Error during fetch operation:', fetchError);
        }
        return null;
      }
    } catch (error) {
      // This is the outer try/catch to make absolutely sure the function doesn't throw
      console.error('Unexpected error during balance refresh:', error);
      return null;
    }
  }, [walletAddress]);
  
  // Automatically refresh balance when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      refreshBalance();
    }
  }, [walletAddress, refreshBalance]);
  
  // Set up automatic periodic refresh of wallet balance (every 30 seconds)
  useEffect(() => {
    if (!walletAddress) return;
    
    console.log('Setting up automatic balance refresh for wallet:', walletAddress);
    
    // Do an initial refresh immediately
    refreshBalance();
    
    // Then set up an interval for periodic refreshes
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing wallet balance...');
      refreshBalance();
    }, 30000); // 30 seconds
    
    // Clean up the interval when component unmounts or wallet changes
    return () => {
      console.log('Clearing automatic balance refresh interval');
      clearInterval(intervalId);
    };
  }, [walletAddress, refreshBalance]);
  
  // Copy wallet address to clipboard
  const copyWalletAddress = useCallback(() => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
        .then(() => {
          toast({
            title: "Address Copied",
            description: "Wallet address copied to clipboard",
          });
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          toast({
            title: "Copy Failed",
            description: "Could not copy to clipboard",
            variant: "destructive",
          });
        });
    }
  }, [walletAddress, toast]);
  
  // Login with social provider (only supports real Google OAuth)
  const login = useCallback(async (provider: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting to log in with ${provider}...`);
      
      // Only Google is supported
      if (provider.toLowerCase() !== 'google') {
        throw new Error('Only Google authentication is currently supported');
      }
      
      // Show a visible notification to the user
      toast({
        title: "Google Authentication",
        description: "Redirecting to Google for account authentication...",
        duration: 3000,
      });
      
      console.log(`Redirecting to Google authentication at /api/social-auth/${provider.toLowerCase()}`);
      console.log(`Current Replit domain: ${window.location.origin}`);
      console.log(`Redirect URL will be: ${window.location.href}`);
      
      // Delay redirect slightly to let toast appear
      setTimeout(() => {
        // Redirect to the auth endpoint which will then redirect to Google
        const redirectUrl = window.location.href;
        const authUrl = `/api/social-auth/${provider.toLowerCase()}?redirectUrl=${encodeURIComponent(redirectUrl)}`;
        console.log(`Full auth URL: ${authUrl}`);
        window.location.href = authUrl;
      }, 1500);
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      
      toast({
        title: "Login Failed",
        description: err.message || `Could not connect with ${provider}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Call logout API if needed
      await fetch('/api/social-auth/logout', { method: 'POST' });
      
      // Clear user data
      setIsLoggedIn(false);
      setUserInfo(null);
      setWalletAddress(null);
      setBalance('0');
      
      // Clear from local storage
      localStorage.removeItem('cpxtb_user');
      localStorage.removeItem('cpxtb_last_known_balance');
      
      toast({
        title: "Logout Successful",
        description: "You have been logged out",
      });
    } catch (err: any) {
      console.error('Logout error:', err);
      toast({
        title: "Logout Failed",
        description: err.message || "Could not log out properly",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  return (
    <SocialLoginContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        userInfo,
        walletAddress,
        balance,
        error,
        login,
        logout,
        copyWalletAddress,
        refreshBalance,
      }}
    >
      {children}
    </SocialLoginContext.Provider>
  );
};

export const useSocialLogin = () => {
  const context = useContext(SocialLoginContext);
  
  if (!context) {
    throw new Error('useSocialLogin must be used within a SocialLoginProvider');
  }
  
  return context;
};