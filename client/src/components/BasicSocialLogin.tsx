import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Basic mockup of social login functionality while we resolve Web3Auth integration issues
 * This version doesn't attempt to create a real blockchain wallet but demonstrates the UI flow
 */
const BasicSocialLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string, email: string } | null>(null);
  const { toast } = useToast();

  const simulateLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful login
      setIsLoggedIn(true);
      setUserInfo({
        name: 'Demo User',
        email: 'demo@example.com'
      });
      
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
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIsLoggedIn(false);
      setUserInfo(null);
      
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

  const showWalletAddress = () => {
    // Generate a mock wallet address
    const address = '0x' + Array.from({length: 40}, () => 
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');
    
    toast({
      title: "Your Demo Wallet Address",
      description: address,
      duration: 5000, // Show for 5 seconds
    });
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

        {isLoggedIn && userInfo ? (
          <div className="space-y-4">
            <div className="p-3 bg-secondary rounded-md">
              <p className="font-medium">Logged in as:</p>
              <p className="text-sm truncate">{userInfo.email}</p>
            </div>
            <Button 
              className="w-full" 
              onClick={showWalletAddress}
              disabled={isLoading}
            >
              Show My Wallet Address
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full" 
            onClick={simulateLogin}
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