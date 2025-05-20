import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  LogIn, Mail, Lock, User, ArrowRight, Mail as GoogleIcon, Github
} from 'lucide-react';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { Link, useLocation } from 'wouter';
import MobileLayout from '@/components/mobile-layout';
import "../styles/pancake-theme.css";
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function MobileAuth() {
  const { toast } = useToast();
  const { login, userInfo, walletAddress } = useSocialLogin();
  const [, setLocation] = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMethod, setAuthMethod] = useState<'social' | 'email'>('social');
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  // Check if user is already logged in
  useEffect(() => {
    if (userInfo && walletAddress) {
      setLocation('/mobile-home');
    }
  }, [userInfo, walletAddress, setLocation]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({...credentials, username: e.target.value});
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({...credentials, password: e.target.value});
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    
    try {
      // In a real app, you would make a request to your backend
      // For now, we'll just use the Google login
      await login('google');
      
      toast({
        title: "Login Successful",
        description: "You have been logged in successfully.",
      });
      
      setLocation('/mobile-home');
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Could not log in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <MobileLayout title="Login" hideNav={true}>
      <div className="flex flex-col items-center justify-center px-4 pb-12">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-slate-700 rounded-xl flex items-center justify-center mb-4">
            <img src="/assets/cpxtb-logo.svg" alt="CPXTB" className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Welcome to CPXTB</h1>
          <p className="text-slate-400 text-sm">Login to manage your wallet</p>
        </div>

        {/* Auth Method Tabs */}
        <div className="bg-slate-800 rounded-xl p-1 flex mb-6 w-full">
          <button 
            className={`flex-1 ${authMethod === 'social' ? 'bg-cyan-500 text-white' : 'text-slate-400'} py-2 px-4 rounded-lg font-medium`}
            onClick={() => setAuthMethod('social')}
          >
            Social
          </button>
          <button 
            className={`flex-1 ${authMethod === 'email' ? 'bg-cyan-500 text-white' : 'text-slate-400'} py-2 px-4 rounded-lg font-medium`}
            onClick={() => setAuthMethod('email')}
          >
            Email
          </button>
        </div>

        {/* Auth Content */}
        <div className="w-full">
          {authMethod === 'social' ? (
            <div className="space-y-4">
              <Button 
                className="w-full bg-slate-700 hover:bg-slate-600 py-6 rounded-xl flex items-center justify-center"
                onClick={() => login('google')}
                disabled={isLoggingIn}
              >
                <GoogleIcon className="h-5 w-5 mr-3" />
                Continue with Google
              </Button>
              
              <Button 
                className="w-full bg-slate-700 hover:bg-slate-600 py-6 rounded-xl flex items-center justify-center"
                disabled={true}
              >
                <Github className="h-5 w-5 mr-3" />
                Continue with GitHub
              </Button>
              
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-sm">or</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>
              
              <Button 
                className="w-full bg-transparent hover:bg-slate-800 border border-slate-700 py-6 rounded-xl flex items-center justify-center"
                onClick={() => setAuthMethod('email')}
              >
                <Mail className="h-5 w-5 mr-3" />
                Login with Email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Email</label>
                <Input
                  value={credentials.username}
                  onChange={handleEmailChange}
                  className="bg-slate-700 border-slate-600 focus:border-cyan-500 text-white"
                  placeholder="your@email.com"
                  type="email"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Password</label>
                <Input
                  value={credentials.password}
                  onChange={handlePasswordChange}
                  className="bg-slate-700 border-slate-600 focus:border-cyan-500 text-white"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
              
              <div className="text-right">
                <Link href="/forgot-password">
                  <span className="text-sm text-cyan-500">Forgot Password?</span>
                </Link>
              </div>
              
              <Button 
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-6 rounded-xl font-medium mt-4"
                onClick={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </Button>
              
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-sm">or</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>
              
              <Button 
                className="w-full bg-transparent hover:bg-slate-800 border border-slate-700 py-6 rounded-xl flex items-center justify-center"
                onClick={() => setAuthMethod('social')}
              >
                Login with Social Media
              </Button>
            </div>
          )}
        </div>
        
        {/* Sign up link */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link href="/register">
              <span className="text-cyan-500 font-medium">Sign up</span>
            </Link>
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}