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
    const storedUser = localStorage.getItem('cpxtb_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserInfo(userData.userInfo);
        setWalletAddress(userData.walletAddress);
        setBalance(userData.balance || '0');
        setIsLoggedIn(true);
      } catch (err) {
        console.error('Failed to parse stored user data:', err);
        // Clear invalid data
        localStorage.removeItem('cpxtb_user');
      }
    }
  }, []);
  
  // Function to refresh balance
  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      const response = await fetch(`/api/balance?address=${walletAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      setBalance(data.balance);
      
      // Update local storage
      const storedUser = localStorage.getItem('cpxtb_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.balance = data.balance;
        localStorage.setItem('cpxtb_user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('Error refreshing balance:', err);
    }
  }, [walletAddress]);
  
  // Automatically refresh balance when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      refreshBalance();
    }
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
  
  // Login with social provider
  const login = useCallback(async (provider: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulated social authentication
      // In a real implementation, this would interact with OAuth providers
      
      // Mock API call to get user data and create wallet
      const response = await fetch(`/api/social-auth/${provider.toLowerCase()}`);
      
      if (!response.ok) {
        throw new Error(`Authentication with ${provider} failed`);
      }
      
      const data = await response.json();
      
      // Store user data
      let userDetails: UserInfo = {
        name: data.name,
        email: data.email,
        provider: provider
      };
      
      setUserInfo(userDetails);
      setWalletAddress(data.walletAddress);
      setBalance(data.balance || '0');
      setIsLoggedIn(true);
      
      // Save to local storage for persistence
      localStorage.setItem('cpxtb_user', JSON.stringify({
        userInfo: userDetails,
        walletAddress: data.walletAddress,
        balance: data.balance || '0'
      }));
      
      toast({
        title: "Login Successful",
        description: `Connected with ${provider}`,
      });
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