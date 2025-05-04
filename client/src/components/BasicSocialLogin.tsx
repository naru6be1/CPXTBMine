import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * A basic social login fallback component that simulates social login
 * when the main authentication flow fails.
 * 
 * This component doesn't rely on any external APIs and creates a simulated
 * wallet address that can be used for testing and demonstration purposes.
 */
interface BasicSocialLoginProps {
  onSuccess?: (data: {
    name: string;
    email: string;
    provider: string;
    walletAddress: string;
    balance: string;
  }) => void;
  onError?: (error: Error) => void;
  showCard?: boolean;
  className?: string;
}

export function BasicSocialLogin({ 
  onSuccess, 
  onError, 
  showCard = true,
  className = ''
}: BasicSocialLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (provider: string) => {
    setIsLoading(true);
    
    try {
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
        userData.name = 'Google User';
        userData.email = 'user@gmail.com';
      } else if (provider === 'facebook') {
        userData.name = 'Facebook User';
        userData.email = 'user@facebook.com';
      } else if (provider === 'twitter') {
        userData.name = 'Twitter User';
        userData.email = 'user@twitter.com';
      } else if (provider === 'apple') {
        userData.name = 'Apple User';
        userData.email = 'user@icloud.com';
      }
      
      // Save to local storage for persistence
      localStorage.setItem('cpxtb_user', JSON.stringify({
        userInfo: {
          name: userData.name,
          email: userData.email,
          provider: userData.provider
        },
        walletAddress: userData.walletAddress,
        balance: userData.balance
      }));
      
      toast({
        title: "Login Successful",
        description: `Connected with ${provider} (Fallback Mode)`,
      });
      
      // Notify parent component
      if (onSuccess) {
        onSuccess(userData);
      }
      
      // Force reload to apply changes from localStorage
      // Add loggedIn=true parameter to prevent login loops on direct QR code access
      setTimeout(() => {
        // Preserve existing URL parameters and add loggedIn=true
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('loggedIn', 'true');
        window.location.href = currentUrl.toString();
      }, 500);
    } catch (error: any) {
      console.error('Fallback login error:', error);
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
  
  const loginContent = (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          disabled={isLoading}
          onClick={() => handleLogin('google')}
          className="flex items-center justify-center gap-2"
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
          Google
        </Button>
        <Button
          variant="outline"
          disabled={isLoading}
          onClick={() => handleLogin('facebook')}
          className="flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-5 w-5 text-blue-600"
            aria-hidden="true"
            style={{ fill: 'currentcolor' }}
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"
              clipRule="evenodd"
            />
          </svg>
          Facebook
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          disabled={isLoading}
          onClick={() => handleLogin('twitter')}
          className="flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-5 w-5 text-blue-400"
            aria-hidden="true"
            style={{ fill: 'currentcolor' }}
          >
            <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
          </svg>
          Twitter
        </Button>
        <Button
          variant="outline"
          disabled={isLoading}
          onClick={() => handleLogin('apple')}
          className="flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            aria-hidden="true"
            style={{ fill: 'currentcolor' }}
          >
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
          </svg>
          Apple
        </Button>
      </div>
    </div>
  );
  
  if (!showCard) {
    return loginContent;
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Social Login</CardTitle>
        <CardDescription>
          Login with your social account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loginContent}
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-gray-500">
        <p>This is a demo login for testing purposes</p>
      </CardFooter>
    </Card>
  );
}

export default BasicSocialLogin;