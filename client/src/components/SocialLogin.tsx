import React from 'react';
import { useWeb3Auth } from './SocialLoginProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialLoginProps {
  onLoginSuccess?: () => void;
  showBalance?: boolean;
  className?: string;
}

const SocialLogin: React.FC<SocialLoginProps> = ({ 
  onLoginSuccess,
  showBalance = false,
  className = ''
}) => {
  const { isLoading, isAuthenticated, user, login, logout, getBalance } = useWeb3Auth();
  const [balance, setBalance] = React.useState<string>('0');
  const { toast } = useToast();

  React.useEffect(() => {
    if (isAuthenticated && showBalance) {
      fetchBalance();
    }
  }, [isAuthenticated, showBalance]);

  const fetchBalance = async () => {
    try {
      const balance = await getBalance();
      setBalance(balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleLogin = async () => {
    try {
      await login();
      toast({
        title: "Login successful!",
        description: "You are now logged in with your social account",
      });
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: "There was an error logging in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <CardTitle>Loading</CardTitle>
          <CardDescription>Please wait while we initialize...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isAuthenticated && user) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
          <CardDescription>You're logged in with your social account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span>{user.email || 'No email available'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span>{user.name || 'Anonymous User'}</span>
          </div>
          {showBalance && (
            <div className="mt-4 p-3 bg-secondary rounded-md">
              <p className="text-sm font-medium">Your CPXTB Balance</p>
              <p className="text-2xl font-bold">{parseFloat(balance).toFixed(4)} CPXTB</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={fetchBalance}
              >
                Refresh Balance
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle>One-Click Login</CardTitle>
        <CardDescription>
          Login with your preferred account to access CPXTB services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No wallet? No problem! We'll create one for you automatically behind the scenes.
        </p>
        
        <Button 
          onClick={handleLogin} 
          className="w-full h-12"
        >
          Continue with Social Login
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col">
        <p className="text-xs text-center text-muted-foreground mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </CardFooter>
    </Card>
  );
};

export default SocialLogin;