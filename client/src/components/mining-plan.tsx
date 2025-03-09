import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { ethers } from "ethers";
import { useAccount, useContractWrite, useContractRead, usePrepareContractWrite } from 'wagmi';

// USDT Contract ABI (only including necessary functions)
const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

// Constants
const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Ethereum Mainnet USDT
const TREASURY_ADDRESS = "0x123..."; // Replace with your treasury address

// ActivePlanDisplay component with end date
function ActivePlanDisplay({ 
  withdrawalAddress, 
  dailyRewardCPXTB,
  activatedAt 
}: { 
  withdrawalAddress: string;
  dailyRewardCPXTB: string;
  activatedAt: string;
}) {
  // Calculate end date (7 days from activation)
  const activationDate = new Date(activatedAt);
  const endDate = new Date(activationDate);
  endDate.setDate(endDate.getDate() + 7);

  // Format dates nicely
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="bg-primary/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-primary mb-2">
          🎉 Mining Plan Status
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-lg font-semibold text-green-500">Active</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Daily Reward</p>
            <p className="text-lg font-semibold">{dailyRewardCPXTB} CPXTB</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Withdrawal Address</p>
            <p className="text-sm font-mono break-all">{withdrawalAddress}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Activation Time</p>
              <p className="text-lg font-semibold">{formatDate(activationDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Time</p>
              <p className="text-lg font-semibold">{formatDate(endDate)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-primary/10">
            <p className="text-sm text-muted-foreground">
              Your mining plan will be active for 7 days from activation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MiningPlan() {
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [activePlanDetails, setActivePlanDetails] = useState<{
    withdrawalAddress: string;
    dailyRewardCPXTB: string;
    activatedAt: string;
  } | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const { toast } = useToast();
  const { isConnected, address } = useWallet();

  // Constants
  const investmentAmount = ethers.parseUnits("100", 6); // 100 USDT (6 decimals)
  const dailyRewardUSD = 15; // USD
  const cpxtbPrice = 0.002529; // Current CPXTB price in USD
  const dailyRewardCPXTB = (dailyRewardUSD / cpxtbPrice).toFixed(2); // Calculate CPXTB equivalent

  // Contract interactions
  const { config: approveConfig } = usePrepareContractWrite({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'approve',
    args: [TREASURY_ADDRESS, investmentAmount],
  });

  const { writeAsync: approveWrite } = useContractWrite(approveConfig);

  const { config: transferConfig } = usePrepareContractWrite({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'transfer',
    args: [TREASURY_ADDRESS, investmentAmount],
  });

  const { writeAsync: transferWrite } = useContractWrite(transferConfig);

  // Check for active plan on component mount
  useEffect(() => {
    const storedPlan = localStorage.getItem('activeMiningPlan');
    if (storedPlan) {
      const plan = JSON.parse(storedPlan);
      setHasActivePlan(true);
      setActivePlanDetails(plan);
    }
  }, []);

  const handleActivatePlan = async () => {
    if (!withdrawalAddress) {
      toast({
        variant: "destructive",
        title: "Missing Withdrawal Address",
        description: "Please provide your Base network address for CPXTB rewards",
      });
      return;
    }

    try {
      // First approve USDT spending
      setIsApproving(true);
      const approveTx = await approveWrite?.();
      await approveTx?.wait();
      setIsApproving(false);

      // Then transfer USDT
      setIsTransferring(true);
      const transferTx = await transferWrite?.();
      await transferTx?.wait();
      setIsTransferring(false);

      // After successful payment, activate the plan
      const activationTime = new Date().toISOString();
      const planDetails = {
        withdrawalAddress,
        dailyRewardCPXTB,
        activatedAt: activationTime
      };

      localStorage.setItem('activeMiningPlan', JSON.stringify(planDetails));
      setHasActivePlan(true);
      setActivePlanDetails(planDetails);

      toast({
        title: "Mining Plan Activated",
        description: "Your mining plan has been activated! You will start receiving daily rewards.",
      });
    } catch (error) {
      console.error('Error during plan activation:', error);
      toast({
        variant: "destructive",
        title: "Activation Failed",
        description: "Failed to activate mining plan. Please try again.",
      });
    } finally {
      setIsApproving(false);
      setIsTransferring(false);
    }
  };

  // Show active plan if exists
  if (hasActivePlan && activePlanDetails) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Active Mining Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivePlanDisplay 
            withdrawalAddress={activePlanDetails.withdrawalAddress}
            dailyRewardCPXTB={activePlanDetails.dailyRewardCPXTB}
            activatedAt={activePlanDetails.activatedAt}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          Weekly Mining Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Mining Plan Details</h3>
          <div className="grid gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Required Investment</p>
              <p className="text-2xl font-bold">100 USDT</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Reward</p>
              <p className="text-2xl font-bold text-primary">
                {dailyRewardCPXTB} CPXTB
                <span className="text-sm text-muted-foreground ml-2">
                  (≈${dailyRewardUSD})
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdrawal">CPXTB Withdrawal Address (Base Network)</Label>
            <Input
              id="withdrawal"
              placeholder="Enter your Base network address for CPXTB withdrawals"
              value={withdrawalAddress}
              onChange={(e) => setWithdrawalAddress(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Please provide your Base network address to receive CPXTB rewards
            </p>
          </div>

          {isConnected && (
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleActivatePlan}
              disabled={isApproving || isTransferring}
            >
              <Coins className="mr-2 h-4 w-4" />
              {isApproving ? "Approving USDT..." : 
               isTransferring ? "Transferring USDT..." : 
               "Activate Mining Plan (100 USDT)"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}