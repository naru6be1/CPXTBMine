import React, { useState, useEffect } from 'react';
import { useSocialLogin } from '@/providers/SocialLoginProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, ShoppingBag, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const MerchantSocialLogin: React.FC = () => {
  const { isLoggedIn, isLoading: socialLoading, userInfo, walletAddress, balance, login, logout, copyWalletAddress } = useSocialLogin();
  const { user, isLoading: authLoading, logoutMutation } = useAuth();
  const [copied, setCopied] = useState(false);
  const [userInfoState, setUserInfoState] = useState<any>(null);
  const { toast } = useToast();
  
  // Attempt to fetch user info from the server to ensure we have the latest data
  useEffect(() => {
    const fetchUserFromServer = async () => {
      try {
        const response = await fetch('/api/auth/user');
        
        if (response.ok) {
          const userData = await response.json();
          // We found server-side authentication data!
          console.log("Found authenticated user on server:", userData);
          
          // Extract display name from user data, with preference order
          const displayName = 
            // 1. Use name field if available (might be from Google profile)
            userData.name || 
            // 2. Use username if available (from database)
            userData.username ||
            // 3. Default to "User" if nothing else is available
            "User";
            
          console.log("Using display name:", displayName, "from user data:", userData);
          
          setUserInfoState({
            name: displayName,
            email: userData.email,
            provider: userData.provider || 'google'
          });
        } else {
          console.log("No server authentication found, using client-side data");
          // Fall back to local data if available
          if (userInfo) {
            setUserInfoState(userInfo);
          } else if (user) {
            setUserInfoState({
              name: user.username,
              email: user.email,
              provider: 'server'
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Fall back to local data on error
        if (userInfo) {
          setUserInfoState(userInfo);
        } else if (user) {
          setUserInfoState({
            name: user.username,
            email: user.email,
            provider: 'server'
          });
        }
      }
    };
    
    fetchUserFromServer();
  }, [user, userInfo]);
  
  // Determine the actual authentication state by checking both regular auth and social login
  const actuallyLoggedIn = isLoggedIn || !!user || !!userInfoState;
  const isLoading = socialLoading || authLoading || logoutMutation.isPending;
  
  // For debugging
  useEffect(() => {
    console.log("MerchantSocialLogin Authentication state:", { 
      isLoggedIn, 
      hasUserObject: !!user,
      actuallyLoggedIn,
      user: user ? `${user.username} (${user.email || 'no email'})` : 'none',
      socialUser: userInfo ? `${userInfo.name} (${userInfo.email || 'no email'})` : 'none',
      serverUser: userInfoState ? `${userInfoState.name} (${userInfoState.email || 'no email'})` : 'none'
    });
  }, [isLoggedIn, user, userInfo, userInfoState, actuallyLoggedIn]);

  const handleLogin = async () => {
    try {
      // Direct Google OAuth approach - redirect the user to Google
      const currentUrl = window.location.href;
      const redirectUrl = encodeURIComponent(currentUrl);
      console.log("Redirecting to Google authentication...");
      
      // Notify user about the redirection
      toast({
        title: "Redirecting to Google",
        description: "You'll be redirected to Google to sign in.",
        duration: 3000
      });
      
      // Navigate directly to the authentication endpoint - this is better than using the login function
      setTimeout(() => {
        window.location.href = `/api/social-auth/google?enableRealLogin=true&redirectUrl=${redirectUrl}`;
      }, 800);
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
      // Always log out from both systems to be safe
      // First, try the traditional auth logout
      try {
        await logoutMutation.mutateAsync();
      } catch (authError) {
        console.warn("Auth logout error (may be expected):", authError);
      }
      
      // Then, try the social login logout
      try {
        await logout();
      } catch (socialError) {
        console.warn("Social logout error (may be expected):", socialError);
      }
      
      // Also clear localStorage to ensure all client-side data is removed
      localStorage.removeItem('cpxtb_user');
      
      // Clear our component state
      setUserInfoState(null);
      
      // Show success message
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      
      // Refresh the page to reset all state
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error("Logout error:", error);
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

  // Get the displayed name and email based on available authentication methods, prioritizing server data
  const displayName = userInfoState?.name || userInfo?.name || user?.username || "User";
  const displayEmail = userInfoState?.email || userInfo?.email || user?.email || "";

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Merchant Account
        </CardTitle>
        <CardDescription>
          {actuallyLoggedIn 
            ? "Manage your merchant account with your connected wallet" 
            : "Connect your account to access merchant features"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {actuallyLoggedIn ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-md">
              <div>
                <p className="text-sm font-medium">Logged in as</p>
                <p className="text-sm text-muted-foreground">{displayName}</p>
                {displayEmail && <p className="text-xs text-muted-foreground">{displayEmail}</p>}
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

            {walletAddress && (
              <>
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
              </>
            )}
            
            {!walletAddress && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                <p className="text-sm text-amber-800">
                  Your account doesn't have a wallet connected yet. You may need to reconnect with Google to create a wallet.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={handleLogin}
                >
                  Connect Google Account
                </Button>
              </div>
            )}
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