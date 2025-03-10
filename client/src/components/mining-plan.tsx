import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useNetwork, useSwitchNetwork } from 'wagmi';

export function MiningPlan() {
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  // Network status component with more detailed information
  const NetworkStatus = () => {
    if (!chain) return null;

    if (chain.id !== 11155111) {
      return (
        <div className="mb-4 p-4 bg-yellow-500/10 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <span className="font-semibold">Connect to Sepolia Network</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Please connect to Sepolia testnet. {switchNetwork
              ? "Click below to switch networks."
              : "Please switch networks manually in your wallet."}
          </p>
          {switchNetwork && (
            <Button 
              onClick={() => switchNetwork(11155111)}
              variant="outline"
              className="mt-2"
            >
              Switch to Sepolia
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="mb-4 p-4 bg-green-500/10 rounded-lg">
        <div className="flex items-center gap-2 text-green-500">
          <span className="font-semibold">✓ Connected to Sepolia Testnet</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          Mining Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="bg-blue-500/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-500 mb-2">Mining Information</h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet and switch to Sepolia network to view mining details.
            </p>
          </div>
        </div>
        <NetworkStatus />
        {isConnected && address && (
          <div className="bg-muted rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Wallet Connected</h3>
            <div className="grid gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Your Address</p>
                <p className="text-sm font-mono">
                  {address}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}