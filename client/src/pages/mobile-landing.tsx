import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, CheckCircle2, Clock, Shield, ChevronRight, BarChart, 
  Wallet, CreditCard
} from 'lucide-react';
import { Link } from 'wouter';
import MobileLayout from '@/components/mobile-layout';
import "../styles/pancake-theme.css";

export default function MobileLanding() {
  return (
    <MobileLayout title="CPXTB Platform" hideNav={false}>
      {/* Hero Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <img src="/assets/cpxtb-logo.svg" alt="CPXTB" className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2">
          <span className="text-slate-300">Business Payments,</span><br />
          <span className="text-blue-500">Simplified.</span>
        </h1>
        
        <p className="text-slate-400 text-sm text-center mb-6">
          A professional payment solution that lets your business accept cryptocurrency payments without technical complexity or specialized knowledge.
        </p>
        
        <div className="space-y-3 w-full">
          <Link href="/mobile-merchant">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-5 rounded-xl flex items-center justify-center">
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          
          <Link href="/mobile-pay">
            <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-700 text-white p-5 rounded-xl">
              View Payment Demo
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Trust Indicators */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-8">
        <div className="space-y-3">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
            <p className="text-sm text-slate-300">Trusted by 500+ merchants</p>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-green-500 mr-3" />
            <p className="text-sm text-slate-300">Fast setup in minutes</p>
          </div>
          
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-green-500 mr-3" />
            <p className="text-sm text-slate-300">No technical knowledge needed</p>
          </div>
        </div>
      </div>
      
      {/* Payment Devices Illustration */}
      <div className="bg-slate-800 rounded-xl p-5 mb-8 relative overflow-hidden">
        <div className="flex justify-center">
          <div className="w-full flex flex-col items-center">
            <div className="relative mb-4 mt-2">
              <div className="bg-slate-700 w-64 h-32 rounded-xl flex items-center justify-center">
                <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-slate-700 w-20 h-20 rounded-lg flex items-center justify-center">
                <div className="bg-green-500/20 w-10 h-10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Payment solutions on multiple devices</p>
          </div>
        </div>
      </div>
      
      {/* Enterprise Solutions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-3 text-center">
          Enterprise-Grade Payment Solutions
        </h2>
        
        <p className="text-slate-400 text-sm text-center mb-5">
          A complete crypto payment platform built for modern businesses of all sizes
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col">
            <div className="bg-blue-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <BarChart className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Detailed Analytics</h3>
            <p className="text-xs text-slate-400">Track all transactions with ease</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col">
            <div className="bg-purple-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Multi-Currency</h3>
            <p className="text-xs text-slate-400">Accept multiple tokens</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col">
            <div className="bg-cyan-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <Wallet className="h-5 w-5 text-cyan-500" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Instant Payments</h3>
            <p className="text-xs text-slate-400">Get paid in seconds</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col">
            <div className="bg-green-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <Shield className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Secure System</h3>
            <p className="text-xs text-slate-400">Enterprise-grade security</p>
          </div>
        </div>
      </div>
      
      {/* Getting Started */}
      <div className="bg-gradient-to-br from-blue-900/50 to-slate-800 rounded-xl p-4 mb-8">
        <h3 className="text-lg font-bold mb-3">Ready to get started?</h3>
        <p className="text-sm text-slate-300 mb-4">
          Accept cryptocurrency payments in your business today with our easy-to-use platform.
        </p>
        
        <Link href="/mobile-merchant">
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl flex items-center justify-between">
            <span>Start accepting payments</span>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      
      {/* Footer Navigation */}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/mobile-home">
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-sm text-slate-300">User Dashboard</p>
            </div>
          </Link>
          
          <Link href="/mobile-wallet">
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-sm text-slate-300">Wallet</p>
            </div>
          </Link>
          
          <Link href="/mobile-merchant">
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-sm text-slate-300">Merchant Tools</p>
            </div>
          </Link>
          
          <Link href="/mobile-auth">
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-sm text-slate-300">Login</p>
            </div>
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
}