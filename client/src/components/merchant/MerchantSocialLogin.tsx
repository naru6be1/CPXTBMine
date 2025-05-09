import React, { useState } from 'react';
import { useSocialLogin } from '@/providers/SocialLoginProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, ShoppingBag, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MerchantSocialLogin: React.FC = () => {
  const { isLoggedIn, isLoading, userInfo, walletAddress, balance, login, logout, copyWalletAddress } = useSocialLogin();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      await login('google');
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Could not connect to Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Could not disconnect. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyAddress = () => {
    copyWalletAddress();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openBlockExplorer = () => {
    if (walletAddress) {
      window.open(`https://basescan.org/address/${walletAddress}`, '_blank');
    }
  };

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Merchant Account
        </CardTitle>
        <CardDescription>
          {isLoggedIn 
            ? "Manage your merchant account with your connected wallet" 
            : "Connect your account to access merchant features"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoggedIn && userInfo && walletAddress ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-md">
              <div>
                <p className="text-sm font-medium">Logged in as</p>
                <p className="text-sm text-muted-foreground">{userInfo.name}</p>
                <p className="text-xs text-muted-foreground">{userInfo.email}</p>
              </div>
              <div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                  <span>Disconnect</span>
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Your Wallet</p>
              <div className="flex items-center justify-between bg-background p-2 rounded border">
                <p className="text-xs font-mono truncate">{walletAddress}</p>
                <div className="flex gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6" 
                    onClick={handleCopyAddress}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6" 
                    onClick={openBlockExplorer}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">CPXTB Balance</p>
              <p className="text-xl font-bold">{balance} <span className="text-sm font-normal">CPXTB</span></p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Connect with your Google account to create a wallet and manage your merchant business.
            </p>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Button 
                className="w-full flex items-center justify-center gap-2" 
                onClick={handleLogin}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </Button>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <p className="text-xs text-muted-foreground w-full text-center">
          Securely process CPXTB payments for your business with our payment gateway.
        </p>
      </CardFooter>
    </Card>
  );
};

export default MerchantSocialLogin;