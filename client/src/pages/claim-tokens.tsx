import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClaimTokensPage() {
  const [address, setAddress] = useState("0x0a5f96783058efa994636099886084dda54bf42a");
  const [amount, setAmount] = useState("100");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTxHash("");

    try {
      if (!address.startsWith("0x")) {
        throw new Error("Address must start with 0x");
      }

      const response = await fetch(`/api/users/${address}/claim-free-cpxtb`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to claim tokens");
      }

      setTxHash(data.txHash);
      toast({
        title: "Success!",
        description: `Successfully claimed ${amount} CPXTB tokens.`,
      });
    } catch (error: any) {
      toast({
        title: "Error claiming tokens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Claim Test CPXTB Tokens</CardTitle>
          <CardDescription>
            For development testing only. This will send real CPXTB tokens to your wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Wallet Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  required
                  min="1"
                  max="500"
                />
              </div>
            </div>
            <Button className="w-full mt-4" type="submit" disabled={isLoading}>
              {isLoading ? "Claiming..." : "Claim Tokens"}
            </Button>
          </form>
        </CardContent>
        {txHash && (
          <CardFooter className="flex flex-col items-start">
            <p className="text-sm text-muted-foreground">Transaction Hash:</p>
            <div className="bg-secondary p-2 rounded-md w-full mt-1 overflow-x-auto">
              <code className="text-xs">{txHash}</code>
            </div>
            <a 
              href={`https://basescan.org/tx/${txHash}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline mt-2"
            >
              View on BaseScan
            </a>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}