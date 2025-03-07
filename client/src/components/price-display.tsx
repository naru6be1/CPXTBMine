import { useState, useEffect } from 'react';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

// ABI for Uniswap V4 Pool interaction
const POOL_ABI = parseAbi([
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
]);

// Contract addresses - ensure they are properly checksummed
const POOL_ADDRESS = '0xf8c5dfe02c1199fffc6cea53eec7d8f9da42ca5c72cc426c1637ce24a3c5210a';
const CPXTB_ADDRESS = '0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b';
const USDT_ADDRESS = '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2';

// Create a public client for Base network
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org')
});

export function PriceDisplay() {
  const [price, setPrice] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const fetchPrice = async () => {
      try {
        setError(null);

        // Check if addresses are valid
        if (!POOL_ADDRESS || !CPXTB_ADDRESS || !USDT_ADDRESS) {
          throw new Error('Invalid contract addresses');
        }

        console.log('Fetching price from pool:', POOL_ADDRESS);

        // Get slot0 data from the pool
        const slot0Data = await publicClient.readContract({
          address: POOL_ADDRESS as `0x${string}`,
          abi: POOL_ABI,
          functionName: 'slot0',
        });

        if (!mounted) return;

        const sqrtPriceX96 = slot0Data[0]; // First return value is sqrtPriceX96
        console.log('Received sqrtPriceX96:', sqrtPriceX96);

        // Calculate price using BigInt
        const Q96 = BigInt(2 ** 96);
        const priceRaw = (sqrtPriceX96 * sqrtPriceX96) / Q96 / Q96;

        // Format price with 6 decimals (USDT standard)
        const priceFormatted = (Number(priceRaw) / 10 ** 6).toFixed(6);
        console.log('Calculated price:', priceFormatted);

        setPrice(priceFormatted);

      } catch (error) {
        console.error('Error fetching price:', error);
        if (!mounted) return;

        setError('Failed to fetch price data');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch price data. Please try again later.",
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          CPXTB/USDT Price
          {error && <AlertCircle className="h-5 w-5 text-destructive" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-center text-primary">
          {error ? 'Error fetching price' : `${price} USDT`}
        </div>
        <div className="text-sm text-muted-foreground text-center mt-2">
          Real-time price from Uniswap V4
        </div>
      </CardContent>
    </Card>
  );
}