import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Users, Gift } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ReferralStats() {
  const { isConnected, address } = useWallet();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['user', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(`/api/users/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const data = await response.json();
      return data.user;
    },
    enabled: !!address
  });

  const { data: referralStats } = useQuery({
    queryKey: ['referralStats', user?.referralCode],
    queryFn: async () => {
      if (!user?.referralCode) return null;
      console.log('Fetching referral stats for code:', user.referralCode);
      const response = await fetch(`/api/referrals/${user.referralCode}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch referral stats');
      }
      const data = await response.json();
      console.log('Referral stats response:', data);
      return data;
    },
    enabled: !!user?.referralCode
  });

  const handleCopyReferralLink = () => {
    if (!user?.referralCode) return;

    const referralLink = `${window.location.origin}?ref=${user.referralCode}`;
    navigator.clipboard.writeText(referralLink);

    toast({
      title: "Referral Link Copied",
      description: "Share this link with others to earn rewards!"
    });
  };

  if (!isConnected) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Your Referral Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary/10 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Referrals</p>
            <p className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Rewards</p>
            <p className="text-2xl font-bold">{referralStats?.totalRewards || 0} USDT</p>
          </div>
        </div>

        <Button 
          onClick={handleCopyReferralLink}
          className="w-full"
          variant="outline"
          disabled={!user?.referralCode}
        >
          <Gift className="mr-2 h-4 w-4" />
          Copy Referral Link
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          Earn 5% USDT rewards when others activate mining plans using your referral link!
        </p>
      </CardContent>
    </Card>
  );
}