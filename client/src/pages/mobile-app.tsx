import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownIcon, Settings, LoaderCircle, Wallet, ArrowRightLeft, ChevronDown } from 'lucide-react';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { Link } from 'wouter';
import "../styles/pancake-theme.css";

export default function MobileAppPage() {
  const [fromAmount, setFromAmount] = useState<string>('0.00');
  const [toAmount, setToAmount] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { userInfo, walletAddress } = useSocialLogin();

  // For token selection (simplified for demo)
  const [fromToken, setFromToken] = useState({ symbol: 'BNB', logo: '/assets/bnb-logo.svg' });
  const [toToken, setToToken] = useState({ symbol: 'CAKE', logo: '/assets/cpxtb-logo.svg' });

  // Calculate toAmount when fromAmount changes
  useEffect(() => {
    // Simple conversion rate: 1 BNB = 459 CAKE (for example)
    const conversionRate = 459;
    const amount = parseFloat(fromAmount) || 0;
    const converted = (amount * conversionRate).toFixed(2);
    setToAmount(converted);
  }, [fromAmount]);

  // Just a UI page with no actual functionality
  const handleConnect = () => {
    toast({
      title: "Mobile App UI",
      description: "This is a demonstration of a mobile app UI similar to PancakeSwap.",
    });
  };

  return (
    <div className="pancake-theme min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-800/80">
        <div className="flex items-center space-x-2">
          <img src="/assets/cpxtb-logo.svg" alt="Logo" className="w-8 h-8" />
        </div>
        <div className="flex space-x-3">
          <button className="bg-slate-700 p-2 rounded-full">
            <Settings className="h-5 w-5 text-slate-300" />
          </button>
          <Button 
            onClick={handleConnect}
            className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-full text-sm font-medium"
          >
            Connect
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Tab Navigation */}
        <div className="bg-slate-800 rounded-xl p-1 flex mb-4">
          <button className="flex-1 bg-purple-200 text-slate-800 py-2 px-4 rounded-lg font-medium">
            Swap
          </button>
          <button className="flex-1 text-slate-400 py-2 px-4 rounded-lg font-medium">
            TWAP
          </button>
          <button className="flex-1 text-slate-400 py-2 px-4 rounded-lg font-medium">
            Limit
          </button>
          <button className="p-2 text-slate-400">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Swap Card */}
        <div className="bg-slate-800 rounded-xl p-4">
          {/* From Section */}
          <div className="mb-4">
            <div className="text-sm text-slate-400 mb-2">From</div>
            <div className="bg-slate-700 rounded-xl p-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center overflow-hidden">
                  <img src="/assets/bnb-logo.svg" alt="BNB" className="w-8 h-8" />
                </div>
                <div className="flex items-center cursor-pointer">
                  <span className="font-medium">BNB</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </div>
              <input
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="bg-transparent border-none text-right text-xl font-medium focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="relative h-8 flex justify-center my-2">
            <div className="absolute w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
              <button
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
                <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center overflow-hidden">
                  <img src="/assets/cpxtb-logo.svg" alt="CAKE" className="w-8 h-8" />
                </div>
                <div className="flex items-center cursor-pointer">
                  <span className="font-medium">CAKE</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </div>
              <input
                value={toAmount}
                readOnly
                className="bg-transparent border-none text-right text-xl font-medium focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Connect Wallet Button */}
          <Button 
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-6 rounded-xl font-medium mt-4"
            onClick={handleConnect}
          >
            Connect Wallet
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto bg-slate-800 border-t border-slate-700 p-3">
        <div className="flex justify-around">
          <Link href="/mobile">
            <div className="flex flex-col items-center text-purple-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 17.75L5.82802 22.295L7.46602 15.235L2.13502 10.255L9.32202 9.565L12 3L14.678 9.565L21.865 10.255L16.534 15.235L18.172 22.295L12 17.75Z" fill="currentColor"/>
              </svg>
              <span className="text-xs mt-1">Trade</span>
            </div>
          </Link>
          <Link href="/mobile">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="currentColor"/>
              </svg>
              <span className="text-xs mt-1">Earn</span>
            </div>
          </Link>
          <Link href="/mobile">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 20L6 4M18 20V4M12 20V4M3 8H21M3 16H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Bridge</span>
            </div>
          </Link>
          <Link href="/mobile">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 20H7C4.791 20 3 18.209 3 16V8C3 5.791 4.791 4 7 4H17C19.209 4 21 5.791 21 8V16C21 18.209 19.209 20 17 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Play</span>
            </div>
          </Link>
          <Link href="/mobile">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 10C6.10457 10 7 9.10457 7 8C7 6.89543 6.10457 6 5 6C3.89543 6 3 6.89543 3 8C3 9.10457 3.89543 10 5 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10C20.1046 10 21 9.10457 21 8C21 6.89543 20.1046 6 19 6C17.8954 6 17 6.89543 17 8C17 9.10457 17.8954 10 19 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19C13.1046 19 14 18.1046 14 17C14 15.8954 13.1046 15 12 15C10.8954 15 10 15.8954 10 17C10 18.1046 10.8954 19 12 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 14L10.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 14L13.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 8L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">More</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}