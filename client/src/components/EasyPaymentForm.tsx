import React, { useState, useEffect } from 'react';
import { useWeb3Auth } from './SocialLoginProvider';
import { CPXTB_TOKEN_ADDRESS } from '@shared/constants';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EasyPaymentFormProps {
  merchantAddress: string;
  amountCPXTB: string;
  amountUSD?: string;
  paymentReference?: string;
  onSuccess?: (txHash: string) => void;
  onCancel?: () => void;
}

/**
 * Easy Payment Form for non-crypto users to pay with CPXTB
 * Uses Web3Auth for social login and wallet creation
 */
const EasyPaymentForm: React.FC<EasyPaymentFormProps> = ({
  merchantAddress,
  amountCPXTB,
  amountUSD,
  paymentReference,
  onSuccess,
  onCancel
}) => {
  const { isLoading: authLoading, isAuthenticated, login, user, sendCPXTB, getBalance } = useWeb3Auth();
  const [balance, setBalance] = useState<string>('0');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check balance when user is authenticated
    if (isAuthenticated) {
      checkBalance();
    }
  }, [isAuthenticated]);

  const checkBalance = async () => {
    try {
      const balance = await getBalance();
      setBalance(balance);
      
      // Check if balance is sufficient
      if (parseFloat(balance) < parseFloat(amountCPXTB)) {
        setInsufficientFunds(true);
      } else {
        setInsufficientFunds(false);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleSocialLogin = async () => {
    try {
      console.log("EasyPaymentForm: Initiating social login");
      await login();
      console.log("EasyPaymentForm: Social login completed successfully");
    } catch (error) {
      console.error('Login failed:', error);
      
      // Get a more descriptive error message
      let errorMessage = "There was an error logging in. Please try again.";
      
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Provide more helpful error messages based on common issues
        if (error.message.includes("popup")) {
          errorMessage = "Popup was blocked. Please allow popups for this site and try again.";
        } else if (error.message.includes("cancelled")) {
          errorMessage = "Login was cancelled. Please try again when you're ready.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes("Buffer")) {
          errorMessage = "Browser compatibility issue. Please try using Chrome or Edge.";
        } else {
          // Use the actual error message if it's informative
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    try {
      setTxStatus('pending');
      
      // Send the transaction
      const txResult = await sendCPXTB(merchantAddress, amountCPXTB);
      
      // Handle success
      setTxHash(txResult.transactionHash);
      setTxStatus('success');
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been sent successfully!",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(txResult.transactionHash);
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
  if (isAuthenticated) {
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
              <span className="text-sm font-medium">Your Balance</span>
              <button 
                onClick={checkBalance} 
                className="text-xs text-primary hover:underline"
              >
                Refresh
              </button>
            </div>
            <p className="text-lg font-bold">{parseFloat(balance).toFixed(4)} CPXTB</p>
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
            Simply log in with your Google, Apple, or Facebook account and we'll handle the rest.
          </p>
        </div>
        
        <Button 
          onClick={handleSocialLogin} 
          className="w-full h-12"
          size="lg"
        >
          Continue with Social Login
        </Button>
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