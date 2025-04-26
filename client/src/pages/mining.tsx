import { MiningPlan } from "@/components/mining-plan";
import { ConnectWallet } from "@/components/connect-wallet";
import { useWallet } from "@/hooks/use-wallet";

export default function MiningPage() {
  const { isConnected } = useWallet();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mining Plans</h1>
      
      {!isConnected ? (
        <div className="mb-8">
          <p className="text-center text-lg mb-4">
            Please connect your wallet to view and activate mining plans
          </p>
          <ConnectWallet />
        </div>
      ) : (
        <MiningPlan />
      )}
    </div>
  );
}
