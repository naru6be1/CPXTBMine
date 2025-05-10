import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';

export default function CheckBalance() {
  // Get address from URL query parameter using window.location instead of useLocation
  // This approach is more reliable for URL parameters
  const params = new URLSearchParams(window.location.search);
  const addressParam = params.get('address');
  
  // Debug logs
  console.log("Check Balance Page - URL:", window.location.href);
  console.log("Check Balance Page - Search params:", window.location.search);
  console.log("Check Balance Page - Address parameter:", addressParam);
  
  const [walletAddress, setWalletAddress] = useState<string>(
    addressParam || '0x6122b8784718d954659369dde67c79d9f0e4ac67'
  );
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Define checkBalance function first, so we can reference it in useEffect
  const checkBalance = async () => {
    if (!walletAddress || walletAddress.length < 40) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/balance?address=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching balance: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Balance data:", data);
      
      setBalance(data.balance);
      
      toast({
        title: "Balance Retrieved",
        description: `Wallet has ${data.balance} CPXTB`,
      });
    } catch (error) {
      console.error("Error checking balance:", error);
      toast({
        title: "Error",
        description: "Failed to retrieve wallet balance",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Log wallet address whenever it changes
  useEffect(() => {
    console.log("Wallet address state updated:", walletAddress);
  }, [walletAddress]);
  
  // Auto-check balance when loading with address parameter
  useEffect(() => {
    if (addressParam) {
      console.log("Address parameter found, will check balance automatically");
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        console.log("Checking balance for:", walletAddress);
        checkBalance();
      }, 300);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressParam]);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              CPXTB Wallet Balance Checker
            </CardTitle>
            <CardDescription>
              Check the CPXTB balance of any wallet address on the Base blockchain
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="wallet-address" className="text-sm font-medium mb-2 block">
                Wallet Address
              </label>
              <div className="flex space-x-2">
                <Input
                  id="wallet-address"
                  placeholder="Enter a wallet address (0x...)"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button 
                  onClick={checkBalance}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Check
                </Button>
              </div>
            </div>
            
            {balance !== null && (
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Wallet Balance</h3>
                <p className="text-2xl font-bold text-blue-900">{balance} <span className="text-sm font-normal">CPXTB</span></p>
                
                {/* USDT Equivalent calculation */}
                <p className="text-sm text-blue-800 mt-1">
                  ≈ ${(parseFloat(balance || '0') * 0.002177).toFixed(2)} <span className="text-xs font-normal">USDT</span>
                </p>
                
                <p className="text-xs text-blue-700 mt-2">
                  Address: <span className="font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                </p>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium mb-2">Quick Check</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setWalletAddress('0x6122b8784718d954659369dde67c79d9f0e4ac67');
                    setTimeout(checkBalance, 100);
                  }}
                >
                  Check Treasury Wallet
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setWalletAddress('0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27');
                    setTimeout(checkBalance, 100);
                  }}
                >
                  Check Platform Wallet
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Link href="/merchant">
              <Button variant="ghost" size="sm">Go to Merchant Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">Back to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}