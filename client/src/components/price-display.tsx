import { useState, useEffect } from 'react';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { CoinMarketCapButton } from '@/components/coinmarketcap-button';

// ABI for Uniswap V2 Pool interaction
const POOL_ABI = parseAbi([
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1)',
]);

// Contract addresses - ensure they are properly checksummed
const POOL_ADDRESS = '0x18fec483ad7f68df0f9cca34d82792376b8d18d0';
const CPXTB_ADDRESS = '0x96A0cc3C0fc5D07818E763E1B25bc78ab4170D1b';
const WETH_ADDRESS = '0x4300000000000000000000000000000000000004'; // Updated WETH on Base

// Create a public client for Base network
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org')
});

// Add detailed logging
console.log('Initializing PriceDisplay component with configuration:', {
  poolAddress: POOL_ADDRESS,
  cpxtbAddress: CPXTB_ADDRESS,
  wethAddress: WETH_ADDRESS,
  network: 'Base Mainnet',
  rpcUrl: 'https://mainnet.base.org'
});

export function PriceDisplay() {
  const [price, setPrice] = useState<string>('Loading...');
  const [usdPrice, setUsdPrice] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        return data.ethereum.usd;
      } catch (error) {
        console.error('Error fetching ETH price:', error);
        return null;
      }
    };

    const fetchPrice = async () => {
      try {
        console.log('Attempting to fetch price data from Uniswap V2 pool...');
        setError(null);

        // Check if addresses are valid
        if (!POOL_ADDRESS || !CPXTB_ADDRESS || !WETH_ADDRESS) {
          throw new Error('Invalid contract addresses');
        }

        console.log('Making contract call to pool address:', POOL_ADDRESS);

        // Try to get events first to verify contract interaction
        const swapEvents = await publicClient.getContractEvents({
          address: POOL_ADDRESS as `0x${string}`,
          abi: POOL_ABI,
          eventName: 'Swap',
          fromBlock: 'latest'
        });

        console.log('Latest swap events:', swapEvents);

        // Get reserves data from the pool
        const reservesData = await publicClient.readContract({
          address: POOL_ADDRESS as `0x${string}`,
          abi: POOL_ABI,
          functionName: 'getReserves',
        });

        console.log('Received raw reserves data:', reservesData);

        if (!mounted) return;

        // Get reserves with proper decimal handling
        const reserve0 = BigInt(reservesData[0].toString()); // CPXTB reserve (18 decimals)
        const reserve1 = BigInt(reservesData[1].toString()); // WETH reserve (18 decimals)
        console.log('Parsed reserves:', {
          cpxtbReserve: reserve0.toString(),
          wethReserve: reserve1.toString()
        });

        // Calculate CPXTB price in WETH
        // Price = reserve0/reserve1 to get CPXTB/WETH ratio
        const priceInWei = (reserve0 * BigInt(10 ** 18)) / reserve1;
        const priceInEth = Number(priceInWei) / 10 ** 18;
        console.log('Raw WETH price:', priceInEth.toString());

        // Format price for display with enough precision for small values
        const priceFormatted = priceInEth.toFixed(18);

        setPrice(priceFormatted);

        // Fetch and calculate USD price
        const ethUsdPrice = await fetchEthPrice();
        if (ethUsdPrice) {
          // Calculate USD price: CPXTB price in ETH * ETH price in USD
          const usdPriceValue = (priceInEth * ethUsdPrice).toFixed(6);
          setUsdPrice(usdPriceValue);
          console.log('USD price:', usdPriceValue);
        }

      } catch (error) {
        console.error('Error fetching price:', error);
        if (!mounted) return;

        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch price data';
        console.error('Setting error state:', errorMessage);
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 15000); // Refresh every 15 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [toast]);

  // Using the dedicated CoinMarketCapButton component instead
  
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
          {error ? 'Error fetching price' : `${Number(price).toFixed(8)} WETH`}
        </div>
        <div className="text-xl font-semibold text-center text-muted-foreground mt-2">
          {error ? '' : `$${usdPrice}`}
        </div>
        <div className="text-sm text-muted-foreground text-center mt-2">
          Real-time price from Uniswap V2
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-center">
        <CoinMarketCapButton className="mt-2" />
      </CardFooter>
    </Card>
  );
}