import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { useSocialLogin } from '@/providers/SocialLoginProvider';
import { useToast } from '@/hooks/use-toast';
import EnhancedSocialLogin from '@/components/EnhancedSocialLogin';
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
  Clock,
  RefreshCw
} from 'lucide-react';

export default function PayPage() {
  const { paymentReference } = useParams<{ paymentReference: string }>();
  const [, setLocation] = useLocation();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [regeneratingPayment, setRegeneratingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isBuyingTokens, setIsBuyingTokens] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [isDirectQrAccess, setIsDirectQrAccess] = useState(false);
  const { isLoggedIn, userInfo, walletAddress, balance, login, refreshBalance } = useSocialLogin();
  const { toast } = useToast();

  // Fetch payment data
  // Detect QR code access and handle login state for payment context
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // There are three key scenarios:
    // 1. Direct QR access - user scanned QR without being logged in
    // 2. Post-auth redirect - user was redirected here after Google auth with loggedIn=true
    // 3. Payment context - special flag that enforces this is a payment flow
    
    // Check for these flags
    const hasLoggedInParam = urlParams.has('loggedIn');
    const hasPaymentContext = urlParams.has('paymentContext');
    const isGoogleAuth = urlParams.get('provider') === 'google';
    const hasAuthComplete = urlParams.has('authCompleted');
    
    // If we detect both loggedIn and paymentContext, this is a successful redirect
    // after Google auth for payment
    const isPostAuthRedirect = hasLoggedInParam && hasPaymentContext && isGoogleAuth;
    
    // If URL starts with /pay/ and doesn't have loggedIn=true parameter, consider it a direct QR access
    const isDirectAccess = window.location.pathname.startsWith('/pay/') && !hasLoggedInParam;
    
    // EMERGENCY FIX FOR GOOGLE AUTH: Save payment reference in sessionStorage
    // This allows recovery if the redirect after Google auth fails
    if (window.location.pathname.startsWith('/pay/')) {
      const paymentRef = window.location.pathname.split('/')[2];
      if (paymentRef) {
        // Save payment reference in sessionStorage for redirect recovery
        console.log("STORING PAYMENT REFERENCE IN SESSION STORAGE:", paymentRef);
        sessionStorage.setItem('cpxtb_payment_ref', paymentRef);
        
        // Set expiration time (10 minutes)
        const expiry = Date.now() + (10 * 60 * 1000);
        sessionStorage.setItem('cpxtb_payment_ref_expiry', expiry.toString());
      }
    }
    
    // Add enhanced diagnostic logging for troubleshooting
    console.log("PAY PAGE - QR CODE ACCESS DETECTION:", {
      currentUrl: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      isLoggedIn,
      hasWallet: Boolean(walletAddress),
      walletAddress: walletAddress || "none",
      hasLoggedInParam,
      hasPaymentContext,
      isGoogleAuth,
      isDirectAccess,
      isPostAuthRedirect
    });
    
    // Logic for determining if we show social login section:
    // 1. Always show it for direct QR access (no auth)
    // 2. Always show it if payment context is set but not logged in
    // 3. Don't show it if we're already authenticated post-redirect
    
    if (isPostAuthRedirect && isLoggedIn) {
      // We just came back from Google auth and we're logged in - hide login section
      console.log("POST-AUTH REDIRECT: User is authenticated, hiding social login");
      setIsDirectQrAccess(false);
    } else if (isDirectAccess || hasPaymentContext || !isLoggedIn) {
      // Either direct access, payment context, or not logged in - show login section
      console.log("SHOWING SOCIAL LOGIN: Direct access, payment context, or not logged in");
      setIsDirectQrAccess(true);
    } else {
      // Normal navigation to page while logged in
      console.log("NORMAL NAVIGATION: User is already logged in");
      setIsDirectQrAccess(false);
    }
    
    // If we just completed Google authentication, remove these parameters from URL
    // to prevent issues with browser refreshes
    if (isPostAuthRedirect && isLoggedIn) {
      // Keep the payment reference but clean up the URL
      try {
        const cleanUrl = `/pay/${paymentReference}`;
        window.history.replaceState({}, '', cleanUrl);
        console.log("Cleaned up URL after authentication:", cleanUrl);
      } catch (err) {
        console.error("Failed to clean up URL:", err);
      }
    }
  }, [isLoggedIn, walletAddress, paymentReference]);

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!paymentReference) {
        setError('Invalid payment reference');
        setLoading(false);
        return;
      }
      
      try {
        // FIXED URL PATH: Corrected endpoint to match server-side implementation
        const response = await fetch(`/api/payments/public/${paymentReference}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Payment not found');
          } else {
            const errorData = await response.json();
            setError(errorData.message || 'Failed to load payment data');
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log("Received payment data:", data);
        
        // Add debug logging for payment expiration issues
        console.log("Payment data from server:", {
          reference: data.payment?.paymentReference,
          status: data.payment?.status,
          expiresAt: data.payment?.expiresAt,
          serverIsExpired: data.isExpired,
          currentTime: new Date().toISOString()
        });
        
        // Calculate timestamp
        if (data.payment && data.payment.expiresAt) {
          const expiresAt = new Date(data.payment.expiresAt).getTime();
          const now = Date.now();
          const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setCountdown(timeLeft);
        }
        
        setPaymentData(data);
        setLoading(false);
        
        // If payment already completed, show success screen
        if (data.payment && data.payment.status === 'success') {
          setPaymentComplete(true);
        }
      } catch (error) {
        console.error("Failed to fetch payment data:", error);
        setError('Failed to load payment details');
        setLoading(false);
      }
    };
    
    fetchPaymentData();
  }, [paymentReference]);
  
  // Payment data poll
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (paymentData && !loading && !error && !paymentComplete) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/payments/public/${paymentReference}`);
          if (!response.ok) throw new Error('Failed to check payment status');
          
          const data = await response.json();
          
          // Update payment data
          setPaymentData(data);
          
          // Check if payment is complete
          if (data.payment && data.payment.status === 'success') {
            setPaymentComplete(true);
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Failed to poll payment status:", error);
        }
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentData, loading, error, paymentComplete, paymentReference]);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdown !== null && countdown > 0 && !paymentComplete) {
      timer = setInterval(() => {
        setCountdown(prevCountdown => {
          if (prevCountdown === null || prevCountdown <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, paymentComplete]);

  // Handle payment submission
  const handlePayment = async () => {
    if (!isLoggedIn || !walletAddress || processingPayment) return;
    
    setProcessingPayment(true);
    
    try {
      const response = await fetch(`/api/payments/public/${paymentReference}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment processing failed');
      }
      
      const data = await response.json();
      console.log("Payment processed:", data);
      
      // Show success message
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      
      // Update payment status
      setPaymentComplete(true);
      
    } catch (error: any) {
      console.error("Payment failed:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was a problem processing your payment",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };
  
  // Format countdown for display
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return "Expired";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Regenerate expired payment
  const handleRegeneratePayment = async () => {
    if (regeneratingPayment) return;
    
    setRegeneratingPayment(true);
    
    try {
      const response = await fetch(`/api/payments/public/${paymentReference}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to regenerate payment');
      }
      
      const data = await response.json();
      console.log("Payment regenerated:", data);
      
      // Show success message
      toast({
        title: "Payment Regenerated",
        description: "A new payment has been created with updated expiration time.",
      });
      
      // Navigate to the new payment reference
      if (data.payment && data.payment.paymentReference) {
        setLocation(`/pay/${data.payment.paymentReference}`);
      }
      
    } catch (error: any) {
      console.error("Failed to regenerate payment:", error);
      toast({
        title: "Regeneration Failed",
        description: error.message || "There was a problem regenerating the payment",
        variant: "destructive",
      });
    } finally {
      setRegeneratingPayment(false);
    }
  };
  
  // Copy wallet address to clipboard
  const copyWalletAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle>Loading Payment</CardTitle>
            <CardDescription>
              Please wait while we fetch your payment details
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle>Payment Error</CardTitle>
            <CardDescription>
              There was a problem loading this payment
            </CardDescription>
          </CardHeader>
          
          <CardContent className="py-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error Loading Payment</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle>Payment Successful</CardTitle>
            <CardDescription>
              Your transaction has been completed
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-4">
            <div className="rounded-lg bg-green-50 p-6 text-center mb-6">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-green-800 mb-2">Thank You!</h3>
              <p className="text-green-700 mb-4">
                Your payment of {paymentData?.payment?.amountCpxtb} CPXTB has been successfully processed.
              </p>
              
              {paymentData?.payment?.successUrl && (
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = paymentData.payment.successUrl}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Return to Merchant
                </Button>
              )}
            </div>
            
            <div className="rounded-md bg-slate-100 p-4 text-sm border border-gray-200 shadow-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-700 font-medium mb-1">Payment Reference:</p>
                  <p className="font-mono text-sm text-slate-800">{paymentReference}</p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-700 font-medium mb-1">Transaction Hash:</p>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs truncate text-slate-800">
                      {paymentData?.payment?.transactionHash || 'No transaction hash available'}
                    </span>
                    {paymentData?.payment?.transactionHash && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => {
                          const hash = paymentData.payment.transactionHash;
                          if (hash) {
                            navigator.clipboard.writeText(hash);
                            toast({
                              title: "Hash Copied",
                              description: "Transaction hash copied to clipboard",
                            });
                          }
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col pt-4">
            <div className="text-xs text-center text-slate-700">
              <p>Powered by CPXTB Platform • Secure Payment Processing</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Main payment page
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>CPXTB Payment</CardTitle>
          <CardDescription>
            Pay with CPXTB tokens
            {countdown !== null && countdown > 0 && (
              <span className="ml-2 inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 border border-yellow-200">
                <Clock className="w-3 h-3 mr-1 animate-pulse" />
                Expires in {formatCountdown(countdown)}
              </span>
            )}
            {countdown !== null && countdown <= 0 && (
              <span className="ml-2 inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-800 border border-red-200">
                Payment Expired
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          {/* Merchant and payment info */}
          <div className="rounded-lg border p-4 bg-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-slate-900">{paymentData?.merchantName}</h3>
              {paymentData?.merchantLogo && (
                <img 
                  src={paymentData.merchantLogo} 
                  alt={paymentData.merchantName} 
                  className="h-8 w-auto" 
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="text-slate-700">Amount:</div>
              <div className="font-bold text-right text-slate-900">
                ${paymentData?.payment?.amountUsdString || paymentData?.payment?.originalAmountUsd || Number(paymentData?.payment?.amountUsd || 0).toFixed(2)} USD
              </div>
              
              <div className="text-slate-700">CPXTB Amount:</div>
              <div className="font-medium text-right text-slate-900">
                {paymentData?.payment?.amountCpxtbString || paymentData?.payment?.originalAmountCpxtb || Number(paymentData?.payment?.amountCpxtb || 0).toFixed(6)} CPXTB
              </div>
            </div>
          </div>
          
          {/* Show login component on direct QR access or if forceLogin parameter is present */}
          {(isLoggedIn && !isDirectQrAccess && !new URLSearchParams(window.location.search).has('forceLogin')) ? (
            <div className="space-y-4">
              <div className="bg-slate-100 p-4 rounded-md border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-sm text-slate-800">Your Wallet</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={refreshBalance}
                  >
                    Refresh
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white p-2 rounded-md shadow-sm">
                    <p className="text-xs text-slate-700 font-medium mb-1">Address:</p>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs truncate text-slate-800">{walletAddress}</div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0 ml-1" 
                        onClick={() => {
                          navigator.clipboard.writeText(walletAddress || '');
                          toast({
                            title: "Address Copied",
                            description: "Wallet address copied to clipboard",
                          });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded-md shadow-sm">
                    <p className="text-xs text-slate-700 font-medium mb-1">Balance:</p>
                    <p className="font-medium text-slate-800">{Number(balance).toFixed(6)} CPXTB</p>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={
                  processingPayment || 
                  Number(balance) < Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 0) ||
                  (countdown !== null && countdown <= 0)
                }
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : Number(balance) < Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 0) ? (
                  'Insufficient Balance'
                ) : (countdown !== null && countdown <= 0) ? (
                  'Payment Expired'
                ) : (
                  `Pay ${Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 0).toFixed(6)} CPXTB`
                )}
              </Button>
              
              {/* Expired payment notice */}
              {countdown !== null && countdown <= 0 && !regeneratingPayment && (
                <div className="bg-red-50 p-4 rounded-md border border-red-200 text-sm shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-800" />
                    <div>
                      <p className="text-red-800 font-medium">
                        Payment Expired
                      </p>
                      <p className="mt-1 text-red-700">
                        This payment has expired. Please regenerate a new payment with a fresh expiration time.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-red-100 hover:bg-red-200 text-red-900 border-red-300 shadow-sm" 
                    variant="outline" 
                    onClick={handleRegeneratePayment}
                    disabled={regeneratingPayment}
                  >
                    {regeneratingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate Payment
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Insufficient balance warning */}
              {Number(balance) < Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 0) && 
                !isBuyingTokens && 
                (countdown === null || countdown > 0) && (
                <div className="bg-amber-50 p-4 rounded-md border border-amber-200 text-sm shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-800" />
                    <div>
                      <p className="text-amber-800 font-medium">
                        Insufficient balance
                      </p>
                      <p className="mt-1 text-amber-700">
                        Your wallet doesn't have enough CPXTB tokens. You need {Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 0).toFixed(6)} CPXTB but only have {Number(balance).toFixed(6)} CPXTB.
                      </p>
                      <p className="mt-1 text-amber-700">
                        You can purchase CPXTB tokens directly using your social login wallet.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-sm"
                      onClick={() => setIsBuyingTokens(true)}
                    >
                      Buy CPXTB Here
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm"
                      onClick={() => {
                        // Save the current payment reference to localStorage so we can return to it
                        if (paymentReference) {
                          localStorage.setItem('lastPaymentReference', paymentReference);
                        }
                        // Redirect to the buy-cpxtb page
                        setLocation(`/buy-cpxtb`);
                      }}
                    >
                      Use PayPal
                    </Button>
                  </div>
                </div>
              )}
              
              {Number(balance) < Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 0) && isBuyingTokens && (
                <div className="bg-slate-100 p-4 rounded-md border border-gray-200 shadow-sm text-sm">
                  <h3 className="font-medium mb-3 text-slate-800">Purchase CPXTB Tokens</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-sm text-slate-700 mb-1 font-medium">
                        Current price: 1 CPXTB = ${(Number(paymentData?.payment?.amountUsd || paymentData?.payment?.originalAmountUsd || paymentData?.payment?.amountUsdNumber || 0) / 
                                               Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 1)).toFixed(6)} USD
                      </p>
                      <p className="text-sm text-slate-600 mb-0">
                        You need at least {Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 0).toFixed(6)} CPXTB for this payment.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label htmlFor="purchase-amount" className="text-sm font-medium text-slate-800">
                        Amount to purchase (CPXTB)
                      </label>
                      <input
                        id="purchase-amount"
                        type="number"
                        min={Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 0) - Number(balance)}
                        step="0.000001"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                        placeholder={`Minimum ${(Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 0) - Number(balance)).toFixed(6)}`}
                        className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm"
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
                          
                          const minRequired = Number(paymentData?.payment?.amountCpxtb || paymentData?.payment?.originalAmountCpxtb || paymentData?.payment?.amountCpxtbNumber || 0) - Number(balance);
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
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-100 p-4 rounded-md text-center space-y-2 border border-gray-200 shadow-sm">
                <h3 className="font-medium text-slate-800">Sign in to Pay</h3>
                <p className="text-sm text-slate-600">
                  Connect with your social account to create a wallet and complete this payment.
                </p>
              </div>
              
              {/* Enhanced login component with real Google Auth support */}
              <EnhancedSocialLogin 
                showCard={false}
                onSuccess={(userData) => {
                  console.log("PayPage - Social login successful:", userData);
                  console.log("PayPage - Direct QR access state:", isDirectQrAccess);
                  console.log("PayPage - URL state:", {
                    path: window.location.pathname,
                    params: window.location.search,
                    fullUrl: window.location.href
                  });
                  
                  // The component now handles redirect with loggedIn=true parameter
                }}
                onError={(error) => {
                  console.error("PayPage - Social login failed:", error);
                  toast({
                    title: "Login Failed",
                    description: error.message || "Could not complete the login process",
                    variant: "destructive",
                  });
                }}
              />
            </div>
          )}
        </CardContent>
        
        <Separator />
        
        <CardFooter className="flex flex-col pt-4">
          <div className="rounded-md bg-slate-100 p-4 text-sm w-full mb-3 border border-gray-200 shadow-sm">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-4 w-4 mt-0.5 text-slate-700 flex-shrink-0" />
              <div className="space-y-2 text-slate-700">
                <p className="font-medium text-slate-800">CPXTB is the native token of the CPXTB Mining Platform.</p>
                <p>By logging in with your social account, a secure wallet will be created for you.</p>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-center text-slate-700">
            <p>Powered by CPXTB Platform • Secure Payment Processing</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}