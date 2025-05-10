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
  refreshBalance: () => void;
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
  refreshBalance: () => {},
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
  
  // Load user data from local storage on component mount
  useEffect(() => {
    console.log('SocialLoginProvider initializing...');
    console.log('Current URL path:', window.location.pathname);
    console.log('URL parameters:', window.location.search);
    console.log('Is QR code payment page:', window.location.pathname.startsWith('/pay/'));
    
    const storedUser = localStorage.getItem('cpxtb_user');
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('Found stored user data:', userData);
        
        // Additional logging for social login with QR code scenarios
        const isQrCodePage = window.location.pathname.startsWith('/pay/');
        const hasLoggedInParam = new URLSearchParams(window.location.search).has('loggedIn');
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
      const hasLoggedInParam = new URLSearchParams(window.location.search).has('loggedIn');
      console.log('Social login state for QR code:', { 
        isQrCodePage, 
        hasLoggedInParam,
        userDataPresent: false 
      });
    }
  }, []);
  
  // Function to refresh balance
  const refreshBalance = useCallback(async () => {
    if (!walletAddress) {
      console.log('No wallet address available, skipping balance refresh');
      return;
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
          // Don't throw here, just log the error and continue
          console.log('Balance refresh failed, will try again next cycle');
          // Don't reset the balance on failure - keep the last known good value
          return; // Return early but don't break the refresh cycle
        }
        
        const data = await response.json();
        console.log(`Retrieved balance: ${data.balance} CPXTB for wallet ${data.walletAddress}`);
        setBalance(data.balance);
        
        // Save the non-zero balance as the "last known good balance" for future use
        // This helps during deployment transitions when the balance API may temporarily fail
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
        return; // Return early but don't break the refresh cycle
      }
    } catch (error) {
      // This is the outer try/catch to make absolutely sure the function doesn't throw
      console.error('Unexpected error during balance refresh:', error);
      // Don't throw the error - just log it and continue
      // This prevents the periodic refresh from breaking
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