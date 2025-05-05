import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Redirect, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { EnhancedSocialLogin } from "@/components/EnhancedSocialLogin";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();
  
  // Get auth context
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  // Form states
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: ""
  });
  
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: ""
  });
  
  // Form handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: loginForm.username,
      password: loginForm.password
    });
  };
  
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    
    const userData: any = {
      username: registerForm.username,
      password: registerForm.password,
      referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };
    
    // Add email if provided
    if (registerForm.email.trim()) {
      userData.email = registerForm.email.trim();
    }
    
    registerMutation.mutate(userData);
  };
  
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Redirect if already logged in
  if (user && !isLoading) {
    return <Redirect to="/merchant" />;
  }
  
  // Check for demo login redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isLoggedIn = urlParams.get('loggedIn') === 'true';
    const isDemoMode = urlParams.get('demoMode') === 'true';
    
    if (isLoggedIn && isDemoMode) {
      // User has successfully logged in with demo mode
      // Redirect to merchant page after a short delay
      setTimeout(() => {
        window.location.href = '/merchant';
      }, 500);
    }
  }, []);
  
  return (
    <div className="flex min-h-screen">
      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">CPXTB Platform</h1>
          
          <div className="mb-8">
            <EnhancedSocialLogin 
              onSuccess={(userData) => {
                toast({
                  title: "Login Successful",
                  description: `Connected as ${userData.name}`,
                });
                
                // Force reload
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }}
              onError={(error) => {
                toast({
                  title: "Login Failed",
                  description: error.message || "Authentication failed",
                  variant: "destructive",
                });
              }}
            />
          </div>
          
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with username/password
              </span>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the platform
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLoginSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="Your username"
                        value={loginForm.username}
                        onChange={handleLoginChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Your password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                    <div className="text-center">
                      <Link href="/forgot-password">
                        <Button 
                          variant="link" 
                          className="p-0 text-sm text-muted-foreground"
                          type="button"
                        >
                          Forgot password?
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register to access merchant features
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegisterSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        name="username"
                        placeholder="Choose a username"
                        value={registerForm.username}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        name="password"
                        type="password"
                        placeholder="Choose a strong password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email (optional)</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="Your email address"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        For password recovery and account notifications
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Register"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Info Side */}
      <div className="hidden lg:flex flex-1 bg-primary text-primary-foreground">
        <div className="flex flex-col justify-center p-12">
          <h2 className="text-4xl font-bold mb-6">CPXTB Merchant Platform</h2>
          <p className="text-xl mb-8">
            Access powerful tools to accept CPXTB token payments for your business
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground/20 p-2 rounded-full mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Easy Integration</h3>
                <p className="opacity-90">Quickly set up and start accepting CPXTB token payments</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground/20 p-2 rounded-full mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Secure Transactions</h3>
                <p className="opacity-90">Built on blockchain technology for maximum security</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground/20 p-2 rounded-full mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Instant Settlements</h3>
                <p className="opacity-90">Receive payments directly to your wallet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}