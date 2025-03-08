import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Coins, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MiningPlan() {
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const { toast } = useToast();

  // Constants
  const investmentAmount = 100; // USDT
  const dailyRewardUSD = 15; // USD
  const usdtWalletAddress = "0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27";
  const cpxtbPrice = 0.002529; // Current CPXTB price in USD
  const dailyRewardCPXTB = (dailyRewardUSD / cpxtbPrice).toFixed(2); // Calculate CPXTB equivalent

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The address has been copied to your clipboard.",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          Weekly Mining Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Investment Details</h3>
          <div className="grid gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Required Investment</p>
              <p className="text-2xl font-bold">{investmentAmount} USDT (ERC-20)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Reward</p>
              <p className="text-2xl font-bold text-primary">
                {dailyRewardCPXTB} CPXTB
                <span className="text-sm text-muted-foreground ml-2">
                  (≈${dailyRewardUSD})
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current CPXTB Price</p>
              <p className="text-lg font-semibold">${cpxtbPrice}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Payment Address (USDT ERC-20)</h3>
            <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
              <code className="text-sm flex-1 break-all">{usdtWalletAddress}</code>
              <button
                onClick={() => copyToClipboard(usdtWalletAddress)}
                className="p-2 hover:bg-background rounded-md transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdrawal">CPXTB Withdrawal Address (Base Network)</Label>
            <Input
              id="withdrawal"
              placeholder="Enter your Base network address for CPXTB withdrawals"
              value={withdrawalAddress}
              onChange={(e) => setWithdrawalAddress(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Please provide your Base network address to receive CPXTB rewards
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}