import { MiningPlan } from "@/components/mining-plan";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/hooks/use-wallet";

export default function RewardsPage() {
  const { address } = useWallet();

  const { data: claimablePlans = [] } = useQuery({
    queryKey: ['claimablePlans', address],
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch(`/api/mining-plans/${address}/claimable`);
      if (!response.ok) {
        throw new Error('Failed to fetch claimable plans');
      }
      const data = await response.json();
      return data.plans || [];
    },
    enabled: !!address
  });

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
                {claimablePlans.map((plan: any) => (
                  <MiningPlan key={plan.id} initialPlan={plan} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
