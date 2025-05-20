import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownIcon, Settings, LoaderCircle, Wallet, ArrowRightLeft, ChevronDown, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { Link, useLocation } from 'wouter';
import "../styles/pancake-theme.css";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/hooks/use-wallet";

export default function MobileAppPage() {
  const [fromAmount, setFromAmount] = useState<string>('10.00');
  const [toAmount, setToAmount] = useState<string>('5000');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { userInfo, walletAddress } = useSocialLogin();
  const [, setLocation] = useLocation();
  const { isConnected, address, balance } = useWallet();

  // For payment details
  const [merchantName, setMerchantName] = useState('CPXTB Platform');
  const [merchantWallet, setMerchantWallet] = useState('0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27');
  const [paymentRef, setPaymentRef] = useState(`PAY-${Date.now().toString().substring(0, 10)}`);

  // Calculate toAmount when fromAmount changes
  useEffect(() => {
    // Simple conversion rate: 1 USD = 500 CPXTB
    const conversionRate = 500;
    const amount = parseFloat(fromAmount) || 0;
    const converted = (amount * conversionRate).toString();
    setToAmount(converted);
  }, [fromAmount]);

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const handleConnect = () => {
    if (userInfo && walletAddress) {
      toast({
        title: "Already Connected",
        description: "Your wallet is already connected.",
      });
    } else {
      setLocation("/auth");
    }
  };

  const handlePayment = async () => {
    if (!userInfo || !walletAddress) {
      toast({
        title: "Login Required",
        description: "Please connect your wallet to make a payment.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate a blockchain transaction
      const paymentResponse = await simulatePayment(fromAmount, walletAddress, merchantWallet);
      
      if (paymentResponse.success) {
        setTxHash(paymentResponse.txHash);
        setPaymentSuccess(true);
        toast({
          title: "Payment Successful!",
          description: `You've sent ${toAmount} CPXTB tokens successfully.`,
        });
      } else {
        toast({
          title: "Payment Failed",
          description: paymentResponse.message || "There was an error processing your payment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate a blockchain payment for demo purposes
  const simulatePayment = async (amount, fromWallet, toWallet) => {
    // This is just a simulation - in a real app, this would interact with the blockchain
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          txHash: "0x" + Math.random().toString(16).substr(2, 40),
          amount: amount,
          fromWallet: fromWallet,
          toWallet: toWallet
        });
      }, 2000);
    });
  };

  return (
    <div className="pancake-theme min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-800/80">
        <div className="flex items-center space-x-2">
          <img src="/assets/cpxtb-logo.svg" alt="Logo" className="w-8 h-8" />
          <span className="font-medium">CPXTB Pay</span>
        </div>
        <div className="flex space-x-3">
          {userInfo && walletAddress ? (
            <div className="bg-slate-700 py-1 px-3 rounded-full text-sm font-medium flex items-center">
              <span className="mr-1 text-xs">{walletAddress.substring(0, 4)}...{walletAddress.substring(walletAddress.length - 4)}</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          ) : (
            <Button 
              onClick={handleConnect}
              className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-full text-sm font-medium"
            >
              Connect
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6">
        {paymentSuccess ? (
          /* Success View */
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-1">Payment Successful!</h2>
              <p className="text-slate-400 text-center">
                Your payment of {toAmount} CPXTB has been processed successfully.
              </p>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-400">Amount</span>
                <span className="font-medium">{toAmount} CPXTB</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-400">Reference</span>
                <span className="font-medium">{paymentRef}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-400">Merchant</span>
                <span className="font-medium">{merchantName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Transaction</span>
                <div className="flex items-center">
                  <span className="font-mono text-xs mr-1">{txHash.substring(0, 6)}...{txHash.substring(txHash.length - 4)}</span>
                  <button 
                    className="text-cyan-400 p-1" 
                    onClick={() => handleCopyToClipboard(txHash)}
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={() => window.open(`https://basescan.org/tx/${txHash}`, '_blank')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium"
              >
                View on Explorer
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                onClick={() => setLocation("/")}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-xl font-medium"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="bg-slate-800 rounded-xl p-1 flex mb-4">
              <button className="flex-1 bg-cyan-500 text-white py-2 px-4 rounded-lg font-medium">
                Pay
              </button>
              <button className="flex-1 text-slate-400 py-2 px-4 rounded-lg font-medium">
                History
              </button>
              <button className="flex-1 text-slate-400 py-2 px-4 rounded-lg font-medium">
                Wallet
              </button>
            </div>

            {/* Payment Card */}
            <div className="bg-slate-800 rounded-xl p-4 mb-4">
              <div className="mb-5">
                <div className="text-sm text-slate-400 mb-2">Merchant</div>
                <div className="bg-slate-700 rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-slate-300" />
                    </div>
                    <div>
                      <span className="font-medium">{merchantName}</span>
                      <p className="text-xs text-slate-400">{merchantWallet.substring(0, 6)}...{merchantWallet.substring(merchantWallet.length - 4)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* USD Amount Section */}
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">Amount (USD)</div>
                <div className="bg-slate-700 rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                      <span className="text-xs font-bold">$</span>
                    </div>
                  </div>
                  <input
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="bg-transparent border-none text-right text-xl font-medium focus:outline-none w-full"
                    placeholder="0.00"
                    type="number"
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Conversion Arrow */}
              <div className="relative h-8 flex justify-center my-2">
                <div className="absolute w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                  <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center">
                    <ArrowDownIcon className="h-4 w-4 text-cyan-400" />
                  </div>
                </div>
              </div>

              {/* CPXTB Token Amount */}
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">Pay with CPXTB</div>
                <div className="bg-slate-700 rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center overflow-hidden">
                      <img src="/assets/cpxtb-logo.svg" alt="CPXTB" className="w-8 h-8" />
                    </div>
                    <span className="font-medium">CPXTB</span>
                  </div>
                  <input
                    value={toAmount}
                    readOnly
                    className="bg-transparent border-none text-right text-xl font-medium focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Exchange rate: 1 USD = 500 CPXTB
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Reference</span>
                  <span className="text-sm font-mono">{paymentRef}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Your wallet</span>
                  <span className="text-sm font-mono">
                    {walletAddress ? 
                      `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 
                      'Not connected'}
                  </span>
                </div>
              </div>

              {/* Payment Button */}
              <Button 
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-4 rounded-xl font-medium mt-2"
                onClick={handlePayment}
                disabled={isLoading || !walletAddress}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : walletAddress ? 'Pay Now' : 'Connect Wallet'}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto bg-slate-800 border-t border-slate-700 p-3">
        <div className="flex justify-around">
          <Link href="/mobile">
            <div className="flex flex-col items-center text-cyan-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Pay</span>
            </div>
          </Link>
          <Link href="/">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Home</span>
            </div>
          </Link>
          <Link href="/check-balance">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 10H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Wallet</span>
            </div>
          </Link>
          <Link href="/profile">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Profile</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}