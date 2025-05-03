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
        setIsInitializing(true);
        setError(null);
        
        // Step 1: Check Buffer availability (required for Web3Auth)
        const bufferStatus = {
          windowBuffer: typeof window !== 'undefined' && !!window.Buffer,
          globalBuffer: typeof global !== 'undefined' && !!(global as any).Buffer
        };
        
        console.log('Initializing Web3Auth - Buffer status:', bufferStatus);
        
        if (!bufferStatus.windowBuffer && !bufferStatus.globalBuffer) {
          console.error("Buffer is not available in either window or global scope");
          throw new Error("Buffer polyfill not initialized correctly");
        }

        // Step 2: Verify environment variables
        const clientIdStatus = { 
          exists: !!import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
          value: import.meta.env.VITE_WEB3AUTH_CLIENT_ID ? 
                import.meta.env.VITE_WEB3AUTH_CLIENT_ID.substring(0, 5) + "..." : "undefined" 
        };
        
        console.log("Web3Auth Client ID check:", clientIdStatus);
        
        if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID) {
          throw new Error("Missing Web3Auth Client ID");
        }

        console.log("Step 3: Creating Web3Auth instance...");
        
        // Create Web3Auth instance with type assertion to bypass type errors
        // @ts-ignore - Ignoring type errors due to version compatibility issues
        const web3auth = new Web3Auth({
          clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
          // Try different Web3Auth network options
          web3AuthNetwork: "sapphire_mainnet", // Options: sapphire_mainnet, sapphire_devnet, cyan
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x" + BASE_CHAIN_ID.toString(16), // 8453 in hex
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base",
            blockExplorerUrl: "https://basescan.org",
            ticker: "ETH",
            tickerName: "Ethereum",
          },
          // Required for Web3Auth to work properly
          privateKeyProvider: {
            name: 'custom-pkp',
            options: {
              encryptionKey: 'web3auth-default-pkp',
            }
          }
        });
        
        console.log("Web3Auth instance created successfully");

        // Configure OpenLogin adapter with client secret for server-side verification
        // @ts-ignore - Ignoring type errors due to version compatibility issues
        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: "none",
          },
          adapterSettings: {
            uxMode: "popup",
            network: "sapphire_mainnet",
            clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
            // The client secret should be available from environment variables
            // but doesn't need to be exposed to the frontend code directly
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
          
          // Provide more user-friendly error messages for common initialization issues
          if (message.includes("Buffer")) {
            message = "Web3Auth dependency error: Buffer not available. This is a technical issue that needs to be fixed by the developers.";
          } else if (message.includes("Client ID")) {
            message = "Web3Auth setup error: Client ID is missing or invalid. Please contact support.";
          } else if (message.includes("network")) {
            message = "Web3Auth network error: Cannot connect to authentication service. Please check your internet connection.";
          } else if (message.includes("adapter")) {
            message = "Web3Auth configuration error: Login adapter not properly configured.";
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
      console.error("Web3Auth instance not found when attempting login");
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

      // Step 1: Connect to the Web3Auth provider
      console.log("Connecting to Web3Auth provider...");
      const web3authProvider = await web3auth.connect();
      console.log("Web3Auth provider connected successfully");
      setProvider(web3authProvider);

      // Step 2: Check connection and get user info
      if (web3auth.connected) {
        console.log("Web3Auth connection confirmed, retrieving user info...");
        const user = await web3auth.getUserInfo();
        setUserInfo(user);
        console.log("User logged in successfully:", {
          name: user.name || 'Unknown',
          email: user.email ? `${user.email.substring(0, 3)}...` : 'Not available',
          profileImage: user.profileImage ? 'Available' : 'Not available'
        });

        toast({
          title: "Success",
          description: "You've successfully logged in!",
        });
      } else {
        console.warn("Web3Auth provider connected but web3auth.connected is false");
        throw new Error("Web3Auth connection unsuccessful");
      }
    } catch (error) {
      console.error("Error during login:", error);
      let message = "Failed to login";
      
      if (error instanceof Error) {
        message = error.message;
        
        // Handle common Web3Auth errors with more user-friendly messages
        if (message.includes("popup")) {
          message = "Popup was blocked. Please allow popups for this site.";
        } else if (message.includes("timeout")) {
          message = "Login timed out. Please try again with a faster connection.";
        } else if (message.includes("cancelled")) {
          message = "Login was cancelled by the user.";
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
      console.error("Attempted to get address without an initialized provider");
      toast({
        title: "Error",
        description: "Provider not initialized. Please login first.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Getting wallet address from provider...");
      const ethersProvider = new ethers.BrowserProvider(provider as any);
      console.log("Created ethers provider successfully");
      
      const signer = await ethersProvider.getSigner();
      console.log("Got signer from provider");
      
      const address = await signer.getAddress();
      console.log("Retrieved wallet address:", address);
      
      // Add copy-to-clipboard functionality by showing a longer toast
      toast({
        title: "Your Wallet Address",
        description: address,
        duration: 5000, // Show for 5 seconds to give time to copy
      });
      
      return address;
    } catch (error) {
      console.error("Error getting wallet address:", error);
      
      let errorMessage = "Failed to get wallet address";
      if (error instanceof Error) {
        // Provide more specific error messages based on the error
        if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("user rejected")) {
          errorMessage = "Request was rejected. Please try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        }
      }
      
      toast({
        title: "Wallet Error",
        description: errorMessage,
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