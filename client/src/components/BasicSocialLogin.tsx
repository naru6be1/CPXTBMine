import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2,
  ExternalLink,
  Copy,
  Check,
  RefreshCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BASE_CHAIN_ID, CPXTB_TOKEN_ADDRESS } from '../../../shared/constants';

/**
 * Enhanced social login functionality with persisted state and better wallet simulation
 * This implementation provides a more complete login experience while Web3Auth is being integrated
 */
const BasicSocialLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string, email: string, provider: string } | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [copied, setCopied] = useState(false);
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

  const handleLogin = (provider: string) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate network delay
    setTimeout(() => {
      try {
        // Generate a deterministic wallet address based on the timestamp
        const timestamp = Date.now();
        const seed = timestamp.toString(16);
        const address = '0x' + Array.from({ length: 40 }, (_, i) => {
          const hash = (seed.charCodeAt(i % seed.length) * (i + 1)) % 16;
          return '0123456789abcdef'[hash];
        }).join('');
        
        // Create user info based on selected provider
        let userDetails = {
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
    }, 1500); // Delay for 1.5 seconds
  };

  const handleLogout = () => {
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      try {
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
    }, 800); // Delay for 0.8 seconds
  };

  const copyToClipboard = () => {
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
  
  const refreshBalance = () => {
    // Generate a new random balance
    const newBalance = (Math.random() * 10000).toFixed(2);
    setBalance(newBalance);
    
    toast({
      title: "Balance Updated",
      description: `Your new balance is ${newBalance} CPXTB`,
    });
  };
  
  const openBlockExplorer = () => {
    if (walletAddress) {
      window.open(`https://basescan.org/address/${walletAddress}`, '_blank');
    }
  };

  return (
    <Card className="w-[350px] mx-auto my-4">
      <CardHeader>
        <CardTitle>Social Login</CardTitle>
        <CardDescription>Connect with your favorite provider</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {isLoggedIn && userInfo && walletAddress ? (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-md">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">Logged in via {userInfo.provider}</p>
                  <p className="text-sm text-muted-foreground">{userInfo.email}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1">Wallet Address:</p>
                <div className="flex items-center justify-between bg-background/80 p-2 rounded-md">
                  <p className="text-xs font-mono truncate">{walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}</p>
                  <div className="flex items-center">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8" 
                      onClick={copyToClipboard}
                      title="Copy address to clipboard"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8" 
                      onClick={openBlockExplorer}
                      title="View on BaseScan"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground mb-1">CPXTB Balance:</p>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6" 
                    onClick={refreshBalance}
                    title="Refresh balance"
                  >
                    <RefreshCcw className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xl font-medium">{balance} <span className="text-sm">CPXTB</span></p>
              </div>
            </div>
            
            <div className="bg-primary/5 p-3 rounded-md border border-primary/10">
              <p className="text-xs text-muted-foreground">Connected to <span className="font-medium">Base Network</span></p>
              <p className="text-xs text-muted-foreground">Chain ID: {BASE_CHAIN_ID}</p>
              <p className="text-xs text-muted-foreground mt-1">Token: <span className="font-mono text-[10px]">{CPXTB_TOKEN_ADDRESS.slice(0, 12)}...{CPXTB_TOKEN_ADDRESS.slice(-8)}</span></p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your preferred social provider to connect and create your secure wallet.
            </p>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm">Connecting...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleLogin('google')}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Google
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleLogin('facebook')}
                  disabled={isLoading}
                >
                  <svg viewBox="0 0 36 36" fill="url(#a)" className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient x1="50%" x2="50%" y1="97.078%" y2="0%" id="a">
                        <stop offset="0%" stopColor="#0062E0"/>
                        <stop offset="100%" stopColor="#19AFFF"/>
                      </linearGradient>
                    </defs>
                    <path d="M15 35.8C6.5 34.3 0 26.9 0 18 0 8.1 8.1 0 18 0s18 8.1 18 18c0 8.9-6.5 16.3-15 17.8l-1-.8h-4l-1 .8z"/>
                    <path fill="#FFF" d="m25 23 .8-5H21v-3.5c0-1.4.5-2.5 2.7-2.5H26V7.4c-1.3-.2-2.7-.4-4-.4-4.1 0-7 2.5-7 7v4h-4.5v5H15v12.7c1 .2 2 .3 3 .3s2-.1 3-.3V23h4z"/>
                  </svg>
                  Facebook
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleLogin('twitter')}
                  disabled={isLoading}
                >
                  <svg fill="#1D9BF0" className="h-4 w-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleLogin('apple')}
                  disabled={isLoading}
                >
                  <svg viewBox="0 0 384 512" className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  Apple
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center">
        {isLoggedIn && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              "Disconnect"
            )}
          </Button>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Enhanced Social Login Demo for CPXTB Platform
        </p>
      </CardFooter>
    </Card>
  );
};

export default BasicSocialLogin;