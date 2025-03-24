import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function AboutPage() {
  const exchanges = [
    {
      name: "CoinMarketCap",
      description: "View CPXTB market data, price history, and more",
      url: "https://coinmarketcap.com/currencies/coin-prediction-tool-on-base/"
    },
    {
      name: "DexTools",
      description: "Real-time CPXTB trading charts and analysis",
      url: "https://www.dextools.io/app/en/base/pair-explorer/0x18fec483ad7f68df0f9cca34d82792376b8d18d0"
    },
    {
      name: "Coinbase",
      description: "Trade CPXTB on Coinbase",
      url: "https://wallet.coinbase.com/links/qyDCzqRmOPb"
    },
    {
      name: "Dex-trade",
      description: "CPXTB/USDT spot trading",
      url: "https://dex-trade.com/spot/trading/CPXTBUSDT"
    },
    {
      name: "BitStorage",
      description: "CPXTB/USDT trading pair on BitStorage",
      url: "https://bitstorage.finance/spot/trading/CPXTBUSDT"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">About CPXTB</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contract Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              CPXTB is deployed on the Base network. The token implements standard ERC-20 functionality with additional features for mining and rewards distribution.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-mono text-sm break-all">
                Contract Address: 0x18fec483ad7f68df0f9cca34d82792376b8d18d0
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exchange Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {exchanges.map((exchange) => (
                <div key={exchange.name} className="flex flex-col space-y-2">
                  <h3 className="font-semibold">{exchange.name}</h3>
                  <p className="text-sm text-muted-foreground">{exchange.description}</p>
                  <a 
                    href={exchange.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    Visit {exchange.name}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
