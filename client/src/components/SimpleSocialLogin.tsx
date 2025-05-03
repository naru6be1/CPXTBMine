import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { ethers } from 'ethers';
import { BASE_CHAIN_ID } from '@shared/constants';
// Import Buffer directly from our polyfill to ensure it's loaded before Web3Auth
import { Buffer } from '../lib/polyfills';

// Sanity check to ensure Buffer is correctly polyfilled
console.log('Buffer check in SimpleSocialLogin:', {
  directBuffer: typeof Buffer !== 'undefined',
  windowBuffer: typeof window !== 'undefined' && !!window.Buffer,
  globalBuffer: typeof global !== 'undefined' && !!(global as any).Buffer
});

/**
 * Simple social login component with minimal dependencies
 * This is a self-contained component that doesn't rely on other contexts
 */
const SimpleSocialLogin: React.FC = () => {
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
        console.log('Initializing Web3Auth - Buffer status:', {
          windowBuffer: typeof window !== 'undefined' && !!window.Buffer,
          globalBuffer: typeof global !== 'undefined' && !!(global as any).Buffer
        });

        // Check if client ID is available
        if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID) {
          throw new Error("Missing Web3Auth Client ID");
        }

        // Create Web3Auth instance with type assertion to bypass type errors
        // @ts-ignore - Ignoring type errors due to version compatibility issues
        const web3auth = new Web3Auth({
          clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: "sapphire_mainnet",
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x" + BASE_CHAIN_ID.toString(16), // 8453 in hex
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base",
            blockExplorerUrl: "https://basescan.org",
            ticker: "ETH",
            tickerName: "Ethereum",
          }
        });

        // Configure OpenLogin adapter with minimal settings
        // @ts-ignore - Ignoring type errors due to version compatibility issues
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            uxMode: "popup",
            network: "sapphire_mainnet",
          },
        });

        // Add adapter to Web3Auth
        // @ts-ignore - Ignoring type errors due to version compatibility issues
        web3auth.configureAdapter(openloginAdapter);

        // Initialize Web3Auth with empty config to avoid type errors
        // @ts-ignore - Ignoring type errors due to version compatibility issues
        await web3auth.initModal({});
        console.log('Web3Auth initialized successfully');

        // Set state
        setWeb3auth(web3auth);

        // Check if user already logged in
        if (web3auth.connected) {
          setProvider(web3auth.provider);
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
        }

      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
        let message = "Failed to initialize Web3Auth";
        if (error instanceof Error) {
          message = error.message;
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
      console.log("Attempting Web3Auth login...");

      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);

      if (web3auth.connected) {
        const user = await web3auth.getUserInfo();
        setUserInfo(user);
        console.log("User logged in:", user);

        toast({
          title: "Success",
          description: "You've successfully logged in!",
        });
      }
    } catch (error) {
      console.error("Error during login:", error);
      let message = "Failed to login";
      if (error instanceof Error) {
        message = error.message;
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
        description: "Provider not initialized",
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
        <CardTitle>Web3Auth Demo</CardTitle>
        <CardDescription>Social login for blockchain apps</CardDescription>
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

export default SimpleSocialLogin;