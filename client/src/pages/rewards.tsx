import { MiningPlan } from "@/components/mining-plan";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/hooks/use-wallet";
import type { MiningPlan as MiningPlanType } from "@shared/schema";

export default function RewardsPage() {
  const { address } = useWallet();

  const { data: claimableData, isLoading } = useQuery({
    queryKey: ['claimablePlans', address],
    queryFn: async () => {
      if (!address) return { plans: [], isAdmin: false };
      const response = await fetch(`/api/mining-plans/${address}/claimable`);
      if (!response.ok) {
        throw new Error('Failed to fetch claimable plans');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!address
  });

  // Ensure plans is always an array
  const claimablePlans = claimableData?.plans || [];

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Rewards</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Please connect your wallet to view rewards.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Rewards</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading rewards...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Rewards</h1>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Claimable Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            {claimablePlans.length === 0 ? (
              <p className="text-muted-foreground">No rewards available to claim at this time.</p>
            ) : (
              <div className="space-y-4">
                {claimablePlans.map((plan: MiningPlanType) => (
                  <MiningPlan key={plan.id} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}