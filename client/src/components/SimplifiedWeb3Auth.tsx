import React, { useEffect, useState } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BASE_CHAIN_ID } from '@shared/constants';

interface UserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
}

/**
 * A simplified Web3Auth login component focusing on core functionality
 * with minimal configuration options to reduce compatibility issues
 */
const SimplifiedWeb3Auth: React.FC = () => {
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
        console.log("Initializing Web3Auth (Simplified)...");
        setInitializing(true);
        
        // Only the bare minimum configuration to avoid version disparities
        // @ts-ignore - Type issues due to version mismatch
        const web3authInstance = new Web3Auth({
          clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: "mainnet",
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base",
            blockExplorer: "https://basescan.org",
            ticker: "ETH",
            tickerName: "Ethereum",
          },
        });

        try {
          await web3authInstance.initModal();
          console.log("Web3Auth modal initialized successfully");
          setWeb3auth(web3authInstance);

          // Check if already logged in
          if (web3authInstance.connected) {
            const provider = web3authInstance.provider;
            const ethersProvider = new ethers.BrowserProvider(provider as any);
            const signer = await ethersProvider.getSigner();
            const address = await signer.getAddress();
            setWalletAddress(address);
            
            try {
              // @ts-ignore
              const user = await web3authInstance.getUserInfo();
              setUserInfo(user);
            } catch (userError) {
              console.error("Error getting user info:", userError);
            }
          }
        } catch (initError) {
          console.error("Error initializing Web3Auth modal:", initError);
          setError("Failed to initialize Web3Auth modal. Please check your browser settings.");
          toast({
            title: "Initialization Error",
            description: "Could not initialize Web3Auth. This could be due to browser privacy settings or extensions.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Critical Web3Auth error:", error);
        setError("Web3Auth setup failed. Please try again later.");
      } finally {
        setInitializing(false);
      }
    };

    initWeb3Auth();
  }, [toast]);

  const handleLogin = async () => {
    if (!web3auth) {
      toast({
        title: "Error",
        description: "Web3Auth not initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Connect
      const provider = await web3auth.connect();
      
      if (web3auth.connected) {
        try {
          // Get wallet address
          const ethersProvider = new ethers.BrowserProvider(provider as any);
          const signer = await ethersProvider.getSigner();
          const address = await signer.getAddress();
          setWalletAddress(address);
          
          // Get user info
          // @ts-ignore - Type issues due to version mismatch
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
          
          toast({
            title: "Login Successful",
            description: "You've successfully logged in!",
          });
        } catch (error) {
          console.error("Error getting user info or wallet:", error);
          setError("Connected but couldn't get user details.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      let message = "Unable to login. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("popup")) {
          message = "Popup blocked. Please allow popups for this site.";
        } else if (error.message.includes("cancel")) {
          message = "Login was cancelled.";
        }
      }
      
      setError(message);
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!web3auth) return;

    try {
      setLoading(true);
      await web3auth.logout();
      setUserInfo(null);
      setWalletAddress(null);
      toast({
        title: "Logged Out",
        description: "You've been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Loading Web3Auth</CardTitle>
          <CardDescription>Initializing social login...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Simplified Web3Auth</CardTitle>
        <CardDescription>Login with your social account to access blockchain features</CardDescription>
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
              
              {walletAddress && (
                <>
                  <p className="font-medium mt-2">Wallet Address:</p>
                  <p className="text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                    {walletAddress}
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <Button
            onClick={handleLogin}
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
            onClick={handleLogout}
            disabled={loading}
            className="w-full"
          >
            Logout
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default SimplifiedWeb3Auth;