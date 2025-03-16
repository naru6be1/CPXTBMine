import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Coins } from "lucide-react";
import { SiCoinmarketcap } from "react-icons/si";
import { BsTwitterX } from "react-icons/bs";
import { FaTelegramPlane } from "react-icons/fa";

const CPXTB_INFO = {
  contract: "0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b",
  links: {
    website: "https://coinpredictiontool.com/",
    cmc: "https://coinmarketcap.com/currencies/coin-prediction-tool-on-base/",
    dextools: "https://www.dextools.io/app/en/base/pair-explorer/0x18fec483ad7f68df0f9cca34d82792376b8d18d0",
    twitter: "https://x.com/cpxtbofficial",
    telegram: "https://t.me/+Eqb7pL3a-ww0OTRh",
    basescan: "https://basescan.org/token/0x96a0cc3c0fc5d07818e763e1b25bc78ab4170d1b"
  }
};

export function CPXTBInfo() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          CPXTB Token Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Contract Address</p>
          <p className="font-mono text-sm break-all">{CPXTB_INFO.contract}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a 
            href={CPXTB_INFO.links.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Official Website
            </Button>
          </a>

          <a 
            href={CPXTB_INFO.links.cmc} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full">
              <SiCoinmarketcap className="mr-2 h-4 w-4" />
              CoinMarketCap
            </Button>
          </a>

          <a 
            href={CPXTB_INFO.links.dextools} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              DexTools Chart
            </Button>
          </a>

          <a 
            href={CPXTB_INFO.links.basescan} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              BaseScan
            </Button>
          </a>

          <a 
            href={CPXTB_INFO.links.twitter} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full">
              <BsTwitterX className="mr-2 h-4 w-4" />
              Twitter
            </Button>
          </a>

          <a 
            href={CPXTB_INFO.links.telegram} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full">
              <FaTelegramPlane className="mr-2 h-4 w-4" />
              Telegram Group
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}