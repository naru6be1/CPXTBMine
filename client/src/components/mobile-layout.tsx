import React from 'react';
import { Link } from 'wouter';
import { Settings, Home, Wallet, User, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { NavigationButton } from './navigation-helper';
import "../styles/pancake-theme.css";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  activeTab?: 'pay' | 'home' | 'wallet' | 'profile';
  showSettings?: boolean;
  hideNav?: boolean;
}

export default function MobileLayout({ 
  children, 
  title = "CPXTB Platform", 
  activeTab = 'pay',
  showSettings = true,
  hideNav = false
}: MobileLayoutProps) {
  const { userInfo, walletAddress } = useSocialLogin();

  const handleConnect = () => {
    // Handle connect logic is in the specific page components
  };

  return (
    <div className="pancake-theme min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-800/80">
        <div className="flex items-center space-x-2">
          <img src="/assets/cpxtb-logo.svg" alt="Logo" className="w-8 h-8" />
          <span className="font-medium">{title}</span>
        </div>
        <div className="flex space-x-3">
          {showSettings && (
            <button className="bg-slate-700 p-2 rounded-full">
              <Settings className="h-5 w-5 text-slate-300" />
            </button>
          )}
          {userInfo && walletAddress ? (
            <div className="bg-slate-700 py-1 px-3 rounded-full text-sm font-medium flex items-center">
              <span className="mr-1 text-xs">{walletAddress.substring(0, 4)}...{walletAddress.substring(walletAddress.length - 4)}</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          ) : (
            <Link href="/auth">
              <Button 
                className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-full text-sm font-medium"
              >
                Connect
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6">
        {children}
      </div>

      {/* Bottom Navigation */}
      {!hideNav && (
        <div className="bg-slate-800 border-t border-slate-700 p-3">
          <div className="flex justify-around">
            <NavigationButton destination="/mobile-pay" active={activeTab === 'pay'}>
              <div className="flex flex-col items-center">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs mt-1">Pay</span>
              </div>
            </NavigationButton>
            
            <NavigationButton destination="/mobile-home" active={activeTab === 'home'}>
              <div className="flex flex-col items-center">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs mt-1">Home</span>
              </div>
            </NavigationButton>
            
            <NavigationButton destination="/mobile-wallet" active={activeTab === 'wallet'}>
              <div className="flex flex-col items-center">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 10H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs mt-1">Wallet</span>
              </div>
            </NavigationButton>
            
            <NavigationButton destination="/mobile-profile" active={activeTab === 'profile'}>
              <div className="flex flex-col items-center">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs mt-1">Profile</span>
              </div>
            </NavigationButton>
          </div>
        </div>
      )}
    </div>
  );
}