import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// ABI for Uniswap V4 Pool interaction
const POOL_ABI = [
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
];

const POOL_ADDRESS = '0xf8c5dfe02c1199fffc6cea53eec7d8f9da42ca5c72cc426c1637ce24a3c5210a';
const CPXTB_ADDRESS = '0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b';
const USDT_ADDRESS = '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2';

export function PriceDisplay() {
  const [price, setPrice] = useState<string>('Loading...');
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Connect to Base network
        const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        const poolContract = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

        // Get current price from slot0
        const slot0 = await poolContract.slot0();
        const sqrtPriceX96 = slot0.sqrtPriceX96;

        // Calculate price from sqrtPriceX96
        const price = (Number(sqrtPriceX96) ** 2) / (2 ** 192);
        setPrice(price.toFixed(6));

        // Listen for Swap events
        poolContract.on('Swap', async (sender, recipient, amount0, amount1, sqrtPriceX96) => {
          const newPrice = (Number(sqrtPriceX96) ** 2) / (2 ** 192);
          setPrice(newPrice.toFixed(6));
        });

      } catch (error) {
        console.error('Error fetching price:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch price data",
        });
      }
    };

    fetchPrice();

    // Cleanup
    return () => {
      // Remove event listeners
    };
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">CPXTB/USDT Price</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-center text-primary">
          {price} USDT
        </div>
        <div className="text-sm text-muted-foreground text-center mt-2">
          Real-time price from Uniswap V4
        </div>
      </CardContent>
    </Card>
  );
}