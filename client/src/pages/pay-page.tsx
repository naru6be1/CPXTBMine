import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { useSocialLogin } from '@/providers/SocialLoginProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ShoppingBag, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  HelpCircle,
  AlertTriangle,
  ArrowLeft,
  Clock 
} from 'lucide-react';

export default function PayPage() {
  const { paymentReference } = useParams<{ paymentReference: string }>();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isBuyingTokens, setIsBuyingTokens] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const { isLoggedIn, userInfo, walletAddress, balance, login, refreshBalance } = useSocialLogin();
  const { toast } = useToast();

  // Fetch payment data
  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!paymentReference) {
        setError('Invalid payment reference');
        setLoading(false);
        return;
      }
      
      console.log(`Fetching payment data for reference: ${paymentReference}`);
      
      try {
        // FIXED URL PATH: Corrected endpoint to match server-side implementation
        const response = await fetch(`/api/payments/public/${paymentReference}`);
        
        // Debug response
        console.log(`Payment fetch response status: ${response.status}`);
        console.log(`Using correct endpoint: /api/payments/public/${paymentReference}`);
        
        if (!response.ok) {
          throw new Error('Payment not found or has expired');
        }

        const data = await response.json();
        console.log('Payment data received:', data);
        
        // Enhanced data handling with defaults for missing values
        // CRITICAL FIX: Improved handling of payment amounts to ensure proper display
        // Now using originalAmount fields that are strings to preserve exact decimal values
        const enhancedData = {
          ...data.payment,
          // Prioritize original string values to preserve exact decimal representation
          amountCpxtb: data.payment.originalAmountCpxtb || data.payment.amountCpxtb.toString(),
          // Fall back to numeric conversion only if needed
          amountCpxtbNumber: Number(data.payment.originalAmountCpxtb || data.payment.amountCpxtb),
          
          // Same for USD amount
          amountUsd: data.payment.originalAmountUsd || data.payment.amountUsd.toString(),
          amountUsdNumber: Number(data.payment.originalAmountUsd || data.payment.amountUsd),
          
          // Ensure description has a fallback value
          description: data.payment.description || `Payment to ${data.payment.merchantName || 'Merchant'}`,
          // Include theme information
          theme: data.theme
        };
        
        console.log('Enhanced payment data:', enhancedData);
        
        setPaymentData(enhancedData);
        
        // Calculate countdown
        // FIX: Adjust path to access expiresAt from payment object
        if (data.payment && data.payment.expiresAt) {
          const expiryTime = new Date(data.payment.expiresAt).getTime();
          const now = Date.now();
          const timeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
          setCountdown(timeLeft);
        }
      } catch (error: any) {
        console.error('Error fetching payment data:', error);
        setError(error.message || 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [paymentReference]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0 || paymentComplete) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, paymentComplete]);

  // Format the countdown time
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle payment submission
  const handlePayment = async () => {
    if (!isLoggedIn || !walletAddress) {
      toast({
        title: "Login Required",
        description: "Please log in to complete the payment",
        variant: "destructive",
      });
      return;
    }

    if (!paymentData) {
      toast({
        title: "Payment Error",
        description: "No payment data available",
        variant: "destructive",
      });
      return;
    }

    // Refresh balance to ensure we have the latest data
    await refreshBalance();

    // Use new amountCpxtbNumber property for numeric comparisons
    const requiredAmount = paymentData.amountCpxtbNumber;
    const currentBalance = Number(balance);

    // Check if user has enough balance
    if (currentBalance < requiredAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${requiredAmount.toFixed(6)} CPXTB but only have ${currentBalance.toFixed(6)} CPXTB`,
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);

    try {
      // Process payment - FIXED URL PATH to match server-side implementation
      const response = await fetch(`/api/payments/public/${paymentReference}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          userEmail: userInfo?.email,
          userName: userInfo?.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment failed');
      }

      const result = await response.json();
      
      // Update UI for successful payment
      setPaymentComplete(true);
      
      // Refresh balance after payment
      await refreshBalance();
      
      toast({
        title: "Payment Successful",
        description: "Your transaction has been completed successfully",
      });
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // Social login handlers
  const handleSocialLogin = async (provider: string) => {
    try {
      await login(provider);
      toast({
        title: "Login Successful",
        description: "You can now continue with your payment",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Could not authenticate with the provider",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading payment details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Payment Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The payment information could not be found or has expired.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Payment Successful!</CardTitle>
            <CardDescription>Your transaction has been completed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Amount:</div>
                <div className="font-medium text-right">${parseFloat(paymentData.amountUsd).toFixed(2)} USD</div>
                
                <div className="text-muted-foreground">CPXTB Amount:</div>
                <div className="font-medium text-right">{parseFloat(paymentData.amountCpxtb).toFixed(6)} CPXTB</div>
                
                <div className="text-muted-foreground">Merchant:</div>
                <div className="font-medium text-right">{paymentData.merchantName}</div>
                
                <div className="text-muted-foreground">Reference:</div>
                <div className="font-medium text-right text-xs truncate">{paymentReference}</div>
              </div>
            </div>
            
            <div className="rounded-lg bg-green-50 p-4 text-green-800 text-sm">
              <p className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Payment confirmed and sent to merchant
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              className="w-full" 
              onClick={() => {
                // Redirect to the merchant's website if available
                if (paymentData.returnUrl) {
                  window.location.href = paymentData.returnUrl;
                } else {
                  window.close();
                }
              }}
            >
              Complete
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => window.close()}
            >
              Close Window
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Complete Payment
            </CardTitle>
            
            {countdown !== null && countdown > 0 && (
              <div className="flex items-center gap-1 text-sm font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                <Clock className="h-3 w-3" />
                {formatTime(countdown)}
              </div>
            )}
          </div>
          <CardDescription>
            Pay with CPXTB using your social login
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          {/* Merchant and payment info */}
          <div className="rounded-lg border p-4 bg-gray-100 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">{paymentData.merchantName}</h3>
              {paymentData.merchantLogo && (
                <img 
                  src={paymentData.merchantLogo} 
                  alt={paymentData.merchantName} 
                  className="h-8 w-auto" 
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="text-gray-700 dark:text-gray-300">Amount:</div>
              <div className="font-bold text-right text-gray-900 dark:text-white">${paymentData.amountUsdNumber.toFixed(2)} USD</div>
              
              <div className="text-gray-700 dark:text-gray-300">CPXTB Amount:</div>
              <div className="font-medium text-right text-gray-900 dark:text-white">{paymentData.amountCpxtbNumber.toFixed(6)} CPXTB</div>
              
              {paymentData.description && (
                <>
                  <div className="text-gray-700 dark:text-gray-300">Description:</div>
                  <div className="font-medium text-right text-gray-900 dark:text-white">{paymentData.description}</div>
                </>
              )}
            </div>
            
            {countdown !== null && countdown <= 0 && (
              <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm flex items-center gap-2 mt-2">
                <AlertTriangle className="h-4 w-4" />
                This payment has expired. Please request a new payment link.
              </div>
            )}
          </div>
          
          {isLoggedIn ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">Your Wallet</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={refreshBalance}
                  >
                    Refresh
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div className="text-blue-700 dark:text-blue-300">Address:</div>
                  <div className="font-mono text-xs truncate text-blue-900 dark:text-blue-100">{walletAddress}</div>
                  
                  <div className="text-blue-700 dark:text-blue-300">Balance:</div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">{Number(balance).toFixed(6)} CPXTB</div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={
                  processingPayment || 
                  Number(balance) < Number(paymentData.amountCpxtb) ||
                  (countdown !== null && countdown <= 0)
                }
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : Number(balance) < Number(paymentData.amountCpxtb) ? (
                  'Insufficient Balance'
                ) : (countdown !== null && countdown <= 0) ? (
                  'Payment Expired'
                ) : (
                  `Pay ${Number(paymentData.amountCpxtb).toFixed(6)} CPXTB`
                )}
              </Button>
              
              {Number(balance) < Number(paymentData.amountCpxtb) && !isBuyingTokens && (
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-sm">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-800" />
                    <div>
                      <p className="text-amber-800">
                        Your wallet doesn't have enough CPXTB tokens. You need {Number(paymentData.amountCpxtb).toFixed(6)} CPXTB but only have {Number(balance).toFixed(6)} CPXTB.
                      </p>
                      <p className="mt-1 text-amber-700">
                        You can purchase CPXTB tokens directly using your social login wallet.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
                    onClick={() => setIsBuyingTokens(true)}
                  >
                    Buy CPXTB Tokens
                  </Button>
                </div>
              )}
              
              {Number(balance) < Number(paymentData.amountCpxtb) && isBuyingTokens && (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-sm">
                  <h3 className="font-medium mb-2 text-blue-900">Purchase CPXTB Tokens</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-blue-700 mb-1">
                        Current price: 1 CPXTB = ${(Number(paymentData.amountUsd) / Number(paymentData.amountCpxtb)).toFixed(6)} USD
                      </p>
                      <p className="text-sm text-blue-700 mb-2">
                        You need at least {Number(paymentData.amountCpxtb).toFixed(6)} CPXTB for this payment.
                      </p>
                      
                      <div className="flex flex-col gap-2">
                        <label htmlFor="purchase-amount" className="text-sm font-medium text-blue-900">
                          Amount to purchase (CPXTB)
                        </label>
                        <input
                          id="purchase-amount"
                          type="number"
                          min={Number(paymentData.amountCpxtb) - Number(balance)}
                          step="0.000001"
                          value={purchaseAmount}
                          onChange={(e) => setPurchaseAmount(e.target.value)}
                          placeholder={`Minimum ${(Number(paymentData.amountCpxtb) - Number(balance)).toFixed(6)}`}
                          className="px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsBuyingTokens(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          className="flex-1"
                          onClick={async () => {
                            const amount = parseFloat(purchaseAmount);
                            
                            if (isNaN(amount) || amount <= 0) {
                              toast({
                                title: "Invalid Amount",
                                description: "Please enter a valid amount of CPXTB to purchase",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            const minRequired = Number(paymentData.amountCpxtb) - Number(balance);
                            if (amount < minRequired) {
                              toast({
                                title: "Insufficient Amount",
                                description: `You need to purchase at least ${minRequired.toFixed(6)} CPXTB`,
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            setProcessingPayment(true);
                            
                            try {
                              // Call API to purchase tokens
                              const response = await fetch(`/api/tokens/purchase`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  walletAddress,
                                  amount,
                                  paymentReference,
                                }),
                              });
                              
                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.message || 'Failed to purchase tokens');
                              }
                              
                              // Refresh balance after purchase
                              await refreshBalance();
                              
                              toast({
                                title: "Purchase Successful",
                                description: `Successfully purchased ${amount.toFixed(6)} CPXTB tokens`,
                              });
                              
                              // Reset buying state
                              setIsBuyingTokens(false);
                              setPurchaseAmount("");
                            } catch (error: any) {
                              toast({
                                title: "Purchase Failed",
                                description: error.message || "There was an error purchasing tokens",
                                variant: "destructive",
                              });
                            } finally {
                              setProcessingPayment(false);
                            }
                          }}
                          disabled={processingPayment}
                        >
                          {processingPayment ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                            </>
                          ) : (
                            'Purchase Tokens'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md text-center space-y-2">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Sign in to Pay</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Connect with your social account to create a wallet and complete this payment.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleSocialLogin('google')}
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
                  onClick={() => handleSocialLogin('facebook')}
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
                  onClick={() => handleSocialLogin('twitter')}
                >
                  <svg fill="#1D9BF0" className="h-4 w-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleSocialLogin('apple')}
                >
                  <svg viewBox="0 0 384 512" className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  Apple
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        
        <Separator />
        
        <CardFooter className="flex flex-col pt-4">
          <div className="rounded-md bg-gray-100 dark:bg-gray-800 p-3 text-sm w-full mb-3">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 mt-0.5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
              <div className="space-y-1 text-gray-700 dark:text-gray-300">
                <p>CPXTB is the native token of the CPXTB Mining Platform.</p>
                <p>By logging in with your social account, a secure wallet will be created for you.</p>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-center text-gray-700 dark:text-gray-300">
            <p>Powered by CPXTB Platform • Secure Payment Processing</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}