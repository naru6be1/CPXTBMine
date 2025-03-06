import { ConnectWallet } from "@/components/connect-wallet";
import { useWallet } from "@/hooks/use-wallet";

export default function Home() {
  const { isConnected, address } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-4xl font-bold text-transparent sm:text-6xl">
            Welcome to DApp
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect your wallet to get started
          </p>
        </div>

        <div className="flex justify-center">
          <ConnectWallet />
        </div>

        {isConnected && (
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-semibold text-foreground">
              Welcome! 👋
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your wallet ({address?.slice(0, 6)}...{address?.slice(-4)}) is now connected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
