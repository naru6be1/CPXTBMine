import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, RefreshCw, Copy, CheckCircle2, ArrowRight, ChevronDown, 
  BarChart, Clock, CreditCard, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { Link, useLocation } from 'wouter';
import MobileLayout from '@/components/mobile-layout';
import "../styles/pancake-theme.css";
import { Separator } from '@/components/ui/separator';

interface Transaction {
  id: string;
  date: string;
  type: 'in' | 'out';
  amount: string;
  status: 'completed' | 'pending' | 'failed';
  from?: string;
  to?: string;
}

export default function MobileWallet() {
  const { toast } = useToast();
  const { userInfo, walletAddress, balance, refreshBalance } = useSocialLogin();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [usdValue, setUsdValue] = useState('0.00');
  
  // Mock transactions for display purposes
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2025-05-20 14:32',
      type: 'in',
      amount: '150.00',
      status: 'completed',
      from: '0x74a2...',
    },
    {
      id: '2',
      date: '2025-05-19 10:15',
      type: 'out',
      amount: '75.50',
      status: 'completed',
      to: '0x3b9f...',
    },
    {
      id: '3',
      date: '2025-05-18 16:20',
      type: 'in',
      amount: '300.00',
      status: 'completed',
      from: '0x91c3...',
    },
    {
      id: '4',
      date: '2025-05-18 09:10',
      type: 'out',
      amount: '120.00',
      status: 'pending',
      to: '0x5e88...',
    }
  ]);

  // Fetch exchange rate on component mount
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('/api/exchange-rate');
        const data = await response.json();
        if (data.success && data.exchangeRate) {
          setExchangeRate(parseFloat(data.exchangeRate));
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    };

    fetchExchangeRate();
  }, []);

  // Update USD value when balance or exchange rate changes
  useEffect(() => {
    if (exchangeRate && balance) {
      const cpxtbAmount = parseFloat(balance);
      if (!isNaN(cpxtbAmount)) {
        const usdAmount = cpxtbAmount * exchangeRate;
        setUsdValue(usdAmount.toFixed(2));
      } else {
        setUsdValue('0.00');
      }
    } else {
      setUsdValue('0.00');
    }
  }, [balance, exchangeRate]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    
    try {
      await refreshBalance();
      toast({
        title: "Balance Updated",
        description: "Your wallet balance has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not update your balance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <MobileLayout title="Wallet" activeTab="wallet">
      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-5 mb-5">
        <div className="flex justify-between mb-2">
          <p className="text-xs text-slate-400">Your Balance</p>
          <button 
            className="p-1 text-slate-400 hover:text-white" 
            onClick={handleRefreshBalance}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-baseline">
            <h1 className="text-4xl font-bold">{balance || '0'}</h1>
            <span className="text-sm text-slate-300 ml-2">CPXTB</span>
          </div>
          {exchangeRate && (
            <p className="text-sm text-cyan-400 mt-1">
              ≈ ${usdValue} USD
            </p>
          )}
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-3 flex justify-between items-center">
          <p className="font-mono text-xs overflow-hidden text-slate-300 truncate">
            {walletAddress || 'Not connected'}
          </p>
          <button className="text-cyan-400 p-1" onClick={() => walletAddress && handleCopyToClipboard(walletAddress)}>
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mb-5">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/mobile-pay">
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 flex flex-col justify-between h-24">
              <div className="bg-cyan-500 w-8 h-8 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Send</h3>
                <p className="text-xs text-slate-400">Transfer funds</p>
              </div>
            </div>
          </Link>
          
          <Link href="/mobile-pay">
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 flex flex-col justify-between h-24">
              <div className="bg-purple-500 w-8 h-8 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Receive</h3>
                <p className="text-xs text-slate-400">Get paid in CPXTB</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="bg-slate-800 rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-md font-semibold">Transaction History</h2>
          <Button variant="link" className="text-xs text-cyan-400 p-0 h-auto">
            View All
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-slate-700 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${tx.type === 'in' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                    {tx.type === 'in' ? (
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.type === 'in' ? 'Received' : 'Sent'} CPXTB</p>
                    <p className="text-xs text-slate-400">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === 'in' ? 'text-green-500' : 'text-blue-500'}`}>
                    {tx.type === 'in' ? '+' : '-'}{tx.amount}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tx.status === 'completed' ? 'Completed' : tx.status === 'pending' ? 'Pending' : 'Failed'}
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {tx.type === 'in' ? `From: ${tx.from}` : `To: ${tx.to}`}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Asset Breakdown */}
      <div className="bg-slate-800 rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-semibold">Assets</h2>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
        
        <div className="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center mr-3">
              <img src="/assets/cpxtb-logo.svg" alt="CPXTB" className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">CPXTB Token</p>
              <p className="text-xs text-slate-400">Native Token</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{balance || '0'}</p>
            <p className="text-xs text-cyan-400">${usdValue}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Access Tools */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800 rounded-xl p-3 flex flex-col items-center justify-center">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center mb-2">
            <BarChart className="h-4 w-4 text-cyan-500" />
          </div>
          <span className="text-xs">Analytics</span>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-3 flex flex-col items-center justify-center">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center mb-2">
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <span className="text-xs">History</span>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-3 flex flex-col items-center justify-center">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center mb-2">
            <CreditCard className="h-4 w-4 text-orange-500" />
          </div>
          <span className="text-xs">Buy CPXTB</span>
        </div>
      </div>
      
      {/* Market Update */}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Market Update</h3>
          <button className="text-xs text-cyan-400">Refresh</button>
        </div>
        <p className="text-xs text-green-400 mb-1">CPXTB: ${exchangeRate || '0.00'} (+5.2% 24h)</p>
        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-3/4"></div>
        </div>
      </div>
    </MobileLayout>
  );
}