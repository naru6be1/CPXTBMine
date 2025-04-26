import { MiningPlan } from "@/components/mining-plan";
import { ConnectWallet } from "@/components/connect-wallet";
import { useWallet } from "@/hooks/use-wallet";

export default function MiningPage() {
  const { isConnected } = useWallet();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mining Plans</h1>
      
      {/* Display Connect Wallet button if not connected */}
      {!isConnected && (
        <div className="flex justify-center mb-8">
          <ConnectWallet />
        </div>
      )}
      
      <MiningPlan />
    </div>
  );
}
