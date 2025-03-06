import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import { Wallet2, LogOut } from "lucide-react";

export function ConnectWallet() {
  const { address, isConnecting, isConnected, connect, disconnect } = useWallet();

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet2 className="h-6 w-6 text-primary" />
          Connect Your Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnecting ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isConnected && address ? (
          <div className="space-y-4">
            <div className="break-all rounded-lg bg-muted p-4 text-sm font-mono">
              {address}
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={disconnect}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full" 
            size="lg"
            onClick={connect}
          >
            <Wallet2 className="mr-2 h-4 w-4" />
            Connect to MetaMask
          </Button>
        )}
      </CardContent>
    </Card>
  );
}