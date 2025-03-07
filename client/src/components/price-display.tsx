import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

// ABI for Uniswap V4 Pool interaction
const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
];

const POOL_ADDRESS = '0xf8c5dfe02c1199fffc6cea53eec7d8f9da42ca5c72cc426c1637ce24a3c5210a';
const CPXTB_ADDRESS = '0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b';
const USDT_ADDRESS = '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2';

export function PriceDisplay() {
  const [price, setPrice] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let poolContract: ethers.Contract;
    let mounted = true;

    const fetchPrice = async () => {
      try {
        setError(null);
        // Connect to Base network using a more reliable RPC
        const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        poolContract = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

        // Get current price from slot0
        const slot0 = await poolContract.slot0();
        const sqrtPriceX96 = slot0.sqrtPriceX96;

        if (!mounted) return;

        // Calculate price from sqrtPriceX96 using BigNumber to handle large numbers
        const Q96 = ethers.BigNumber.from(2).pow(96);
        const price = ethers.BigNumber.from(sqrtPriceX96)
          .mul(sqrtPriceX96)
          .div(Q96)
          .div(Q96);

        setPrice(ethers.utils.formatUnits(price, 6)); // Assuming 6 decimals for USDT

        // Listen for Swap events
        poolContract.on('Swap', async (sender, recipient, amount0, amount1, sqrtPriceX96) => {
          if (!mounted) return;

          const newPrice = ethers.BigNumber.from(sqrtPriceX96)
            .mul(sqrtPriceX96)
            .div(Q96)
            .div(Q96);

          setPrice(ethers.utils.formatUnits(newPrice, 6));
        });

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

    // Cleanup
    return () => {
      mounted = false;
      if (poolContract) {
        poolContract.removeAllListeners();
      }
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