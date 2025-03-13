import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Coins, MessageCircle, Server, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useAccount, useContractRead, useNetwork, useSwitchNetwork, usePublicClient, useWalletClient } from 'wagmi';
import { formatUnits } from "viem";
import { TransactionStatus } from "./transaction-status";
import { type Address } from 'viem';
import { SiTelegram } from 'react-icons/si';
import { cn } from "@/lib/utils";

// Legacy USDT Contract Interface with exact function signatures
const USDT_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Constants
const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const TREASURY_ADDRESS = "0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27";

// Plan configurations
const PLANS: Record<PlanType, PlanConfig> = {
  daily: {
    amount: BigInt("100000"), // 0.1 USDT (6 decimals)
    displayAmount: "0.1",
    rewardUSD: 0.15, // Adjusted reward for 0.1 USDT
    duration: "24 hours"
  },
  weekly: {
    amount: BigInt("100000000"), // 100 USDT (6 decimals)
    displayAmount: "100",
    rewardUSD: 15,
    duration: "7 days"
  }
};

type PlanType = 'daily' | 'weekly';

interface PlanConfig {
  amount: bigint;
  displayAmount: string;
  rewardUSD: number;
  duration: string;
}

// Add Telegram Support Button Component
function TelegramSupport() {
  return (
    <a
      href="https://t.me/CPXTBase"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-white bg-[#229ED9] hover:bg-[#1e8bc3] rounded-md transition-colors"
    >
      <SiTelegram className="w-5 h-5" />
      Contact Support on Telegram
    </a>
  );
}

function ActivePlanDisplay({
  withdrawalAddress,
  dailyRewardCPXTB,
  activatedAt,
  planType,
  onReset,
  isExpired
}: {
  withdrawalAddress: string;
  dailyRewardCPXTB: string;
  activatedAt: string;
  planType: PlanType;
  onReset: () => void;
  isExpired: boolean;
}) {
  const activationDate = new Date(activatedAt);
  const endDate = new Date(activationDate);
  endDate.setDate(endDate.getDate() + (planType === 'weekly' ? 7 : 1));

  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m remaining`);
    };

    updateTimeRemaining();
    const timer = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [endDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="bg-primary/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
          <Server className="h-6 w-6 animate-pulse" />
          Mining Plan Status
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className={cn(
              "text-lg font-semibold flex items-center gap-2",
              isExpired ? "text-red-500" : "text-green-500"
            )}>
              <Cpu className="h-5 w-5 animate-pulse" />
              {isExpired ? "Expired" : "Active"}
              {!isExpired && (
                <span className="text-sm font-normal ml-2">({timeRemaining})</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plan Type</p>
            <p className="text-lg font-semibold capitalize">{planType} Plan</p>
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
          <div className="space-y-3 pt-4">
            <TelegramSupport />
            {isExpired && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={onReset}
              >
                Reset Expired Plan
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MiningPlan() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('weekly');
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [activePlanDetails, setActivePlanDetails] = useState<{
    walletAddress: string;
    withdrawalAddress: string;
    dailyRewardCPXTB: string;
    activatedAt: string;
    planType: PlanType;
    transactionHash?: string;
    expiresAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitchingNetwork } = useSwitchNetwork();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Add hook to fetch active plan from backend
  useEffect(() => {
    const fetchActivePlan = async () => {
      // Reset states when wallet is not connected
      if (!address || !isConnected) {
        setHasActivePlan(false);
        setActivePlanDetails(null);
        setIsLoading(false);
        // Clear localStorage when disconnecting
        localStorage.removeItem('activeMiningPlan');
        return;
      }

      try {
        const response = await fetch(`/api/mining-plan/${address}`);
        const data = await response.json();

        if (data.plan && data.plan.walletAddress === address) {
          // Backend plan takes precedence over local storage
          const planDetails = {
            walletAddress: data.plan.walletAddress,
            withdrawalAddress: data.plan.withdrawalAddress,
            dailyRewardCPXTB: data.plan.dailyRewardCPXTB,
            activatedAt: data.plan.activatedAt,
            planType: data.plan.planType as PlanType,
            expiresAt: data.plan.expiresAt
          };

          setHasActivePlan(true);
          setActivePlanDetails(planDetails);
          setIsExpired(new Date() > new Date(data.plan.expiresAt));

          // Update local storage to match backend
          localStorage.setItem('activeMiningPlan', JSON.stringify(planDetails));
        } else {
          // If no backend plan, check local storage as fallback
          const savedPlan = localStorage.getItem('activeMiningPlan');
          if (savedPlan) {
            const planDetails = JSON.parse(savedPlan);

            // Only show plan if it matches the connected wallet
            if (planDetails.walletAddress === address) {
              const activationDate = new Date(planDetails.activatedAt);
              const endDate = new Date(activationDate);
              endDate.setDate(endDate.getDate() + (planDetails.planType === 'weekly' ? 7 : 1));

              const now = new Date();
              const isCurrentlyExpired = now > endDate;

              setIsExpired(isCurrentlyExpired);
              setHasActivePlan(true);
              setActivePlanDetails(planDetails);
            } else {
              // Clear localStorage if wallet doesn't match
              localStorage.removeItem('activeMiningPlan');
              setHasActivePlan(false);
              setActivePlanDetails(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching mining plan:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch mining plan status"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivePlan();
  }, [address, isConnected, toast]);

  const currentPlan = PLANS[selectedPlan];
  const cpxtbPrice = 0.002529;
  const dailyRewardCPXTB = (currentPlan.rewardUSD / cpxtbPrice).toFixed(2);

  // USDT Balance Check only when wallet is connected
  const { data: usdtBalance, isError: isBalanceError } = useContractRead({
    address: USDT_CONTRACT_ADDRESS as Address,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: [address as Address],
    enabled: !!address && chain?.id === 1,
    watch: true
  });

  const getBalanceDisplay = () => {
    if (!isConnected) return "Not connected";
    if (chain?.id !== 1) return "Wrong network";
    if (isBalanceError) return "Error loading balance";
    if (!usdtBalance) return "0 USDT";
    try {
      return `${formatUnits(usdtBalance, 6)} USDT`;
    } catch (error) {
      console.error('Error formatting balance:', error);
      return "Error displaying balance";
    }
  };

  const handleTransfer = async () => {
    if (!chain || chain.id !== 1) {
      toast({
        variant: "destructive",
        title: "Wrong Network",
        description: "Please switch to Ethereum mainnet"
      });
      return;
    }

    if (!withdrawalAddress) {
      toast({
        variant: "destructive",
        title: "Missing Address",
        description: "Please provide your Base network address for CPXTB rewards"
      });
      return;
    }

    if (!walletClient || !publicClient) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet and try again"
      });
      return;
    }

    try {
      const balance = usdtBalance ? BigInt(usdtBalance.toString()) : BigInt(0);
      if (balance < currentPlan.amount) {
        toast({
          variant: "destructive",
          title: "Insufficient Balance",
          description: `You need ${currentPlan.displayAmount} USDT. Current balance: ${formatUnits(balance, 6)} USDT`
        });
        return;
      }

      setIsTransferring(true);

      const { request } = await publicClient.simulateContract({
        address: USDT_CONTRACT_ADDRESS as Address,
        abi: USDT_ABI,
        functionName: 'transfer',
        args: [
          TREASURY_ADDRESS as Address,
          currentPlan.amount
        ],
        account: address as Address,
      });

      const hash = await walletClient.writeContract(request);
      console.log('Transaction submitted:', hash);

      setTransactionHash(hash);
      setIsValidating(true);

      toast({
        title: "Transfer Submitted",
        description: "Waiting for transaction confirmation. This may take a few minutes..."
      });

      let receipt = null;
      const maxRetries = 5;
      const retryDelay = 5000; // 5 seconds
      const timeout = 120000; // 2 minutes

      for (let i = 0; i < maxRetries; i++) {
        try {
          receipt = await Promise.race([
            publicClient.waitForTransactionReceipt({ hash }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Transaction confirmation timeout')), timeout)
            )
          ]);

          if (receipt && receipt.status === 'success') {
            break;
          }

          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } catch (error) {
          console.log(`Attempt ${i + 1} failed:`, error);
          if (i === maxRetries - 1) throw error;
        }
      }

      if (!receipt || receipt.status !== 'success') {
        throw new Error('Transaction failed or timed out');
      }

      setIsConfirmed(true);
      const activationTime = new Date().toISOString();
      // Create plan details with proper format
      const planDetails = {
        walletAddress: address as string,
        withdrawalAddress,
        planType: selectedPlan,
        amount: currentPlan.displayAmount,
        dailyRewardCPXTB,
        activatedAt: activationTime,
        expiresAt: new Date(new Date(activationTime).getTime() + (selectedPlan === 'weekly' ? 7 : 1) * 24 * 60 * 60 * 1000).toISOString(),
        transactionHash: hash,
      };

      // Create plan in backend
      const response = await fetch('/api/mining-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planDetails),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save mining plan');
      }

      // Store relevant plan details in localStorage
      const localStoragePlanDetails = {
        walletAddress: address,
        withdrawalAddress,
        dailyRewardCPXTB,
        activatedAt: activationTime,
        planType: selectedPlan,
        transactionHash: hash,
        expiresAt: planDetails.expiresAt
      };

      localStorage.setItem('activeMiningPlan', JSON.stringify(localStoragePlanDetails));
      setHasActivePlan(true);
      setActivePlanDetails(localStoragePlanDetails);
      setIsExpired(false);

      toast({
        title: "Plan Activated",
        description: "Your mining plan has been successfully activated!"
      });

    } catch (error) {
      console.error('Transfer error:', error);
      setIsTransferring(false);
      setIsValidating(false);

      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: error instanceof Error
          ? `Error: ${error.message}. Please try again.`
          : "Failed to transfer USDT. Please try again."
      });
    }
  };

  const handleResetPlan = () => {
    if (!isExpired) {
      toast({
        variant: "destructive",
        title: "Cannot Reset Active Plan",
        description: "Your mining plan is still active. Please wait until it expires."
      });
      return;
    }

    localStorage.removeItem('activeMiningPlan');
    setHasActivePlan(false);
    setActivePlanDetails(null);
    setIsExpired(false);
    toast({
      title: "Plan Reset",
      description: "Your expired mining plan has been reset."
    });
  };

  // Check expiration every minute
  useEffect(() => {
    if (hasActivePlan && activePlanDetails) {
      const checkExpiration = () => {
        const activationDate = new Date(activePlanDetails.activatedAt);
        const endDate = new Date(activationDate);
        endDate.setDate(endDate.getDate() + (activePlanDetails.planType === 'weekly' ? 7 : 1));

        const now = new Date();
        const isCurrentlyExpired = now > endDate;
        setIsExpired(isCurrentlyExpired);

        // Log expiration check for debugging
        console.log('Checking plan expiration:', {
          now: now.toISOString(),
          endDate: endDate.toISOString(),
          isExpired: isCurrentlyExpired
        });
      };

      const timer = setInterval(checkExpiration, 60000); // Check every minute
      checkExpiration(); // Initial check

      return () => clearInterval(timer);
    }
  }, [hasActivePlan, activePlanDetails]);

  // Show loading state while checking plan status
  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading mining plan status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Only show active plan if wallet is connected and has an active plan
  if (isConnected && hasActivePlan && activePlanDetails) {
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
            planType={activePlanDetails.planType}
            onReset={handleResetPlan}
            isExpired={isExpired}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-6 w-6 text-primary animate-pulse" />
          Mining Plans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 mb-6">
          <Button
            variant={selectedPlan === 'daily' ? 'default' : 'outline'}
            onClick={() => setSelectedPlan('daily')}
            className="flex-1"
          >
            <Cpu className="mr-2 h-4 w-4" />
            Daily Plan
          </Button>
          <Button
            variant={selectedPlan === 'weekly' ? 'default' : 'outline'}
            onClick={() => setSelectedPlan('weekly')}
            className="flex-1"
          >
            <Server className="mr-2 h-4 w-4" />
            Weekly Plan
          </Button>
        </div>

        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            {selectedPlan} Mining Plan Details
          </h3>
          <div className="grid gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Your USDT Balance</p>
              <p className="text-2xl font-bold">{getBalanceDisplay()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Investment Required</p>
              <p className="text-2xl font-bold">{currentPlan.displayAmount} USDT</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Reward</p>
              <p className="text-2xl font-bold text-primary">
                {dailyRewardCPXTB} CPXTB
                <span className="text-sm text-muted-foreground ml-2">
                  (≈${currentPlan.rewardUSD})
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-2xl font-bold">{currentPlan.duration}</p>
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
          </div>

          {isConnected && (
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleTransfer}
              disabled={isTransferring || isValidating || isSwitchingNetwork}
            >
              <Coins className="mr-2 h-4 w-4" />
              {isSwitchingNetwork ? "Switching Network..." :
                isTransferring ? "Transferring USDT..." :
                  isValidating ? "Validating Transaction..." :
                    `Activate ${selectedPlan} Plan (${currentPlan.displayAmount} USDT)`}
            </Button>
          )}

          {transactionHash && (
            <TransactionStatus
              hash={transactionHash}
              isValidating={isValidating}
              isConfirmed={isConfirmed}
            />
          )}
        </div>
        <div className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Need help? Contact our support team
          </p>
          <TelegramSupport />
        </div>
      </CardContent>
    </Card>
  );
}