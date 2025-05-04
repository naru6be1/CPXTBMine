import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSocialLogin } from '@/providers/SocialLoginProvider';
import { useToast } from '@/hooks/use-toast';
import BasicSocialLogin from '@/components/BasicSocialLogin';
import { Loader2, CheckCircle, Copy, ExternalLink } from 'lucide-react';

/**
 * Test page for verifying social login functionality
 * This serves as a dedicated test environment for the social login components
 * without the complexity of the full payment flow
 */
export default function SocialLoginTest() {
  const { isLoggedIn, userInfo, walletAddress, balance, login, logout, copyWalletAddress, refreshBalance } = useSocialLogin();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (provider: string) => {
    setLoading(true);
    try {
      await login(provider);
      toast({
        title: "Login Successful",
        description: `Connected with ${provider}`,
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Could not complete login process",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Social Login Test</CardTitle>
          <CardDescription>
            Test the social login functionality with different providers
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isLoggedIn ? (
            <div className="space-y-4">
              <div className="bg-slate-100 p-4 rounded-md border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-sm text-slate-800">Your Wallet</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={refreshBalance}
                  >
                    Refresh
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-700 font-medium mb-1">Wallet Address:</p>
                    <div className="flex items-center gap-1 bg-white p-2 rounded-md text-sm break-all shadow-sm">
                      <span className="text-slate-800 font-mono">{walletAddress}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={copyWalletAddress}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-2 bg-white rounded-md shadow-sm">
                    <p className="text-xs text-slate-700 font-medium mb-1">Connected as:</p>
                    <p className="font-medium text-slate-900">{userInfo?.name} ({userInfo?.email})</p>
                    <p className="text-xs text-slate-600">via {userInfo?.provider}</p>
                  </div>
                  
                  <div className="p-2 bg-white rounded-md shadow-sm">
                    <p className="text-xs text-slate-700 font-medium mb-1">Balance:</p>
                    <p className="font-medium text-lg text-slate-900">{Number(balance).toFixed(6)} CPXTB</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-green-50">
                <p className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Authentication successful!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Your login is working correctly, and you can now use it for payments.
                </p>
              </div>
              
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={logout}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-100 p-4 rounded-md text-center space-y-2 border border-gray-200 shadow-sm">
                <h3 className="font-medium text-slate-800">Test Social Login</h3>
                <p className="text-sm text-slate-600">
                  Connect with your social account to test our authentication system.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Method 1: Direct API Calls</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleLogin('google')}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Google
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleLogin('facebook')}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Facebook
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Method 2: Fallback Component</h3>
                <BasicSocialLogin 
                  showCard={false}
                  onSuccess={(userData) => {
                    console.log("Social login successful with BasicSocialLogin component:", userData);
                    
                    // Force reload to apply the changes from localStorage
                    setTimeout(() => {
                      window.location.reload();
                    }, 500);
                  }}
                  onError={(error) => {
                    console.error("Social login failed with BasicSocialLogin component:", error);
                    toast({
                      title: "Login Failed",
                      description: error.message || "Could not complete the login process",
                      variant: "destructive",
                    });
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <div className="text-xs text-center text-gray-500">
            <p>CPXTB Platform • Social Login Testing</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}