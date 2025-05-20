import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, QrCode, RefreshCw, Copy, ArrowRight, CheckCircle2, DollarSign
} from 'lucide-react';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { useLocation } from 'wouter';
import MobileLayout from '@/components/mobile-layout';
import "../styles/pancake-theme.css";
import { Input } from '@/components/ui/input';

export default function MobilePay() {
  const { toast } = useToast();
  const { userInfo, walletAddress, balance, refreshBalance } = useSocialLogin();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [usdValue, setUsdValue] = useState('0.00');

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

  // Update USD value when amount or exchange rate changes
  useEffect(() => {
    if (exchangeRate && amount) {
      const cpxtbAmount = parseFloat(amount);
      if (!isNaN(cpxtbAmount)) {
        const usdAmount = cpxtbAmount * exchangeRate;
        setUsdValue(usdAmount.toFixed(2));
      } else {
        setUsdValue('0.00');
      }
    } else {
      setUsdValue('0.00');
    }
  }, [amount, exchangeRate]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
  };

  const handleSend = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to send",
        variant: "destructive"
      });
      return;
    }

    if (!recipient || !recipient.startsWith('0x')) {
      toast({
        title: "Invalid Recipient",
        description: "Please enter a valid wallet address",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    // In a real app, you would make a blockchain transaction here
    // For now, we'll just simulate a delay and show a success message
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Payment Sent!",
        description: `${amount} CPXTB sent successfully to ${recipient.substring(0, 8)}...`,
      });
      
      // Clear form
      setAmount('');
      setRecipient('');
      
      // Refresh balance
      refreshBalance();
    }, 2000);
  };

  const handleScanQR = () => {
    toast({
      title: "QR Scanner",
      description: "Camera access required for QR code scanning",
    });
    // In a real app, you would open the camera to scan a QR code
  };

  return (
    <MobileLayout title="Pay" activeTab="pay">
      {/* Balance Card */}
      <div className="bg-slate-800 rounded-xl p-4 mb-5">
        <p className="text-xs text-slate-400 mb-1">Available Balance</p>
        <div className="flex items-baseline">
          <h1 className="text-2xl font-bold">{balance || '0'}</h1>
          <span className="text-sm text-slate-300 ml-1">CPXTB</span>
        </div>
        <div className="flex items-center mt-1">
          <span className="text-xs text-green-400">≈ ${usdValue}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-5 ml-1"
            onClick={() => refreshBalance()}
          >
            <RefreshCw className="h-3 w-3 text-slate-400" />
          </Button>
        </div>
      </div>

      {/* Send Payment Form */}
      <div className="bg-slate-800 rounded-xl p-4 mb-5">
        <h2 className="text-md font-semibold mb-4">Send Payment</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Recipient Address</label>
            <div className="flex">
              <Input
                value={recipient}
                onChange={handleRecipientChange}
                className="bg-slate-700 border-slate-600 focus:border-cyan-500 text-white rounded-r-none flex-1"
                placeholder="0x..."
              />
              <Button 
                className="bg-slate-600 hover:bg-slate-500 rounded-l-none"
                onClick={handleScanQR}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Amount (CPXTB)</label>
            <Input
              value={amount}
              onChange={handleAmountChange}
              className="bg-slate-700 border-slate-600 focus:border-cyan-500 text-white"
              placeholder="0.00"
              type="number"
              min="0.01"
              step="0.01"
            />
            {exchangeRate && (
              <p className="text-xs text-slate-400 mt-1">
                ≈ ${usdValue} USD
              </p>
            )}
          </div>
          
          <Button 
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-xl font-medium flex items-center justify-center mt-2"
            onClick={handleSend}
            disabled={isProcessing || !amount || !recipient}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send CPXTB
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Receive Payment Card */}
      <div className="bg-slate-800 rounded-xl p-4 mb-5">
        <h2 className="text-md font-semibold mb-3">Receive Payment</h2>
        <p className="text-sm text-slate-400 mb-3">Share your wallet address to receive CPXTB tokens from other users.</p>
        
        <div className="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
          <p className="font-mono text-xs overflow-hidden text-slate-300 truncate">
            {walletAddress || 'Not connected'}
          </p>
          <button className="text-cyan-400 p-1" onClick={() => walletAddress && handleCopyToClipboard(walletAddress)}>
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        
        <Button 
          className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium flex items-center justify-center mt-3"
          onClick={() => setLocation('/mobile-qr')}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Show QR Code
        </Button>
      </div>
      
      {/* Payment History Link */}
      <Button 
        className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-between"
        variant="ghost"
        onClick={() => setLocation('/mobile-transactions')}
      >
        <div className="flex items-center">
          <div className="bg-slate-600 p-2 rounded-lg mr-3">
            <DollarSign className="h-4 w-4 text-cyan-500" />
          </div>
          <span>Transaction History</span>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400" />
      </Button>
    </MobileLayout>
  );
}