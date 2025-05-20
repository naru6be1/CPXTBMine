import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Shield, Wallet, Copy, ExternalLink, CheckCircle2, 
  LogOut, Settings, Mail, Edit, ChevronRight, Bell
} from 'lucide-react';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { Link, useLocation } from 'wouter';
import MobileLayout from '@/components/mobile-layout';
import { useWallet } from "@/hooks/use-wallet";
import "../styles/pancake-theme.css";
import { Separator } from "@/components/ui/separator";

export default function MobileProfile() {
  const { toast } = useToast();
  const { userInfo, walletAddress } = useSocialLogin();
  const [, setLocation] = useLocation();
  const { isConnected, address } = useWallet();
  
  // Function to clear stored data and log out
  const clearStoredData = () => {
    // Clear localStorage items
    localStorage.removeItem('userInfo');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('authorization');
    localStorage.removeItem('socialLoginData');
  };
  const [copied, setCopied] = useState(false);
  const [balanceData, setBalanceData] = useState({
    cpxtb: "0",
    usdValue: "0"
  });
  
  // Fetch balance data
  useEffect(() => {
    if (walletAddress) {
      // In a real app, we would fetch the balance from the blockchain
      // For now, we'll just use a static value
      setBalanceData({
        cpxtb: "5,000",
        usdValue: "11.00"
      });
    }
  }, [walletAddress]);
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };
  
  const handleLogout = () => {
    clearStoredData();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    setLocation("/");
  };

  return (
    <MobileLayout title="Profile" activeTab="profile">
      {/* Profile Header */}
      <div className="bg-slate-800 rounded-xl p-6 mb-5">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mr-4">
            <User className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{userInfo?.name || "Anonymous User"}</h1>
            <p className="text-slate-400 text-sm">{userInfo?.email || "No email available"}</p>
            <div className="flex items-center mt-1">
              <div className="bg-green-500 w-2 h-2 rounded-full mr-2"></div>
              <span className="text-xs text-slate-300">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="bg-slate-800 rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Your Wallet</h2>
          <Link href="/check-balance">
            <Button className="bg-transparent hover:bg-slate-700 p-2 h-8 w-8 rounded-full">
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Button>
          </Link>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-4 mb-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-3xl font-bold">{balanceData.cpxtb}</p>
              <p className="text-sm text-slate-400">≈ ${balanceData.usdValue} USD</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-cyan-500 flex items-center justify-center">
              <img src="/assets/cpxtb-logo.svg" alt="CPXTB" className="h-8 w-8" />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs border-t border-slate-600 pt-3 mt-2">
            <span className="text-slate-400">Wallet Address</span>
            <div className="flex items-center">
              <span className="font-mono mr-2">
                {walletAddress ? 
                  `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 
                  'Not connected'}
              </span>
              {walletAddress && (
                <button 
                  className="text-cyan-400 p-1" 
                  onClick={() => handleCopyToClipboard(walletAddress)}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Link href="/buy-cpxtb">
            <Button className="w-full bg-cyan-500 hover:bg-cyan-600 py-2.5 rounded-xl">
              Buy CPXTB
            </Button>
          </Link>
          <Link href="/mobile">
            <Button className="w-full bg-slate-700 hover:bg-slate-600 py-2.5 rounded-xl">
              Make Payment
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Settings Section */}
      <div className="bg-slate-800 rounded-xl p-4 mb-5">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        
        <div className="space-y-1">
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-700 rounded-lg">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                <User className="h-4 w-4 text-purple-400" />
              </div>
              <span>Account Information</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </button>
          
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-700 rounded-lg">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center mr-3">
                <Wallet className="h-4 w-4 text-cyan-400" />
              </div>
              <span>Wallet Settings</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </button>
          
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-700 rounded-lg">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                <Bell className="h-4 w-4 text-green-400" />
              </div>
              <span>Notifications</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </button>
          
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-700 rounded-lg">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center mr-3">
                <Shield className="h-4 w-4 text-orange-400" />
              </div>
              <span>Security & Privacy</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      </div>
      
      {/* Logout Button */}
      <Button 
        className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium flex items-center justify-center"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
      
      <div className="mt-4 text-center text-xs text-slate-500">
        <p>Version 1.0.0</p>
        <p className="mt-1">© 2025 CPXTB Platform</p>
      </div>
    </MobileLayout>
  );
}