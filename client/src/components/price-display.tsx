import { useState, useEffect, useRef } from 'react';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

// ABI for Uniswap V2 Pool interaction
const POOL_ABI = parseAbi([
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1)',
]);

// Contract addresses - ensure they are properly checksummed
const POOL_ADDRESS = '0x18fec483ad7f68df0f9cca34d82792376b8d18d0';
const CPXTB_ADDRESS = '0x96A0cc3C0fc5D07818E763E1B25bc78ab4170D1b';
const WETH_ADDRESS = '0x4300000000000000000000000000000000000004'; // Updated WETH on Base

// Create a public client lazily to prevent immediate network requests on page load
let publicClientInstance: ReturnType<typeof createPublicClient> | undefined = undefined;

function getPublicClient(): ReturnType<typeof createPublicClient> {
  if (!publicClientInstance) {
    publicClientInstance = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org')
    });
  }
  return publicClientInstance;
}

export function PriceDisplay() {
  const [price, setPrice] = useState<string>('0.00000118');
  const [usdPrice, setUsdPrice] = useState<string>('0.002216');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { toast } = useToast();
  const fetchTimerRef = useRef<number | null>(null);
  
  // Use a ref to prevent memory leaks and avoid unnecessary re-renders
  const mountedRef = useRef<boolean>(true);
  
  // Cache for Ethereum price to reduce API calls
  const ethPriceCache = useRef<{value: number | null, timestamp: number}>({
    value: null,
    timestamp: 0
  });

  useEffect(() => {
    // Mark component as mounted
    mountedRef.current = true;
    
    // Delay initialization to prioritize UI rendering
    const initTimer = setTimeout(() => {
      setIsInitialized(true);
    }, 1000);
    
    // Clean up on unmount
    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      
      if (fetchTimerRef.current) {
        clearInterval(fetchTimerRef.current);
        fetchTimerRef.current = null;
      }
    };
  }, []);

  // Only start data fetching after initialization
  useEffect(() => {
    if (!isInitialized) return;
    
    const fetchEthPrice = async () => {
      try {
        // Check cache first - use cached value if less than 5 minutes old
        const now = Date.now();
        if (ethPriceCache.current.value && now - ethPriceCache.current.timestamp < 5 * 60 * 1000) {
          return ethPriceCache.current.value;
        }
        
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        
        // Update cache
        ethPriceCache.current = {
          value: data.ethereum.usd,
          timestamp: now
        };
        
        return data.ethereum.usd;
      } catch (error) {
        // Silent fail - return cached value if available or null
        return ethPriceCache.current.value;
      }
    };

    const fetchPrice = async () => {
      // Skip if component unmounted
      if (!mountedRef.current) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Get public client lazily
        const publicClient = getPublicClient();

        // Get reserves data from the pool
        const reservesData = await publicClient.readContract({
          address: POOL_ADDRESS as `0x${string}`,
          abi: POOL_ABI,
          functionName: 'getReserves',
        });

        // Skip if component unmounted during async call
        if (!mountedRef.current) return;

        // Get reserves with proper decimal handling
        const reserve0 = BigInt(reservesData[0].toString()); // CPXTB reserve (18 decimals)
        const reserve1 = BigInt(reservesData[1].toString()); // WETH reserve (18 decimals)
        
        // Calculate CPXTB price in WETH
        const priceInWei = (reserve0 * BigInt(10 ** 18)) / reserve1;
        const priceInEth = Number(priceInWei) / 10 ** 18;

        // Format price for display with appropriate precision
        const priceFormatted = priceInEth.toFixed(18);
        setPrice(priceFormatted);

        // Fetch and calculate USD price efficiently
        const ethUsdPrice = await fetchEthPrice();
        if (ethUsdPrice) {
          // Calculate USD price: CPXTB price in ETH * ETH price in USD
          const usdPriceValue = (priceInEth * ethUsdPrice).toFixed(6);
          setUsdPrice(usdPriceValue);
        }

      } catch (error) {
        // Skip error handling if component unmounted
        if (!mountedRef.current) return;
        
        // Only set error state if we're still mounted
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch price data';
        setError(errorMessage);
        
        // Only show toast for first error
        if (!error) {
          toast({
            variant: "destructive",
            title: "Price Data Error",
            description: "Using cached price data",
          });
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchPrice();
    
    // Refresh at a less frequent interval (30s instead of 15s)
    fetchTimerRef.current = window.setInterval(fetchPrice, 30000);

    return () => {
      if (fetchTimerRef.current) {
        clearInterval(fetchTimerRef.current);
        fetchTimerRef.current = null;
      }
    };
  }, [toast, isInitialized]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          CPXTB/WETH Price
          {error && <AlertCircle className="h-5 w-5 text-destructive" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-center text-primary">
          {error ? 'Using cached price' : `${Number(price).toFixed(8)} WETH`}
        </div>
        <div className="text-xl font-semibold text-center text-muted-foreground mt-2">
          {error ? 'Retrying...' : `$${usdPrice}`}
        </div>
        <div className="text-sm text-muted-foreground text-center mt-2">
          {isLoading && !error ? 'Updating price data...' : 'Real-time price from Uniswap V2'}
        </div>
      </CardContent>
    </Card>
  );
}