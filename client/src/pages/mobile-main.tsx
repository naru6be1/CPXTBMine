import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, CheckCircle2, Shield, Wallet, CreditCard, 
  BarChart, Clock, ChevronRight, Globe, Zap, Lock, DollarSign
} from 'lucide-react';
import { Link } from 'wouter';
import "../styles/pancake-theme.css";

export default function MobileMain() {
  return (
    <div className="pancake-theme min-h-screen bg-slate-900 text-white flex flex-col pb-16">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-800/80">
        <div className="flex items-center space-x-2">
          <img src="/assets/cpxtb-logo.svg" alt="Logo" className="w-8 h-8" />
          <span className="font-medium">CPXTB Platform</span>
        </div>
        <div className="flex space-x-3">
          <Link href="/mobile-auth">
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600 px-3 py-1 rounded-full text-sm font-medium"
            >
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-4 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <img src="/assets/cpxtb-logo.svg" alt="CPXTB" className="w-12 h-12" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">
            <div className="text-slate-300">Business Payments,</div>
            <div className="text-blue-500">Simplified.</div>
          </h1>
          
          <p className="text-slate-400 mb-8 max-w-md">
            A professional payment solution that lets your business accept cryptocurrency payments without technical complexity or specialized knowledge.
          </p>
          
          <div className="space-y-3 w-full max-w-xs">
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
      </div>
      
      {/* Device Preview */}
      <div className="relative -mt-10 mb-12 px-4">
        <div className="bg-slate-800 rounded-xl p-5 shadow-lg shadow-black/30">
          <div className="relative flex justify-center items-center py-4">
            <div className="absolute z-10 bg-blue-500 h-14 w-14 rounded-xl flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div className="relative z-0 w-48 h-36 bg-slate-700 rounded-xl mr-6"></div>
            <div className="relative z-0 w-32 h-24 bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      </div>
      
      {/* Trust Indicators */}
      <div className="px-4 mb-12">
        <div className="bg-slate-800/70 rounded-xl p-5">
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-sm text-slate-300">Trusted by 500+ merchants</p>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-sm text-slate-300">Fast setup in minutes</p>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                <Shield className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-sm text-slate-300">No technical knowledge needed</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features */}
      <div className="px-4 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Enterprise-Grade Features</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col">
            <div className="bg-blue-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Global Payments</h3>
            <p className="text-xs text-slate-400">Accept payments from anywhere</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col">
            <div className="bg-green-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <Zap className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Instant Transfers</h3>
            <p className="text-xs text-slate-400">No waiting for settlement</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col">
            <div className="bg-purple-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Secure Platform</h3>
            <p className="text-xs text-slate-400">Enterprise-grade security</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col">
            <div className="bg-cyan-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <BarChart className="h-5 w-5 text-cyan-500" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Detailed Analytics</h3>
            <p className="text-xs text-slate-400">Track all transactions</p>
          </div>
        </div>
      </div>
      
      {/* Testimonial */}
      <div className="px-4 mb-12">
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-slate-700 rounded-full mr-4"></div>
            <div>
              <p className="text-sm font-semibold">Sarah Johnson</p>
              <p className="text-xs text-slate-400">CEO at TechCorp</p>
            </div>
          </div>
          <p className="text-sm italic text-slate-300 mb-3">
            "CPXTB has transformed how we accept payments. Setup was quick and our customers love the simplicity."
          </p>
          <div className="flex">
            <CheckCircle2 className="h-4 w-4 text-yellow-500 mr-1" />
            <CheckCircle2 className="h-4 w-4 text-yellow-500 mr-1" />
            <CheckCircle2 className="h-4 w-4 text-yellow-500 mr-1" />
            <CheckCircle2 className="h-4 w-4 text-yellow-500 mr-1" />
            <CheckCircle2 className="h-4 w-4 text-yellow-500" />
          </div>
        </div>
      </div>
      
      {/* Enterprise Solutions */}
      <div className="px-4 mb-12">
        <h2 className="text-xl font-bold mb-3 text-center">
          Complete Payment Solutions
        </h2>
        
        <p className="text-slate-400 text-sm text-center mb-6">
          A complete crypto payment platform built for modern businesses of all sizes
        </p>
        
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-5 mb-5">
          <div className="flex items-center mb-3">
            <div className="bg-cyan-500/20 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <CreditCard className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-md font-semibold">Merchant Dashboard</h3>
              <p className="text-xs text-slate-400">Complete control of your payments</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            Manage all your crypto payments from a single, intuitive dashboard with detailed reporting.
          </p>
          <Link href="/mobile-merchant">
            <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg flex items-center justify-between">
              <span>Explore Merchant Tools</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-5">
          <div className="flex items-center mb-3">
            <div className="bg-purple-500/20 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <Wallet className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-md font-semibold">Digital Wallet</h3>
              <p className="text-xs text-slate-400">Secure crypto storage</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            Store, manage and track your cryptocurrency with our secure and user-friendly wallet interface.
          </p>
          <Link href="/mobile-wallet">
            <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg flex items-center justify-between">
              <span>View Wallet Features</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="px-4 mb-12">
        <div className="bg-gradient-to-br from-blue-600/80 to-purple-600/80 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-white text-sm mb-5">
            Join hundreds of businesses already accepting cryptocurrency payments.
          </p>
          <Link href="/mobile-auth">
            <Button className="w-full bg-white text-blue-600 hover:bg-slate-100 p-4 rounded-xl font-medium">
              Create Your Account
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-auto bg-slate-800 py-6 px-4">
        <div className="flex justify-center mb-4">
          <img src="/assets/cpxtb-logo.svg" alt="CPXTB" className="w-10 h-10" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link href="/mobile-home">
            <div className="text-center text-sm text-slate-400">Dashboard</div>
          </Link>
          <Link href="/mobile-pay">
            <div className="text-center text-sm text-slate-400">Payments</div>
          </Link>
          <Link href="/mobile-wallet">
            <div className="text-center text-sm text-slate-400">Wallet</div>
          </Link>
          <Link href="/mobile-merchant">
            <div className="text-center text-sm text-slate-400">Merchant</div>
          </Link>
        </div>
        
        <div className="text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} CPXTB Platform. All rights reserved.
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-3">
        <div className="flex justify-around">
          <Link href="/mobile-home">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Home</span>
            </div>
          </Link>
          <Link href="/mobile-pay">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Pay</span>
            </div>
          </Link>
          <Link href="/mobile-wallet">
            <div className="flex flex-col items-center text-slate-400">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 10H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Wallet</span>
            </div>
          </Link>
          <Link href="/mobile-profile">
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