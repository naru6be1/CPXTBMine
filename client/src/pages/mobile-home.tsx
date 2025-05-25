import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, ShoppingCart, ChevronRight, Wallet, 
  BarChart, ArrowUpRight, Bell, Zap, Shield 
} from 'lucide-react';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { Link, useLocation } from 'wouter';
import MobileLayout from '@/components/mobile-layout';
import { useWallet } from "@/hooks/use-wallet";
import "../styles/pancake-theme.css";

export default function MobileHome() {
  const { toast } = useToast();
  const { userInfo, walletAddress } = useSocialLogin();
  const [, setLocation] = useLocation();
  const { isConnected, address } = useWallet();
  const [features, setFeatures] = useState([
    {
      id: 1,
      title: "Make Payment",
      description: "Pay merchants instantly with CPXTB tokens",
      icon: <CreditCard className="h-5 w-5 text-cyan-500" />,
      link: "/mobile"
    },
    {
      id: 2,
      title: "Check Balance",
      description: "View your wallet balance and transaction history",
      icon: <Wallet className="h-5 w-5 text-purple-500" />,
      link: "/check-balance"
    },
    {
      id: 3,
      title: "Buy CPXTB",
      description: "Purchase CPXTB tokens using PayPal",
      icon: <ShoppingCart className="h-5 w-5 text-green-500" />,
      link: "/buy-cpxtb"
    },
    {
      id: 4,
      title: "Merchant Dashboard",
      description: "Access your merchant tools and payment history",
      icon: <BarChart className="h-5 w-5 text-orange-500" />,
      link: "/mobile-merchant"
    }
  ]);

  return (
    <MobileLayout title="CPXTB Platform" activeTab="home">
      {/* Hero Section */}
      <div className="bg-slate-800 rounded-xl p-5 mb-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome to CPXTB</h1>
            <p className="text-slate-400 text-sm">Blockchain payments made simple</p>
          </div>
          <div className="bg-slate-700 p-2 rounded-full">
            <Bell className="h-5 w-5 text-slate-300" />
          </div>
        </div>

        {walletAddress ? (
          <div className="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400">Your Wallet</p>
              <p className="font-mono text-xs">{walletAddress.substring(0, 10)}...{walletAddress.substring(walletAddress.length - 4)}</p>
            </div>
            <Link href="/check-balance">
              <Button className="bg-cyan-500 hover:bg-cyan-600 h-8 rounded-lg text-xs">
                Check Balance
              </Button>
            </Link>
          </div>
        ) : (
          <Link href="/auth">
            <Button className="w-full bg-cyan-500 hover:bg-cyan-600 py-3 rounded-xl font-medium">
              Connect Wallet
            </Button>
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-xl p-4 relative overflow-hidden">
            <Zap className="h-4 w-4 text-cyan-500 mb-2" />
            <h3 className="text-sm font-medium mb-1">Pay Now</h3>
            <p className="text-xs text-slate-400">Fast crypto payment</p>
            <Link href="/mobile">
              <div className="absolute bottom-3 right-3 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-3 w-3 text-white" />
              </div>
            </Link>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 relative overflow-hidden">
            <ShoppingCart className="h-4 w-4 text-purple-500 mb-2" />
            <h3 className="text-sm font-medium mb-1">Buy CPXTB</h3>
            <p className="text-xs text-slate-400">Get tokens with PayPal</p>
            <Link href="/buy-cpxtb">
              <div className="absolute bottom-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-3 w-3 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Services</h2>
        </div>
        <div className="space-y-3">
          {features.map(feature => (
            <Link key={feature.id} href={feature.link}>
              <div className="bg-slate-800 rounded-xl p-4 flex items-center">
                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center mr-3">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="text-xs text-slate-400">{feature.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 bg-slate-800/50 rounded-xl p-4 flex items-center">
        <Shield className="h-5 w-5 text-cyan-500 mr-3" />
        <div>
          <p className="text-xs text-slate-300">Your security is our priority</p>
          <p className="text-xs text-slate-400">All transactions are securely processed on the blockchain</p>
        </div>
      </div>
      
      {/* Direct Navigation Buttons (Fallback) */}
      <div className="mt-5 bg-red-900/30 rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3">Direct Navigation</h3>
        <p className="text-xs text-red-300 mb-3">If the bottom navigation isn't working, use these direct links:</p>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="bg-slate-700 py-2 px-4 rounded-lg text-sm" 
            onClick={() => { window.location.href = "/mobile-pay"; }}
          >
            Go to Pay
          </button>
          <button 
            className="bg-slate-700 py-2 px-4 rounded-lg text-sm" 
            onClick={() => { window.location.href = "/mobile-home"; }}
          >
            Go to Home
          </button>
          <button 
            className="bg-slate-700 py-2 px-4 rounded-lg text-sm" 
            onClick={() => { window.location.href = "/mobile-wallet"; }}
          >
            Go to Wallet
          </button>
          <button 
            className="bg-slate-700 py-2 px-4 rounded-lg text-sm" 
            onClick={() => { window.location.href = "/mobile-profile"; }}
          >
            Go to Profile
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}