import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check, Github, Twitter, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Enhanced mockup of social login functionality to serve as a reliable fallback
 * This provides a guaranteed working demo when Web3Auth has connectivity issues
 */
const BasicSocialLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string, email: string, provider: string } | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("google");
  const { toast } = useToast();

  // Check if we have saved login info in localStorage
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('basicSocialLoginAuth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        if (authData.isLoggedIn && authData.userInfo) {
          setIsLoggedIn(true);
          setUserInfo(authData.userInfo);
          
          // Generate a deterministic wallet address based on the provider and email
          if (authData.userInfo.email) {
            const deterministicAddress = generateDeterministicAddress(
              authData.userInfo.provider, 
              authData.userInfo.email
            );
            setWalletAddress(deterministicAddress);
          }
        }
      }
    } catch (error) {
      console.error("Error loading saved auth data:", error);
    }
  }, []);

  // Generate a deterministic wallet address based on the provider and identifier
  // This ensures the same user always gets the same wallet address
  const generateDeterministicAddress = (provider: string, identifier: string): string => {
    // Create a simple hash based on the provider and identifier
    let hash = 0;
    const str = `${provider}-${identifier}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use the hash to seed our "random" hex generation
    const seed = Math.abs(hash);
    let addressHex = '0x';
    
    // Generate 40 hex characters for the address using the seed
    for (let i = 0; i < 40; i++) {
      // Use a deterministic approach to generate each hex digit
      const hexDigit = '0123456789abcdef'[((seed + i) * (i + 1)) % 16];
      addressHex += hexDigit;
    }
    
    return addressHex;
  };

  const simulateLogin = async (provider: string = selectedProvider) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate network delay (shorter for better UX)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate user info based on the selected provider
      let userDetails = { name: 'Demo User', email: '', provider };
      
      switch (provider) {
        case 'google':
          userDetails.email = 'demo.user@gmail.com';
          break;
        case 'twitter':
          userDetails.email = 'demo_user@twitter.demo';
          break;
        case 'github':
          userDetails.email = 'demo_user@github.demo';
          break;
        case 'email':
          userDetails.email = 'user@example.com';
          break;
        default:
          userDetails.email = 'demo@example.com';
      }
      
      // Simulate successful login
      setIsLoggedIn(true);
      setUserInfo(userDetails);
      
      // Generate a deterministic wallet address based on the provider and email
      const address = generateDeterministicAddress(provider, userDetails.email);
      setWalletAddress(address);
      
      // Save auth data to localStorage
      localStorage.setItem('basicSocialLoginAuth', JSON.stringify({
        isLoggedIn: true,
        userInfo: userDetails
      }));
      
      toast({
        title: "Success",
        description: "You've successfully logged in!",
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
  };

  const simulateLogout = async () => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsLoggedIn(false);
      setUserInfo(null);
      setWalletAddress(null);
      
      // Remove saved auth data from localStorage
      localStorage.removeItem('basicSocialLoginAuth');
      
      toast({
        title: "Success",
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
  };

  const copyWalletAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          
          toast({
            title: "Address Copied",
            description: "Wallet address copied to clipboard",
          });
        })
        .catch(err => {
          console.error("Failed to copy address:", err);
          toast({
            title: "Copy Failed",
            description: "Could not copy to clipboard",
            variant: "destructive",
          });
        });
    }
  };

  // Provider selection UI for not logged in state
  const renderProviderSelectionUI = () => {
    return (
      <div className="space-y-4">
        <Tabs defaultValue="google" onValueChange={setSelectedProvider} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="twitter">
              <Twitter className="w-4 h-4 mr-1" />
              <span className="sr-only sm:not-sr-only sm:inline-block">Twitter</span>
            </TabsTrigger>
            <TabsTrigger value="github">
              <Github className="w-4 h-4 mr-1" />
              <span className="sr-only sm:not-sr-only sm:inline-block">GitHub</span>
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-1" />
              <span className="sr-only sm:not-sr-only sm:inline-block">Email</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          className="w-full" 
          onClick={() => simulateLogin(selectedProvider)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            `Continue with ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}`
          )}
        </Button>
      </div>
    );
  };

  // Logged in UI with wallet address display
  const renderLoggedInUI = () => {
    if (!userInfo || !walletAddress) return null;
    
    return (
      <div className="space-y-4">
        <div className="p-3 bg-secondary rounded-md">
          <p className="font-medium">Logged in as:</p>
          <p className="text-sm truncate">{userInfo.email}</p>
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Wallet Address:</p>
            <div className="flex items-center">
              <code className="text-xs font-mono bg-background p-1 rounded flex-1 overflow-x-auto whitespace-nowrap">{walletAddress}</code>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2 h-6 w-6" 
                onClick={copyWalletAddress}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>This demo wallet can be used for testing transactions. The address is deterministically generated based on your login details.</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-[350px] mx-auto my-4">
      <CardHeader>
        <CardTitle>Social Login Demo</CardTitle>
        <CardDescription>Connect with your social account</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {isLoggedIn && userInfo ? renderLoggedInUI() : renderProviderSelectionUI()}
      </CardContent>
      <CardFooter>
        {isLoggedIn && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={simulateLogout}
            disabled={isLoading}
          >
            Logout
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default BasicSocialLogin;