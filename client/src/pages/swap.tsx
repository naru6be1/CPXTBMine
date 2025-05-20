import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownIcon, Settings, LoaderCircle, Wallet, Disc3, ChevronDown } from 'lucide-react';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { Link } from 'wouter';

export default function SwapPage() {
  const [fromAmount, setFromAmount] = useState<string>('0.00');
  const [toAmount, setToAmount] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0.002177); // Default value
  const { toast } = useToast();
  const { userInfo, walletAddress } = useSocialLogin();

  // For token selection (simplified for demo)
  const [fromToken, setFromToken] = useState({ symbol: 'BNB', logo: '/assets/bnb-logo.svg' });
  const [toToken, setToToken] = useState({ symbol: 'CPXTB', logo: '/assets/token-logo.png' });

  // Calculate toAmount when fromAmount changes
  useEffect(() => {
    // Simple conversion rate: 1 BNB = 459 CPXTB (for example)
    const conversionRate = 459;
    const amount = parseFloat(fromAmount) || 0;
    const converted = (amount * conversionRate).toFixed(2);
    setToAmount(converted);
  }, [fromAmount]);

  const handleSwap = () => {
    if (!userInfo || !walletAddress) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to swap tokens.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(fromAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulating a swap operation
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Swap Simulated",
        description: `Swapped ${fromAmount} ${fromToken.symbol} to ${toAmount} ${toToken.symbol}`,
      });
    }, 1500);
  };

  const switchTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-800">
        <div className="flex items-center space-x-2">
          <Disc3 className="text-amber-400 h-6 w-6" />
        </div>
        <div className="flex space-x-4">
          <button className="bg-slate-700 p-2 rounded-full">
            <Settings className="h-5 w-5 text-slate-300" />
          </button>
          <button className="bg-cyan-500 px-4 py-2 rounded-full text-sm font-medium">
            Connect
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 py-6">
        <div className="bg-slate-800 rounded-xl p-1 flex mb-4">
          <button className="flex-1 bg-slate-700 text-white py-2 px-4 rounded-lg font-medium">
            Swap
          </button>
          <button className="flex-1 text-slate-400 py-2 px-4 rounded-lg font-medium">
            TWAP
          </button>
          <button className="flex-1 text-slate-400 py-2 px-4 rounded-lg font-medium">
            Limit
          </button>
          <button className="p-2 text-slate-400">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Swap Card */}
        <div className="bg-slate-800 rounded-xl p-4">
          {/* From Section */}
          <div className="mb-4">
            <div className="text-sm text-slate-400 mb-2">From</div>
            <div className="bg-slate-700 rounded-xl p-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                  <span className="text-xs">BNB</span>
                </div>
                <div className="flex items-center cursor-pointer">
                  <span className="font-medium">{fromToken.symbol}</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </div>
              <Input
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="bg-transparent border-none text-right text-xl font-medium focus:outline-none focus:ring-0 w-[120px]"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="relative h-8 flex justify-center my-2">
            <div className="absolute w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
              <button
                onClick={switchTokens}
                className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700"
              >
                <ArrowDownIcon className="h-4 w-4 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* To Section */}
          <div className="mb-4">
            <div className="text-sm text-slate-400 mb-2">To</div>
            <div className="bg-slate-700 rounded-xl p-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center">
                  <span className="text-xs">CPXTB</span>
                </div>
                <div className="flex items-center cursor-pointer">
                  <span className="font-medium">{toToken.symbol}</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </div>
              <Input
                value={toAmount}
                readOnly
                className="bg-transparent border-none text-right text-xl font-medium focus:outline-none focus:ring-0 w-[120px]"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Connect Wallet Button */}
          <Button 
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-6 rounded-xl font-medium mt-4"
            onClick={walletAddress ? handleSwap : () => {}}
          >
            {isLoading ? (
              <LoaderCircle className="h-5 w-5 animate-spin mr-2" />
            ) : null}
            {walletAddress ? "Swap" : "Connect Wallet"}
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto bg-slate-800 border-t border-slate-700 p-3">
        <div className="flex justify-around">
          <Link href="/">
            <div className="flex flex-col items-center text-cyan-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 17.75L5.82802 22.295L7.46602 15.235L2.13502 10.255L9.32202 9.565L12 3L14.678 9.565L21.865 10.255L16.534 15.235L18.172 22.295L12 17.75Z" fill="currentColor"/>
              </svg>
              <span className="text-xs mt-1">Trade</span>
            </div>
          </Link>
          <Link href="/buy-cpxtb">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="currentColor"/>
              </svg>
              <span className="text-xs mt-1">Earn</span>
            </div>
          </Link>
          <Link href="/merchant">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 20L6 4M18 20V4M12 20V4M3 8H21M3 16H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Bridge</span>
            </div>
          </Link>
          <Link href="/profile">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 20H7C4.791 20 3 18.209 3 16V8C3 5.791 4.791 4 7 4H17C19.209 4 21 5.791 21 8V16C21 18.209 19.209 20 17 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Play</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}