import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

const SocialLoginContext = createContext<SocialLoginContextType | null>(null);

export const SocialLoginProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [copied, setCopied] = useState<boolean>(false);
  const { toast } = useToast();

  // Load saved login state on component mount
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('demoUserInfo');
    const savedWalletAddress = localStorage.getItem('demoWalletAddress');
    
    if (savedUserInfo && savedWalletAddress) {
      setUserInfo(JSON.parse(savedUserInfo));
      setWalletAddress(savedWalletAddress);
      setIsLoggedIn(true);
      
      // Generate a realistic balance
      const randomBalance = (Math.random() * 10000).toFixed(2);
      setBalance(randomBalance);
    }
  }, []);

  const login = async (provider: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a deterministic wallet address based on the timestamp
      const timestamp = Date.now();
      const seed = timestamp.toString(16);
      const address = '0x' + Array.from({ length: 40 }, (_, i) => {
        const hash = (seed.charCodeAt(i % seed.length) * (i + 1)) % 16;
        return '0123456789abcdef'[hash];
      }).join('');
      
      // Create user info based on selected provider
      let userDetails: UserInfo = {
        name: 'Demo User',
        email: 'demo@example.com',
        provider: provider
      };
      
      if (provider === 'google') {
        userDetails.name = 'Google User';
        userDetails.email = 'user@gmail.com';
      } else if (provider === 'facebook') {
        userDetails.name = 'Facebook User';
        userDetails.email = 'user@facebook.com';
      } else if (provider === 'twitter') {
        userDetails.name = 'Twitter User';
        userDetails.email = 'user@twitter.com';
      } else if (provider === 'apple') {
        userDetails.name = 'Apple User';
        userDetails.email = 'user@icloud.com';
      }
      
      // Save to state and localStorage
      setIsLoggedIn(true);
      setUserInfo(userDetails);
      setWalletAddress(address);
      localStorage.setItem('demoUserInfo', JSON.stringify(userDetails));
      localStorage.setItem('demoWalletAddress', address);
      
      // Generate a realistic balance
      const randomBalance = (Math.random() * 10000).toFixed(2);
      setBalance(randomBalance);
      
      toast({
        title: "Authentication Successful",
        description: `You've logged in with ${provider}!`,
      });
    } catch (error) {
      console.error("Error during login:", error);
      setError("Login failed. Please try again.");
      
      toast({
        title: "Login Error",
        description: "Failed to login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Clear state and localStorage
      setIsLoggedIn(false);
      setUserInfo(null);
      setWalletAddress(null);
      localStorage.removeItem('demoUserInfo');
      localStorage.removeItem('demoWalletAddress');
      
      toast({
        title: "Logout Successful",
        description: "You've been logged out",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Logout Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyWalletAddress = (): void => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const refreshBalance = (): void => {
    // Generate a new random balance
    const newBalance = (Math.random() * 10000).toFixed(2);
    setBalance(newBalance);
    
    toast({
      title: "Balance Updated",
      description: `Your new balance is ${newBalance} CPXTB`,
    });
  };

  const value = {
    isLoggedIn,
    isLoading,
    userInfo,
    walletAddress,
    balance,
    error,
    login,
    logout,
    copyWalletAddress,
    refreshBalance
  };

  return (
    <SocialLoginContext.Provider value={value}>
      {children}
    </SocialLoginContext.Provider>
  );
};

export const useSocialLogin = () => {
  const context = useContext(SocialLoginContext);
  if (!context) {
    throw new Error("useSocialLogin must be used within a SocialLoginProvider");
  }
  return context;
};