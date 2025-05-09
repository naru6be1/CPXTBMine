import React, { useState, useEffect } from 'react';
import { CPXTB_TOKEN_ADDRESS } from '@shared/constants';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BasicSocialLogin } from '@/components/BasicSocialLogin';

interface EasyPaymentFormProps {
  merchantAddress: string;
  amountCPXTB: string;
  amountUSD?: string;
  paymentReference?: string;
  onSuccess?: (txHash: string) => void;
  onCancel?: () => void;
}

// Dummy transaction result type
interface TransactionResult {
  transactionHash: string;
}

/**
 * Easy Payment Form for non-crypto users to pay with CPXTB
 * Uses a simplified login experience with demo mode
 */
const EasyPaymentForm: React.FC<EasyPaymentFormProps> = ({
  merchantAddress,
  amountCPXTB,
  amountUSD,
  paymentReference,
  onSuccess,
  onCancel
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Payment state
  const [balance, setBalance] = useState<string>('0');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false);
  const { toast } = useToast();

  // Initialize and check for existing authentication
  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        // Check for stored user data in localStorage
        const storedUserData = localStorage.getItem('cpxtb_user_data');
        
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          setIsAuthenticated(true);
          
          console.log("Found stored user data:", parsedData);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkExistingAuth();
  }, []);

  // Check balance when authenticated
  useEffect(() => {
    if (isAuthenticated && userData) {
      checkBalance();
    }
  }, [isAuthenticated, userData]);

  // Function to check wallet balance
  const checkBalance = async () => {
    try {
      // For demo users, we use their stored balance
      if (userData?.isDemoUser) {
        const demoBalance = userData.balance || "500.0";
        setBalance(demoBalance);
        
        // Check if balance is sufficient
        if (parseFloat(demoBalance) < parseFloat(amountCPXTB)) {
          setInsufficientFunds(true);
        } else {
          setInsufficientFunds(false);
        }
        return;
      }
      
      // For real users, we would query blockchain
      // This is a simplified version that just uses localStorage
      const balance = userData?.balance || "0";
      setBalance(balance);
      
      // Check if balance is sufficient
      if (parseFloat(balance) < parseFloat(amountCPXTB)) {
        setInsufficientFunds(true);
      } else {
        setInsufficientFunds(false);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      toast({
        title: "Balance Check Failed",
        description: "We couldn't retrieve your current balance. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to process payment
  const handlePayment = async () => {
    try {
      setTxStatus('pending');
      
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo users, we simulate a successful transaction
      if (userData?.isDemoUser) {
        // Generate a fake transaction hash
        const mockTxHash = "0x" + Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)).join('');
        
        // Update the demo user's balance
        const newBalance = (parseFloat(userData.balance) - parseFloat(amountCPXTB)).toString();
        const updatedUserData = { ...userData, balance: newBalance };
        localStorage.setItem('cpxtb_user_data', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        
        // Set transaction as successful
        setTxHash(mockTxHash);
        setTxStatus('success');
        
        toast({
          title: "Payment Successful",
          description: "Your payment has been sent successfully!",
        });
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(mockTxHash);
        }
        
        return;
      }
      
      // For real users, we would send an actual blockchain transaction
      // This is a simplified version for the demo
      const mockTxHash = "0x" + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      
      // Set transaction as successful
      setTxHash(mockTxHash);
      setTxStatus('success');
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been sent successfully!",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(mockTxHash);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setTxStatus('error');
      
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment",
        variant: "destructive",
      });
    }
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Loading Payment</CardTitle>
          <CardDescription>Please wait while we initialize...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show payment form if authenticated
  if (isAuthenticated && userData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            {paymentReference ? `Reference: ${paymentReference}` : 'Secure payment with CPXTB'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="recipient">Recipient</Label>
            <Input 
              id="recipient" 
              value={merchantAddress} 
              readOnly 
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex items-center space-x-2">
              <Input 
                id="amount" 
                value={amountCPXTB} 
                readOnly 
              />
              <span className="font-medium">CPXTB</span>
            </div>
            {amountUSD && (
              <p className="text-sm text-muted-foreground mt-1">Approximately ${amountUSD} USD</p>
            )}
          </div>
          
          <div className="p-3 bg-secondary rounded-md">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">
                {userData?.isDemoUser ? 'Demo Balance' : 'Your Balance'}
              </span>
              <button 
                onClick={checkBalance} 
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>
            <p className="text-lg font-bold">{parseFloat(balance).toFixed(4)} CPXTB</p>
            
            {userData?.isDemoUser && (
              <p className="text-xs text-muted-foreground mt-1">
                Demo mode uses simulated balances and transactions
              </p>
            )}
          </div>
          
          {insufficientFunds && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Insufficient Balance</p>
                <p className="text-sm">You need at least {amountCPXTB} CPXTB to complete this payment.</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handlePayment}
            disabled={txStatus === 'pending' || insufficientFunds || txStatus === 'success'}
          >
            {txStatus === 'pending' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : txStatus === 'success' ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Payment Successful
              </>
            ) : (
              `Pay ${amountCPXTB} CPXTB`
            )}
          </Button>
          
          {txStatus !== 'success' && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onCancel}
              disabled={txStatus === 'pending'}
            >
              Cancel
            </Button>
          )}
          
          {txStatus === 'success' && txHash && (
            <a 
              href={`https://basescan.org/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-center text-primary hover:underline mt-2"
            >
              View transaction on BaseScan
            </a>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Show login prompt if not authenticated
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Easy Payment with CPXTB</CardTitle>
        <CardDescription>
          {amountUSD 
            ? `Pay ${amountCPXTB} CPXTB (approx. $${amountUSD})`
            : `Pay ${amountCPXTB} CPXTB`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-4">
          <p className="mb-4">No wallet or crypto knowledge needed!</p>
          <p className="text-sm text-muted-foreground">
            Simply log in with your social account and we'll handle the rest.
          </p>
        </div>
        
        {/* Use BasicSocialLogin for authentication */}
        <BasicSocialLogin 
          showCard={false}
          onSuccess={(userData) => {
            console.log("Social login successful with BasicSocialLogin component:", userData);
            setUserData(userData);
            setIsAuthenticated(true);
            
            // Store user data in localStorage for persistence
            localStorage.setItem('cpxtb_user_data', JSON.stringify(userData));
            
            toast({
              title: "Login Successful",
              description: `Welcome ${userData.userInfo?.name || 'back'}!`,
            });
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
      </CardContent>
      <CardFooter className="flex flex-col">
        <p className="text-xs text-center text-muted-foreground mt-2 max-w-[90%] mx-auto">
          By continuing, you'll create a secure wallet automatically. Your payment will be processed on the Base blockchain network.
        </p>
      </CardFooter>
    </Card>
  );
};

export default EasyPaymentForm;