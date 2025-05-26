import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function IndexPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      {/* Logo */}
      <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 mt-8">
        <span className="text-white text-3xl font-bold">C</span>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">CPXTB Platform</h1>
      <p className="text-slate-400 mb-8 text-center">Blockchain payments made simple</p>
      
      {/* Main Navigation Buttons */}
      <div className="w-full max-w-xs mb-8">
        <Button 
          onClick={() => setLocation('/mobile-home')}
          className="w-full bg-blue-500 hover:bg-blue-600 py-6 rounded-xl font-medium mb-4"
        >
          Mobile Dashboard
        </Button>
        
        <Button 
          onClick={() => setLocation('/auth')}
          className="w-full bg-green-600 hover:bg-green-700 py-6 rounded-xl font-medium"
        >
          Merchant Login
        </Button>
      </div>
      
      {/* Direct Navigation Grid */}
      <div className="w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <a href="/mobile-pay" className="block">
            <Button className="w-full bg-slate-800 hover:bg-slate-700">
              Pay
            </Button>
          </a>
          <a href="/mobile-wallet" className="block">
            <Button className="w-full bg-slate-800 hover:bg-slate-700">
              Wallet
            </Button>
          </a>
          <a href="/mobile-profile" className="block">
            <Button className="w-full bg-slate-800 hover:bg-slate-700">
              Profile
            </Button>
          </a>
          <a href="/buy-cpxtb" className="block">
            <Button className="w-full bg-slate-800 hover:bg-slate-700">
              Buy CPXTB
            </Button>
          </a>
          <a href="/check-balance" className="block">
            <Button className="w-full bg-slate-800 hover:bg-slate-700">
              Check Balance
            </Button>
          </a>
          <a href="/auth" className="block">
            <Button className="w-full bg-slate-800 hover:bg-slate-700">
              Login
            </Button>
          </a>
        </div>
      </div>
      
      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4">
        <div className="flex justify-around max-w-md mx-auto">
          <a href="/mobile-pay" className="flex flex-col items-center text-slate-400 no-underline">
            <span>↓</span>
            <span className="text-xs mt-1">Pay</span>
          </a>
          <a href="/mobile-home" className="flex flex-col items-center text-slate-400 no-underline">
            <span>⌂</span>
            <span className="text-xs mt-1">Home</span>
          </a>
          <a href="/mobile-wallet" className="flex flex-col items-center text-slate-400 no-underline">
            <span>💰</span>
            <span className="text-xs mt-1">Wallet</span>
          </a>
          <a href="/mobile-profile" className="flex flex-col items-center text-slate-400 no-underline">
            <span>👤</span>
            <span className="text-xs mt-1">Profile</span>
          </a>
        </div>
      </div>
    </div>
  );
}