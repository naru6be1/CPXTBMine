import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import BasicSocialLogin from "@/components/BasicSocialLogin";
import { checkConnectivity, checkDnsResolution } from "@/lib/network-utils";

/**
 * Easy Auth Page - A simplified login page with automatic fallback
 * This page first tries Web3Auth and automatically falls back to BasicSocialLogin
 * if network connectivity issues are detected
 */
const EasyAuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [networkStatus, setNetworkStatus] = useState<{
    isOnline: boolean;
    canResolveWeb3Auth: boolean;
    error: string | null;
  }>({
    isOnline: true,
    canResolveWeb3Auth: true,
    error: null
  });
  
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        // Check general connectivity
        const online = await checkConnectivity();
        
        // Check DNS resolution for Web3Auth
        const canResolveWeb3Auth = await checkDnsResolution("app.openlogin.com");
        
        setNetworkStatus({
          isOnline: online,
          canResolveWeb3Auth,
          error: !online 
            ? "Internet connection issue detected"
            : !canResolveWeb3Auth
              ? "Your network cannot resolve app.openlogin.com"
              : null
        });
        
        // Automatically set the tab based on network status
        if (!canResolveWeb3Auth) {
          setActiveTab("basic");
        }
      } catch (error) {
        console.error("Error checking network:", error);
        setNetworkStatus({
          isOnline: false,
          canResolveWeb3Auth: false,
          error: "Network check failed"
        });
        setActiveTab("basic");
      }
    };
    
    checkNetwork();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Authentication Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">CPXTB Platform</h1>
          
          {networkStatus.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>
                {networkStatus.error}. Please use the Basic Social Login option.
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Social Login</CardTitle>
              <CardDescription>
                No wallet or crypto knowledge needed!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Simply log in with your Google, Apple, or Facebook account and we'll handle the rest.
                Your wallet address is generated automatically.
              </p>
            </CardContent>
          </Card>
          
          <BasicSocialLogin />
          
          <p className="text-xs text-center text-muted-foreground mt-8 max-w-[90%] mx-auto">
            By continuing, you'll create a secure wallet automatically. 
            All transactions are processed on the Base blockchain network.
          </p>
        </div>
      </div>
      
      {/* Info Side */}
      <div className="hidden lg:flex flex-1 bg-primary text-primary-foreground">
        <div className="flex flex-col justify-center p-12">
          <h2 className="text-4xl font-bold mb-6">CPXTB Platform</h2>
          <p className="text-xl mb-8">
            Securely access the CPXTB ecosystem with social login
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground/20 p-2 rounded-full mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">No Technical Knowledge Required</h3>
                <p className="opacity-90">Login with your favorite social account - no wallet setup needed</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground/20 p-2 rounded-full mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Secure Wallet Generation</h3>
                <p className="opacity-90">Deterministic wallet creation based on your identity</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground/20 p-2 rounded-full mt-1">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Network Resilience</h3>
                <p className="opacity-90">Works reliably across all network environments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EasyAuthPage;