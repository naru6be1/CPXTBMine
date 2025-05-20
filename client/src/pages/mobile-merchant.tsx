import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, DollarSign, QrCode, Clock, Copy, ExternalLink, CheckCircle2, 
  Plus, Download, FileText, ChevronRight, ChevronDown, ArrowUpRight
} from 'lucide-react';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { Link, useLocation } from 'wouter';
import MobileLayout from '@/components/mobile-layout';
import { useWallet } from "@/hooks/use-wallet";
import "../styles/pancake-theme.css";
import { Input } from '@/components/ui/input';

export default function MobileMerchant() {
  const { toast } = useToast();
  const { userInfo, walletAddress } = useSocialLogin();
  const [, setLocation] = useLocation();
  const { isConnected, address } = useWallet();
  const [copied, setCopied] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [amount, setAmount] = useState('10.00');
  const [reference, setReference] = useState(`PAY-${Date.now().toString().substring(5, 13)}`);
  const [merchantStats, setMerchantStats] = useState({
    totalPayments: 0,
    totalRevenue: '0',
    pendingPayments: 0
  });
  
  // Mock recent transactions data
  const [recentTransactions, setRecentTransactions] = useState([
    {
      id: '1',
      date: '2025-05-20',
      amount: '250.00',
      status: 'completed',
      reference: 'PAY-14829142'
    },
    {
      id: '2',
      date: '2025-05-19',
      amount: '125.00',
      status: 'completed',
      reference: 'PAY-11238795'
    },
    {
      id: '3',
      date: '2025-05-18',
      amount: '540.00',
      status: 'pending',
      reference: 'PAY-98723511'
    }
  ]);
  
  // Load merchant statistics
  useEffect(() => {
    if (walletAddress) {
      // In a real app, we would fetch this data from the backend
      // For now we're using mock data
      setMerchantStats({
        totalPayments: 8,
        totalRevenue: '1,245.00',
        pendingPayments: 2
      });
    }
  }, [walletAddress]);
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Payment reference copied to clipboard",
    });
  };
  
  const handleGenerateQrCode = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount for the payment",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingQr(true);
    
    // Simulate QR code generation delay
    setTimeout(() => {
      setIsGeneratingQr(false);
      
      // Create a new payment reference
      setReference(`PAY-${Date.now().toString().substring(5, 13)}`);
      
      toast({
        title: "QR Code Generated",
        description: "Payment QR code has been generated successfully",
      });
      
      // In a real app, we would navigate to a QR code display page
      // For now, we'll just show a success message
    }, 1500);
  };

  return (
    <MobileLayout title="Merchant Dashboard" activeTab="home">
      {/* Merchant Stats */}
      <div className="bg-slate-800 rounded-xl p-4 mb-5">
        <div className="flex justify-between items-start mb-3">
          <h1 className="text-lg font-bold">Merchant Dashboard</h1>
          <div className="bg-slate-700 p-2 rounded-full">
            <BarChart className="h-5 w-5 text-slate-300" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Total Revenue</p>
            <div className="flex items-center">
              <p className="text-xl font-bold mr-1">${merchantStats.totalRevenue}</p>
              <span className="text-xs text-green-400">+12%</span>
            </div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Total Payments</p>
            <div className="flex items-center">
              <p className="text-xl font-bold mr-1">{merchantStats.totalPayments}</p>
              <span className="text-xs text-slate-400">transactions</span>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400">Your Merchant Wallet</p>
            <p className="font-mono text-xs">{walletAddress ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Not connected'}</p>
          </div>
          <button className="text-cyan-400 p-1" onClick={() => walletAddress && handleCopyToClipboard(walletAddress)}>
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {/* Quick Payment Generator */}
      <div className="bg-slate-800 rounded-xl p-4 mb-5">
        <h2 className="text-md font-semibold mb-3">Create Payment Request</h2>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Amount (USD)</label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-slate-700 border-slate-600 focus:border-cyan-500 text-white"
              placeholder="0.00"
              type="number"
              min="0.01"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Reference</label>
            <div className="flex">
              <Input
                value={reference}
                readOnly
                className="bg-slate-700 border-slate-600 text-white rounded-r-none"
              />
              <Button 
                className="bg-slate-600 hover:bg-slate-500 rounded-l-none"
                onClick={() => handleCopyToClipboard(reference)}
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button 
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-xl font-medium flex items-center justify-center mt-2"
            onClick={handleGenerateQrCode}
            disabled={isGeneratingQr}
          >
            {isGeneratingQr ? (
              <>
                <Clock className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Generate Payment QR
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-semibold">Recent Transactions</h2>
          <Button variant="link" className="text-xs text-cyan-400 p-0 h-auto">
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {recentTransactions.map(tx => (
            <div key={tx.id} className="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
              <div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full ${tx.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'} mr-2`}></div>
                  <span className="text-sm font-medium">{tx.reference}</span>
                </div>
                <p className="text-xs text-slate-400">{tx.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">${tx.amount}</p>
                <p className="text-xs text-slate-400">{tx.status === 'completed' ? 'Completed' : 'Pending'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mb-5">
        <h2 className="text-md font-semibold mb-3">Merchant Tools</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-xl p-4 relative overflow-hidden">
            <FileText className="h-4 w-4 text-green-500 mb-2" />
            <h3 className="text-sm font-medium mb-1">Transaction Report</h3>
            <p className="text-xs text-slate-400">Download history</p>
            <div className="absolute bottom-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <ArrowUpRight className="h-3 w-3 text-white" />
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 relative overflow-hidden">
            <Plus className="h-4 w-4 text-purple-500 mb-2" />
            <h3 className="text-sm font-medium mb-1">Custom Payment</h3>
            <p className="text-xs text-slate-400">For special orders</p>
            <div className="absolute bottom-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <ArrowUpRight className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Section */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Need Help?</h3>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400">Get assistance with setting up your merchant account, configuring payment options, and resolving transaction issues.</p>
      </div>
    </MobileLayout>
  );
}