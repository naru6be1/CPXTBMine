import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Lock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

/**
 * Enhanced social login component that provides a clear distinction
 * between real Google authentication and fallback/demo login
 */
interface EnhancedSocialLoginProps {
  onSuccess?: (data: {
    name: string;
    email: string;
    provider: string;
    walletAddress: string;
    balance: string;
  }) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function EnhancedSocialLogin({ 
  onSuccess, 
  onError, 
  className = ''
}: EnhancedSocialLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [useRealAuth, setUseRealAuth] = useState(true);
  const [googleCredentialsAvailable, setGoogleCredentialsAvailable] = useState(false);
  
  // Check if Google credentials are available
  useEffect(() => {
    // Make an API call to check credentials
    fetch('/api/auth/check-credentials')
      .then(res => res.json())
      .then(data => {
        setGoogleCredentialsAvailable(data.googleCredentialsAvailable || false);
        // If credentials aren't available, default to fallback
        if (!data.googleCredentialsAvailable) {
          setUseRealAuth(false);
        }
      })
      .catch(err => {
        console.error("Failed to check auth credentials:", err);
        setUseRealAuth(false);
      });
  }, []);
  
  const handleLogin = async (provider: string) => {
    setIsLoading(true);
    
    try {
      if (useRealAuth && googleCredentialsAvailable) {
        // Show visible notification of real auth
        toast({
          title: "Using Real Google Authentication",
          description: "Redirecting to Google for real account authentication...",
          duration: 3000,
        });
        
        // Short delay to show toast
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect to Google OAuth flow
        const redirectUrl = window.location.href;
        window.location.href = `/api/social-auth/${provider.toLowerCase()}?enableRealLogin=true&redirectUrl=${encodeURIComponent(redirectUrl)}`;
      } else {
        // Fallback to simulated login
        toast({
          title: "Using Demo Login Mode",
          description: "Creating a simulated wallet for demonstration",
          variant: "default",
        });
        
        // Generate a deterministic wallet address based on timestamp
        const timestamp = Date.now();
        const seed = timestamp.toString(16);
        const address = '0x' + Array.from({ length: 40 }, (_, i) => {
          const hash = (seed.charCodeAt(i % seed.length) * (i + 1)) % 16;
          return '0123456789abcdef'[hash];
        }).join('');
        
        // Create user info based on selected provider
        let userData = {
          name: 'Demo User',
          email: 'demo@example.com',
          provider: provider,
          walletAddress: address,
          balance: '500.0' // Give enough balance to complete most payments
        };
        
        if (provider === 'google') {
          userData.name = 'Google Demo User';
          userData.email = `demo_${timestamp.toString(36).substring(0,4)}@gmail.com`;
        } else if (provider === 'facebook') {
          userData.name = 'Facebook Demo User';
          userData.email = `demo_${timestamp.toString(36).substring(0,4)}@facebook.com`;
        }
        
        // Save to local storage for persistence
        localStorage.setItem('cpxtb_user', JSON.stringify({
          userInfo: {
            name: userData.name,
            email: userData.email,
            provider: userData.provider
          },
          walletAddress: userData.walletAddress,
          balance: userData.balance,
          isDemoUser: true
        }));
        
        // Notify parent component
        if (onSuccess) {
          onSuccess(userData);
        }
        
        // Force reload to apply changes from localStorage
        setTimeout(() => {
          // Preserve existing URL parameters and add loggedIn=true
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('loggedIn', 'true');
          currentUrl.searchParams.set('demoMode', 'true');
          window.location.href = currentUrl.toString();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Could not complete login process",
        variant: "destructive",
      });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Social Login
          {googleCredentialsAvailable && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Real Auth Available
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Login with your social account to continue
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Authentication mode toggle */}
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="auth-mode">
              {useRealAuth ? (
                <div className="flex items-center text-sm font-medium">
                  <Lock className="mr-1 h-4 w-4 text-green-600" />
                  Real Authentication
                </div>
              ) : (
                <div className="flex items-center text-sm font-medium">
                  <AlertCircle className="mr-1 h-4 w-4 text-amber-600" />
                  Demo Mode
                </div>
              )}
            </Label>
            <p className="text-xs text-muted-foreground">
              {useRealAuth 
                ? "Sign in with your actual Google account" 
                : "Use demo mode with a simulated wallet"}
            </p>
          </div>
          <Switch
            id="auth-mode"
            checked={useRealAuth}
            onCheckedChange={setUseRealAuth}
            disabled={!googleCredentialsAvailable}
          />
        </div>
        
        {!googleCredentialsAvailable && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
            <p className="font-medium">Demo Mode Active</p>
            <p className="text-xs mt-1">
              Real Google authentication is not configured. Using demo mode with simulated wallets.
            </p>
          </div>
        )}
        
        {/* Google login button */}
        <Button
          onClick={() => handleLogin('google')}
          className="w-full flex items-center justify-center gap-2"
          variant={useRealAuth ? "default" : "outline"}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            aria-hidden="true"
            style={{ fill: 'currentcolor' }}
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.84 14.28c-.25.37-.56.7-.93.96-.36.26-.77.47-1.23.62-.46.15-.96.22-1.52.22-.63 0-1.22-.11-1.76-.33-.54-.22-1.01-.54-1.4-.94-.39-.4-.7-.9-.91-1.47a5.3 5.3 0 01-.34-1.92c0-.68.11-1.31.34-1.89.23-.58.54-1.07.95-1.49.41-.42.9-.75 1.46-.98.56-.23 1.17-.35 1.83-.35.58 0 1.12.09 1.62.28.5.19.94.47 1.31.84.37.37.66.83.86 1.37.2.54.3 1.16.3 1.85 0 .2-.01.4-.04.58H11.5v-.05c0-.29.05-.56.14-.81.09-.25.22-.47.38-.66.16-.19.35-.34.57-.45.22-.11.46-.16.73-.16.31 0 .59.07.83.22.24.15.43.35.56.61h2.12c-.09-.34-.23-.64-.42-.9-.19-.26-.42-.48-.67-.66-.25-.18-.54-.32-.84-.42-.31-.1-.62-.15-.95-.15-.41 0-.79.07-1.16.21-.37.14-.69.35-.97.62-.28.27-.5.6-.67.99a4.5 4.5 0 00-.24 1.52c0 .54.08 1.03.24 1.48.16.45.39.83.68 1.15.29.32.64.57 1.03.74.4.17.84.26 1.31.26.29 0 .58-.04.86-.13.28-.09.54-.22.78-.38.24-.16.44-.36.59-.59s.26-.5.33-.79h-2.17c-.12.28-.32.49-.58.63-.26.14-.55.21-.87.21-.36 0-.67-.08-.93-.24-.26-.16-.47-.38-.63-.66s-.27-.61-.33-.99a7.99 7.99 0 01-.09-1.25h5.13c.05-.36.07-.7.07-1.02 0-.64-.09-1.23-.28-1.76-.19-.53-.45-.99-.8-1.37-.35-.38-.77-.67-1.27-.87-.5-.2-1.05-.3-1.65-.3-.66 0-1.27.12-1.84.36-.57.24-1.06.58-1.49 1.01-.43.43-.76.95-1 1.56-.24.61-.36 1.28-.36 2.01 0 .7.12 1.34.36 1.93.24.59.59 1.1 1.03 1.53.44.43.97.76 1.59.99.62.23 1.31.35 2.07.35.71 0 1.36-.13 1.95-.38.59-.25 1.1-.66 1.52-1.21h-1.95z"
              clipRule="evenodd"
            />
          </svg>
          {useRealAuth ? "Sign in with Google" : "Demo Login with Google"}
          {useRealAuth && <ExternalLink className="h-3 w-3 ml-1" />}
        </Button>
        
        <div className="text-xs text-center text-muted-foreground">
          {useRealAuth 
            ? "You'll be redirected to Google for secure authentication" 
            : "Demo mode creates a simulated wallet for testing"}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col">
        <p className="text-xs text-center text-muted-foreground mt-2">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </CardFooter>
    </Card>
  );
}

export default EnhancedSocialLogin;