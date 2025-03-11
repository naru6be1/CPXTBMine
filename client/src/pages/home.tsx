import { ConnectWallet } from "@/components/connect-wallet";
import { PriceDisplay } from "@/components/price-display";
import { MiningPlan } from "@/components/mining-plan";
import { useWallet } from "@/hooks/use-wallet";
import { Logo } from "@/components/ui/logo";

export default function Home() {
  const { isConnected, address } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect your wallet and view real-time CPXTB/WETH prices
          </p>
        </div>

        <PriceDisplay />
        <MiningPlan />

        <div className="max-w-md mx-auto">
          <ConnectWallet />
        </div>

        {isConnected && address && (
          <div className="animate-fade-in">
            <div className="bg-primary/5 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                🎉 Successfully Connected!
              </h2>
              <p className="text-muted-foreground">
                Your wallet ({address.slice(0, 6)}...{address.slice(-4)}) is now connected to our DApp
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}