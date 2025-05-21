import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  LogIn, Mail, Lock, Briefcase, Check,
  CheckCircle2, ChevronRight, Store, CreditCard
} from 'lucide-react';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { Link, useLocation } from 'wouter';
import MobileLayout from '@/components/mobile-layout';
import "../styles/pancake-theme.css";
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MobileMerchantAuth() {
  const { toast } = useToast();
  const { login, userInfo, walletAddress } = useSocialLogin();
  const [, setLocation] = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  const [loginCredentials, setLoginCredentials] = useState({
    email: '',
    password: ''
  });
  
  const [registerCredentials, setRegisterCredentials] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Check if user is already logged in
  useEffect(() => {
    if (userInfo && walletAddress) {
      setLocation('/mobile-merchant');
    }
  }, [userInfo, walletAddress, setLocation]);

  const handleLoginCredentialsChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginCredentials({...loginCredentials, [field]: e.target.value});
  };

  const handleRegisterCredentialsChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterCredentials({...registerCredentials, [field]: e.target.value});
  };

  const handleLogin = async () => {
    if (!loginCredentials.email || !loginCredentials.password) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoggingIn(true);
    
    try {
      // In a production app, you would authenticate with your backend
      // For demo purposes, we'll use Google login
      await login('google');
      
      toast({
        title: "Login Successful",
        description: "Welcome to your merchant dashboard",
      });
      
      setLocation('/mobile-merchant');
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async () => {
    // Validate form
    if (!registerCredentials.businessName || 
        !registerCredentials.email || 
        !registerCredentials.password || 
        !registerCredentials.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields",
        variant: "destructive"
      });
      return;
    }

    if (registerCredentials.password !== registerCredentials.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    
    try {
      // In a production app, you would register with your backend
      // For demo purposes, we'll simulate a successful registration
      setTimeout(() => {
        toast({
          title: "Registration Successful",
          description: "Your merchant account has been created",
        });
        
        // Switch to login tab
        setAuthTab('login');
        setLoginCredentials({
          email: registerCredentials.email,
          password: ''
        });
      }, 1500);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Could not create your account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <MobileLayout title="Merchant Login" hideNav={false} activeTab="profile">
      <div className="flex flex-col items-center pb-12">
        {/* Logo/Header Section */}
        <div className="text-center mb-6">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Briefcase className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Merchant Portal</h1>
          <p className="text-slate-400 text-sm">Login to access your merchant dashboard</p>
        </div>

        {/* Auth Tabs */}
        <div className="w-full max-w-sm">
          <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as 'login' | 'register')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Email</label>
                <Input
                  value={loginCredentials.email}
                  onChange={handleLoginCredentialsChange('email')}
                  className="bg-slate-800 border-slate-700 focus:border-blue-500 text-white"
                  placeholder="your@email.com"
                  type="email"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Password</label>
                <Input
                  value={loginCredentials.password}
                  onChange={handleLoginCredentialsChange('password')}
                  className="bg-slate-800 border-slate-700 focus:border-blue-500 text-white"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
              
              <div className="text-right">
                <Link href="/forgot-password">
                  <span className="text-sm text-blue-500">Forgot Password?</span>
                </Link>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl font-medium mt-4 flex items-center justify-center"
                onClick={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Login to Merchant Portal
                  </>
                )}
              </Button>
              
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-sm">or</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>
              
              <Button 
                className="w-full bg-white hover:bg-slate-100 text-blue-600 py-4 rounded-xl font-medium flex items-center justify-center"
                onClick={() => login('google')}
                disabled={isLoggingIn}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" className="mr-2">
                  <path fill="#4285F4" d="M23.766 12.2764c0-.8178-.069-1.6303-.2067-2.4268H12.24v4.5676h6.4847c-.2807 1.5089-1.1287 2.7825-2.4069 3.6286v3.0114h3.8868c2.2746-2.0952 3.5847-5.177 3.5847-8.7808z"></path>
                  <path fill="#34A853" d="M12.2399 24c3.2418 0 5.9593-1.0814 7.9503-2.9296l-3.8868-3.0114c-1.0811.7251-2.4633 1.1528-4.0635 1.1528-3.1173 0-5.7583-2.1066-6.7045-4.9307H1.5156v3.1064C3.4884 21.3577 7.5734 24 12.2399 24z"></path>
                  <path fill="#FBBC05" d="M5.5354 15.1881c-.24-.7125-.3763-1.4761-.3763-2.2581 0-.7817.1363-1.5453.3763-2.2575V7.5661H1.5157C.549 9.0298 0 10.7209 0 12.53c0 1.809.549 3.5001 1.5157 4.9641l3.9197-3.306z"></path>
                  <path fill="#EA4335" d="M12.2399 5.3409c1.7543 0 3.327.6024 4.5665 1.7861l3.4474-3.4474C18.2612 1.775 15.5436.5 12.2399.5 7.5734.5 3.4885 3.1421 1.5156 7.1942L5.535 10.50c.9462-2.8243 3.5873-4.9309 6.7049-4.9309z"></path>
                </svg>
                Continue with Google
              </Button>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Business Name</label>
                <Input
                  value={registerCredentials.businessName}
                  onChange={handleRegisterCredentialsChange('businessName')}
                  className="bg-slate-800 border-slate-700 focus:border-blue-500 text-white"
                  placeholder="Your Business LLC"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Business Email</label>
                <Input
                  value={registerCredentials.email}
                  onChange={handleRegisterCredentialsChange('email')}
                  className="bg-slate-800 border-slate-700 focus:border-blue-500 text-white"
                  placeholder="business@example.com"
                  type="email"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Password</label>
                <Input
                  value={registerCredentials.password}
                  onChange={handleRegisterCredentialsChange('password')}
                  className="bg-slate-800 border-slate-700 focus:border-blue-500 text-white"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Confirm Password</label>
                <Input
                  value={registerCredentials.confirmPassword}
                  onChange={handleRegisterCredentialsChange('confirmPassword')}
                  className="bg-slate-800 border-slate-700 focus:border-blue-500 text-white"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl font-medium mt-4 flex items-center justify-center"
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Store className="h-5 w-5 mr-2" />
                    Create Merchant Account
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Merchant Benefits */}
        <div className="bg-slate-800 rounded-xl p-4 mt-8 w-full max-w-sm">
          <h3 className="text-lg font-semibold mb-4">Merchant Benefits</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-blue-500/20 p-2 rounded-full mr-3 mt-1">
                <CreditCard className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Accept Crypto Payments</h4>
                <p className="text-xs text-slate-400">Take payments in CPXTB tokens from anywhere</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-500/20 p-2 rounded-full mr-3 mt-1">
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium">No Transaction Fees</h4>
                <p className="text-xs text-slate-400">Save money compared to traditional payment processors</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-purple-500/20 p-2 rounded-full mr-3 mt-1">
                <ChevronRight className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Simple Integration</h4>
                <p className="text-xs text-slate-400">Add to your business with minimal setup</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}