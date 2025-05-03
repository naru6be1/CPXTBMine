import React, { useEffect, useState, useCallback } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BASE_CHAIN_ID } from '@shared/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UserInfo {
  name?: string;
  email?: string;
  profileImage?: string;
}

enum ConnectionState {
  Initializing = 'initializing',
  Connected = 'connected',
  Disconnected = 'disconnected',
  Error = 'error',
  NetworkError = 'network_error',
}

// Simple network connectivity check
const checkConnectivity = async (): Promise<boolean> => {
  try {
    // Try to fetch a small resource to test connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.error('Network connectivity test failed:', error);
    return false;
  }
};

const Web3AuthIntegration: React.FC = () => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Initializing);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [attempts, setAttempts] = useState<number>(0);
  const { toast } = useToast();
  
  // Network status checker
  const checkNetworkStatus = useCallback(async () => {
    const online = await checkConnectivity();
    setIsOnline(online);
    return online;
  }, []);
  
  // Initialize Web3Auth with better error handling
  const initWeb3Auth = useCallback(async () => {
    try {
      console.log("Initializing Web3Auth with enhanced error handling...");
      setConnectionState(ConnectionState.Initializing);
      setError(null);
      
      // First check for internet connectivity
      const isConnected = await checkNetworkStatus();
      if (!isConnected) {
        setConnectionState(ConnectionState.NetworkError);
        setError("Network connectivity issue detected. Please check your internet connection.");
        return;
      }
      
      // Make sure Buffer is available (required by Web3Auth)
      if (typeof window !== "undefined" && !window.Buffer) {
        window.Buffer = window.Buffer || require("buffer").Buffer;
      }
      
      if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID) {
        throw new Error("WEB3AUTH_CLIENT_ID environment variable is not set");
      }
      
      // Create the private key provider with the correct chain config
      const chainConfig = {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x" + BASE_CHAIN_ID.toString(16), // Base mainnet (8453) in hex
        rpcTarget: "https://mainnet.base.org",
        displayName: "Base",
        blockExplorer: "https://basescan.org",
        ticker: "ETH",
        tickerName: "Ethereum",
      };
      
      // Create a minimal config object for Web3Auth initialization
      const web3authConfig = {
        clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
        web3AuthNetwork: "mainnet", 
        chainConfig,
        uiConfig: {
          appName: "CPXTB Platform",
          theme: "light",
          defaultLanguage: "en",
          // Setting to in-app browser mode to help with mobile redirects
          mfaSettings: {
            deviceShareFactor: { enable: false },
            totpFactor: { enable: false },
          },
          modalZIndex: "99999",
        },
        // Add 5 second timeout for better mobile experience
        sessionTime: 86400,
        enableLogging: true,
      };
      
      try {
        // Completely bypass TypeScript to avoid version compatibility issues
        const Web3AuthConstructor = Web3Auth as any;
        const web3AuthInstance = new Web3AuthConstructor(web3authConfig);
        
        // Set a timeout for initialization to avoid hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Web3Auth initialization timed out")), 10000);
        });
        
        await Promise.race([web3AuthInstance.initModal(), timeoutPromise]);
        
        console.log("Web3Auth modal initialized successfully");
        setWeb3auth(web3AuthInstance);
        setConnectionState(ConnectionState.Connected);
        
        // Check if user is already logged in
        if (web3AuthInstance.connected) {
          const provider = web3AuthInstance.provider;
          if (provider) {
            const ethersProvider = new ethers.BrowserProvider(provider as any);
            const signer = await ethersProvider.getSigner();
            const address = await signer.getAddress();
            setWalletAddress(address);
            
            try {
              const userInfo = await web3AuthInstance.getUserInfo();
              setUserInfo(userInfo);
            } catch (userError) {
              console.error("Error getting user info:", userError);
            }
          }
        } else {
          setConnectionState(ConnectionState.Disconnected);
        }
      } catch (modalError: any) {
        console.error("Error initializing Web3Auth modal:", modalError);
        
        // Detect specific network errors related to the openlogin servers
        const errorMessage = modalError?.message || String(modalError);
        console.log("Web3Auth error detected:", errorMessage);
        
        // This is a common DNS issue specifically with app.openlogin.com
        if (errorMessage.includes("DNS") && errorMessage.includes("app.openlogin.com")) {
          setConnectionState(ConnectionState.NetworkError);
          setError("DNS resolution failed for app.openlogin.com. This is a known issue with some network providers and mobile carriers.");
        }
        // Other network-related issues
        else if (errorMessage.includes("DNS") || 
            errorMessage.includes("network") || 
            errorMessage.includes("timeout") ||
            errorMessage.includes("Failed to fetch") ||
            errorMessage.includes("app.openlogin.com")) {
          setConnectionState(ConnectionState.NetworkError);
          setError("Cannot reach authentication servers. This could be due to network restrictions or a temporary outage.");
        } else {
          setConnectionState(ConnectionState.Error);
          setError(`Initialization error: ${errorMessage}`);
        }
        
        toast({
          title: "Web3Auth Error",
          description: "Could not initialize authentication service. Please check your network connection.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Critical Web3Auth error:", error);
      setConnectionState(ConnectionState.Error);
      setError(error?.message || "Web3Auth setup failed");
      toast({
        title: "Web3Auth Error",
        description: error?.message || "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [toast, checkNetworkStatus]);

  const retryInitialization = async () => {
    setAttempts(prev => prev + 1);
    await initWeb3Auth();
  };

  useEffect(() => {
    initWeb3Auth();
    
    // Add event listeners for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      // Retry initialization if we were previously offline
      if (connectionState === ConnectionState.NetworkError) {
        retryInitialization();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionState(ConnectionState.NetworkError);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initWeb3Auth, connectionState]);

  const login = async () => {
    if (!web3auth) {
      setError("Web3Auth is not initialized");
      return;
    }
    
    // Double-check online status before attempting login
    const online = await checkNetworkStatus();
    if (!online) {
      setConnectionState(ConnectionState.NetworkError);
      setError("Cannot login without network connection");
      return;
    }
    
    try {
      setLoading(true);
      const provider = await web3auth.connect();
      
      if (provider) {
        const ethersProvider = new ethers.BrowserProvider(provider as any);
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        
        const userInfo = await web3auth.getUserInfo();
        setUserInfo(userInfo);
        setConnectionState(ConnectionState.Connected);
        
        toast({
          title: "Login Successful",
          description: "You've successfully connected your wallet",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Check for network errors during login
      if (error?.message?.includes("network") || 
          error?.message?.includes("Failed to fetch") ||
          error?.message?.includes("openlogin") ||
          error?.message?.includes("timeout")) {
        setConnectionState(ConnectionState.NetworkError);
        setError("Cannot reach authentication servers. Please check your network connection.");
      } else {
        setConnectionState(ConnectionState.Error);
        setError(error?.message || "Failed to login");
      }
      
      toast({
        title: "Login Failed",
        description: error?.message || "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!web3auth) {
      setError("Web3Auth is not initialized");
      return;
    }
    
    try {
      setLoading(true);
      await web3auth.logout();
      setUserInfo(null);
      setWalletAddress(null);
      setConnectionState(ConnectionState.Disconnected);
      
      toast({
        title: "Logout Successful",
        description: "You've been logged out",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: error?.message || "An error occurred during logout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show different UI based on connection state
  if (connectionState === ConnectionState.Initializing) {
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

  if (connectionState === ConnectionState.NetworkError) {
    const isDnsError = error?.includes("DNS") && error?.includes("app.openlogin.com");
    
    return (
      <Card className="w-[350px] mx-auto my-4">
        <CardHeader>
          <CardTitle>{isDnsError ? "DNS Resolution Error" : "Network Issue"}</CardTitle>
          <CardDescription>
            {isDnsError 
              ? "Cannot resolve app.openlogin.com" 
              : "Cannot access authentication services"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>
              {isDnsError ? "DNS Lookup Failed" : "Connection Error"}
            </AlertTitle>
            <AlertDescription>
              {isDnsError 
                ? "Your device cannot resolve app.openlogin.com. This is a known issue with some mobile networks and carriers."
                : "Unable to reach authentication servers. This may be due to network restrictions or a temporary outage."}
            </AlertDescription>
          </Alert>
          
          <p className="text-sm mb-4">
            {isDnsError
              ? "This is likely due to DNS restrictions on your mobile network. Try using a different network (like WiFi instead of cellular) or use the Basic Social Login demo instead."
              : "Authentication requires access to Web3Auth servers. Please check your internet connection and ensure you're not behind a restrictive firewall."}
          </p>
          
          <div className="flex justify-center">
            <Button onClick={retryInitialization} className="mt-2 flex gap-2 items-center">
              <RefreshCw className="h-4 w-4" /> 
              Retry Connection
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Attempt {attempts + 1} of 3. {isDnsError 
            ? "The Basic Social Login demo doesn't require DNS resolution for app.openlogin.com." 
            : "Use the basic demo option if this persists."}
        </CardFooter>
      </Card>
    );
  }

  // Normal UI for connected or error states
  return (
    <Card className="w-[350px] mx-auto my-4">
      <CardHeader>
        <CardTitle>Web3Auth Integration</CardTitle>
        <CardDescription>Connect with your social accounts</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {connectionState === ConnectionState.Connected && userInfo && walletAddress ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-2">
              <Wifi className="h-4 w-4" />
              <span>Connected to authentication services</span>
            </div>
            
            <div className="p-3 bg-secondary rounded-md">
              <p className="font-medium">Logged in as:</p>
              <p className="text-sm truncate">{userInfo.email || userInfo.name || "Unknown user"}</p>
              <p className="text-xs text-muted-foreground mt-2">Wallet Address:</p>
              <p className="text-xs font-mono truncate">{walletAddress}</p>
            </div>
          </div>
        ) : (
          <>
            <div className={`flex items-center gap-2 text-sm ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'} mb-4`}>
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" />
                  <span>Ready to connect</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  <span>Network issues detected</span>
                </>
              )}
            </div>
            
            <Button 
              className="w-full" 
              onClick={login}
              disabled={loading || !web3auth || !isOnline}
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
          </>
        )}
      </CardContent>
      <CardFooter>
        {connectionState === ConnectionState.Connected && userInfo ? (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={logout}
            disabled={loading}
          >
            Logout
          </Button>
        ) : connectionState === ConnectionState.Error && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={retryInitialization}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default Web3AuthIntegration;