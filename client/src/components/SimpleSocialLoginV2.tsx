import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base';
import { ethers } from 'ethers';
import { BASE_CHAIN_ID } from '@shared/constants';
// Import Buffer directly from our polyfill to ensure it's loaded before Web3Auth
import { Buffer } from '../lib/polyfills';

/**
 * Simplified social login component with Web3Auth integration
 * Minimal configuration to avoid type errors
 */
const SimpleSocialLoginV2: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const { toast } = useToast();

  // Initialize Web3Auth
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        // Verify environment variables
        if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID) {
          throw new Error("Missing Web3Auth Client ID");
        }

        console.log("Creating Web3Auth instance...");
        
        // Create Web3Auth instance with absolute minimal configuration
        // We're using a dynamic cast approach to avoid TypeScript errors
        // since there seems to be typings incompatibility
        const web3AuthConstructor = Web3Auth as any;
        const web3auth = new web3AuthConstructor({
          clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: "sapphire_mainnet",
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x" + BASE_CHAIN_ID.toString(16), // 8453 in hex
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base",
            blockExplorerUrl: "https://basescan.org",
            ticker: "ETH",
            tickerName: "Ethereum"
          }
        });
        
        // Initialize Web3Auth
        await web3auth.initModal();
        setWeb3auth(web3auth);
        
        // Check if user already logged in
        if (web3auth.connected) {
          setProvider(web3auth.provider);
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
        }
        
        console.log('Web3Auth initialized successfully');
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
        let message = "Failed to initialize Web3Auth";
        
        if (error instanceof Error) {
          message = error.message;
          
          // Provide more user-friendly error messages
          if (message.includes("Buffer")) {
            message = "Technical error: Buffer not available";
          } else if (message.includes("Client ID")) {
            message = "Setup error: Web3Auth Client ID is missing";
          }
        }
        
        setError(message);
        toast({
          title: "Initialization Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [toast]);

  const login = async () => {
    if (!web3auth) {
      toast({
        title: "Error",
        description: "Web3Auth not initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Connect to Web3Auth provider
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      
      // Get user info if connected
      if (web3auth.connected) {
        const user = await web3auth.getUserInfo();
        setUserInfo(user);
        
        toast({
          title: "Success",
          description: "You've successfully logged in!",
        });
      } else {
        throw new Error("Login unsuccessful");
      }
    } catch (error) {
      console.error("Error during login:", error);
      let message = "Failed to login";
      
      if (error instanceof Error) {
        message = error.message;
        
        // Handle common errors
        if (message.includes("popup")) {
          message = "Popup was blocked. Please allow popups for this site.";
        } else if (message.includes("cancelled")) {
          message = "Login was cancelled.";
        }
      }
      
      setError(message);
      toast({
        title: "Login Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!web3auth) return;

    try {
      setIsLoading(true);
      await web3auth.logout();
      setProvider(null);
      setUserInfo(null);
      toast({
        title: "Success",
        description: "You've been logged out",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Logout Error",
        description: error instanceof Error ? error.message : "Failed to logout",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAddress = async () => {
    if (!provider) {
      toast({
        title: "Error",
        description: "Provider not initialized. Please login first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      
      toast({
        title: "Your Wallet Address",
        description: address,
        duration: 5000, // Show for 5 seconds
      });
      
      return address;
    } catch (error) {
      console.error("Error getting address:", error);
      toast({
        title: "Error",
        description: "Failed to get wallet address",
        variant: "destructive",
      });
    }
  };

  if (isInitializing) {
    return (
      <Card className="w-[350px] mx-auto my-4">
        <CardHeader>
          <CardTitle>Initializing</CardTitle>
          <CardDescription>Setting up Web3Auth...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[350px] mx-auto my-4">
      <CardHeader>
        <CardTitle>Web3Auth Login</CardTitle>
        <CardDescription>Connect with your social account</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {userInfo ? (
          <div className="space-y-4">
            <div className="p-3 bg-secondary rounded-md">
              <p className="font-medium">Logged in as:</p>
              <p className="text-sm truncate">{userInfo.email || userInfo.name || "Unknown user"}</p>
            </div>
            <Button 
              className="w-full" 
              onClick={getAddress}
              disabled={isLoading}
            >
              Show My Wallet Address
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full" 
            onClick={login}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Login with Social Account"
            )}
          </Button>
        )}
      </CardContent>
      <CardFooter>
        {userInfo && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={logout}
            disabled={isLoading}
          >
            Logout
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default SimpleSocialLoginV2;