import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, AlertCircle, CopyIcon, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from '@/components/mobile-layout';
import "../styles/pancake-theme.css";

export default function CheckBalance() {
  // Get address from URL query parameter using window.location instead of useLocation
  // This approach is more reliable for URL parameters
  const params = new URLSearchParams(window.location.search);
  const addressParam = params.get('address');
  
  // Debug logs
  console.log("Check Balance Page - URL:", window.location.href);
  console.log("Check Balance Page - Search params:", window.location.search);
  console.log("Check Balance Page - Address parameter:", addressParam);
  
  const [walletAddress, setWalletAddress] = useState<string>(
    addressParam || '0x6122b8784718d954659369dde67c79d9f0e4ac67'
  );
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0.002177); // Default value
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Function to fetch the current exchange rate
  const fetchExchangeRate = async () => {
    setIsLoadingRate(true);
    setRateError(null);
    try {
      const response = await fetch('/api/exchange-rate');
      const data = await response.json();
      
      if (data.success && data.exchangeRate) {
        setExchangeRate(Number(data.exchangeRate));
        console.log("Updated exchange rate:", data.exchangeRate);
      } else {
        setRateError("Failed to get current exchange rate");
        console.error("Exchange rate API error:", data);
      }
    } catch (error) {
      setRateError("Error fetching exchange rate");
      console.error("Exchange rate fetch error:", error);
    } finally {
      setIsLoadingRate(false);
    }
  };
  
  // Define checkBalance function first, so we can reference it in useEffect
  const checkBalance = async () => {
    if (!walletAddress || walletAddress.length < 40) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/balance?address=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching balance: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Balance data:", data);
      
      setBalance(data.balance);
      
      toast({
        title: "Balance Retrieved",
        description: `Wallet has ${data.balance} CPXTB`,
      });
    } catch (error) {
      console.error("Error checking balance:", error);
      toast({
        title: "Error",
        description: "Failed to retrieve wallet balance",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };
  
  // Log wallet address whenever it changes
  useEffect(() => {
    console.log("Wallet address state updated:", walletAddress);
  }, [walletAddress]);
  
  // Fetch exchange rate on component mount and periodically
  useEffect(() => {
    // Fetch exchange rate initially
    fetchExchangeRate();
    
    // Set up auto-refresh for exchange rate (every 2 minutes)
    const exchangeRateInterval = setInterval(() => {
      console.log("Auto-refreshing exchange rate...");
      fetchExchangeRate();
    }, 120000); // 2 minutes
    
    return () => clearInterval(exchangeRateInterval);
  }, []);

  // Auto-check balance when loading with address parameter
  useEffect(() => {
    if (addressParam) {
      console.log("Address parameter found, will check balance automatically");
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        console.log("Checking balance for:", walletAddress);
        checkBalance();
      }, 300);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressParam]);

  return (
    <MobileLayout title="Balance Checker" activeTab="wallet">
      {/* Tab Navigation */}
      <div className="bg-slate-800 rounded-xl p-1 flex mb-4">
        <button className="flex-1 bg-cyan-500 text-white py-2 px-4 rounded-lg font-medium">
          Check Balance
        </button>
        <button className="flex-1 text-slate-400 py-2 px-4 rounded-lg font-medium">
          Transactions
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <div className="mb-4">
          <div className="text-sm text-slate-400 mb-2">Wallet Address</div>
          <div className="bg-slate-700 rounded-xl p-3 flex justify-between items-center">
            <Input
              placeholder="Enter a wallet address (0x...)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="bg-transparent border-none font-mono text-xs flex-1 focus:outline-none focus:ring-0"
            />
            <Button 
              onClick={checkBalance}
              disabled={isLoading}
              className="ml-2 bg-cyan-500 hover:bg-cyan-600 h-9 w-9 p-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {balance !== null && (
          <div className="bg-slate-700 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Wallet Balance</h3>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-2xl font-bold text-white">{balance} <span className="text-sm font-normal text-slate-300">CPXTB</span></p>
                
                {/* USDT Equivalent calculation using dynamic exchange rate */}
                <p className="text-sm text-slate-300 mt-1">
                  ≈ ${(parseFloat(balance || '0') * exchangeRate).toFixed(2)} <span className="text-xs font-normal">USDT</span>
                  {isLoadingRate && <span className="ml-1 text-xs text-cyan-400">(updating...)</span>}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-3 bg-cyan-500 rounded-full mb-2">
                  <RefreshCw className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-slate-400">Refresh</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-600">
              <span className="text-slate-400">Address</span>
              <div className="flex items-center">
                <span className="font-mono mr-2">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                <button 
                  className="text-cyan-400 p-1" 
                  onClick={() => handleCopyToClipboard(walletAddress)}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 text-sm">Exchange Rate</span>
              <div className="flex items-center">
                <span className="text-sm">1 CPXTB = ${exchangeRate.toFixed(6)} USDT</span>
                {isLoadingRate ? (
                  <Loader2 className="h-3 w-3 animate-spin ml-2 text-cyan-400" />
                ) : (
                  <button 
                    className="ml-2 text-cyan-400" 
                    onClick={fetchExchangeRate}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            {rateError && (
              <p className="text-xs text-red-400 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {rateError}
              </p>
            )}
          </div>
          
          <div className="text-sm text-white mb-2">Quick Check</div>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium"
              onClick={() => {
                setWalletAddress('0x6122b8784718d954659369dde67c79d9f0e4ac67');
                setTimeout(checkBalance, 100);
              }}
            >
              Check Treasury Wallet
            </Button>
            <Button 
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium"
              onClick={() => {
                setWalletAddress('0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27');
                setTimeout(checkBalance, 100);
              }}
            >
              Check Platform Wallet
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}