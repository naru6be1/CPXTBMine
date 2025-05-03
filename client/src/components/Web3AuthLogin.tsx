import React, { useEffect, useState } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BASE_CHAIN_ID } from '@shared/constants';

// Define a more flexible user info type to accommodate the Web3Auth response
type UserInfo = {
  email?: string;
  name?: string;
  profileImage?: string;
  [key: string]: any;
};

/**
 * Web3Auth Login Component - This is our core social login solution
 * This component implements the Web3Auth Modal SDK with OpenLogin adapter
 * for a comprehensive social login experience
 */
const Web3AuthLogin: React.FC = () => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        console.log("Initializing Web3Auth...");
        setIsInitializing(true);
        setError(null);
        
        if (!window.Buffer) {
          console.log("Adding Buffer polyfill...");
          window.Buffer = window.Buffer || require("buffer").Buffer;
        }
        
        if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID) {
          throw new Error("WEB3AUTH_CLIENT_ID is not set");
        }

        // Create Web3Auth instance with required configuration
        // @ts-ignore - Ignoring type issues due to API version mismatch
        const web3auth = new Web3Auth({
          clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x" + BASE_CHAIN_ID.toString(16), // 8453 in hex
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base",
            blockExplorerUrl: "https://basescan.org",
            ticker: "ETH",
            tickerName: "Ethereum",
          },
          web3AuthNetwork: "sapphire_mainnet",
          // @ts-ignore - Ignoring type errors due to API change
          uiConfig: {
            appName: "CPXTB Platform",
            theme: "dark",
            loginMethodsOrder: ["google", "facebook", "twitter", "email_passwordless"],
            defaultLanguage: "en",
            appLogo: "https://cpxtbmining.com/assets/logo.png",
          }
        });
        
        // Create and configure the OpenLogin adapter
        // @ts-ignore - Ignoring type errors due to version compatibility
        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: "none"
          },
          adapterSettings: {
            clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
            network: "sapphire_mainnet",
            uxMode: "popup",
          }
        });
        
        // Add the OpenLogin adapter to Web3Auth
        // @ts-ignore - Ignoring type errors due to version compatibility
        web3auth.configureAdapter(openloginAdapter);
        
        // Initialize Web3Auth
        await web3auth.initModal();
        setWeb3auth(web3auth);
        
        // Check if user already logged in
        if (web3auth.connected) {
          setProvider(web3auth.provider);
          try {
            // @ts-ignore - Type inconsistency between versions
            const userInfo = await web3auth.getUserInfo();
            setUserInfo(userInfo as UserInfo);
          } catch (error) {
            console.error("Error getting user info:", error);
          }
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
        // @ts-ignore - Type inconsistency between versions
        const user = await web3auth.getUserInfo();
        setUserInfo(user as UserInfo);
        
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

export default Web3AuthLogin;