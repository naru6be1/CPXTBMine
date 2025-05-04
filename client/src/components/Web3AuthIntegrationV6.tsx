import React, { useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { BASE_CHAIN_ID } from "@shared/constants";

// Make sure Buffer is available
import { Buffer } from '../lib/polyfills';

// Types
interface UserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
}

/**
 * Web3Auth Integration Component V6
 * Updated for Web3Auth v6.1.4 API compatibility
 */
const Web3AuthIntegrationV6: React.FC = () => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        console.log("Initializing Web3Auth with v6 API...");
        setIsInitializing(true);
        setError(null);
        
        if (!window.Buffer) {
          console.log("Adding Buffer polyfill...");
          window.Buffer = Buffer;
        }
        
        if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID) {
          throw new Error("VITE_WEB3AUTH_CLIENT_ID is not set");
        }

        // Create the Web3Auth instance with v6 API
        const web3authInstance = new Web3Auth({
          clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: "mainnet", // mainnet, testnet
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x" + BASE_CHAIN_ID.toString(16), // Base Mainnet in hex
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base Mainnet",
            blockExplorer: "https://basescan.org",
            ticker: "ETH",
            tickerName: "Ethereum",
          },
        });

        // Configure OpenLogin adapter - simpler config for v6
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: "mainnet",
            clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
          },
        });
        
        web3authInstance.configureAdapter(openloginAdapter);
        
        // Try initialization with more detailed error handling
        try {
          await web3authInstance.initModal();
          console.log("Web3Auth initialized successfully");
        } catch (initError: any) {
          console.error("Web3Auth initialization error:", initError);
          // Check for connectivity errors specifically
          if (
            initError.message?.includes("network") ||
            initError.message?.includes("fetch") ||
            initError.message?.includes("openlogin") ||
            initError.message?.includes("Failed to") ||
            initError.message?.includes("timeout")
          ) {
            throw new Error("Network connectivity issue with Web3Auth services. Please check your internet connection or network restrictions.");
          }
          throw initError;
        }
        
        setWeb3auth(web3authInstance);
        
        // Check if already connected
        if (web3authInstance.connected) {
          const provider = web3authInstance.provider;
          setProvider(provider);
          if (provider) {
            getUserInfo(web3authInstance);
            getWalletAddress(provider);
          }
        }
        
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to initialize Web3Auth");
        }
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  const getUserInfo = async (web3authInstance: Web3Auth) => {
    if (!web3authInstance) return;
    try {
      const userInfo = await web3authInstance.getUserInfo();
      setUserInfo(userInfo);
    } catch (error) {
      console.error("Error getting user info:", error);
    }
  };

  const getWalletAddress = async (provider: SafeEventEmitterProvider) => {
    if (!provider) return;
    try {
      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (error) {
      console.error("Error getting wallet address:", error);
    }
  };

  const login = async () => {
    if (!web3auth) {
      setError("Web3Auth not initialized");
      return;
    }
    try {
      setLoading(true);
      
      // Check for connectivity to app.openlogin.com first
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch("https://app.openlogin.com/favicon.ico", { 
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal 
        });
        clearTimeout(timeout);
      } catch (e) {
        throw new Error("Cannot connect to Web3Auth services (app.openlogin.com). This might be due to network restrictions or DNS issues.");
      }
      
      // Now try to connect with timeout
      const loginPromise = web3auth.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timed out. Please try again.")), 15000);
      });
      
      // Race the login against a timeout
      const provider = await Promise.race([loginPromise, timeoutPromise]) as SafeEventEmitterProvider;
      
      setProvider(provider);
      
      if (web3auth.connected) {
        getUserInfo(web3auth);
        getWalletAddress(provider);
        setError(null);
      } else {
        setError("Failed to connect. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to login");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!web3auth) {
      setError("Web3Auth not initialized");
      return;
    }
    try {
      setLoading(true);
      await web3auth.logout();
      setProvider(null);
      setUserInfo(null);
      setWalletAddress(null);
    } catch (error) {
      console.error("Logout error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to logout");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        description: "Wallet address copied to clipboard",
      });
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Initializing Web3Auth</CardTitle>
          <CardDescription>Setting up secure authentication...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !provider) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Web3Auth Error</CardTitle>
          <CardDescription>There was a problem with Web3Auth</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <p className="mt-4 text-sm text-muted-foreground">
            Please try again or use the Basic Social Login instead, which works on all networks.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Web3Auth Demo</CardTitle>
        <CardDescription>Login with your social accounts</CardDescription>
      </CardHeader>
      <CardContent>
        {userInfo ? (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-md">
              <h3 className="font-medium mb-1">Logged in as:</h3>
              <p>{userInfo.email || "Unknown user"}</p>
              
              {userInfo.name && (
                <p className="text-sm text-muted-foreground">{userInfo.name}</p>
              )}
              
              {walletAddress && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium">Wallet Address:</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                    {walletAddress}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Button
            onClick={login}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
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
      
      {userInfo && (
        <CardFooter>
          <Button
            variant="outline"
            onClick={logout}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              "Logout"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default Web3AuthIntegrationV6;