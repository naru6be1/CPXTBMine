import React, { useEffect, useState } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BASE_CHAIN_ID } from '@shared/constants';

interface UserInfo {
  name?: string;
  email?: string;
  profileImage?: string;
}

const Web3AuthIntegration: React.FC = () => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        console.log("Initializing Web3Auth with correct configuration...");
        setInitializing(true);
        setError(null);
        
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
        
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig }
        });
        
        // Create a minimal config object for Web3Auth initialization
        const web3authConfig = {
          clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: "mainnet", 
          chainConfig,
          uiConfig: {
            appName: "CPXTB Platform",
            theme: "light",
            defaultLanguage: "en"
          }
        };
        
        // Completely bypass TypeScript to avoid version compatibility issues
        // This is necessary due to breaking changes between Web3Auth versions
        const Web3AuthConstructor = Web3Auth as any;
        const web3AuthInstance = new Web3AuthConstructor(web3authConfig);
        
        try {
          await web3AuthInstance.initModal();
          console.log("Web3Auth modal initialized successfully");
          setWeb3auth(web3AuthInstance);
          
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
          }
        } catch (modalError) {
          console.error("Error initializing Web3Auth modal:", modalError);
          setError("Failed to initialize Web3Auth modal. This could be a network issue or an incompatibility with your browser.");
          toast({
            title: "Initialization Error",
            description: "Could not initialize Web3Auth modal. Please try again later or use a different browser.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Critical Web3Auth error:", error);
        setError(error?.message || "Web3Auth setup failed");
        toast({
          title: "Web3Auth Error",
          description: error?.message || "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setInitializing(false);
      }
    };

    initWeb3Auth();
  }, [toast]);

  const login = async () => {
    if (!web3auth) {
      setError("Web3Auth is not initialized");
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
        
        toast({
          title: "Login Successful",
          description: "You've successfully connected your wallet",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error?.message || "Failed to login");
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

  if (initializing) {
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
        <CardTitle>Web3Auth Integration</CardTitle>
        <CardDescription>Connect with your social accounts</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {userInfo && walletAddress ? (
          <div className="space-y-4">
            <div className="p-3 bg-secondary rounded-md">
              <p className="font-medium">Logged in as:</p>
              <p className="text-sm truncate">{userInfo.email || userInfo.name || "Unknown user"}</p>
              <p className="text-xs text-muted-foreground mt-2">Wallet Address:</p>
              <p className="text-xs font-mono truncate">{walletAddress}</p>
            </div>
          </div>
        ) : (
          <Button 
            className="w-full" 
            onClick={login}
            disabled={loading || !web3auth}
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
      <CardFooter>
        {userInfo && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={logout}
            disabled={loading}
          >
            Logout
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default Web3AuthIntegration;