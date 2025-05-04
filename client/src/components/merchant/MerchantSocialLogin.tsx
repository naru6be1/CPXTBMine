import React, { useState } from 'react';
import { useSocialLogin } from '@/providers/SocialLoginProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, LogOut, ShoppingBag, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MerchantSocialLogin: React.FC = () => {
  const { isLoggedIn, isLoading, userInfo, walletAddress, balance, login, logout, copyWalletAddress } = useSocialLogin();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (provider: string) => {
    try {
      await login(provider);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Could not connect to the selected provider. Please try again.",
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
            : "Connect your wallet to access merchant features"}
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
              Connect with your social account to create a wallet and manage your merchant business.
            </p>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleLogin('google')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Google
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleLogin('facebook')}
                >
                  <svg viewBox="0 0 36 36" fill="url(#a)" className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient x1="50%" x2="50%" y1="97.078%" y2="0%" id="a">
                        <stop offset="0%" stopColor="#0062E0"/>
                        <stop offset="100%" stopColor="#19AFFF"/>
                      </linearGradient>
                    </defs>
                    <path d="M15 35.8C6.5 34.3 0 26.9 0 18 0 8.1 8.1 0 18 0s18 8.1 18 18c0 8.9-6.5 16.3-15 17.8l-1-.8h-4l-1 .8z"/>
                    <path fill="#FFF" d="m25 23 .8-5H21v-3.5c0-1.4.5-2.5 2.7-2.5H26V7.4c-1.3-.2-2.7-.4-4-.4-4.1 0-7 2.5-7 7v4h-4.5v5H15v12.7c1 .2 2 .3 3 .3s2-.1 3-.3V23h4z"/>
                  </svg>
                  Facebook
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleLogin('twitter')}
                >
                  <svg fill="#1D9BF0" className="h-4 w-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleLogin('apple')}
                >
                  <svg viewBox="0 0 384 512" className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  Apple
                </Button>
              </div>
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