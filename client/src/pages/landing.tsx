import React from 'react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  // Function to handle direct navigation
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      {/* Logo */}
      <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6">
        <span className="text-white text-3xl font-bold">C</span>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">CPXTB Platform</h1>
      <p className="text-slate-400 mb-8 text-center">Blockchain payments made simple</p>
      
      {/* Main Navigation Button */}
      <Button 
        className="w-full max-w-xs bg-blue-500 hover:bg-blue-600 py-6 rounded-xl font-medium mb-8"
        onClick={() => navigateTo('/mobile-home')}
      >
        Go to Mobile Dashboard
      </Button>
      
      {/* Direct Navigation Grid */}
      <div className="w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Direct Navigation</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button 
            className="bg-slate-800 hover:bg-slate-700"
            onClick={() => navigateTo('/mobile-pay')}
          >
            Pay
          </Button>
          <Button 
            className="bg-slate-800 hover:bg-slate-700"
            onClick={() => navigateTo('/mobile-home')}
          >
            Home
          </Button>
          <Button 
            className="bg-slate-800 hover:bg-slate-700"
            onClick={() => navigateTo('/mobile-wallet')}
          >
            Wallet
          </Button>
          <Button 
            className="bg-slate-800 hover:bg-slate-700"
            onClick={() => navigateTo('/mobile-profile')}
          >
            Profile
          </Button>
          <Button 
            className="bg-slate-800 hover:bg-slate-700"
            onClick={() => navigateTo('/buy-cpxtb')}
          >
            Buy CPXTB
          </Button>
          <Button 
            className="bg-slate-800 hover:bg-slate-700"
            onClick={() => navigateTo('/check-balance')}
          >
            Check Balance
          </Button>
        </div>
      </div>
      
      {/* Help Text */}
      <div className="text-slate-500 text-sm text-center mt-auto pt-8">
        <p>If navigation buttons don't work in the app, use these direct links.</p>
        <p className="mt-2">CPXTB Platform © 2025</p>
      </div>
    </div>
  );
}